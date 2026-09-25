import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function PublicOnlyRoute() {
  const { user, activeWorkspace, initializing } = useAuth();

  // Wait until the initial session-restore check finishes, not `loading`
  // (which also flips during login/register/createWorkspace and would
  // cause this guard to misfire mid-submit).
  if (initializing) {
    return <div className="h-screen w-screen bg-surface" />;
  }

  if (user) {
    // A freshly authenticated user with no workspace selected yet must
    // go through the picker — never straight to /dashboard.
    return <Navigate to={activeWorkspace ? "/dashboard" : "/select-workspace"} replace />;
  }

  return <Outlet />;
}