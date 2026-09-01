import {
  Plus,
  LogOut,
  Sparkles,
  Settings,
  BarChart3,
  Users,
  Bot,
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  CreditCard,
  Wrench,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

import { Conversation, api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Logo, RelayMark } from "@/components/Logo";

interface SidebarProps {
  page: string;
  setPage: (page: string) => void;
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
  const { user, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
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
    user?.workspace?.role === "OWNER" || user?.workspace?.role === "ADMIN";

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

  const NAVIGATION = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "inbox",     label: "Inbox",     icon: MessageSquare },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "knowledge", label: "Knowledge Base", icon: BookOpen },
    { id: "models",    label: "AI Models", icon: Bot },
    { id: "team",      label: "Team",      icon: Users },
    { id: "billing",   label: "Billing",   icon: CreditCard },
    { id: "settings",  label: "Settings",  icon: Settings },
    ...(developerMode
      ? [{ id: "developer", label: "Developer", icon: Wrench }]
      : []),
  ];

  const SETTINGS_ITEMS = [
    { id: "workspace",     label: "Workspace" },
    { id: "assistant",     label: "Assistant" },
    { id: "team",          label: "Team" },
    { id: "billing",       label: "Billing" },
    { id: "security",      label: "Security" },
    { id: "notifications", label: "Notifications" },
    { id: "apikeys",       label: "API Keys" },
    { id: "integrations",  label: "Integrations" },
    { id: "appearance",    label: "Appearance" },
    { id: "advanced",      label: "Advanced" },
  ];

  return (
    <aside
      className={`relative flex flex-col h-screen border-r border-border bg-surface transition-all duration-300 ${
        collapsed ? "w-[60px]" : "w-60"
      }`}
    >

      {/* ── HEADER ── */}

      <div className={`flex items-center border-b border-border p-3 gap-2 ${collapsed ? "justify-center" : "justify-between"}`}>

        {!collapsed && <Logo size="sm" />}

        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-copper flex items-center justify-center">
            <RelayMark className="w-4 h-4 text-white" />
          </div>
        )}

        {!collapsed && user && (
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
            user.plan === "PRO"
              ? "bg-copper-dim text-copper"
              : "bg-canvas text-ink-faint"
          }`}>
            {user.plan}
          </span>
        )}

      </div>

      {/* ── COLLAPSE TOGGLE ── */}

      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-5 z-10 w-6 h-6 rounded-full border border-border bg-surface shadow flex items-center justify-center hover:bg-canvas transition"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed
          ? <PanelLeftOpen size={13} className="text-ink-muted" />
          : <PanelLeftClose size={13} className="text-ink-muted" />
        }
      </button>

      {/* ── NEW CONVERSATION ── */}

      {!collapsed && (
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={onNewChat}
            className="btn-secondary w-full flex items-center justify-center gap-2 text-xs"
          >
            <Plus size={14} />
            New Conversation
          </button>
        </div>
      )}

      {collapsed && (
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
          const isSettings = item.id === "settings";

          if (isSettings && !collapsed) {
            return (
              <div
                key={item.id}
                className="relative"
                onMouseEnter={() => setShowSettingsMenu(true)}
                onMouseLeave={() => setShowSettingsMenu(false)}
              >

                <button
                  onClick={() => setPage("settings")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition ${
                    page === "settings"
                      ? "bg-copper text-white"
                      : "hover:bg-canvas text-ink-muted"
                  }`}
                >

                  <div className="flex items-center gap-2.5">
                    <Icon size={14} />
                    <span>{item.label}</span>
                  </div>

                  <ChevronRight size={13} />

                </button>

                {/* Floating Settings Menu */}

                <div className={`absolute left-full top-0 ml-2 w-48 rounded-xl border border-border bg-surface shadow-2xl z-50 transition-all duration-150 origin-left ${
                  showSettingsMenu
                    ? "opacity-100 scale-100 visible"
                    : "opacity-0 scale-95 invisible"
                }`}>

                  <div className="px-2 py-2 border-b border-border">
                    <p className="text-[10px] uppercase font-semibold text-ink-faint px-2">
                      Settings
                    </p>
                  </div>

                  <div className="py-1.5">
                    {SETTINGS_ITEMS.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setPage("settings");
                          setSettingsPage(s.id);
                          setShowSettingsMenu(false);
                        }}
                        className={`w-full text-left px-4 py-1.5 text-xs transition ${
                          settingsPage === s.id && page === "settings"
                            ? "bg-copper/10 text-copper font-medium"
                            : "text-ink-muted hover:bg-canvas hover:text-ink"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                </div>

              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition ${
                isActive
                  ? "bg-copper text-white"
                  : "hover:bg-canvas text-ink-muted"
              } ${collapsed ? "justify-center px-2" : ""}`}
            >
              <Icon size={14} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}

      </nav>

      {/* ── RECENT CONVERSATIONS ── */}

      {!collapsed && (

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
                        <Check size={12} />
                      </button>
                      <button
                        onClick={() => setRenamingId(null)}
                        className="p-1 rounded hover:bg-canvas text-ink-muted"
                      >
                        <X size={12} />
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
                          <MoreHorizontal size={13} />
                        </button>

                        {openMenuId === conv._id && (
                         <div ref={menuRef}  className="absolute right-0 top-6 z-50 w-32 rounded-lg border border-border bg-surface shadow-xl py-1">
                            <button
                              onClick={() => startRename(conv)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-ink-muted hover:bg-canvas hover:text-ink transition"
                            >
                              <Pencil size={12} />
                              Rename
                            </button>
                            <button
                              onClick={() => handleDelete(conv._id)}
                              disabled={isBusy}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-red-500 hover:bg-red-50 transition disabled:opacity-50"
                            >
                              <Trash2 size={12} />
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

      )}

      {collapsed && <div className="flex-1" />}

      {/* ── BOTTOM SECTION ── */}

      <div className="border-t border-border p-2 space-y-2">

        {!collapsed && (
          user?.plan === "FREE" ? (
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
          )
        )}

        {/* User row */}

        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>

          {!collapsed && (

            <div className="flex items-center gap-2 min-w-0">

              <Avatar
                name={user?.name || user?.email || "?"}
                avatarUrl={user?.avatarUrl}
              />

              <div className="min-w-0">

                <p className="text-xs font-semibold truncate">
                  {user?.name || "User"}
                </p>

                <p className="text-[11px] text-ink-faint truncate">
                  {user?.email}
                </p>

              </div>

            </div>

          )}

          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 rounded-lg hover:bg-danger-dim hover:text-danger transition"
          >
            <LogOut size={14} />
          </button>

        </div>

      </div>

    </aside>
  );
}

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
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