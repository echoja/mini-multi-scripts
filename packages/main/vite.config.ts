import { defineConfig } from "vite";

const commitHash = process.env.COMMIT_SHA || process.env.GIT_COMMIT_SHA || "dev";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: "src/main.ts",
      formats: ["es"],
      fileName: () => "main.js"
    },
    rollupOptions: {
      output: {
        entryFileNames: () => "main.js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]"
      }
    }
  },
  define: {
    __BANNER_VERSION__: JSON.stringify(commitHash),
  }
});
