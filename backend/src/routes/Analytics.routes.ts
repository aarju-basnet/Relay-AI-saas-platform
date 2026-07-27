import { Router } from "express";

import { createAnalyticsEvent } from "@/controllers/analytics.controller";

import { verifyRelayApiKey } from "@/middleware/verifyRelayApiKey";

const router = Router();

/*
POST
/api/analytics/event
*/
router.post(
  "/event",
  verifyRelayApiKey,
  createAnalyticsEvent
);

export default router;