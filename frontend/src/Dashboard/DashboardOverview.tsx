import { useEffect, useState } from "react";
import {
  Bot,
  MessageSquare,
  TrendingUp,
  Users,
  Activity,
  AlertTriangle,
} from "lucide-react";

import { DashboardOverview as DashboardOverviewType } from "@/lib/api";

interface Props {
  overview?: DashboardOverviewType;
}

// The /health endpoint isn't under /api, and needs no auth - it's a plain
// infra check ({ status: "ok", redis: redis.status }), so this fetches it
// directly rather than going through the api.ts request() wrapper.
type HealthState = "checking" | "healthy" | "degraded" | "offline";

function useWorkspaceHealth(): HealthState {
  const [health, setHealth] = useState<HealthState>("checking");

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

    async function checkHealth() {
      try {
        const res = await fetch(`${API_BASE}/health`);
        if (!res.ok) {
          setHealth("offline");
          return;
        }
        const data = await res.json();
        if (data.status === "ok" && data.redis === "ready") {
          setHealth("healthy");
        } else {
          // Server responded but something (e.g. Redis) isn't fully ready
          setHealth("degraded");
        }
      } catch {
        setHealth("offline");
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // recheck every 30s
    return () => clearInterval(interval);
  }, []);

  return health;
}

const HEALTH_DISPLAY: Record<HealthState, { label: string; color: string }> = {
  checking: { label: "Checking...", color: "text-ink-muted" },
  healthy: { label: "Healthy", color: "text-green-500" },
  degraded: { label: "Degraded", color: "text-amber-500" },
  offline: { label: "Offline", color: "text-red-500" },
};

function StatRow({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <div className="flex items-center gap-2.5 text-ink-muted">
        <span className="text-copper">{icon}</span>
        <span className="text-xs font-medium">{label}</span>
      </div>
      <span className={`text-sm font-semibold ${valueColor ?? "text-ink"}`}>
        {value}
      </span>
    </div>
  );
}

function DetailRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string | number;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-ink-muted">{label}</span>
      <span className={`text-xs font-medium ${valueColor ?? "text-ink"}`}>
        {value}
      </span>
    </div>
  );
}

export default function DashboardOverview({ overview }: Props) {
  const health = useWorkspaceHealth();
  const healthDisplay = HEALTH_DISPLAY[health];

  if (!overview) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 flex items-center justify-center">
        <p className="text-xs text-ink-muted">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── WORKSPACE CARD (LEFT) ── */}
        <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold">Workspace Overview</h2>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Key activity at a glance
            </p>
          </div>

          <div className="divide-y divide-border">
            <StatRow
              icon={<MessageSquare size={15} />}
              label="Conversations"
              value={overview.totalConversations}
            />
            <StatRow
              icon={<MessageSquare size={15} />}
              label="Messages"
              value={overview.totalMessages}
            />
            <StatRow
              icon={<Users size={15} />}
              label="Team Members"
              value={overview.totalUsers}
            />
            <StatRow
              icon={<TrendingUp size={15} />}
              label="Active Today"
              value={`${overview.activeTeamMembersToday} / ${overview.totalUsers}`}
              valueColor="text-green-500"
            />
          </div>
        </div>

        {/* ── ANALYTICS CARD (RIGHT) ── */}
        <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold">Conversation Analytics</h2>
              <p className="text-[11px] text-ink-muted mt-0.5">
                Workspace activity overview
              </p>
            </div>
            <span className="rounded-full bg-green-100 px-3 py-1 text-[11px] font-medium text-green-700">
              Live
            </span>
          </div>

          <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center px-6 py-8">
            <TrendingUp size={28} className="text-copper mb-2.5" />
            <h3 className="text-xs font-semibold">Analytics Coming Soon</h3>
            <p className="text-[11px] text-ink-muted mt-1 max-w-xs">
              Charts will visualize your real conversation data.
            </p>
          </div>
        </div>
      </div>

      {/* ── LOWER DETAIL TEXT ── */}
      <div className="rounded-2xl border border-border bg-surface shadow-sm px-5 py-4">
        <h2 className="text-xs font-semibold mb-1">AI & System Details</h2>
        <div className="mt-2">
          <DetailRow
            label="AI Responses"
            value={overview.aiResponses}
            valueColor="text-green-500"
          />
          <DetailRow
            label="Human Messages"
            value={overview.humanResponses}
            valueColor="text-blue-500"
          />
          <DetailRow
            label="Avg Response Time"
            value={`${overview.avgResponseTime}s`}
          />
          <DetailRow
            label="Workspace Status"
            value={healthDisplay.label}
            valueColor={healthDisplay.color}
          />
        </div>
      </div>
    </div>
  );
}