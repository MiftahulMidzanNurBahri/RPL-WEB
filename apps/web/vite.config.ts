import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
// Node-only loader; this module imports neither the API app nor Prisma.
import "../api/src/config/env.ts";
import { projectRoot } from "../api/src/lib/paths.ts";
import { resolveCsrfCookieName } from "../../packages/shared/src/cookie-config.ts";

export default defineConfig(({ mode }) => {
  const publicEnv = loadEnv(mode, projectRoot, ["VITE_CSRF_COOKIE_NAME", "VITE_API_URL"]);
  const csrfName = resolveCsrfCookieName({
    csrfName: process.env.CSRF_COOKIE_NAME,
    publicName: publicEnv.VITE_CSRF_COOKIE_NAME
  });
  return {
    envDir: projectRoot,
    envPrefix: [],
    define: {
      "import.meta.env.VITE_CSRF_COOKIE_NAME": JSON.stringify(csrfName),
      "import.meta.env.VITE_API_URL": JSON.stringify(publicEnv.VITE_API_URL ?? "")
    },
    plugins: [react()],
    server: {
      host: "127.0.0.1",
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true
        },
        "/uploads": {
          target: "http://localhost:3000",
          changeOrigin: true
        }
      }
    }
  };
});
