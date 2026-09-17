import { useEffect, useState } from "react";
import { LayoutGrid, Terminal, ScrollText } from "lucide-react";

import { api, ApiError, DebugLogEntry } from "@/lib/api";

import { useAuth } from "@/context/AuthContext";

function formatLogTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour12: false });
}

function levelColor(level: string): string {
  switch (level) {
    case "ERROR":
      return "text-red-400";
    case "WARNING":
      return "text-amber-400";
    default:
      return "text-green-400";
  }
}

export default function DeveloperDashboard() {
  const { user } = useAuth();
  const isFree = user?.plan === "FREE";

  const [selectedEndpoint, setSelectedEndpoint] =
    useState("/api/auth/me");

  const [response, setResponse] =
    useState("");

  const [sending, setSending] =
    useState(false);

  // ---- Live Debug Console state ----
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState<"none" | "not-enabled" | "other">("none");
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);

  async function loadLogs(page = 1) {
    setLogsLoading(true);
    try {
      const res = await api.getDeveloperLogs(page);
      setLogs(res.logs);
      setLogsPage(res.page);
      setLogsTotalPages(res.totalPages);
      setLogsError("none");
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setLogsError("not-enabled");
      } else {
        setLogsError("other");
      }
    } finally {
      setLogsLoading(false);
    }
  }

  useEffect(() => {
    if (!isFree) loadLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRequest() {
    try {
      setSending(true);

      let result: any;

      switch (selectedEndpoint) {
        case "/api/auth/me":
          result = await api.getMe();
          break;

        case "/api/workspace":
          result = await api.getWorkspaceSettings();
          break;

        case "/api/team/members":
          result = await api.getTeamMembers();
          break;

        case "/api/assistant":
          result = await api.getAssistant();
          break;

        default:
          result = {
            message: "Unknown endpoint",
          };
      }

      setResponse(
        JSON.stringify(result, null, 2)
      );
    } catch (err: any) {
      setResponse(
        JSON.stringify(
          {
            error:
              err.message ||
              "Request Failed",
          },
          null,
          2
        )
      );
    } finally {
      setSending(false);
    }
  }

  return (
  <div className="w-full h-full min-h-screen bg-white dark:bg-canvas text-ink p-8 space-y-6">

    {/* Header */}

    <div>

      <h1 className="text-xl font-semibold">
        Developer Dashboard
      </h1>

      <p className="text-xs text-ink-muted mt-1">
        Test your APIs and monitor request activity for your workspace.
      </p>

    </div>

    {/* ====================== */}
    {/* Workspace */}
    {/* ====================== */}

    <div className="rounded-2xl border border-border bg-surface shadow-sm">

      <div className="border-b border-border px-5 py-4 flex items-center gap-2">

        <LayoutGrid size={16} className="text-copper" />

        <h2 className="text-sm font-semibold">
          Workspace Information
        </h2>

      </div>

      <div className="grid md:grid-cols-2 gap-6 p-5">

        <div>

          <p className="text-xs text-ink-muted">
            Workspace Name
          </p>

          <p className="text-sm font-medium mt-1">
            {user?.workspace?.name}
          </p>

        </div>

        <div>

          <p className="text-xs text-ink-muted">
            Current Plan
          </p>

          <p className="text-sm font-medium mt-1">
            {user?.plan}
          </p>

        </div>

        <div>

          <p className="text-xs text-ink-muted">
            Workspace Role
          </p>

          <p className="text-sm font-medium mt-1">
            {user?.workspace?.role}
          </p>

        </div>

        <div>

          <p className="text-xs text-ink-muted">
            Logged In As
          </p>

          <p className="text-sm font-medium mt-1">
            {user?.email}
          </p>

        </div>

      </div>

    </div>

    {/* ================================= */}
    {/* API Playground */}
    {/* ================================= */}

<div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">

  <div className="border-b border-border px-5 py-4 flex items-center justify-between">

    <div className="flex items-center gap-2">

      <Terminal size={16} className="text-copper" />

      <div>

        <h2 className="text-sm font-semibold">
          API Playground
        </h2>

        <p className="text-xs text-ink-muted mt-1">
          Test backend endpoints directly.
        </p>

      </div>

    </div>

    {isFree && (

      <span className="rounded-full bg-copper/10 text-copper px-2 py-1 text-[10px] font-semibold">

        PRO

      </span>

    )}

  </div>

  {isFree ? (

    <div className="p-10 text-center">

      <p className="text-sm font-medium">
        API Playground is available on Pro.
      </p>

      <p className="text-xs text-ink-muted mt-2">
        Upgrade your workspace to test endpoints,
        inspect responses and debug APIs.
      </p>

    </div>

  ) : (

    <div className="p-5 space-y-4">

      <div>

        <label className="block text-xs text-ink-muted mb-2">
          Endpoint
        </label>

        <select
          value={selectedEndpoint}
          onChange={(e) => setSelectedEndpoint(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-surface"
        >

          <option value="/api/auth/me">
            GET /api/auth/me
          </option>

          <option value="/api/team/members">
            GET /api/team/members
          </option>

          <option value="/api/workspace">
            GET /api/workspace
          </option>

          <option value="/api/assistant">
            GET /api/assistant
          </option>

        </select>

      </div>

      <button
        onClick={handleRequest}
        disabled={sending}
        className="rounded-lg bg-copper text-white px-5 py-2 text-sm disabled:opacity-60"
      >
        {sending ? "Sending..." : "Send Request"}
      </button>

      <div className="rounded-lg border border-border bg-canvas p-4">

        <pre className="text-xs overflow-x-auto">
{response || `{\n  "status": 200,\n  "message": "Send a request to see the response"\n}`}
        </pre>

      </div>

    </div>

  )}

</div>

    {/* ================================= */}
    {/* Live Debug Console */}
    {/* ================================= */}

<div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">

  <div className="border-b border-border px-5 py-4 flex items-center justify-between">

    <div className="flex items-center gap-2">

      <ScrollText size={16} className="text-copper" />

      <div>

        <h2 className="text-sm font-semibold">
          Live Debug Console
        </h2>

        <p className="text-xs text-ink-muted mt-1">
          Widget and API request logs for this workspace.
        </p>

      </div>

    </div>

    <div className="flex items-center gap-2">
      {!isFree && logsError === "none" && (
        <button
          onClick={() => loadLogs(logsPage)}
          disabled={logsLoading}
          className="text-[11px] font-medium text-copper hover:text-copper/80 transition disabled:opacity-50"
        >
          Refresh
        </button>
      )}

      {isFree && (
        <span className="rounded-full bg-copper/10 text-copper px-2 py-1 text-[10px] font-semibold">
          PRO
        </span>
      )}
    </div>

  </div>

  {isFree ? (

    <div className="p-10 text-center">

      <p className="text-sm font-medium">

        Live Debug Console is available on Pro.

      </p>

      <p className="text-xs text-ink-muted mt-2">

        Upgrade to monitor requests, AI calls,
        billing events and backend logs.

      </p>

    </div>

  ) : logsError === "not-enabled" ? (

    <div className="p-10 text-center">
      <p className="text-sm font-medium">
        Debug Logs are turned off for this workspace.
      </p>
      <p className="text-xs text-ink-muted mt-2">
        Enable "Debug Logs" under Settings → Advanced to start capturing widget and API request activity here.
      </p>
    </div>

  ) : logsError === "other" ? (

    <div className="p-10 text-center">
      <p className="text-sm font-medium text-red-600">
        Couldn't load logs right now.
      </p>
      <button
        onClick={() => loadLogs(1)}
        className="mt-3 text-[11px] font-medium text-copper hover:text-copper/80 transition"
      >
        Try again
      </button>
    </div>

  ) : (

    <>
      <div className="bg-black text-green-400 font-mono text-xs h-72 overflow-y-auto p-4 space-y-1.5">

        {logsLoading ? (
          <div className="text-ink-faint">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-ink-faint">
            No requests logged yet. Traffic to your embedded widget will show up here.
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className={levelColor(log.level)}>
              [{formatLogTime(log.createdAt)}] {log.message}
            </div>
          ))
        )}

      </div>

      {logsTotalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <button
            onClick={() => loadLogs(logsPage - 1)}
            disabled={logsPage <= 1 || logsLoading}
            className="text-[11px] font-medium text-copper hover:text-copper/80 transition disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-[11px] text-ink-muted">
            Page {logsPage} of {logsTotalPages}
          </span>
          <button
            onClick={() => loadLogs(logsPage + 1)}
            disabled={logsPage >= logsTotalPages || logsLoading}
            className="text-[11px] font-medium text-copper hover:text-copper/80 transition disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </>

  )}

</div>

  </div>
  )
};