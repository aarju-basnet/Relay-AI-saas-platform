import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getDashboardOverview } from "../controllers/dashboard.controller";

const router = Router();

router.get(
  "/overview",
  requireAuth,
  getDashboardOverview
);

export default router;