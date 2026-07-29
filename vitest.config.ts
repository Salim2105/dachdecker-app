import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    passWithNoTests: true,
    // .claude/worktrees enthält vollständige Arbeitskopien des Repos. Ohne
    // diesen Ausschluss läuft jeder Test doppelt — einmal hier, einmal in der
    // Kopie, die auf einem anderen Stand sein kann. Eine grüne Gesamtzahl sagt
    // dann nichts mehr darüber aus, ob DIESER Stand grün ist.
    exclude: ["**/node_modules/**", "**/dist/**", "**/.next/**", "**/.claude/worktrees/**"],
    setupFiles: ["./vitest.setup.ts"],
    environmentOptions: { jsdom: { url: "http://localhost:3200" } },
  },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
