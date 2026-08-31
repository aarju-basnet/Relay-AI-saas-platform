import { Response } from "express";

import { AuthRequest } from "@/middleware/auth";
import { getCurrentMembership } from "@/utils/membership";

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

    // -----------------------------------------
    // Today's analytics
    // -----------------------------------------

    const startOfDay = new Date();

    startOfDay.setHours(
      0,
      0,
      0,
      0
    );

    const summary =
      await getDashboardAnalytics(
        organizationId,
        startOfDay
      );

    // -----------------------------------------
    // Relay AI summary
    // -----------------------------------------

    const aiSummary =
      await generateAnalyticsSummary(
        summary,
        {
          provider: "RELAY",
        }
      );

    // -----------------------------------------
    // Response
    // -----------------------------------------

    return res.json({
      success: true,

      data: {
        analytics: summary,
        summary: aiSummary,
      },
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