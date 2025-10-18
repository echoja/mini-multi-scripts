import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const commitHash = process.env.COMMIT_SHA || process.env.GIT_COMMIT_SHA || "dev";

export default defineConfig({
  plugins: [react({ jsxRuntime: "automatic" })],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: "src/live-editor.tsx",
      formats: ["es"],
      fileName: () => "live-editor.js"
    },
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name]-[hash][extname]"
      }
    }
  },
  define: {
    __BANNER_VERSION__: JSON.stringify(commitHash)
  }
});
