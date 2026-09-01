import { Message } from "@/lib/api";

const MODEL_LABELS: Record<string, string> = {
  "poolside/laguna-xs-2.1:free": "Laguna XS 2.1",
  "cohere/north-mini-code:free": "North Mini Code",
  "poolside/laguna-m.1:free": "Laguna M.1",
  "google/gemma-4-31b-it:free": "Gemma 4 31B",
  "openrouter/free": "Auto-router",
};

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const modelUsed = message.metadata?.model;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1.5`}>
        <div
          className={
            isUser
              ? "bg-copper text-white rounded-panel rounded-br-sm px-4 py-2.5 shadow-sm"
              : "panel rounded-bl-sm px-4 py-2.5"
          }
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>

        {!isUser && modelUsed && (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-teal bg-teal-dim px-2 py-1 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-teal" />
            {MODEL_LABELS[modelUsed] || modelUsed}
          </span>
        )}
      </div>
    </div>
  );
}
