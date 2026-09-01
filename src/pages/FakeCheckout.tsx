import { useNavigate, useSearchParams } from "react-router-dom";
import { CreditCard, Lock, CheckCircle2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useState } from "react";

export default function FakeCheckout() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const interval = params.get("interval") || "month";

  const [loading, setLoading] = useState(false);

  async function completePayment() {
    setLoading(true);

    try {
      await api.demoUpgrade(interval as "month" | "year");
      navigate('/dashboard?upgraded=true');
    } catch (err) {
      console.error(err);
      alert("Unable to complete payment.");
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
              Demo checkout page
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">

          {/* PLAN SUMMARY */}

          <div className="rounded-2xl border border-copper/20 bg-copper/5 p-5">
            <h2 className="text-sm font-semibold">Relay AI Pro</h2>
            <p className="text-xs text-ink-muted mt-2 leading-6">
              Unlimited AI chats, Developer Mode, API Playground, Team
              Management, Analytics and more.
            </p>
          </div>

          {/* PLAN / BILLING */}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase text-ink-faint">Plan</p>
              <p className="mt-1 text-xs font-semibold">Pro</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-ink-faint">Billing</p>
              <p className="mt-1 text-xs font-semibold capitalize">{interval}</p>
            </div>
          </div>

          {/* FAKE CARD */}

          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="border-b border-border bg-canvas px-5 py-3">
              <h2 className="text-sm font-semibold">Payment Details</h2>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] uppercase text-ink-faint">
                  Card Number
                </label>
                <input
                  disabled
                  value="4242 4242 4242 4242"
                  className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-xs tracking-widest"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-ink-faint">
                    Expiry
                  </label>
                  <input
                    disabled
                    value="12 / 34"
                    className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase text-ink-faint">
                    CVC
                  </label>
                  <input
                    disabled
                    value="123"
                    className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* NOTICE */}

          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 flex items-start gap-2.5">
            <CheckCircle2 size={15} className="text-green-600 mt-0.5 shrink-0" />
            <p className="text-[11px] leading-5 text-green-700">
              This is a simulated checkout page. No real payment is processed.
            </p>
          </div>

          <button
            onClick={completePayment}
            disabled={loading}
            className="w-full rounded-lg bg-copper py-2.5 text-xs font-medium text-white hover:bg-copper/90 transition disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={13} className="animate-spin" />
                Processing...
              </span>
            ) : (
              "Complete Demo Payment"
            )}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-ink-faint">
            <Lock size={11} />
            Demo Secure Checkout
          </div>

        </div>

      </div>
    </div>
  );
}