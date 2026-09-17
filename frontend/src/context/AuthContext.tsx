import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { api, ApiError, User, Workspace, setActiveOrganizationId } from "@/lib/api";

const ACTIVE_ORG_STORAGE_KEY = "relay_active_org_id";

interface AuthContextValue {
  user: User | null;
  activeWorkspace: Workspace | null;
  selectWorkspace: (organizationId: string) => void;
    developerMode: boolean;
  setDeveloperMode: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  createWorkspace: (name: string, industry?: string, companySize?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Given the freshly-loaded user, decides which organization should be
// active. Only ever restores a workspace the user PREVIOUSLY, EXPLICITLY
// selected (via selectWorkspace, stored in localStorage) - never
// auto-picks based on workspace count. Even a user with exactly one
// workspace must land on the picker and choose it themselves each time
// they log in fresh; only a genuine session restore (refresh/forward/back
// within an already-selected session) may reuse the stored choice.
function resolveActiveOrgId(user: User | null): string | null {
  if (!user || user.workspaces.length === 0) return null;

  const stored = localStorage.getItem(ACTIVE_ORG_STORAGE_KEY);
  if (stored && user.workspaces.some((w) => w.id === stored)) {
    return stored;
  }

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeOrganizationId, setActiveOrganizationIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [developerMode, setDeveloperMode] = useState(false);

  // Keeps api.ts's module-level active org in sync with context state,
  // and persists the choice so a page refresh doesn't lose it.
  // forceReselect clears everything so login/register always land on
  // the workspace picker, regardless of workspace count or prior choice.
  const applyUser = useCallback((nextUser: User | null, opts?: { forceReselect?: boolean }) => {
    setUser(nextUser);
    const orgId = opts?.forceReselect ? null : resolveActiveOrgId(nextUser);
    setActiveOrganizationIdState(orgId);
    setActiveOrganizationId(orgId);
    if (orgId) {
      localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, orgId);
    } else {
      localStorage.removeItem(ACTIVE_ORG_STORAGE_KEY);
    }
  }, []);

  const selectWorkspace = useCallback((organizationId: string) => {
    if (!user?.workspaces.some((w) => w.id === organizationId)) return;
    setActiveOrganizationIdState(organizationId);
    setActiveOrganizationId(organizationId);
    localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, organizationId);
  }, [user]);

  const activeWorkspace =
    user?.workspaces.find((w) => w.id === activeOrganizationId) ?? null;

  // On first load, try to restore the session from the access-token cookie.
  // This is a session restore, not a fresh login, so it's allowed to
  // remember the last-active workspace (if one was explicitly chosen).
  useEffect(() => {
  async function restoreSession() {
    try {
      const { user } = await api.getMe();

      applyUser(user);
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.status === 401
      ) {
        // Both access token and refresh token are invalid.
        applyUser(null);
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
}, [applyUser]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { user } = await api.login(email, password);
      applyUser(user, { forceReselect: true });
    } finally {
      setLoading(false);
    }
  }, [applyUser]);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    setLoading(true);
    try {
      const { user } = await api.register(email, password, name);
      applyUser(user, { forceReselect: true });
    } finally {
      setLoading(false);
    }
  }, [applyUser]);

  const logout = useCallback(async () => {
    await api.logout();
    applyUser(null);
  }, [applyUser]);

  // Re-fetches the current user - used after returning from Stripe checkout
  // so the sidebar/plan badge reflects the upgrade without a full reload.
  // Not a fresh login, so the current workspace selection is preserved.
  const refreshUser = useCallback(async () => {
    try {
      const { user } = await api.getMe();
      applyUser(user);
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  }, [applyUser]);

  // Page 2 of onboarding - creates the business, then refreshes so
  // user.workspaces is populated, and immediately selects the new
  // workspace so a brand-new user goes straight to their dashboard
  // instead of a picker with only one option.
  const createWorkspace = useCallback(async (name: string, industry?: string, companySize?: string) => {
    setLoading(true);
    try {
      const { workspace } = await api.createWorkspace(name, industry, companySize);
      await refreshUser();
      selectWorkspace(workspace.id);
    } finally {
      setLoading(false);
    }
  }, [refreshUser, selectWorkspace]);

  return (
    <AuthContext.Provider value={{ user, activeWorkspace, selectWorkspace,   developerMode,
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