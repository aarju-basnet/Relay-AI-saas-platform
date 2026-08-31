export interface AnalyticsEvent {
  visitorId: string;

  sessionId: string;

  event: string;

  page?: string;

  metadata?: Record<string, any>;
}