"use client";
import { useEffect, useState } from "react";

/**
 * Registriert den Service Worker und meldet, wenn eine neue Version bereit
 * liegt. Weil der alte Cache zuerst bedient wird, sieht man Änderungen sonst
 * erst beim übernächsten Öffnen — mit dem Hinweis genügt ein Tippen.
 */
export function ServiceWorkerRegister() {
  const [neueVersion, setNeueVersion] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    let abgebrochen = false;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // Beim Start einmal nachsehen, ob es etwas Neues gibt.
        reg.update().catch(() => {});

        const beobachte = (worker: ServiceWorker | null) => {
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            // "installed" bei vorhandenem Controller heißt: Update wartet.
            if (worker.state === "installed" && navigator.serviceWorker.controller && !abgebrochen) {
              setNeueVersion(true);
            }
          });
        };

        beobachte(reg.installing);
        reg.addEventListener("updatefound", () => beobachte(reg.installing));
      })
      .catch(() => {});

    return () => {
      abgebrochen = true;
    };
  }, []);

  if (!neueVersion) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-50 flex justify-center px-4">
      <button
        onClick={() => window.location.reload()}
        className="rounded-full px-5 py-3 text-sm font-medium shadow-lg"
        style={{ background: "var(--accent)", color: "var(--accent-text)" }}
      >
        Neue Version verfügbar — tippen zum Laden
      </button>
    </div>
  );
}
