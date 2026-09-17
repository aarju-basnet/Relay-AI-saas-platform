import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PartyPopper } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

export default function AnalyticsReady() {
  const { activeWorkspace, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Mark as seen immediately on mount, not on button click - this is
  // what makes the page "disappear" for good: even hitting browser
  // back to this URL afterward won't show it again, since the guard
  // that sent them here checks analyticsLiveSeen.
  useEffect(() => {
    api.markAnalyticsSeen().then(() => refreshUser()).catch(() => {});
  }, [refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4 text-center">
      <div>
        <div className="flex justify-center mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-copper/10">
            <PartyPopper size={24} className="text-copper" />
          </div>
        </div>
        <h1 className="text-xl font-semibold text-ink">
          Your analytics are live!
        </h1>
        <p className="text-sm text-ink-muted mt-2 max-w-sm mx-auto">
          {activeWorkspace?.name ?? "Your business"} just recorded its first
          visitor. Head to your dashboard to see it in action.
        </p>
        <button
          onClick={() => navigate("/dashboard", { replace: true })}
          className="mt-6 rounded-lg bg-copper px-5 py-2.5 text-sm font-medium text-white hover:bg-copper/90 transition"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}