import { Router } from "express";
import { successResponse } from "../utils/apiResponse.js";

const router = Router();

router.get("/", (req, res) => {
  return successResponse(res, {
    message: "OnlineBooking API is healthy",
    data: {
      status: "ok",
      timestamp: new Date().toISOString()
    }
  });
});

export default router;
