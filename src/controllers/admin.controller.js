import { Booking } from "../models/booking.model.js";
import { User } from "../models/user.model.js";
import { Role } from "../models/role.model.js";
import { successResponse } from "../utils/apiResponse.js";
import { ensureDatabaseReady } from "../utils/databaseReady.js";

const startOfDay = (date = new Date()) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const endOfDay = (date = new Date()) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

const addDays = (date, days) => {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
};

const getWeekRange = () => {
  const today = startOfDay();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = addDays(today, mondayOffset);
  return { start, end: endOfDay(addDays(start, 6)) };
};

const getMonthRange = () => {
  const today = new Date();
  return {
    start: new Date(today.getFullYear(), today.getMonth(), 1),
    end: endOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 0))
  };
};

const countInRange = (start, end) => Booking.countDocuments({ bookingDate: { $gte: start, $lte: end } });

export const getDashboard = async (req, res, next) => {
  try {
    ensureDatabaseReady();

    const today = startOfDay();
    const tomorrow = startOfDay(addDays(today, 1));
    const thisWeek = getWeekRange();
    const thisMonth = getMonthRange();

    const [
      bookingCount,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      todayBookings,
      tomorrowBookings,
      thisWeekBookings,
      thisMonthBookings,
      recentBookings,
      statusCounts,
      userCount,
      roleCount
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: "pending_call" }),
      Booking.countDocuments({ status: "confirmed" }),
      Booking.countDocuments({ status: "completed" }),
      Booking.countDocuments({ status: "cancelled" }),
      countInRange(today, endOfDay(today)),
      countInRange(tomorrow, endOfDay(tomorrow)),
      countInRange(thisWeek.start, thisWeek.end),
      countInRange(thisMonth.start, thisMonth.end),
      Booking.find().sort({ bookingDate: -1, createdAt: -1 }).limit(6).lean(),
      Booking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      User.countDocuments(),
      Role.countDocuments()
    ]);

    const byStatus = Object.fromEntries(statusCounts.map((item) => [item._id, item.count]));

    return successResponse(res, {
      message: "Dashboard retrieved successfully",
      data: {
        stats: {
          bookingCount,
          pendingBookings,
          confirmedBookings,
          completedBookings,
          cancelledBookings,
          todayBookings,
          tomorrowBookings,
          thisWeekBookings,
          thisMonthBookings,
          byStatus,
          recentBookings,
          userCount,
          roleCount
        }
      }
    });
  } catch (error) {
    return next(error);
  }
};
