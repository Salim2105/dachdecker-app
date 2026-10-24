"use client";
import Link from "next/link";
import { getLernfelder, getAufgaben } from "@/lib/content";
import { useProgress } from "@/components/useProgress";
import { Fortsetzen } from "@/components/Fortsetzen";
import { useState } from "react";
import { lernStatus } from "@/lib/lernstand";
import type { AufgabenFortschritt, Lernfeld } from "@/content/schema";
import { LearningArtwork } from "@/components/learning/LearningArtwork";
import { learningTone } from "@/components/learning/learningDesign";
import styles from "@/components/learning/Learning.module.css";

const GRUPPEN = [
  { key: 1, label: "1. Lehrjahr", beschreibung: "Dein Fundament fürs Handwerk" },
  { key: 2, label: "2. Lehrjahr", beschreibung: "Zusammenhänge verstehen und anwenden" },
  { key: 3, label: "3. Lehrjahr", beschreibung: "Mehr Verantwortung. Mehr Können." },
];
function anteil(fortschritt: Record<string, AufgabenFortschritt>, ids: string[], jetzt: number): number {
  if (ids.length === 0) return 0;
  return ids.filter((id) => lernStatus(fortschritt[id], jetzt) === "gefestigt").length / ids.length;
}

export default function LernenPage() {
  const { fortschritt } = useProgress();
  const [jetzt] = useState(() => Date.now());
  const [lehrjahr, setLehrjahr] = useState<number | "alle">("alle");
  const alle = getLernfelder();
  const wiso = alle.filter((lf) => lf.id === "wiso");
  const lernfelder = alle.filter((lf) => lf.id !== "wiso");

  function lernfeldKarte(lf: Lernfeld, index: number) {
    const aufgaben = getAufgaben(lf.id);
    const gefestigt = anteil(fortschritt, aufgaben.map((a) => a.id), jetzt);
    return <Link key={lf.id} href={`/lernen/${lf.id}`} className={styles.field} style={learningTone(index)}>
      <div className={styles.fieldTop}>
        <span className={styles.numberBadge}>{lf.nr}</span>
        <LearningArtwork variant={index} className={styles.fieldArt} />
      </div>
      <h3>{lf.titel}</h3>
      <span className={styles.fieldMeta}>{aufgaben.length ? `${aufgaben.length} Aufgaben` : `${lf.themen.length} Themen`}{gefestigt > 0 ? ` · ${Math.round(gefestigt * aufgaben.length)} gefestigt` : " · Bereit für deinen ersten Schritt"}</span>
      <div className={styles.fieldBottom}>
        <div className={styles.progressTrack} role="progressbar" aria-label={`${lf.titel}: gefestigte Aufgaben`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(gefestigt * 100)}><span className={styles.progressFill} style={{ width: `${gefestigt * 100}%` }} /></div>
        <span className={styles.arrow} aria-hidden="true">→</span>
      </div>
    </Link>;
  }

  return <div>
    <header className={styles.pathHero}>
      <div><span className={styles.eyebrow}>Wissen wird Handwerk</span><h1>Dein Lernpfad</h1><p>Vom ersten Fachbegriff bis zur fertigen Dachkonstruktion. Entdecke dein nächstes Kapitel.</p></div>
      <LearningArtwork variant={5} className={styles.heroArt} />
    </header>
    <Link href="/lernen/lf07" className={styles.feature}>
      <div>
        <span className={styles.chip}><span className={styles.chipDot} aria-hidden="true" /> Dein Einstieg in die Lernwerkstatt</span>
        <h2>LF7 · Dem Wasser<br />auf der Spur.</h2>
        <p>Sechs Kapitel, 18 kurze Einheiten. Verstehen, selbst ausprobieren und Schritt für Schritt sicherer werden.</p>
        <span className={styles.featureButton}>Mit dem Wasserweg beginnen <span aria-hidden="true">→</span></span>
      </div>
      <LearningArtwork variant={0} className={styles.heroArt} />
    </Link>
    <Fortsetzen />
    <div className={styles.shortcuts}>
      <Link href="/lernweg" className={styles.shortcut}>
        <span className={styles.shortcutIcon} aria-hidden="true"><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 19V7a2 2 0 0 1 2-2h12M5 19h12a2 2 0 0 0 2-2V5M5 19l4-4m4-4 3-3"/><circle cx="9" cy="15" r="1"/></svg></span>
        <span><strong>Lieber mit Begleitung starten?</strong><small>Sechs geführte Grundlagen-Einheiten →</small></span>
      </Link>
    </div>
    <div className={styles.filters} role="group" aria-label="Lernfelder nach Lehrjahr filtern">
      <button aria-pressed={lehrjahr === "alle"} onClick={() => setLehrjahr("alle")}>Alle Lernfelder</button>
      {GRUPPEN.map((g) => <button key={g.key} aria-pressed={lehrjahr === g.key} onClick={() => setLehrjahr(g.key)}>{g.label}</button>)}
    </div>
    {GRUPPEN.filter((g) => lehrjahr === "alle" || lehrjahr === g.key).map((g) => {
      const items = lernfelder.filter((lf) => lf.lehrjahr === g.key);
      if (!items.length) return null;
      return <section key={g.key}>
        <div className={styles.groupTitle}><div><h2>{g.label}</h2><span>{g.beschreibung}</span></div><span>{items.length} Lernbereiche</span></div>
        <div className={styles.fields}>{items.map((lf, index) => lernfeldKarte(lf, index + g.key - 1))}</div>
      </section>;
    })}
    {lehrjahr === "alle" && wiso.length > 0 && <section>
      <div className={styles.groupTitle}><h2>Wirtschafts- und Sozialkunde</h2><span>Wissen über den Beruf hinaus</span></div>
      <div className={styles.fields}>{wiso.map((lf, index) => lernfeldKarte(lf, index + 2))}</div>
    </section>}
    <p className={`${styles.hint} mt-6`}><span aria-hidden="true">→</span><span>Unser Tipp: Lernfeld 7 bereitet dich auf LF8–10 vor. Du kannst jeden Bereich öffnen und in deinem Tempo lernen.</span></p>
  </div>;
}
