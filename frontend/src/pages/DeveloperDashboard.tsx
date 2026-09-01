import { useEffect, useState } from "react";

import { api, DeveloperSystemStatus } from "@/lib/api";

import { useAuth } from "@/context/AuthContext";

export default function DeveloperDashboard() {
  const { user } = useAuth();
  const isFree = user?.plan === "FREE";

  const [status, setStatus] =
    useState<DeveloperSystemStatus | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [selectedEndpoint, setSelectedEndpoint] =
    useState("/api/auth/me");

  const [response, setResponse] =
    useState("");

  const [sending, setSending] =
    useState(false);

  async function loadSystemStatus() {
    try {
      const res =
        await api.getDeveloperSystem();

      setStatus(res.status);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSystemStatus();
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

  if (loading) {
    return (
      <div className="p-8 text-sm text-ink-muted">
        Loading Developer Dashboard...
      </div>
    );
  }
  return (
  <div className="space-y-6">

    {/* Header */}

    <div>

      <h1 className="text-xl font-semibold">
        Developer Dashboard
      </h1>

      <p className="text-xs text-ink-muted mt-1">
        Monitor Relay backend services, APIs and workspace health.
      </p>

    </div>

    {/* ====================== */}
    {/* Status Cards */}
    {/* ====================== */}

    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

      <div className="rounded-2xl border border-border bg-surface p-5">

        <p className="text-xs text-ink-muted">
          API Status
        </p>

        <div className="mt-3 flex items-center gap-2">

          <div
            className={`w-3 h-3 rounded-full ${
              status?.apiOnline
                ? "bg-green-500 animate-pulse"
                : "bg-red-500"
            }`}
          />

          <span className="text-sm font-semibold">
            {status?.apiOnline
              ? "Online"
              : "Offline"}
          </span>

        </div>

      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">

        <p className="text-xs text-ink-muted">
          Database
        </p>

        <div className="mt-3 flex items-center gap-2">

          <div
            className={`w-3 h-3 rounded-full ${
              status?.database
                ? "bg-green-500 animate-pulse"
                : "bg-red-500"
            }`}
          />

          <span className="text-sm font-semibold">
            {status?.database
              ? "Connected"
              : "Disconnected"}
          </span>

        </div>

      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">

        <p className="text-xs text-ink-muted">
          AI Service
        </p>

        <div className="mt-3 flex items-center gap-2">

          <div
            className={`w-3 h-3 rounded-full ${
              status?.aiHealthy
                ? "bg-green-500 animate-pulse"
                : "bg-red-500"
            }`}
          />

          <span className="text-sm font-semibold">
            {status?.aiHealthy
              ? "Healthy"
              : "Unavailable"}
          </span>

        </div>

      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">

        <p className="text-xs text-ink-muted">
          Workspace
        </p>

        <div className="mt-3 flex items-center gap-2">

          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />

          <span className="text-sm font-semibold">
            Active
          </span>

        </div>

      </div>

    </div>

    {/* ====================== */}
    {/* Workspace */}
    {/* ====================== */}

    <div className="rounded-2xl border border-border bg-surface">

      <div className="border-b border-border px-5 py-4">

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

    {/* ====================== */}
    {/* API Playground */}
    {/* ====================== */}

   {/* ================================= */}
{/* API Playground */}
{/* ================================= */}

<div className="rounded-2xl border border-border bg-surface overflow-hidden">

  <div className="border-b border-border px-5 py-4 flex items-center justify-between">

    <div>

      <h2 className="text-sm font-semibold">
        API Playground
      </h2>

      <p className="text-xs text-ink-muted mt-1">
        Test backend endpoints directly.
      </p>

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

        <select className="w-full rounded-lg border border-border px-3 py-2 text-sm">

          <option>
            GET /api/auth/me
          </option>

          <option>
            GET /api/team/members
          </option>

          <option>
            GET /api/workspace
          </option>

          <option>
            GET /api/assistant
          </option>

        </select>

      </div>

      <button className="rounded-lg bg-copper text-white px-5 py-2 text-sm">

        Send Request

      </button>

      <div className="rounded-lg border border-border bg-canvas p-4">

        <pre className="text-xs">
{`{
  "status":200,
  "message":"Success"
}`}
        </pre>

      </div>

    </div>

  )}

</div>
    {/* ================================= */}
    {/* Server Metrics */}
    {/* ================================= */}

    <div className="rounded-2xl border border-border bg-surface">

      <div className="border-b border-border px-5 py-4">

        <h2 className="text-sm font-semibold">
          Server Metrics
        </h2>

        <p className="text-xs text-ink-muted mt-1">
          Live backend performance and server health.
        </p>

      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 p-5">

        <div>

          <p className="text-xs text-ink-muted">
            CPU Usage
          </p>

          <p className="text-2xl font-semibold mt-2">
            {status?.cpuUsage ?? 0}%
          </p>

        </div>

        <div>

          <p className="text-xs text-ink-muted">
            Memory
          </p>

          <p className="text-2xl font-semibold mt-2">
            {status?.memoryUsage ?? 0}%
          </p>

        </div>

        <div>

          <p className="text-xs text-ink-muted">
            Uptime
          </p>

          <p className="text-2xl font-semibold mt-2">
            {status?.uptime ?? "0 min"}
          </p>

        </div>

        <div>

          <p className="text-xs text-ink-muted">
            Average Response
          </p>

          <p className="text-2xl font-semibold mt-2">
            {status?.responseTime ?? 0} ms
          </p>

        </div>

      </div>

        </div>

    {/* ================================= */}
    {/* Environment Information */}
    {/* ================================= */}

    <div className="rounded-2xl border border-border bg-surface">

      <div className="border-b border-border px-5 py-4">

        <h2 className="text-sm font-semibold">
          Environment Information
        </h2>

        <p className="text-xs text-ink-muted mt-1">
          Current backend environment and deployment information.
        </p>

      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 p-5">

        <div>

          <p className="text-xs text-ink-muted">
            Environment
          </p>

          <p className="text-sm font-medium mt-2">
            {import.meta.env.DEV
              ? "Development"
              : "Production"}
          </p>

        </div>

        <div>

          <p className="text-xs text-ink-muted">
            Frontend
          </p>

          <p className="text-sm font-medium mt-2">
            React + Vite
          </p>

        </div>

        <div>

          <p className="text-xs text-ink-muted">
            Backend
          </p>

          <p className="text-sm font-medium mt-2">
            Node.js + Express
          </p>

        </div>

        <div>

          <p className="text-xs text-ink-muted">
            Database
          </p>

          <p className="text-sm font-medium mt-2">
            PostgreSQL
          </p>

        </div>

        <div>

          <p className="text-xs text-ink-muted">
            ORM
          </p>

          <p className="text-sm font-medium mt-2">
            Prisma ORM
          </p>

        </div>

        <div>

          <p className="text-xs text-ink-muted">
            Authentication
          </p>

          <p className="text-sm font-medium mt-2">
            JWT + HttpOnly Cookies
          </p>

        </div>

        <div>

          <p className="text-xs text-ink-muted">
            AI Provider
          </p>

          <p className="text-sm font-medium mt-2">
            OpenRouter
          </p>

        </div>

        <div>

          <p className="text-xs text-ink-muted">
            Deployment
          </p>

          <p className="text-sm font-medium mt-2">
            Render
          </p>

        </div>

        <div>

          <p className="text-xs text-ink-muted">
            Version
          </p>

          <p className="text-sm font-medium mt-2">
            Relay v1.0.0
          </p>

        </div>

      </div>

        </div>

    {/* ================================= */}
    {/* Live Debug Console */}
    {/* ================================= */}

   {/* ================================= */}
{/* Live Debug Console */}
{/* ================================= */}

<div className="rounded-2xl border border-border bg-surface overflow-hidden">

  <div className="border-b border-border px-5 py-4 flex items-center justify-between">

    <div>

      <h2 className="text-sm font-semibold">
        Live Debug Console
      </h2>

      <p className="text-xs text-ink-muted mt-1">
        Monitor backend activity in real time.
      </p>

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

        Live Debug Console is available on Pro.

      </p>

      <p className="text-xs text-ink-muted mt-2">

        Upgrade to monitor requests, AI calls,
        billing events and backend logs.

      </p>

    </div>

  ) : (

    <div className="bg-black text-green-400 font-mono text-xs h-72 overflow-y-auto p-4 space-y-2">

      <div>[12:41:22] Server Started</div>

      <div>[12:41:29] PostgreSQL Connected</div>

      <div>[12:41:36] Authentication Ready</div>

      <div>[12:41:45] OpenRouter Connected</div>

    </div>

  )}

</div>

  </div>
  )
};