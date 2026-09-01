import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Settings2,
  Code2,
  Bug,
  KeyRound,
  Sparkles,
  Lock,
  Trash2,
} from "lucide-react";

import {
  api,
  ApiError,
  AdvancedSettings,
} from "@/lib/api";




export default function AdvancedSetting() {
  const {
  developerMode,
  setDeveloperMode,
} = useAuth();
  const { user } = useAuth();
  const [settings, setSettings] =
    useState<AdvancedSettings | null>(null);
    

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  async function loadSettings() {
    try {
      setLoading(true);

      const res =
        await api.getAdvancedSettings();

      setSettings(res.settings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function save(
    field: keyof AdvancedSettings,
    value: boolean
  ) {
    if (!settings) return;

    const previous = settings;

    setSettings({
      ...settings,
      [field]: value,
    });

    try {
      setSaving(true);

      await api.updateAdvancedSettings({
        [field]: value,
      });
    } catch (err) {
      setSettings(previous);

      alert(
        err instanceof ApiError
          ? err.message
          : "Unable to update settings."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteWorkspace() {
    const confirmed = window.confirm(
      "This will permanently delete your workspace and all associated data.\n\nThis action cannot be undone.\n\nContinue?"
    );

    if (!confirmed) return;

    try {
      await api.deleteWorkspace();

      alert("Workspace deleted.");

      window.location.href = "/";
    } catch (err) {
      alert(
        err instanceof ApiError
          ? err.message
          : "Unable to delete workspace."
      );
    }
  }

  if (loading || !settings) {
    return (
      <div className="p-8 text-sm text-ink-muted">
        Loading Advanced Settings...
      </div>
    );
  }

  const isFree =
    settings.plan === "FREE";

  return (
    <div className="space-y-6">

      {/* Header */}

      <div>

        <h1 className="text-xl font-semibold">
          Advanced Settings
        </h1>

        <p className="text-xs text-ink-muted mt-1">
          Configure developer tools,
          debugging, API access and
          workspace controls.
        </p>
      </div>
            {/* Developer Options */}

      <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">

        <div className="border-b border-border px-5 py-4 flex items-center gap-2">

          <Settings2
            size={18}
            className="text-copper"
          />

          <h2 className="text-sm font-semibold">
            Developer Options
          </h2>

        </div>

        {/* Developer Mode */}

        <div className="flex items-center justify-between px-5 py-4 border-b border-border">

          <div className="flex items-start gap-3">

            <Code2
              size={18}
              className="text-copper mt-0.5"
            />

            <div>

              <p className="text-sm font-medium">
                Developer Mode
              </p>

              <p className="text-xs text-ink-muted mt-1">
                Enable developer features for your workspace.
              </p>

            </div>

          </div>

          <button
            disabled={saving}
            onClick={async () => {
  const value = !settings.developerMode;

  await save("developerMode", value);

  setDeveloperMode(value);
}}
            className={`relative h-6 w-11 rounded-full transition ${
                developerMode
                ? "bg-copper"
                : "bg-gray-300"
            }`}
          >

            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                  developerMode
                  ? "translate-x-5"
                  : "translate-x-0.5"
              }`}
            />

          </button>

        </div>

        {/* Debug Logs */}

        <div className="flex items-center justify-between px-5 py-4">

          <div className="flex items-start gap-3">

            <Bug
              size={18}
              className="text-copper mt-0.5"
            />

            <div>

              <p className="text-sm font-medium">
                Debug Logs
              </p>

              <p className="text-xs text-ink-muted mt-1">
                Save additional debugging logs for troubleshooting.
              </p>

            </div>

          </div>

          <button
            disabled={saving}
            onClick={() =>
              save(
                "debugLogs",
                !settings.debugLogs
              )
            }
            className={`relative h-6 w-11 rounded-full transition ${
              settings.debugLogs
                ? "bg-copper"
                : "bg-gray-300"
            }`}
          >

            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                settings.debugLogs
                  ? "translate-x-5"
                  : "translate-x-0.5"
              }`}
            />

          </button>

        </div>

      </div>
            {/* Premium Features */}

      <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">

        <div className="border-b border-border px-5 py-4 flex items-center gap-2">

          <Sparkles
            size={18}
            className="text-copper"
          />

          <h2 className="text-sm font-semibold">
            Premium Features
          </h2>

        </div>

        {/* API Access */}

        <div className="flex items-center justify-between px-5 py-4 border-b border-border">

          <div className="flex items-start gap-3">

            <KeyRound
              size={18}
              className="text-copper mt-0.5"
            />

            <div>

              <div className="flex items-center gap-2">

                <p className="text-sm font-medium">
                  API Access
                </p>

                {isFree && (

                  <span className="rounded-full bg-copper/10 text-copper px-2 py-0.5 text-[10px] font-semibold">
                    PRO
                  </span>

                )}

              </div>

              <p className="text-xs text-ink-muted mt-1">
                Generate API keys and connect Relay with external services.
              </p>

            </div>

          </div>

          {isFree ? (

            <Lock
              size={18}
              className="text-ink-faint"
            />

          ) : (

            <button
              disabled={saving}
              onClick={() =>
                save(
                  "apiAccess",
                  !settings.apiAccess
                )
              }
              className={`relative h-6 w-11 rounded-full transition ${
                settings.apiAccess
                  ? "bg-copper"
                  : "bg-gray-300"
              }`}
            >

              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                  settings.apiAccess
                    ? "translate-x-5"
                    : "translate-x-0.5"
                }`}
              />

            </button>

          )}

        </div>

        {/* Custom Prompt */}

        <div className="flex items-center justify-between px-5 py-4">

          <div className="flex items-start gap-3">

            <Sparkles
              size={18}
              className="text-copper mt-0.5"
            />

            <div>

              <div className="flex items-center gap-2">

                <p className="text-sm font-medium">
                  Custom System Prompt
                </p>

                {isFree && (

                  <span className="rounded-full bg-copper/10 text-copper px-2 py-0.5 text-[10px] font-semibold">
                    PRO
                  </span>

                )}

              </div>

              <p className="text-xs text-ink-muted mt-1">
                Customize your AI assistant's personality and behavior.
              </p>

            </div>

          </div>

          {isFree ? (

            <Lock
              size={18}
              className="text-ink-faint"
            />

          ) : (

            <button
              disabled={saving}
              onClick={() =>
                save(
                  "customPrompt",
                  !settings.customPrompt
                )
              }
              className={`relative h-6 w-11 rounded-full transition ${
                settings.customPrompt
                  ? "bg-copper"
                  : "bg-gray-300"
              }`}
            >

              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                  settings.customPrompt
                    ? "translate-x-5"
                    : "translate-x-0.5"
                }`}
              />

            </button>

          )}

        </div>

      </div>
            {/* Danger Zone */}

      <div className="rounded-2xl border border-red-200 bg-red-50 shadow-sm overflow-hidden">

        <div className="border-b border-red-200 px-5 py-4 flex items-center gap-2">

          <Trash2
            size={18}
            className="text-red-600"
          />

          <div>

            <h2 className="text-sm font-semibold text-red-700">
              Danger Zone
            </h2>

            <p className="text-xs text-red-500 mt-1">
              These actions are permanent and cannot be undone.
            </p>

          </div>

        </div>

        <div className="flex items-center justify-between px-5 py-5">

          <div>

            <p className="text-sm font-medium text-red-700">
              Delete Workspace
            </p>

            <p className="text-xs text-red-500 mt-1">
              Permanently delete your workspace, assistants,
              conversations, team members and every stored setting.
            </p>

          </div>

          {user?.workspace?.role === "OWNER" && (
  <button
    onClick={handleDeleteWorkspace}
    className="rounded-lg bg-red-600 hover:bg-red-700 text-white px-5 py-2 text-xs font-medium transition"
  >
    Delete Workspace
  </button>
)}

        </div>

      </div>

    </div>
  );
}