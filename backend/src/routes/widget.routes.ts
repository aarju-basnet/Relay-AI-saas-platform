import { Router } from "express";

import { verifyRelayApiKey } from "@/middleware/verifyRelayApiKey";
import { createAnalyticsEvent } from "@/controllers/analytics.controller";
import { sendWidgetChatMessage, verifyWidgetKey } from "@/controllers/widget.controller";

const router = Router();

/*
 * Public Widget Endpoints
 *
 * Used by:
 * Relay Widget SDK
 *
 * Authentication:
 * X-Relay-Key
 */

router.post("/events", verifyRelayApiKey, createAnalyticsEvent);
router.post("/chat", verifyRelayApiKey, sendWidgetChatMessage);
router.post("/verify", verifyRelayApiKey, verifyWidgetKey);

export default router;