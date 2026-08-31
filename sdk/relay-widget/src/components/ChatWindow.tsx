import { X } from "lucide-react";

import MessageList, {
type  ChatMessage,
} from "./Chat/MessageList";

import MessageInput from "./Chat/MessageInput";

interface ChatWindowProps {
  isOpen: boolean;

  onClose: () => void;

  messages: ChatMessage[];

  loading: boolean;

  onSend?: (message: string) => void;
}

export default function ChatWindow({
  isOpen,
  onClose,
  messages,
  loading,
  onSend,
}: ChatWindowProps) {
  if (!isOpen) return null;

  return (
    <div
      className="
      fixed
      bottom-24
      right-6
      z-[999998]
      flex
      h-[650px]
      w-[380px]
      flex-col
      overflow-hidden
      rounded-2xl
      border
      border-gray-200
      bg-white
      shadow-2xl
    "
    >
      {/* Header */}

      <div className="flex items-center justify-between bg-[#C46B48] px-5 py-4 text-white">

        <div>

          <h2 className="text-base font-semibold">
            Relay AI
          </h2>

          <p className="text-xs opacity-80">
            AI Business Assistant
          </p>

        </div>

        <button
          onClick={onClose}
          className="rounded-lg p-2 transition hover:bg-white/10"
        >
          <X size={20} />
        </button>

      </div>

      {/* Conversation */}

      <MessageList
        messages={messages}
      />

      {/* Input */}

      <MessageInput
        loading={loading}
        onSend={(message) =>
          onSend?.(message)
        }
      />

    </div>
  );
}