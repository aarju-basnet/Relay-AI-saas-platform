import { useState, useRef, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquarePlus,
  CircleHelp,
  Loader2,
  CheckCircle2,
  User,
  ChevronRight,
  ChevronsUpDown,
  LogOut,
  Search,
  Building2,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useTheme, ThemeMode } from "@/context/Themecontext";
import { api, ApiError } from "@/lib/api";
import { Avatar } from "@/components/Sidebar";
import { RelayMark } from "@/components/Logo";

interface TopBarProps {
  onNavigateHelp: () => void;
  onNavigateAccount: () => void;
  onSearch?: (query: string) => void;
  // Shows the Relay logo on the left. Pages rendered inside Dashboard
  // already get a logo from Sidebar, so this defaults to off there;
  // standalone pages (e.g. workspace picker) that don't render Sidebar
  // pass this to get a logo without duplicating one elsewhere.
  showLogo?: boolean;
}

export function TopBar({
  onNavigateHelp,
  onNavigateAccount,
  onSearch,
  showLogo = false,
}: TopBarProps) {
  const { user, activeWorkspace, logout } = useAuth();
  const navigate = useNavigate();
  const { mode, setMode } = useTheme();

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Detect user's local timezone
  const userTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kathmandu";

  const THEME_OPTIONS: { id: ThemeMode; label: string }[] = [
    { id: "system", label: "System" },
    { id: "dark", label: "Dark" },
    { id: "light", label: "Light" },
  ];

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    onSearch?.(val);
  };

  // Show the breadcrumb workspace switcher whenever there's an active
  // workspace and this instance isn't the logo variant (the workspace
  // picker page, which has no workspace context to show yet).
  const showWorkspaceBreadcrumb = !showLogo && !!activeWorkspace;

  return (
    <header
      className={`flex h-12 w-full items-center gap-3 border-b border-border bg-surface px-6 shrink-0 z-30 ${
        showLogo || showWorkspaceBreadcrumb ? "justify-between" : "justify-end"
      }`}
    >
      {showLogo && (
        <div className="flex items-center gap-2 shrink-0">
          <RelayMark className="w-6 h-6 text-copper" />
          <span className="text-sm font-semibold text-ink">Relay</span>
        </div>
      )}

     {showWorkspaceBreadcrumb && activeWorkspace && (
  <button
    onClick={() => navigate("/select-workspace")}
    className="flex items-center gap-2 rounded-lg pl-6 pr-2 py-1.5 hover:bg-canvas transition shrink-0 min-w-0"
    title="Switch workspace"
  >
    <WorkspaceCrumbIcon logoUrl={activeWorkspace.logoUrl} name={activeWorkspace.name} />

    <span className="text-sm font-semibold text-ink truncate max-w-[160px]">
      {activeWorkspace.name}
    </span>

    <span
      className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${
        user?.plan === "PRO"
          ? "bg-copper-dim text-copper"
          : "bg-canvas border border-border text-ink-faint"
      }`}
    >
      {user?.plan === "PRO" ? "PRO" : "FREE"}
    </span>

    {user?.name && (
      <>
        <span className="text-ink-faint text-xs shrink-0">·</span>
        <span className="text-xs text-ink-muted truncate max-w-[180px]">
          {user.name}'s business
        </span>
      </>
    )}

    <ChevronsUpDown size={13} className="text-ink-faint shrink-0" />
  </button>
)}

      <div className="flex items-center gap-3">
        {/* Feedback Trigger */}
        <FeedbackButton open={feedbackOpen} setOpen={setFeedbackOpen} />

        {/* Compact Search Field (Right after Feedback) */}
        <div className="relative flex items-center">
          <Search
            size={18}
            strokeWidth={2}
            className="absolute left-2.5 text-ink-muted pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search..."
            className="h-8 w-44 rounded-lg border border-border bg-canvas pl-8 pr-3 text-xs text-ink placeholder:text-ink-muted outline-none transition focus:w-56 focus:border-copper/50 focus:ring-2 focus:ring-copper/20"
          />
        </div>

        {/* Help Button */}
        <button
          onClick={onNavigateHelp}
          title="Help"
          className="flex items-center justify-center w-8 h-8 rounded-lg text-ink-muted hover:bg-canvas hover:text-ink transition"
        >
          <CircleHelp size={20} strokeWidth={2} />
        </button>

        {/* Account Avatar with Dropdown */}
        <div
          className="relative"
          ref={menuRef}
          onMouseEnter={() => setMenuOpen(true)}
          onMouseLeave={() => setMenuOpen(false)}
        >
          <button
            onClick={() => {
              onNavigateAccount();
              setMenuOpen(false);
            }}
            title="Account Settings"
            className="flex items-center justify-center rounded-full transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-copper/30 py-1"
          >
            <Avatar
              name={user?.name || user?.email || "?"}
              avatarUrl={user?.avatarUrl}
            />
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 top-full pt-1 z-50 w-64">
              <div className="rounded-xl border border-border bg-surface shadow-2xl py-1 text-xs text-ink">
                {/* User Info Header */}
                <div className="px-4 py-2.5 border-b border-border">
                  <p className="font-semibold text-sm text-ink truncate">
                    {user?.name || "User"}
                  </p>
                  <p className="text-[11px] text-ink-muted truncate">
                    {user?.email}
                  </p>
                </div>

                {/* Active Workspace + Switch */}
                {activeWorkspace && (
                  <div className="px-4 py-2.5 border-b border-border">
                    <p className="text-[11px] font-medium text-ink-faint">Workspace</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-medium text-ink truncate">
                        {activeWorkspace.name}
                      </span>
                      {(user?.workspaces.length ?? 0) > 1 && (
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            navigate("/select-workspace");
                          }}
                          className="text-[11px] text-copper hover:text-copper-bright font-medium shrink-0 ml-2"
                        >
                          Switch
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation Links */}
                <div className="py-1 border-b border-border">
                  <button
                    onClick={() => {
                      onNavigateAccount();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-canvas text-ink-muted hover:text-ink transition text-left"
                  >
                    <User size={18} strokeWidth={2} />
                    <span>Account</span>
                  </button>
                </div>

                {/* Theme Selection (Uses ThemeContext) */}
                <div className="py-2 border-b border-border">
                  <p className="px-4 py-1 text-[11px] font-medium text-ink-faint">
                    Theme
                  </p>
                  <div className="mt-0.5 space-y-0.5">
                    {THEME_OPTIONS.map((t) => {
                      const isActive = mode === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setMode(t.id)}
                          className="w-full flex items-center justify-between px-4 py-1.5 hover:bg-canvas text-ink-muted hover:text-ink transition text-left"
                        >
                          <div className="flex items-center gap-2 pl-2">
                            {isActive ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-copper" />
                            ) : (
                              <span className="w-1.5 h-1.5" />
                            )}
                            <span
                              className={
                                isActive ? "text-ink font-medium" : ""
                              }
                            >
                              {t.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Timezone */}
                <div className="py-2 border-b border-border px-4 flex items-center justify-between hover:bg-canvas cursor-pointer transition">
                  <div>
                    <p className="text-[11px] font-medium text-ink-faint">
                      Timezone
                    </p>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Auto ({userTimezone})
                    </p>
                  </div>
                  <ChevronRight size={16} strokeWidth={2} className="text-ink-faint" />
                </div>

                {/* Sign Out */}
                <div className="pt-1">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-red-500 hover:bg-red-50 transition text-left"
                  >
                    <LogOut size={18} strokeWidth={2} />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function WorkspaceCrumbIcon({ logoUrl, name }: { logoUrl?: string | null; name: string }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${name} logo`}
        className="h-6 w-6 rounded-md object-cover border border-border shrink-0"
      />
    );
  }
  return (
    <div className="h-6 w-6 rounded-md bg-canvas border border-border flex items-center justify-center shrink-0">
      <Building2 size={12} className="text-ink-faint" />
    </div>
  );
}

function FeedbackButton({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, setOpen]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      await api.sendContactMessage(
        user?.name || "Relay user",
        user?.email || "",
        message
      );
      setSent(true);
      setMessage("");
      setTimeout(() => {
        setSent(false);
        setOpen(false);
      }, 1500);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't send feedback."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-ink-muted hover:text-ink hover:bg-canvas rounded-md transition"
      >
        <MessageSquarePlus size={18} strokeWidth={2} />
        <span>Feedback</span>
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-72 rounded-xl border border-border bg-surface shadow-2xl p-4">
          <p className="text-xs font-semibold mb-1">Send feedback</p>
          <p className="text-[11px] text-ink-muted mb-3">
            Found a bug or have an idea? Let us know.
          </p>

          {error && (
            <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] text-red-600">
              {error}
            </div>
          )}

          {sent ? (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-2.5 py-2 text-[11px] text-green-700">
              <CheckCircle2 size={16} strokeWidth={2} />
              Thanks for the feedback!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2">
              <textarea
                required
                autoFocus
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full rounded-lg border border-border px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-copper/30 resize-none"
              />
              <button
                type="submit"
                disabled={sending}
                className="w-full rounded-lg bg-copper py-1.5 text-xs font-medium text-white hover:bg-copper/90 transition disabled:opacity-60"
              >
                {sending ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Loader2 size={14} strokeWidth={2} className="animate-spin" />
                    Sending...
                  </span>
                ) : (
                  "Send"
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}