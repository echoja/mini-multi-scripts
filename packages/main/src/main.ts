interface BannerLocation {
  selector: string;
}

interface BannerConfig {
  locations: BannerLocation[];
}

const LIVE_LOCATOR_PARAM = "liveLocator";
const LIVE_LOCATOR_TRIGGER_VALUES = new Set(["1", "true", "yes"]);

const version = "dev";

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
  container.textContent = "This is a banner injected by Banner Tool";
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

function shouldLoadLiveLocator(): boolean {
  const param = new URL(window.location.href).searchParams.get(LIVE_LOCATOR_PARAM);
  if (!param) {
    return false;
  }
  return LIVE_LOCATOR_TRIGGER_VALUES.has(param.toLowerCase());
}

const LIVE_LOCATOR_TAG = "banner-live-locator";
let liveLocatorScriptPromise: Promise<void> | null = null;

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

async function ensureLiveLocatorLoaded(): Promise<HTMLElement> {
  if (!liveLocatorScriptPromise) {
    if (import.meta.env.DEV) {
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
      liveLocatorScriptPromise = ensureModuleScript("http://localhost:5174/src/live-locator.tsx", "banner-live-locator-dev");
    } else {
      const url = new URL(/* @vite-ignore */`live-locator/live-locator.js?v=${version}`, import.meta.url).href;
      liveLocatorScriptPromise = ensureModuleScript(url, "banner-live-locator-prod");
    }
  }

  await liveLocatorScriptPromise;
  await customElements.whenDefined(LIVE_LOCATOR_TAG);

  let element = document.querySelector(LIVE_LOCATOR_TAG) as HTMLElement | null;
  if (!element) {
    element = document.createElement(LIVE_LOCATOR_TAG);
    element.setAttribute("version", version);
    document.body.appendChild(element);
  } else {
    element.setAttribute("version", version);
  }

  return element;
}

async function loadLiveLocator(): Promise<void> {
  if (!shouldLoadLiveLocator()) {
    return;
  }
  try {
    const element = await ensureLiveLocatorLoaded();
    window.__BANNER_LIVE_LOCATOR__ = {
      version,
      element,
      close: () => document.querySelector(LIVE_LOCATOR_TAG)?.remove(),
      open: () => {
        if (!document.querySelector(LIVE_LOCATOR_TAG)) {
          const next = document.createElement(LIVE_LOCATOR_TAG);
          next.setAttribute("version", version);
          document.body.appendChild(next);
        }
      }
    };
  } catch (error) {
    liveLocatorScriptPromise = null;
    console.warn("[banner-tool] Failed to bootstrap live locator", error);
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

  await loadLiveLocator();
}

export {};

declare global {
  interface Window {
    __BANNER_TOOL__?: {
      version: string;
    };
    __BANNER_LIVE_LOCATOR__?: {
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
