import { Booking } from "../models/booking.model.js";
import { Provider } from "../models/service.model.js";
import { AppError } from "../utils/AppError.js";
import { isFutureSlotTime } from "../utils/date.js";
import crypto from "node:crypto";
import mongoose from "mongoose";

const isDatabaseReady = () => mongoose.connection.readyState === 1;

const createEphemeralBooking = (payload) => ({
  _id: `local-${Date.now()}`,
  ...payload,
  publicToken: payload.publicToken || crypto.randomBytes(24).toString("hex"),
  status: payload.status || "pending_call",
  paymentMethod: payload.paymentMethod || "cash",
  paymentStatus: payload.paymentStatus || "unpaid",
  paymentAmount: payload.paymentAmount || 0,
  paidAmount: payload.paidAmount || 0,
  balanceAmount: payload.balanceAmount || 0,
  timeline: payload.timeline || [],
  createdAt: new Date(),
  updatedAt: new Date()
});

const actorFromAuth = (actor) => ({
  actorName: actor?.name || "Customer",
  actorRole: actor?.role?.name || actor?.role?.slug || "customer"
});

const timelineEntry = (action, label, actor, note = "") => ({
  action,
  label,
  ...actorFromAuth(actor),
  note,
  at: new Date()
});

const normalizePayment = (payload) => {
  const cancelled = ["cancelled", "no_show"].includes(payload.status);
  const paymentAmount = cancelled ? 0 : Math.max(Number(payload.paymentAmount || 0), 0);
  const paidAmount = cancelled ? 0 : Math.min(Math.max(Number(payload.paidAmount || 0), 0), paymentAmount);
  const balanceAmount = Math.max(paymentAmount - paidAmount, 0);
  let paymentStatus = payload.paymentStatus || "unpaid";

  if (cancelled) paymentStatus = "waived";
  else if (paidAmount >= paymentAmount && paymentAmount > 0) paymentStatus = "paid";
  else if (paidAmount > 0) paymentStatus = "partial";
  else paymentStatus = "unpaid";

  return {
    paymentMethod: payload.paymentMethod || "cash",
    paymentStatus,
    paymentAmount,
    paidAmount,
    balanceAmount
  };
};

export const listBookings = async () => {
  if (!isDatabaseReady()) return [];
  return Booking.find().sort({ bookingDate: 1, createdAt: -1 }).limit(50);
};

const allowedStatuses = ["pending_call", "confirmed", "reschedule_requested", "cancelled", "completed", "no_show"];

const toEndOfDay = (value) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const normalizeListFilters = (query = {}) => ({
  search: String(query.search || "").trim(),
  dateFrom: String(query.dateFrom || "").trim(),
  dateTo: String(query.dateTo || "").trim(),
  status: String(query.status || "all").trim(),
  clientType: String(query.clientType || "all").trim(),
  serviceName: String(query.serviceName || "").trim(),
  providerName: String(query.providerName || "").trim(),
  sort: String(query.sort || "bookingDate_desc").trim(),
  page: Math.max(Number(query.page) || 1, 1),
  pageSize: Math.min(Math.max(Number(query.pageSize) || 25, 5), 100)
});

const buildBookingMatch = (filters) => {
  const match = {};

  if (filters.dateFrom || filters.dateTo) {
    match.bookingDate = {};
    if (filters.dateFrom) match.bookingDate.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) match.bookingDate.$lte = toEndOfDay(filters.dateTo);
  }

  if (allowedStatuses.includes(filters.status)) {
    match.status = filters.status;
  }

  if (["new", "returning"].includes(filters.clientType)) {
    match.clientType = filters.clientType;
  }

  if (filters.serviceName) {
    match.serviceName = { $regex: filters.serviceName, $options: "i" };
  }

  if (filters.providerName) {
    match.providerName = { $regex: filters.providerName, $options: "i" };
  }

  if (filters.search) {
    const search = { $regex: filters.search, $options: "i" };
    match.$or = [
      { customerName: search },
      { email: search },
      { phone: search },
      { serviceName: search },
      { providerName: search },
      { slotLabel: search },
      { notes: search }
    ];
  }

  return match;
};

const getSort = (sort) => {
  const sortMap = {
    bookingDate_asc: { bookingDate: 1, createdAt: -1 },
    bookingDate_desc: { bookingDate: -1, createdAt: -1 },
    customerName_asc: { customerName: 1, bookingDate: -1 },
    status_asc: { status: 1, bookingDate: -1 },
    newest: { createdAt: -1 }
  };

  return sortMap[sort] || sortMap.bookingDate_desc;
};

export const listAdminBookings = async (query = {}) => {
  const filters = normalizeListFilters(query);
  if (!isDatabaseReady()) {
    return {
      bookings: [],
      filters,
      pagination: { page: filters.page, pageSize: filters.pageSize, total: 0, totalPages: 1 },
      summary: { total: 0, matchingTotal: 0, pendingCall: 0, confirmed: 0, completed: 0, cancelled: 0 },
      filterOptions: { services: [], providers: [] }
    };
  }

  const match = buildBookingMatch(filters);
  const skip = (filters.page - 1) * filters.pageSize;
  const [bookings, total, statusCounts, services, providers] = await Promise.all([
    Booking.find(match).sort(getSort(filters.sort)).skip(skip).limit(filters.pageSize).lean(),
    Booking.countDocuments(match),
    Booking.aggregate([{ $match: match }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Booking.distinct("serviceName"),
    Booking.distinct("providerName")
  ]);

  const counts = Object.fromEntries(statusCounts.map((item) => [item._id, item.count]));

  return {
    bookings,
    filters,
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / filters.pageSize), 1)
    },
    summary: {
      total,
      matchingTotal: total,
      pendingCall: counts.pending_call || 0,
      confirmed: counts.confirmed || 0,
      completed: counts.completed || 0,
      cancelled: counts.cancelled || 0
    },
    filterOptions: {
      services: services.filter(Boolean).sort((first, second) => first.localeCompare(second)),
      providers: providers.filter(Boolean).sort((first, second) => first.localeCompare(second))
    }
  };
};

export const createBooking = async (payload, actor = null) => {
  const bookingPayload = {
    ...payload,
    ...normalizePayment({ ...payload, paidAmount: payload.paidAmount || 0, status: payload.status || "pending_call" }),
    timeline: [timelineEntry("created", "Booking request created", actor, `Payment method: ${payload.paymentMethod || "cash"}`)],
    publicToken: crypto.randomBytes(24).toString("hex")
  };
  if (!isDatabaseReady()) return createEphemeralBooking(bookingPayload);

  const provider = await Provider.findById(payload.providerId);
  const slot = provider?.slots.id(payload.slotId);
  if (!provider || !slot || !slot.active) {
    throw new AppError("Selected time slot is no longer available.", 409);
  }
  if ((provider.closedDates || []).some((closedDate) => closedDate.date === slot.date)) {
    throw new AppError("This provider is closed on the selected date. Please choose another slot.", 409);
  }
  if (!isFutureSlotTime(slot.date, slot.startTime)) {
    throw new AppError("Please select a current or future time slot.", 400);
  }

  const blockingStatuses = ["pending_call", "confirmed"];
  const existingBookings = await Booking.countDocuments({ slotId: String(slot._id), status: { $in: blockingStatuses } });
  if (existingBookings >= slot.capacity) {
    throw new AppError("This time slot is already booked. Please choose another slot.", 409);
  }

  return Booking.create(bookingPayload);
};

export const updateBookingStatus = async (bookingId, status, actor = null) => {
  if (!allowedStatuses.includes(status)) {
    throw new AppError("Invalid booking status.", 400);
  }

  if (!isDatabaseReady() || bookingId.startsWith("local-")) {
    return createEphemeralBooking({ _id: bookingId, status, ...normalizePayment({ status }) });
  }

  const existing = await Booking.findById(bookingId);
  if (!existing) throw new AppError("Booking not found.", 404);

  existing.status = status;
  existing.set(normalizePayment({ ...existing.toObject(), status }));
  existing.timeline.push(timelineEntry("status_updated", `Status changed to ${status.replaceAll("_", " ")}`, actor));
  const booking = await existing.save();
  if (!booking) throw new AppError("Booking not found.", 404);
  return booking;
};

export const updateBooking = async (bookingId, payload, actor = null) => {
  if (!isDatabaseReady() || bookingId.startsWith("local-")) {
    return createEphemeralBooking({ _id: bookingId, ...payload, ...normalizePayment(payload) });
  }

  const update = { ...payload, ...normalizePayment(payload) };
  delete update.timeline;
  delete update.publicToken;
  const booking = await Booking.findByIdAndUpdate(
    bookingId,
    { ...update, $push: { timeline: timelineEntry("edited", "Booking details updated", actor, "Admin edited booking details or payment.") } },
    { new: true, runValidators: true }
  );
  if (!booking) throw new AppError("Booking not found.", 404);
  return booking;
};

export const removeBooking = async (bookingId) => {
  if (!isDatabaseReady() || bookingId.startsWith("local-")) {
    return { _id: bookingId };
  }

  const booking = await Booking.findByIdAndDelete(bookingId);
  if (!booking) throw new AppError("Booking not found.", 404);
  return booking;
};

export const updatePublicBookingStatus = async (bookingId, status, publicToken) => {
  const allowedStatuses = ["reschedule_requested", "cancelled"];
  if (!allowedStatuses.includes(status)) {
    throw new AppError("This booking action is not allowed from the public page.", 403);
  }

  if (!isDatabaseReady() || bookingId.startsWith("local-")) {
    return createEphemeralBooking({ _id: bookingId, status, publicToken, ...normalizePayment({ status }) });
  }

  const booking = await Booking.findOne({ _id: bookingId, publicToken }).select("+publicToken");
  if (!booking) throw new AppError("Booking not found or token is invalid.", 404);
  booking.status = status;
  booking.set(normalizePayment({ ...booking.toObject(), status }));
  booking.timeline.push(timelineEntry("public_status_updated", `Customer requested ${status.replaceAll("_", " ")}`, null));
  await booking.save();
  return booking;
};
