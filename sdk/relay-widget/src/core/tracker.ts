import { AnalyticsTracker } from "../analytics/tracker";

let tracker: AnalyticsTracker | null = null;

export function setTracker(
  value: AnalyticsTracker
) {
  tracker = value;
}

export function getTracker() {
  return tracker;
}