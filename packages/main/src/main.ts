interface BannerLocation {
  selector: string;
}

interface BannerConfig {
  locations: BannerLocation[];
}

const LIVE_EDITOR_PARAM = "bannerEditor";
const LIVE_EDITOR_TRIGGER_VALUES = new Set(["1", "true", "yes"]);

const version = __BANNER_VERSION__ || "dev";

const normalizedBaseUrl = __BANNER_BASE_URL__.trim();

function createBannerElement(): HTMLElement {
  const container = document.createElement("div");
  container.className = "banner-tool-banner";
  container.style.padding = "12px";
  container.style.margin = "8px 0";
  container.style.backgroundColor = "#1f2937";
  container.style.color = "#f9fafb";
  container.style.borderRadius = "8px";
  container.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  container.style.boxShadow = "0 4px 10px rgba(0,0,0,0.15)";
  container.dataset.bannerTool = "banner";
  container.textContent = "🚀 배너 툴이 활성화되었습니다. 이 영역에 커스텀 프로모션을 보여주세요.";
  return container;
}

async function loadBannerConfig(url: string): Promise<BannerConfig | null> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      console.warn(`[banner-tool] Failed to fetch config: ${response.status}`);
      return null;
    }
    return (await response.json()) as BannerConfig;
  } catch (error) {
    console.warn("[banner-tool] Unable to fetch banner config", error);
    return null;
  }
}

function insertBannerAt(location: BannerLocation, banner: HTMLElement): void {
  const target = document.querySelector(location.selector);
  if (!target || !target.parentElement) {
    console.warn(`[banner-tool] Selector not found: ${location.selector}`);
    return;
  }

  const clonedBanner = banner.cloneNode(true) as HTMLElement;
  target.insertAdjacentElement("afterend", clonedBanner);
}

function shouldLoadLiveEditor(): boolean {
  const param = new URL(window.location.href).searchParams.get(LIVE_EDITOR_PARAM);
  if (!param) {
    return false;
  }
  return LIVE_EDITOR_TRIGGER_VALUES.has(param.toLowerCase());
}

const LIVE_EDITOR_TAG = "banner-live-editor";
let liveEditorScriptPromise: Promise<void> | null = null;

function ensureModuleScript(url: string, id: string): Promise<void> {
  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing) {
    return existing.dataset.ready === "true"
      ? Promise.resolve()
      : new Promise<void>((resolve, reject) => {
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener(
            "error",
            () => reject(new Error(`[banner-tool] Failed to load script: ${url}`)),
            { once: true }
          );
        });
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "module";
    script.id = id;
    script.src = url;
    script.crossOrigin = "anonymous";
    script.dataset.ready = "false";
    script.addEventListener(
      "load",
      () => {
        script.dataset.ready = "true";
        resolve();
      },
      { once: true }
    );
    script.addEventListener(
      "error",
      () => {
        script.remove();
        reject(new Error(`[banner-tool] Failed to load script: ${url}`));
      },
      { once: true }
    );
    document.head.appendChild(script);
  });
}

async function ensureLiveEditorLoaded(): Promise<HTMLElement> {
  if (!liveEditorScriptPromise) {
    if (import.meta.env.DEV) {
      const devEntry =
        (import.meta.env.VITE_LIVE_EDITOR_DEV_ORIGIN as string | undefined) ||
        "http://localhost:5174/src/live-editor.tsx";
      // await ensureModuleScript("http://localhost:5174/@vite/client", "vite-client-dev");
      const script = document.createElement("script");
      script.type = "module";
      script.textContent = `
        import { injectIntoGlobalHook } from "http://localhost:5174/@react-refresh";
        injectIntoGlobalHook(window);
        window.$RefreshReg$ = () => {};
        window.$RefreshSig$ = () => (type) => type;
      `;
      document.head.appendChild(script);
      
      await ensureModuleScript("http://localhost:5174/@react-refresh", "react-refresh-dev");
      liveEditorScriptPromise = ensureModuleScript(devEntry, "banner-live-editor-dev");
    } else {
      const url = new URL(`live-editor/live-editor.js?v=${version}`, import.meta.url).href;
      liveEditorScriptPromise = ensureModuleScript(url, "banner-live-editor-prod");
    }
  }

  await liveEditorScriptPromise;
  await customElements.whenDefined(LIVE_EDITOR_TAG);

  let element = document.querySelector(LIVE_EDITOR_TAG) as HTMLElement | null;
  if (!element) {
    element = document.createElement(LIVE_EDITOR_TAG);
    element.setAttribute("version", version);
    document.body.appendChild(element);
  } else {
    element.setAttribute("version", version);
  }

  return element;
}

async function loadLiveEditor(): Promise<void> {
  if (!shouldLoadLiveEditor()) {
    return;
  }
  try {
    const element = await ensureLiveEditorLoaded();
    window.__BANNER_LIVE_EDITOR__ = {
      version,
      element,
      close: () => document.querySelector(LIVE_EDITOR_TAG)?.remove(),
      open: () => {
        if (!document.querySelector(LIVE_EDITOR_TAG)) {
          const next = document.createElement(LIVE_EDITOR_TAG);
          next.setAttribute("version", version);
          document.body.appendChild(next);
        }
      }
    };
  } catch (error) {
    liveEditorScriptPromise = null;
    console.warn("[banner-tool] Failed to bootstrap live editor", error);
  }
}

async function init(): Promise<void> {
  window.__BANNER_TOOL__ = {
    version,
  };

  const configUrl = new URL("banner-locations.json", window.location.href).href;
  const config = await loadBannerConfig(configUrl);
  if (!config) {
    return;
  }

  const bannerTemplate = createBannerElement();
  for (const location of config.locations) {
    insertBannerAt(location, bannerTemplate);
  }

  await loadLiveEditor();
}

export {};

declare global {
  interface Window {
    __BANNER_TOOL__?: {
      version: string;
    };
    __BANNER_LIVE_EDITOR__?: {
      version: string;
      element: HTMLElement;
      open: () => void;
      close: () => void;
    };
  }
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      void init();
    },
    { once: true }
  );
} else {
  void init();
}
