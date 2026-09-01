import { useEffect, useState } from "react";
import {
  CreditCard,
  Sparkles,
  CheckCircle2,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import EsewaRedirectForm from "@/components/EsewaRedirectForm";

export default function BillingSetting() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [loadingYearly, setLoadingYearly] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const [selectedInterval, setSelectedInterval] = useState<"month" | "year">("month");
  const [payingWith, setPayingWith] = useState<"esewa" | "khalti" | null>(null);
  const [esewaFields, setEsewaFields] = useState<{
    formUrl: string;
    fields: Record<string, string>;
  } | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("payment") === "failed") {
      setPayError("Payment didn't complete. Please try again.");
    }
  }, [searchParams]);

  function upgrade(interval: "month" | "year") {
    navigate("/demo-checkout", { state: { interval } });
  }

  function manageBilling() {
    navigate("/demo-billing");
  }

  async function handlePayWithEsewa(interval: "month" | "year") {
    setPayError(null);
    setPayingWith("esewa");
    try {
      const res = await api.initiateEsewaPayment(interval);
      setEsewaFields(res);
    } catch (err) {
      setPayError(
        err instanceof ApiError ? err.message : "Couldn't start eSewa payment."
      );
      setPayingWith(null);
    }
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Billing</h1>
          <p className="mt-1 text-xs text-ink-muted">
            Manage your subscription and billing information.
          </p>
        </div>
      </div>

      {payError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600">
          {payError}
        </div>
      )}

      {/* CURRENT SUBSCRIPTION */}

      <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">

        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-copper" />
            <h2 className="text-sm font-semibold">Current Subscription</h2>
          </div>

          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
              user?.plan === "PRO"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {user?.plan}
          </span>
        </div>

        <div className="p-5 space-y-5">

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] uppercase text-ink-faint">Current Plan</p>
              <p className="mt-1 text-xs font-semibold">
                {user?.plan === "PRO" ? "Relay AI Pro" : "Relay AI Free"}
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase text-ink-faint">Workspace</p>
              <p className="mt-1 text-xs font-semibold">
                {user?.workspace?.name ?? "No Workspace"}
              </p>
            </div>
          </div>

          {user?.plan === "FREE" ? (
            <div className="rounded-2xl border border-copper/20 bg-copper/5 p-5">

              <div className="flex items-start gap-2.5">
                <Sparkles size={16} className="text-copper mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold">Upgrade to Pro</p>
                  <p className="mt-1 text-[11px] leading-5 text-ink-muted">
                    Unlock unlimited AI chats, Team Collaboration, Developer
                    Mode, Analytics, API Playground and every premium feature.
                  </p>
                </div>
              </div>

              {/* REAL PAYMENT — eSewa */}

              <div className="mt-4">
                <p className="text-[10px] uppercase text-ink-faint mb-2">
                  Choose billing cycle
                </p>

                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setSelectedInterval("month")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-left transition ${
                      selectedInterval === "month"
                        ? "border-copper bg-copper/5"
                        : "border-border hover:bg-canvas"
                    }`}
                  >
                    <p className="text-[10px] font-semibold">Monthly</p>
                    <p className="text-xs font-semibold mt-0.5">NPR 999</p>
                    <p className="text-[10px] text-ink-faint mt-0.5">per month</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedInterval("year")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-left transition relative ${
                      selectedInterval === "year"
                        ? "border-copper bg-copper/5"
                        : "border-border hover:bg-canvas"
                    }`}
                  >
                    <span className="absolute top-1.5 right-1.5 rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-semibold text-green-700">
                      Save 17%
                    </span>
                    <p className="text-[10px] font-semibold">Yearly</p>
                    <p className="text-xs font-semibold mt-0.5">NPR 9,999</p>
                    <p className="text-[10px] text-ink-faint mt-0.5">per year</p>
                  </button>
                </div>

                <button
                  onClick={() => handlePayWithEsewa(selectedInterval)}
                  disabled={payingWith !== null}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#60BB46] px-4 py-2 text-[11px] font-medium text-white hover:opacity-90 transition disabled:opacity-60"
                >
                  {payingWith === "esewa" ? "Redirecting…" : "Pay with eSewa"}
                </button>
              </div>

              {/* DEMO FALLBACK */}

              <div className="mt-4 pt-4 border-t border-copper/10">
                <p className="text-[10px] uppercase text-ink-faint mb-2">
                  Or use the demo checkout
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => upgrade("month")}
                    disabled={loadingMonthly}
                    className="rounded-lg bg-copper px-4 py-2 text-[11px] font-medium text-white transition hover:bg-copper/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loadingMonthly ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 size={12} className="animate-spin" />
                        Redirecting...
                      </span>
                    ) : (
                      "Upgrade Monthly"
                    )}
                  </button>

                  <button
                    onClick={() => upgrade("year")}
                    disabled={loadingYearly}
                    className="rounded-lg border border-border px-4 py-2 text-[11px] transition hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loadingYearly ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 size={12} className="animate-spin" />
                        Redirecting...
                      </span>
                    ) : (
                      "Upgrade Yearly"
                    )}
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="mt-0.5 text-green-600 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-green-700">
                    Your Pro subscription is active
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-green-600">
                    You currently have access to all premium features including
                    unlimited AI chats, Developer Mode, Team Collaboration and
                    Analytics.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* MANAGE SUBSCRIPTION */}

      <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">

        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-copper" />
            <h2 className="text-sm font-semibold">Subscription Management</h2>
          </div>
        </div>

        <div className="p-5">
          <p className="text-[11px] leading-5 text-ink-muted">
            Manage your billing, invoices, payment method and subscription from
            the demo billing portal.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={manageBilling}
              disabled={openingPortal || user?.plan !== "PRO"}
              className="rounded-lg bg-copper px-4 py-2 text-[11px] font-medium text-white transition hover:bg-copper/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {openingPortal ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 size={12} className="animate-spin" />
                  Opening...
                </span>
              ) : (
                "Open Billing Portal"
              )}
            </button>

            <button
              onClick={() => navigate("/demo-billing")}
              disabled={cancelling || user?.plan !== "PRO"}
              className="rounded-lg border border-red-300 px-4 py-2 text-[11px] font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelling ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 size={12} className="animate-spin" />
                  Cancelling...
                </span>
              ) : (
                "Cancel Subscription"
              )}
            </button>
          </div>
        </div>

      </div>

      {/* BILLING FAQ */}

      <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">

        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <HelpCircle size={16} className="text-copper" />
          <h2 className="text-sm font-semibold">Frequently Asked Questions</h2>
        </div>

        <div className="divide-y divide-border">

          <div className="p-5">
            <h3 className="text-xs font-medium">What payment methods can I use?</h3>
            <p className="mt-1.5 text-[11px] leading-5 text-ink-muted">
              You can pay securely with eSewa — Nepal's leading digital wallet.
              It's currently running in sandbox/test mode while Relay is in
              development.
            </p>
          </div>

          <div className="p-5">
            <h3 className="text-xs font-medium">What happens after upgrading?</h3>
            <p className="mt-1.5 text-[11px] leading-5 text-ink-muted">
              Your account is upgraded to the Pro plan inside the database so
              every premium feature behaves exactly like a production SaaS
              application.
            </p>
          </div>

          <div className="p-5">
            <h3 className="text-xs font-medium">Can I downgrade later?</h3>
            <p className="mt-1.5 text-[11px] leading-5 text-ink-muted">
              Yes. You can cancel your subscription anytime from the Billing
              Portal. Your account will immediately return to the Free plan.
            </p>
          </div>

          <div className="p-5">
            <h3 className="text-xs font-medium">What's the demo checkout for?</h3>
            <p className="mt-1.5 text-[11px] leading-5 text-ink-muted">
              The demo checkout is a fallback that simulates payment instantly,
              useful for testing and demonstrations without needing a real
              eSewa sandbox transaction.
            </p>
          </div>

        </div>

      </div>

      {esewaFields && (
        <EsewaRedirectForm formUrl={esewaFields.formUrl} fields={esewaFields.fields} />
      )}

    </div>
  );
}