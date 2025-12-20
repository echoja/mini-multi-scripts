import { createRoot, Root } from "react-dom/client";
import { LiveLocatorApp } from "./LiveLocatorApp";
import { StrictMode } from "react";

const ELEMENT_TAG = "banner-live-locator";

declare global {
  interface HTMLElementTagNameMap {
    "banner-live-locator": BannerLiveLocatorElement;
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

    const mountPoint = document.createElement("div");
    mountPoint.id = "banner-live-locator-root";
    shadowRoot.append(mountPoint);

    const version = this.getAttribute("version") ?? "dev";

    const root = createRoot(mountPoint);
    const handleClose = () => {
      console.log("[banner-tool] Live Locator close requested");
      this.dispatchEvent(
        new CustomEvent("banner-live-locator:close", { bubbles: true })
      );
      this.remove();
    };

    root.render(
      <StrictMode>
        <LiveLocatorApp version={version} onClose={handleClose} />
      </StrictMode>
    );

    this.state = { root, version };

    console.log("[banner-tool] Live Locator mounted", { version });
  }

  disconnectedCallback(): void {
    this.state?.root.unmount();
    this.state = null;
    console.log("[banner-tool] Live Locator unmounted");
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ): void {
    if (name !== "version" || oldValue === newValue || !this.state) {
      return;
    }

    const nextVersion = newValue ?? "dev";
    const handleClose = () => {
      console.log("[banner-tool] Live Locator close requested");
      this.dispatchEvent(
        new CustomEvent("banner-live-locator:close", { bubbles: true })
      );
      this.remove();
    };

    this.state.root.render(
      <StrictMode>
        <LiveLocatorApp version={nextVersion} onClose={handleClose} />
      </StrictMode>
    );
    this.state.version = nextVersion;
    console.log("[banner-tool] Live Locator version updated", {
      version: nextVersion,
    });
  }
}

export function defineLiveLocatorElement(): void {
  if (!customElements.get(ELEMENT_TAG)) {
    customElements.define(ELEMENT_TAG, BannerLiveLocatorElement);
    console.log("[banner-tool] Live Locator element defined");
  }
}

defineLiveLocatorElement();
