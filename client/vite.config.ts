import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: __dirname,
  resolve: {
    alias: {
      "@client": path.resolve(__dirname, "src"),
      "@mods": path.resolve(__dirname, "../mods"),
      "@engine": path.resolve(__dirname, "../engine"),
      "@shared": path.resolve(__dirname, "../engine/shared")
    }
  },
  server: {
    port: 5173,
    open: false
  },
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true
  }
});
