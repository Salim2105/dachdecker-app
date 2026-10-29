"use client";

import { useState } from "react";
import { AktivitaetsKarte } from "@/components/AktivitaetsKarte";
import { werkstattAntwortVollstaendig } from "@/lib/werkstattStand";
import { leseDezimalzahl } from "@/lib/zahlen";
import type { WerkstattAntwort, WerkstattAufgabe as Aufgabe, WerkstattBewertung, WerkstattSystemkarte } from "@/lib/werkstattTypen";
import { WerkstattSzene } from "./WerkstattSzene";
import styles from "./Werkstatt.module.css";

export interface WerkstattAufgabeProps {
  aufgabe: Aufgabe; systemkarte: WerkstattSystemkarte; antwort: WerkstattAntwort;
  geprueft: boolean; bewertung?: WerkstattBewertung; disabled?: boolean;
  onChange: (a: WerkstattAntwort) => void; onPruefen: () => void; onHilfe: () => void;
}
const n = (v: number) => v.toLocaleString("de-DE", { maximumFractionDigits: 2 });

export function WerkstattAufgabe({ aufgabe: a, systemkarte, antwort, geprueft, bewertung, disabled = false, onChange, onPruefen, onHilfe }: WerkstattAufgabeProps) {
  const [hintState, setHintState] = useState({ id: a.id, open: false }), [teilWahl, setTeilWahl] = useState({ aufgabeId: a.id, id: "" });
  const hintOpen = hintState.id === a.id && hintState.open;
  const locked = disabled || geprueft;
  const part = a.typ === "verlegen" ? a.teile.find(t => teilWahl.aufgabeId === a.id && t.id === teilWahl.id) ?? a.teile.find(t => !antwort.belegung[t.id]) ?? a.teile[0] : undefined;
  const markPoint = (id: string) => {
    if (locked) return;
    const punkte = antwort.punkte.includes(id) ? antwort.punkte.filter(p => p !== id) : antwort.punkte.length < 2 ? [...antwort.punkte, id] : [id];
    onChange({ ...antwort, punkte });
  };
  const place = (id: string) => {
    if (locked || !part) return;
    const belegung = Object.fromEntries(Object.entries(antwort.belegung).filter(([key, value]) => key !== part.id && value !== id));
    belegung[part.id] = id;
    const folge = [...antwort.folge.filter(key => key !== part.id && !!belegung[key]), part.id];
    onChange({ ...antwort, belegung, folge });
    setTeilWahl({ aufgabeId: a.id, id: "" });
  };
  const count = leseDezimalzahl(antwort.anzahl), offset = leseDezimalzahl(antwort.versatz);
  const gridValid = a.typ === "einteilen" && count !== null && Number.isInteger(count) && count > 0 && count <= 30 && offset !== null && offset >= 0 && offset < a.strecke;
  const hint = <><button type="button" disabled={disabled} className={styles.secondary} aria-expanded={hintOpen} onClick={() => { if (!hintOpen) onHilfe(); setHintState({ id: a.id, open: !hintOpen }); }}>{hintOpen ? "Hinweis schließen" : "Hinweis ansehen"}</button>{hintOpen && <p className={styles.hint}>{a.hinweis}</p>}</>;
  return <section className={styles.task} aria-label={a.titel}>
    <span className={styles.badge}>SELBST AUSPROBIEREN · {a.typ === "anzeichnen" ? "ANZEICHNEN" : a.typ === "einteilen" ? "EINTEILEN" : a.typ === "verlegen" ? "VERLEGEN" : "ENTSCHEIDEN"}</span>
    {a.typ !== "aktivitaet" && <><h3>{a.titel}</h3><p>{a.auftrag}</p></>}
    <WerkstattSzene systemkarte={systemkarte} szene={a.szene} aufgabe={a} antwort={antwort} geprueft={geprueft} onPunkt={!locked ? markPoint : undefined} onZiel={!locked ? place : undefined} />
    {a.typ === "anzeichnen" && <>
      <fieldset className={styles.controls} disabled={locked}><legend className={styles.label}>Zwei Bezugspunkte für deine Linie wählen</legend><p className={styles.muted}>Klicke die Nummern im Bild oder verwende diese Schaltflächen. Erneutes Wählen entfernt einen Punkt; nach zwei Punkten beginnt die nächste Auswahl eine neue Linie.</p><div className={styles.pointGrid}>{a.punkte.map((p, i) => <button key={p.id} type="button" className={styles.choice} disabled={locked} aria-pressed={antwort.punkte.includes(p.id)} onClick={() => markPoint(p.id)}><span className={styles.number}>{i + 1}</span><span>{p.label}</span></button>)}</div></fieldset>
      {a.modus === "schnitt" && <fieldset className={styles.controls} disabled={locked}><legend className={styles.label}>Welche Seite bleibt als Nutzstück erhalten?</legend><div className={styles.pointGrid}>{(["links", "rechts"] as const).map(side => <button key={side} type="button" className={styles.choice} disabled={locked} aria-pressed={antwort.nutzseite === side} onClick={() => onChange({ ...antwort, nutzseite: side })}>{side === "links" ? "Linkes Stück behalten" : "Rechtes Stück behalten"}</button>)}</div><div className={styles.legend}><span><i className={styles.swatch} style={{ background: "#237a6940" }} />Nutzstück</span><span><i className={styles.swatch} style={{ background: "#ab3b3b40" }} />Reststück</span></div></fieldset>}
      <p className={styles.live} aria-live="polite">{antwort.punkte.length < 2 ? `${antwort.punkte.length} von 2 Bezugspunkten gewählt.` : `Deine Linie verbindet ${a.punkte.find(p => p.id === antwort.punkte[0])?.label} und ${a.punkte.find(p => p.id === antwort.punkte[1])?.label}.${a.modus === "schnitt" ? ` Nutzstück: ${antwort.nutzseite || "noch wählen"}.` : ""}`}</p>
    </>}
    {a.typ === "einteilen" && <>
      <fieldset className={styles.fields} disabled={locked}><label className={styles.label}>Anzahl {a.richtung === "laenge" ? "der Abstände" : "der Deckbreiten"}<input className={styles.field} disabled={locked} inputMode="numeric" value={antwort.anzahl} maxLength={12} onChange={e => onChange({ ...antwort, anzahl: e.target.value })} /></label><label className={styles.label}>Startversatz (cm)<input className={styles.field} disabled={locked} inputMode="decimal" value={antwort.versatz} maxLength={16} onChange={e => onChange({ ...antwort, versatz: e.target.value })} /></label></fieldset>
      <p className={styles.live} aria-live="polite">{gridValid ? <>Deine Einteilung: {n(a.strecke - offset!)} cm ÷ {count} = <strong>{n((a.strecke - offset!) / count!)} cm</strong> je {a.richtung === "laenge" ? "Abstand" : "Deckbreite"}. {a.richtung === "laenge" && <>Das ergibt {count! + 1} markierte Reihen einschließlich beider Randlinien.</>}</> : "Trage eine ganze Anzahl von 1 bis 30 und einen gültigen Startversatz ein. Erst dann wird ein Raster dargestellt."}</p>
      <p className={styles.muted}>Einteilungsstrecke: {n(a.strecke)} cm. Der zu dieser Übung gehörende Bereich beträgt {n(a.minAbstand)}–{n(a.maxAbstand)} cm. Trauf- und Firstdetails sind in dieser Einteilungsstrecke bereits ausgenommen.</p>
    </>}
    {a.typ === "verlegen" && <>
      <fieldset className={styles.controls} disabled={locked}><legend className={styles.label}>1. Ein Teil wählen</legend><div className={styles.pointGrid}>{a.teile.map((t, i) => <button key={t.id} type="button" className={styles.choice} disabled={locked} aria-pressed={part?.id === t.id} onClick={() => setTeilWahl({ aufgabeId: a.id, id: t.id })}><span className={styles.number}>{i + 1}</span><span>{t.label}{antwort.belegung[t.id] ? " · eingesetzt" : ""}</span></button>)}</div></fieldset>
      <fieldset className={styles.controls} disabled={locked}><legend className={styles.label}>2. Einen Platz für {part?.label} wählen</legend><div className={styles.pointGrid}>{a.ziele.map((p, i) => <button key={p.id} type="button" className={styles.choice} disabled={locked} onClick={() => place(p.id)}><span className={styles.number}>{i + 1}</span><span>{p.label}</span></button>)}</div></fieldset>
      <p className={styles.live} aria-live="polite">{Object.keys(antwort.belegung).length} von {a.teile.length} Teilen eingesetzt.{a.reihenfolge ? " Auch deine Reihenfolge wird festgehalten." : ""}</p>
      {!!antwort.folge.length && <ol className={styles.placed} aria-label="Deine Verlegereihenfolge">{antwort.folge.map(id => <li key={id}>{a.teile.find(t => t.id === id)?.label} → {a.ziele.find(p => p.id === antwort.belegung[id])?.label}</li>)}</ol>}
      {!locked && <button type="button" className={styles.secondary} onClick={() => onChange({ ...antwort, belegung: {}, folge: [] })}>Deckfeld leeren</button>}
    </>}
    {a.typ === "aktivitaet" && <fieldset disabled={disabled}><AktivitaetsKarte aktivitaet={a.aktivitaet} antwort={antwort.aktivitaet} geprueft={geprueft} onChange={aktivitaet => { if (!disabled) onChange({ ...antwort, aktivitaet }); }} onPruefen={onPruefen} /></fieldset>}
    <div className={styles.actions}>{a.typ !== "aktivitaet" && (!geprueft ? <button type="button" className="hauptaktion" disabled={disabled || !werkstattAntwortVollstaendig(a, antwort)} onClick={onPruefen}>Meine Lösung prüfen</button> : <button type="button" className={styles.secondary} disabled={disabled} onClick={() => onChange(antwort)}>Noch einmal bearbeiten</button>)}{hint}</div>
    {a.typ !== "aktivitaet" && geprueft && bewertung && <div className={styles.feedback} data-richtig={bewertung.richtig} role="status"><strong>{bewertung.richtig ? "Den Arbeitsschritt richtig verstanden." : "Deinen Arbeitsschritt mit dem Muster vergleichen."} {bewertung.erreicht} von {bewertung.moeglich} Punkten.</strong><p>{a.erklaerung}</p>{!!bewertung.hinweise.length && <ul>{bewertung.hinweise.map((h, i) => <li key={i}>{h}</li>)}</ul>}{a.typ === "anzeichnen" && <p>Durchgezogene Linie: dein Anriss. Gestrichelte grüne Linie: Vergleichslinie zwischen {a.punkte.find(p=>p.id===a.loesung[0])?.label} und {a.punkte.find(p=>p.id===a.loesung[1])?.label}.{a.modus === "schnitt" && ` Im Muster bleibt das ${a.nutzseite === "links" ? "linke" : "rechte"} Stück erhalten.`}</p>}
      {a.typ === "einteilen" && <div className={styles.comparison}><strong>Mit der Modelleinteilung vergleichen</strong><p>Deine Eingaben: {antwort.anzahl} {a.richtung === "laenge" ? "Abstände" : "Deckbreiten"}, Startversatz {antwort.versatz} cm.</p><p>Modell: {a.zielAnzahl} {a.richtung === "laenge" ? "Abstände" : "Deckbreiten"}, Startversatz {n(a.zielVersatz)} cm; ({n(a.strecke)} − {n(a.zielVersatz)}) ÷ {a.zielAnzahl} = {n((a.strecke-a.zielVersatz)/a.zielAnzahl)} cm.</p></div>}
      {a.typ === "verlegen" && <div className={styles.comparison}><strong>Deine Plätze und das vorgegebene Modell</strong><ul>{a.teile.map(t=><li key={t.id}>{t.label}: dein Platz „{a.ziele.find(z=>z.id===antwort.belegung[t.id])?.label ?? "noch offen"}“; Modell „{a.ziele.find(z=>z.id===t.zielId)?.label}“.</li>)}</ul>{a.reihenfolge && <p>Vorgegebene Reihenfolge: {a.teile.map(t=>t.label).join(" → ")}.</p>}</div>}</div>}
  </section>;
}
