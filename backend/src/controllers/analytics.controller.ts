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

    const organizationId = req.organization.id;

    // Check BEFORE creating the new event, so this only ever fires once -
    // on the very first analytics event this organization has ever received.
    const hadPriorEvents = await prisma.analyticsEvent.findFirst({
      where: { organizationId },
      select: { id: true },
    });

    const analyticsEvent = await prisma.analyticsEvent.create({
  data: {
    organizationId,
    visitorId,
    sessionId,
    event,
    page,
    metadata,
    keySource: req.apiKeyType ?? "ANALYTICS",
  },
});

    if (!hadPriorEvents) {
      // Don't let this block the widget's response - the visitor's event
      // was already recorded successfully either way.
      prisma.organization
        .update({
          where: { id: organizationId },
          data: { analyticsLive: true },
        })
        .catch((err) =>
          console.error("Failed to flip analyticsLive:", err)
        );
    }

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