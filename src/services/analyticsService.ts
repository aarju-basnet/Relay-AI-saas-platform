import { api, ApiError } from "@/lib/api";

export interface DashboardAnalytics {
  visitors: number;
  sessions: number;
  pageViews: number;
  buttonClicks: number;
  chatOpened: number;
  messagesSent: number;
  messagesReceived: number;
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

export interface AnalyticsAISummary {
  analytics: {
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
  };
  summary: string;
}

export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  const result = await api.getDashboardAnalytics();
  return result.data;
}

export async function getAnalyticsTimeline(): Promise<AnalyticsTimelineItem[]> {
  const result = await api.getAnalyticsTimeline();
  return result.data;
}

export async function getAnalyticsAISummary(): Promise<AnalyticsAISummary> {
  const result = await api.getAnalyticsAISummary();
  return result.data;
}

export { ApiError };