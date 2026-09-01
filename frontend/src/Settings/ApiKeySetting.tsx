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
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import CreateApiKeyModal from '@/Settings/CreateApiKeyModal'

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  revoked: boolean;
  createdAt: string;
  lastUsed: string | null;
}

export default function ApiKeySetting() {
  const { user } = useAuth();

  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);

  const organizationId = user?.workspace?.id ?? "";

  const canManage =
    user?.workspace?.role === "OWNER" ||
    user?.workspace?.role === "ADMIN";

  async function loadKeys() {
    try {
      setLoading(true);
      setError("");
      const res = await api.getApiKeys(organizationId);
      setKeys(res.keys);
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
      });
      setNewKey(res.apiKey);
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

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-xl font-semibold">
            API Keys
          </h1>

          <p className="text-xs text-ink-muted mt-1">
            Manage API keys for external access to your Relay AI assistant.
          </p>

        </div>

        {canManage && (

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-copper px-4 py-2 text-xs font-medium text-white transition hover:bg-copper/90"
          >
            <Plus size={14} />
            Create API Key
          </button>

        )}

      </div>

      {/* NEW KEY BANNER */}

      {newKey && (

        <div className="rounded-2xl border border-green-200 bg-green-50 p-5">

          <div className="flex items-start gap-3">

            <CheckCircle2
              size={18}
              className="text-green-600 mt-0.5"
            />

            <div className="flex-1">

              <div className="flex items-center justify-between">

                <p className="text-sm font-semibold text-green-700">
                  API Key Created Successfully
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
                  {newKey}
                </code>

                <button
                  onClick={() => handleCopy(newKey, "new")}
                  className="rounded-lg border border-green-200 p-2 hover:bg-green-50 transition"
                >
                  {copiedId === "new" ? (
                    <CheckCircle2 size={14} className="text-green-600" />
                  ) : (
                    <Copy size={14} className="text-green-600" />
                  )}
                </button>

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

      {/* API KEYS TABLE */}

      <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">

        <div className="flex items-center justify-between border-b border-border px-5 py-4">

          <div className="flex items-center gap-2">

            <KeyRound
              size={17}
              className="text-copper"
            />

            <h2 className="text-sm font-semibold">
              Active API Keys
            </h2>

          </div>

          <span className="text-[11px] text-ink-muted">
            {keys.length} {keys.length === 1 ? "Key" : "Keys"}
          </span>

        </div>

        {loading ? (

          <div className="flex justify-center py-16">

            <Loader2
              className="animate-spin text-copper"
              size={22}
            />

          </div>

        ) : keys.length === 0 ? (

          <div className="flex flex-col items-center justify-center py-16 text-center">

            <KeyRound
              size={32}
              className="text-ink-faint mb-3"
            />

            <p className="text-sm font-medium text-ink-muted">
              No API keys yet
            </p>

            <p className="text-xs text-ink-faint mt-1">
              Create an API key to allow external apps to access your assistant.
            </p>

          </div>

        ) : (

          <table className="w-full">

            <thead className="bg-canvas border-b border-border">

              <tr className="text-[11px] uppercase tracking-wide text-ink-faint">

                <th className="px-5 py-3 text-left">
                  Name
                </th>

                <th className="px-5 py-3 text-left">
                  Key
                </th>

                <th className="px-5 py-3 text-left">
                  Created
                </th>

                <th className="px-5 py-3 text-left">
                  Last Used
                </th>

                <th className="px-5 py-3 text-right">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {keys.map((apiKey) => (

                <tr
                  key={apiKey.id}
                  className="border-b border-border hover:bg-canvas/60 transition"
                >

                  {/* NAME */}

                  <td className="px-5 py-4">

                    <p className="text-xs font-semibold">
                      {apiKey.name}
                    </p>

                  </td>

                  {/* KEY */}

                 {/* KEY */}
<td className="px-5 py-4">
  <div className="flex items-center gap-2">
    <code className="text-[11px] font-mono text-ink-muted bg-canvas px-2 py-1 rounded-lg border border-border">
      {apiKey.prefix}••••••••••••
    </code>

    <button
      onClick={() => handleCopy(apiKey.prefix, apiKey.id)}
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

                  {/* CREATED */}

                  <td className="px-5 py-4 text-[11px] text-ink-muted">
                    {new Date(apiKey.createdAt).toLocaleDateString()}
                  </td>

                  {/* LAST USED */}

                  <td className="px-5 py-4 text-[11px] text-ink-muted">
                    {apiKey.lastUsed
                      ? new Date(apiKey.lastUsed).toLocaleDateString()
                      : "Never"}
                  </td>

                  {/* ACTIONS */}

                  <td className="px-5 py-4">

                    <div className="flex justify-end">

                      {canManage && (

                        <button
                          onClick={() => handleRevoke(apiKey.id)}
                          disabled={revoking === apiKey.id}
                          className="flex items-center gap-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1 text-[11px] transition disabled:opacity-60"
                        >

                          {revoking === apiKey.id ? (

                            <Loader2
                              size={12}
                              className="animate-spin"
                            />

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

        )}

      </div>

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

        </div>

      </div>

      {/* CREATE MODAL */}

      <CreateApiKeyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />

    </div>
  );
}