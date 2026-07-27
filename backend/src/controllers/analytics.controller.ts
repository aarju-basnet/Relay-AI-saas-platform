import { Response } from "express";

import { prisma } from "@/config/postgres";

import { RelayRequest } from "@/middleware/verifyRelayApiKey";

export async function createAnalyticsEvent(
  req: RelayRequest,
  res: Response
) {
  try {
    const {
      visitorId,
      sessionId,
      event,
      page,
      metadata,
    } = req.body;

    if (
      !visitorId ||
      !sessionId ||
      !event
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields.",
      });
    }

    const organizationId = req.organizationId;

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "Organization not found.",
      });
    }

    const analyticsEvent =
      await prisma.analyticsEvent.create({
        data: {
          organizationId,
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