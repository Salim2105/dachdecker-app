"use client";
import { useEffect, useRef, useState } from "react";

export type BearbeitungsSperrStatus = "pruefen" | "frei" | "gesperrt" | "nicht-verfuegbar";
export interface BearbeitungsSperre { status: BearbeitungsSperrStatus; fehler: string }
const STANDARD_SCOPE = "dachdecker-pruefungsfall-bearbeitung";
const NICHT_VERFUEGBAR = "Der Schutz vor gleichzeitiger Bearbeitung ist in diesem Browser nicht verfügbar. Bitte bearbeite diesen Bereich nur in einem Fenster.";

/** A same-origin Web Lock lives for this component mount, never for a render or a task.
 * No lock support is a visible compatibility fallback, not an editing prohibition.
 * A blocked second window must be reopened after the first window is closed. */
export function useBearbeitungsSperre(scope: string = STANDARD_SCOPE): BearbeitungsSperre {
  const [stand, setStand] = useState<{ scope: string } & BearbeitungsSperre>(() => ({ scope, status: typeof navigator !== "undefined" && !navigator.locks ? "nicht-verfuegbar" : "pruefen", fehler: typeof navigator !== "undefined" && !navigator.locks ? NICHT_VERFUEGBAR : "" }));
  const vorherigerAuftrag = useRef<Promise<void> | null>(null);
  useEffect(() => {
    let aktiv = true;
    let freigeben!: () => void;
    const bisUnmount = new Promise<void>(resolve => { freigeben = resolve; });
    const vorher = vorherigerAuftrag.current;
    // StrictMode may clean up and mount the same effect before its async request
    // acquired the lock. Wait for that retired request to release before retrying.
    const auftrag = (async () => {
      await vorher;
      if (!aktiv) return;
      const manager = typeof navigator === "undefined" ? undefined : navigator.locks;
      if (!manager || typeof manager.request !== "function") {
        setStand({ scope, status: "nicht-verfuegbar", fehler: NICHT_VERFUEGBAR });
        return;
      }
      await manager.request(scope, { ifAvailable: true }, async lock => {
        if (!aktiv) return;
        if (lock === null) {
          setStand({ scope, status: "gesperrt", fehler: "Dieser Bereich wird bereits in einem anderen Fenster bearbeitet. Schließe das andere Fenster und lade diese Seite danach neu." });
          return;
        }
        setStand({ scope, status: "frei", fehler: "" });
        await bisUnmount;
      });
    })().catch(() => {
      if (aktiv) setStand({ scope, status: "nicht-verfuegbar", fehler: "Der Schutz vor gleichzeitiger Bearbeitung konnte nicht gestartet werden. Bitte bearbeite diesen Bereich nur in einem Fenster." });
    });
    vorherigerAuftrag.current = auftrag;
    return () => { aktiv = false; freigeben(); };
  }, [scope]);
  return stand.scope === scope ? { status: stand.status, fehler: stand.fehler } : { status: "pruefen", fehler: "" };
}
