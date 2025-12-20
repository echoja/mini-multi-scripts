interface BannerLocation {
  selector: string;
}

interface BannerConfig {
  locations: BannerLocation[];
}

const version = "dev";

function insertBannerAt(location: BannerLocation): void {
  const banner = document.createElement("div");
  banner.className = "banner-tool-banner";
  banner.style.padding = "12px";
  banner.style.margin = "8px 0";
  banner.style.backgroundColor = "#1f2937";
  banner.style.color = "#f9fafb";
  banner.style.borderRadius = "8px";
  banner.style.fontFamily =
    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  banner.style.boxShadow = "0 4px 10px rgba(0,0,0,0.15)";
  banner.dataset.bannerTool = "banner";
  banner.textContent = "This is a banner injected by Banner Tool";

  const target = document.querySelector(location.selector);
  if (!target || !target.parentElement) {
    console.warn(`[banner-tool] Selector not found: ${location.selector}`);
    return;
  }

  target.insertAdjacentElement("afterend", banner);
}

const LIVE_LOCATOR_TAG = "banner-live-locator";
let liveLocatorScriptPromise: Promise<void> | null = null;

function loadScript(url: string, id: string): Promise<void> {
  const existing = document.getElementById(id) as HTMLScriptElement | null;

  if (existing) {
    return existing.dataset.ready === "true"
      ? Promise.resolve()
      : new Promise<void>((resolve, reject) => {
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener(
            "error",
            () =>
              reject(new Error(`[banner-tool] Failed to load script: ${url}`)),
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

async function loadLiveLocator(): Promise<void> {
  const param = new URL(window.location.href).searchParams.get("liveLocator");
  if (param !== "1") {
    return;
  }

  try {
    if (!liveLocatorScriptPromise) {
      if (import.meta.env.DEV) {
        const script = document.createElement("script");
        script.type = "module";
        script.textContent = `
        import { injectIntoGlobalHook } from "http://localhost:5174/@react-refresh";
        injectIntoGlobalHook(window);
        window.$RefreshReg$ = () => {};
        window.$RefreshSig$ = () => (type) => type;
      `;
        document.head.appendChild(script);

        liveLocatorScriptPromise = loadScript(
          "http://localhost:5174/src/live-locator.tsx",
          "banner-live-locator-dev"
        );
      } else {
        const url = new URL(
          /* @vite-ignore */ `live-locator/live-locator.js?v=${version}`,
          import.meta.url
        ).href;
        liveLocatorScriptPromise = loadScript(url, "banner-live-locator-prod");
      }
    }

    await liveLocatorScriptPromise;
    await customElements.whenDefined(LIVE_LOCATOR_TAG);

    let element = document.querySelector(
      LIVE_LOCATOR_TAG
    ) as HTMLElement | null;
    if (!element) {
      element = document.createElement(LIVE_LOCATOR_TAG);
      element.setAttribute("version", version);
      document.body.appendChild(element);
    } else {
      element.setAttribute("version", version);
    }
  } catch (error) {
    liveLocatorScriptPromise = null;
    console.warn("[banner-tool] Failed to bootstrap live locator", error);
  }
}

async function init(): Promise<void> {
  const configUrl = new URL("banner-locations.json", window.location.href).href;

  const response = await fetch(configUrl, { cache: "no-store" });
  const config = (await response.json()) as BannerConfig;

  for (const location of config.locations) {
    insertBannerAt(location);
  }

  await loadLiveLocator();
}

export {};

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
