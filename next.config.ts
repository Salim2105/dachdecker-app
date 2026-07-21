import type { NextConfig } from "next";

// Mit EXPORT=1 baut Next die App als reine statische Dateien nach `out/`.
// Das braucht die Offline-Desktop-App (Electron lädt diese Dateien lokal).
// Ohne EXPORT läuft alles wie bisher (Server + PWA fürs Web).
const istExport = process.env.EXPORT === "1";

const nextConfig: NextConfig = {
  output: istExport ? "export" : undefined,
  images: { unoptimized: istExport },
};

export default nextConfig;
