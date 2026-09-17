import { Navigate } from "react-router-dom";
import { ReactNode, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

// Detects a browser back/forward-cache restore (Safari/Firefox especially)
// and forces a hard reload so React re-mounts and every guard below
// re-runs against current auth state, instead of showing a frozen
// snapshot of a page that may no longer be valid to view.
function useBfcacheReload() {
  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        window.location.reload();
      }
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);
}

/** For pages that need a logged-in user AND a completed workspace - most of the app. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  useBfcacheReload();
  const { user, activeWorkspace, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-ink-faint text-sm font-mono">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.workspaces.length === 0) {
    return <Navigate to="/onboarding/workspace" replace />;
  }

  if (!activeWorkspace) {
    return <Navigate to="/select-workspace" replace />;
  }

  if (activeWorkspace.analyticsLive && !activeWorkspace.analyticsLiveSeen) {
    return <Navigate to="/analytics-ready" replace />;
  }

  return <>{children}</>;
}

/** For the workspace-creation page itself - needs login, but obviously
 * can't require a workspace to already exist (that would loop forever). */
export function RequireAuth({ children }: { children: ReactNode }) {
  useBfcacheReload();
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-ink-faint text-sm font-mono">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}