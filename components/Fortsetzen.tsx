"use client";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { letztesLfStore } from "@/lib/appStores";
import { getLernfeld, getAufgaben } from "@/lib/content";

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

  if (!lf || typeof window === "undefined") return null;
  let index: number | null = null;
  try {
    const s = JSON.parse(localStorage.getItem(`dd-session-${lf}`) || "null");
    if (s && typeof s.index === "number") index = s.index;
  } catch {}

  if (index === null) return null;
  const feld = getLernfeld(lf);
  const total = getAufgaben(lf).length;
  if (!feld || index >= total) return null;

  return (
    <Link
      href={`/lernen/${lf}/ueben`}
      className="flex items-center justify-between rounded-[var(--r-lg)] px-4 py-3.5 text-[15px] font-semibold transition-transform active:scale-[0.99]"
      style={{ background: "var(--accent)", color: "var(--accent-text)", boxShadow: "var(--shadow-md)" }}
    >
      <span className="min-w-0">
        <span className="block truncate">Übung fortsetzen</span>
        <span className="block truncate text-xs font-medium opacity-80">
          {feld.titel} · Frage {index + 1} von {total}
        </span>
      </span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </Link>
  );
}
