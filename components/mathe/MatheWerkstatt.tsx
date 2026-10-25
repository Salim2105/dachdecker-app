"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MATHE_EINHEITEN, pruefeMathe, type MatheEinheit, type MatheErgebnis } from "@/lib/matheGrundlagen";
import { appStorage } from "@/lib/lernSpeicher";
import { speichereLernsignal } from "@/lib/lerndiagnose";
import { PracticeArtwork } from "@/components/practice/PracticeArtwork";
import { LernIllustration } from "@/components/design/LernIllustration";
import { GlossarText, BegriffsListe, oeffneGlossarBegriff } from "@/components/GlossarText";
import { MatheSkizze } from "./MatheSkizze";
import { AUFBAU_EINHEITEN, leseAufbauStand } from "@/lib/matheAufbau";
import { recordReviewResult, validReviewResult, type ReviewResult } from "@/lib/review";
import { neueMatheRueckmeldung } from "@/lib/matheBewertung";
import { AufbauWerkstatt } from "./AufbauWerkstatt";
import styles from "./Mathe.module.css";
import aufbauStyles from "./Aufbau.module.css";

interface Antwort { wert: string; einheit: string; hilfen: string[]; ergebnis?: MatheErgebnis; reviewResult?: ReviewResult }
interface Stand { version: 1; index: number; notiz: string; antworten: Record<string, Antwort>; abgeschlossen: boolean; reviewPending?: ReviewResult[] }
export const matheKey = (id: string) => `fachmathe-${id}-v1`;
export function leseMatheStand(id: string): Stand {
  const e = MATHE_EINHEITEN.find((m) => m.id === id);
  const leer: Stand = { version: 1, index: 0, notiz: "", antworten: {}, abgeschlossen: false };
  if (!e) return leer;
  try {
    const s = JSON.parse(appStorage.getItem(matheKey(id)) || "null");
    if (!s || s.version !== 1 || !Number.isInteger(s.index) || s.index < 0 || s.index >= e.fragen.length || typeof s.notiz !== "string" || typeof s.abgeschlossen !== "boolean" || !s.antworten || typeof s.antworten !== "object" || Array.isArray(s.antworten)) return leer;
    if (s.reviewPending !== undefined && (!Array.isArray(s.reviewPending) || !s.reviewPending.every((r:unknown)=>validReviewResult(r)&&r.ref.quelle==="mathe"&&e.fragen.some(f=>f.id===r.ref.id)))) return leer;
    for (const [key, v] of Object.entries(s.antworten) as [string, Antwort][]) {
      if (!e.fragen.some((f) => f.id === key) || !v || typeof v.wert !== "string" || typeof v.einheit !== "string" || !Array.isArray(v.hilfen) || !v.hilfen.every((h) => typeof h === "string")) return leer;
      if (v.ergebnis) { const f = e.fragen.find((f) => f.id === key)!; const geprueft = pruefeMathe(f, v.wert, v.einheit); if (!geprueft) return leer; v.ergebnis = geprueft; }
      if (v.reviewResult && (!validReviewResult(v.reviewResult) || v.reviewResult.ref.quelle !== "mathe" || v.reviewResult.ref.id !== key || !v.ergebnis || v.reviewResult.bewertung !== (v.ergebnis.richtig ? "richtig" : "falsch"))) return leer;
    }
    s.abgeschlossen = s.abgeschlossen && e.fragen.every((f) => !!s.antworten[f.id]?.ergebnis);
    return s;
  } catch { return leer; }
}
export function MatheWerkstatt() {
  const [auswahl, setAuswahl] = useState(() => {
    const id = typeof window !== "undefined" ? window.location.hash.slice(1) || appStorage.getItem("fachmathe-auswahl") : "";
    return [...MATHE_EINHEITEN, ...AUFBAU_EINHEITEN].some((e) => e.id === id) ? id : "";
  });
  useEffect(()=>{
    const wechseln=()=>{const id=window.location.hash.slice(1);setAuswahl([...MATHE_EINHEITEN,...AUFBAU_EINHEITEN].some(e=>e.id===id)?id:"");};
    window.addEventListener("hashchange",wechseln);window.addEventListener("popstate",wechseln);
    return()=>{window.removeEventListener("hashchange",wechseln);window.removeEventListener("popstate",wechseln);};
  },[]);
  function waehle(id: string) { setAuswahl(id); appStorage.setItem("fachmathe-auswahl", id); if(id)appStorage.setItem("lernwerkstatt-zuletzt-route", `/grundlagen/mathe#${id}`); window.history.replaceState(null, "", `${window.location.pathname}${id ? `#${id}` : ""}`); window.scrollTo({top:0}); }
  const einheit = MATHE_EINHEITEN.find((e) => e.id === auswahl);
  const aufbau = AUFBAU_EINHEITEN.find((e) => e.id === auswahl);
  if (aufbau) return <AufbauWerkstatt key={aufbau.id} einheit={aufbau} zurueck={() => waehle("")} weiter={() => waehle(AUFBAU_EINHEITEN[AUFBAU_EINHEITEN.indexOf(aufbau)+1]?.id ?? "")} />;
  if (einheit) return <MatheLernschritt key={einheit.id} einheit={einheit} zurueck={() => waehle("")} weiter={() => waehle(MATHE_EINHEITEN[MATHE_EINHEITEN.indexOf(einheit)+1]?.id ?? AUFBAU_EINHEITEN[0].id)} />;
  return <div>
    <section className={styles.hero}><div><span>DEINE GRUNDLAGEN FÜRS HANDWERK</span><h1>Fachmathe, die du verstehst.</h1><p>Von der Einheit bis zur Dachschräge. Du siehst, was gegeben ist, welche Formel passt und wie dein Rechenweg entsteht.</p><Link href="/lernhilfe">Mit einem kurzen Standortcheck starten →</Link></div><PracticeArtwork art="rechnen" /></section>
    <div className={styles.intro}><h2>Kleine Schritte, sichere Grundlagen</h2><p>Beginne dort, wo du Hilfe brauchst. Alle Einheiten sind offen, ohne Zeitdruck.</p></div>
    <div className={styles.grid}>{MATHE_EINHEITEN.map((e,index) => <button key={e.id} className={styles.card} onClick={() => waehle(e.id)}><span className={styles.nummer}>{String(index+1).padStart(2,"0")}</span><span><strong>{e.titel}</strong><small>{e.minuten} Minuten · {e.fragen.length} Rechenaufgaben</small><span>{e.ziel}</span></span><span aria-label={leseMatheStand(e.id).abgeschlossen ? "Bearbeitet" : "Öffnen"}>{leseMatheStand(e.id).abgeschlossen ? "✓" : "→"}</span></button>)}</div>
    <section className={aufbauStyles.aufbauIntro}><h2>Aufbau: aus Zahlen wird ein Rechenweg</h2><p>Wenn die Grundlagen sitzen, verbindest du mehrere Schritte: Dachgeometrie, Deckmaße, Wärme und Mengenplanung. Du bekommst Teilpunkte für jeden passenden Schritt und jederzeit Hilfe.</p></section>
    <div className={styles.grid}>{AUFBAU_EINHEITEN.map((e,index) => <button key={e.id} className={styles.card} onClick={() => waehle(e.id)}><span className={`${styles.nummer} ${aufbauStyles.aufbauNummer}`}>{String(index+1).padStart(2,"0")}</span><span><strong>{e.titel}</strong><small>Aufbau · 10–15 Minuten · 3 Rechenaufgaben</small><span>{e.ziel}</span></span><span aria-label={leseAufbauStand(e).abgeschlossen ? "Bearbeitet" : "Öffnen"}>{leseAufbauStand(e).abgeschlossen ? "✓" : "→"}</span></button>)}</div>
  </div>;
}
function MatheLernschritt({ einheit: e, zurueck, weiter }: { einheit: MatheEinheit; zurueck: () => void; weiter: () => void }) {
  const [stand, setStand] = useState(() => leseMatheStand(e.id));
  const ref = useRef(stand);
  const [fehler,setFehler] = useState("");
  useEffect(()=>{try{appStorage.setItem("fachmathe-auswahl",e.id);appStorage.setItem("lernwerkstatt-zuletzt-route",`/grundlagen/mathe#${e.id}`);}catch{/* Der gemeinsame Speicherhinweis bleibt sichtbar. */}},[e.id]);
  useEffect(()=>{try{for(const a of Object.values(ref.current.antworten))if(a.reviewResult)recordReviewResult(a.reviewResult);for(const r of ref.current.reviewPending??[])recordReviewResult(r);}catch{queueMicrotask(()=>setFehler("Deine Antwort ist gesichert. Der Wiederholungstermin konnte noch nicht gespeichert werden."));}},[]);
  const f = e.fragen[stand.index];
  const antwort: Antwort = stand.antworten[f.id] ?? { wert:"", einheit:"", hilfen:[] };
  function speichern(neu: Stand):boolean { ref.current=neu;setStand(neu);try{appStorage.setItem(matheKey(e.id),JSON.stringify(neu));return true;}catch{setFehler("Dein Rechenentwurf konnte nicht dauerhaft gespeichert werden. Bitte den Speicherhinweis prüfen.");return false;} }
  function aendere(patch:Partial<Antwort>) {const aktuell=ref.current;const vorher=aktuell.antworten[f.id]??{wert:"",einheit:"",hilfen:[]};speichern({...aktuell,antworten:{...aktuell.antworten,[f.id]:{...vorher,...patch}}});}
  function hilfe(id:string) { const bisher=ref.current.antworten[f.id]?.hilfen??[];if(!bisher.includes(id))aendere({hilfen:[...bisher,id]}); }
  function begriff(id:string){if(!ref.current.antworten[f.id]?.ergebnis)hilfe(`begriff:${id}`);oeffneGlossarBegriff(id);}
  function pruefen(){
    const s=ref.current,aktuell=s.antworten[f.id]??{wert:"",einheit:"",hilfen:[]};
    if(aktuell.ergebnis)return;
    const r=pruefeMathe(f,aktuell.wert,aktuell.einheit);
    if(!r){setFehler("Trage eine gültige Zahl ohne Einheit ein und wähle die Einheit daneben.");return;}
    const result=neueMatheRueckmeldung(f.id,e.version,e.id,r.richtig?"richtig":"falsch",aktuell.hilfen);
    setFehler("");
    const gespeichert=speichern({...s,antworten:{...s.antworten,[f.id]:{...aktuell,ergebnis:r,reviewResult:result}},reviewPending:[...(s.reviewPending??[]),result]});
    if(!gespeichert)return;
    try{recordReviewResult(result);}catch{setFehler("Deine Antwort ist gesichert. Der Wiederholungstermin konnte noch nicht gespeichert werden; beim erneuten Öffnen versuchen wir es wieder.");}
    speichereLernsignal({quelle:"mathe",aufgabeId:f.id,lernzielId:e.id,richtig:r.richtig,kategorie:r.kategorie,hilfen:aktuell.hilfen,route:`/grundlagen/mathe#${e.id}`,thema:e.titel});
  }
  const fertig = e.fragen.every((q)=>!!stand.antworten[q.id]?.ergebnis);
  return <div className={styles.einheit}>
    <button className={styles.back} onClick={zurueck}>← Alle Mathe-Grundlagen</button>
    <header className={styles.unitHead}><span>FACHMATHE · {e.minuten} MINUTEN</span><h1>{e.titel}</h1><p>{e.ziel}</p></header>
    {stand.abgeschlossen ? <section className={styles.success}><LernIllustration motiv="erfolg"/><h2>Ein Rechenweg mehr im Werkzeugkoffer.</h2><p>{e.fragen.filter((q)=>stand.antworten[q.id]?.ergebnis?.richtig).length} von {e.fragen.length} zuletzt geprüften Antworten passen. Genutzte Hilfen bleiben in deinem Lernstand erkennbar.</p><button className="hauptaktion" onClick={weiter}>Nächste Mathe-Einheit →</button><Link href="/lernhilfe">Deine nächsten Übungen ansehen</Link><button className={styles.back} onClick={()=>speichern({...stand,abgeschlossen:false})}>Rechenwege nochmals ansehen</button></section> : <>
    <section className={styles.text}><h2>Erst verstehen</h2><p><GlossarText text={e.text} onBegriff={begriff}/></p><MatheSkizze id={e.id}/><strong><GlossarText text={e.merksatz} onBegriff={begriff}/></strong><div><span>BEISPIEL</span><p><GlossarText text={e.beispiel} onBegriff={begriff}/></p></div></section>
    <BegriffsListe texte={[e.text,e.merksatz,e.beispiel,f.frage]} onBegriff={begriff}/>
    <section className={styles.task}><div className={styles.taskHead}><span>JETZT DU</span><span>Aufgabe {stand.index+1} von {e.fragen.length}</span></div><h2><GlossarText text={f.frage} onBegriff={begriff}/></h2><p className={styles.gesucht}><strong>Gesucht:</strong> {f.gesucht}</p>
      <div className={styles.antwort}><label>Dein Ergebnis<input type="text" inputMode="decimal" value={antwort.wert} disabled={!!antwort.ergebnis} onChange={(ev)=>aendere({wert:ev.target.value})} onKeyDown={(ev)=>{if(ev.key==="Enter"&&!antwort.ergebnis)pruefen();}} /></label><label>Einheit<select aria-label="Einheit" value={antwort.einheit} disabled={!!antwort.ergebnis} onChange={(ev)=>aendere({einheit:ev.target.value})}><option value="">Bitte wählen</option>{f.einheiten.map((u)=><option key={u}>{u}</option>)}</select></label></div>
      {!antwort.ergebnis && <button className="hauptaktion" onClick={pruefen}>Rechenweg prüfen</button>}
      {fehler&&<p role="alert" className={styles.fehler}>{fehler}</p>}
      <div className={styles.hilfen} key={f.id}>{([["gegeben","1. Was ist gegeben?"],["formel","2. Welche Formel passt?"],["einsetzen","3. Werte einsetzen"]] as const).map(([id,label])=><details key={id} onToggle={(ev)=>{if(ev.currentTarget.open)hilfe(id);}}><summary>{label}</summary>{id==="gegeben"?<ul>{f.gegeben.map((g)=><li key={g}>{g}</li>)}</ul>:<p>{id==="formel"?f.formel:f.einsetzen}</p>}</details>)}</div>
      {antwort.ergebnis&&<div className={styles.feedback} role="status"><strong>{antwort.ergebnis.richtig?"Rechenwert und Einheit passen.":"Schau diesen Schritt noch einmal an."}</strong><p>{antwort.ergebnis.hinweis}</p><p><strong>Rechenweg:</strong> {f.formel} → {f.einsetzen} → {f.wert.toLocaleString("de-DE")} {f.einheit}</p><p>{f.erklaerung}</p><span>{antwort.hilfen.length?"Mit Rechenhilfe bearbeitet":"Vor dem Prüfen ohne aufgedeckte Rechenhilfe bearbeitet"}</span><div><button className={styles.back} onClick={()=>aendere({ergebnis:undefined,reviewResult:undefined,hilfen:[...new Set([...antwort.hilfen,"erklaerung"]) ]})}>Noch einmal rechnen</button>{stand.index<e.fragen.length-1&&<button className="hauptaktion" onClick={()=>speichern({...stand,index:stand.index+1})}>Nächste Rechenaufgabe</button>}</div></div>}
    </section>
    <label className={styles.notiz}>Dein Merksatz in eigenen Worten<textarea value={stand.notiz} onChange={(ev)=>speichern({...ref.current,notiz:ev.target.value})}/></label>
    <div className={styles.footer}><button className={styles.back} disabled={stand.index===0} onClick={()=>speichern({...stand,index:stand.index-1})}>Vorherige Rechenaufgabe</button>{fertig&&<button className="hauptaktion" onClick={()=>speichern({...stand,abgeschlossen:true})}>Mathe-Einheit abschließen</button>}<Link href={e.anschluss}>Auf eine Fachaufgabe übertragen →</Link></div>
    </>}
  </div>;
}
