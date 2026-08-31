import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "@/middleware/auth";
import { TeamMessage } from "@/models/TeamMessage";
import { prisma } from "@/config/postgres";
import { getCurrentMembership } from "@/utils/membership";
import { redis } from "@/config/redis";

const router = Router();

// GET /api/team-chat/messages
router.get(
  "/messages",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const membership = await getCurrentMembership(req.auth!.userId);

    if (!membership) {
      return res.status(400).json({
        error: "You're not part of a workspace yet",
      });
    }

    const messages = await TeamMessage.find({
      orgId: membership.organizationId,
    })
      .sort({ createdAt: 1 })
      .limit(200);

    return res.json({ messages });
  }
);

// POST /api/team-chat/messages
router.post(
  "/messages",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const membership = await getCurrentMembership(req.auth!.userId);

    if (!membership) {
      return res.status(400).json({
        error: "You're not part of a workspace yet",
      });
    }

    const { content } = req.body as { content?: string };

    if (!content || !content.trim()) {
      return res.status(400).json({
        error: "Message content is required.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      select: { name: true, email: true, plan: true },
    });

    // FREE plan: 5 team chat messages per day, per user
    if (user?.plan === "FREE") {
      const rateKey = `ratelimit:teamchat:${req.auth!.userId}`;
      const count = await redis.incr(rateKey);

      if (count === 1) {
        await redis.expire(rateKey, 24 * 60 * 60);
      }

      if (count > 5) {
        return res.status(429).json({
          error:
            "Free plan limit reached (5 team messages / day). Upgrade to Pro for unlimited messaging.",
        });
      }
    }

    const message = await TeamMessage.create({
      orgId: membership.organizationId,
      userId: req.auth!.userId,
      userName: user?.name || user?.email || "Unknown",
      content: content.trim(),
    });

    return res.status(201).json({ message });
  }
);

// DELETE /api/team-chat/messages/:id
router.delete(
  "/messages/:id",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const membership = await getCurrentMembership(req.auth!.userId);

    if (!membership) {
      return res.status(400).json({
        error: "You're not part of a workspace yet",
      });
    }

    const message = await TeamMessage.findOne({
      _id: req.params.id,
      orgId: membership.organizationId,
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found." });
    }

    const isOwnMessage = message.userId === req.auth!.userId;
    const canModerate =
      membership.role === "OWNER" || membership.role === "ADMIN";

    if (!isOwnMessage && !canModerate) {
      return res.status(403).json({
        error: "You can only delete your own messages.",
      });
    }

    await message.deleteOne();

    return res.json({ success: true });
  }
);

export default router;