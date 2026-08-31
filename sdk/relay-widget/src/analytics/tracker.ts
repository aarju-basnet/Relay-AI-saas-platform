import { RelayApi } from "@/api/relayApi";
import { getVisitorId } from "@/session/visitor";
import { getSessionId } from "@/session/session";
import { RelayEvents } from "./events";

export class AnalyticsTracker {
  private relay: RelayApi;

  constructor(relay: RelayApi) {
    this.relay = relay;
  }

  async track(
    event: string,
    metadata?: Record<string, any>
  ) {
    try {
      await this.relay.track({
        visitorId: getVisitorId(),
        sessionId: getSessionId(),
        event,
        page: window.location.pathname,
        metadata,
      });
    } catch (error) {
      console.error(
        "Relay Analytics Error:",
        error
      );
    }
  }

  async chatOpened() {
    return this.track(RelayEvents.CHAT_OPENED);
  }

  async chatClosed() {
    return this.track(RelayEvents.CHAT_CLOSED);
  }

  async messageSent(length: number) {
    return this.track(RelayEvents.MESSAGE_SENT, { length });
  }

  async messageReceived() {
    return this.track(RelayEvents.MESSAGE_RECEIVED);
  }
}