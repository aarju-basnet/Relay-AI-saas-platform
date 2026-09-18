import {
  Plus,
  Sparkles,
  Settings,
  BarChart3,
  Users,
  Wrench,
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  CreditCard,
  PanelLeftClose,
  PanelLeftOpen,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { DashboardPage } from "@/pages/Dashboard";
import { Conversation, api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Logo, RelayMark } from "@/components/Logo";

interface SidebarProps {
  page: DashboardPage;
  setPage: (page: DashboardPage) => void;
  settingsPage: string;
  setSettingsPage: (page: string) => void;
  developerMode?: boolean;
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onRename: (id: string, title: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const RAIL_COLLAPSED_WIDTH = 60;
const RAIL_EXPANDED_WIDTH = 240;
const SETTINGS_PANEL_WIDTH = 240;

const SETTINGS_GROUPS = [
  {
    heading: "Configuration",
    items: [
      { id: "workspace", label: "Workspace" },
      { id: "team", label: "Team" },
      { id: "appearance", label: "Appearance" },
    ],
  },
  {
    heading: "Security",
    items: [
      { id: "security", label: "Security" },
      { id: "apikeys", label: "API Keys" },
      { id: "notifications", label: "Notifications" },
    ],
  },
  {
    heading: "Billing",
    items: [{ id: "billing", label: "Billing" }],
  },
  {
  heading: "Billing",
  items: [
    { id: "billing", label: "Billing" },
    { id: "usage", label: "Usage" },
  ],
},
  {
    heading: "Advanced",
    items: [{ id: "advanced", label: "Advanced" }],
  },
];

export function Sidebar({
  page,
  setPage,
  settingsPage,
  setSettingsPage,
  developerMode,
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onRename,
  onDelete,
}: SidebarProps) {
  const { user, activeWorkspace } = useAuth();

  // `collapsed` = the PINNED state, toggled explicitly by clicking the
  // rail button. Starts collapsed (icon rail) by default now.
  const [collapsed, setCollapsed] = useState(true);

  // `hovering` = a temporary peek while collapsed - doesn't change the
  // pinned state, just visually expands the rail as an overlay without
  // shifting the page's layout underneath it.
  const [hovering, setHovering] = useState(false);

  // Whether Settings has its own persistent second panel open. While
  // true, the main rail is forced to icon-only - a labeled rail AND a
  // labeled settings panel side by side would just be two competing
  // sidebars, so only one shows labels at a time.
  const showSettingsPanel = page === "settings";

  // Whether the main rail currently SHOWS as expanded (labels visible,
  // wider) - true if explicitly pinned open or hovered, unless the
  // settings panel has taken over the "expanded" role instead.
  const expanded = !showSettingsPanel && (!collapsed || hovering);

  const [openingPortal, setOpeningPortal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }

    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  const canManage =
    activeWorkspace?.role === "OWNER" || activeWorkspace?.role === "ADMIN";

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

  function startRename(conv: Conversation) {
    setOpenMenuId(null);
    setRenamingId(conv._id);
    setRenameValue(conv.title || "");
  }

  async function confirmRename(id: string) {
    const trimmed = renameValue.trim();
    if (!trimmed) return;

    setBusyId(id);
    try {
      await onRename(id, trimmed);
      setRenamingId(null);
    } catch (err) {
      console.error(err instanceof ApiError ? err.message : err);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    const ok = window.confirm(
      "Delete this conversation? This cannot be undone."
    );
    if (!ok) return;

    setOpenMenuId(null);
    setBusyId(id);
    try {
      await onDelete(id);
    } catch (err) {
      console.error(err instanceof ApiError ? err.message : err);
    } finally {
      setBusyId(null);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }

  const NAVIGATION: { id: DashboardPage; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "inbox", label: "Inbox", icon: MessageSquare },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "knowledge", label: "Knowledge Base", icon: BookOpen },
  { id: "team", label: "Team", icon: Users },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "settings", label: "Settings", icon: Settings },
  ...(developerMode
    ? [{ id: "developer" as const, label: "Developer", icon: Wrench }]
    : []),
];

  const railWidth = expanded ? RAIL_EXPANDED_WIDTH : RAIL_COLLAPSED_WIDTH;
  const totalReservedWidth =
    railWidth + (showSettingsPanel ? SETTINGS_PANEL_WIDTH : 0);

  return (
    <>
      {/* Reserved space in page layout */}
      <div
        className="h-screen shrink-0 transition-all duration-200"
        style={{ width: totalReservedWidth }}
      />

      {/* ── MAIN RAIL ── */}
      <aside
        onMouseEnter={() => collapsed && !showSettingsPanel && setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className={`fixed inset-y-0 left-0 z-40 flex flex-col h-screen border-r border-border bg-surface transition-all duration-200 ${
          expanded ? "w-60 shadow-2xl" : "w-[60px]"
        }`}
      >
        {/* ── HEADER ── */}
        <div
          className={`flex items-center border-b border-border p-3 gap-2 ${
            !expanded ? "justify-center" : "justify-between"
          }`}
        >
          {expanded && <Logo size="sm" />}

          {!expanded && <RelayMark className="w-7 h-7" />}

          {expanded && user && (
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                user.plan === "PRO"
                  ? "bg-copper-dim text-copper"
                  : "bg-canvas text-ink-faint"
              }`}
            >
              {user.plan}
            </span>
          )}
        </div>

        {/* ── PIN TOGGLE ── */}
        {!showSettingsPanel && (
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="absolute -right-3 top-5 z-10 w-6 h-6 rounded-full border border-border bg-surface shadow flex items-center justify-center hover:bg-canvas transition"
            title={collapsed ? "Pin sidebar open" : "Unpin sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen size={13} className="text-ink-muted" />
            ) : (
              <PanelLeftClose size={13} className="text-ink-muted" />
            )}
          </button>
        )}

        {/* ── NEW CONVERSATION ── */}
        {expanded ? (
          <div className="px-3 pt-3 pb-1">
            <button
              onClick={onNewChat}
              className="btn-secondary w-full flex items-center justify-center gap-2 text-xs"
            >
              <Plus size={14} />
              New Conversation
            </button>
          </div>
        ) : (
          <div className="px-2 pt-3 pb-1">
            <button
              onClick={onNewChat}
              title="New Conversation"
              className="w-full flex items-center justify-center rounded-lg border border-border p-2 hover:bg-canvas transition"
            >
              <Plus size={15} className="text-ink-muted" />
            </button>
          </div>
        )}

        {/* ── NAVIGATION ── */}
        <nav className="px-2 py-2 space-y-0.5">
          {NAVIGATION.map((item) => {
            const Icon = item.icon;
            const isActive = page === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                title={!expanded ? item.label : undefined}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] transition ${
                  isActive
                    ? "bg-copper text-white"
                    : "hover:bg-canvas text-ink-muted"
                } ${!expanded ? "justify-center px-2" : ""}`}
              >
                <Icon size={18} />
                {expanded && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* ── RECENT CONVERSATIONS ── */}
        {expanded ? (
          <div className="flex-1 overflow-y-auto border-t border-border mt-1">
            <div className="px-4 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-ink-faint font-semibold">
                Recent
              </p>
            </div>

            <div className="px-2 pb-3 space-y-0.5">
              {conversations.length === 0 ? (
                <p className="text-[11px] text-ink-faint text-center py-4">
                  No conversations yet
                </p>
              ) : (
                conversations.map((conv) => {
                  const isRenaming = renamingId === conv._id;
                  const isBusy = busyId === conv._id;

                  if (isRenaming) {
                    return (
                      <div
                        key={conv._id}
                        className="flex items-center gap-1 px-2 py-1"
                      >
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") confirmRename(conv._id);
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          className="flex-1 min-w-0 rounded-md border border-copper bg-canvas px-2 py-1 text-[11px] outline-none"
                        />
                        <button
                          onClick={() => confirmRename(conv._id)}
                          disabled={isBusy}
                          className="p-1 rounded hover:bg-canvas text-green-600 disabled:opacity-50"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setRenamingId(null)}
                          className="p-1 rounded hover:bg-canvas text-ink-muted"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div key={conv._id} className="relative group">
                      <button
                        onClick={() => onSelect(conv._id)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg transition text-[11px] ${
                          activeId === conv._id
                            ? "bg-copper-dim text-copper"
                            : "hover:bg-canvas text-ink-muted"
                        } ${canManage ? "pr-7" : ""}`}
                      >
                        <p className="truncate">
                          {conv.title || "Untitled Conversation"}
                        </p>
                        <p className="text-[10px] text-ink-faint mt-0.5">
                          {formatDate(conv.updatedAt ?? conv.createdAt)}
                        </p>
                      </button>

                      {canManage && (
                        <div className="absolute right-1 top-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(
                                openMenuId === conv._id ? null : conv._id
                              );
                            }}
                            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-canvas text-ink-faint transition"
                          >
                            <MoreHorizontal size={15} />
                          </button>

                          {openMenuId === conv._id && (
                            <div
                              ref={menuRef}
                              className="absolute right-0 top-6 z-50 w-32 rounded-lg border border-border bg-surface shadow-xl py-1"
                            >
                              <button
                                onClick={() => startRename(conv)}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-ink-muted hover:bg-canvas hover:text-ink transition"
                              >
                                <Pencil size={14} />
                                Rename
                              </button>
                              <button
                                onClick={() => handleDelete(conv._id)}
                                disabled={isBusy}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-red-500 hover:bg-red-50 transition disabled:opacity-50"
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* ── BOTTOM SECTION ── */}
        <div className="border-t border-border p-2">
          {expanded &&
            (user?.plan === "FREE" ? (
              <button
                onClick={() => setPage("billing")}
                className="w-full flex items-center gap-2 rounded-lg bg-copper-dim text-copper px-3 py-2 text-xs hover:bg-copper/20 transition"
              >
                <Sparkles size={14} />
                Upgrade to Pro
              </button>
            ) : (
              <button
                onClick={handleManageBilling}
                disabled={openingPortal}
                className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-ink-muted hover:bg-canvas transition"
              >
                <Settings size={14} />
                {openingPortal ? "Opening..." : "Manage Billing"}
              </button>
            ))}
        </div>
      </aside>

      {/* ── SETTINGS PANEL (persistent second sidebar, not a hover flyout) ── */}
      {showSettingsPanel && (
        <aside
          className="fixed inset-y-0 z-30 h-screen w-60 border-r border-border bg-surface overflow-y-auto"
          style={{ left: RAIL_COLLAPSED_WIDTH }}
        >
          <div className="p-4 border-b border-border">
            <h2 className="text-base font-semibold text-ink">Settings</h2>
          </div>

          <div className="py-2">
            {SETTINGS_GROUPS.map((group) => (
              <div key={group.heading} className="px-2 py-2">
                <p className="px-2 pb-1 text-[10px] uppercase tracking-wider text-ink-faint font-semibold">
                  {group.heading}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = settingsPage === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSettingsPage(item.id)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-[13px] transition ${
                          isActive
                            ? "bg-copper/10 text-copper font-medium"
                            : "text-ink-muted hover:bg-canvas hover:text-ink"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}
    </>
  );
}

// Standalone Avatar component exported for use in TopBar or elsewhere
export function Avatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const initial = name.charAt(0).toUpperCase();

  if (avatarUrl && !failed) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        onError={() => setFailed(true)}
        className="w-7 h-7 rounded-full object-cover border border-border"
      />
    );
  }

  return (
    <div className="w-7 h-7 rounded-full bg-copper text-white flex items-center justify-center text-xs font-semibold">
      {initial}
    </div>
  );
}