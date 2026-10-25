"use client";
import { LernLink as Link } from "@/components/LernLink";
import { getLernfelder, getAufgaben } from "@/lib/content";
import { useProgress } from "@/components/useProgress";
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
      <div><span className={styles.eyebrow}>Wissen wird Handwerk</span><h1>Deine Lernfelder</h1><p>Vom ersten Fachbegriff bis zur fertigen Dachkonstruktion. Entdecke dein nächstes Kapitel.</p></div>
      <LearningArtwork variant={5} className={styles.heroArt} />
    </header>
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
    <p className={`${styles.hint} mt-6`}><span aria-hidden="true">→</span><span>Alle Lernfelder, Anhänge und WiSo sind in kurze Einheiten unterteilt. Du kannst jeden Bereich öffnen und in deinem Tempo lernen.</span></p>
  </div>;
}
