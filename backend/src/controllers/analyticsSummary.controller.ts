import { Response } from "express";

import { AuthRequest } from "@/middleware/auth";
import { getMembershipForOrg } from "@/utils/membership";
import { cacheAside } from "@/config/redis";

import {
  generateAnalyticsSummary,
} from "@/services/ai/analyticsAI.service";

import {
  getDashboardAnalytics,
} from "@/services/analytics/dashboardAnalytics.service";

export async function getAnalyticsAISummary(
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
        message:
          "You don't have access to this workspace.",
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    const cacheKey = `ai-summary:${organizationId}:${today}`;

    const data = await cacheAside(cacheKey, 60 * 60 * 24, async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const summary =
        await getDashboardAnalytics(
          organizationId,
          startOfDay
        );

      const aiSummary =
        await generateAnalyticsSummary(
          summary,
          {
            provider: "RELAY",
          }
        );

      return {
        analytics: summary,
        summary: aiSummary,
      };
    });

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Analytics AI summary error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to prepare analytics summary.",
    });
  }
}