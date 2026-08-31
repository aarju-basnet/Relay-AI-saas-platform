import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "RelayWidget",
      fileName: () => "widget.js",
      formats: ["iife"],
    },

    cssCodeSplit: false,

    rollupOptions: {
      output: {
        assetFileNames: "widget.css",
      },
    },
  },
});