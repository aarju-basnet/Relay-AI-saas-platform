import { FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Send, MailWarning, PartyPopper } from "lucide-react";
import { RelayMark } from "@/components/Logo";
import { Sidebar } from "@/components/Sidebar";
import { MessageBubble } from "@/components/MessageBubble";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError, Conversation, Message } from "@/lib/api";

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.listConversations().then((res) => setConversations(res.conversations)).catch(() => {});
  }, []);

  // After returning from Stripe checkout, refresh the user so the plan
  // badge updates, and show a one-time success banner.
  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      refreshUser();
      setShowUpgradeBanner(true);
      searchParams.delete("upgraded");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSelect(id: string) {
    setActiveId(id);
    setError(null);
    const res = await api.getConversation(id);
    setMessages(res.conversation.messages);
  }

  function handleNewChat() {
    setActiveId(null);
    setMessages([]);
    setError(null);
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setError(null);
    setInput("");
    setSending(true);

    // optimistic append of the user's own message
    setMessages((prev) => [...prev, { role: "user", content: trimmed, createdAt: new Date().toISOString() }]);

    try {
      const res = await api.sendChatMessage(trimmed, activeId ?? undefined);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.reply,
          createdAt: new Date().toISOString(),
          metadata: { modelUsed: res.modelUsed },
        },
      ]);

      if (!activeId) {
        setActiveId(res.conversationId);
        const list = await api.listConversations();
        setConversations(list.conversations);
      }
    } catch {
      setError("Couldn't reach any AI model right now. Try again in a moment.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={handleSelect}
        onNewChat={handleNewChat}
      />

      <main className="flex-1 flex flex-col">
        {showUpgradeBanner && (
          <div className="bg-teal-dim border-b border-teal/20 px-6 py-2.5 flex items-center justify-between text-sm">
            <span className="text-ink flex items-center gap-2">
              <PartyPopper size={15} className="text-teal shrink-0" />
              You're on Pro now - enjoy the higher rate limit.
            </span>
            <button
              onClick={() => setShowUpgradeBanner(false)}
              className="text-ink-faint hover:text-ink text-xs shrink-0 ml-4"
            >
              Dismiss
            </button>
          </div>
        )}
        {user && !user.emailVerified && <VerifyBanner />}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8">
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">
              {messages.map((m, i) => (
                <MessageBubble key={i} message={m} />
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="panel px-4 py-2.5 rounded-bl-sm">
                    <TypingDots />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-border bg-surface px-6 py-4">
          <div className="max-w-2xl mx-auto">
            {error && <p className="text-sm text-danger mb-2">{error}</p>}
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything…"
                className="input-field"
                autoFocus
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="btn-primary shrink-0 flex items-center gap-1.5"
              >
                <Send size={15} />
                Send
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-4">
      <div className="w-12 h-12 rounded-panel bg-copper-dim flex items-center justify-center mb-4">
        <RelayMark className="w-6 h-6 text-copper" />
      </div>
      <h2 className="text-lg font-semibold mb-1">Start a conversation</h2>
      <p className="text-ink-muted text-sm max-w-xs">
        Every reply shows which free model answered it, live, on the fallback chain.
      </p>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-1 items-center h-4">
      <span className="w-1.5 h-1.5 rounded-full bg-ink-faint animate-bounce [animation-delay:-0.3s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-ink-faint animate-bounce [animation-delay:-0.15s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-ink-faint animate-bounce" />
    </div>
  );
}

function VerifyBanner() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResend() {
    setSending(true);
    setError(null);
    try {
      await api.resendVerification();
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't send that, try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-copper-dim border-b border-copper/20 px-6 py-2.5 flex items-center justify-between text-sm">
      <span className="text-ink-muted flex items-center gap-2">
        <MailWarning size={15} className="text-copper shrink-0" />
        {sent ? "Verification email sent - check your inbox." : "Verify your email to unlock everything."}
        {error && <span className="text-danger ml-2">{error}</span>}
      </span>
      {!sent && (
        <button
          onClick={handleResend}
          disabled={sending}
          className="text-copper hover:text-copper-bright font-medium shrink-0 ml-4"
        >
          {sending ? "Sending…" : "Resend email"}
        </button>
      )}
    </div>
  );
}
