import { AnalyticsTracker } from "../analytics/tracker";
import { RelayApi } from "../api/relayApi";
import { setTracker } from "./tracker";

export function initializeAnalytics(
  apiKey: string,
  apiBaseUrl: string
) {
  const relay = new RelayApi(
    apiKey,
    apiBaseUrl
  );

  const tracker =
    new AnalyticsTracker(relay);

  tracker.track("SESSION_STARTED");

  tracker.track("PAGE_VIEW");

  tracker.track("CHAT_WIDGET_LOADED");

  setTracker(tracker);

  return tracker;
}