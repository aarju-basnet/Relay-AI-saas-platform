import { MessageCircle, X } from "lucide-react";

interface ChatBubbleProps {
  isOpen: boolean;
  onClick: () => void;
}

export default function ChatBubble({
  isOpen,
  onClick,
}: ChatBubbleProps) {
  return (
    <button
      onClick={onClick}
      className="
        fixed
        bottom-6
        right-6
        z-[999999]
        flex
        h-16
        w-16
        items-center
        justify-center
        rounded-full
        bg-[#C46B48]
        text-white
        shadow-xl
        transition-all
        duration-300
        hover:scale-110
        active:scale-95
      "
    >
      {isOpen ? (
        <X size={28} />
      ) : (
        <MessageCircle size={28} />
      )}
    </button>
  );
}