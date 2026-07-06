import { Router } from "express";
import { getDashboard } from "../controllers/admin.controller.js";
import { getUsers, patchUser, postUser } from "../controllers/user.controller.js";
import { getPermissions, getRoles, patchRole, postRole, removeRole } from "../controllers/role.controller.js";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { roleSchema } from "../validations/role.validation.js";
import { createUserSchema, updateUserSchema } from "../validations/user.validation.js";

const router = Router();

router.use(requireAuth);

router.get("/dashboard", requirePermission("dashboard.view"), getDashboard);
router.get("/permissions", requirePermission("roles.view"), getPermissions);

router.get("/roles", requirePermission("roles.view"), getRoles);
router.post("/roles", requirePermission("roles.create"), validate(roleSchema), postRole);
router.patch("/roles/:id", requirePermission("roles.update"), validate(roleSchema), patchRole);
router.delete("/roles/:id", requirePermission("roles.delete"), removeRole);

router.get("/users", requirePermission("staff.view"), getUsers);
router.post("/users", requirePermission("staff.create"), validate(createUserSchema), postUser);
router.patch("/users/:id", requirePermission("staff.update"), validate(updateUserSchema), patchUser);

export default router;
