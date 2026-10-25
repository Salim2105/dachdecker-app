"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Bewertung } from "@/content/schema";
import { AktivitaetsKarte } from "@/components/AktivitaetsKarte";
import { DrawCard } from "@/components/aufgaben/DrawCard";
import { PracticeArtwork } from "@/components/practice/PracticeArtwork";
import { appStorage } from "@/lib/lernSpeicher";
import { istAktivitaetVollstaendig, type AktivitaetAntwort } from "@/lib/aktivitaeten";
import { BAUPROJEKTE, PROJEKT_SCHRITTE, darfProjektRechnen, leseProjektStand, neuerProjektStand, projektErgebnis, projektKey, projektVollstaendig, pruefeProjektZahl, type BauProjekt, type ProjektStand } from "@/lib/bauprojekte";
import styles from "./Projekte.module.css";

const AUSWAHL_KEY = "bauprojekte-auswahl";
const urteil: Record<Bewertung, string> = { richtig: "Kann ich erklären", teilweise: "Teilweise sicher", falsch: "Noch einmal üben" };
type AktivitaetsName = "auftrag" | "befund" | "massnahme" | "ablauf";
function ProjektAktivitaet({name,projekt,stand,onAntwort,onPruefen}:{name:AktivitaetsName;projekt:BauProjekt;stand:ProjektStand;onAntwort:(name:AktivitaetsName,a:AktivitaetAntwort)=>void;onPruefen:(name:AktivitaetsName)=>void}) {
  return <AktivitaetsKarte aktivitaet={projekt.aktivitaeten[name]} antwort={stand.antworten[name]} geprueft={stand.geprueft.includes(name)} onChange={a=>onAntwort(name,a)} onPruefen={()=>onPruefen(name)}/>;
}
function gespeicherteAuswahl(): string {
  if (typeof window === "undefined") return "";
  const id = window.location.hash.slice(1) || appStorage.getItem(AUSWAHL_KEY);
  return BAUPROJEKTE.some(p => p.id === id) ? id! : "";
}
export function ProjektWerkstatt() {
  const [auswahl, setAuswahl] = useState(gespeicherteAuswahl);
  useEffect(() => {
    const wechseln = () => setAuswahl(BAUPROJEKTE.some(p => p.id === window.location.hash.slice(1)) ? window.location.hash.slice(1) : "");
    window.addEventListener("hashchange", wechseln);
    window.addEventListener("popstate", wechseln);
    return () => { window.removeEventListener("hashchange", wechseln); window.removeEventListener("popstate", wechseln); };
  }, []);
  function waehlen(id: string) {
    setAuswahl(id);
    try {
      if (id) { appStorage.setItem(AUSWAHL_KEY, id); appStorage.setItem("lernwerkstatt-zuletzt-route", `/projekte#${id}`); }
      else appStorage.removeItem(AUSWAHL_KEY);
    } catch { /* StorageGate displays a persistent device-storage warning. */ }
    window.history.replaceState(null, "", `${window.location.pathname}${id ? `#${id}` : ""}`);
    window.scrollTo({ top: 0 });
  }
  const projekt = BAUPROJEKTE.find(p => p.id === auswahl);
  if (projekt) return <ProjektEinheit key={projekt.id} vorlage={projekt} zurueck={() => waehlen("")}/>;
  return <div>
    <header className={styles.hero}><div><span>DEINE BAUSTELLE. DEINE ENTSCHEIDUNGEN.</span><h1>Vom Auftrag zum fertigen Plan.</h1><p>Sechs Baustellenprojekte verbinden Fachwissen, Rechnen und Zeichnen. Arbeite in sechs Schritten – mit Begleitung oder auf eigene Faust.</p><Link href="/heute">Kurze Projektaufgaben in der Tagesrunde üben →</Link></div><PracticeArtwork art="baustelle"/></header>
    <div className={styles.einstieg}><h2>Welchen Auftrag übernimmst du?</h2><p>Deine Antworten, Zeichnungen und Notizen bleiben pro Projekt auf diesem Gerät gespeichert. Du kannst jederzeit wechseln und später weitermachen.</p></div>
    <div className={styles.grid}>{BAUPROJEKTE.map((p, i) => {
      const raw = appStorage.getItem(projektKey(p.id));
      const stand = leseProjektStand(raw, p);
      return <button key={p.id} className={styles.projektKarte} onClick={() => waehlen(p.id)}><span className={styles.nummer}>{String(i + 1).padStart(2, "0")}</span><span className={styles.kartenInhalt}><small>SECHS ARBEITSSCHRITTE · ETWA {p.minuten} MINUTEN</small><strong>{p.titel}</strong><span>{p.kurz}</span><span className={styles.pfad}>{PROJEKT_SCHRITTE.slice(0, 3).join(" → ")} …</span><span className={styles.status}>{stand?.abgeschlossen ? "Bearbeitet ✓ · Noch einmal ansehen" : stand ? `Bei Schritt ${stand.schritt + 1} weiterarbeiten →` : raw ? "Gespeicherten Stand prüfen →" : "Auftrag öffnen →"}</span></span></button>;
    })}</div>
    <aside className={styles.hinweis}><strong>Üben mit klaren Grenzen</strong><p>Die Projekte verwenden ausdrücklich genannte Rechenannahmen und schematische Zeichnungen. Richtige Auswahl- und Rechenantworten werden getrennt von deiner eigenen Einschätzung einer freien Erklärung oder Zeichnung angezeigt.</p><Link href="/bildtraining">Details im Bildtraining erkennen →</Link></aside>
  </div>;
}

function ProjektEinheit({ vorlage, zurueck }: { vorlage: BauProjekt; zurueck: () => void }) {
  const [anfang] = useState(() => {
    const raw = appStorage.getItem(projektKey(vorlage.id));
    const geladen = leseProjektStand(raw, vorlage);
    return { raw, stand: geladen ?? neuerProjektStand(vorlage), unlesbar: !!raw && !geladen };
  });
  const [stand, setStand] = useState(anfang.stand);
  const aktuell = useRef(stand);
  const [unlesbar, setUnlesbar] = useState(anfang.unlesbar);
  const [fehler, setFehler] = useState("");
  const [zahlFehler, setZahlFehler] = useState<Record<string, string>>({});
  const p = stand.projekt;
  function speichern(neu: ProjektStand) {
    aktuell.current = neu;
    setStand(neu);
    try { appStorage.setItem(projektKey(p.id), JSON.stringify(neu)); setFehler(""); return true; }
    catch { setFehler("Dein Projekt konnte nicht dauerhaft gespeichert werden. Lass diese Seite geöffnet und prüfe den Speicherhinweis der App."); return false; }
  }
  useEffect(() => {
    // Persist the attempt ID before drawing/photo storage can reference it.
    if (anfang.unlesbar) return;
    try { appStorage.setItem(projektKey(vorlage.id), JSON.stringify(anfang.stand)); }
    catch { /* The global storage status reports a failed initial write. */ }
  }, [anfang, vorlage.id]);
  const hilfe = (s: ProjektStand, id: string): ProjektStand => ({ ...s, hilfen: [...new Set([...s.hilfen, id])] });
  function schrittWaehlen(i: number) {
    let neu = { ...aktuell.current, schritt: i, besucht: Math.max(aktuell.current.besucht, i) };
    if (neu.begleitet) neu = hilfe(neu, `begleitung:${i}`);
    speichern(neu);
  }
  function antwortAendern(key: string, antwort: AktivitaetAntwort) {
    const s = aktuell.current;
    const warGeprueft = s.geprueft.includes(key);
    speichern({ ...(warGeprueft ? hilfe(s, `muster:${key}`) : s), antworten: { ...s.antworten, [key]: antwort }, geprueft: s.geprueft.filter(k => k !== key), abgeschlossen: false, wiederholungen: { ...s.wiederholungen, [key]: (s.wiederholungen[key] ?? 0) + (warGeprueft ? 1 : 0) } });
  }
  function aktivitaetPruefen(key: AktivitaetsName) {
      const s = aktuell.current;
      if (!istAktivitaetVollstaendig(p.aktivitaeten[key], s.antworten[key])) return;
      speichern({ ...s, geprueft: [...new Set([...s.geprueft, key])] });
  }
  const schrittFertig = [stand.geprueft.includes("auftrag"), stand.geprueft.includes("befund"), p.rechnungen.every(r => stand.zahlenGeprueft.includes(r.id)), stand.geprueft.includes("massnahme"), stand.geprueft.includes("ablauf") && !!stand.zeichnen, !!stand.selbst && stand.musterOffen && (!!stand.erklaerung.trim() || stand.laut)];
  function neuAnfangen() {
    const alt = appStorage.getItem(projektKey(p.id));
    if (!window.confirm("Einen neuen Projektversuch anfangen? Dein bisheriger Stand einschließlich Zeichnungsverweisen wird im Gerätespeicher archiviert.")) return;
    try {
      if (alt) appStorage.setItem(`bauprojekt-archiv-${p.id}-${stand.versuchId}`, alt);
      const neu = neuerProjektStand(vorlage);
      appStorage.setItem(projektKey(p.id), JSON.stringify(neu));
      aktuell.current = neu; setStand(neu); setUnlesbar(false); setFehler(""); setZahlFehler({});
    } catch { setFehler("Der bisherige Stand konnte nicht sicher archiviert werden. Es wurde kein neuer Versuch angefangen."); }
  }
  if (unlesbar) return <section className={styles.einheit}><button className={styles.back} onClick={zurueck}>← Alle Projekte</button><h1>Dein gespeichertes Projekt bleibt erhalten.</h1><p>Dieser Stand lässt sich mit der aktuellen Version nicht sicher öffnen. Er wird nicht automatisch ersetzt. Sichere zuerst den vollständigen Lernstand; danach kannst du einen neuen Versuch beginnen.</p><Link className={styles.back} href="/fortschritt">Zur Sicherung des Lernstands →</Link>{fehler && <p role="alert">{fehler}</p>}<button className="hauptaktion" onClick={neuAnfangen}>Bisherigen Stand archivieren und neu anfangen</button></section>;
  const ergebnis = projektErgebnis(stand);
  return <div className={styles.einheit}>
    <button className={styles.back} onClick={zurueck}>← Alle Projekte</button>
    <header className={styles.kopf}><span>BAUSTELLENPROJEKT · SECHS ARBEITSSCHRITTE</span><h1>{p.titel}</h1><p>{p.lernziel}</p><div className={styles.modus} role="group" aria-label="Begleitung im Baustellenprojekt"><button aria-pressed={stand.begleitet} onClick={() => speichern({ ...hilfe(aktuell.current, `begleitung:${stand.schritt}`), begleitet: true })}>Mit Begleitung</button><button aria-pressed={!stand.begleitet} onClick={() => speichern({ ...aktuell.current, begleitet: false })}>Selbst probieren</button></div><p className={styles.klein}>Du kannst jederzeit wechseln. Deine Eingaben bleiben erhalten; bereits benutzte Hilfen bleiben in der Auswertung sichtbar.</p></header>
    {fehler && <p role="alert" className={styles.fehler}>{fehler}</p>}
    <nav className={styles.schritte} aria-label="Arbeitsschritte im Baustellenprojekt">{PROJEKT_SCHRITTE.map((titel, i) => <button key={titel} aria-current={stand.schritt === i ? "step" : undefined} onClick={() => schrittWaehlen(i)}><span>{schrittFertig[i] ? "✓" : i + 1}</span>{titel}</button>)}</nav>
    <div className={styles.auftrag}><h2>Dein Auftrag</h2><p>{p.auftrag}</p><ul>{p.angaben.map(a => <li key={a}>{a}</li>)}</ul></div>
    <section className={styles.arbeit} aria-label={PROJEKT_SCHRITTE[stand.schritt]} data-aufgabe-id={`projekt-${p.id}-${stand.schritt + 1}`} data-aufgabe-text={PROJEKT_SCHRITTE[stand.schritt]}><header className={styles.schrittTitel}><span>SCHRITT {stand.schritt + 1} VON 6</span><h2>{PROJEKT_SCHRITTE[stand.schritt]}</h2></header>
      {stand.begleitet ? <aside className={styles.begleitung}><strong>Dein nächster Gedanke</strong><p>{p.hilfen[stand.schritt]}</p></aside> : <details className={styles.begleitung} onToggle={e => { if (e.currentTarget.open && !aktuell.current.hilfen.includes(`begleitung:${stand.schritt}`)) speichern(hilfe(aktuell.current, `begleitung:${stand.schritt}`)); }}><summary>Ich brauche einen Hinweis zu diesem Schritt</summary><p>{p.hilfen[stand.schritt]}</p></details>}
      {stand.schritt === 0 && <ProjektAktivitaet name="auftrag" projekt={p} stand={stand} onAntwort={antwortAendern} onPruefen={aktivitaetPruefen}/>}
      {stand.schritt === 1 && <ProjektAktivitaet name="befund" projekt={p} stand={stand} onAntwort={antwortAendern} onPruefen={aktivitaetPruefen}/>}
      {stand.schritt === 2 && <div className={styles.rechnungen}>{p.rechnungen.map((r, i) => {
        const erlaubt = darfProjektRechnen(stand, r);
        const geprueft = stand.zahlenGeprueft.includes(r.id);
        const richtig = geprueft ? pruefeProjektZahl(r, stand.zahlen[r.id] ?? "") : null;
        const vor = p.rechnungen.find(q => q.id === r.abhaengigVon);
        return <section className={styles.rechnung} key={r.id}><h3>{i + 1}. {r.frage}</h3><p className={styles.klein}>{r.stellen ? `Runde auf ${r.stellen} Nachkommastellen. Rechne intern möglichst ohne Zwischenrundung.` : "Gib eine ganze Anzahl an."}</p>{!erlaubt && <p className={styles.abhaengig}>Prüfe zuerst „{vor?.frage}“. Falls dein Ergebnis nicht stimmt, kannst du dort einen Referenzwert für den nächsten Schritt übernehmen.</p>}{vor && stand.referenzen.includes(vor.id) && <p className={styles.referenz}>Hier verwendest du als Hilfe den Referenzwert {vor.wert.toLocaleString("de-DE")} {vor.einheit}. Deine eigene vorige Antwort bleibt erhalten.</p>}<label className={styles.zahl}>{r.frage} ({r.einheit})<div><input inputMode="decimal" value={stand.zahlen[r.id] ?? ""} disabled={!erlaubt || geprueft} aria-invalid={!!zahlFehler[r.id]} aria-describedby={zahlFehler[r.id] ? `projekt-fehler-${r.id}` : undefined} onChange={e => { speichern({ ...aktuell.current, zahlen: { ...aktuell.current.zahlen, [r.id]: e.target.value }, abgeschlossen: false }); setZahlFehler({ ...zahlFehler, [r.id]: "" }); }}/><span>{r.einheit}</span></div></label>{zahlFehler[r.id] && <p id={`projekt-fehler-${r.id}`} role="alert" className={styles.fehler}>{zahlFehler[r.id]}</p>}<details className={styles.rechenhilfe} onToggle={e => { if (e.currentTarget.open && !aktuell.current.hilfen.includes(`rechentipp:${r.id}`)) speichern(hilfe(aktuell.current, `rechentipp:${r.id}`)); }}><summary>Rechenhinweis öffnen</summary><p>{r.tipp}</p></details>{!geprueft ? <button className="hauptaktion" disabled={!erlaubt} onClick={() => {
          if (pruefeProjektZahl(r, aktuell.current.zahlen[r.id] ?? "") === null) { setZahlFehler({ ...zahlFehler, [r.id]: "Gib eine gültige Zahl ein, zum Beispiel 12,5. Die Einheit steht neben dem Feld." }); return; }
          speichern({ ...aktuell.current, zahlenGeprueft: [...new Set([...aktuell.current.zahlenGeprueft, r.id])] });
        }}>Rechenschritt prüfen</button> : <div className={styles.rechenErgebnis} role="status"><strong>{richtig ? "Richtig gerechnet." : "Deine Antwort bleibt sichtbar. Vergleiche den Rechenweg."}</strong><p>{r.weg}</p>{!richtig && <button className={styles.textKnopf} onClick={() => speichern(hilfe({ ...aktuell.current, referenzen: [...new Set([...aktuell.current.referenzen, r.id])] }, `referenz:${r.id}`))}>{stand.referenzen.includes(r.id) ? `Referenzwert ${r.wert.toLocaleString("de-DE")} ${r.einheit} für Folgeschritte übernommen ✓` : `Mit Referenzwert ${r.wert.toLocaleString("de-DE")} ${r.einheit} weiterarbeiten`}</button>}<button className={styles.textKnopf} onClick={() => speichern({ ...hilfe(aktuell.current, `rechenweg:${r.id}`), zahlenGeprueft: aktuell.current.zahlenGeprueft.filter(k => k !== r.id), abgeschlossen: false })}>Diesen Rechenschritt erneut bearbeiten</button></div>}</section>;
      })}</div>}
      {stand.schritt === 3 && <ProjektAktivitaet name="massnahme" projekt={p} stand={stand} onAntwort={antwortAendern} onPruefen={aktivitaetPruefen}/>}
      {stand.schritt === 4 && <div className={styles.detail}><ProjektAktivitaet name="ablauf" projekt={p} stand={stand} onAntwort={antwortAendern} onPruefen={aktivitaetPruefen}/><section className="werkstatt-karte"><h3>Dein Detail für den Kollegen</h3><DrawCard key={stand.versuchId} aufgabe={{ ...p.zeichnung, id: `${p.zeichnung.id}:${stand.versuchId}` }} anfangsBewertung={stand.zeichnen} onErgebnis={zeichnen => speichern({ ...aktuell.current, zeichnen, abgeschlossen: false })}/></section></div>}
      {stand.schritt === 5 && <div className={styles.erklaeren}><h3>{p.erklaerFrage}</h3><label>Meine Erklärung<textarea value={stand.erklaerung} maxLength={12000} onChange={e => speichern({ ...aktuell.current, erklaerung: e.target.value, abgeschlossen: false })}/></label><label className={styles.checkbox}><input type="checkbox" checked={stand.laut} onChange={e => speichern({ ...aktuell.current, laut: e.target.checked, abgeschlossen: false })}/>Ich habe meine Erklärung laut gegeben.</label><h3>Darauf achtest du beim Vergleichen</h3><ul>{p.kriterien.map(k => <li key={k}>{k}</li>)}</ul>{stand.musterOffen ? <aside className={styles.muster}><strong>Ein möglicher Erklärweg</strong><p>{p.muster}</p></aside> : <button className="hauptaktion" disabled={!stand.erklaerung.trim() && !stand.laut} onClick={() => speichern(hilfe({ ...aktuell.current, musterOffen: true }, "erklaermuster"))}>Meine Erklärung mit dem Muster vergleichen</button>}{stand.musterOffen && <fieldset className={styles.selbst}><legend>Meine Selbsteinschätzung anhand der Kriterien</legend>{(["richtig", "teilweise", "falsch"] as const).map(b => <button key={b} aria-pressed={stand.selbst === b} onClick={() => speichern({ ...aktuell.current, selbst: b, abgeschlossen: false })}>{urteil[b]}</button>)}</fieldset>}</div>}
    </section>
    <label className={styles.notiz}>Meine Projektnotizen<textarea value={stand.notiz} maxLength={12000} onChange={e => speichern({ ...aktuell.current, notiz: e.target.value })}/></label>
    <footer className={styles.weiter}><button className={styles.back} disabled={stand.schritt === 0} onClick={() => schrittWaehlen(stand.schritt - 1)}>← Vorheriger Schritt</button>{stand.schritt < 5 ? <button className="hauptaktion" onClick={() => schrittWaehlen(stand.schritt + 1)}>{schrittFertig[stand.schritt] ? "Nächster Arbeitsschritt →" : "Schritt später ergänzen →"}</button> : <button className="hauptaktion" disabled={!projektVollstaendig(stand)} onClick={() => speichern({ ...aktuell.current, abgeschlossen: true })}>{stand.abgeschlossen ? "Als bearbeitet gespeichert ✓" : "Projekt als bearbeitet speichern"}</button>}</footer>
    {stand.schritt === 5 && <section className={styles.auswertung}><h2>Dein Projekt im Überblick</h2><p><strong>{ergebnis.richtig} von {ergebnis.gesamt}</strong> automatisch prüfbaren Aufgaben richtig. Noch nicht bearbeitete Aufgaben zählen nicht als richtiger Erfolg.</p><p>Freie Zeichnung: <strong>{stand.zeichnen ? urteil[stand.zeichnen] : "noch offen"}</strong> · Eigene Erklärung: <strong>{stand.selbst ? urteil[stand.selbst] : "noch offen"}</strong>. Beides ist deine Selbsteinschätzung und gehört nicht zur automatischen Punktzahl.</p><p>{stand.hilfen.length ? `${stand.hilfen.length} verschiedene Hilfen oder Vergleichsmuster wurden genutzt. Diese Unterstützung bleibt auch nach dem Umschalten auf „Selbst probieren“ sichtbar.` : "Ohne geöffnete Hilfen bearbeitet."}</p>{!projektVollstaendig(stand) && <p>Zum Abschließen: alle Auswahl- und Rechenaufgaben prüfen, Ablauf ordnen, Zeichnung und eigene Erklärung einschätzen.</p>}{stand.abgeschlossen && <strong>Projekt bearbeitet. Spätere kurze Transferaufgaben helfen dir beim Wiederholen.</strong>}<div className={styles.links}><Link href="/heute">In der Tagesrunde wiederholen →</Link><Link href={`/bildtraining#bild-${p.id}-bauteile`}>Passendes Bildtraining →</Link></div></section>}
    <button className={styles.neuerVersuch} onClick={neuAnfangen}>Neuen Projektversuch beginnen</button>
  </div>;
}
