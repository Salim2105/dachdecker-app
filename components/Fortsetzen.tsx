"use client";
import { useSyncExternalStore } from "react";
import { LernLink as Link } from "@/components/LernLink";
import { letzteSessionStore, letztesLfStore } from "@/lib/appStores";
import { uebungsFortsetzung } from "@/lib/fortsetzung";

/**
 * Springt mit einem Tipp zurück in die laufende Übung — genau an die Frage, wo
 * man aufgehört hat. Erscheint nur, wenn ein Übungsstand gespeichert ist.
 */
export function Fortsetzen() {
  const lf = useSyncExternalStore(
    letztesLfStore.subscribe,
    letztesLfStore.getSnapshot,
    letztesLfStore.getServerSnapshot,
  );

  const letzte = useSyncExternalStore(letzteSessionStore.subscribe, letzteSessionStore.getSnapshot, letzteSessionStore.getServerSnapshot);
  if (typeof window === "undefined") return null;
  const aktiv = uebungsFortsetzung(letzte, lf);
  if (!aktiv) return null;

  return (
    <Link
      href={aktiv.href}
      /* Bewusst als Umriss, nicht gefüllt: "Heute dran" ist die empfohlene
         Aktion — zwei gefüllte Flächen nebeneinander heben sich gegenseitig auf. */
      className="flex min-h-14 items-center justify-between rounded-[var(--r-lg)] border px-4 py-3.5 text-[15px] font-semibold transition-transform active:scale-[0.99]"
      style={{ borderColor: "var(--accent)", color: "var(--text)" }}
    >
      <span className="min-w-0">
        <span className="block truncate">{aktiv.nacharbeit ? "Fehlernacharbeit fortsetzen" : aktiv.titel}</span>
        <span className="block text-[13px] font-medium leading-snug" style={{ color: "var(--text-muted)" }}>
          Frage {aktiv.index + 1} von {aktiv.total} · {aktiv.thema}
        </span>
      </span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </Link>
  );
}
