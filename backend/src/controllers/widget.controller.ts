import { Response } from "express";
import { prisma } from "@/config/postgres";
import { RelayRequest } from "@/middleware/verifyRelayApiKey";
import { generateAIResponse } from "@/services/llm.service";
import { findRelevantChunks } from "@/utils/retrieval";

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

    const [assistant, allChunks] = await Promise.all([
      prisma.assistant.findUnique({
        where: { organizationId: req.organization.id },
      }),
      prisma.knowledgeChunk.findMany({
        where: {
          document: { organizationId: req.organization.id, status: "READY" },
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
      (assistant?.systemPrompt ??
        `You are ${assistant?.name ?? "Relay AI"}, a helpful assistant for this business. Respond in ${assistant?.language ?? "English"}, in a ${assistant?.responseStyle ?? "Friendly"} tone. Keep answers concise and useful.`) +
      knowledgeContext;

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