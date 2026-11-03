"use client";
import { useEffect, useRef, type ReactNode } from "react";
import styles from "./Katalog.module.css";

export function KatalogKopf({ bereich, titel, children }: { bereich: string; titel: string; children: ReactNode }) {
  return <header className={styles.kopf}><span>{bereich}</span><h1>{titel}</h1><p>{children}</p></header>;
}

export function KatalogSuche({ label, wert, onChange }: { label: string; wert: string; onChange: (wert: string) => void }) {
  return <label className={styles.suche}>{label}<input type="search" value={wert} onChange={event => onChange(event.target.value)} placeholder="Titel oder Thema eingeben" /></label>;
}

export function katalogPasst(suche: string, ...texte: string[]): boolean {
  const begriffe = suche.trim().toLocaleLowerCase("de-DE").split(/\s+/).filter(Boolean);
  const text = texte.join(" ").toLocaleLowerCase("de-DE");
  return begriffe.every(begriff => text.includes(begriff));
}

/** A changed local view needs the same focus hand-off as a full page change. */
export function useKatalogFokus(ziel: string, selector = "main h1, h1") {
  const vorher = useRef(ziel);
  useEffect(() => {
    if (vorher.current === ziel) return;
    vorher.current = ziel;
    const kopf = document.querySelector<HTMLElement>(selector);
    if (kopf) { kopf.tabIndex = -1; kopf.focus({ preventScroll: true }); }
  }, [ziel, selector]);
}
