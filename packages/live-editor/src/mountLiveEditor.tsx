import { createRoot, Root } from "react-dom/client";
import { LiveEditorApp } from "./LiveEditorApp";

const ROOT_ID = "banner-live-editor-root";

export type MountOptions = {
  baseUrl: string;
  version: string;
};

export type MountResult = {
  destroy: () => void;
};

let currentRoot: Root | null = null;
let currentContainer: HTMLElement | null = null;

const destroyCurrent = () => {
  currentRoot?.unmount();
  currentContainer?.remove();
  currentRoot = null;
  currentContainer = null;
  if (window.__BANNER_LIVE_EDITOR__) {
    delete window.__BANNER_LIVE_EDITOR__;
  }
};

export function mountLiveEditor(options: MountOptions): MountResult {
  if (typeof document === "undefined") {
    throw new Error("Live editor cannot be mounted outside the browser.");
  }

  if (currentRoot && currentContainer) {
    window.__BANNER_LIVE_EDITOR__ = {
      version: options.version,
      baseUrl: options.baseUrl,
      destroy: destroyCurrent
    };
    return {
      destroy: destroyCurrent
    };
  }

  const container = document.createElement("div");
  container.id = ROOT_ID;
  container.dataset.bannerTool = "live-editor-root";
  document.body.appendChild(container);

  const root = createRoot(container);

  currentRoot = root;
  currentContainer = container;

  const destroy = () => {
    destroyCurrent();
  };

  root.render(
    <LiveEditorApp
      version={options.version}
      onClose={destroy}
    />
  );

  window.__BANNER_LIVE_EDITOR__ = {
    version: options.version,
    baseUrl: options.baseUrl,
    destroy
  };

  return { destroy };
}

declare global {
  interface Window {
    __BANNER_LIVE_EDITOR__?: {
      version: string;
      baseUrl: string;
      destroy: () => void;
    };
  }
}
