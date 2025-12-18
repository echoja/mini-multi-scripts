import { createRoot, Root } from "react-dom/client";
import { LiveLocatorApp } from "./LiveLocatorApp";
import styles from "./live-locator.css?inline";

const ELEMENT_TAG = "banner-live-locator";

declare global {
  interface Window {
    __BANNER_LIVE_LOCATOR__?: {
      version: string;
      baseUrl: string;
      destroy: () => void;
    };
  }
}

type ElementState = {
  root: Root;
  version: string;
};

class BannerLiveLocatorElement extends HTMLElement {
  private state: ElementState | null = null;

  static get observedAttributes(): string[] {
    return ["version"];
  }

  connectedCallback(): void {
    if (this.state) {
      return;
    }

    const shadowRoot = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    const globalStyle = document.createElement("style");
    globalStyle.textContent = `${styles}`;

    const mountPoint = document.createElement("div");
    mountPoint.id = "banner-live-locator-root";
    shadowRoot.append(globalStyle, mountPoint);

    const version = this.getAttribute("version") ?? window.__BANNER_TOOL__?.version ?? "dev";

    const root = createRoot(mountPoint);
    const handleClose = () => {
      this.dispatchEvent(new CustomEvent("banner-live-locator:close", { bubbles: true }));
      this.remove();
    };

    root.render(<LiveLocatorApp version={version} onClose={handleClose} />);

    this.state = { root, version };
  }

  disconnectedCallback(): void {
    this.state?.root.unmount();
    this.state = null;
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name !== "version" || oldValue === newValue || !this.state) {
      return;
    }

    const nextVersion = newValue ?? "dev";
    const handleClose = () => {
      this.dispatchEvent(new CustomEvent("banner-live-locator:close", { bubbles: true }));
      this.remove();
    };

    this.state.root.render(<LiveLocatorApp version={nextVersion} onClose={handleClose} />);
    this.state.version = nextVersion;
  }
}

export function defineLiveLocatorElement(): void {
  if (!customElements.get(ELEMENT_TAG)) {
    customElements.define(ELEMENT_TAG, BannerLiveLocatorElement);
  }
}

defineLiveLocatorElement();

declare global {
  interface Window {
    __BANNER_TOOL__?: {
      version: string;
      assetBase: string;
    };
  }

  interface HTMLElementTagNameMap {
    "banner-live-locator": BannerLiveLocatorElement;
  }
}
