import { useEffect, useState } from "react";
import { BarChart3, MessageSquare, MessagesSquare, TrendingUp, Lock } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";
import { api, ApiError, AssistantUsage } from "@/lib/api";

export default function UsageSetting() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<AssistantUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isFreePlan = user?.plan === "FREE";

  useEffect(() => {
    if (isFreePlan) {
      setLoading(false);
      return;
    }
    api
      .getAssistantUsage()
      .then((res) => setUsage(res.data))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Couldn't load usage data.")
      )
      .finally(() => setLoading(false));
  }, [isFreePlan]);

  if (isFreePlan) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Usage</h1>
          <p className="text-xs text-ink-muted mt-1">
            See how your AI Assistant is being used on your website.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
          <div className="flex flex-col items-center justify-center py-14 text-center px-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-copper/10 mb-4">
              <Lock size={20} className="text-copper" />
            </div>
            <h3 className="text-sm font-semibold">Usage is a Pro feature</h3>
            <p className="text-[11px] text-ink-muted mt-1.5 max-w-sm">
              Upgrade to Pro and generate an AI Assistant key to see message
              volume, conversation counts, and busiest times.
            </p>
            <Link
              to="/pricing"
              className="mt-4 rounded-lg bg-copper px-4 py-2 text-xs font-medium text-white hover:bg-copper/90 transition"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Usage</h1>
        <p className="text-xs text-ink-muted mt-1">
          How your AI Assistant is being used on your website — last 30 days.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-border bg-surface p-8 flex items-center justify-center">
          <p className="text-xs text-ink-muted">Loading usage...</p>
        </div>
      ) : !usage || usage.totalMessagesSent === 0 ? (
        <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
          <div className="flex flex-col items-center justify-center py-14 text-center px-6">
            <BarChart3 size={32} className="text-copper mb-3" />
            <h3 className="text-sm font-semibold">No usage yet</h3>
            <p className="text-[11px] text-ink-muted mt-1 max-w-xs">
              Once visitors start chatting with your AI Assistant, usage stats will show up here.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <UsageStatCard
              icon={<MessagesSquare size={17} />}
              label="Conversations"
              value={usage.totalConversations}
            />
            <UsageStatCard
              icon={<MessageSquare size={17} />}
              label="Messages Sent"
              value={usage.totalMessagesSent}
            />
            <UsageStatCard
              icon={<TrendingUp size={17} />}
              label="Avg Messages / Conversation"
              value={usage.avgMessagesPerConversation}
            />
          </div>

          {/* DAILY VOLUME */}
          <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold">Message Volume</h2>
              <p className="text-[11px] text-ink-muted mt-0.5">Last 14 days</p>
            </div>
            <div className="p-5">
              <DailyBarChart data={usage.dailyVolume} />
            </div>
          </div>

          {/* BUSIEST HOURS */}
          <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold">Busiest Times</h2>
              <p className="text-[11px] text-ink-muted mt-0.5">By hour of day, last 30 days</p>
            </div>
            <div className="p-5">
              <HourlyBarChart data={usage.hourly} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function UsageStatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-ink-muted">{label}</span>
        <div className="text-copper">{icon}</div>
      </div>
      <h2 className="text-2xl font-semibold mt-3">{value}</h2>
    </div>
  );
}

function DailyBarChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex items-end gap-1.5 h-40">
      {data.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 group">
          <span className="text-[10px] text-ink-faint opacity-0 group-hover:opacity-100 transition">
            {d.count}
          </span>
          <div
            className="w-full bg-copper/70 hover:bg-copper rounded-t transition-colors"
            style={{ height: `${Math.max((d.count / max) * 100, 3)}%` }}
          />
          <span className="text-[9px] text-ink-faint">
            {new Date(d.date).toLocaleDateString(undefined, { day: "numeric" })}
          </span>
        </div>
      ))}
    </div>
  );
}

function HourlyBarChart({ data }: { data: { hour: number; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d) => (
        <div key={d.hour} className="flex-1 flex flex-col items-center gap-1 group">
          <span className="text-[9px] text-ink-faint opacity-0 group-hover:opacity-100 transition">
            {d.count}
          </span>
          <div
            className="w-full bg-copper/70 hover:bg-copper rounded-t transition-colors"
            style={{ height: `${Math.max((d.count / max) * 100, 3)}%` }}
          />
          {d.hour % 4 === 0 && (
            <span className="text-[9px] text-ink-faint">{d.hour}h</span>
          )}
        </div>
      ))}
    </div>
  );
}