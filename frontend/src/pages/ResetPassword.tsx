import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, ApiError } from "@/lib/api";
import { Logo } from "@/components/Logo";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
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
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-white">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex mb-6">
            <Logo />
          </div>
          <h1 className="text-2xl font-semibold">Choose a new password</h1>
        </div>

        <div className="panel p-6">
          {done ? (
            <div className="text-center py-2">
              <p className="text-sm text-teal">Password updated. Redirecting to sign in…</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 px-3 py-2.5 rounded-panel bg-danger/10 border border-danger/30 text-danger text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm text-ink-muted mb-1.5">
                    New password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    placeholder="At least 8 characters"
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm text-ink-muted mb-1.5">
                    Confirm password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field"
                    placeholder="Repeat your new password"
                  />
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full">
                  {submitting ? "Updating…" : "Update password"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-ink-muted mt-6">
          <Link to="/login" className="text-copper hover:text-copper-bright font-medium">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
