import { Response } from "express";
import { AuthRequest } from "@/middleware/auth";
import { getMembershipForOrg } from "@/utils/membership";
import { prisma } from "@/config/postgres";

export async function getAssistantUsage(req: AuthRequest, res: Response) {
  try {
    const { organizationId } = req.params;

    const membership = await getMembershipForOrg(req.auth!.userId, organizationId);
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this workspace.",
      });
    }

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const events = await prisma.analyticsEvent.findMany({
      where: {
        organizationId,
        keySource: "ASSISTANT",
        event: { in: ["CHAT_OPENED", "MESSAGE_SENT", "MESSAGE_RECEIVED"] },
        createdAt: { gte: since },
      },
      select: { event: true, createdAt: true, sessionId: true },
    });

    const totalConversations = new Set(
      events.filter((e) => e.event === "CHAT_OPENED").map((e) => e.sessionId)
    ).size;

    const totalMessagesSent = events.filter((e) => e.event === "MESSAGE_SENT").length;
    const totalMessagesReceived = events.filter((e) => e.event === "MESSAGE_RECEIVED").length;

    const avgMessagesPerConversation =
      totalConversations > 0
        ? Math.round((totalMessagesSent / totalConversations) * 10) / 10
        : 0;

    // Daily message volume, last 14 days
    const dayMap = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dayMap.set(d.toISOString().slice(0, 10), 0);
    }
    events
      .filter((e) => e.event === "MESSAGE_SENT")
      .forEach((e) => {
        const key = e.createdAt.toISOString().slice(0, 10);
        if (dayMap.has(key)) dayMap.set(key, (dayMap.get(key) || 0) + 1);
      });
    const dailyVolume = Array.from(dayMap.entries()).map(([date, count]) => ({ date, count }));

    // Busiest hours, last 30 days
    const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
    events
      .filter((e) => e.event === "MESSAGE_SENT")
      .forEach((e) => {
        hourly[e.createdAt.getHours()].count++;
      });

    return res.json({
      success: true,
      data: {
        totalConversations,
        totalMessagesSent,
        totalMessagesReceived,
        avgMessagesPerConversation,
        dailyVolume,
        hourly,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to load usage data.",
    });
  }
}