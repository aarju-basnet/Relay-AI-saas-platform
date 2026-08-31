export interface RelayWidgetConfig {
  apiKey: string;

  apiBaseUrl: string;

  theme?: "light" | "dark" | "auto";

  position?: "left" | "right";

  primaryColor?: string;

  welcomeMessage?: string;
}

export interface RelayWidgetInstance {
  init(): Promise<void>;

  open(): void;

  close(): void;

  destroy(): void;
}