import { Response } from "express";
import { Conversation } from "@/models/Conversation";
import { prisma } from "@/config/postgres";
import { AuthRequest } from "@/middleware/auth";
import { getMembershipForOrg } from "@/utils/membership";

export async function getDashboardOverview(req: AuthRequest, res: Response) {
  try {
    const { organizationId } = req.params;

    const membership = await getMembershipForOrg(req.auth!.userId, organizationId);
    if (!membership) {
      return res.status(403).json({ message: "You don't have access to this workspace" });
    }
    const orgId = membership.organizationId;

    // All conversations
    const conversations = await Conversation.find({ orgId });

    //---------------------------------------
    // Basic numbers
    //---------------------------------------

    const totalConversations = conversations.length;

    let totalMessages = 0;

    let aiResponses = 0;

    let humanResponses = 0;

    conversations.forEach((conversation) => {
      totalMessages += conversation.messages.length;

      conversation.messages.forEach((message) => {
        if (message.role === "assistant") {
          aiResponses++;
        }

        if (message.role === "user") {
          humanResponses++;
        }
      });
    });

    //---------------------------------------
    // Team Members
    //---------------------------------------

    const totalUsers = await prisma.membership.count({
      where: {
        organizationId: orgId,
      },
    });

    //---------------------------------------
    // Today's conversations
    //---------------------------------------

    const startOfToday = new Date();

    startOfToday.setHours(0, 0, 0, 0);

    const activeToday = await Conversation.countDocuments({
      orgId,
      updatedAt: {
        $gte: startOfToday,
      },
    });

    //---------------------------------------
    // Team members active today (logged in / made an authenticated
    // request since midnight) - distinct from conversation activity above.
    //---------------------------------------

    const activeTeamMembersToday = await prisma.membership.count({
      where: {
        organizationId: orgId,
        user: {
          lastActiveAt: {
            gte: startOfToday,
          },
        },
      },
    });

    //---------------------------------------
    // Average AI Response Time
    //---------------------------------------

    // We don't have response tracking yet.

    const avgResponseTime = 0;

    //---------------------------------------

    return res.json({
      overview: {
        totalConversations,
        totalMessages,
        totalUsers,
        activeToday,
        activeTeamMembersToday,
        avgResponseTime,
        aiResponses,
        humanResponses,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to load dashboard.",
    });
  }
}