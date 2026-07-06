import { Booking } from "../models/booking.model.js";
import { User } from "../models/user.model.js";
import { Role } from "../models/role.model.js";
import { successResponse } from "../utils/apiResponse.js";
import { ensureDatabaseReady } from "../utils/databaseReady.js";

export const getDashboard = async (req, res, next) => {
  try {
    ensureDatabaseReady();

    const [bookingCount, pendingBookings, userCount, roleCount] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: "pending" }),
      User.countDocuments(),
      Role.countDocuments()
    ]);

    return successResponse(res, {
      message: "Dashboard retrieved successfully",
      data: {
        stats: {
          bookingCount,
          pendingBookings,
          userCount,
          roleCount
        }
      }
    });
  } catch (error) {
    return next(error);
  }
};
