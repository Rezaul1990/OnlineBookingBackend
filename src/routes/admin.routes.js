import { Router } from "express";
import { getDashboard } from "../controllers/admin.controller.js";
import {
  deleteBooking,
  getAdminBookings,
  patchBooking,
  patchBookingStatus
} from "../controllers/booking.controller.js";
import {
  deleteProvider,
  deleteService,
  deleteSlot,
  getAdminCatalog,
  patchProvider,
  patchService,
  patchSlot,
  postProvider,
  postService,
  postSlot,
  uploadProviderImage,
  uploadServiceImage
} from "../controllers/catalog.controller.js";
import { getUsers, patchUser, postUser } from "../controllers/user.controller.js";
import { getPermissions, getRoles, patchRole, postRole, removeRole } from "../controllers/role.controller.js";
import { getBookingReports } from "../controllers/report.controller.js";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware.js";
import { uploadImage } from "../middlewares/upload.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { roleSchema } from "../validations/role.validation.js";
import { providerSchema, serviceSchema, slotSchema } from "../validations/catalog.validation.js";
import { adminBookingSchema, bookingStatusSchema } from "../validations/booking.validation.js";
import { createUserSchema, updateUserSchema } from "../validations/user.validation.js";

const router = Router();

router.use(requireAuth);

router.get("/dashboard", requirePermission("dashboard.view"), getDashboard);
router.get("/permissions", requirePermission("roles.view"), getPermissions);
router.get("/reports/bookings", requirePermission("reports.view"), getBookingReports);

router.get("/bookings", requirePermission("bookings.view"), getAdminBookings);
router.patch("/bookings/:id", requirePermission("bookings.update"), validate(adminBookingSchema), patchBooking);
router.patch("/bookings/:id/status", requirePermission("bookings.manage"), validate(bookingStatusSchema), patchBookingStatus);
router.delete("/bookings/:id", requirePermission("bookings.delete"), deleteBooking);

router.get("/catalog", requirePermission("services.view"), getAdminCatalog);
router.post("/services", requirePermission("services.create"), validate(serviceSchema), postService);
router.patch("/services/:serviceId", requirePermission("services.update"), validate(serviceSchema), patchService);
router.delete("/services/:serviceId", requirePermission("services.delete"), deleteService);
router.post("/services/:serviceId/providers", requirePermission("providers.create"), validate(providerSchema), postProvider);
router.patch("/services/:serviceId/providers/:providerId", requirePermission("providers.update"), validate(providerSchema), patchProvider);
router.delete("/services/:serviceId/providers/:providerId", requirePermission("providers.delete"), deleteProvider);
router.post("/services/:serviceId/providers/:providerId/slots", requirePermission("availability.create"), validate(slotSchema), postSlot);
router.patch("/services/:serviceId/providers/:providerId/slots/:slotId", requirePermission("availability.update"), validate(slotSchema), patchSlot);
router.delete("/services/:serviceId/providers/:providerId/slots/:slotId", requirePermission("availability.delete"), deleteSlot);
router.post("/services/:serviceId/image", requirePermission("services.update"), uploadImage.single("image"), uploadServiceImage);
router.post("/services/:serviceId/providers/:providerId/image", requirePermission("providers.update"), uploadImage.single("image"), uploadProviderImage);

router.get("/roles", requirePermission("roles.view"), getRoles);
router.post("/roles", requirePermission("roles.create"), validate(roleSchema), postRole);
router.patch("/roles/:id", requirePermission("roles.update"), validate(roleSchema), patchRole);
router.delete("/roles/:id", requirePermission("roles.delete"), removeRole);

router.get("/users", requirePermission("staff.view"), getUsers);
router.post("/users", requirePermission("staff.create"), validate(createUserSchema), postUser);
router.patch("/users/:id", requirePermission("staff.update"), validate(updateUserSchema), patchUser);

export default router;
