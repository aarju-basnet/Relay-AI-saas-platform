const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";


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
  avgResponseTime: number;
  aiResponses: number;
  humanResponses: number;
}


export interface Workspace {
  id: string;
  name: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
   logoUrl?: string | null;
}

export interface User {
  id: string;
  email: string;
  name?: string | null;
  emailVerified: boolean;
  plan: "FREE" | "PRO" | "ENTERPRISE";
  avatarUrl?: string | null;
  workspace: Workspace | null; // null until onboarding's "Create Workspace" step is done
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

export async function getAdvancedSettings(): Promise<{
  settings: AdvancedSettings;
}> {
  return request("/api/advanced");
}

export async function updateAdvancedSettings(
  data: Partial<AdvancedSettings>
) {
  return request("/api/advanced", {
    method: "PATCH",

    body: JSON.stringify(data),
  });
}

export async function deleteWorkspace() {
  return request("/api/advanced/workspace", {
    method: "DELETE",
  });
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
  }>("/api/dashboard/overview"),

  getDeveloperSystem() {
  return request<{
    status: DeveloperSystemStatus;
  }>("/api/developer/system");
},

  // Page 2 of onboarding: create the business
  createWorkspace: (name: string, industry?: string, companySize?: string) =>
    request<{ workspace: { id: string; name: string; slug: string; role: string } }>("/api/workspace", {
      method: "POST",
      body: JSON.stringify({ name, industry, companySize }),
    }),

  getWorkspaceSettings: () => request<{ workspace: WorkspaceSettings }>("/api/workspace"),

  updateWorkspaceSettings: (data: Partial<Pick<WorkspaceSettings, "logoUrl" | "website" | "businessEmail" | "industry" | "companySize" | "country" | "timeZone">>) =>
    request<{ workspace: WorkspaceSettings }>("/api/workspace", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  getAssistant: () => request<{ assistant: Assistant }>("/api/assistant"),

  updateAssistant: (data: Partial<Omit<Assistant, "id">>) =>
    request<{ assistant: Assistant }>("/api/assistant", {
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
  }>("/api/billing/create-checkout-session", {
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
  }>("/api/billing/demo-upgrade", {
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
  }>("/api/billing/current");
},

cancelSubscription() {
  return request<{
    success: boolean;
    plan: string;
    message: string;
  }>("/api/billing/cancel", {
    method: "POST",
  });
},

createApiKey(data: {
  name: string;
  organizationId: string;
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

getApiKeys(organizationId: string) {
  return request<{
    success: boolean;
    keys: {
      id: string;
      name: string;
      prefix: string;
      revoked: boolean;
      createdAt: string;
      lastUsed: string | null;
    }[];
  }>(`/api/api-keys/${organizationId}`);
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
  }>("/api/dashboard/ai-summary"),

  getDashboardAnalytics: () =>
    request<{ success: boolean; data: DashboardAnalytics }>("/api/dashboard"),

  getAnalyticsTimeline: () =>
    request<{ success: boolean; data: AnalyticsTimelineItem[] }>("/api/dashboard/timeline"),

  getTeamMembers: () => request<{ members: TeamMember[]; seatCap: number }>("/api/team/members"),

  inviteTeamMember: (email: string, name?: string) =>
    request<{ member: TeamMember }>("/api/team/invite", {
      method: "POST",
      body: JSON.stringify({ email, name }),
    }),

 
  googleLoginUrl: () => `${API_BASE}/api/auth/google`,

  listConversations: () => request<{ conversations: Conversation[] }>("/api/llm/conversations"),

  getConversation: (id: string) =>
    request<{ conversation: Conversation & { messages: Message[] } }>(`/api/llm/conversations/${id}`),

  sendChatMessage: (message: string, conversationId?: string) =>
    request<{ conversationId: string; reply: string; modelUsed: string }>("/api/llm/chat", {
      method: "POST",
      body: JSON.stringify({ message, conversationId }),
    }),

    updateMemberRole(
  id: string,
  role: "ADMIN" | "MEMBER"
) {
  return request(`/api/team/members/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
},

removeTeamMember(id: string) {
  return request(`/api/team/members/${id}`, {
    method: "DELETE",
  });
},



  assignConversation: (id: string, assignedTo: string | null) =>
    request<{ conversation: Conversation }>(`/api/llm/conversations/${id}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ assignedTo }),
    }),

    renameConversation: (id: string, title: string) =>
  request<{ conversation: Conversation }>(`/api/llm/conversations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  }),

deleteConversation: (id: string) =>
  request<{ success: boolean }>(`/api/llm/conversations/${id}`, {
    method: "DELETE",
  }),

    

  getTeamMessages: () =>
  request<{ messages: TeamMessage[] }>("/api/team-chat/messages"),

sendTeamMessage: (content: string) =>
  request<{ message: TeamMessage }>("/api/team-chat/messages", {
    method: "POST",
    body: JSON.stringify({ content }),
  }),

  deleteTeamMessage: (id: string) =>
  request<{ success: boolean }>(`/api/team-chat/messages/${id}`, {
    method: "DELETE",
  }),


  initiateEsewaPayment(interval: "month" | "year") {
  return request<{
    formUrl: string;
    fields: Record<string, string>;
  }>("/api/billing/esewa/initiate", {
    method: "POST",
    body: JSON.stringify({ interval }),
  });
},

initiateKhaltiPayment(interval: "month" | "year") {
  return request<{ paymentUrl: string }>("/api/billing/khalti/initiate", {
    method: "POST",
    body: JSON.stringify({ interval }),
  });
},


getKnowledgeDocuments: () =>
  request<{ documents: KnowledgeDocument[] }>("/api/knowledge/documents"),

uploadKnowledgeDocument: async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/api/knowledge/upload`, {
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
  request<{ success: boolean }>(`/api/knowledge/documents/${id}`, {
    method: "DELETE",
  }),
    
};