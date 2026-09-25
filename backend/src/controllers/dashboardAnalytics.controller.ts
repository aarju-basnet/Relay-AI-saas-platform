import { Response } from "express";

import { prisma } from "@/config/postgres";
import { AuthRequest } from "@/middleware/auth";
import { getMembershipForOrg } from "@/utils/membership";

export async function getDashboardAnalytics(
  req: AuthRequest,
  res: Response
) {
  try {
    const userId = req.auth!.userId;
    const { organizationId } = req.params;

    const membership =
      await getMembershipForOrg(userId, organizationId);

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this workspace.",
      });
    }

    const dateParam = req.query.date as string | undefined;
    const targetDate = dateParam ? new Date(dateParam) : new Date();

    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date.",
      });
    }

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const events =
      await prisma.analyticsEvent.findMany({
        where: {
          organizationId,
          createdAt: { gte: startOfDay, lt: endOfDay },
        },
        select: {
          visitorId: true,
          sessionId: true,
          event: true,
          page: true,
          metadata: true,
        },
      });

    const visitors = new Set(events.map((e) => e.visitorId)).size;
    const sessions = new Set(events.map((e) => e.sessionId)).size;

    const pageViews = events.filter((e) => e.event === "PAGE_VIEW").length;
    const buttonClicks = events.filter((e) => e.event === "BUTTON_CLICKED").length;
    const chatOpened = events.filter((e) => e.event === "CHAT_OPENED").length;
    const messagesSent = events.filter((e) => e.event === "MESSAGE_SENT").length;
    const messagesReceived = events.filter((e) => e.event === "MESSAGE_RECEIVED").length;
    const leads = events.filter((e) => e.event === "LEAD_GENERATED").length;
    const purchases = events.filter((e) => e.event === "PURCHASE").length;

    const pageCounts = new Map<string, number>();
    for (const event of events) {
      if (event.event === "PAGE_VIEW" && event.page) {
        pageCounts.set(event.page, (pageCounts.get(event.page) ?? 0) + 1);
      }
    }
    const topPages = Array.from(pageCounts.entries())
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    const customCounts = new Map<string, number>();
    for (const event of events) {
      if (event.event === "CUSTOM") {
        const eventName = (event.metadata as any)?.eventName;
        if (typeof eventName === "string" && eventName) {
          customCounts.set(eventName, (customCounts.get(eventName) ?? 0) + 1);
        }
      }
    }
    const customEvents = Array.from(customCounts.entries())
      .map(([eventName, count]) => ({ eventName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

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
        topPages,
        customEvents,
      },
    });
  } catch (error) {
    console.error("Dashboard analytics error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load analytics.",
    });
  }
}

export async function getAnalyticsTimeline(
  req: AuthRequest,
  res: Response
) {
  try {
    const userId = req.auth!.userId;
    const { organizationId } = req.params;

    const membership =
      await getMembershipForOrg(userId, organizationId);

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this workspace.",
      });
    }

    const dateParam = req.query.date as string | undefined;
    const targetDate = dateParam ? new Date(dateParam) : new Date();

    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date.",
      });
    }

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const events =
      await prisma.analyticsEvent.findMany({
        where: {
          organizationId,
          createdAt: {
            gte: startOfDay,
            lt: endOfDay,
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
      const hour = event.createdAt.getHours();
      const bucket = timeline[hour];
      if (!bucket) continue;

      bucket.visitorIds.add(event.visitorId);

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
      ({ visitorIds, ...bucket }) => ({
        ...bucket,
        visitors: visitorIds.size,
      })
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Analytics timeline error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load analytics timeline.",
    });
  }
}