import { Router } from "express";
import adminRoutes from "./admin.routes.js";
import authRoutes from "./auth.routes.js";
import bookingRoutes from "./booking.routes.js";
import catalogRoutes from "./catalog.routes.js";
import healthRoutes from "./health.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/bookings", bookingRoutes);
router.use("/catalog", catalogRoutes);

export default router;
