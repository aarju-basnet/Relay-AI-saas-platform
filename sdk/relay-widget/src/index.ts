import "./index.css";
import { loadRelayWidget } from "./core/loader";
import { getTracker } from "./core/tracker";

declare global {
  interface Window {
    Relay: any;
  }
}

window.Relay = {
  init: loadRelayWidget,
  track: (eventName: string, metadata?: Record<string, any>) => {
    const tracker = getTracker();
    if (!tracker) {
      console.error("Relay: widget not initialized yet — track() called too early.");
      return;
    }
    return tracker.custom(eventName, metadata);
  },
};

loadRelayWidget();