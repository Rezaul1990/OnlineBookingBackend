import { createBooking, listBookings, removeBooking, updateBooking, updateBookingStatus, updatePublicBookingStatus } from "../services/booking.service.js";
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

export const getAdminBookings = async (req, res, next) => {
  try {
    const bookings = await listBookings();
    return successResponse(res, {
      message: "Admin bookings retrieved successfully",
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

export const patchBookingStatus = async (req, res, next) => {
  try {
    const booking = await updateBookingStatus(req.params.id, req.body.status);
    return successResponse(res, {
      message: "Booking status updated successfully",
      data: { booking }
    });
  } catch (error) {
    return next(error);
  }
};

export const patchBooking = async (req, res, next) => {
  try {
    const booking = await updateBooking(req.params.id, req.body);
    return successResponse(res, {
      message: "Booking updated successfully",
      data: { booking }
    });
  } catch (error) {
    return next(error);
  }
};

export const patchPublicBookingStatus = async (req, res, next) => {
  try {
    const booking = await updatePublicBookingStatus(req.params.id, req.body.status, req.body.publicToken);
    return successResponse(res, {
      message: "Booking status updated successfully",
      data: { booking }
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteBooking = async (req, res, next) => {
  try {
    const booking = await removeBooking(req.params.id);
    return successResponse(res, {
      message: "Booking deleted successfully",
      data: { booking }
    });
  } catch (error) {
    return next(error);
  }
};
