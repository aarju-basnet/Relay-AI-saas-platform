const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// The currently active organization, set by AuthContext once the user
// has logged in and either auto-selected their only workspace or picked
// one from the workspace switcher. Every org-scoped call below reads
// this instead of requiring every component call-site to pass it in.
let activeOrganizationId: string | null = null;

export function setActiveOrganizationId(id: string | null) {
  activeOrganizationId = id;
}

export function getActiveOrganizationId(): string | null {
  return activeOrganizationId;
}

function requireOrgId(): string {
  if (!activeOrganizationId) {
    throw new ApiError("No active workspace selected", 400);
  }
  return activeOrganizationId;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  // Access token expired → try refreshing it once
  if (res.status === 401 && retry) {
    const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (refreshRes.ok) {
      // Retry the original request once
      return request<T>(path, options, false);
    }
  }

  if (!res.ok) {
    const body = await res
      .json()
      .catch(() => ({ error: res.statusText }));

    throw new ApiError(
      body.message || body.error || "Request failed",
      res.status
    );
  }

  return (await res.json()) as T;
}

export interface DashboardOverview {
  totalConversations: number;
  totalMessages: number;
  totalUsers: number;
  activeToday: number;
  activeTeamMembersToday: number;
  avgResponseTime: number;
  aiResponses: number;
  humanResponses: number;
}


export interface Workspace {
  id: string;
  name: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  logoUrl?: string | null;
  analyticsLive: boolean;
  analyticsLiveSeen: boolean;
}

export interface User {
  id: string;
  email: string;
  name?: string | null;
  emailVerified: boolean;
  plan: "FREE" | "PRO" | "ENTERPRISE";
  avatarUrl?: string | null;
  workspaces: Workspace[]; // empty until onboarding's "Create Workspace" step is done
}

export interface Conversation {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  createdByName?: string;
  assignedTo?: string | null;
  assignedToName?: string | null;
}

export interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  avatarUrl: string | null;
  status: "active" | "pending";
  joinedAt: string;
}

export interface WorkspaceSettings {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  industry: string | null;
  companySize: string | null;
  website: string | null;
  country: string | null;
  timeZone: string | null;
  businessEmail: string | null;
  plan: "FREE" | "PRO" | "ENTERPRISE";
}

export interface Assistant {
  id: string;
  name: string;
  purposes: string[];
  preferredModel: string;
  responseStyle: string;
  language: string;
  welcomeMessage: string;
  systemPrompt: string | null;
}

export interface DashboardAnalytics {
  business: string;
  date: string;

  visitors: number;
  sessions: number;
  pageViews: number;
  clicks: number;
  chats: number;
  messages: number;
  leads: number;
  purchases: number;
}


export interface AnalyticsTimelineItem {
  hour: number;
  pageViews: number;
  visitors: number;
  clicks: number;
  chats: number;
  messages: number;
}

export interface AssistantUsage {
  totalConversations: number;
  totalMessagesSent: number;
  totalMessagesReceived: number;
  avgMessagesPerConversation: number;
  dailyVolume: { date: string; count: number }[];
  hourly: { hour: number; count: number }[];
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  metadata?: { model?: string };
}

export interface AdvancedSettings {
  plan: "FREE" | "PRO" | "ENTERPRISE";

  developerMode: boolean;

  debugLogs: boolean;

  apiAccess: boolean;

  customPrompt: boolean;

  deleteWorkspace: boolean;
}

export interface TeamMessage {
  _id: string;
  orgId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}


export interface KnowledgeDocument {
  id: string;
  name: string;
  fileType: string;
  status: string;
  chunkCount: number;
  createdAt: string;
}

export interface Session {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export interface ConnectedAccounts {
  google: { connected: boolean };
  password: { set: boolean };
  email: string;
}


export interface ConnectedAccounts {
  google: { connected: boolean };
  password: { set: boolean };
  email: string;
  twoFactorEnabled: boolean; // add this
}

export interface TwoFactorSetupResponse {
  qrCodeDataUrl: string;
  secret: string;
}

export interface TwoFactorVerifyResponse {
  success: boolean;
  message: string;
  backupCodes: string[];
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  muted: boolean;
  unreadCount: number;
}

export async function getAdvancedSettings(): Promise<{
  settings: AdvancedSettings;
}> {
  return request(`/api/advanced/${requireOrgId()}`);
}

export async function updateAdvancedSettings(
  data: Partial<AdvancedSettings>
) {
  return request(`/api/advanced/${requireOrgId()}`, {
    method: "PATCH",

    body: JSON.stringify(data),
  });
}

export async function deleteWorkspace() {
  return request(`/api/advanced/${requireOrgId()}`, {
    method: "DELETE",
  });
}


export interface DebugLogEntry {
  id: string;
  level: string;
  action: string;
  endpoint: string | null;
  method: string | null;
  statusCode: number | null;
  message: string;
  workspaceId: string | null;
  createdAt: string;
}



export interface DeveloperSystemStatus {
  server: string;

  environment: string;

  nodeVersion: string;

  platform: string;

  cpuCores: number;

  architecture: string;

  uptime: number;

  memory: {
    total: number;

    used: number;

    free: number;
  };
}



export const api = {
  // Page 1 of onboarding: just the personal account, no business info yet
  register: (email: string, password: string, name?: string) =>
    request<{ user: User }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    request<{ user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () => request<{ message: string }>("/api/auth/logout", { method: "POST" }),

  getMe: () => request<{ user: User }>("/api/auth/me"),

  verifyEmail: (token: string) =>
    request<{ message: string }>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`),

  resendVerification: () =>
    request<{ message: string }>("/api/auth/resend-verification", { method: "POST" }),

  forgotPassword: (email: string) =>
    request<{ message: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
    getAdvancedSettings,

updateAdvancedSettings,

deleteWorkspace,

  resetPassword: (token: string, password: string) =>
    request<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),

    getDashboardOverview: () =>
  request<{
    overview: DashboardOverview;
  }>(`/api/dashboard/${requireOrgId()}/overview`),

  getDeveloperSystem() {
  return request<{
    status: DeveloperSystemStatus;
  }>("/api/developer/system");
},

  // Page 2 of onboarding: create the business (no org param — this IS
  // how you get one; server enforces the plan's org-count limit)
  createWorkspace: (name: string, industry?: string, companySize?: string) =>
    request<{ workspace: { id: string; name: string; slug: string; role: string } }>("/api/workspace", {
      method: "POST",
      body: JSON.stringify({ name, industry, companySize }),
    }),

  getWorkspaceSettings: () => request<{ workspace: WorkspaceSettings }>(`/api/workspace/${requireOrgId()}`),

  updateWorkspaceSettings: (data: Partial<Pick<WorkspaceSettings, "name" | "logoUrl" | "website" | "businessEmail" | "industry" | "companySize" | "country" | "timeZone">>) =>
  request<{ workspace: WorkspaceSettings }>(`/api/workspace/${requireOrgId()}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),

  getAssistant: () => request<{ assistant: Assistant }>(`/api/assistant/${requireOrgId()}`),

  updateAssistant: (data: Partial<Omit<Assistant, "id">>) =>
    request<{ assistant: Assistant }>(`/api/assistant/${requireOrgId()}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

 // ---------------- Billing ----------------

// =========================
// BILLING
// =========================

createCheckoutSession(interval: "month" | "year") {
  return request<{
    url: string;
  }>(`/api/billing/${requireOrgId()}/create-checkout-session`, {
    method: "POST",
    body: JSON.stringify({
      interval,
    }),
  });
},

createPortalSession() {
  return request<{ url: string }>(
    "/api/billing/create-portal-session",
    {
      method: "POST",
    }
  );
},

demoUpgrade(interval: "month" | "year") {
  return request<{
    success: boolean;
    message: string;
    billing: string;
  }>(`/api/billing/${requireOrgId()}/demo-upgrade`, {
    method: "POST",
    body: JSON.stringify({
      interval,
    }),
  });
},

getCurrentBilling() {
  return request<{
    plan: "FREE" | "PRO" | "ENTERPRISE";
    workspace: string | null;
    role: string | null;
  }>(`/api/billing/${requireOrgId()}/current`);
},

cancelSubscription() {
  return request<{
    success: boolean;
    plan: string;
    message: string;
  }>(`/api/billing/${requireOrgId()}/cancel`, {
    method: "POST",
  });
},

createApiKey(data: {
  name: string;
  organizationId: string;
  type: "ANALYTICS" | "ASSISTANT";
}) {
  return request<{
    success: boolean;
    message: string;
    apiKey: string;
  }>("/api/api-keys", {
    method: "POST",
    body: JSON.stringify(data),
  });
},

getApiKeys(organizationId: string, type?: "ANALYTICS" | "ASSISTANT") {
  return request<{
    success: boolean;
    keys: {
      id: string;
      name: string;
      prefix: string;
      type: "ANALYTICS" | "ASSISTANT";
      revoked: boolean;
      createdAt: string;
      lastUsed: string | null;
    }[];
  }>(`/api/api-keys/${organizationId}${type ? `?type=${type}` : ""}`);
},

revokeApiKey(id: string) {
  return request<{
    success: boolean;
    message: string;
  }>(`/api/api-keys/${id}/revoke`, {
    method: "PATCH",
  });
},


  sendContactMessage: (name: string, email: string, message: string) =>
    request<{ message: string }>("/api/contact", {
      method: "POST",
      body: JSON.stringify({ name, email, message }),
    }),

   getAnalyticsAISummary: () =>
  request<{
    success: boolean;
    data: {
      analytics: DashboardAnalytics;
      summary: string;
    };
  }>(`/api/analytics/${requireOrgId()}/ai-summary`),

  getDashboardAnalytics: () =>
    request<{ success: boolean; data: DashboardAnalytics }>(`/api/analytics/${requireOrgId()}`),

  getAnalyticsTimeline: () =>
    request<{ success: boolean; data: AnalyticsTimelineItem[] }>(`/api/analytics/${requireOrgId()}/timeline`),

  getTeamMembers: () => request<{ members: TeamMember[]; seatCap: number }>(`/api/team/${requireOrgId()}/members`),

  inviteTeamMember: (email: string, name?: string) =>
    request<{ member: TeamMember }>(`/api/team/${requireOrgId()}/invite`, {
      method: "POST",
      body: JSON.stringify({ email, name }),
    }),

 
  googleLoginUrl: () => `${API_BASE}/api/auth/google`,

  listConversations: () => request<{ conversations: Conversation[] }>(`/api/llm/${requireOrgId()}/conversations`),

  getConversation: (id: string) =>
    request<{ conversation: Conversation & { messages: Message[] } }>(`/api/llm/${requireOrgId()}/conversations/${id}`),

  sendChatMessage: (message: string, conversationId?: string) =>
    request<{ conversationId: string; reply: string; modelUsed: string }>(`/api/llm/${requireOrgId()}/chat`, {
      method: "POST",
      body: JSON.stringify({ message, conversationId }),
    }),

    updateMemberRole(
  id: string,
  role: "ADMIN" | "MEMBER"
) {
  return request(`/api/team/${requireOrgId()}/members/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
},

removeTeamMember(id: string) {
  return request(`/api/team/${requireOrgId()}/members/${id}`, {
    method: "DELETE",
  });
},


markAnalyticsSeen: () =>
  request<{ success: boolean }>(`/api/workspace/${requireOrgId()}/analytics-seen`, {
    method: "PATCH",
  }),


  assignConversation: (id: string, assignedTo: string | null) =>
    request<{ conversation: Conversation }>(`/api/llm/${requireOrgId()}/conversations/${id}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ assignedTo }),
    }),

    renameConversation: (id: string, title: string) =>
  request<{ conversation: Conversation }>(`/api/llm/${requireOrgId()}/conversations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  }),

deleteConversation: (id: string) =>
  request<{ success: boolean }>(`/api/llm/${requireOrgId()}/conversations/${id}`, {
    method: "DELETE",
  }),

    

  getTeamMessages: () =>
  request<{ messages: TeamMessage[] }>(`/api/team-chat/${requireOrgId()}/messages`),

sendTeamMessage: (content: string) =>
  request<{ message: TeamMessage }>(`/api/team-chat/${requireOrgId()}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  }),

  deleteTeamMessage: (id: string) =>
  request<{ success: boolean }>(`/api/team-chat/${requireOrgId()}/messages/${id}`, {
    method: "DELETE",
  }),


  initiateEsewaPayment(interval: "month" | "year") {
  return request<{
    formUrl: string;
    fields: Record<string, string>;
  }>(`/api/billing/${requireOrgId()}/esewa/initiate`, {
    method: "POST",
    body: JSON.stringify({ interval }),
  });
},

initiateKhaltiPayment(interval: "month" | "year") {
  return request<{ paymentUrl: string }>(`/api/billing/${requireOrgId()}/khalti/initiate`, {
    method: "POST",
    body: JSON.stringify({ interval }),
  });
},


getKnowledgeDocuments: () =>
  request<{ documents: KnowledgeDocument[] }>(`/api/knowledge/${requireOrgId()}/documents`),

uploadKnowledgeDocument: async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/api/knowledge/${requireOrgId()}/upload`, {
    method: "POST",
    credentials: "include",
    body: formData, // no Content-Type header — browser sets the multipart boundary
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(body.error || "Upload failed", res.status);
  }

  return res.json() as Promise<{ document: KnowledgeDocument }>;
},

deleteKnowledgeDocument: (id: string) =>
  request<{ success: boolean }>(`/api/knowledge/${requireOrgId()}/documents/${id}`, {
    method: "DELETE",
  }),


  getAssistantUsage: () =>
  request<{ success: boolean; data: AssistantUsage }>(`/api/analytics/${requireOrgId()}/usage`),


  changePassword: (currentPassword: string | undefined, newPassword: string) =>
  request<{ success: boolean; message: string }>("/api/security/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  }),

getConnectedAccounts: () =>
  request<ConnectedAccounts>("/api/security/connected-accounts"),

getSessions: () =>
  request<{ sessions: Session[] }>("/api/security/sessions"),

revokeSession: (id: string) =>
  request<{ success: boolean }>(`/api/security/sessions/${id}`, {
    method: "DELETE",
  }),

revokeAllSessions: () =>
  request<{ success: boolean; message: string }>("/api/security/sessions/revoke-all", {
    method: "POST",
  }),

  setupTwoFactor: () =>
  request<TwoFactorSetupResponse>("/api/security/2fa/setup", {
    method: "POST",
  }),

verifyTwoFactor: (token: string) =>
  request<TwoFactorVerifyResponse>("/api/security/2fa/verify", {
    method: "POST",
    body: JSON.stringify({ token }),
  }),

disableTwoFactor: (password: string) =>
  request<{ success: boolean; message: string }>("/api/security/2fa/disable", {
    method: "POST",
    body: JSON.stringify({ password }),
  }),

  getNotifications: () => request<NotificationsResponse>("/api/notifications"),

markNotificationRead: (id: string) =>
  request<{ success: boolean }>(`/api/notifications/${id}/read`, { method: "POST" }),
    

markAllNotificationsRead: () =>
  request<{ success: boolean }>("/api/notifications/mark-all-read", { method: "POST" }),

setNotificationsMuted: (muted: boolean) =>
  request<{ success: boolean; muted: boolean }>("/api/notifications/mute", {
    method: "PATCH",
    body: JSON.stringify({ muted }),
  }),

  getDeveloperLogs: (page = 1) =>
  request<{
    logs: DebugLogEntry[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }>(`/api/developer/${requireOrgId()}/logs?page=${page}`),

};