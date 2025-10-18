import { createRoot, Root } from "react-dom/client";
import { LiveEditorApp } from "./LiveEditorApp";

const ELEMENT_TAG = "banner-live-editor";

declare global {
  interface Window {
    __BANNER_LIVE_EDITOR__?: {
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

class BannerLiveEditorElement extends HTMLElement {
  private state: ElementState | null = null;

  static get observedAttributes(): string[] {
    return ["version"];
  }

  connectedCallback(): void {
    if (this.state) {
      return;
    }

    const shadowRoot = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    const resetStyle = document.createElement("style");
    resetStyle.textContent = `
      :host {
        all: initial;
        display: contents;
      }
      :host([hidden]) {
        display: none;
      }
    `;

    const mountPoint = document.createElement("div");
    mountPoint.id = "banner-live-editor-root";
    shadowRoot.append(resetStyle, mountPoint);

    const version = this.getAttribute("version") ?? window.__BANNER_TOOL__?.version ?? "dev";

    const root = createRoot(mountPoint);
    const handleClose = () => {
      this.dispatchEvent(new CustomEvent("banner-live-editor:close", { bubbles: true }));
      this.remove();
    };

    root.render(<LiveEditorApp version={version} onClose={handleClose} />);

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
      this.dispatchEvent(new CustomEvent("banner-live-editor:close", { bubbles: true }));
      this.remove();
    };

    this.state.root.render(<LiveEditorApp version={nextVersion} onClose={handleClose} />);
    this.state.version = nextVersion;
  }
}

export function defineLiveEditorElement(): void {
  if (!customElements.get(ELEMENT_TAG)) {
    customElements.define(ELEMENT_TAG, BannerLiveEditorElement);
  }
}

defineLiveEditorElement();

declare global {
  interface Window {
    __BANNER_TOOL__?: {
      version: string;
      assetBase: string;
    };
  }

  interface HTMLElementTagNameMap {
    "banner-live-editor": BannerLiveEditorElement;
  }
}
