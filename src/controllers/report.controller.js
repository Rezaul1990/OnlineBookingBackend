import { getBookingReport } from "../services/report.service.js";
import { successResponse } from "../utils/apiResponse.js";

export const getBookingReports = async (req, res, next) => {
  try {
    const report = await getBookingReport(req.query);
    return successResponse(res, {
      message: "Booking report retrieved successfully",
      data: { report }
    });
  } catch (error) {
    return next(error);
  }
};
