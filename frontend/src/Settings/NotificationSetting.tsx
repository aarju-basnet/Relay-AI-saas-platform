import { useEffect, useState } from "react";
import {
  Bell,
  BellOff,
  ShieldAlert,
  Users,
  MessageSquare,
  CreditCard,
  BookOpen,
  CheckCheck,
  Loader2,
} from "lucide-react";

import { api, ApiError, Notification } from "@/lib/api";

/* ---------------------------------------------------------------------- */
/*                            TYPE → ICON MAP                             */
/* ---------------------------------------------------------------------- */

function iconForType(type: string) {
  switch (type) {
    case "NEW_DEVICE_LOGIN":
      return <ShieldAlert size={15} className="text-red-500" />;
    case "TEAM_INVITE":
      return <Users size={15} className="text-copper" />;
    case "TEAM_MESSAGE":
      return <MessageSquare size={15} className="text-copper" />;
    case "BILLING":
      return <CreditCard size={15} className="text-copper" />;
    case "KNOWLEDGE_BASE":
      return <BookOpen size={15} className="text-copper" />;
    default:
      return <Bell size={15} className="text-copper" />;
  }
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

/* ---------------------------------------------------------------------- */
/*                                  PAGE                                  */
/* ---------------------------------------------------------------------- */

export default function NotificationSetting() {
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-xl font-semibold">Notifications</h1>
        <p className="text-xs text-ink-muted mt-1">
          See updates from your workspace and control how they reach you.
        </p>
      </div>

      <MuteCard />
      <NotificationListCard />

    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*                              MUTE TOGGLE                               */
/* ---------------------------------------------------------------------- */

function MuteCard() {
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getNotifications()
      .then((res) => setMuted(res.muted))
      .finally(() => setLoading(false));
  }, []);

  async function toggleMute() {
    const next = !muted;
    setSaving(true);
    try {
      await api.setNotificationsMuted(next);
      setMuted(next);
    } catch {
      // no-op, state stays as-is if the request fails
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        {muted ? (
          <BellOff size={16} className="text-copper" />
        ) : (
          <Bell size={16} className="text-copper" />
        )}
        <h2 className="text-sm font-semibold">Dashboard Alerts</h2>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin text-copper" size={18} />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold">
                {muted ? "Notifications are muted" : "Notifications are on"}
              </p>
              <p className="text-[11px] text-ink-muted mt-0.5 max-w-sm">
                {muted
                  ? "New updates won't appear as a banner on your dashboard. You can still see them below."
                  : "New updates will appear as a banner at the top of your dashboard until you read or dismiss them."}
              </p>
            </div>

            <button
              onClick={toggleMute}
              disabled={saving}
              className={`rounded-lg px-4 py-2 text-xs font-medium transition disabled:opacity-60 shrink-0 ${
                muted
                  ? "bg-copper text-white hover:bg-copper/90"
                  : "border border-border hover:bg-surface-hover"
              }`}
            >
              {saving ? (
                <Loader2 size={13} className="animate-spin" />
              ) : muted ? (
                "Unmute"
              ) : (
                "Mute"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*                            NOTIFICATION LIST                           */
/* ---------------------------------------------------------------------- */

function NotificationListCard() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    api
      .getNotifications()
      .then((res) => setNotifications(res.notifications))
      .catch(() => setError("Couldn't load notifications."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleMarkRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await api.markNotificationRead(id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update notification.");
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't mark all as read.");
    } finally {
      setMarkingAll(false);
    }
  }

  const visible = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">

      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-copper" />
            <h2 className="text-sm font-semibold">All Notifications</h2>
          </div>

          <div className="flex items-center gap-1 rounded-full border border-border p-0.5">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                filter === "all" ? "bg-copper text-white" : "text-ink-muted hover:text-ink"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                filter === "unread" ? "bg-copper text-white" : "text-ink-muted hover:text-ink"
              }`}
            >
              Unread{unreadCount > 0 ? ` (${unreadCount})` : ""}
            </button>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 text-[11px] font-medium text-copper hover:text-copper/80 transition disabled:opacity-50"
          >
            {markingAll ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <CheckCheck size={12} />
            )}
            Mark all as read
          </button>
        )}
      </div>

      {error && (
        <div className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-copper" size={18} />
        </div>
      ) : visible.length === 0 ? (
        <p className="text-xs text-ink-faint text-center py-10">
          {filter === "unread" ? "No unread notifications." : "No notifications yet."}
        </p>
      ) : (
        <div className="divide-y divide-border">
          {visible.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 px-5 py-4 ${!n.read ? "bg-copper/5" : ""}`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-copper/10 shrink-0 mt-0.5">
                {iconForType(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs text-ink leading-5">{n.message}</p>
                <p className="text-[11px] text-ink-muted mt-0.5">{timeAgo(n.createdAt)}</p>
              </div>

              {!n.read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="text-[11px] font-medium text-copper hover:text-copper/80 transition shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}