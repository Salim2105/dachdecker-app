"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { bereichsAuswahl } from "@/lib/bereichsAuswahl";
import { MATHE_EINHEITEN, pruefeMathe, type MatheEinheit } from "@/lib/matheGrundlagen";
import { appStorage } from "@/lib/lernSpeicher";
import { speichereLernsignal } from "@/lib/lerndiagnose";
import { KatalogKopf, KatalogSuche, katalogPasst, useKatalogFokus } from "@/components/katalog/KatalogKopf";
import { LernIllustration } from "@/components/design/LernIllustration";
import { GlossarText, BegriffsListe, oeffneGlossarBegriff } from "@/components/GlossarText";
import { MatheSkizze } from "./MatheSkizze";
import { AUFBAU_EINHEITEN, leseAufbauStand } from "@/lib/matheAufbau";
import { recordReviewResult } from "@/lib/review";
import { leseMatheStand, matheKey, type MatheStand as Stand, type MatheAntwort as Antwort } from "@/lib/matheStand";
import { neueMatheRueckmeldung } from "@/lib/matheBewertung";
import { PruefungsMathe } from "./PruefungsMathe";
import { AufbauWerkstatt } from "./AufbauWerkstatt";
import styles from "./Mathe.module.css";

export { leseMatheStand, matheKey } from "@/lib/matheStand";
const matheEinheitsIds=[...MATHE_EINHEITEN,...AUFBAU_EINHEITEN].map(e=>e.id);
function pruefungsModusAusAdresse(){return typeof window!=="undefined"&&new URLSearchParams(window.location.search).get("ansicht")==="pruefungsaufgaben"&&!matheEinheitsIds.includes(window.location.hash.slice(1));}
export function MatheWerkstatt() {
  const [pruefungsModus,setPruefungsModus]=useState(pruefungsModusAusAdresse);
  const [gruppe, setGruppe] = useState(() => AUFBAU_EINHEITEN.some(e => e.id === (typeof window === "undefined" ? null : window.location.hash.slice(1) || appStorage.getItem("fachmathe-auswahl"))) ? "aufbau" : "grundlagen");
  const [suche, setSuche] = useState("");
  const [auswahl, setAuswahl] = useState(() => pruefungsModusAusAdresse()?"":bereichsAuswahl([...MATHE_EINHEITEN,...AUFBAU_EINHEITEN].map(e=>e.id),appStorage.getItem("fachmathe-auswahl")));
  useEffect(()=>{
    const wechseln=()=>{const id=window.location.hash.slice(1);setAuswahl(matheEinheitsIds.includes(id)?id:"");if(id)setGruppe(AUFBAU_EINHEITEN.some(e=>e.id===id)?"aufbau":"grundlagen");setPruefungsModus(pruefungsModusAusAdresse());};
    window.addEventListener("hashchange",wechseln);window.addEventListener("popstate",wechseln);
    return()=>{window.removeEventListener("hashchange",wechseln);window.removeEventListener("popstate",wechseln);};
  },[]);
  function waehle(id: string) { setPruefungsModus(false); setAuswahl(id); if(id){setGruppe(AUFBAU_EINHEITEN.some(e=>e.id===id)?"aufbau":"grundlagen");appStorage.setItem("fachmathe-auswahl", id);appStorage.setItem("lernwerkstatt-zuletzt-route", `/grundlagen/mathe#${id}`);} window.history.pushState(null, "", `${window.location.pathname}${id ? `#${id}` : "?ansicht=uebersicht"}`); window.scrollTo({top:0}); }
  function pruefungsAnsicht(offen:boolean){setPruefungsModus(offen);setAuswahl("");window.history.pushState(null,"",`${window.location.pathname}?ansicht=${offen?"pruefungsaufgaben":"uebersicht"}`);window.scrollTo({top:0});}
  useKatalogFokus(`${auswahl}:${pruefungsModus}`);
  const einheit = MATHE_EINHEITEN.find((e) => e.id === auswahl);
  const aufbau = AUFBAU_EINHEITEN.find((e) => e.id === auswahl);
  if (aufbau) return <AufbauWerkstatt key={aufbau.id} einheit={aufbau} zurueck={() => waehle("")} weiter={() => waehle(AUFBAU_EINHEITEN[AUFBAU_EINHEITEN.indexOf(aufbau)+1]?.id ?? "")} />;
  if (einheit) return <MatheLernschritt key={einheit.id} einheit={einheit} zurueck={() => waehle("")} weiter={() => waehle(MATHE_EINHEITEN[MATHE_EINHEITEN.indexOf(einheit)+1]?.id ?? AUFBAU_EINHEITEN[0].id)} />;
  if(pruefungsModus)return <PruefungsMathe zurueck={()=>pruefungsAnsicht(false)}/>;
  const grundlagen = MATHE_EINHEITEN.filter(e => katalogPasst(suche, e.titel, e.ziel));
  const aufbauEinheiten = AUFBAU_EINHEITEN.filter(e => katalogPasst(suche, e.titel, e.ziel));
  return <div>
    <KatalogKopf bereich="FACHMATHE" titel="Was möchtest du rechnen?">Wähle Grundlagen, verbinde mehrere Rechenschritte oder löse eine Aufgabe selbstständig.</KatalogKopf>
    <div className={styles.gruppen} role="group" aria-label="Mathe-Bereich auswählen">{[["grundlagen", "Grundlagen"], ["aufbau", "Aufbau"], ["selbststaendig", "Selbstständig rechnen"]].map(([id, titel]) => <button key={id} aria-pressed={gruppe === id} onClick={() => setGruppe(id)}>{titel}</button>)}</div>
    {gruppe !== "selbststaendig" && <KatalogSuche label="Mathe-Einheiten suchen" wert={suche} onChange={setSuche}/>}
    {gruppe === "grundlagen" && <section aria-labelledby="mathe-grundlagen"><div className={styles.intro}><h2 id="mathe-grundlagen">Grundlagen</h2><p>Einheiten, Formeln und kurze Rechenwege Schritt für Schritt.</p></div>
      <div className={styles.grid}>{grundlagen.map(e => <button key={e.id} className={styles.card} onClick={() => waehle(e.id)}><span className={styles.nummer}>{String(MATHE_EINHEITEN.indexOf(e)+1).padStart(2,"0")}</span><span><strong>{e.titel}</strong><small>{e.minuten} Minuten · {e.fragen.length} Rechenaufgaben</small><span>{e.ziel}</span></span><span aria-label={leseMatheStand(e.id).abgeschlossen ? "Bearbeitet" : "Öffnen"}>{leseMatheStand(e.id).abgeschlossen ? "✓" : "→"}</span></button>)}</div>{grundlagen.length === 0 && <p role="status">Keine Grundlagen-Einheit passt zu deiner Suche.</p>}
    </section>}
    {gruppe === "aufbau" && <section aria-labelledby="mathe-aufbau"><div className={styles.intro}><h2 id="mathe-aufbau">Aufbau</h2><p>Dachgeometrie, Deckmaße, Wärme und Mengen in mehreren Schritten berechnen.</p></div>
      <div className={styles.grid}>{aufbauEinheiten.map(e => <button key={e.id} className={styles.card} onClick={() => waehle(e.id)}><span className={styles.nummer}>{String(AUFBAU_EINHEITEN.indexOf(e)+1).padStart(2,"0")}</span><span><strong>{e.titel}</strong><small>10–15 Minuten · 3 Rechenaufgaben</small><span>{e.ziel}</span></span><span aria-label={leseAufbauStand(e).abgeschlossen ? "Bearbeitet" : "Öffnen"}>{leseAufbauStand(e).abgeschlossen ? "✓" : "→"}</span></button>)}</div>{aufbauEinheiten.length === 0 && <p role="status">Keine Aufbau-Einheit passt zu deiner Suche.</p>}
    </section>}
    {gruppe === "selbststaendig" && <section className={styles.selbststaendig}><h2>Selbstständig rechnen</h2><p>30 Aufgaben und sechs Transferaufträge. Vergleiche deinen Rechenweg nach der Abgabe.</p><button className="hauptaktion" onClick={()=>pruefungsAnsicht(true)}>Selbstständig rechnen öffnen →</button></section>}
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
