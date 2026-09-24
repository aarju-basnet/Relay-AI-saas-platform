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

    let finalMetadata = metadata;

    if (event === "CUSTOM") {
      const eventName = metadata?.eventName;

      if (typeof eventName !== "string" || !eventName.trim()) {
        return res.status(400).json({
          success: false,
          message: "metadata.eventName is required for CUSTOM events.",
        });
      }

      if (eventName.length > 64) {
        return res.status(400).json({
          success: false,
          message: "eventName must be 64 characters or fewer.",
        });
      }

      finalMetadata = { ...metadata, eventName: eventName.trim().toLowerCase() };
    }

    if (!req.organization) {
      return res.status(401).json({
        success: false,
        message: "Organization not found.",
      });
    }

    const organizationId = req.organization.id;

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
        metadata: finalMetadata,
        keySource: req.apiKeyType ?? "ANALYTICS",
      },
    });

    if (!hadPriorEvents) {
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