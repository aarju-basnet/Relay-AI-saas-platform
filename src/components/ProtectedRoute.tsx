import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

/** For pages that need a logged-in user AND a completed workspace - most of the app. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
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

  if (!user.workspace) {
    return <Navigate to="/onboarding/workspace" replace />;
  }

  return <>{children}</>;
}

/** For the workspace-creation page itself - needs login, but obviously
 * can't require a workspace to already exist (that would loop forever). */
export function RequireAuth({ children }: { children: ReactNode }) {
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