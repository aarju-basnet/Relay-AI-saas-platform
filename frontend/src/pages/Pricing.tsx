import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import { Logo } from "@/components/Logo";

const FREE_FEATURES = [
  "5 messages per day",
  "Full conversation history",
  "supports 2 business account",
  "Analytics API key for both business",
  "Business Analytics dashboard (visitor traffic)",
  "2 People from team, up to plan seat cap",
];

const PRO_FEATURES = [
  "unlimited messages per day",
  "Full conversation history",
  "50 Team members are allowed",
  "Knowledge Base - upload your own documents",
  "API playground",
  "Analytics API key + Relay AI assistant",
  "Usage dashboard - conversations, messages, busiest hours",
  "Priority support",
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    setError(null);
    setLoading(true);
    try {
      const { url } = await api.createCheckoutSession(interval);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't start checkout, try again.");
      setLoading(false);
    }
  }

  const proPriceUsd = interval === "month" ? "$9" : "$90";
  const proPriceNpr = interval === "month" ? "NPR 999" : "NPR 9,999";
  const proSuffix = interval === "month" ? "/month" : "/year";

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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold mb-2">Simple, transparent pricing</h1>
          <p className="text-ink-muted">Start free. Upgrade whenever you need more room.</p>
        </div>

        {/* BILLING TOGGLE */}
        <div className="flex items-center justify-center gap-1 mb-10">
          <div className="inline-flex rounded-full border border-border bg-canvas p-1">
            <button
              onClick={() => setInterval("month")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                interval === "month"
                  ? "bg-copper text-white"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval("year")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                interval === "year"
                  ? "bg-copper text-white"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Yearly
              <span className="ml-1.5 text-[10px] opacity-80">save ~17%</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-6 px-4 py-3 rounded-panel bg-danger-dim border border-danger/20 text-danger text-sm text-center">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free plan */}
          <div className="panel p-6 flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:z-20">
            <h2 className="text-lg font-semibold mb-1">Free</h2>
            <p className="text-ink-muted text-sm mb-4">For trying things out</p>
            <p className="text-3xl font-semibold mb-1">
              $0<span className="text-base font-normal text-ink-muted">/month</span>
            </p>
            <p className="text-xs text-ink-faint mb-6">NPR 0 for Nepal-based businesses</p>
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
          <div className="rounded-panel border-2 border-copper bg-surface p-6 flex flex-col relative shadow-raised transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:z-20">
            <span className="absolute -top-3 left-6 bg-copper text-white text-xs font-medium px-2.5 py-1 rounded-full">
              Most popular
            </span>
            <h2 className="text-lg font-semibold mb-1">Pro</h2>
            <p className="text-ink-muted text-sm mb-4">For businesses that need more</p>
            <p className="text-3xl font-semibold mb-1">
              {proPriceUsd}<span className="text-base font-normal text-ink-muted">{proSuffix}</span>
            </p>
            <p className="text-xs text-ink-faint mb-6">{proPriceNpr} for Nepal-based businesses</p>
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
        </div>

        <p className="text-center text-xs text-ink-faint mt-10">
          Nepal-based businesses can pay via eSewa or Khalti from your billing settings. Cancel anytime, no long-term commitment.
        </p>
      </main>
    </div>
  );
}