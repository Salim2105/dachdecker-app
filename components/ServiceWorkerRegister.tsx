"use client";
import { useEffect } from "react";

/**
 * Registriert den Service Worker und hält die App automatisch aktuell.
 *
 * Ablauf ohne Zutun: Beim Start (und jedes Mal, wenn die App wieder in den
 * Vordergrund kommt) wird nach einer neuen Version gesehen. Liegt eine bereit,
 * übernimmt der neue Service Worker sofort (skipWaiting + clients.claim im
 * sw.js) und die App lädt sich genau einmal neu — dann sind Inhalte frisch.
 * Kein Knopf, keine App-Store-Updates: einmal Safari/App öffnen genügt.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    // Gab es beim Laden schon einen Controller? Dann ist ein späterer Wechsel
    // ein echtes Update (neu laden). Beim allerersten Install nicht neu laden.
    const hatteController = !!navigator.serviceWorker.controller;
    let neugeladen = false;

    const beiWechsel = () => {
      if (neugeladen || !hatteController) return;
      neugeladen = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", beiWechsel);

    let reg: ServiceWorkerRegistration | undefined;
    navigator.serviceWorker
      .register("/sw.js")
      .then((r) => {
        reg = r;
        r.update().catch(() => {});
      })
      .catch(() => {});

    // Kommt die App aus dem Hintergrund zurück, erneut nach Updates sehen.
    const beiSichtbar = () => {
      if (!document.hidden) reg?.update().catch(() => {});
    };
    document.addEventListener("visibilitychange", beiSichtbar);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", beiWechsel);
      document.removeEventListener("visibilitychange", beiSichtbar);
    };
  }, []);

  return null;
}
