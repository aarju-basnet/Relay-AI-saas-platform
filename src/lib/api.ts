const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include", // sends the httpOnly JWT cookies set by the backend
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(body.error || "Request failed", res.status);
  }

  return res.json() as Promise<T>;
}

export interface User {
  id: string;
  email: string;
  name?: string | null;
  emailVerified: boolean;
  plan: "FREE" | "PRO" | "ENTERPRISE";
}

export interface Conversation {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  metadata?: { modelUsed?: string };
}

export const api = {
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

  resetPassword: (token: string, password: string) =>
    request<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),

  createCheckoutSession: (interval: "month" | "year") =>
    request<{ url: string }>("/api/billing/create-checkout-session", {
      method: "POST",
      body: JSON.stringify({ interval }),
    }),

  createPortalSession: () =>
    request<{ url: string }>("/api/billing/create-portal-session", { method: "POST" }),

  sendContactMessage: (name: string, email: string, message: string) =>
    request<{ message: string }>("/api/contact", {
      method: "POST",
      body: JSON.stringify({ name, email, message }),
    }),

  googleLoginUrl: () => `${API_BASE}/api/auth/google`,

  listConversations: () =>
    request<{ conversations: Conversation[] }>("/api/llm/conversations"),

  getConversation: (id: string) =>
    request<{ conversation: Conversation & { messages: Message[] } }>(
      `/api/llm/conversations/${id}`
    ),

  sendChatMessage: (message: string, conversationId?: string) =>
    request<{ conversationId: string; reply: string; modelUsed: string }>(
      "/api/llm/chat",
      {
        method: "POST",
        body: JSON.stringify({ message, conversationId }),
      }
    ),
};