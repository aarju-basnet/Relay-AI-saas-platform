import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { api, ApiError, User } from "@/lib/api";

interface AuthContextValue {
  user: User | null;
    developerMode: boolean;
  setDeveloperMode: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  loading: boolean;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  createWorkspace: (name: string, industry?: string, companySize?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [developerMode, setDeveloperMode] = useState(false);

  // On first load, try to restore the session from the access-token cookie.
  useEffect(() => {
  async function restoreSession() {
    try {
      const { user } = await api.getMe();

      setUser(user);
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.status === 401
      ) {
        // Both access token and refresh token are invalid.
        setUser(null);
      } else {
        console.error(
          "Failed to restore session:",
          err
        );
      }
    } finally {
      setInitializing(false);
    }
  }

  restoreSession();
}, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { user } = await api.login(email, password);
      setUser(user);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    setLoading(true);
    try {
      const { user } = await api.register(email, password, name);
      setUser(user);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  // Re-fetches the current user - used after returning from Stripe checkout
  // so the sidebar/plan badge reflects the upgrade without a full reload.
  const refreshUser = useCallback(async () => {
    try {
      const { user } = await api.getMe();
      setUser(user);
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  }, []);

  // Page 2 of onboarding - creates the business, then refreshes so
  // user.workspace is populated and routing unlocks the dashboard.
  const createWorkspace = useCallback(async (name: string, industry?: string, companySize?: string) => {
    setLoading(true);
    try {
      await api.createWorkspace(name, industry, companySize);
      await refreshUser();
    } finally {
      setLoading(false);
    }
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ user,   developerMode,
    setDeveloperMode, loading, initializing, login, register, logout, refreshUser, createWorkspace }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}