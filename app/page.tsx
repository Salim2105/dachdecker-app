"use client";
import { useState, useSyncExternalStore } from "react";
import { LernLink as Link } from "@/components/LernLink";
import { LernzeitWahl } from "@/components/LernzeitWahl";
import { useProgress } from "@/components/useProgress";
import { datumStore, lernzeitStore } from "@/lib/appStores";
import { uebungsFortsetzung } from "@/lib/fortsetzung";
import { serie } from "@/lib/serie";
import { pruefungsreife } from "@/lib/reifegrad";
import { appStorage } from "@/lib/lernSpeicher";
import { getCurriculum } from "@/lib/curriculum";
import { ladeKursStand } from "@/lib/kursStand";
import { Arrow } from "@/components/design/Arrow";
import { LernIllustration } from "@/components/design/LernIllustration";
import { getLernfelder } from "@/lib/content";
import { ladeLernsignale, lernEmpfehlungen } from "@/lib/lerndiagnose";
import { loadReviewRecords } from "@/lib/review";

const WOCHE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export default function Home() {
  const { fortschritt } = useProgress();
  const datum = useSyncExternalStore(datumStore.subscribe, datumStore.getSnapshot, datumStore.getServerSnapshot);
  const minuten = useSyncExternalStore(lernzeitStore.subscribe, lernzeitStore.getSnapshot, lernzeitStore.getServerSnapshot);
  const [now] = useState(() => Date.now());
  const [werkstattAntworten] = useState(ladeLernsignale);
  const [wiederholungen] = useState(loadReviewRecords);
  const [letzteUebung] = useState(() => uebungsFortsetzung(appStorage.getItem("letzte-session") ?? "", appStorage.getItem("letztesLf") ?? ""));
  const [letzteEinheit] = useState(() => {
    try { const s = JSON.parse(appStorage.getItem("lernwerkstatt-zuletzt") || "null"); return s && typeof s.lfId === "string" ? s : null; } catch { return null; }
  });
  const [alleEinheiten] = useState(() => {
    const einheiten=getLernfelder().flatMap(lf=>getCurriculum(lf.id)?.kapitel.flatMap(k=>k.einheiten)??[]);
    return {gesamt:einheiten.length,fertig:einheiten.filter(e=>ladeKursStand(e).abgeschlossen).length};
  });
  const [letzteRoute] = useState(() => {
    const route=appStorage.getItem("lernwerkstatt-zuletzt-route");
    return route&&/^\/(?:lernen\/(?:lf\d{2}[ab]?|anhang[123]|wiso)|grundlagen\/mathe|sprache\/(?:deutsch|englisch)|projekte|bildtraining)(?:#[a-z0-9-]+)?$/.test(route)?route:null;
  });
  const hinweise = lernEmpfehlungen(werkstattAntworten, now).slice(0, 2);
  const stand = pruefungsreife(fortschritt, now);
  const faellig = stand.faellig + Object.values(wiederholungen).filter(s => s.ref.quelle !== "fachwissen" && s.faelligAm <= now).length;
  const tage = serie(fortschritt, now);
  const bearbeitet = Object.keys(fortschritt).length;
  const hatStand = bearbeitet > 0 || Object.keys(wiederholungen).length > 0 || letzteEinheit || letzteRoute || letzteUebung;
  const ziel = letzteRoute ?? (letzteEinheit && getCurriculum(letzteEinheit.lfId) ? `/lernen/${letzteEinheit.lfId}${typeof letzteEinheit.unitId === "string" ? `#${encodeURIComponent(letzteEinheit.unitId)}` : ""}` : letzteUebung?.href ?? (hatStand ? "/heute" : "/lernen"));
  const tageBis = datum ? Math.ceil((new Date(datum + "T00:00:00").getTime() - now) / 86400000) : null;
  const lerntage = new Set([...Object.values(fortschritt).flatMap((f) => [f.gesehenAm, ...(f.verlauf?.map((v) => v.am) ?? [])]),...werkstattAntworten.filter(s=>!s.selbstBewertet).map(s=>s.am),...Object.values(wiederholungen).flatMap(s=>s.verlauf.filter(r=>!r.selbstBewertet).map(r=>r.am))].map((t) => new Date(t).toLocaleDateString("de-DE")));
  const heute = new Date(now);
  const montag = new Date(heute); montag.setDate(heute.getDate() - (heute.getDay() + 6) % 7);
  return <div className="home-dashboard home-aufgeraeumt">
    <div className="home-begruessung"><div><span className="home-kicker">DEIN PLATZ ZUM WEITERKOMMEN</span><h1>Schön, dass du da bist.</h1></div><Link href="/fortschritt" className="home-serie"><span aria-hidden="true">✦</span><span>{tage >= 2 ? `${tage} Lerntage in Folge` : hatStand ? "Dein Lernweg wächst" : "Dein erster Schritt wartet"}</span><Arrow /></Link></div>
    <section className="home-hero" aria-labelledby="willkommen">
      <div className="home-hero-text"><span className="home-hero-chip"><span aria-hidden="true">✦</span> MIT KOPF. MIT HAND. MIT DIR.</span>
        <h2 id="willkommen">Weiterlernen.<br /><span>Schritt für Schritt.</span></h2>
        <p>{faellig ? `${faellig} Aufgaben warten auf dich. Frische dein Wissen auf und mach den nächsten Schritt.` : "Vom ersten Fachbegriff bis zur Gesellenprüfung: Entdecke, probiere aus und bring dein Dachwissen nach oben."}</p>
        <Link className="home-hero-cta" href={ziel}>{hatStand ? "Weiterlernen" : "Mit einem Lernfeld starten"}<Arrow /></Link>
        <div className="home-hero-detail"><span className="home-zeit-icon" aria-hidden="true">◷</span>{hatStand ? `${minuten} Minuten für deinen nächsten Schritt` : "Kleine Einheiten. Echte Aha-Momente."}</div>
      </div>
      <div className="home-hero-art"><span className="home-art-label"><span aria-hidden="true">✓</span> VERSTEHEN. ANPACKEN. KÖNNEN.</span><LernIllustration motiv="dach" /><span className="home-art-sticker"><strong>Schritt für Schritt</strong><span>wird aus Wissen Handwerk.</span></span></div>
      <span className="home-hero-grain" aria-hidden="true" />
    </section>
    <div className="home-fokus-grid">
      <section className="home-time-card" aria-labelledby="tagesrunde-titel"><span className="home-kicker">DEINE ZEIT. DEIN TEMPO.</span><h3 id="tagesrunde-titel">Deine Tagesrunde</h3><p>{faellig ? `${faellig} Wiederholungen sind fällig. Wir beginnen mit diesen Aufgaben.` : "Fachwissen, Mathe und Sprachen in einer passenden Runde."}</p><LernzeitWahl /><Link href="/heute" className="home-outline-cta">Tagesrunde öffnen <Arrow /></Link></section>
      <section className="home-hinweise" aria-labelledby="hinweise-titel"><span className="home-kicker">PASSEND ZU DEINEN ANTWORTEN</span><h3 id="hinweise-titel">Deine Lernhinweise</h3>{hinweise.length ? <ul>{hinweise.map(h=><li key={`${h.kategorie}:${h.lernzielId}`}><Link href={h.route}><strong>{h.titel}</strong><span>{h.grund}</span><span className="home-hinweis-ziel">Gezielt weiterüben <Arrow /></span></Link></li>)}</ul> : <><p>Finde heraus, welche Begriffe und Rechenwege du als Nächstes üben möchtest.</p><Link href="/lernhilfe" className="home-outline-cta">Deinen nächsten Schritt finden <Arrow /></Link></>}</section>
    </div>
    <div className="home-stat-cards" aria-label="Dein Lernstand">
      <div className="home-stat"><span className="home-stat-icon home-icon-orange" aria-hidden="true">↻</span><span><strong>{faellig}</strong><span>Wiederholungen fällig</span></span><Link href="/heute" aria-label="Fällige Aufgaben wiederholen"><Arrow /></Link></div>
      <div className="home-stat"><span className="home-stat-icon home-icon-teal" aria-hidden="true">✓</span><span><strong>{bearbeitet}</strong><span>Fachaufgaben bearbeitet</span></span><Link href="/fortschritt" aria-label="Deinen Aufgabenfortschritt ansehen"><Arrow /></Link></div>
      <div className="home-stat"><span className="home-stat-icon home-icon-violet" aria-hidden="true">⚑</span><span><strong>{alleEinheiten.fertig}<small> / {alleEinheiten.gesamt}</small></strong><span>Fachwissen-Einheiten geschafft</span></span><Link href="/lernen" aria-label="Zu deinen Lerneinheiten"><Arrow /></Link></div>
    </div>
    <section className="home-week"><div className="home-week-copy"><span className="home-kicker">DRANBLEIBEN FÜHLT SICH GUT AN</span><h2>Deine Woche. Deine Schritte.</h2><p>Jeder ausgefüllte Tag steht für eine bearbeitete Aufgabe. Auch nach einer Pause geht dein Lernweg weiter.</p></div><div className="home-week-days" aria-label="Lerntage dieser Woche">{WOCHE.map((name,index)=>{const tag=new Date(montag);tag.setDate(montag.getDate()+index);const aktiv=lerntage.has(tag.toLocaleDateString("de-DE"));const istHeute=tag.toLocaleDateString("de-DE")===heute.toLocaleDateString("de-DE");return <div key={name} className={`${aktiv ? "gelernt" : ""} ${istHeute ? "heute" : ""}`} aria-label={`${name}, ${tag.toLocaleDateString("de-DE")}: ${aktiv ? "gelernt" : "noch keine Aufgabe"}${istHeute ? ", heute" : ""}`}><span>{name}</span><span>{aktiv ? "✓" : istHeute ? "·" : ""}</span></div>;})}</div><span className="home-week-star" aria-hidden="true">✦</span></section>
    <details className="home-exam-date"><summary><span aria-hidden="true">⚑</span> Prüfungstermin und Lernstand <span aria-hidden="true">＋</span></summary><div><label>Mein Prüfungstermin<input type="date" value={datum} onChange={(e)=>datumStore.set(e.target.value)} /></label>{tageBis!==null&&<p>{tageBis>=0?`Noch ${tageBis} Tage bis zu deinem Termin.`:"Dein gespeicherter Prüfungstermin liegt in der Vergangenheit."}</p>}<Link href="/fortschritt">Fortschritt, Einstellungen & Datensicherung →</Link></div></details>
  </div>;
}
