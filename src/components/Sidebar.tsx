import { Plus, LogOut, Sparkles, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Conversation } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import { Logo } from "@/components/Logo";

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

export function Sidebar({ conversations, activeId, onSelect, onNewChat }: SidebarProps) {
  const { user, logout } = useAuth();
  const [openingPortal, setOpeningPortal] = useState(false);

  async function handleManageBilling() {
    setOpeningPortal(true);
    try {
      const { url } = await api.createPortalSession();
      window.location.href = url;
    } catch (err) {
      console.error(err instanceof ApiError ? err.message : err);
      setOpeningPortal(false);
    }
  }

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-surface flex flex-col h-screen">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <Logo size="sm" />
          {user && (
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                user.plan === "PRO" ? "bg-copper-dim text-copper" : "bg-canvas text-ink-faint"
              }`}
            >
              {user.plan === "PRO" ? "PRO" : "FREE"}
            </span>
          )}
        </div>
        <button onClick={onNewChat} className="btn-secondary w-full text-sm flex items-center justify-center gap-1.5">
          <Plus size={15} />
          New conversation
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 && (
          <p className="text-xs text-ink-faint text-center mt-6 px-2">
            No conversations yet. Start one to see it here.
          </p>
        )}
        {conversations.map((c) => (
          <button
            key={c._id}
            onClick={() => onSelect(c._id)}
            className={`w-full text-left px-3 py-2.5 rounded-panel text-sm truncate transition-colors ${
              activeId === c._id
                ? "bg-copper-dim text-ink font-medium"
                : "text-ink-muted hover:bg-canvas"
            }`}
          >
            {c.title || "Untitled conversation"}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-border space-y-2">
        {user?.plan === "FREE" ? (
          <Link
            to="/pricing"
            className="flex items-center gap-2 px-3 py-2.5 rounded-panel text-sm font-medium text-copper bg-copper-dim hover:bg-copper/20 transition-colors"
          >
            <Sparkles size={15} />
            Upgrade to Pro
          </Link>
        ) : (
          <button
            onClick={handleManageBilling}
            disabled={openingPortal}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-panel text-sm font-medium text-ink-muted hover:bg-canvas transition-colors"
          >
            <Settings size={15} />
            {openingPortal ? "Opening…" : "Manage billing"}
          </button>
        )}

        <div className="flex items-center justify-between gap-2 px-1">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || user?.email}</p>
            {user?.name && <p className="text-xs text-ink-faint truncate">{user.email}</p>}
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="text-ink-faint hover:text-danger shrink-0 p-1.5 rounded-md hover:bg-danger-dim transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
