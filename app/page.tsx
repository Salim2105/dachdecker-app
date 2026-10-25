"use client";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { LernzeitWahl } from "@/components/LernzeitWahl";
import { useProgress } from "@/components/useProgress";
import { Fortsetzen } from "@/components/Fortsetzen";
import { datumStore, lernzeitStore } from "@/lib/appStores";
import { serie } from "@/lib/serie";
import { pruefungsreife } from "@/lib/reifegrad";
import { appStorage } from "@/lib/lernSpeicher";
import { getCurriculum } from "@/lib/curriculum";
import { ladeKursStand } from "@/lib/kursStand";
import { Arrow } from "@/components/design/Arrow";
import { LernIllustration } from "@/components/design/LernIllustration";
import { GrundlagenEntdecken } from "@/components/GrundlagenEntdecken";
import { getLernfelder } from "@/lib/content";
import { ladeLernsignale } from "@/lib/lerndiagnose";
import { loadReviewRecords } from "@/lib/review";

const WOCHE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export default function Home() {
  const { fortschritt } = useProgress();
  const datum = useSyncExternalStore(datumStore.subscribe, datumStore.getSnapshot, datumStore.getServerSnapshot);
  const minuten = useSyncExternalStore(lernzeitStore.subscribe, lernzeitStore.getSnapshot, lernzeitStore.getServerSnapshot);
  const [now] = useState(() => Date.now());
  const [werkstattAntworten] = useState(ladeLernsignale);
  const [wiederholungen] = useState(loadReviewRecords);
  const [letzteEinheit] = useState(() => {
    try { const s = JSON.parse(appStorage.getItem("lernwerkstatt-zuletzt") || "null"); return s && typeof s.lfId === "string" ? s : null; } catch { return null; }
  });
  const [erledigt] = useState(() => getCurriculum("lf07")!.kapitel.flatMap((k) => k.einheiten).filter((e) => ladeKursStand(e).abgeschlossen).length);
  const [alleEinheiten] = useState(() => {
    const einheiten=getLernfelder().flatMap(lf=>getCurriculum(lf.id)?.kapitel.flatMap(k=>k.einheiten)??[]);
    return {gesamt:einheiten.length,fertig:einheiten.filter(e=>ladeKursStand(e).abgeschlossen).length};
  });
  const [letzteRoute] = useState(() => {
    const route=appStorage.getItem("lernwerkstatt-zuletzt-route");
    return route&&/^\/(?:lernen\/(?:lf\d{2}[ab]?|anhang[123]|wiso)|grundlagen\/mathe|sprache\/(?:deutsch|englisch)|projekte|bildtraining)(?:#[a-z0-9-]+)?$/.test(route)?route:null;
  });
  const stand = pruefungsreife(fortschritt, now);
  const faellig = stand.faellig + Object.values(wiederholungen).filter(s => s.ref.quelle !== "fachwissen" && s.faelligAm <= now).length;
  const tage = serie(fortschritt, now);
  const bearbeitet = Object.keys(fortschritt).length;
  const hatStand = bearbeitet > 0 || Object.keys(wiederholungen).length > 0 || letzteEinheit || letzteRoute;
  const ziel = letzteRoute ?? (letzteEinheit && getCurriculum(letzteEinheit.lfId) ? `/lernen/${letzteEinheit.lfId}${typeof letzteEinheit.unitId === "string" ? `#${encodeURIComponent(letzteEinheit.unitId)}` : ""}` : hatStand ? "/heute" : "/lernen");
  const tageBis = datum ? Math.ceil((new Date(datum + "T00:00:00").getTime() - now) / 86400000) : null;
  const lerntage = new Set([...Object.values(fortschritt).flatMap((f) => [f.gesehenAm, ...(f.verlauf?.map((v) => v.am) ?? [])]),...werkstattAntworten.filter(s=>!s.selbstBewertet).map(s=>s.am),...Object.values(wiederholungen).flatMap(s=>s.verlauf.filter(r=>!r.selbstBewertet).map(r=>r.am))].map((t) => new Date(t).toLocaleDateString("de-DE")));
  const heute = new Date(now);
  const montag = new Date(heute); montag.setDate(heute.getDate() - (heute.getDay() + 6) % 7);
  return <div className="home-dashboard">
    <div className="home-begruessung"><div><span className="home-kicker">DEIN PLATZ ZUM WEITERKOMMEN</span><h1>Schön, dass du da bist.</h1></div><Link href="/fortschritt" className="home-serie"><span aria-hidden="true">✦</span><span>{tage >= 2 ? `${tage} Lerntage in Folge` : hatStand ? "Dein Lernweg wächst" : "Dein erster Schritt wartet"}</span><Arrow /></Link></div>
    <section className="home-hero" aria-labelledby="willkommen">
      <div className="home-hero-text"><span className="home-hero-chip"><span aria-hidden="true">✦</span> MIT KOPF. MIT HAND. MIT DIR.</span>
        <h2 id="willkommen">Dein Handwerk.<br /><span>Dein nächstes Level.</span></h2>
        <p>{faellig ? `${faellig} Aufgaben warten auf dich. Frische dein Wissen auf und mach den nächsten Schritt.` : "Vom ersten Fachbegriff bis zur Gesellenprüfung: Entdecke, probiere aus und bring dein Dachwissen nach oben."}</p>
        <Link className="home-hero-cta" href={ziel}>{hatStand ? "Weiterlernen" : "Deinen Lernpfad entdecken"}<Arrow /></Link>
        <div className="home-hero-detail"><span className="home-zeit-icon" aria-hidden="true">◷</span>{hatStand ? `${minuten} Minuten für deinen nächsten Schritt` : "Kleine Einheiten. Echte Aha-Momente."}</div>
      </div>
      <div className="home-hero-art"><span className="home-art-label"><span aria-hidden="true">✓</span> VERSTEHEN. ANPACKEN. KÖNNEN.</span><LernIllustration motiv="dach" /><span className="home-art-sticker"><strong>Schritt für Schritt</strong><span>wird aus Wissen Handwerk.</span></span></div>
      <span className="home-hero-grain" aria-hidden="true" />
    </section>
    <div className="home-stat-cards" aria-label="Dein Lernstand">
      <div className="home-stat"><span className="home-stat-icon home-icon-orange" aria-hidden="true">↻</span><span><strong>{faellig}</strong><span>Wiederholungen fällig</span></span><Link href="/heute" aria-label="Fällige Aufgaben wiederholen"><Arrow /></Link></div>
      <div className="home-stat"><span className="home-stat-icon home-icon-teal" aria-hidden="true">✓</span><span><strong>{bearbeitet}</strong><span>Fachaufgaben bearbeitet</span></span><Link href="/fortschritt" aria-label="Deinen Aufgabenfortschritt ansehen"><Arrow /></Link></div>
      <div className="home-stat"><span className="home-stat-icon home-icon-violet" aria-hidden="true">⚑</span><span><strong>{alleEinheiten.fertig}<small> / {alleEinheiten.gesamt}</small></strong><span>Fachwissen-Einheiten geschafft</span></span><Link href="/lernen" aria-label="Zu deinen Lerneinheiten"><Arrow /></Link></div>
    </div>
    <div className="home-resume"><Fortsetzen /></div>
    <GrundlagenEntdecken />
    <div className="werkstatt-kopfzeile home-section-title"><div><span className="home-kicker">KLEIN ANFANGEN. WEIT KOMMEN.</span><h2>Was nimmst du dir heute vor?</h2></div><Link href="/lernen">Alle Lernfelder <Arrow /></Link></div>
    <div className="home-next-grid">
      <Link href="/lernen/lf07" className="home-mission-card"><div className="home-mission-copy"><span className="home-small-badge">DEINE LERNMISSION</span><span className="home-mission-meta">LF7 · DACHENTWÄSSERUNG</span><h3>Dem Wasser<br />auf der Spur.</h3><p>Verfolge den Wasserweg. Lerne die Bauteile kennen. Löse deinen ersten Baustellenfall.</p><span className="home-mission-progress"><span><span style={{width:`${erledigt / 18 * 100}%`}} /></span><small>{erledigt} von 18 Einheiten</small></span><span className="home-card-cta">Kapitel entdecken <span aria-hidden="true">→</span></span></div><LernIllustration motiv="wasser" className="home-mission-art" /></Link>
      <section className="home-time-card"><div className="home-time-heading"><span className="home-stat-icon home-icon-orange" aria-hidden="true">◷</span><span className="home-kicker">DEINE ZEIT. DEIN TEMPO.</span></div><h3>Auch kurz zählt.</h3><p>Eine kleine Runde passt fast immer. Wir wählen die passenden Aufgaben für dich aus.</p><LernzeitWahl /><Link href="/heute" className="home-outline-cta">Tagesempfehlung öffnen <span aria-hidden="true">→</span></Link><span className="home-time-doodle" aria-hidden="true">✦</span></section>
    </div>
    <div className="werkstatt-kopfzeile home-section-title"><div><span className="home-kicker">ABWECHSLUNG TUT DEM KOPF GUT</span><h2>Heute mal anders lernen.</h2></div><Link href="/ueben">Zum Übungsraum <Arrow /></Link></div>
    <div className="home-discover-grid">
      <Link className="home-discover home-discover-orange" href="/lernen/lf07"><div className="home-discover-art"><LernIllustration motiv="quiz" /><span className="home-discover-tag">MITDENKEN</span></div><div className="home-discover-copy"><h3>Kopf an. Quiz los.</h3><p>Zuordnen, Knobeln und Zusammenhänge entdecken.</p><span>Aktive Aufgaben entdecken <Arrow /></span></div></Link>
      <Link className="home-discover home-discover-violet" href="/zeichnen"><div className="home-discover-art"><LernIllustration motiv="zeichnen" /><span className="home-discover-tag">AUSPROBIEREN</span></div><div className="home-discover-copy"><h3>Dein Strich zählt.</h3><p>Skizzieren, vergleichen und die nächste Idee festhalten.</p><span>Zeichenwerkstatt öffnen <Arrow /></span></div></Link>
      <Link className="home-discover home-discover-teal" href="/pruefung"><div className="home-discover-art"><LernIllustration motiv="pruefung" /><span className="home-discover-tag">DURCHSTARTEN</span></div><div className="home-discover-copy"><h3>Zeig, was du kannst.</h3><p>Drei Trainingsstufen. Dein Tempo. Klare nächste Schritte.</p><span>Zum Prüfungsraum <Arrow /></span></div></Link>
    </div>
    <section className="home-week"><div className="home-week-copy"><span className="home-kicker">DRANBLEIBEN FÜHLT SICH GUT AN</span><h2>Deine Woche. Deine Schritte.</h2><p>Jeder ausgefüllte Tag steht für eine bearbeitete Aufgabe. Auch nach einer Pause geht dein Lernweg weiter.</p></div><div className="home-week-days" aria-label="Lerntage dieser Woche">{WOCHE.map((name,index)=>{const tag=new Date(montag);tag.setDate(montag.getDate()+index);const aktiv=lerntage.has(tag.toLocaleDateString("de-DE"));const istHeute=tag.toLocaleDateString("de-DE")===heute.toLocaleDateString("de-DE");return <div key={name} className={`${aktiv ? "gelernt" : ""} ${istHeute ? "heute" : ""}`} aria-label={`${name}, ${tag.toLocaleDateString("de-DE")}: ${aktiv ? "gelernt" : "noch keine Aufgabe"}${istHeute ? ", heute" : ""}`}><span>{name}</span><span>{aktiv ? "✓" : istHeute ? "·" : ""}</span></div>;})}</div><span className="home-week-star" aria-hidden="true">✦</span></section>
    <details className="home-exam-date"><summary><span aria-hidden="true">⚑</span> Prüfungstermin und Lernstand <span aria-hidden="true">＋</span></summary><div><label>Mein Prüfungstermin<input type="date" value={datum} onChange={(e)=>datumStore.set(e.target.value)} /></label>{tageBis!==null&&<p>{tageBis>=0?`Noch ${tageBis} Tage bis zu deinem Termin.`:"Dein gespeicherter Prüfungstermin liegt in der Vergangenheit."}</p>}<Link href="/fortschritt">Fortschritt, Einstellungen & Datensicherung →</Link></div></details>
  </div>;
}
