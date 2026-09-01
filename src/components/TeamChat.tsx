import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, Send, Search, Crown, Copy, Trash2, Check } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { api, ApiError, TeamMessage, TeamMember } from "@/lib/api";

export default function TeamChat() {
  const { user } = useAuth();

  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const canModerate =
    user?.workspace?.role === "OWNER" || user?.workspace?.role === "ADMIN";

  useEffect(() => {
    Promise.all([api.getTeamMessages(), api.getTeamMembers()])
      .then(([msgRes, teamRes]) => {
        setMessages(msgRes.messages);
        setMembers(teamRes.members);
      })
      .catch((err) => {
        console.error(err);
        setError("Couldn't load team messages.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const memberMap = useMemo(() => {
    const map = new Map<string, TeamMember>();
    members.forEach((m) => map.set(m.id, m));
    return map;
  }, [members]);

  const filteredMessages = useMemo(() => {
    if (!search.trim()) return messages;
    const q = search.toLowerCase();
    return messages.filter(
      (m) =>
        m.content.toLowerCase().includes(q) ||
        m.userName.toLowerCase().includes(q)
    );
  }, [messages, search]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError(null);
    setInput("");

    try {
      const res = await api.sendTeamMessage(trimmed);
      setMessages((prev) => [...prev, res.message]);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't send that message."
      );
    } finally {
      setSending(false);
    }
  }

  function handleCopy(content: string, id: string) {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  async function handleDelete(id: string) {
    const ok = window.confirm("Delete this message?");
    if (!ok) return;

    try {
      await api.deleteTeamMessage(id);
      setMessages((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="flex flex-col h-full">

      <div className="border-b border-border px-6 py-4 space-y-3">
        <div>
          <h1 className="text-xl font-semibold">Team Chat</h1>
          <p className="text-xs text-ink-muted mt-1">
            Talk with your team in one shared space.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-border bg-canvas px-3 py-2">
          <Search size={14} className="text-ink-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages..."
            className="flex-1 text-xs bg-transparent outline-none text-ink placeholder:text-ink-faint"
          />
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {loading ? (
          <p className="text-xs text-ink-faint text-center py-10">Loading…</p>
        ) : filteredMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <MessageSquare size={32} className="text-ink-faint mb-3 mx-auto" />
              <p className="text-sm font-medium text-ink-muted">
                {search ? "No messages match your search" : "No messages yet"}
              </p>
              {!search && (
                <p className="text-xs text-ink-faint mt-1">
                  Say hello to your team.
                </p>
              )}
            </div>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isMe = msg.userId === user?.id;
            const member = memberMap.get(msg.userId);
            const isLeadership =
              member?.role === "OWNER" || member?.role === "ADMIN";
            const canDelete = isMe || canModerate;

            return (
              <div
                key={msg._id}
                className={`group flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}
              >
                <MemberAvatar
                  name={msg.userName}
                  avatarUrl={member?.avatarUrl}
                  isLeadership={isLeadership}
                />

                <div className={`max-w-[65%] flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                  {!isMe && (
                    <span className="text-[11px] text-ink-faint px-1">
                      {msg.userName}
                    </span>
                  )}

                  <div className={`flex items-center gap-1.5 ${isMe ? "flex-row-reverse" : ""}`}>
                    <div
                      className={
                        isMe
                          ? "bg-copper text-white rounded-2xl rounded-br-sm px-4 py-2.5"
                          : "bg-surface border border-border rounded-2xl rounded-bl-sm px-4 py-2.5"
                      }
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleCopy(msg.content, msg._id)}
                        title="Copy"
                        className="p-1.5 rounded-lg hover:bg-canvas text-ink-faint transition"
                      >
                        {copiedId === msg._id ? (
                          <Check size={12} className="text-green-600" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>

                      {canDelete && (
                        <button
                          onClick={() => handleDelete(msg._id)}
                          title="Delete"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-ink-faint hover:text-red-500 transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] text-ink-faint px-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && (
        <div className="mx-6 mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600">
          {error}
        </div>
      )}

      {user?.plan === "FREE" && (
        <div className="mx-6 mb-2 text-[11px] text-ink-faint">
          Free plan: 5 team messages per day. Upgrade to Pro for unlimited messaging.
        </div>
      )}

      <form onSubmit={handleSend} className="border-t border-border p-4 flex items-center gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message your team..."
          disabled={sending}
          className="flex-1 rounded-xl border border-border bg-canvas px-4 py-3 text-sm outline-none focus:border-copper transition"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-xl bg-copper px-5 py-3 text-sm font-medium text-white hover:bg-copper/90 transition disabled:opacity-50 flex items-center gap-2"
        >
          <Send size={14} />
          Send
        </button>
      </form>

    </div>
  );
}

function MemberAvatar({
  name,
  avatarUrl,
  isLeadership,
}: {
  name: string;
  avatarUrl?: string | null;
  isLeadership: boolean;
}) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="relative shrink-0">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-7 h-7 rounded-full object-cover border border-border"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-copper text-white flex items-center justify-center text-[11px] font-semibold">
          {initial}
        </div>
      )}

      {isLeadership && (
        <span
          title="Owner / Admin"
          className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-3.5 h-3.5 rounded-full bg-copper border-2 border-surface"
        >
          <Crown size={7} className="text-white" />
        </span>
      )}
    </div>
  );
}