"use client";
import { useEffect } from "react";

/**
 * Hält die Web-/iOS-PWA automatisch aktuell (Service Worker fürs Offline-Cachen).
 *
 * WICHTIG: In der Desktop-App (Electron) wird KEIN Service Worker registriert.
 * Dort lädt die App ohnehin lokal vom eingebauten Server — ein SW bringt keinen
 * Nutzen, sondern führt nur dazu, dass nach einem Update die alte, gecachte
 * Version angezeigt wird. Deshalb: in Electron einen evtl. vorhandenen alten SW
 * abmelden und seine Caches leeren, sonst nichts.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const istElectron = /electron/i.test(navigator.userAgent);

    if (istElectron || process.env.NODE_ENV !== "production") {
      // Aufräumen: alten Service Worker abmelden und Caches leeren (heilt einen
      // festhängenden Stand). localStorage (Fortschritt) bleibt unberührt.
      navigator.serviceWorker
        .getRegistrations()
        .then((rs) => rs.forEach((r) => r.unregister()))
        .catch(() => {});
      if (istElectron && "caches" in window) {
        caches
          .keys()
          .then((ks) => ks.forEach((k) => caches.delete(k)))
          .catch(() => {});
      }
      return;
    }

    // --- Web / iOS-PWA: registrieren und automatisch aktualisieren ---
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
      // updateViaCache: "none" → sw.js wird nie aus dem HTTP-Cache genommen,
      // sonst wird ein Update evtl. nicht erkannt.
      .register("/sw.js", { updateViaCache: "none" })
      .then((r) => {
        reg = r;
        r.update().catch(() => {});
      })
      .catch(() => {});

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
