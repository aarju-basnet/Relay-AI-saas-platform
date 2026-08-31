import { Response } from "express";

import { prisma } from "@/config/postgres";
import { AuthRequest } from "@/middleware/auth";
import { getCurrentMembership } from "@/utils/membership";

export async function getDashboardAnalytics(
  req: AuthRequest,
  res: Response
) {
  try {
    const userId = req.auth!.userId;

    const membership =
      await getCurrentMembership(userId);

    if (!membership) {
      return res.status(400).json({
        success: false,
        message:
          "You're not part of a workspace yet.",
      });
    }

    const organizationId =
      membership.organizationId;

    const startOfDay = new Date();

    startOfDay.setHours(
      0,
      0,
      0,
      0
    );

    const events =
      await prisma.analyticsEvent.findMany({
        where: {
          organizationId,
          createdAt: {
            gte: startOfDay,
          },
        },
        select: {
          visitorId: true,
          sessionId: true,
          event: true,
        },
      });

    const visitors = new Set(
      events.map(
        (event) => event.visitorId
      )
    ).size;

    const sessions = new Set(
      events.map(
        (event) => event.sessionId
      )
    ).size;

    const pageViews =
      events.filter(
        (event) =>
          event.event === "PAGE_VIEW"
      ).length;

    const buttonClicks =
      events.filter(
        (event) =>
          event.event === "BUTTON_CLICKED"
      ).length;

    const chatOpened =
      events.filter(
        (event) =>
          event.event === "CHAT_OPENED"
      ).length;

    const messagesSent =
      events.filter(
        (event) =>
          event.event === "MESSAGE_SENT"
      ).length;

    const messagesReceived =
      events.filter(
        (event) =>
          event.event ===
          "MESSAGE_RECEIVED"
      ).length;

    const leads =
      events.filter(
        (event) =>
          event.event ===
          "LEAD_GENERATED"
      ).length;

    const purchases =
      events.filter(
        (event) =>
          event.event === "PURCHASE"
      ).length;

    return res.json({
      success: true,

      data: {
        visitors,
        sessions,
        pageViews,
        buttonClicks,
        chatOpened,
        messagesSent,
        messagesReceived,
        leads,
        purchases,
      },
    });
  } catch (error) {
    console.error(
      "Dashboard analytics error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load analytics.",
    });
  }
}

export async function getAnalyticsTimeline(
  req: AuthRequest,
  res: Response
) {
  try {
    const userId = req.auth!.userId;

    const membership =
      await getCurrentMembership(userId);

    if (!membership) {
      return res.status(400).json({
        success: false,
        message:
          "You're not part of a workspace yet.",
      });
    }

    const organizationId =
      membership.organizationId;

    const startOfDay = new Date();

    startOfDay.setHours(0, 0, 0, 0);

    const events =
      await prisma.analyticsEvent.findMany({
        where: {
          organizationId,
          createdAt: {
            gte: startOfDay,
          },
        },
        select: {
          event: true,
          visitorId: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

    const timeline = Array.from(
      { length: 24 },
      (_, hour) => ({
        hour,
        pageViews: 0,
        visitors: 0,
        clicks: 0,
        chats: 0,
        messages: 0,
        visitorIds: new Set<string>(),
      })
    );

    for (const event of events) {
      const hour =
        event.createdAt.getHours();

      const bucket = timeline[hour];

      if (!bucket) continue;

      bucket.visitorIds.add(
        event.visitorId
      );

      switch (event.event) {
        case "PAGE_VIEW":
          bucket.pageViews++;
          break;

        case "BUTTON_CLICKED":
          bucket.clicks++;
          break;

        case "CHAT_OPENED":
          bucket.chats++;
          break;

        case "MESSAGE_SENT":
          bucket.messages++;
          break;
      }
    }

    const result = timeline.map(
      ({
        visitorIds,
        ...bucket
      }) => ({
        ...bucket,
        visitors: visitorIds.size,
      })
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "Analytics timeline error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load analytics timeline.",
    });
  }
}