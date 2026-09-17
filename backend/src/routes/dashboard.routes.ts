import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getDashboardOverview } from "../controllers/dashboard.controller";
import { getAssistantUsage } from "@/controllers/analyticsUsage.controller";

const router = Router();

router.get(
  "/:organizationId/overview",
  requireAuth,
  getDashboardOverview
);

router.get("/:organizationId/usage", requireAuth, getAssistantUsage);

export default router;