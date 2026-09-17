import { useEffect, useState, FormEvent } from "react";
import {
  Lock,
  Shield,
  Loader2,
  CheckCircle2,
  Palette,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

import { api, ApiError, ConnectedAccounts } from "@/lib/api";

interface AccountSettingProps {
  onNavigate?: (page: string) => void;
}

export default function AccountSetting({ onNavigate }: AccountSettingProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Account</h1>
        <p className="text-xs text-ink-muted mt-1">
          Manage your essential account credentials and login preferences.
        </p>
      </div>

      {/* Core Account Actions */}
      <ChangePasswordCard />
      <ConnectedAccountsCard />

      {/* Navigation Links to Other Settings Pages */}
      <QuickSettingsLinks onNavigate={onNavigate} />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*                            CHANGE PASSWORD                             */
/* ---------------------------------------------------------------------- */

function ChangePasswordCard() {
  const [accounts, setAccounts] = useState<ConnectedAccounts | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api.getConnectedAccounts().then(setAccounts).catch(() => {});
  }, []);

  const hasPassword = accounts?.password.set ?? true;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSaving(true);
    try {
      const res = await api.changePassword(
        hasPassword ? currentPassword : undefined,
        newPassword
      );
      setSuccess(res.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't update password."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <Lock size={16} className="text-copper" />
        <h2 className="text-sm font-semibold">
          {hasPassword ? "Change Password" : "Set a Password"}
        </h2>
      </div>

      <div className="p-5">
        {!hasPassword && (
          <p className="text-[11px] text-ink-muted mb-4 leading-5">
            You signed up with Google and don't have a password yet. Set one
            below to also be able to log in with your email.
          </p>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
          {hasPassword && (
            <div>
              <label className="mb-1 block text-[11px] text-ink-muted">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-copper/30"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-[11px] text-ink-muted">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-copper/30"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-ink-muted">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-copper/30"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-copper px-5 py-2 text-xs font-medium text-white hover:bg-copper/90 transition disabled:opacity-60 cursor-pointer"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 size={13} className="animate-spin" />
                Saving...
              </span>
            ) : hasPassword ? (
              "Update Password"
            ) : (
              "Set Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*                          CONNECTED ACCOUNTS                            */
/* ---------------------------------------------------------------------- */

function ConnectedAccountsCard() {
  const [accounts, setAccounts] = useState<ConnectedAccounts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getConnectedAccounts()
      .then(setAccounts)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <Shield size={16} className="text-copper" />
        <h2 className="text-sm font-semibold">Connected Accounts</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-copper" size={18} />
        </div>
      ) : (
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-xs font-semibold">Google</p>
              <p className="text-[11px] text-ink-muted mt-0.5">
                {accounts?.google.connected
                  ? "Connected — used for sign in"
                  : "Not connected"}
              </p>
            </div>
            {accounts?.google.connected && (
              <span className="flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2 py-1 text-[10px] font-medium text-green-700">
                <CheckCircle2 size={10} />
                Connected
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*                        MORE SETTINGS REDIRECTS                         */
/* ---------------------------------------------------------------------- */

function QuickSettingsLinks({
  onNavigate,
}: {
  onNavigate?: (page: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden divide-y divide-border">
      {/* Security Link */}
      <button
        type="button"
        onClick={() => onNavigate?.("security")}
        className="w-full text-left flex items-center justify-between px-5 py-4 hover:bg-surface-hover transition group cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-copper/10 text-copper">
            <ShieldCheck size={16} />
          </div>
          <div>
            <p className="text-xs font-semibold group-hover:text-copper transition">
              Advanced Security Settings
            </p>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Set up 2FA and manage active sessions.
            </p>
          </div>
        </div>
        <ChevronRight
          size={16}
          className="text-ink-muted group-hover:text-copper transition"
        />
      </button>

      {/* Appearance Link */}
      <button
        type="button"
        onClick={() => onNavigate?.("appearance")}
        className="w-full text-left flex items-center justify-between px-5 py-4 hover:bg-surface-hover transition group cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-copper/10 text-copper">
            <Palette size={16} />
          </div>
          <div>
            <p className="text-xs font-semibold group-hover:text-copper transition">
              Appearance & Theme
            </p>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Switch theme mode and accent color.
            </p>
          </div>
        </div>
        <ChevronRight
          size={16}
          className="text-ink-muted group-hover:text-copper transition"
        />
      </button>
    </div>
  );
}