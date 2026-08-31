import { Response } from "express";
import { AnalyticsEventType } from "@prisma/client";

import { prisma } from "@/config/postgres";
import { RelayRequest } from "@/middleware/verifyRelayApiKey";

export async function createAnalyticsEvent(
  req: RelayRequest,
  res: Response
) {
  try {
    const { visitorId, sessionId, event, page, metadata } = req.body;

    if (!visitorId || !sessionId || !event) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields.",
      });
    }

    if (!Object.values(AnalyticsEventType).includes(event)) {
      return res.status(400).json({
        success: false,
        message: `Invalid event type: ${event}`,
      });
    }

    if (!req.organization) {
      return res.status(401).json({
        success: false,
        message: "Organization not found.",
      });
    }

    const analyticsEvent = await prisma.analyticsEvent.create({
      data: {
        organizationId: req.organization.id,
        visitorId,
        sessionId,
        event,
        page,
        metadata,
      },
    });

    return res.status(201).json({
      success: true,
      data: analyticsEvent,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create analytics event.",
    });
  }
}