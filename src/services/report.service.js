import mongoose from "mongoose";
import { Booking } from "../models/booking.model.js";

const statuses = ["pending_call", "confirmed", "reschedule_requested", "cancelled", "completed", "no_show"];

const emptyReport = (filters) => ({
  filters,
  summary: {
    totalBookings: 0,
    pendingCall: 0,
    confirmed: 0,
    rescheduleRequested: 0,
    cancelled: 0,
    completed: 0,
    noShow: 0,
    cancellationRate: 0,
    completionRate: 0,
    noShowRate: 0
  },
  byStatus: statuses.map((status) => ({ status, count: 0 })),
  byService: [],
  byProvider: [],
  byClientType: [],
  dailyCounts: [],
  filterOptions: {
    services: [],
    providers: []
  },
  bookings: []
});

const toEndOfDay = (value) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const percent = (count, total) => (total > 0 ? Math.round((count / total) * 1000) / 10 : 0);

const normalizeFilters = (query = {}) => ({
  dateFrom: query.dateFrom || "",
  dateTo: query.dateTo || "",
  status: query.status || "all",
  serviceName: query.serviceName || "",
  providerName: query.providerName || "",
  clientType: query.clientType || "all"
});

const buildMatch = (filters) => {
  const match = {};

  if (filters.dateFrom || filters.dateTo) {
    match.bookingDate = {};
    if (filters.dateFrom) match.bookingDate.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) match.bookingDate.$lte = toEndOfDay(filters.dateTo);
  }

  if (statuses.includes(filters.status)) {
    match.status = filters.status;
  }

  if (["new", "returning"].includes(filters.clientType)) {
    match.clientType = filters.clientType;
  }

  if (filters.serviceName) {
    match.serviceName = { $regex: filters.serviceName.trim(), $options: "i" };
  }

  if (filters.providerName) {
    match.providerName = { $regex: filters.providerName.trim(), $options: "i" };
  }

  return match;
};

const groupByName = (bookings, key) => {
  const grouped = bookings.reduce((acc, booking) => {
    const name = booking[key] || "Unassigned";
    if (!acc[name]) {
      acc[name] = { name, count: 0, confirmed: 0, cancelled: 0, completed: 0, noShow: 0 };
    }

    acc[name].count += 1;
    if (booking.status === "confirmed") acc[name].confirmed += 1;
    if (booking.status === "cancelled") acc[name].cancelled += 1;
    if (booking.status === "completed") acc[name].completed += 1;
    if (booking.status === "no_show") acc[name].noShow += 1;
    return acc;
  }, {});

  return Object.values(grouped)
    .sort((first, second) => second.count - first.count)
    .slice(0, 12);
};

const groupByClientType = (bookings) => {
  const grouped = bookings.reduce((acc, booking) => {
    const type = booking.clientType || "new";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(grouped).map(([clientType, count]) => ({ clientType, count }));
};

const groupByDay = (bookings) => {
  const grouped = bookings.reduce((acc, booking) => {
    const day = new Date(booking.bookingDate).toISOString().slice(0, 10);
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([date, count]) => ({ date, count }))
    .sort((first, second) => first.date.localeCompare(second.date));
};

export const getBookingReport = async (query) => {
  const filters = normalizeFilters(query);
  if (mongoose.connection.readyState !== 1) return emptyReport(filters);

  const [bookings, services, providers] = await Promise.all([
    Booking.find(buildMatch(filters))
      .sort({ bookingDate: -1, createdAt: -1 })
      .limit(500)
      .lean(),
    Booking.distinct("serviceName"),
    Booking.distinct("providerName")
  ]);

  const counts = statuses.reduce((acc, status) => {
    acc[status] = bookings.filter((booking) => booking.status === status).length;
    return acc;
  }, {});

  const totalBookings = bookings.length;

  return {
    filters,
    summary: {
      totalBookings,
      pendingCall: counts.pending_call,
      confirmed: counts.confirmed,
      rescheduleRequested: counts.reschedule_requested,
      cancelled: counts.cancelled,
      completed: counts.completed,
      noShow: counts.no_show,
      cancellationRate: percent(counts.cancelled, totalBookings),
      completionRate: percent(counts.completed, totalBookings),
      noShowRate: percent(counts.no_show, totalBookings)
    },
    byStatus: statuses.map((status) => ({ status, count: counts[status] })),
    byService: groupByName(bookings, "serviceName"),
    byProvider: groupByName(bookings, "providerName"),
    byClientType: groupByClientType(bookings),
    dailyCounts: groupByDay(bookings),
    filterOptions: {
      services: services.filter(Boolean).sort((first, second) => first.localeCompare(second)),
      providers: providers.filter(Boolean).sort((first, second) => first.localeCompare(second))
    },
    bookings
  };
};
