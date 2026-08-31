interface MessageBubbleProps {
  role: "user" | "assistant";
  message: string;
}

export default function MessageBubble({
  role,
  message,
}: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={`mb-4 flex ${
        isUser
          ? "justify-end"
          : "justify-start"
      }`}
    >
      <div
        className={`
          max-w-[80%]
          rounded-2xl
          px-4
          py-3
          text-sm
          leading-6
          shadow-sm
          ${
            isUser
              ? "bg-[#C46B48] text-white rounded-br-md"
              : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
          }
        `}
      >
        {message}
      </div>
    </div>
  );
}