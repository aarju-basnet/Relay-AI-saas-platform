import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { api, ApiError, User } from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // On first load, try to restore the session from the access-token cookie.
  useEffect(() => {
    api
      .getMe()
      .then(({ user }) => setUser(user))
      .catch((err) => {
        // 401 just means "not logged in" - not an error worth surfacing
        if (!(err instanceof ApiError) || err.status !== 401) {
          console.error("Failed to restore session:", err);
        }
      })
      .finally(() => setInitializing(false));
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

  return (
    <AuthContext.Provider value={{ user, loading, initializing, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
