import { useEffect, useState } from "react";

import {
  KeyRound,
  Plus,
  Trash2,
  Loader2,
  Copy,
  CheckCircle2,
  X,
  AlertCircle,
  Code2,
  BarChart3,
  Bot,
  Lock,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import CreateApiKeyModal from '@/Settings/CreateApiKeyModal'

type ApiKeyType = "ANALYTICS" | "ASSISTANT";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  type: ApiKeyType;
  revoked: boolean;
  createdAt: string;
  lastUsed: string | null;
}

// The public backend URL your widget script talks to - this is NOT the
// admin dashboard's own API_BASE (which may be localhost during dev).
// The snippet shown to business owners must always point at your real
// production backend, since it runs on THEIR site, not yours.
const WIDGET_API_BASE_URL =
  import.meta.env.VITE_WIDGET_API_URL || "https://relay-backend.onrender.com";

function buildEmbedSnippet(key: string): string {
  return `<link rel="stylesheet" href="${WIDGET_API_BASE_URL}/widget.css" />
<script
  src="${WIDGET_API_BASE_URL}/widget.js"
  data-api-key="${key}"
  data-api-base-url="${WIDGET_API_BASE_URL}"
></script>`;
}

export default function ApiKeySetting() {
  const { user, activeWorkspace } = useAuth();

  const [tab, setTab] = useState<ApiKeyType>("ANALYTICS");

  const [analyticsKeys, setAnalyticsKeys] = useState<ApiKey[]>([]);
  const [assistantKeys, setAssistantKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<{ value: string; type: ApiKeyType } | null>(null);

  const organizationId = activeWorkspace?.id ?? "";

  const canManage =
    activeWorkspace?.role === "OWNER" ||
    activeWorkspace?.role === "ADMIN";

  const isFreePlan = user?.plan === "FREE";

  async function loadKeys() {
    try {
      setLoading(true);
      setError("");
      const [analyticsRes, assistantRes] = await Promise.all([
        api.getApiKeys(organizationId, "ANALYTICS"),
        api.getApiKeys(organizationId, "ASSISTANT"),
      ]);
      setAnalyticsKeys(analyticsRes.keys);
      setAssistantKeys(assistantRes.keys);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to load API keys."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (organizationId) loadKeys();
  }, [organizationId]);

  async function handleCreate(name: string) {
    try {
      const res = await api.createApiKey({
        name,
        organizationId,
        type: tab,
      });
      setNewKey({ value: res.apiKey, type: tab });
      await loadKeys();
      setModalOpen(false);
    } catch (err) {
      alert(
        err instanceof ApiError
          ? err.message
          : "Failed to create API key."
      );
    }
  }

  async function handleRevoke(id: string) {
    const ok = window.confirm(
      "Revoke this API key? This action cannot be undone."
    );
    if (!ok) return;

    try {
      setRevoking(id);
      await api.revokeApiKey(id);
      await loadKeys();
      if (newKey) setNewKey(null);
    } catch (err) {
      alert(
        err instanceof ApiError
          ? err.message
          : "Failed to revoke API key."
      );
    } finally {
      setRevoking(null);
    }
  }

  function handleCopy(key: string, id: string) {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const activeKeys = tab === "ANALYTICS" ? analyticsKeys : assistantKeys;
  const isAssistantLocked = tab === "ASSISTANT" && isFreePlan;

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div>
        <h1 className="text-xl font-semibold">
          API Keys
        </h1>

        <p className="text-xs text-ink-muted mt-1">
          Manage keys for embedding Relay on your website.
        </p>
      </div>

      {/* TABS */}

      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setTab("ANALYTICS")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
            tab === "ANALYTICS"
              ? "border-copper text-copper"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          <BarChart3 size={15} />
          Business Analytics
        </button>

        <button
          onClick={() => setTab("ASSISTANT")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
            tab === "ASSISTANT"
              ? "border-copper text-copper"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          <Bot size={15} />
          Enable Relay AI Assistant
        </button>
      </div>

      {/* NEW KEY BANNER */}

      {newKey && newKey.type === tab && (

        <div className="rounded-2xl border border-green-200 bg-green-50 p-5">

          <div className="flex items-start gap-3">

            <CheckCircle2
              size={18}
              className="text-green-600 mt-0.5"
            />

            <div className="flex-1">

              <div className="flex items-center justify-between">

                <p className="text-sm font-semibold text-green-700">
                  {newKey.type === "ASSISTANT" ? "AI Assistant" : "Analytics"} API Key Created Successfully
                </p>

                <button
                  onClick={() => setNewKey(null)}
                  className="rounded-lg p-1.5 hover:bg-green-100 transition"
                >
                  <X size={15} className="text-green-600" />
                </button>

              </div>

              <p className="mt-1 text-xs leading-6 text-green-600">
                Copy your key now — it will not be shown again after you leave this page.
              </p>

              <div className="mt-3 flex items-center gap-3 rounded-lg border border-green-200 bg-white px-4 py-3">

                <code className="flex-1 text-xs font-mono text-green-800 break-all">
                  {newKey.value}
                </code>

                <button
                  onClick={() => handleCopy(newKey.value, "new")}
                  className="rounded-lg border border-green-200 p-2 hover:bg-green-50 transition"
                >
                  {copiedId === "new" ? (
                    <CheckCircle2 size={14} className="text-green-600" />
                  ) : (
                    <Copy size={14} className="text-green-600" />
                  )}
                </button>

              </div>

              <div className="mt-4">

                <p className="text-xs font-semibold text-green-700">
                  Add this to your website
                </p>

                <p className="mt-1 text-[11px] leading-5 text-green-600">
                  Paste this right before the closing <code className="font-mono">&lt;/body&gt;</code> tag on every page you want {newKey.type === "ASSISTANT" ? "the chat widget" : "analytics tracking"} to appear.
                  {newKey.type === "ASSISTANT" && (
                    <> This one snippet also tracks analytics automatically — you don't need a separate Analytics key or snippet alongside it.</>
                  )}
                </p>

                <div className="mt-2 relative rounded-lg border border-green-200 bg-[#0d0e12] p-4">

                  <button
                    onClick={() => handleCopy(buildEmbedSnippet(newKey.value), "snippet")}
                    className="absolute top-3 right-3 rounded-lg border border-white/10 p-1.5 hover:bg-white/10 transition"
                  >
                    {copiedId === "snippet" ? (
                      <CheckCircle2 size={13} className="text-green-400" />
                    ) : (
                      <Copy size={13} className="text-white/70" />
                    )}
                  </button>

                  <pre className="text-[11px] font-mono text-green-300 leading-6 overflow-x-auto pr-8">
{buildEmbedSnippet(newKey.value)}
                  </pre>

                </div>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* ERROR */}

      {error && (

        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-2">

          <AlertCircle size={15} className="text-red-500" />

          <p className="text-xs text-red-600">
            {error}
          </p>

        </div>

      )}

      {/* ACTIVE TAB CONTENT */}

      {isAssistantLocked ? (
        <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
          <div className="flex flex-col items-center justify-center py-14 text-center px-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-copper/10 mb-4">
              <Lock size={20} className="text-copper" />
            </div>
            <h3 className="text-sm font-semibold">AI Assistant keys are a Pro feature</h3>
            <p className="text-[11px] text-ink-muted mt-1.5 max-w-sm">
              Upgrade to Pro to generate an Assistant key and put the AI chat widget on your website.
            </p>
            <Link
              to="/pricing"
              className="mt-4 rounded-lg bg-copper px-4 py-2 text-xs font-medium text-white hover:bg-copper/90 transition"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">

          <div className="flex items-center justify-between border-b border-border px-5 py-4">

            <div className="flex items-center gap-2">
              {tab === "ANALYTICS" ? (
                <BarChart3 size={17} className="text-copper" />
              ) : (
                <Bot size={17} className="text-copper" />
              )}
              <h2 className="text-sm font-semibold">
                {tab === "ANALYTICS" ? "Business Analytics Keys" : "AI Assistant Keys"}
              </h2>
            </div>

            <span className="text-[11px] text-ink-muted">
              {activeKeys.length} {activeKeys.length === 1 ? "Key" : "Keys"}
            </span>

          </div>

          <ApiKeyTable
            keys={activeKeys}
            loading={loading}
            canManage={canManage}
            revoking={revoking}
            copiedId={copiedId}
            onCopy={handleCopy}
            onRevoke={handleRevoke}
            emptyLabel={tab === "ANALYTICS" ? "No analytics keys yet" : "No assistant keys yet"}
            emptyHint={
              tab === "ANALYTICS"
                ? "Create a key to start tracking visitors on your website."
                : "Create a key to put the AI chat widget on your website."
            }
          />

          {canManage && (
            <div className="border-t border-border px-5 py-4">
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-copper px-4 py-2 text-xs font-medium text-white transition hover:bg-copper/90"
              >
                <Plus size={14} />
                Create {tab === "ANALYTICS" ? "Analytics" : "Assistant"} Key
              </button>
            </div>
          )}

          <SnippetReferenceCard
            title={`How to use your ${tab === "ANALYTICS" ? "Analytics" : "Assistant"} key`}
            description={
              tab === "ANALYTICS"
                ? "Paste this on every page where you want visitor tracking, replacing the placeholder with a real key from above. No chat bubble will appear on your site with this key."
                : "Paste this right before the closing </body> tag on every page you want the AI chat widget to appear, replacing the placeholder with a real key from above. This key also tracks analytics automatically, so if you already have an Assistant key, you don't need to add the Analytics snippet separately — one snippet covers both."
            }
            placeholder={tab === "ANALYTICS" ? "YOUR_ANALYTICS_API_KEY" : "YOUR_ASSISTANT_API_KEY"}
            copyId={`reference-${tab}`}
            copiedId={copiedId}
            onCopy={handleCopy}
          />

        </div>
      )}

      {/* INFO CARD */}

      <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">

        <div className="flex items-center gap-2 border-b border-border px-5 py-4">

          <AlertCircle
            size={17}
            className="text-copper"
          />

          <h2 className="text-sm font-semibold">
            Important Notes
          </h2>

        </div>

        <div className="divide-y divide-border">

          <div className="p-5">

            <h3 className="text-xs font-medium">
              Keep your API keys secret
            </h3>

            <p className="mt-2 text-[11px] leading-6 text-ink-muted">
              Never expose API keys in client-side code or public repositories.
              Treat them like passwords.
            </p>

          </div>

          <div className="p-5">

            <h3 className="text-xs font-medium">
              Keys are shown only once
            </h3>

            <p className="mt-2 text-[11px] leading-6 text-ink-muted">
              After creation, the full key is only displayed once. Store it
              securely in your environment variables.
            </p>

          </div>

          <div className="p-5">

            <h3 className="text-xs font-medium">
              Revoking a key is permanent
            </h3>

            <p className="mt-2 text-[11px] leading-6 text-ink-muted">
              Once revoked, a key cannot be restored. Any application using
              it will lose access immediately.
            </p>

          </div>

          <div className="p-5">

            <h3 className="text-xs font-medium flex items-center gap-1.5">
              <Code2 size={13} className="text-copper" />
              Analytics keys and Assistant keys are not interchangeable
            </h3>

            <p className="mt-2 text-[11px] leading-6 text-ink-muted">
              Pasting an Analytics key into your site's embed snippet enables
              visitor tracking only — no chat bubble appears. An Assistant key
              unlocks the AI chat widget and includes analytics tracking
              automatically, so a Pro business only ever needs to embed one
              snippet — the Assistant one — not both.
            </p>

          </div>

        </div>

      </div>

      {/* CREATE MODAL */}

      <CreateApiKeyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
        keyType={tab}
      />

    </div>
  );
}

function SnippetReferenceCard({
  title,
  description,
  placeholder,
  copyId,
  copiedId,
  onCopy,
}: {
  title: string;
  description: string;
  placeholder: string;
  copyId: string;
  copiedId: string | null;
  onCopy: (value: string, id: string) => void;
}) {
  return (
    <div className="border-t border-border p-5">
      <div className="flex items-center gap-2 mb-2">
        <Code2 size={14} className="text-copper" />
        <h3 className="text-xs font-semibold">{title}</h3>
      </div>

      <p className="text-[11px] leading-6 text-ink-muted mb-3">
        {description}
      </p>

      <div className="relative rounded-lg border border-border bg-[#0d0e12] p-4">
        <button
          onClick={() => onCopy(buildEmbedSnippet(placeholder), copyId)}
          className="absolute top-3 right-3 rounded-lg border border-white/10 p-1.5 hover:bg-white/10 transition"
        >
          {copiedId === copyId ? (
            <CheckCircle2 size={13} className="text-green-400" />
          ) : (
            <Copy size={13} className="text-white/70" />
          )}
        </button>

        <pre className="text-[11px] font-mono text-green-300 leading-6 overflow-x-auto pr-8">
{buildEmbedSnippet(placeholder)}
        </pre>
      </div>
    </div>
  );
}

function ApiKeyTable({
  keys,
  loading,
  canManage,
  revoking,
  copiedId,
  onCopy,
  onRevoke,
  emptyLabel,
  emptyHint,
}: {
  keys: ApiKey[];
  loading: boolean;
  canManage: boolean;
  revoking: string | null;
  copiedId: string | null;
  onCopy: (value: string, id: string) => void;
  onRevoke: (id: string) => void;
  emptyLabel: string;
  emptyHint: string;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-copper" size={22} />
      </div>
    );
  }

  if (keys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <KeyRound size={32} className="text-ink-faint mb-3" />
        <p className="text-sm font-medium text-ink-muted">{emptyLabel}</p>
        <p className="text-xs text-ink-faint mt-1">{emptyHint}</p>
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead className="bg-canvas border-b border-border">
        <tr className="text-[11px] uppercase tracking-wide text-ink-faint">
          <th className="px-5 py-3 text-left">Name</th>
          <th className="px-5 py-3 text-left">Key</th>
          <th className="px-5 py-3 text-left">Created</th>
          <th className="px-5 py-3 text-left">Last Used</th>
          <th className="px-5 py-3 text-right">Actions</th>
        </tr>
      </thead>

      <tbody>
        {keys.map((apiKey) => (
          <tr key={apiKey.id} className="border-b border-border hover:bg-canvas/60 transition">
            <td className="px-5 py-4">
              <p className="text-xs font-semibold">{apiKey.name}</p>
            </td>

            <td className="px-5 py-4">
              <div className="flex items-center gap-2">
                <code className="text-[11px] font-mono text-ink-muted bg-canvas px-2 py-1 rounded-lg border border-border">
                  {apiKey.prefix}••••••••••••
                </code>

                <button
                  onClick={() => onCopy(apiKey.prefix, apiKey.id)}
                  className="rounded-lg p-1.5 hover:bg-canvas border border-border transition"
                >
                  {copiedId === apiKey.id ? (
                    <CheckCircle2 size={13} className="text-green-600" />
                  ) : (
                    <Copy size={13} className="text-ink-muted" />
                  )}
                </button>
              </div>
            </td>

            <td className="px-5 py-4 text-[11px] text-ink-muted">
              {new Date(apiKey.createdAt).toLocaleDateString()}
            </td>

            <td className="px-5 py-4 text-[11px] text-ink-muted">
              {apiKey.lastUsed ? new Date(apiKey.lastUsed).toLocaleDateString() : "Never"}
            </td>

            <td className="px-5 py-4">
              <div className="flex justify-end">
                {canManage && (
                  <button
                    onClick={() => onRevoke(apiKey.id)}
                    disabled={revoking === apiKey.id}
                    className="flex items-center gap-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1 text-[11px] transition disabled:opacity-60"
                  >
                    {revoking === apiKey.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Trash2 size={12} />
                    )}
                    Revoke
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}