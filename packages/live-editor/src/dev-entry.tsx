import { mountLiveEditor } from "./mountLiveEditor";

const version = __BANNER_VERSION__ || "dev";

if (typeof window !== "undefined" && !window.__BANNER_LIVE_EDITOR__) {
  mountLiveEditor({ baseUrl: window.location.origin + "/", version });
}

export { mountLiveEditor };
