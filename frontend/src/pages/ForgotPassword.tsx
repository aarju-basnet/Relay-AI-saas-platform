import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Logo } from "@/components/Logo";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.forgotPassword(email);
    } finally {
      // Always show the same success state, even on error - we never reveal
      // whether an email exists in the system.
      setSubmitting(false);
      setSent(true);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-white">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex mb-6">
            <Logo />
          </div>
          <h1 className="text-2xl font-semibold">Reset your password</h1>
          <p className="text-ink-muted text-sm mt-1">We'll email you a link to choose a new one.</p>
        </div>

        <div className="panel p-6">
          {sent ? (
            <div className="text-center py-2">
              <p className="text-sm text-ink">
                If an account exists for <span className="text-copper">{email}</span>, a reset
                link is on its way.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm text-ink-muted mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? "Sending…" : "Send reset link"}
              </button>
            </form>
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
