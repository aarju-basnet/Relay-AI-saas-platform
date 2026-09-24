import { api, ApiError, DashboardAnalytics } from "@/lib/api";
export type { DashboardAnalytics };


export interface AnalyticsTimelineItem {
  hour: number;
  pageViews: number;
  visitors: number;
  clicks: number;
  chats: number;
  messages: number;
}

export interface AnalyticsAISummary {
  analytics: DashboardAnalytics;
  summary: string;
}
export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  const result = await api.getDashboardAnalytics();
  return result.data;
}

export async function getAnalyticsTimeline(date?: string): Promise<AnalyticsTimelineItem[]> {
  const result = await api.getAnalyticsTimeline(date);
  return result.data;
}

export async function getAnalyticsAISummary(): Promise<AnalyticsAISummary> {
  const result = await api.getAnalyticsAISummary();
  return result.data;
}

export { ApiError };