import { Booking } from "../models/booking.model.js";
import { AppError } from "../utils/AppError.js";

const ensureDatabaseReady = () => {
  if (Booking.db.readyState !== 1) {
    throw new AppError("Database is not configured. Set MONGODB_URI in backend/.env.", 503);
  }
};

export const listBookings = async () => {
  ensureDatabaseReady();
  return Booking.find().sort({ bookingDate: 1, createdAt: -1 }).limit(50);
};

export const createBooking = async (payload) => {
  ensureDatabaseReady();
  return Booking.create(payload);
};
