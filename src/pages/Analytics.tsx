import { useEffect, useState } from "react";

import {
  getDashboardAnalytics,
  getAnalyticsTimeline,
  getAnalyticsAISummary,
  AnalyticsTimelineItem,
  AnalyticsAISummary,
} from "@/services/analyticsService";

import {
  ArrowLeft,
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

import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

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
  const [data, setData] =
    useState<DashboardAnalytics | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [timeline, setTimeline] =
    useState<AnalyticsTimelineItem[]>([]);

  const [aiSummary, setAiSummary] =
    useState<AnalyticsAISummary | null>(null);

  useEffect(() => {
    Promise.all([
      getDashboardAnalytics(),
      getAnalyticsTimeline(),
      getAnalyticsAISummary(),
    ])
      .then(
        ([
          analytics,
          timelineData,
          summaryData,
        ]) => {
          setData(analytics);
          setTimeline(timelineData);
          setAiSummary(summaryData);
        }
      )
      .catch((error) => {
        console.error(error);

        setError(
          "Couldn't load analytics right now."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

    return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />

          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-ink-muted hover:text-ink"
          >
            <ArrowLeft size={16} />
            Back to chat
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">
            Business Analytics
          </h1>

          <p className="text-sm text-ink-muted mt-1">
            See how visitors interact with your
            business website.
          </p>
        </div>

        {loading && (
          <p className="text-sm text-ink-faint">
            Loading analytics…
          </p>
        )}

        {error && (
          <div className="panel p-5 text-sm text-danger">
            {error}
          </div>
        )}

        {data && !loading && (
          <>
            {/* =========================
                ANALYTICS CARDS
            ========================== */}

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

            {/* =========================
                TODAY'S ACTIVITY
            ========================== */}

            <div className="panel p-6 mt-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-semibold">
                    Today's activity
                  </h2>

                  <p className="text-xs text-ink-muted mt-1">
                    Website activity by hour
                  </p>
                </div>
              </div>

              <div className="h-52 flex items-end gap-1">
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

                  const height =
                    (total / maxValue) * 100;

                  return (
                    <div
                      key={item.hour}
                      className="flex-1 h-full flex flex-col justify-end items-center"
                    >
                      <div
                        className="w-full max-w-8 bg-copper rounded-t-md transition-all duration-500"
                        style={{
                          height: `${height}%`,
                          minHeight:
                            total > 0
                              ? "4px"
                              : "0",
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

            {/* =========================
                RELAY AI SUMMARY
            ========================== */}

            {aiSummary && (
              <div className="panel p-6 mt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-9 w-9 rounded-lg bg-copper-dim flex items-center justify-center">
                    <Bot
                      size={18}
                      className="text-copper"
                    />
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      Relay AI Summary
                    </h2>

                    <p className="text-xs text-ink-muted">
                      Today's business insights
                    </p>
                  </div>
                </div>

                <p className="text-sm leading-6 text-ink-muted whitespace-pre-line">
                  {aiSummary.summary}
                </p>
              </div>
            )}

            {/* =========================
                VISITOR + ENGAGEMENT
            ========================== */}

            <div className="grid md:grid-cols-2 gap-5 mt-6">
              <div className="panel p-6">
                <h2 className="font-semibold mb-4">
                  Visitor activity
                </h2>

                <div className="space-y-4">
                  <MetricRow
                    label="Visitors"
                    value={data.visitors}
                  />

                  <MetricRow
                    label="Sessions"
                    value={data.sessions}
                  />

                  <MetricRow
                    label="Page views"
                    value={data.pageViews}
                  />

                  <MetricRow
                    label="Button clicks"
                    value={data.buttonClicks}
                  />
                </div>
              </div>

              <div className="panel p-6">
                <h2 className="font-semibold mb-4">
                  Engagement
                </h2>

                <div className="space-y-4">
                  <MetricRow
                    label="Chat opens"
                    value={data.chatOpened}
                  />

                  <MetricRow
                    label="Messages sent"
                    value={data.messagesSent}
                  />

                  <MetricRow
                    label="Messages received"
                    value={data.messagesReceived}
                  />

                  <MetricRow
                    label="Leads generated"
                    value={data.leads}
                  />

                  <MetricRow
                    label="Purchases"
                    value={data.purchases}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </main>
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
    <div className="panel p-5">
      <div className="w-9 h-9 rounded-panel bg-copper-dim text-copper flex items-center justify-center mb-4">
        <Icon size={18} />
      </div>

      <div className="text-2xl font-semibold">
        {value.toLocaleString()}
      </div>

      <div className="text-xs text-ink-muted mt-1">
        {label}
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-ink-muted">
        {label}
      </span>

      <span className="text-sm font-semibold">
        {value.toLocaleString()}
      </span>
    </div>
  );
}