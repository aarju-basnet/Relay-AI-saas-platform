import { useState } from "react";
import {
  CreditCard,
  Receipt,
  Calendar,
  CheckCircle2,
  Loader2,
  ArrowLeft,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";

export default function DemoBillingPortal() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [loading, setLoading] = useState(false);

  async function cancelSubscription() {
    try {
      setLoading(true);
      const res = await api.cancelSubscription();
      alert(res.message);
      await refreshUser();
      navigate('/dashboard');
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Unable to cancel subscription.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex justify-center p-8">
      <div className="w-full max-w-4xl rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">

        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="rounded-lg border border-border p-2 hover:bg-canvas transition"
            >
              <ArrowLeft size={16} />
            </button>

            <div>
              <h1 className="text-sm font-semibold">Billing Portal</h1>
              <p className="text-[11px] text-ink-muted mt-0.5">
                Manage your subscription
              </p>
            </div>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-[11px] font-medium ${
              user?.plan === "PRO"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {user?.plan}
          </span>
        </div>

        <div className="p-6 space-y-5">

          {/* CURRENT PLAN */}

          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="border-b border-border bg-canvas px-5 py-4">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-copper" />
                <h2 className="text-sm font-semibold">Subscription</h2>
              </div>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] uppercase text-ink-faint">
                    Current Plan
                  </p>
                  <p className="mt-1.5 text-sm font-semibold">
                    {user?.plan === "PRO" ? "Relay AI Pro" : "Relay AI Free"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase text-ink-faint">
                    Billing Cycle
                  </p>
                  <p className="mt-1.5 text-sm font-semibold">Monthly</p>
                </div>

                <div>
                  <p className="text-[10px] uppercase text-ink-faint">Status</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-green-600" />
                    <span className="text-xs font-medium text-green-700">Active</span>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] uppercase text-ink-faint">
                    Next Renewal
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Calendar size={13} className="text-copper" />
                    <span className="text-xs font-medium">25 August 2026</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PAYMENT METHOD */}

          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="border-b border-border bg-canvas px-5 py-4">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-copper" />
                <h2 className="text-sm font-semibold">Payment Method</h2>
              </div>
            </div>

            <div className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium">eSewa / Khalti Wallet</p>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  Connected via last successful payment
                </p>
              </div>
              <button className="rounded-lg border border-border px-4 py-2 text-xs hover:bg-canvas transition">
                Update Method
              </button>
            </div>
          </div>

          {/* BILLING HISTORY */}

          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="border-b border-border bg-canvas px-5 py-4">
              <div className="flex items-center gap-2">
                <Receipt size={16} className="text-copper" />
                <h2 className="text-sm font-semibold">Billing History</h2>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-canvas">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-ink-faint uppercase">
                      Invoice
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-ink-faint uppercase">
                      Date
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-ink-faint uppercase">
                      Amount
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-ink-faint uppercase">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr className="border-b border-border">
                    <td className="px-5 py-3 text-xs">INV-1001</td>
                    <td className="px-5 py-3 text-xs">25 Jul 2026</td>
                    <td className="px-5 py-3 text-xs">NPR 999</td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-green-100 px-2 py-1 text-[11px] text-green-700">
                        Paid
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* DANGER ZONE */}

          <div className="rounded-2xl border border-red-200 bg-red-50 overflow-hidden">
            <div className="border-b border-red-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-red-700">
                Cancel Subscription
              </h2>
            </div>

            <div className="p-5">
              <p className="text-xs text-red-700">
                Your subscription will remain active until the end of the
                current billing period.
              </p>
              <p className="mt-2 text-[11px] leading-5 text-red-600">
                After cancellation your workspace, conversations, documents and
                AI history will remain safe. Only Pro features will be
                disabled.
              </p>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={cancelSubscription}
                  disabled={loading || user?.plan !== "PRO"}
                  className="rounded-lg bg-red-600 px-5 py-2.5 text-xs font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={13} className="animate-spin" />
                      Cancelling...
                    </span>
                  ) : (
                    "Cancel Subscription"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* FOOTER */}

          <div className="rounded-xl border border-border bg-canvas px-4 py-3">
            <p className="text-[11px] leading-5 text-ink-muted">
              This is a demo Billing Portal. No real payments are processed.
              Card information, invoices and billing dates are simulated for
              demonstration purposes.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}