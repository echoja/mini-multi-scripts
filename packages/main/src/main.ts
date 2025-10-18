interface BannerLocation {
  selector: string;
}

interface BannerConfig {
  locations: BannerLocation[];
}

const LIVE_EDITOR_PARAM = "bannerEditor";
const LIVE_EDITOR_TRIGGER_VALUES = new Set(["1", "true", "yes"]);

const version = __BANNER_VERSION__ || "dev";

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

type LiveEditorModule = {
  mountLiveEditor: (options: { baseUrl: string; version: string }) => void;
};

const scriptElement = document.currentScript as HTMLScriptElement | null;
const scriptSrc = scriptElement?.src;
const assetBase = scriptSrc ? new URL("./", scriptSrc).href : window.location.origin + "/";

async function loadLiveEditor(): Promise<void> {
  if (!shouldLoadLiveEditor()) {
    return;
  }

  const devOverride =
    (import.meta.env.VITE_LIVE_EDITOR_DEV_ORIGIN as string | undefined) ||
    "http://localhost:5174/src/dev-entry.tsx";

  if (import.meta.env.DEV) {
    try {
      const module = (await import(/* @vite-ignore */ `${devOverride}`)) as LiveEditorModule | undefined;
      if (module?.mountLiveEditor) {
        const devBase = new URL("./", devOverride).href;
        module.mountLiveEditor({ baseUrl: devBase, version });
      }
      return;
    } catch (error) {
      console.warn("[banner-tool] Live editor dev server unavailable", error);
    }
  }

  const liveEditorUrl = new URL(`live-editor/live-editor.js?v=${version}`, assetBase).href;
  try {
    const module = (await import(/* @vite-ignore */ liveEditorUrl)) as LiveEditorModule | undefined;
    if (module?.mountLiveEditor) {
      module.mountLiveEditor({ baseUrl: assetBase, version });
    }
  } catch (error) {
    console.warn("[banner-tool] Failed to load live editor", error);
  }
}

async function init(): Promise<void> {
  window.__BANNER_TOOL__ = {
    version,
    assetBase
  };

  const configUrl = new URL("banner-locations.json", assetBase).href;
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

declare global {
  interface Window {
    __BANNER_TOOL__?: {
      version: string;
      assetBase: string;
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
