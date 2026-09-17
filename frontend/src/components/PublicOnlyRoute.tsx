import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function PublicOnlyRoute() {
  const { user, loading } = useAuth();

  // 1. Wait until initial session check finishes to prevent page flickering
  if (loading) {
    return <div className="h-screen w-screen bg-surface" />;
  }

  // 2. If the user is logged in, send them straight to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // 3. Otherwise, show the public page (Login, Signup, Home)
  return <Outlet />;
}