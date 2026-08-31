export interface RelayEventPayload {
  visitorId: string;
  sessionId: string;
  event: string;
  page?: string;
  metadata?: Record<string, any>;
}

export interface RelayChatResponse {
  reply: string;
}

export interface RelayVerifyResponse {
  success: boolean;
  organizationId: string;
}

export class RelayApi {
  private apiKey: string;
  private apiBaseUrl: string;

  constructor(apiKey: string, apiBaseUrl: string) {
    this.apiKey = apiKey;
    this.apiBaseUrl = apiBaseUrl;
  }

  private async request<T>(
    endpoint: string,
    body: Record<string, any>
  ): Promise<T> {
    const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Relay-Key": this.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Relay request failed.");
    }

    return response.json();
  }

  async track(payload: RelayEventPayload) {
    return this.request("/api/widget/events", payload);
  }

  async chat(payload: {
    visitorId: string;
    sessionId: string;
    message: string;
  }) {
    return this.request<RelayChatResponse>("/api/widget/chat", payload);
  }

  async verify() {
    return this.request<RelayVerifyResponse>("/api/widget/verify", {});
  }
}