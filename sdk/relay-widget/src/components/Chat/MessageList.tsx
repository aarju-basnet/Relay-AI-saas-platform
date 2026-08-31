import MessageBubble from "./MessageBubble";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  message: string;
}

interface MessageListProps {
  messages: ChatMessage[];
}

export default function MessageList({
  messages,
}: MessageListProps) {
  return (
    <div
      className="
        flex-1
        overflow-y-auto
        bg-gray-50
        px-5
        py-5
      "
    >
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <div className="max-w-xs rounded-2xl bg-white p-5 text-center shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">
              👋 Welcome to Relay AI
            </h3>

            <p className="mt-2 text-xs leading-6 text-gray-500">
              Ask anything about the business,
              products, services or support.
            </p>
          </div>
        </div>
      ) : (
        messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            role={msg.role}
            message={msg.message}
          />
        ))
      )}
    </div>
  );
}