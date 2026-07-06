import { Router } from "express";
import bookingRoutes from "./booking.routes.js";
import healthRoutes from "./health.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/bookings", bookingRoutes);

export default router;
