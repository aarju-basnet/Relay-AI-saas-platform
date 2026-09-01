import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "@/middleware/auth";
import { Conversation } from "@/models/Conversation";
import { redis } from "@/config/redis";
import { prisma } from "@/config/postgres";
import { getCurrentMembership } from "@/utils/membership";
import { buildDefaultSystemPrompt } from "@/routes/assistant.routes";
import { generateAIResponse } from "@/services/llm.service";
import { findRelevantChunks } from "@/utils/retrieval";

const router = Router();

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// POST /api/llm/chat
router.post(
  "/chat",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const {
      conversationId,
      message,
    } = req.body as {
      conversationId?: string;
      message: string;
    };

    if (!message) {
      return res.status(400).json({
        error: "message is required",
      });
    }

    const userId = req.auth!.userId;

    const membership =
      await getCurrentMembership(userId);

    if (!membership) {
      return res.status(400).json({
        error:
          "You're not part of a workspace yet",
      });
    }

    const requesterUser =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          plan: true,
          name: true,
          email: true,
        },
      });

    const limit =
      requesterUser?.plan === "PRO"
        ? 200
        : 20;

    const rateKey = `ratelimit:llm:${userId}`;

    const count =
      await redis.incr(rateKey);

    if (count === 1) {
      await redis.expire(
        rateKey,
        300
      );
    }

    if (count > limit) {
      return res.status(429).json({
        error:
          requesterUser?.plan === "PRO"
            ? "Rate limit exceeded, try again shortly."
            : "Free plan limit reached (20 messages / 5 min). Upgrade to Pro.",
      });
    }

    let conversation =
      conversationId
        ? await Conversation.findOne({
            _id: conversationId,
            orgId:
              membership.organizationId,
          })
        : null;

    if (!conversation) {
      conversation =
        await Conversation.create({
          orgId:
            membership.organizationId,
          userId,
          createdByName:
            requesterUser?.name ||
            requesterUser?.email ||
            "Unknown",
          title: message.slice(
            0,
            50
          ),
          messages: [],
        });
    }

    conversation.messages.push({
      role: "user",
      content: message,
      createdAt: new Date(),
    });

       const [assistant, allChunks] = await Promise.all([
      prisma.assistant.findUnique({
        where: {
          organizationId: membership.organizationId,
        },
      }),
      prisma.knowledgeChunk.findMany({
        where: {
          document: {
            organizationId: membership.organizationId,
            status: "READY",
          },
        },
        select: { content: true },
      }),
    ]);

    const relevantChunks = findRelevantChunks(message, allChunks);

    const knowledgeContext =
      relevantChunks.length > 0
        ? `\n\nRelevant business information:\n${relevantChunks
            .map((c, i) => `[${i + 1}] ${c}`)
            .join("\n")}\n\nUse this information to answer if relevant. If the answer isn't in the information provided, answer normally using your general knowledge, but don't make up specific facts about this business.`
        : "";

    const systemPrompt =
      (assistant?.systemPrompt ||
        buildDefaultSystemPrompt({
          name: assistant?.name || "Relay AI",
          purposes: assistant?.purposes || [],
          responseStyle: assistant?.responseStyle || "Friendly",
          language: assistant?.language || "English",
        })) + knowledgeContext;

    const history: ChatMessage[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...conversation.messages
        .slice(-20)
        .map((m) => ({
          role:
            m.role === "assistant"
              ? ("assistant" as const)
              : ("user" as const),
          content: m.content,
        })),
    ];

    let replyText: string;
    let modelUsed: string;

    try {
      const result =
        await generateAIResponse(
          history
        );

      replyText = result.text;
      modelUsed =
        result.modelUsed;
    } catch {
      return res.status(502).json({
        error:
          "All free AI models are unavailable. Please try again later.",
      });
    }

    conversation.messages.push({
      role: "assistant",
      content: replyText,
      createdAt: new Date(),
      metadata: {
        model: modelUsed,
      },
    });

    await conversation.save();

    return res.json({
      conversationId:
        conversation._id,
      reply: replyText,
      modelUsed,
    });
  }
);

// GET /api/llm/conversations
router.get(
  "/conversations",
  requireAuth,
  async (
    req: AuthRequest,
    res: Response
  ) => {
    const membership =
      await getCurrentMembership(
        req.auth!.userId
      );

    if (!membership) {
      return res.status(400).json({
        error:
          "You're not part of a workspace yet",
      });
    }

    const conversations =
      await Conversation.find({
        orgId:
          membership.organizationId,
      })
        .select(
          "title createdAt updatedAt createdByName assignedTo assignedToName"
        )
        .sort({
          updatedAt: -1,
        });

    return res.json({
      conversations,
    });
  }
);

// GET /api/llm/conversations/:id
router.get(
  "/conversations/:id",
  requireAuth,
  async (
    req: AuthRequest,
    res: Response
  ) => {
    const membership =
      await getCurrentMembership(
        req.auth!.userId
      );

    if (!membership) {
      return res.status(400).json({
        error:
          "You're not part of a workspace yet",
      });
    }

    const conversation =
      await Conversation.findOne({
        _id: req.params.id,
        orgId:
          membership.organizationId,
      });

    if (!conversation) {
      return res.status(404).json({
        error: "Not found",
      });
    }

    return res.json({
      conversation,
    });
  }
);

// PATCH /api/llm/conversations/:id/assign
router.patch(
  "/conversations/:id/assign",
  requireAuth,
  async (
    req: AuthRequest,
    res: Response
  ) => {
    const membership =
      await getCurrentMembership(
        req.auth!.userId
      );

    if (!membership) {
      return res.status(400).json({
        error:
          "You're not part of a workspace yet",
      });
    }

    const conversation =
      await Conversation.findOne({
        _id: req.params.id,
        orgId:
          membership.organizationId,
      });

    if (!conversation) {
      return res.status(404).json({
        error: "Not found",
      });
    }

    const {
      assignedTo,
    } = req.body as {
      assignedTo: string | null;
    };

    if (assignedTo === null) {
      conversation.assignedTo = null;
      conversation.assignedToName =
        null;
    } else {
      const assigneeMembership =
        await prisma.membership.findUnique(
          {
            where: {
              userId_organizationId: {
                userId: assignedTo,
                organizationId:
                  membership.organizationId,
              },
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          }
        );

      if (!assigneeMembership) {
        return res.status(400).json({
          error:
            "That person isn't on your team",
        });
      }

      conversation.assignedTo =
        assigneeMembership.user.id;

      conversation.assignedToName =
        assigneeMembership.user.name ||
        assigneeMembership.user.email;
    }

    await conversation.save();

    return res.json({
      conversation,
    });
  }
);



// PATCH /api/llm/conversations/:id - rename (OWNER/ADMIN only)
router.patch(
  "/conversations/:id",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const membership = await getCurrentMembership(req.auth!.userId);

    if (!membership) {
      return res.status(400).json({
        error: "You're not part of a workspace yet",
      });
    }

    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return res.status(403).json({
        error: "Only owners and admins can rename conversations.",
      });
    }

    const { title } = req.body as { title?: string };

    if (!title || !title.trim()) {
      return res.status(400).json({
        error: "A conversation title is required.",
      });
    }

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      orgId: membership.organizationId,
    });

    if (!conversation) {
      return res.status(404).json({ error: "Not found" });
    }

    conversation.title = title.trim().slice(0, 100);
    await conversation.save();

    return res.json({ conversation });
  }
);

// DELETE /api/llm/conversations/:id - delete (OWNER/ADMIN only)
router.delete(
  "/conversations/:id",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const membership = await getCurrentMembership(req.auth!.userId);

    if (!membership) {
      return res.status(400).json({
        error: "You're not part of a workspace yet",
      });
    }

    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return res.status(403).json({
        error: "Only owners and admins can delete conversations.",
      });
    }

    const conversation = await Conversation.findOneAndDelete({
      _id: req.params.id,
      orgId: membership.organizationId,
    });

    if (!conversation) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.json({ success: true });
  }
);

export default router;