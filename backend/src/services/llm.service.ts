interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterResponse {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
}

const FREE_MODEL_CHAIN = [
  "liquid/lfm-2.5-embedding-350m:free",
  "poolside/laguna-xs-2.1:free",
  "cohere/north-mini-code:free",
  "poolside/laguna-m.1:free",
  "google/gemma-4-31b-it:free",
  "openrouter/free",
];

export async function generateAIResponse(
  messages: ChatMessage[]
): Promise<{
  text: string;
  modelUsed: string;
}> {
  let lastError: unknown;

  for (const model of FREE_MODEL_CHAIN) {
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY ?? ""}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.CLIENT_URL ?? "http://localhost:3000",
        "X-Title": "Relay",
      };

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            model,
            messages,
          }),
        }
      );

      if (!response.ok) {
        lastError = await response.text();
        continue;
      }

      const data = (await response.json()) as OpenRouterResponse;

      const text = data.choices?.[0]?.message?.content;

      if (!text) {
        lastError = "Empty response";
        continue;
      }

      return {
        text,
        modelUsed: model,
      };
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(`All models failed. ${lastError}`);
}