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
  createdAt: new Date(),
  updatedAt: new Date()
});

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
  sort: String(query.sort || "bookingDate_desc").trim()
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
      summary: { total: 0, pendingCall: 0, confirmed: 0, completed: 0, cancelled: 0 },
      filterOptions: { services: [], providers: [] }
    };
  }

  const match = buildBookingMatch(filters);
  const [bookings, statusCounts, services, providers] = await Promise.all([
    Booking.find(match).sort(getSort(filters.sort)).limit(300).lean(),
    Booking.aggregate([{ $match: match }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Booking.distinct("serviceName"),
    Booking.distinct("providerName")
  ]);

  const counts = Object.fromEntries(statusCounts.map((item) => [item._id, item.count]));

  return {
    bookings,
    filters,
    summary: {
      total: bookings.length,
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

export const createBooking = async (payload) => {
  const bookingPayload = {
    ...payload,
    publicToken: crypto.randomBytes(24).toString("hex")
  };
  if (!isDatabaseReady()) return createEphemeralBooking(bookingPayload);

  const provider = await Provider.findById(payload.providerId);
  const slot = provider?.slots.id(payload.slotId);
  if (!provider || !slot || !slot.active) {
    throw new AppError("Selected time slot is no longer available.", 409);
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

export const updateBookingStatus = async (bookingId, status) => {
  if (!allowedStatuses.includes(status)) {
    throw new AppError("Invalid booking status.", 400);
  }

  if (!isDatabaseReady() || bookingId.startsWith("local-")) {
    return createEphemeralBooking({ _id: bookingId, status });
  }

  const booking = await Booking.findByIdAndUpdate(bookingId, { status }, { new: true, runValidators: true });
  if (!booking) throw new AppError("Booking not found.", 404);
  return booking;
};

export const updateBooking = async (bookingId, payload) => {
  if (!isDatabaseReady() || bookingId.startsWith("local-")) {
    return createEphemeralBooking({ _id: bookingId, ...payload });
  }

  const booking = await Booking.findByIdAndUpdate(bookingId, payload, { new: true, runValidators: true });
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
    return createEphemeralBooking({ _id: bookingId, status, publicToken });
  }

  const booking = await Booking.findOneAndUpdate({ _id: bookingId, publicToken }, { status }, { new: true, runValidators: true }).select("+publicToken");
  if (!booking) throw new AppError("Booking not found or token is invalid.", 404);
  return booking;
};
