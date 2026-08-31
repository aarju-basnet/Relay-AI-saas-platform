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
  "/",
  requireAuth,
  getDashboardAnalytics
);

router.get(
  "/timeline",
  requireAuth,
  getAnalyticsTimeline
);

router.get(
  "/ai-summary",
  requireAuth,
  getAnalyticsAISummary
);

export default router;