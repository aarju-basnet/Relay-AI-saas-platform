import { useEffect, useState, FormEvent } from "react";
import {
  Lock,
  Shield,
  ShieldCheck,
  Monitor,
  Smartphone,
  Loader2,
  CheckCircle2,
  LogOut,
  Chrome,
  Copy,
  Check,
} from "lucide-react";

import { api, ApiError, Session, ConnectedAccounts } from "@/lib/api";

export default function SecuritySetting() {
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-xl font-semibold">Security</h1>
        <p className="text-xs text-ink-muted mt-1">
          Manage your password, connected accounts, and active sessions.
        </p>
      </div>

      <ChangePasswordCard />
      <TwoFactorCard />
      <ConnectedAccountsCard />
      <ActiveSessionsCard />

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
      setError(err instanceof ApiError ? err.message : "Couldn't update password.");
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
            className="rounded-lg bg-copper px-5 py-2 text-xs font-medium text-white hover:bg-copper/90 transition disabled:opacity-60"
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
/*                        TWO-FACTOR AUTHENTICATION                       */
/* ---------------------------------------------------------------------- */

function TwoFactorCard() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<"idle" | "setup" | "backup">("idle");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .getConnectedAccounts()
      .then((res) => setEnabled(res.twoFactorEnabled))
      .finally(() => setLoading(false));
  }, []);

  async function startSetup() {
    setError("");
    setBusy(true);
    try {
      const res = await api.setupTwoFactor();
      setQrCodeDataUrl(res.qrCodeDataUrl);
      setStage("setup");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't start setup.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api.verifyTwoFactor(code);
      setBackupCodes(res.backupCodes);
      setStage("backup");
      setEnabled(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid code.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.disableTwoFactor(disablePassword);
      setEnabled(false);
      setShowDisableForm(false);
      setDisablePassword("");
      setStage("idle");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't disable 2FA.");
    } finally {
      setBusy(false);
    }
  }

  function finishSetup() {
    setStage("idle");
    setQrCodeDataUrl("");
    setCode("");
    setBackupCodes([]);
  }

  function copyBackupCodes() {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <ShieldCheck size={16} className="text-copper" />
        <h2 className="text-sm font-semibold">Two-Factor Authentication</h2>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-copper" size={18} />
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {error}
              </div>
            )}

            {/* IDLE — either enabled or not */}
            {stage === "idle" && !showDisableForm && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold">
                    {enabled ? "Two-factor authentication is on" : "Two-factor authentication is off"}
                  </p>
                  <p className="text-[11px] text-ink-muted mt-0.5 max-w-sm">
                    {enabled
                      ? "Your account requires a code from your authenticator app at login."
                      : "Add an extra layer of security using an authenticator app like Google Authenticator or Authy."}
                  </p>
                </div>

                {enabled ? (
                  <button
                    onClick={() => setShowDisableForm(true)}
                    className="rounded-lg border border-red-200 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition shrink-0"
                  >
                    Disable
                  </button>
                ) : (
                  <button
                    onClick={startSetup}
                    disabled={busy}
                    className="rounded-lg bg-copper px-4 py-2 text-xs font-medium text-white hover:bg-copper/90 transition disabled:opacity-60 shrink-0"
                  >
                    {busy ? <Loader2 size={13} className="animate-spin" /> : "Enable"}
                  </button>
                )}
              </div>
            )}

            {/* DISABLE FORM */}
            {showDisableForm && (
              <form onSubmit={handleDisable} className="space-y-3 max-w-sm">
                <p className="text-[11px] text-ink-muted">
                  Enter your password to confirm disabling two-factor authentication.
                </p>
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-copper/30"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 transition disabled:opacity-60"
                  >
                    {busy ? "Disabling..." : "Confirm Disable"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDisableForm(false);
                      setDisablePassword("");
                      setError("");
                    }}
                    className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-surface-hover transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* SETUP — QR + verify */}
            {stage === "setup" && (
              <div className="space-y-4 max-w-sm">
                <p className="text-[11px] text-ink-muted">
                  Scan this QR code with your authenticator app, then enter the 6-digit code it generates.
                </p>
                {qrCodeDataUrl && (
                  <img
                    src={qrCodeDataUrl}
                    alt="2FA QR Code"
                    className="h-40 w-40 rounded-lg border border-border"
                  />
                )}
                <form onSubmit={handleVerify} className="space-y-3">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="6-digit code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full rounded-lg border border-border px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-copper/30 tracking-widest"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={busy || code.length !== 6}
                      className="rounded-lg bg-copper px-4 py-2 text-xs font-medium text-white hover:bg-copper/90 transition disabled:opacity-60"
                    >
                      {busy ? "Verifying..." : "Verify & Enable"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStage("idle");
                        setError("");
                      }}
                      className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-surface-hover transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* BACKUP CODES */}
            {stage === "backup" && (
              <div className="space-y-4 max-w-sm">
                <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                  <CheckCircle2 size={14} />
                  Two-factor authentication is now enabled.
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1">Save your backup codes</p>
                  <p className="text-[11px] text-ink-muted mb-3">
                    Use one of these if you lose access to your authenticator app. Each code works once.
                  </p>
                  <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-canvas p-3 font-mono text-[11px]">
                    {backupCodes.map((c) => (
                      <span key={c}>{c}</span>
                    ))}
                  </div>
                  <button
                    onClick={copyBackupCodes}
                    className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-copper hover:text-copper/80 transition"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? "Copied" : "Copy codes"}
                  </button>
                </div>
                <button
                  onClick={finishSetup}
                  className="rounded-lg bg-copper px-4 py-2 text-xs font-medium text-white hover:bg-copper/90 transition"
                >
                  Done
                </button>
              </div>
            )}
          </>
        )}
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
            <div className="flex items-center gap-3">
              <Chrome size={18} className="text-ink-muted" />
              <div>
                <p className="text-xs font-semibold">Google</p>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  {accounts?.google.connected
                    ? "Connected — used for sign in"
                    : "Not connected"}
                </p>
              </div>
            </div>
            {accounts?.google.connected && (
              <span className="flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2 py-1 text-[10px] font-medium text-green-700">
                <CheckCircle2 size={10} />
                Connected
              </span>
            )}
          </div>

          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <Lock size={18} className="text-ink-muted" />
              <div>
                <p className="text-xs font-semibold">Password</p>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  {accounts?.password.set
                    ? "Set — you can log in with email"
                    : "Not set"}
                </p>
              </div>
            </div>
            {accounts?.password.set && (
              <span className="flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2 py-1 text-[10px] font-medium text-green-700">
                <CheckCircle2 size={10} />
                Active
              </span>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*                            ACTIVE SESSIONS                             */
/* ---------------------------------------------------------------------- */

function parseDevice(userAgent: string | null): { label: string; isMobile: boolean } {
  if (!userAgent) return { label: "Unknown device", isMobile: false };

  const isMobile = /Mobile|Android|iPhone/i.test(userAgent);

  let browser = "Unknown browser";
  if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Safari")) browser = "Safari";
  else if (userAgent.includes("Edge")) browser = "Edge";

  let os = "";
  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac")) os = "macOS";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";

  return { label: `${browser}${os ? " on " + os : ""}`, isMobile };
}

function ActiveSessionsCard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  function loadSessions() {
    setLoading(true);
    api
      .getSessions()
      .then((res) => setSessions(res.sessions))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadSessions();
  }, []);

  async function handleRevoke(id: string) {
    setRevokingId(id);
    try {
      await api.revokeSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Couldn't revoke session.");
    } finally {
      setRevokingId(null);
    }
  }

  async function handleRevokeAll() {
    if (!confirm("Log out of all other devices?")) return;

    setRevokingAll(true);
    try {
      await api.revokeAllSessions();
      loadSessions();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Couldn't revoke sessions.");
    } finally {
      setRevokingAll(false);
    }
  }

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">

      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Monitor size={16} className="text-copper" />
          <h2 className="text-sm font-semibold">Active Sessions</h2>
        </div>

        {otherSessionsCount > 0 && (
          <button
            onClick={handleRevokeAll}
            disabled={revokingAll}
            className="flex items-center gap-1.5 text-[11px] font-medium text-red-600 hover:text-red-700 transition disabled:opacity-50"
          >
            {revokingAll ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <LogOut size={12} />
            )}
            Log out all other devices
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-copper" size={18} />
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-xs text-ink-faint text-center py-10">
          No active sessions.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {sessions.map((session) => {
            const device = parseDevice(session.userAgent);
            const Icon = device.isMobile ? Smartphone : Monitor;

            return (
              <div
                key={session.id}
                className="flex items-center justify-between px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-copper/10 shrink-0">
                    <Icon size={15} className="text-copper" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold">{device.label}</p>
                      {session.isCurrent && (
                        <span className="rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-[10px] font-medium text-green-700">
                          This device
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-ink-muted mt-0.5">
                      {session.ipAddress ?? "Unknown IP"} · Signed in{" "}
                      {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {!session.isCurrent && (
                  <button
                    onClick={() => handleRevoke(session.id)}
                    disabled={revokingId === session.id}
                    className="text-[11px] font-medium text-red-600 hover:text-red-700 transition disabled:opacity-50"
                  >
                    {revokingId === session.id ? "Revoking..." : "Log out"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}