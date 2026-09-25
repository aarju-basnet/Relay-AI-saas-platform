import { useEffect, useRef, useState } from "react";

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
  Loader2,
  Calendar,
  FileText,
  Sparkles,
  CheckCircle2,
  Copy
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
  topPages: { page: string; views: number }[];
  customEvents: { eventName: string; count: number }[];
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatSelectedDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatHour(hour: number): string {
  const period = hour < 12 ? "AM" : "PM";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h} ${period}`;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ---------- Smooth line/area chart, YouTube-Studio style ----------

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function CopySnippet({ code, id, copiedId, onCopy }: {
  code: string;
  id: string;
  copiedId: string | null;
  onCopy: (value: string, id: string) => void;
}) {
  return (
    <div className="relative mt-2 rounded-lg border border-white/10 bg-[#0d0e12] p-3">
      <button
        onClick={() => onCopy(code, id)}
        className="absolute top-2 right-2 rounded-md border border-white/10 p-1 hover:bg-white/10 transition"
      >
        {copiedId === id ? (
          <CheckCircle2 size={12} className="text-green-400" />
        ) : (
          <Copy size={12} className="text-white/60" />
        )}
      </button>
      <pre className="text-green-300 text-[10px] leading-5 overflow-x-auto pr-7">
        {code}
      </pre>
    </div>
  );
}

function ActivityChart({ timeline }: { timeline: AnalyticsTimelineItem[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const width = 700;
  const height = 180;
  const padTop = 12;
  const padBottom = 24;
  const chartHeight = height - padTop - padBottom;

  const totals = timeline.map(
    (item) => item.visitors + item.pageViews + item.clicks + item.chats + item.messages
  );
  const maxValue = Math.max(...totals, 1);

  const points = totals.map((total, i) => ({
    x: (i / (totals.length - 1)) * width,
    y: padTop + chartHeight - (total / maxValue) * chartHeight,
  }));

  const linePath = buildSmoothPath(points);
  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x} ${height - padBottom} L ${points[0].x} ${height - padBottom} Z`;

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relativeX = ((e.clientX - rect.left) / rect.width) * width;
    const index = Math.round((relativeX / width) * (points.length - 1));
    setHoverIndex(Math.max(0, Math.min(points.length - 1, index)));
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const hoveredTotal = hoverIndex !== null ? totals[hoverIndex] : null;

  const labelHours = [0, 6, 12, 18, 23];

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-44 overflow-visible cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-copper)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-copper)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={0}
            x2={width}
            y1={padTop + chartHeight * f}
            y2={padTop + chartHeight * f}
            stroke="var(--color-border)"
            strokeWidth={1}
          />
        ))}

        <path d={areaPath} fill="url(#activityFill)" />
        <path d={linePath} fill="none" stroke="var(--color-copper)" strokeWidth={2} />

        {hovered && (
          <>
            <line
              x1={hovered.x}
              x2={hovered.x}
              y1={padTop}
              y2={height - padBottom}
              stroke="var(--color-border-strong)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle cx={hovered.x} cy={hovered.y} r={4} fill="var(--color-copper)" />
          </>
        )}

        {labelHours.map((h) => (
          <text
            key={h}
            x={(h / (totals.length - 1)) * width}
            y={height - 6}
            textAnchor={h === 0 ? "start" : h === 23 ? "end" : "middle"}
            fontSize={10}
            fill="var(--color-ink-faint)"
          >
            {formatHour(h)}
          </text>
        ))}
      </svg>

      {hovered && hoveredTotal !== null && hoverIndex !== null && (
        <div
          className="absolute top-0 pointer-events-none rounded-lg border border-border bg-surface px-3 py-2 shadow-raised text-xs -translate-x-1/2"
          style={{
            left: `${(hovered.x / width) * 100}%`,
            transform:
              hovered.x / width > 0.85
                ? "translateX(-100%)"
                : hovered.x / width < 0.15
                ? "translateX(0%)"
                : "translateX(-50%)",
          }}
        >
          <p className="font-medium">{formatHour(hoverIndex)}</p>
          <p className="text-ink-muted">{hoveredTotal.toLocaleString()} events</p>
        </div>
      )}
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<AnalyticsTimelineItem[]>([]);
  const [aiSummary, setAiSummary] = useState<AnalyticsAISummary | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  

function handleCopy(value: string, id: string) {
  navigator.clipboard.writeText(value);
  setCopiedId(id);
  setTimeout(() => setCopiedId(null), 2000);
}

  const [selectedDate, setSelectedDate] = useState(todayString());
  const [timelineLoading, setTimelineLoading] = useState(false);

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

  useEffect(() => {
    if (selectedDate === todayString() && timeline.length > 0 && !loading) {
      return;
    }

    setTimelineLoading(true);
    getAnalyticsTimeline(selectedDate)
      .then((timelineData) => setTimeline(timelineData))
      .catch((err) => {
        console.error(err);
        setError("Couldn't load activity for that date.");
      })
      .finally(() => setTimelineLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const isToday = selectedDate === todayString();
  const hasAnyActivity = timeline.some(
    (x) => x.visitors + x.pageViews + x.clicks + x.chats + x.messages > 0
  );

  const [loadedDate, setLoadedDate] = useState<string | null>(null);

useEffect(() => {
  // Initial load: today's data for everything, including the AI summary
  Promise.all([
    getDashboardAnalytics(),
    getAnalyticsTimeline(),
    getAnalyticsAISummary(),
  ])
    .then(([analytics, timelineData, summaryData]) => {
      setData(analytics);
      setTimeline(timelineData);
      setAiSummary(summaryData);
      setLoadedDate(todayString());
    })
    .catch((error) => {
      console.error(error);
      setError("Couldn't load analytics right now.");
    })
    .finally(() => {
      setLoading(false);
    });
}, []);

useEffect(() => {
  if (selectedDate === loadedDate) {
    return;
  }

  setTimelineLoading(true);
  Promise.all([
    getDashboardAnalytics(selectedDate),
    getAnalyticsTimeline(selectedDate),
  ])
    .then(([analytics, timelineData]) => {
      setData(analytics);
      setTimeline(timelineData);
      setLoadedDate(selectedDate);
    })
    .catch((err) => {
      console.error(err);
      setError("Couldn't load activity for that date.");
    })
    .finally(() => setTimelineLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [selectedDate]);


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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              <StatTile icon={Users} label="Visitors" value={data.visitors} />
              <StatTile icon={Activity} label="Sessions" value={data.sessions} />
              <StatTile icon={Eye} label="Page views" value={data.pageViews} />
              <StatTile icon={MousePointerClick} label="Button clicks" value={data.buttonClicks} />
              <StatTile icon={MessageCircle} label="Chat opens" value={data.chatOpened} />
              <StatTile icon={MessagesSquare} label="Messages sent" value={data.messagesSent} />
              <StatTile icon={UserPlus} label="Leads" value={data.leads} />
              <StatTile icon={ShoppingCart} label="Purchases" value={data.purchases} />
            </div>

            {/* Activity Chart */}
            <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                  <p className="text-sm font-medium">
                    {isToday ? "Today's activity" : formatSelectedDate(selectedDate)}
                  </p>
                  <p className="text-[11px] text-ink-faint mt-0.5">
                    Website activity by hour
                  </p>
                </div>

                <div className="relative">
                  <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
                  <input
                    type="date"
                    value={selectedDate}
                    max={todayString()}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="rounded-lg border border-border bg-canvas pl-7 pr-3 py-1.5 text-xs outline-none focus:border-copper transition"
                  />
                </div>
              </div>

              {timelineLoading ? (
                <div className="h-44 flex items-center justify-center">
                  <Loader2 size={18} className="animate-spin text-ink-faint" />
                </div>
              ) : !hasAnyActivity ? (
                <div className="h-44 flex items-center justify-center">
                  <p className="text-xs text-ink-faint">No activity recorded on this day.</p>
                </div>
              ) : (
                <ActivityChart timeline={timeline} />
              )}
            </div>

            {/* Top Pages + Custom Events side by side */}
            <div className="grid md:grid-cols-2 gap-3.5">
              <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={15} className="text-copper" />
                  <p className="text-sm font-medium">Top pages</p>
                </div>

                {data.topPages.length === 0 ? (
                  <p className="text-xs text-ink-faint py-4 text-center">
                    No page views recorded today.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {data.topPages.map((p) => (
                      <div
                        key={p.page}
                        className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-none gap-3"
                      >
                        <span className="text-ink-muted truncate font-mono">{p.page}</span>
                        <span className="font-medium text-ink tabular-nums shrink-0">
                          {p.views.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={15} className="text-copper" />
                  <p className="text-sm font-medium">Custom events</p>
                </div>
                <p className="text-[11px] text-ink-faint mb-4">
                  Actions you've defined in your own code, like logins or signups.
                </p>

                {data.customEvents.length === 0 ? (
  <div className="text-xs text-ink-faint py-2">
    <p className="text-ink-muted">No custom events reported yet.</p>
    <p className="mt-2 leading-relaxed">
      Relay tracks page views and chat activity automatically. Logins,
      signups, and logouts happen in <em>your</em> app's own code, so
      Relay can't see them by itself — add one line right after each
      action succeeds, and it'll show up here.
    </p>

    <div className="mt-4 space-y-4">
      <div>
        <p className="text-[11px] font-medium text-ink-muted mb-1">
          After a successful login
        </p>
        <CopySnippet
          id="track-login"
          copiedId={copiedId}
          onCopy={handleCopy}
          code={`window.Relay.track("login");`}
        />
      </div>

      <div>
        <p className="text-[11px] font-medium text-ink-muted mb-1">
          After a successful signup
        </p>
        <CopySnippet
          id="track-signup"
          copiedId={copiedId}
          onCopy={handleCopy}
          code={`window.Relay.track("signup", { plan: "free" });`}
        />
      </div>

      <div>
        <p className="text-[11px] font-medium text-ink-muted mb-1">
          After a logout
        </p>
        <CopySnippet
          id="track-logout"
          copiedId={copiedId}
          onCopy={handleCopy}
          code={`window.Relay.track("logout");`}
        />
      </div>
    </div>

    <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
      <div>
        <p className="text-[11px] font-medium text-ink-muted mb-1">
          React / Next.js / MERN apps
        </p>
        <CopySnippet
          id="track-react-example"
          copiedId={copiedId}
          onCopy={handleCopy}
          code={`// e.g. inside your login handler, after the API call succeeds
async function handleLogin(email, password) {
  const res = await api.login(email, password);
  window.Relay?.track("login");
  navigate("/dashboard");
}`}
        />
      </div>

      <div>
        <p className="text-[11px] font-medium text-ink-muted mb-1">
          Plain HTML / vanilla JS sites
        </p>
        <CopySnippet
          id="track-vanilla-example"
          copiedId={copiedId}
          onCopy={handleCopy}
          code={`document.querySelector("#loginForm").addEventListener("submit", () => {
  // after your own login logic succeeds
  window.Relay.track("login");
});`}
        />
      </div>

      <p className="text-[11px] text-ink-faint leading-relaxed">
        Use <code className="font-mono">window.Relay?.track(...)</code> with
        the optional <code className="font-mono">?.</code> if the widget
        might not have loaded yet when this code runs.
      </p>
    </div>
  </div>
) : (
  <div className="space-y-2.5">
    {data.customEvents.map((c) => (
      <div
        key={c.eventName}
        className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-none"
      >
        <span className="text-ink-muted">{capitalize(c.eventName)}</span>
        <span className="font-medium text-ink tabular-nums">
          {c.count.toLocaleString()}
        </span>
      </div>
    ))}
  </div>
)}
              </div>
            </div>

            {/* AI Summary */}
            {aiSummary && (
              <div className="rounded-xl border border-teal/30 bg-teal/5 p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="h-7 w-7 rounded-lg bg-teal/10 flex items-center justify-center">
                    <Bot size={14} className="text-teal" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Relay AI Summary</p>
                    <p className="text-[11px] text-ink-faint">
                      {isToday ? "Today's business insights" : "Insights for this day"}
                    </p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-ink-muted whitespace-pre-line">
                  {aiSummary.summary}
                </p>
              </div>
            )}

            {/* Detailed Metric Tables */}
            <div className="grid md:grid-cols-2 gap-3.5">
              <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                <p className="text-sm font-medium mb-4">Visitor activity</p>
                <div className="space-y-2.5">
                  <MetricRow label="Visitors" value={data.visitors} />
                  <MetricRow label="Sessions" value={data.sessions} />
                  <MetricRow label="Page views" value={data.pageViews} />
                  <MetricRow label="Button clicks" value={data.buttonClicks} />
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                <p className="text-sm font-medium mb-4">Engagement</p>
                <div className="space-y-2.5">
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

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3.5">
      <div className="flex items-center gap-1.5 text-ink-faint mb-1">
        <Icon size={12} />
        <p className="text-[10px] uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-base font-medium tabular-nums">{value.toLocaleString()}</p>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-none">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink tabular-nums">{value.toLocaleString()}</span>
    </div>
  );
}