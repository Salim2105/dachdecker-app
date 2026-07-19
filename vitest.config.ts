import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    passWithNoTests: true,
    setupFiles: ["./vitest.setup.ts"],
    environmentOptions: { jsdom: { url: "http://localhost:3200" } },
  },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
