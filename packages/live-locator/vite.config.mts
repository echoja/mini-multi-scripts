import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), react({ jsxRuntime: "automatic" })],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: "src/live-locator.tsx",
      formats: ["es"],
      fileName: () => "live-locator.js"
    },
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name]-[hash][extname]"
      }
    }
  }
});
