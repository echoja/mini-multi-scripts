import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    react({ jsxRuntime: "automatic" }),

    // @see https://github.com/tailwindlabs/tailwindcss/issues/15005 (@property isn't supported in shadow roots)
    // {
    //   name: "tailwind-properties",
    //   transform(code, id) {
    //     if (id.endsWith("tailwind-properties.css?inline")) {
    //       // Change custom properties to inherit
    //       code = code.replaceAll("inherits: false", "inherits: true");

    //       // Remove everything before the property declarations
    //       code = code.substring(code.indexOf("@property"));

    //       return code;
    //     }
    //   },
    // },
  ],
  define:
    command === "build"
      ? { "process.env.NODE_ENV": "\"production\"" }
      : undefined,
  build: {
    outDir: "dist",
    emptyOutDir: true,
    minify: true,
    lib: {
      entry: "src/live-locator.tsx",
      formats: ["iife"],
      fileName: () => "live-locator.js",
      name: "BannerLiveLocator",
    },
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
}));
