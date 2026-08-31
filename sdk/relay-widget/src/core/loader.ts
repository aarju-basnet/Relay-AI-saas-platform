import { getWidgetConfig } from "./config";
import { initializeAnalytics } from "./initAnalytics";
import { RelayWidget } from "./widget";

export async function loadRelayWidget() {
  try {
    const config = getWidgetConfig();

    initializeAnalytics(
      config.apiKey,
      config.apiBaseUrl
    );

    const widget = new RelayWidget(config);

    await widget.init();

    return widget;
  } catch (error) {
    console.error(
      "Relay Widget failed to initialize.",
      error
    );
  }
}