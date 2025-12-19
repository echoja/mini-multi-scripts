import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: "src/main.ts",
      formats: ["iife"],
      fileName: () => "main.js",
      name: "BannerMain"
    },
    rollupOptions: {
      output: {
        entryFileNames: () => "main.js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]"
      }
    }
  }
});
