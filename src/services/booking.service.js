import { Booking } from "../models/booking.model.js";

export const listBookings = async () => {
  return Booking.find().sort({ bookingDate: 1, createdAt: -1 }).limit(50);
};

export const createBooking = async (payload) => {
  return Booking.create(payload);
};
