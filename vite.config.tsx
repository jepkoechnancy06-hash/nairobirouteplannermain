import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

async function getReplitPlugins() {
  if (process.env.NODE_ENV === "production" || !process.env.REPL_ID) return [];
  try {
    const [errorOverlay, cartographer, devBanner] = await Promise.all([
      import("@replit/vite-plugin-runtime-error-modal").then((m) => m.default()),
      import("@replit/vite-plugin-cartographer").then((m) => m.cartographer()),
      import("@replit/vite-plugin-dev-banner").then((m) => m.devBanner()),
    ]);
    return [errorOverlay, cartographer, devBanner];
  } catch {
    return [];
  }
}

export default defineConfig(async () => ({
  plugins: [
    react(),
    ...(await getReplitPlugins()),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
}));
