import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "@/middleware/auth";
import { Conversation } from "@/models/Conversation";
import { redis } from "@/config/redis";
import { prisma } from "@/config/postgres";
import { getCurrentMembership } from "@/utils/membership";
import { buildDefaultSystemPrompt } from "@/routes/assistant.routes";

const router = Router();

// Ordered fallback chain of free OpenRouter models. If one is rate-limited,
// down, or removed from the free tier, we automatically try the next.
// These match what's currently showing as free in the OpenRouter dashboard
// (July 2026) - free model IDs rotate over time, so verify at
// openrouter.ai/models (filter: Price -> Free) if any of these stop working.
const FREE_MODEL_CHAIN = [
  "poolside/laguna-xs-2.1:free",
  "cohere/north-mini-code:free",
  "poolside/laguna-m.1:free",
  "google/gemma-4-31b-it:free",
  "openrouter/free", // final catch-all: auto-router picks any available free model
];

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callOpenRouterWithFallback(messages: ChatMessage[]): Promise<{ text: string; modelUsed: string }> {
  let lastError: unknown;

  for (const model of FREE_MODEL_CHAIN) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          // OpenRouter asks for these for its public leaderboard - harmless to include
          "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:5173",
          "X-Title": "Relay",
        },
        body: JSON.stringify({ model, messages }),
      });

      if (!response.ok) {
        lastError = `${model} -> HTTP ${response.status}: ${await response.text()}`;
        continue; // try the next model in the chain
      }

      interface OpenRouterResponse {
        choices?: { message?: { content?: string } }[];
      }
      const data = (await response.json()) as OpenRouterResponse;
      const text = data.choices?.[0]?.message?.content;
      if (!text) {
        lastError = `${model} -> empty response`;
        continue;
      }

      return { text, modelUsed: model };
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  throw new Error(`All free models failed. Last error: ${lastError}`);
}

// POST /api/llm/chat - send a message, get an AI response, persist both
router.post("/chat", requireAuth, async (req: AuthRequest, res: Response) => {
  const { conversationId, message } = req.body as { conversationId?: string; message: string };
  if (!message) return res.status(400).json({ error: "message is required" });

  const userId = req.auth!.userId;
  const membership = await getCurrentMembership(userId);
  if (!membership) return res.status(400).json({ error: "You're not part of a workspace yet" });

  const requesterUser = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true, name: true, email: true } });

  // Free plan: 20 messages / 5 min. Pro plan: 200 / 5 min.
  // Rate limit is still per-person (not per-business) so one busy teammate
  // doesn't lock everyone else out.
  const limit = requesterUser?.plan === "PRO" ? 200 : 20;

  const rateKey = `ratelimit:llm:${userId}`;
  const count = await redis.incr(rateKey);
  if (count === 1) await redis.expire(rateKey, 300);
  if (count > limit) {
    return res.status(429).json({
      error:
        requesterUser?.plan === "PRO"
          ? "Rate limit exceeded, try again shortly"
          : "Free plan limit reached (20 messages / 5 min). Upgrade to Pro for a higher limit.",
    });
  }

  // Shared inbox: any teammate can continue any conversation that belongs
  // to the business, not just ones they personally started.
  let conversation = conversationId
    ? await Conversation.findOne({ _id: conversationId, orgId: membership.organizationId })
    : null;

  if (!conversation) {
    conversation = await Conversation.create({
      orgId: membership.organizationId,
      userId,
      createdByName: requesterUser?.name || requesterUser?.email || "Unknown",
      title: message.slice(0, 50),
      messages: [],
    });
  }

  conversation.messages.push({ role: "user", content: message, createdAt: new Date() });

  // The assistant's configured persona/tone/language shapes every reply -
  // this is what makes "AI Assistant setup" actually do something, not
  // just be a settings page nobody's chat behavior reflects.
  const assistant = await prisma.assistant.findUnique({ where: { organizationId: membership.organizationId } });
  const systemPrompt =
    assistant?.systemPrompt ||
    buildDefaultSystemPrompt({
      name: assistant?.name || "Relay AI",
      purposes: assistant?.purposes || [],
      responseStyle: assistant?.responseStyle || "Friendly",
      language: assistant?.language || "English",
    });

  // Build message history for the model (last 20 turns to keep context bounded)
  const history: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...conversation.messages.slice(-20).map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: m.content,
    })),
  ];

  let replyText: string;
  let modelUsed: string;
  try {
    const result = await callOpenRouterWithFallback(history);
    replyText = result.text;
    modelUsed = result.modelUsed;
  } catch (err) {
    return res.status(502).json({ error: "All free AI models are currently unavailable, try again in a minute." });
  }

  conversation.messages.push({
    role: "assistant",
    content: replyText,
    createdAt: new Date(),
    metadata: { model: modelUsed },
  });
  await conversation.save();

  res.json({ conversationId: conversation._id, reply: replyText, modelUsed });
});

// GET /api/llm/conversations - list every conversation belonging to the
// requester's business (shared inbox), newest first
router.get("/conversations", requireAuth, async (req: AuthRequest, res: Response) => {
  const membership = await getCurrentMembership(req.auth!.userId);
  if (!membership) return res.status(400).json({ error: "You're not part of a workspace yet" });

  const conversations = await Conversation.find({ orgId: membership.organizationId })
    .select("title createdAt updatedAt createdByName assignedTo assignedToName")
    .sort({ updatedAt: -1 });
  res.json({ conversations });
});

// GET /api/llm/conversations/:id - full conversation with messages
router.get("/conversations/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const membership = await getCurrentMembership(req.auth!.userId);
  if (!membership) return res.status(400).json({ error: "You're not part of a workspace yet" });

  const conversation = await Conversation.findOne({ _id: req.params.id, orgId: membership.organizationId });
  if (!conversation) return res.status(404).json({ error: "Not found" });
  res.json({ conversation });
});

// PATCH /api/llm/conversations/:id/assign - claim or hand off a conversation.
// Pass assignedTo: null to unassign.
router.patch("/conversations/:id/assign", requireAuth, async (req: AuthRequest, res: Response) => {
  const membership = await getCurrentMembership(req.auth!.userId);
  if (!membership) return res.status(400).json({ error: "You're not part of a workspace yet" });

  const conversation = await Conversation.findOne({ _id: req.params.id, orgId: membership.organizationId });
  if (!conversation) return res.status(404).json({ error: "Not found" });

  const { assignedTo } = req.body as { assignedTo: string | null };

  if (assignedTo === null) {
    conversation.assignedTo = null;
    conversation.assignedToName = null;
  } else {
    const assigneeMembership = await prisma.membership.findUnique({
      where: { userId_organizationId: { userId: assignedTo, organizationId: membership.organizationId } },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!assigneeMembership) {
      return res.status(400).json({ error: "That person isn't on your team" });
    }
    conversation.assignedTo = assigneeMembership.user.id;
    conversation.assignedToName = assigneeMembership.user.name || assigneeMembership.user.email;
  }

  await conversation.save();
  res.json({ conversation });
});

export default router;