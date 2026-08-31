import { Response } from "express";
import { prisma } from "@/config/postgres";
import { RelayRequest } from "@/middleware/verifyRelayApiKey";
import { generateAIResponse } from "@/services/llm.service";

/*
 * GET/POST /api/widget/verify
 * Lets the widget confirm its API key works BEFORE rendering
 * the chat bubble — so a broken key shows nothing, not a broken UI.
 */
export async function verifyWidgetKey(req: RelayRequest, res: Response) {
  if (!req.organization) {
    return res.status(401).json({
      success: false,
      message: "Invalid API Key.",
    });
  }

  return res.json({
    success: true,
    organizationId: req.organization.id,
  });
}

/*
 * POST /api/widget/chat
 * Real AI chat, using the business's own Assistant configuration
 * (name, tone, language, system prompt) if they've set one up.
 */
export async function sendWidgetChatMessage(
  req: RelayRequest,
  res: Response
) {
  try {
    const { visitorId, sessionId, message } = req.body;

    if (!visitorId || !sessionId || !message) {
      return res.status(400).json({
        success: false,
        message: "visitorId, sessionId and message are required.",
      });
    }

    if (!req.organization) {
      return res.status(401).json({
        success: false,
        message: "Organization not found.",
      });
    }

    const assistant = await prisma.assistant.findUnique({
      where: { organizationId: req.organization.id },
    });

    const systemPrompt =
      assistant?.systemPrompt ??
      `You are ${assistant?.name ?? "Relay AI"}, a helpful assistant for this business. Respond in ${assistant?.language ?? "English"}, in a ${assistant?.responseStyle ?? "Friendly"} tone. Keep answers concise and useful.`;

    const { text, modelUsed } = await generateAIResponse([
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ]);

    return res.json({
      success: true,
      reply: text,
      modelUsed,
    });
  } catch (error) {
    console.error("Widget chat error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate a reply. Please try again.",
    });
  }
}