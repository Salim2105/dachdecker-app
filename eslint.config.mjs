import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // These production entrypoints run directly in Node as CommonJS.
  { files: ["scripts/praxisvideos/*.cjs"], rules: { "@typescript-eslint/no-require-imports": "off" } },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    ".probe-export/**",
    "build/**",
    "dist-desktop/**",
    ".praxisvideo-production/**",
    "electron/**", // eigener Node/CJS-Prozess, nicht die Next-App
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
