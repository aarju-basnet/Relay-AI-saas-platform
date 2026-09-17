import { Router } from "express";

import { requireAuth, AuthRequest } from "@/middleware/auth";
import { prisma } from "@/config/postgres";
import { getMembershipForOrg } from "@/utils/membership";

const router = Router();

router.get("/:organizationId", requireAuth, async (req: AuthRequest, res) => {
  const { organizationId } = req.params;
  const membership = await getMembershipForOrg(req.auth!.userId, organizationId);
  if (!membership) return res.status(403).json({ error: "You don't have access to this workspace." });

  const workspace = await prisma.organization.findUnique({
    where: { id: organizationId },
  });
  if (!workspace) return res.status(404).json({ error: "Workspace not found." });

  res.json({
    settings: {
      plan: workspace.plan,
      developerMode: workspace.developerMode,
      debugLogs: workspace.debugLogs,
      apiAccess: workspace.plan !== "FREE" && workspace.apiAccess,
      customPrompt: workspace.plan !== "FREE" && workspace.customPrompt,
      deleteWorkspace: membership.role === "OWNER",
    },
  });
});

router.patch("/:organizationId", requireAuth, async (req: AuthRequest, res) => {
  const { organizationId } = req.params;
  const membership = await getMembershipForOrg(req.auth!.userId, organizationId);
  if (!membership) return res.status(403).json({ error: "You don't have access to this workspace." });
  if (membership.role !== "OWNER") {
    return res.status(403).json({ error: "Only workspace owner can modify advanced settings." });
  }

  const workspace = await prisma.organization.findUnique({
    where: { id: organizationId },
  });
  if (!workspace) return res.status(404).json({ error: "Workspace not found." });

  const { developerMode, debugLogs, apiAccess, customPrompt } = req.body as Partial<{
    developerMode: boolean;
    debugLogs: boolean;
    apiAccess: boolean;
    customPrompt: boolean;
  }>;

  if (workspace.plan === "FREE" && (apiAccess || customPrompt)) {
    return res.status(403).json({ error: "This feature is available only on Pro plans." });
  }

  const updated = await prisma.organization.update({
    where: { id: workspace.id },
    data: {
      ...(developerMode !== undefined && { developerMode }),
      ...(debugLogs !== undefined && { debugLogs }),
      ...(apiAccess !== undefined && { apiAccess }),
      ...(customPrompt !== undefined && { customPrompt }),
    },
  });

  res.json({
    message: "Advanced settings updated successfully.",
    settings: {
      plan: updated.plan,
      developerMode: updated.developerMode,
      debugLogs: updated.debugLogs,
      apiAccess: updated.plan !== "FREE" && updated.apiAccess,
      customPrompt: updated.plan !== "FREE" && updated.customPrompt,
      deleteWorkspace: membership.role === "OWNER",
    },
  });
});



router.delete(
  "/:organizationId",
  requireAuth,
  async (req: AuthRequest, res) => {
    const { organizationId } = req.params;
    const membership = await getMembershipForOrg(
      req.auth!.userId,
      organizationId
    );

    if (!membership) {
      return res.status(403).json({
        error: "You don't have access to this workspace.",
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
        id: organizationId,
      },
    });

    res.json({
      message:
        "Workspace deleted successfully.",
    });
  }
);

export default router;