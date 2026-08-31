import {
  Bot,
  Clock,
  MessageSquare,
  MessagesSquare,
  TrendingUp,
  Users,
  Activity,
  CheckCircle2,
} from "lucide-react";

import { DashboardOverview as DashboardOverviewType } from "@/lib/api";

interface Props {
  overview?: DashboardOverviewType;
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  subColor?: string;
}

function StatCard({ label, value, sub, icon, subColor }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-ink-muted">{label}</span>
        <div className="text-copper">{icon}</div>
      </div>

      <h2 className="text-sm font-medium mt-3">{value}</h2>

      <p className={`text-[11px] mt-2 ${subColor ?? "text-ink-muted"}`}>
        {sub}
      </p>
    </div>
  );
}

export default function DashboardOverview({ overview }: Props) {
  if (!overview) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 flex items-center justify-center">
        <p className="text-xs text-ink-muted">Loading dashboard...</p>
      </div>
    );
  }

  const stats = [
    {
      label: "Conversations",
      value: overview.totalConversations,
      sub: "Total workspace conversations",
      icon: <MessageSquare size={17} />,
    },
    {
      label: "Messages",
      value: overview.totalMessages,
      sub: "AI + customer messages",
      icon: <MessagesSquare size={17} />,
    },
    {
      label: "Team Members",
      value: overview.totalUsers,
      sub: "Members in workspace",
      icon: <Users size={17} />,
    },
    {
      label: "Active Today",
      value: overview.activeToday,
      sub: "Conversations updated today",
      icon: <TrendingUp size={17} />,
      subColor: "text-green-500",
    },
    {
      label: "AI Responses",
      value: overview.aiResponses,
      sub: "Assistant generated replies",
      icon: <Bot size={17} />,
    },
    {
      label: "Human Messages",
      value: overview.humanResponses,
      sub: "Customer messages",
      icon: <Users size={17} />,
    },
    {
      label: "Avg Response Time",
      value: `${overview.avgResponseTime}s`,
      sub: "Average AI response time",
      icon: <Clock size={17} />,
    },
    {
      label: "Workspace Status",
      value: "Healthy",
      sub: "All systems operational",
      icon: <Activity size={17} />,
      subColor: "text-green-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-xs font-semibold">Workspace Summary</h2>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Key activity at a glance
            </p>
          </div>

          <div className="divide-y divide-border">
            {[
              {
                label: "Total Conversations",
                sub: "All conversations created",
                value: overview.totalConversations,
                color: "text-copper",
              },
              {
                label: "Total Messages",
                sub: "Customer + AI messages",
                value: overview.totalMessages,
                color: "text-copper",
              },
              {
                label: "Active Today",
                sub: "Updated conversations today",
                value: overview.activeToday,
                color: "text-green-500",
              },
              {
                label: "Team Members",
                sub: "Members in your workspace",
                value: overview.totalUsers,
                color: "text-copper",
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between px-5 py-4"
              >
                <div>
                  <p className="text-xs font-medium">{row.label}</p>
                  <p className="text-[11px] text-ink-muted mt-0.5">
                    {row.sub}
                  </p>
                </div>

                <span className={`text-sm font-semibold ${row.color}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-xs font-semibold">AI Overview</h2>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Assistant performance summary
            </p>
          </div>

          <div className="divide-y divide-border">
            {[
              {
                label: "AI Responses",
                value: overview.aiResponses,
                color: "text-green-500",
              },
              {
                label: "Human Messages",
                value: overview.humanResponses,
                color: "text-blue-500",
              },
              {
                label: "Avg Response Time",
                value: `${overview.avgResponseTime}s`,
                color: "text-copper",
              },
              {
                label: "Workspace Status",
                value: "Healthy",
                color: "text-green-500",
              },
              {
                label: "AI Service",
                value: "Online",
                color: "text-green-500",
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between px-5 py-4"
              >
                <p className="text-xs font-medium">{row.label}</p>

                <div className="flex items-center gap-1.5">
                  {(row.value === "Healthy" || row.value === "Online") && (
                    <CheckCircle2 size={13} className="text-green-500" />
                  )}

                 <span className={`text-[11px] font-medium ${row.color}`}>
                  {row.value}
                </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-xs font-semibold">Conversation Analytics</h2>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Workspace activity overview
            </p>
          </div>

          <span className="rounded-full bg-green-100 px-3 py-1 text-[11px] font-medium text-green-700">
            Live
          </span>
        </div>

        <div className="h-56 flex flex-col items-center justify-center text-center px-6">
          <TrendingUp size={36} className="text-copper mb-3" />
          <h3 className="text-sm font-semibold">Analytics Coming Soon</h3>
          <p className="text-[11px] text-ink-muted mt-1">
            Charts will visualize your real conversation data.
          </p>
        </div>
      </div>
    </div>
  );
}