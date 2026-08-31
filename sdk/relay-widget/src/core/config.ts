import type { RelayWidgetConfig } from "../types/widget";

export function getWidgetConfig(): RelayWidgetConfig {
  const script =
    document.currentScript as HTMLScriptElement;

  if (!script) {
    throw new Error(
      "Relay Widget must be loaded using a script tag."
    );
  }

  const apiKey = script.dataset.apiKey;

  if (!apiKey) {
    throw new Error(
      "Missing data-api-key."
    );
  }

  const apiBaseUrl =
    script.dataset.apiBaseUrl;

  if (!apiBaseUrl) {
    throw new Error(
      "Missing data-api-base-url."
    );
  }

  return {
    apiKey,

    apiBaseUrl,

    theme:
      (script.dataset.theme as
        | "light"
        | "dark"
        | "auto") ?? "light",

    position:
      (script.dataset.position as
        | "left"
        | "right") ?? "right",

    primaryColor:
      script.dataset.primaryColor ??
      "#C46B48",

    welcomeMessage:
      script.dataset.welcomeMessage,
  };
}