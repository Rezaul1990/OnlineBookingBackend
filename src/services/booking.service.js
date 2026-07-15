import { Booking } from "../models/booking.model.js";
import { AppError } from "../utils/AppError.js";
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

export const createBooking = async (payload) => {
  const bookingPayload = {
    ...payload,
    publicToken: crypto.randomBytes(24).toString("hex")
  };
  if (!isDatabaseReady()) return createEphemeralBooking(bookingPayload);
  return Booking.create(bookingPayload);
};

export const updateBookingStatus = async (bookingId, status) => {
  const allowedStatuses = ["pending_call", "confirmed", "reschedule_requested", "cancelled", "completed", "no_show"];
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
