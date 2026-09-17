import { useState, useEffect } from "react";

import ChatBubble from "./ChatBubble";
import ChatWindow from "./ChatWindow";
import type { ChatMessage } from "./Chat/MessageList";

import { getTracker } from "../core/tracker";
import { RelayApi } from "../api/relayApi";
import { ChatService } from "../chat/chatService";
import type { RelayWidgetConfig } from "../types/widget";

interface WidgetProps {
  config: RelayWidgetConfig;
}

export default function Widget({ config }: WidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // Mode is unknown until verify() resolves. Analytics-only keys never
  // unlock the chat bubble at all - only Assistant keys do. Rendering
  // nothing while unknown avoids a flash of the bubble before we've
  // confirmed the key actually grants chat access.
  const [mode, setMode] = useState<"assistant" | "analytics" | null>(null);

  const [api] = useState(() => new RelayApi(config.apiKey, config.apiBaseUrl));
  const [chatService] = useState(() => new ChatService(api));

  useEffect(() => {
    let cancelled = false;

    api
      .verify()
      .then((res) => {
        if (!cancelled) setMode(res.mode);
      })
      .catch((error) => {
        console.error("Relay Widget: key verification failed.", error);
        if (!cancelled) setMode("analytics");
      });

    return () => {
      cancelled = true;
    };
  }, [api]);

  const handleOpen = () => {
    setIsOpen(true);
    getTracker()?.chatOpened();
  };

  const handleClose = () => {
    setIsOpen(false);
    getTracker()?.chatClosed();
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    getTracker()?.messageSent(message.length);

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      message,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await chatService.sendMessage(message);

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        message: response.reply,
      };

      setMessages((prev) => [...prev, aiMessage]);
      getTracker()?.messageReceived();
    } catch (error) {
      console.error("Relay chat failed:", error);

      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        message: "Sorry, something went wrong. Please try again.",
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Analytics-only keys (or unverified/failed keys) never render the
  // bubble or chat window - the widget silently does nothing visible,
  // while the tracker (mounted separately in the SDK's entry point)
  // still records analytics events as normal.
  if (mode !== "assistant") {
    return null;
  }

  return (
    <>
      <ChatWindow
        isOpen={isOpen}
        onClose={handleClose}
        messages={messages}
        loading={loading}
        onSend={handleSendMessage}
      />

      <ChatBubble isOpen={isOpen} onClick={handleOpen} />
    </>
  );
}