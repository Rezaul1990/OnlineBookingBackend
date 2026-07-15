import { Router } from "express";
import { login, logout, me } from "../controllers/auth.controller.js";
import { setupPassword } from "../controllers/user.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { loginSchema } from "../validations/auth.validation.js";
import { setupPasswordSchema } from "../validations/user.validation.js";

const router = Router();

router.post("/login", validate(loginSchema), login);
router.post("/setup-password", validate(setupPasswordSchema), setupPassword);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

export default router;
