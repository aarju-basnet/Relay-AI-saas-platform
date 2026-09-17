import { useEffect, useState } from "react";

import {
  getDashboardAnalytics,
  getAnalyticsTimeline,
  getAnalyticsAISummary,
  AnalyticsTimelineItem,
  AnalyticsAISummary,
} from "@/services/analyticsService";

import {
  Users,
  Activity,
  Eye,
  MousePointerClick,
  MessageCircle,
  MessagesSquare,
  UserPlus,
  ShoppingCart,
  Bot,
} from "lucide-react";

interface DashboardAnalytics {
  visitors: number;
  sessions: number;
  pageViews: number;
  buttonClicks: number;
  chatOpened: number;
  messagesSent: number;
  messagesReceived: number;
  leads: number;
  purchases: number;
}

export default function Analytics() {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<AnalyticsTimelineItem[]>([]);
  const [aiSummary, setAiSummary] = useState<AnalyticsAISummary | null>(null);

  useEffect(() => {
    Promise.all([
      getDashboardAnalytics(),
      getAnalyticsTimeline(),
      getAnalyticsAISummary(),
    ])
      .then(([analytics, timelineData, summaryData]) => {
        setData(analytics);
        setTimeline(timelineData);
        setAiSummary(summaryData);
      })
      .catch((error) => {
        console.error(error);
        setError("Couldn't load analytics right now.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col h-full bg-canvas bg-white text-ink -m-6 p-6">
      {/* Page Header */}
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-xl font-semibold">Business Analytics</h1>
        <p className="text-xs text-ink-muted mt-1">
          See how visitors interact with your business website.
        </p>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading && (
          <p className="text-xs text-ink-faint text-center py-10">
            Loading analytics…
          </p>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-600">
            {error}
          </div>
        )}

        {data && !loading && (
          <>
            {/* Analytics Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={Users}
                label="Visitors"
                value={data.visitors}
              />
              <StatCard
                icon={Activity}
                label="Sessions"
                value={data.sessions}
              />
              <StatCard
                icon={Eye}
                label="Page views"
                value={data.pageViews}
              />
              <StatCard
                icon={MousePointerClick}
                label="Button clicks"
                value={data.buttonClicks}
              />
              <StatCard
                icon={MessageCircle}
                label="Chat opens"
                value={data.chatOpened}
              />
              <StatCard
                icon={MessagesSquare}
                label="Messages sent"
                value={data.messagesSent}
              />
              <StatCard
                icon={UserPlus}
                label="Leads"
                value={data.leads}
              />
              <StatCard
                icon={ShoppingCart}
                label="Purchases"
                value={data.purchases}
              />
            </div>

            {/* Today's Activity Chart */}
            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="mb-6">
                <h2 className="font-semibold text-sm">Today's activity</h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  Website activity by hour
                </p>
              </div>

              <div className="h-48 flex items-end gap-1.5 pt-4">
                {timeline.map((item) => {
                  const total =
                    item.visitors +
                    item.pageViews +
                    item.clicks +
                    item.chats +
                    item.messages;

                  const maxValue = Math.max(
                    ...timeline.map(
                      (x) =>
                        x.visitors +
                        x.pageViews +
                        x.clicks +
                        x.chats +
                        x.messages
                    ),
                    1
                  );

                  const height = (total / maxValue) * 100;

                  return (
                    <div
                      key={item.hour}
                      className="flex-1 h-full flex flex-col justify-end items-center"
                    >
                      <div
                        className="w-full max-w-8 bg-copper rounded-t-md transition-all duration-300"
                        style={{
                          height: `${height}%`,
                          minHeight: total > 0 ? "4px" : "0",
                        }}
                        title={`${item.hour}:00 — ${total} events`}
                      />
                      <span className="text-[9px] text-ink-faint mt-2">
                        {item.hour}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Summary */}
            {aiSummary && (
              <div className="bg-surface border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-copper/10 flex items-center justify-center">
                    <Bot size={16} className="text-copper" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm">Relay AI Summary</h2>
                    <p className="text-xs text-ink-muted">
                      Today's business insights
                    </p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-ink-muted whitespace-pre-line">
                  {aiSummary.summary}
                </p>
              </div>
            )}

            {/* Detailed Metric Tables */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-surface border border-border rounded-xl p-6">
                <h2 className="font-semibold text-sm mb-4">Visitor activity</h2>
                <div className="space-y-3">
                  <MetricRow label="Visitors" value={data.visitors} />
                  <MetricRow label="Sessions" value={data.sessions} />
                  <MetricRow label="Page views" value={data.pageViews} />
                  <MetricRow label="Button clicks" value={data.buttonClicks} />
                </div>
              </div>

              <div className="bg-surface border border-border rounded-xl p-6">
                <h2 className="font-semibold text-sm mb-4">Engagement</h2>
                <div className="space-y-3">
                  <MetricRow label="Chat opens" value={data.chatOpened} />
                  <MetricRow label="Messages sent" value={data.messagesSent} />
                  <MetricRow label="Messages received" value={data.messagesReceived} />
                  <MetricRow label="Leads generated" value={data.leads} />
                  <MetricRow label="Purchases" value={data.purchases} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="w-8 h-8 rounded-lg bg-copper/10 text-copper flex items-center justify-center mb-3">
        <Icon size={16} />
      </div>
      <div className="text-xl font-semibold">{value.toLocaleString()}</div>
      <div className="text-xs text-ink-muted mt-0.5">{label}</div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-none">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink">{value.toLocaleString()}</span>
    </div>
  );
}