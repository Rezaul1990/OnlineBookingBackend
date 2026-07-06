import { createBooking, listBookings } from "../services/booking.service.js";
import { successResponse } from "../utils/apiResponse.js";

export const getBookings = async (req, res, next) => {
  try {
    const bookings = await listBookings();
    return successResponse(res, {
      message: "Bookings retrieved successfully",
      data: { bookings }
    });
  } catch (error) {
    return next(error);
  }
};

export const postBooking = async (req, res, next) => {
  try {
    const booking = await createBooking(req.body);
    return successResponse(res, {
      statusCode: 201,
      message: "Booking created successfully",
      data: { booking }
    });
  } catch (error) {
    return next(error);
  }
};
