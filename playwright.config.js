// Abre cada story del catálogo ya construido (npm run build-storybook) y comprueba que el panel arranca sin errores.
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "stories",
  testMatch: "*.spec.js",
  use: { baseURL: "http://127.0.0.1:6111" },
  webServer: { command: "npx vite preview --outDir storybook-static --host 127.0.0.1 --port 6111 --strictPort", url: "http://127.0.0.1:6111/index.json" },
});
