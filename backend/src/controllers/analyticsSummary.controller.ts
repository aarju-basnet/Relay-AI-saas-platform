import { Response } from "express";

import { AuthRequest } from "@/middleware/auth";
import { getMembershipForOrg } from "@/utils/membership";

import { generateRuleBasedSummary } from "@/services/ai/analyticsAI.service";

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
        message: "You don't have access to this workspace.",
      });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const summary =
      await getDashboardAnalytics(
        organizationId,
        startOfDay
      );

    const generatedSummary = generateRuleBasedSummary(summary);

    return res.json({
      success: true,
      data: {
        analytics: summary,
        summary: generatedSummary,
      },
    });
  } catch (error) {
    console.error("Analytics AI summary error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to prepare analytics summary.",
    });
  }
}