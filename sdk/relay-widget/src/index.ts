import "./index.css";
import { loadRelayWidget } from "./core/loader";

declare global {
  interface Window {
    Relay: any;
  }
}

window.Relay = {
  init: loadRelayWidget,
};

loadRelayWidget();