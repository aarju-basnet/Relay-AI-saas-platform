import { Router } from "express";

import { requireAuth } from "@/middleware/auth";

import {
  getDashboardAnalytics,
  getAnalyticsTimeline,
  
} from "@/controllers/dashboardAnalytics.controller";

import {
  getAnalyticsAISummary,
} from "@/controllers/analyticsSummary.controller";

const router = Router();

router.get(
  "/:organizationId",
  requireAuth,
  getDashboardAnalytics
);

router.get(
  "/:organizationId/timeline",
  requireAuth,
  getAnalyticsTimeline
);

router.get(
  "/:organizationId/ai-summary",
  requireAuth,
  getAnalyticsAISummary
);

export default router;