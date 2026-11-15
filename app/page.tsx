"use client";
import { useState, useSyncExternalStore } from "react";
import { LernLink as Link } from "@/components/LernLink";
import { PruefungsPlanHinweis } from "@/components/pruefung/PruefungsFahrplan";
import { useProgress } from "@/components/useProgress";
import { datumStore } from "@/lib/appStores";
import { lernFortsetzung } from "@/lib/lernFortsetzung";
import { serie } from "@/lib/serie";
import { pruefungsreife } from "@/lib/reifegrad";
import { getCurriculum } from "@/lib/curriculum";
import { ladeKursArchiv, ladeKursStand } from "@/lib/kursStand";
import { Arrow } from "@/components/design/Arrow";
import { getLernfelder } from "@/lib/content";
import { ladeLernsignale, lernEmpfehlungen } from "@/lib/lerndiagnose";
import { loadReviewRecords } from "@/lib/review";
import { ThemenSucheStart } from "@/components/suche/ThemenSucheStart";

const WOCHE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export default function Home() {
  const { fortschritt } = useProgress();
  const datum = useSyncExternalStore(datumStore.subscribe, datumStore.getSnapshot, datumStore.getServerSnapshot);
  const [now] = useState(() => Date.now());
  const [werkstattAntworten] = useState(ladeLernsignale);
  const [wiederholungen] = useState(loadReviewRecords);
  const [alleEinheiten] = useState(() => {
    return getLernfelder().reduce((summe, lf) => {
      const einheiten = getCurriculum(lf.id)?.kapitel.flatMap(k => k.einheiten) ?? [];
      const archiv = ladeKursArchiv(lf.id, einheiten);
      const fertig = einheiten.filter(e => ladeKursStand(e).abgeschlossen || archiv.some(a => a.einheitId === e.id && a.version === e.version && a.abgeschlossen)).length;
      return { gesamt: summe.gesamt + einheiten.length, fertig: summe.fertig + fertig };
    }, { gesamt: 0, fertig: 0 });
  });
  const stand = pruefungsreife(fortschritt, now);
  const faellig = stand.faellig + Object.values(wiederholungen).filter(s => s.ref.quelle !== "fachwissen" && s.faelligAm <= now).length;
  const ziel = lernFortsetzung(faellig, now);
  const hinweis = lernEmpfehlungen(werkstattAntworten, now)[0];
  const tage = serie(fortschritt, now);
  const bearbeitet = Object.keys(fortschritt).length;
  const tageBis = datum ? Math.ceil((new Date(datum + "T00:00:00").getTime() - now) / 86400000) : null;
  const lerntage = new Set([
    ...Object.values(fortschritt).flatMap(f => [f.gesehenAm, ...(f.verlauf?.map(v => v.am) ?? [])]),
    ...werkstattAntworten.filter(s => !s.selbstBewertet).map(s => s.am),
    ...Object.values(wiederholungen).flatMap(s => s.verlauf.filter(r => !r.selbstBewertet).map(r => r.am)),
  ].map(t => new Date(t).toLocaleDateString("de-DE")));
  const heute = new Date(now);
  const montag = new Date(heute); montag.setDate(heute.getDate() - (heute.getDay() + 6) % 7);

  return <div className="home-dashboard home-klar">
    <header className="home-begruessung"><div><span className="home-kicker">DEIN LERNPLATZ</span><h1>Schön, dass du da bist.</h1></div></header>
    <ThemenSucheStart />
    <section className="home-next" aria-labelledby="naechster-schritt">
      <span className="home-next-label">{ziel.art === "fortsetzen" ? "HIER WARST DU ZULETZT" : "DEIN NÄCHSTER SCHRITT"}</span>
      <p className="home-next-bereich">{ziel.bereich}</p>
      <h2 id="naechster-schritt">{ziel.titel}</h2>
      <p className="home-next-schritt">{ziel.schritt}</p>
      {ziel.minuten !== undefined && <p className="home-next-zeit">Etwa {ziel.minuten} Minuten</p>}
      <Link className="home-hero-cta" href={ziel.href}>{ziel.art === "fortsetzen" ? "Weiterlernen" : ziel.art === "heute" ? "Tagesrunde starten" : "Lernfeld auswählen"}<Arrow /></Link>
    </section>
    <nav className="home-alternativen" aria-label="Andere Lernmöglichkeiten">
      <Link href="/heute" className="home-alternative"><span className="home-alternative-icon" aria-hidden="true">↻</span><span><strong>Tagesrunde</strong>{" "}<span>{faellig ? `${faellig} ${faellig === 1 ? "Wiederholung ist" : "Wiederholungen sind"} fällig.` : "Fachwissen, Mathe und Sprachen wiederholen."}</span></span><Arrow /></Link>
      <Link href={hinweis?.route ?? "/lernhilfe"} className="home-alternative"><span className="home-alternative-icon" aria-hidden="true">◇</span><span><strong>Gezielt weiterüben</strong>{" "}<span>{hinweis ? `${hinweis.titel} · ${hinweis.grund}` : "Passende Übungen für deinen nächsten Schritt finden."}</span></span><Arrow /></Link>
    </nav>
    <section className="home-kompakt" aria-label="Deine Woche und dein Lernstand">
      <div className="home-kompakt-woche"><div><h2>Deine Woche</h2><p>{tage >= 2 ? `${tage} Lerntage in Folge` : "Jede bearbeitete Aufgabe zählt."}</p></div><div className="home-week-days" aria-label="Lerntage dieser Woche">{WOCHE.map((name, index) => {
        const tag = new Date(montag); tag.setDate(montag.getDate() + index);
        const aktiv = lerntage.has(tag.toLocaleDateString("de-DE"));
        const istHeute = tag.toLocaleDateString("de-DE") === heute.toLocaleDateString("de-DE");
        return <div key={name} className={`${aktiv ? "gelernt" : ""} ${istHeute ? "heute" : ""}`} aria-label={`${name}, ${tag.toLocaleDateString("de-DE")}: ${aktiv ? "gelernt" : "noch keine Aufgabe"}${istHeute ? ", heute" : ""}`}><span>{name}</span><span>{aktiv ? "✓" : istHeute ? "·" : ""}</span></div>;
      })}</div></div>
      <dl className="home-kompakt-zahlen"><div><dt>Wiederholungen fällig</dt><dd>{faellig}</dd></div><div><dt>Fachaufgaben bearbeitet</dt><dd>{bearbeitet}</dd></div><div><dt>Fachwissen-Einheiten geschafft</dt><dd>{alleEinheiten.fertig}<small> / {alleEinheiten.gesamt}</small></dd></div></dl>
      <Link href="/fortschritt" className="home-stand-link">Deinen Lernstand ansehen <Arrow /></Link>
    </section>
    <details className="home-exam-date"><summary><span aria-hidden="true">⚑</span> Prüfungsfahrplan und Termin <span aria-hidden="true">＋</span></summary><div>
      <PruefungsPlanHinweis />
      <label>Mein Prüfungstermin<input type="date" value={datum} onChange={e => datumStore.set(e.target.value)} /></label>
      {tageBis !== null && <p>{tageBis >= 0 ? `Noch ${tageBis} Tage bis zu deinem Termin.` : "Dein gespeicherter Prüfungstermin liegt in der Vergangenheit."}</p>}
      <Link href="/pruefung#fahrplan">Prüfungsfahrplan öffnen →</Link>
      <Link href="/fortschritt">Einstellungen & Datensicherung →</Link>
    </div></details>
  </div>;
}
