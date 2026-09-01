import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import { Logo } from "@/components/Logo";

const FREE_FEATURES = ["20 messages every 5 minutes", "Full conversation history", "Free-model fallback chain"];

const PRO_FEATURES = [
  "200 messages every 5 minutes",
  "Full conversation history",
  "Free-model fallback chain",
  "Priority support",
];

const Yearly_FEATURES = [
  "200 messages every 5 minutes",
  "Full conversation history",
  "Free-model fallback chain",
  "Priority support",
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    setError(null);
    setLoading(true);
    try {
      const { url } = await api.createCheckoutSession();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't start checkout, try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Logo size="sm" />
        <div className="flex items-center gap-4">
  <Link
    to="/"
    className="text-sm text-ink-muted hover:text-ink flex items-center gap-1.5"
  >
    <ArrowLeft size={15} />
    Back to Home
  </Link>

  {user ? (
    <button
      onClick={() => navigate("/dashboard")}
      className="text-sm text-copper hover:text-copper-bright font-medium"
    >
      Dashboard
    </button>
  ) : (
    <Link
      to="/login"
      className="text-sm text-copper hover:text-copper-bright font-medium"
    >
      Sign in
    </Link>
  )}
</div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold mb-2">Simple, transparent pricing</h1>
          <p className="text-ink-muted">Start free. Upgrade whenever you need more room.</p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-6 px-4 py-3 rounded-panel bg-danger-dim border border-danger/20 text-danger text-sm text-center">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6 max-w-7xl mx-auto">
          {/* Free plan */}
          <div className="panel p-6 flex flex-col transition-all duration-300 hover:-translate-y-3 hover:scale-105 hover:shadow-2xl hover:z-20 cursor-pointer">
            <h2 className="text-lg font-semibold mb-1">Free</h2>
            <p className="text-ink-muted text-sm mb-4">For trying things out</p>
            <p className="text-3xl font-semibold mb-6">
              $0<span className="text-base font-normal text-ink-muted">/month</span>
            </p>
            <ul className="space-y-3 mb-6 flex-1">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-ink">
                  <Check size={16} className="text-teal shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <button className="btn-secondary w-full" disabled>
              {user && user.plan === "FREE" ? "Current plan" : "Free plan"}
            </button>
          </div>

          {/* Pro plan */}
       <div className="rounded-panel border-2 border-copper bg-surface p-6 flex flex-col relative shadow-raised transition-all duration-300 hover:-translate-y-3 hover:scale-105 hover:shadow-2xl hover:z-20 cursor-pointer">
            <span className="absolute -top-3 left-6 bg-copper text-white text-xs font-medium px-2.5 py-1 rounded-full">
              Most popular
            </span>
            <h2 className="text-lg font-semibold mb-1">Pro</h2>
            <p className="text-ink-muted text-sm mb-4">For everyday use</p>
            <p className="text-3xl font-semibold mb-6">
              $9<span className="text-base font-normal text-ink-muted">/month</span>
            </p>
            <ul className="space-y-3 mb-6 flex-1">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-ink">
                  <Check size={16} className="text-teal shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            {!user ? (
              <Link to="/register" className="btn-primary w-full text-center">
                Sign up to upgrade
              </Link>
            ) : user.plan === "PRO" ? (
              <button className="btn-secondary w-full" disabled>
                Current plan
              </button>
            ) : (
              <button onClick={handleUpgrade} disabled={loading} className="btn-primary w-full">
                {loading ? "Redirecting…" : "Upgrade to Pro"}
              </button>
            )}
          </div>

         <div className="panel p-6 flex flex-col transition-all duration-300 hover:-translate-y-3 hover:scale-105 hover:shadow-2xl hover:z-20 cursor-pointer">
            <h2 className="text-lg font-semibold mb-1">Free</h2>
            <p className="text-ink-muted text-sm mb-4">For trying things out</p>
            <p className="text-3xl font-semibold mb-6">
              $90<span className="text-base font-normal text-ink-muted">/year</span>
            </p>
            <ul className="space-y-3 mb-6 flex-1">
              {Yearly_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-ink">
                  <Check size={16} className="text-teal shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <button className="btn-secondary w-full" disabled>
              {user && user.plan === "FREE" ? "Current plan" : "Free plan"}
            </button>
          </div>

        </div>

        <p className="text-center text-xs text-ink-faint mt-10">
          Payments are processed securely by Stripe. Cancel anytime from your billing settings.
        </p>
      </main>
    </div>
  );
}
