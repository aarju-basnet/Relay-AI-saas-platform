import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, ApiError } from "@/lib/api";
import { Logo } from "@/components/Logo";
import { Loader2 } from "lucide-react";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const isInvite = searchParams.get("invite") === "true";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("This link is missing a reset token.");
      return;
    }
    if (password.length < 8) {
      setError("Password needs to be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-4 bg-white">
      <div className="w-full max-w-sm">
        <div className="mb-4 text-center">
          <div className="inline-flex mb-3">
            <Logo />
          </div>
          <h1 className="text-[23px] font-semibold leading-tight">
            {isInvite ? "Accept your invite" : "Choose a new password"}
          </h1>
          <p className="text-ink-muted text-xs mt-0.5">
            {isInvite
              ? "Set a password to activate your account and join your team."
              : "Enter a new password for your account."}
          </p>
        </div>

        <div className="panel p-5">
          {done ? (
            <div className="text-center py-2">
              <p className="text-sm text-teal">
                {isInvite ? "You're all set. Redirecting to sign in…" : "Password updated. Redirecting to sign in…"}
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-3 px-3 py-2 rounded-panel bg-danger/10 border border-danger/30 text-danger text-xs">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label htmlFor="password" className="block text-xs text-ink-muted mb-1">
                    {isInvite ? "Create a password" : "New password"}
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field text-sm py-1.5"
                    placeholder="At least 8 characters"
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs text-ink-muted mb-1">
                    Confirm password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field text-sm py-1.5"
                    placeholder="Repeat your password"
                  />
                </div>
             // before
<button
  type="submit"
  disabled={submitting}
  className="btn-primary w-full py-2 text-sm transition-opacity"
>
  {submitting ? "Setting up…" : isInvite ? "Accept invite & set password" : "Update password"}
</button>

// after
<button
  type="submit"
  disabled={submitting}
  className="btn-primary w-full py-2 text-sm transition-opacity flex items-center justify-center gap-2"
>
  {submitting ? (
    <>
      <Loader2 size={14} className="animate-spin" />
      Setting up…
    </>
  ) : isInvite ? (
    "Accept invite & set password"
  ) : (
    "Update password"
  )}
</button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-ink mt-4">
          <Link to="/login" className="text-copper hover:text-copper-bright font-medium">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}