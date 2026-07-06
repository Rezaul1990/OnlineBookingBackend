import { Booking } from "../models/booking.model.js";
import { ensureDatabaseReady } from "../utils/databaseReady.js";

export const listBookings = async () => {
  ensureDatabaseReady();
  return Booking.find().sort({ bookingDate: 1, createdAt: -1 }).limit(50);
};

export const createBooking = async (payload) => {
  ensureDatabaseReady();
  return Booking.create(payload);
};
