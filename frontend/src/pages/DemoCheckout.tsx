import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CreditCard, Lock, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function DemoCheckout() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [params] = useSearchParams();

  const interval = params.get("interval") === "year" ? "year" : "month";

  const [loading, setLoading] = useState(false);

  async function completePayment() {
    try {
      setLoading(true);
      const res = await api.demoUpgrade(interval);
      alert(res.message);
      await refreshUser();
      navigate('/dashboard?upgraded=true');
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Unable to complete payment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">

        {/* HEADER */}

        <div className="flex items-center gap-3 border-b border-border px-6 py-5">
          <CreditCard size={18} className="text-copper" />
          <div>
            <h1 className="text-sm font-semibold">Checkout</h1>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Secure demo payment experience
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">

          {/* PRODUCT */}

          <div className="rounded-2xl border border-copper/20 bg-copper/5 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">Relay AI Pro</p>
                <p className="text-xs text-ink-muted mt-2 leading-6">
                  Unlimited AI conversations, API Playground, Team
                  Collaboration, Advanced Analytics, Developer Console,
                  Priority Support.
                </p>
              </div>
              <Sparkles size={18} className="text-copper shrink-0" />
            </div>
          </div>

          {/* ORDER SUMMARY */}

          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="border-b border-border bg-canvas px-5 py-3">
              <h2 className="text-sm font-semibold">Order Summary</h2>
            </div>

            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-muted">Subscription</span>
                <span className="text-xs font-medium">Relay AI Pro</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-muted">Billing</span>
                <span className="text-xs font-medium capitalize">{interval}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-muted">Tax</span>
                <span className="text-xs">NPR 0</span>
              </div>

              <div className="border-t border-border pt-3 flex items-center justify-between">
                <span className="text-xs font-semibold">Total</span>
                <span className="text-sm font-bold">
                  {interval === "month" ? "NPR 999 / month" : "NPR 9,999 / year"}
                </span>
              </div>
            </div>
          </div>

          {/* PAYMENT DETAILS */}

          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="border-b border-border bg-canvas px-5 py-3">
              <h2 className="text-sm font-semibold">Payment Details</h2>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] uppercase text-ink-faint">
                  Cardholder Name
                </label>
                <input
                  defaultValue="John Doe"
                  className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-xs outline-none focus:border-copper"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase text-ink-faint">
                  Card Number
                </label>
                <input
                  defaultValue="4242 4242 4242 4242"
                  className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-xs tracking-widest outline-none focus:border-copper"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-ink-faint">
                    Expiry
                  </label>
                  <input
                    defaultValue="12 / 34"
                    className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-xs outline-none focus:border-copper"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase text-ink-faint">
                    CVC
                  </label>
                  <input
                    defaultValue="123"
                    className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-xs outline-none focus:border-copper"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase text-ink-faint">
                  Country
                </label>
                <select
                  defaultValue="Nepal"
                  className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-xs outline-none focus:border-copper"
                >
                  <option>Nepal</option>
                  <option>India</option>
                  <option>United States</option>
                  <option>United Kingdom</option>
                  <option>Australia</option>
                </select>
              </div>
            </div>
          </div>

          {/* DEMO NOTICE */}

          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 flex items-start gap-2.5">
            <CheckCircle2 size={15} className="text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-green-700">Demo Checkout</p>
              <p className="mt-1 text-[11px] leading-5 text-green-700">
                This page simulates a card checkout. No real payment is
                processed. Clicking the button below upgrades your account
                using the demo billing backend.
              </p>
            </div>
          </div>

          <button
            onClick={completePayment}
            disabled={loading}
            className="w-full rounded-lg bg-copper py-2.5 text-xs font-medium text-white transition hover:bg-copper/90 disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={13} className="animate-spin" />
                Processing Payment...
              </span>
            ) : (
              `Pay ${interval === "month" ? "NPR 999" : "NPR 9,999"}`
            )}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-ink-faint">
            <Lock size={11} />
            Secure demo payment powered by Relay Billing
          </div>

        </div>

      </div>
    </div>
  );
}