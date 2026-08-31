import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";

import Widget from "../components/Widget";
import type { RelayWidgetConfig } from "../types/widget";

export class RelayWidget {
  private root: Root | null = null;

  private container: HTMLDivElement | null = null;

  private config: RelayWidgetConfig;

  constructor(config: RelayWidgetConfig) {
    this.config = config;
  }

  async init(): Promise<void> {
    const existing =
      document.getElementById(
        "relay-widget-root"
      );

    if (existing) {
      existing.remove();
    }

    this.container =
      document.createElement("div");

    this.container.id =
      "relay-widget-root";

    document.body.appendChild(
      this.container
    );

    this.root = createRoot(
      this.container
    );

   this.root.render(<Widget config={this.config} />);
  }

  open(): void {}

  close(): void {}

  destroy(): void {
    this.root?.unmount();

    this.container?.remove();

    this.root = null;

    this.container = null;
  }
}