import { RelayApi } from "@/api/relayApi";
import { getVisitorId } from "@/session/visitor";
import { getSessionId } from "@/session/session";

export class ChatService {
  private relay: RelayApi;

  constructor(relay: RelayApi) {
    this.relay = relay;
  }

  async sendMessage(message: string) {
    return this.relay.chat({
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
      message,
    });
  }
}