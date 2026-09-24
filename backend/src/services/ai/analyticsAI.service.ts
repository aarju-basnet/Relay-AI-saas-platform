import { generateAIResponse } from "@/services/llm.service";

export interface AnalyticsSummaryData {
  business: string;
  date: string;

  visitors: number;
  sessions: number;
  pageViews: number;
  clicks: number;
  chats: number;
  messages: number;
  leads: number;
  purchases: number;
}

export type AIProvider =
  | "RELAY"
  | "CUSTOM";

export interface AISummaryOptions {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
}

interface ChatMessage {
  role:
    | "system"
    | "user"
    | "assistant";
  content: string;
}

export async function generateAnalyticsSummary(
  data: AnalyticsSummaryData,
  options: AISummaryOptions
): Promise<string> {
  const prompt =
    buildAnalyticsPrompt(data);

  if (options.provider === "RELAY") {
    return generateWithRelayAI(prompt);
  }

  if (options.provider === "CUSTOM") {
    if (!options.apiKey) {
      throw new Error(
        "Custom AI API key is required."
      );
    }

    return generateWithCustomAI(
      prompt,
      options.apiKey,
      options.model
    );
  }

  throw new Error(
    "Unsupported AI provider."
  );
}

function buildAnalyticsPrompt(
  data: AnalyticsSummaryData
): string {
  return `
You are Relay AI, a business analytics assistant.

Today's website analytics for ${data.business}:
Visitors: ${data.visitors}
Sessions: ${data.sessions}
Page views: ${data.pageViews}
Button clicks: ${data.clicks}
Chat opens: ${data.chats}
Messages sent: ${data.messages}
Leads generated: ${data.leads}
Purchases: ${data.purchases}

Write a short summary for a business owner in 2-3 sentences (under 60 words total).
Mention the most notable number, one thing worth watching, and at most one brief
suggestion - only if genuinely useful. Skip anything not worth mentioning.

Important:
- Only use the numbers provided.
- Never invent statistics.
- Do not claim growth or decline unless comparison data is provided.
- No headings, no numbered lists, no bullet points - plain prose only.
`;
}

async function generateWithRelayAI(
  prompt: string
): Promise<string> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are Relay AI. You analyze business website analytics and provide concise, useful business insights.",
    },
    {
      role: "user",
      content: prompt,
    },
  ];

  const result =
    await generateAIResponse(messages);

  return result.text;
}

async function generateWithCustomAI(
  prompt: string,
  apiKey: string,
  model?: string
): Promise<string> {
  /*
   * Custom AI support will be implemented
   * separately.
   *
   * The API key must remain on the backend.
   */

  if (!apiKey) {
    throw new Error(
      "Custom AI API key is required."
    );
  }

  console.log(
    "Custom AI model:",
    model
  );

  // Not implemented yet.
  // We will add BYO AI provider support
  // after Relay AI is working.

  throw new Error(
    "Custom AI provider is not implemented yet."
  );
}