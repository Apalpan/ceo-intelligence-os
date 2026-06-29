import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// base: "./" makes the build work on GitHub Pages, a subpath, or file:// (double-click).
// Routing is hash-based so no server rewrites are needed.
export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  build: {
    outDir: "dist",
    target: "es2020",
    chunkSizeWarningLimit: 1200,
  },
});
