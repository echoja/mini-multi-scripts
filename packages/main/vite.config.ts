import { defineConfig } from "vite";

const commitHash = process.env.COMMIT_SHA || process.env.GIT_COMMIT_SHA || "dev";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: "src/main.ts",
      formats: ["iife"],
      name: "BannerMain",
      fileName: () => "main.js"
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  },
  define: {
    __BANNER_VERSION__: JSON.stringify(commitHash)
  }
});
