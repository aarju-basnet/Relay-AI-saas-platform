import { FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MailWarning } from "lucide-react";
import { RelayMark } from "@/components/Logo";
import DashboardOverview from '@/Dashboard/DashboardOverview'
import { Sidebar } from "@/components/Sidebar";
import { MessageBubble } from "@/components/MessageBubble";
import Settings from "@/pages/Settings";
import DeveloperDashboard from '@/pages/DeveloperDashboard'
import Analytics from "@/pages/Analytics";
import Team from "@/pages/Team";
import BillingSetting from '@/Settings/BillingSetting'
import TeamChat from "@/components/TeamChat";
import KnowledgeBase from "@/components/KnowledgeBase";
import { useAuth } from "@/context/AuthContext";
import {
  api,
  ApiError,
  Assistant,
  Conversation,
  Message,
  DashboardOverview as DashboardOverviewType,
} from "@/lib/api";

import {
  MessageSquare,
  BookOpen,
  Bot,
  Inbox,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  Sparkles,
  Zap,
  Cpu,
} from "lucide-react";

type DashboardPage =
  | "dashboard"
  | "inbox"
  | "analytics"
  | "knowledge"
  | "models"
  | "team"
  | "billing"
  | "settings"
  | "developer";

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
  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const [overview, setOverview] = useState<DashboardOverviewType | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [page, setPage] = useState<DashboardPage>("dashboard");
  const [settingsPage, setSettingsPage] = useState("workspace");
  const [developerMode, setDeveloperMode] = useState(false);

  const [chatActive, setChatActive] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [conversationRes, dashboardRes, advancedRes] = await Promise.all([
          api.listConversations(),
          api.getDashboardOverview(),
          api.getAdvancedSettings(),
        ]);

        setConversations(conversationRes.conversations);
        setOverview(dashboardRes.overview);
        setDeveloperMode(advancedRes.settings.developerMode);

        try {
          const assistantRes = await api.getAssistant();
          setAssistant(assistantRes.assistant);
        } catch {
          // Ignore until assistant API exists
        }
      } catch (err) {
        console.error("Dashboard loading failed:", err);
      }
    }

    loadDashboard();
  }, []);

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
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function handleSelect(id: string) {
  setChatActive(true);
  setActiveId(id);
  setError(null);
  const res = await api.getConversation(id);
  setMessages(res.conversation.messages);
}

   function handleNewChat() {
  setChatActive(true);
  setActiveId(null);
  setMessages([]);
  setError(null);
}

  async function handleRename(id: string, title: string) {
    const res = await api.renameConversation(id, title);
    setConversations((prev) =>
      prev.map((c) =>
        c._id === id ? { ...c, title: res.conversation.title } : c
      )
    );
  }

  async function handleDeleteConversation(id: string) {
    await api.deleteConversation(id);
    setConversations((prev) => prev.filter((c) => c._id !== id));
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
    }
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setError(null);
    setInput("");
    setSending(true);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: trimmed, createdAt: new Date().toISOString() },
    ]);

    try {
      const res = await api.sendChatMessage(trimmed, activeId ?? undefined);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.reply,
          createdAt: new Date().toISOString(),
          metadata: { model: res.modelUsed },
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

const [workspaceLogo, setWorkspaceLogo] = useState<string | null>(null);

useEffect(() => {
  api.getWorkspaceSettings()
    .then((res) => setWorkspaceLogo(res.workspace.logoUrl))
    .catch(() => {}); // fine if it fails, avatar just falls back to initials
}, []);


  return (
    <div className="flex h-screen">
     <Sidebar
  page={page}
  setPage={setPage}
  settingsPage={settingsPage}
  setSettingsPage={setSettingsPage}
  developerMode={developerMode}
  conversations={conversations}
  activeId={activeId}
  onSelect={handleSelect}
  onNewChat={handleNewChat}
  onRename={handleRename}
  onDelete={handleDeleteConversation}
/>

      <main className="flex-1 overflow-y-auto bg-white">

        {/* ── DASHBOARD ─────────────────────────────────── */}

              {/* ── DASHBOARD ─────────────────────────────────── */}

        {page === "dashboard" && (
  chatActive ? (
            /* ── ACTIVE CONVERSATION VIEW ── */
            <div className="flex flex-col h-full">

              <div className="flex items-center justify-between border-b border-border px-6 py-3">
                <button
  onClick={() => {
    setChatActive(false);
    setActiveId(null);
    setMessages([]);
  }}
  className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition"
>
  ← Back to overview
</button>

                <span className="text-xs text-ink-faint">
                  {messages.length === 0 ? "New conversation" : "Conversation"}
                </span>
              </div>

              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-6 py-6 space-y-4"
              >
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-center">
                    <div>
                      <p className="text-sm font-medium text-ink-muted">
                        Start a new conversation
                      </p>
                      <p className="text-xs text-ink-faint mt-1">
                        Ask Relay AI anything about your business.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <MessageBubble key={i} message={msg} />
                  ))
                )}

                {sending && (
                  <div className="flex justify-start">
                    <div className="panel rounded-bl-sm px-4 py-2.5">
                      <TypingDots />
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="mx-6 mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600">
                  {error}
                </div>
              )}

              <form
                onSubmit={handleSend}
                className="border-t border-border p-4 flex items-center gap-3"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything..."
                  disabled={sending}
                  className="flex-1 rounded-xl border border-border bg-canvas px-4 py-3 text-sm outline-none focus:border-copper transition"
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="rounded-xl bg-copper px-5 py-3 text-sm font-medium text-white hover:bg-copper/90 transition disabled:opacity-50"
                >
                  Send
                </button>
              </form>

            </div>
          ) : (
            /* ── OVERVIEW ── */
            <div className="p-8 space-y-6">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-4">
                  <WorkspaceAvatar
                    name={user?.workspace?.name}
                    logoUrl={workspaceLogo}
                  />

                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-base font-semibold">
                        {user?.workspace?.name}
                      </h1>
                      <RoleBadge role={user?.workspace?.role} />
                    </div>

                    <p className="text-ink-muted mt-1">
                      Welcome back,{" "}
                      <span className="font-semibold text-ink">
                        {user?.name || user?.email}
                      </span>{" "}
                      👋
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                  </span>
                  <span className="text-xs font-medium text-ink-muted">
                    All systems operational
                  </span>
                </div>

              </div>

              <DashboardOverview overview={overview ?? undefined} />

            </div>
          )
        )}

        {/* ── INBOX ─────────────────────────────────────── */}

            {page === "inbox" && <TeamChat />}
        {/* ── ANALYTICS ─────────────────────────────────── */}

        {page === "analytics" && (
          <div className="p-8">
            <Analytics />
          </div>
        )}

        {/* ── KNOWLEDGE BASE ────────────────────────────── */}

                {/* ── KNOWLEDGE BASE ────────────────────────────── */}

        {page === "knowledge" && (
          <div className="p-8">
            <KnowledgeBase />
          </div>
        )}

        {/* ── AI MODELS ─────────────────────────────────── */}

        {page === "models" && (
          <div className="p-8 space-y-6">

            <div>

              <h1 className="text-xl font-semibold">
                AI Models
              </h1>

              <p className="text-xs text-ink-muted mt-1">
                Configure which AI models power your assistant.
              </p>

            </div>

            <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">

              <div className="flex items-center gap-2 border-b border-border px-5 py-4">

                <Bot size={17} className="text-copper" />

                <h2 className="text-sm font-semibold">
                  Active Model
                </h2>

              </div>

              <div className="p-5">

                <div className="flex items-center justify-between rounded-xl border border-copper/20 bg-copper/5 px-5 py-4">

                  <div className="flex items-center gap-3">

                    <div className="w-9 h-9 rounded-full bg-copper/10 flex items-center justify-center">
                      <Cpu size={16} className="text-copper" />
                    </div>

                    <div>

                      <p className="text-xs font-semibold">
                        Auto (Free Fallback Chain)
                      </p>

                      <p className="text-[11px] text-ink-muted mt-0.5">
                        Automatically routes to the best available free model
                      </p>

                    </div>

                  </div>

                  <span className="rounded-full bg-green-100 px-3 py-1 text-[11px] font-medium text-green-700">
                    Active
                  </span>

                </div>

              </div>

            </div>

            <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">

              <div className="flex items-center gap-2 border-b border-border px-5 py-4">

                <Sparkles size={17} className="text-copper" />

                <h2 className="text-sm font-semibold">
                  Available Models
                </h2>

              </div>

              <div className="divide-y divide-border">

                {[
                  { name: "Gemma 4 31B", provider: "Google", status: "Free", icon: "🟢" },
                  { name: "Laguna M.1", provider: "Poolside", status: "Free", icon: "🟢" },
                  { name: "North Mini Code", provider: "Cohere", status: "Free", icon: "🟢" },
                  { name: "GPT-5", provider: "OpenAI", status: "Pro", icon: "🔒" },
                  { name: "Claude Opus", provider: "Anthropic", status: "Pro", icon: "🔒" },
                  { name: "Gemini Ultra", provider: "Google", status: "Pro", icon: "🔒" },
                ].map((model) => (

                  <div
                    key={model.name}
                    className="flex items-center justify-between px-5 py-4"
                  >

                    <div className="flex items-center gap-3">

                      <span className="text-base">
                        {model.icon}
                      </span>

                      <div>

                        <p className="text-xs font-semibold">
                          {model.name}
                        </p>

                        <p className="text-[11px] text-ink-muted mt-0.5">
                          {model.provider}
                        </p>

                      </div>

                    </div>

                    <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                      model.status === "Free"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {model.status}
                    </span>

                  </div>

                ))}

              </div>

            </div>

            <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">

              <div className="flex items-center gap-2 border-b border-border px-5 py-4">

                <Zap size={17} className="text-copper" />

                <h2 className="text-sm font-semibold">
                  Bring Your Own API Key
                </h2>

              </div>

              <div className="flex flex-col items-center justify-center py-10 text-center">

                <Zap size={32} className="text-copper mb-3" />

                <h3 className="text-sm font-semibold">
                  Coming Soon
                </h3>

                <p className="text-[11px] text-ink-muted mt-1 max-w-xs">
                  Connect your own OpenAI, Anthropic or Google API key to unlock premium models.
                </p>

              </div>

            </div>

          </div>
        )}

        {/* ── TEAM ──────────────────────────────────────── */}

        {page === "team" && (
          <div>
            <Team />
          </div>
        )}

        {/* ── BILLING ───────────────────────────────────── */}

        {page === "billing" && (
          <div className="p-8">
            <BillingSetting />
          </div>
        )}

        {/* ── SETTINGS ──────────────────────────────────── */}

        {page === "settings" && (
          <Settings settingsPage={settingsPage} />
        )}

        {/* ── DEVELOPER ─────────────────────────────────── */}

        {page === "developer" && (
          <DeveloperDashboard />
        )}

      </main>
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
        {sent
          ? "Verification email sent - check your inbox."
          : "Verify your email to unlock everything."}
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

function WorkspaceAvatar({
  name,
  logoUrl,
}: {
  name?: string;
  logoUrl?: string | null;
}) {
  const initials = (name ?? "R")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${name ?? "Workspace"} logo`}
        className="h-12 w-12 rounded-xl object-cover border border-border shadow-sm"
      />
    );
  }

  return (
    <div className="h-12 w-12 rounded-xl bg-copper/10 border border-copper/20 flex items-center justify-center">
      <span className="text-sm font-bold text-copper">{initials}</span>
    </div>
  );
}

function RoleBadge({ role }: { role?: string }) {
  const label =
    role === "OWNER" ? "Owner" : role === "ADMIN" ? "Admin" : "Team Member";

  return (
    <span className="rounded-full bg-copper/10 px-2.5 py-0.5 text-[11px] font-medium text-copper">
      {label}
    </span>
  );
}