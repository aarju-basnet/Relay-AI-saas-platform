import { useState } from "react";
import { Send } from "lucide-react";

interface MessageInputProps {
  loading?: boolean;
  onSend: (message: string) => void;
}

export default function MessageInput({
  loading = false,
  onSend,
}: MessageInputProps) {
  const [message, setMessage] =
    useState("");

  const sendMessage = () => {
    const text = message.trim();

    if (!text) return;

    onSend(text);

    setMessage("");
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      e.key === "Enter" &&
      !loading
    ) {
      sendMessage();
    }
  };

  return (
    <div className="border-t bg-white p-4">

      <div className="flex items-center gap-3">

        <input
          value={message}
          onChange={(e) =>
            setMessage(e.target.value)
          }
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="Ask anything..."
          className="
            flex-1
            rounded-xl
            border
            border-gray-300
            px-4
            py-3
            text-sm
            outline-none
            transition
            focus:border-[#C46B48]
          "
        />

        <button
          onClick={sendMessage}
          disabled={
            loading ||
            message.trim() === ""
          }
          className="
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-xl
            bg-[#C46B48]
            text-white
            transition
            hover:bg-[#B45E3D]
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          <Send size={18} />
        </button>

      </div>

    </div>
  );
}