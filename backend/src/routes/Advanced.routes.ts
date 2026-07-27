import { Router } from "express";

import { requireAuth, AuthRequest } from "@/middleware/auth";
import { prisma } from "@/config/postgres";
import { getCurrentMembership } from "@/utils/membership";

const router = Router();

async function getWorkspace() {
  return prisma.organization.findFirst({
    include: {
      assistant: true,
    },
  });
}

router.get(
  "/",
  requireAuth,
  async (req: AuthRequest, res) => {
    const membership = await getCurrentMembership(
      req.auth!.userId
    );

    if (!membership) {
      return res.status(400).json({
        error: "Workspace not found.",
      });
    }

    const workspace =
      await prisma.organization.findUnique({
        where: {
          id: membership.organizationId,
        },
        include: {
          assistant: true,
        },
      });

    if (!workspace) {
      return res.status(404).json({
        error: "Workspace not found.",
      });
    }

    res.json({
      settings: {
        plan: workspace.plan,

        developerMode: false,

        debugLogs: false,

        apiAccess: workspace.plan !== "FREE",

        customPrompt:
          workspace.plan !== "FREE",

        deleteWorkspace:
          membership.role === "OWNER",
      },
    });
  }
);

router.patch(
  "/",
  requireAuth,
  async (req: AuthRequest, res) => {
    const membership = await getCurrentMembership(
      req.auth!.userId
    );

    if (!membership) {
      return res.status(400).json({
        error: "Workspace not found.",
      });
    }

    if (membership.role !== "OWNER") {
      return res.status(403).json({
        error: "Only workspace owner can modify advanced settings.",
      });
    }

    const workspace =
      await prisma.organization.findUnique({
        where: {
          id: membership.organizationId,
        },
      });

    if (!workspace) {
      return res.status(404).json({
        error: "Workspace not found.",
      });
    }

    if (
      workspace.plan === "FREE" &&
      req.body.apiAccess
    ) {
      return res.status(403).json({
        error:
          "API Access is available only on Pro plans.",
      });
    }

    res.json({
      message:
        "Advanced settings updated successfully.",
    });
  }
);

router.delete(
  "/workspace",
  requireAuth,
  async (req: AuthRequest, res) => {
    const membership = await getCurrentMembership(
      req.auth!.userId
    );

    if (!membership) {
      return res.status(400).json({
        error: "Workspace not found.",
      });
    }

    if (membership.role !== "OWNER") {
      return res.status(403).json({
        error:
          "Only workspace owner can delete the workspace.",
      });
    }

    await prisma.organization.delete({
      where: {
        id: membership.organizationId,
      },
    });

    res.json({
      message:
        "Workspace deleted successfully.",
    });
  }
);

export default router;