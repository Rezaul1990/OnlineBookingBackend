import { Router } from "express";
import { patchPublicBookingStatus, postBooking } from "../controllers/booking.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createBookingSchema, publicBookingStatusSchema } from "../validations/booking.validation.js";

const router = Router();

router.post("/", validate(createBookingSchema), postBooking);
router.patch("/:id/status", validate(publicBookingStatusSchema), patchPublicBookingStatus);

export default router;
