import { Router } from "express";
import { getBookings, postBooking } from "../controllers/booking.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createBookingSchema } from "../validations/booking.validation.js";

const router = Router();

router.get("/", getBookings);
router.post("/", validate(createBookingSchema), postBooking);

export default router;
