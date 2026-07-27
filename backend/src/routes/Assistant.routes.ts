import { Router, Response } from "express";
import { z } from "zod";
import { requireAuth, AuthRequest } from "@/middleware/auth";
import { prisma } from "@/config/postgres";
import { getCurrentMembership } from "@/utils/membership";

const router = Router();

export const PURPOSES = [
  "Customer Support",
  "Sales",
  "Product Questions",
  "Refunds",
  "Orders",
  "Appointments",
  "General FAQ",
] as const;

export const PREFERRED_MODELS = ["Auto (free fallback chain)", "GPT-5", "Claude", "Gemini"] as const;
export const RESPONSE_STYLES = ["Professional", "Friendly", "Formal", "Short", "Detailed"] as const;
export const LANGUAGES = ["English", "Nepali", "Hindi", "Japanese"] as const;

/** Builds the system prompt sent to the model when the owner hasn't written
 * a custom one - keeps the chat behavior in sync with the simple settings. */
export function buildDefaultSystemPrompt(assistant: {
  name: string;
  purposes: string[];
  responseStyle: string;
  language: string;
}): string {
  const purposeText = assistant.purposes.length ? assistant.purposes.join(", ") : "general customer support";
  return `You are ${assistant.name}, an AI assistant for this business. You help with: ${purposeText}. Respond in a ${assistant.responseStyle.toLowerCase()} tone, in ${assistant.language}. Keep answers accurate, concise, and helpful. If you don't know something specific to this business, say so honestly rather than guessing.`;
}

// GET /api/assistant - fetches this workspace's assistant config,
// auto-creating sensible defaults the first time it's requested.
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const membership = await getCurrentMembership(req.auth!.userId);
  if (!membership) return res.status(400).json({ error: "You're not part of a workspace yet" });

  let assistant = await prisma.assistant.findUnique({ where: { organizationId: membership.organizationId } });
  if (!assistant) {
    assistant = await prisma.assistant.create({ data: { organizationId: membership.organizationId } });
  }

  res.json({ assistant });
});

const updateAssistantSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  purposes: z.array(z.enum(PURPOSES)).optional(),
  preferredModel: z.enum(PREFERRED_MODELS).optional(),
  responseStyle: z.enum(RESPONSE_STYLES).optional(),
  language: z.enum(LANGUAGES).optional(),
  welcomeMessage: z.string().min(1).max(200).optional(),
  systemPrompt: z.string().max(2000).optional().nullable(),
});

// PATCH /api/assistant - OWNER or ADMIN only
router.patch("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const membership = await getCurrentMembership(req.auth!.userId);
  if (!membership) return res.status(400).json({ error: "You're not part of a workspace yet" });
  if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
    return res.status(403).json({ error: "Only owners and admins can edit the AI assistant" });
  }

  const parsed = updateAssistantSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const assistant = await prisma.assistant.upsert({
    where: { organizationId: membership.organizationId },
    update: parsed.data,
    create: { organizationId: membership.organizationId, ...parsed.data },
  });

  res.json({ assistant });
});

export default router;