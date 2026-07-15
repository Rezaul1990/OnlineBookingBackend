import { Router } from "express";
import { getPublicCatalog } from "../controllers/catalog.controller.js";

const router = Router();

router.get("/", getPublicCatalog);

export default router;
