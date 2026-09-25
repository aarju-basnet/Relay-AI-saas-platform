import { Router } from "express";

import { requireAuth, AuthRequest } from "@/middleware/auth";
import { getMembershipForOrg } from "@/utils/membership";
import { TeamMessage } from "@/models/TeamMessage";
import { prisma } from "@/config/postgres";

const router = Router();

// GET /api/team-chat/:organizationId/messages
router.get("/:organizationId/messages", requireAuth, async (req: AuthRequest, res) => {
  const { organizationId } = req.params;
  const membership = await getMembershipForOrg(req.auth!.userId, organizationId);
  if (!membership) return res.status(403).json({ error: "You don't have access to this workspace." });

  const messages = await TeamMessage.find({ orgId: organizationId })
    .sort({ createdAt: 1 })
    .lean();

  res.json({
    messages: messages.map((m) => ({
      _id: m._id.toString(),
      orgId: m.orgId,
      userId: m.userId,
      userName: m.userName,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
  });
});

router.post("/:organizationId/messages", requireAuth, async (req: AuthRequest, res) => {
  const { organizationId } = req.params;
  const membership = await getMembershipForOrg(req.auth!.userId, organizationId);
  if (!membership) return res.status(403).json({ error: "You don't have access to this workspace." });

  const { content } = req.body as { content?: string };
  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Message content is required." });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.auth!.userId },
    select: { name: true, email: true },
  });

  const created = await TeamMessage.create({
    orgId: organizationId,
    userId: req.auth!.userId,
    userName: user?.name || user?.email || "Unknown",
    content: content.trim(),
  });

  res.status(201).json({
    message: {
      _id: created._id.toString(),
      orgId: created.orgId,
      userId: created.userId,
      userName: created.userName,
      content: created.content,
      createdAt: created.createdAt.toISOString(),
    },
  });
});

// DELETE /api/team-chat/:organizationId/messages/:id
router.delete("/:organizationId/messages/:id", requireAuth, async (req: AuthRequest, res) => {
  const { organizationId, id } = req.params;
  const membership = await getMembershipForOrg(req.auth!.userId, organizationId);
  if (!membership) return res.status(403).json({ error: "You don't have access to this workspace." });

  const msg = await TeamMessage.findOne({ _id: id, orgId: organizationId });
  if (!msg) return res.status(404).json({ error: "Message not found." });

  // Only the message's own sender or an OWNER/ADMIN can delete it
  if (msg.userId !== req.auth!.userId && membership.role === "MEMBER") {
    return res.status(403).json({ error: "You can't delete this message." });
  }

  await msg.deleteOne();
  res.json({ success: true });
});

export default router;