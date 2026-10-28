"use client";
import { useEffect, useRef, useState } from "react";
import { AUFBAU_EINHEITEN } from "@/lib/matheAufbau";
import { FALL_THEMEN } from "@/lib/pruefungsFaelle";
import { appStorage } from "@/lib/lernSpeicher";
import { useBearbeitungsSperre } from "@/components/useBearbeitungsSperre";
import { pruefungsTransferRef } from "@/lib/pruefungsTransfer";
import { recordReviewResult } from "@/lib/review";
import { recordMatheNachweis, recordTransferNachweis } from "@/lib/kompetenzNachweise";
import { registrierePruefungsHilfen } from "@/lib/pruefungsHilfen";
import { leseDezimalzahl } from "@/lib/zahlen";
import { abgegebenerPruefungsMatheVersuch, ladePruefungsMatheStand, neuerPruefungsMatheVersuch, PRUEFUNGS_MATHE_AUFGABEN, pruefungsMatheSchritte, speicherePruefungsMatheStand, type PruefungsMatheStand, type PruefungsMatheVersuch } from "@/lib/pruefungsMathe";
import styles from "./Mathe.module.css";

function verarbeiteNachweis(v: PruefungsMatheVersuch) {
 if(v.abgegebenAm===null||!v.ergebnis)return;
 const data={versuchId:v.id,aufgabeId:v.aufgabenId,familie:v.familie,thema:v.aufgabe.typ==="aufbau"?v.aufgabe.aufgabe.titel:v.aufgabe.titel,variante:v.aufgabe.typ==="aufbau"?v.aufgabe.aufgabe.variante:v.aufgabe.variante,am:v.abgegebenAm,richtig:v.ergebnis.richtig,hilfen:v.hilfen,nachErklaerung:v.nachErklaerung,erstversuch:true};
 if(v.aufgabe.typ==="transfer") {
  recordTransferNachweis(data);
  recordReviewResult({ref:pruefungsTransferRef(v.aufgabe.fallId),versuchId:v.id,bewertung:v.ergebnis.richtig?"richtig":v.ergebnis.erreicht?"teilweise":"falsch",am:v.abgegebenAm,hilfen:v.hilfen,nachErklaerung:v.nachErklaerung});
 }
 else {
  recordMatheNachweis(data);
  recordReviewResult({ref:{quelle:"mathe",id:v.aufgabenId,version:1,lernzielIds:[v.familie]},versuchId:v.id,bewertung:v.ergebnis.richtig?"richtig":v.ergebnis.erreicht?"teilweise":"falsch",am:v.abgegebenAm,hilfen:v.hilfen,nachErklaerung:v.nachErklaerung});
 }
}
/** No worked example, formula or solved sketch precedes an independent answer. */
export function PruefungsMathe({zurueck}:{zurueck?:()=>void}) {
 const sperre=useBearbeitungsSperre("dachdecker-pruefungsmathe-bearbeitung");
 const darfBearbeiten=sperre.status==="frei"||sperre.status==="nicht-verfuegbar";
 const [geladen]=useState(()=>{
  const s=ladePruefungsMatheStand(),query=typeof window!=="undefined"?new URLSearchParams(window.location.search):new URLSearchParams();
  const katalog=query.get("ansicht")==="pruefungsaufgaben"&&query.get("fortsetzen")!=="1";
  return {stand:katalog&&s?{...s,aktiv:null}:s,letzteAktive:s?.aktiv??null};
 });
 const [stand,setStand]=useState(geladen.stand);
 const aktuell=useRef(stand);
 const [fehler,setFehler]=useState("");
 const v=stand?.versuche.find(v=>v.id===stand.aktiv), scopeId=v?.id??"", offen=v?.abgegebenAm===null;
 function speichern(neu:PruefungsMatheStand) {
  if(!darfBearbeiten)return false;
  aktuell.current=neu;setStand(neu);
  try {speicherePruefungsMatheStand(neu);setFehler("");return true;}
  catch {setFehler("Dein Matheentwurf konnte noch nicht dauerhaft gespeichert werden. Bitte den Speicherhinweis prüfen.");return false;}
 }
 function aendern(patch:Partial<PruefungsMatheVersuch>) {
  const s=aktuell.current;if(!s||!s.aktiv)return;
  speichern({...s,versuche:s.versuche.map(x=>x.id===s.aktiv?{...x,...patch}:x)});
 }
 useEffect(()=>{
  if(!darfBearbeiten)return;
  try {for(const v of aktuell.current?.versuche??[])verarbeiteNachweis(v);}
  catch {queueMicrotask(()=>setFehler("Deine Antwort bleibt erhalten. Der Lernnachweis konnte noch nicht gespeichert werden; beim erneuten Öffnen versuchen wir es wieder."));}
 },[darfBearbeiten]);
 useEffect(()=>{
  if(!scopeId||!darfBearbeiten)return;
  try {
   window.history.replaceState(null,"","/grundlagen/mathe?ansicht=pruefungsaufgaben&fortsetzen=1");
   appStorage.setItem("lernwerkstatt-zuletzt-route","/grundlagen/mathe?ansicht=pruefungsaufgaben&fortsetzen=1");
  }
  catch {queueMicrotask(()=>setFehler("Dein Bearbeitungspunkt konnte noch nicht gespeichert werden. Bitte den Speicherhinweis prüfen."));}
 },[scopeId,darfBearbeiten]);
 useEffect(()=>{
  if(!scopeId||!offen||!darfBearbeiten)return;
  const weg=registrierePruefungsHilfen(scopeId);
  const hilfe=(e:Event)=>{
   const detail=(e as CustomEvent<{art?:string;versuchId?:string}>).detail,s=aktuell.current;
   const a=s?.versuche.find(x=>x.id===s.aktiv);
   if(!detail||!a||a.abgegebenAm!==null||detail.versuchId!==a.id||!detail.art)return;
   const key=detail.art==="taschenrechner"?"werkzeuge":"hilfen";
   if(a[key].includes(detail.art))return;
   const neu={...s!,versuche:s!.versuche.map(x=>x.id===a.id?{...x,[key]:[...x[key],detail.art]}:x)};
   aktuell.current=neu;setStand(neu);
   try {speicherePruefungsMatheStand(neu);}catch {setFehler("Der Hilfenaufruf ist noch nicht dauerhaft gespeichert. Bitte den Speicherhinweis prüfen.");}
  };
  window.addEventListener("dachdecker:pruefung-hilfe",hilfe);
  return()=>{weg();window.removeEventListener("dachdecker:pruefung-hilfe",hilfe);};
 },[scopeId,offen,darfBearbeiten]);
 function starten(id:string,forceNeu=false) {
  const s=aktuell.current;if(!s)return;
  const unfertig=[...s.versuche].reverse().find(v=>v.aufgabenId===id&&v.abgegebenAm===null);
  if(unfertig&&!forceNeu){speichern({...s,aktiv:unfertig.id});return;}
  const letzte=s.versuche.filter(v=>v.aufgabenId===id).at(-1),variante=letzte?(letzte.aufgabe.typ==="aufbau"?letzte.aufgabe.aufgabe.variante:letzte.aufgabe.variante)+1:0;
  const neu=neuerPruefungsMatheVersuch(id,variante);
  neu.nachErklaerung=s.versuche.some(v=>v.familie===neu.familie&&v.abgegebenAm!==null&&neu.gestartetAm-v.abgegebenAm>=0&&neu.gestartetAm-v.abgegebenAm<86400000);
  speichern({...s,aktiv:neu.id,versuche:[...s.versuche,neu]});window.scrollTo({top:0});
 }
 function katalogZeigen() {
  const s=aktuell.current;if(!s||!darfBearbeiten)return;
  // Catalogue navigation changes the view, never the saved continuation point.
  const ansicht={...s,aktiv:null};aktuell.current=ansicht;setStand(ansicht);
  window.history.replaceState(null,"","/grundlagen/mathe?ansicht=pruefungsaufgaben");
 }
 function abgeben() {
  const s=aktuell.current,a=s?.versuche.find(v=>v.id===s.aktiv);if(!s||!a||a.abgegebenAm!==null)return;
  try {const neu=abgegebenerPruefungsMatheVersuch(a);if(speichern({...s,versuche:s.versuche.map(v=>v.id===a.id?neu:v)}))verarbeiteNachweis(neu);}
  catch(e){setFehler(e instanceof Error?e.message:"Deine Abgabe konnte nicht gespeichert werden.");}
 }
 function erneutSichern() {
  const s=aktuell.current;if(!s||!speichern(s))return;
  try {for(const v of s.versuche)verarbeiteNachweis(v);}
  catch {setFehler("Der Matheentwurf ist gesichert. Der Lernnachweis konnte noch nicht gespeichert werden. Versuche es erneut.");}
 }
 if(!darfBearbeiten)return <section className="werkstatt-karte"><h1>{sperre.status==="pruefen"?"Prüfungs-Mathe wird geöffnet …":"Prüfungs-Mathe ist in einem anderen Fenster geöffnet"}</h1><p role={sperre.status==="gesperrt"?"alert":"status"}>{sperre.status==="pruefen"?"Wir prüfen, ob du hier sicher weiterarbeiten kannst.":sperre.fehler}</p>{sperre.status==="gesperrt"&&<button className="hauptaktion mt-4" onClick={()=>window.location.reload()}>Erneut öffnen</button>}{zurueck&&<button className={styles.back} onClick={zurueck}>← Zur Fachmathe</button>}</section>;
 const kompatibilitaet=sperre.status==="nicht-verfuegbar"?<p role="status" className="my-4 rounded-xl border p-4" style={{borderColor:"var(--border)"}}>{sperre.fehler}</p>:null;
 const fehlerHinweis=fehler?<div role="alert" className={styles.fehler}><p>{fehler}</p><button className={styles.back} onClick={erneutSichern}>Stand erneut sichern</button></div>:null;
 if(!stand)return <section className="werkstatt-karte"><h1>Dein Mathe-Prüfungsstand bleibt erhalten.</h1><p role="alert">Der gespeicherte Stand kann nicht gelesen werden. Er wird nicht überschrieben. Sichere deine Daten unter Lernstand &amp; Sicherungen.</p>{zurueck&&<button className={styles.back} onClick={zurueck}>Zur Fachmathe</button>}</section>;
 const fortsetzung=stand.versuche.find(a=>a.id===geladen.letzteAktive&&a.abgegebenAm===null)??[...stand.versuche].reverse().find(a=>a.abgegebenAm===null);
 if(!v)return <div>
  {zurueck&&<button className={styles.back} onClick={zurueck}>← Zur Fachmathe</button>}
  <header className={styles.unitHead}><span>SELBSTSTÄNDIG RECHNEN</span><h1>Dein Rechenweg zählt.</h1><p>30 Aufgaben ohne vorangestellte Lösung. Erst selbst rechnen, danach Wert, Einheit und eigenen Formelansatz vergleichen. Frühere Lernaufgaben und ihre Stände bleiben erhalten.</p></header>
  {kompatibilitaet}
  <p className="mb-6">Der einfache Taschenrechner ist zugelassen. Begriffserklärungen und Formelhilfen werden als Unterstützung erfasst. Dies ist App-Training, keine amtliche Prüfung.</p>
  {fehlerHinweis}
  {fortsetzung&&<section className="werkstatt-karte mb-6"><h2>Dein angefangener Rechenweg bleibt erhalten</h2><p>{fortsetzung.aufgabe.typ==="aufbau"?fortsetzung.aufgabe.aufgabe.titel:fortsetzung.aufgabe.titel}</p><button className="hauptaktion mt-3" onClick={()=>speichern({...stand,aktiv:fortsetzung.id})}>Angefangenen Rechenweg fortsetzen</button></section>}
  {AUFBAU_EINHEITEN.map(e=><section key={e.id} className="mb-7"><h2 className="mb-3 text-xl font-semibold">{e.titel}</h2><div className={styles.grid}>{PRUEFUNGS_MATHE_AUFGABEN.filter(a=>a.familie===e.id).map((a,i)=>{const unfertig=stand.versuche.find(v=>v.aufgabenId===a.id&&v.abgegebenAm===null);return <button key={a.id} className={styles.card} onClick={()=>starten(a.id)}><span className={styles.nummer}>{i+1}</span><span><strong>{a.titel}</strong><small>{unfertig?"Angefangene Aufgabe fortsetzen":"Selbsttest öffnen"}</small><span>Auftrag, eigene Formelnotiz und Rechenschritte</span></span></button>;})}</div></section>)}
  <section className="mb-7"><h2 className="mb-3 text-xl font-semibold">Auf einen anderen Zusammenhang übertragen</h2><p className="mb-4">Hier verändert sich der Auftrag. Neue Zahlen allein wären noch kein anderer Zusammenhang.</p><div className={styles.grid}>{FALL_THEMEN.map(f=><button className={styles.card} key={f.id} onClick={()=>starten(`transfer:${f.id}`)}><span><strong>{f.titel}</strong><small>Kurze Transferaufgabe</small></span></button>)}</div></section>
  {!!stand.versuche.length&&<details className="werkstatt-karte"><summary className="min-h-11 cursor-pointer font-semibold">Frühere Versuche und Entwürfe ({stand.versuche.length})</summary><ul className="mt-3 space-y-2">{[...stand.versuche].reverse().map(a=><li key={a.id}><button className={styles.back} onClick={()=>speichern({...stand,aktiv:a.id})}>{a.aufgabe.typ==="aufbau"?a.aufgabe.aufgabe.titel:a.aufgabe.titel} · {new Date(a.gestartetAm).toLocaleDateString("de-DE")} · {a.ergebnis?`${a.ergebnis.erreicht}/${a.ergebnis.moeglich} Punkte`:"Entwurf"}</button></li>)}</ul></details>}
 </div>;
 const aufgabe=v.aufgabe,schritte=pruefungsMatheSchritte(v),fertig=v.abgegebenAm!==null;
 return <div className={styles.einheit}>
  <button className={styles.back} onClick={katalogZeigen}>← Alle selbstständigen Matheaufgaben</button>
  <header className={styles.unitHead}><span>PRÜFUNGS-MATHE · {aufgabe.typ==="transfer"?"VERÄNDERTER ZUSAMMENHANG":"EIGENER RECHENWEG"}</span><h1>{aufgabe.typ==="aufbau"?aufgabe.aufgabe.titel:aufgabe.titel}</h1><p>Die Lösung bleibt bis zu deiner Abgabe verborgen. Die Zahlen bleiben pro Versuch fest gespeichert.</p></header>
  {kompatibilitaet}
  <section className={styles.task} data-aufgabe-id={v.aufgabenId} data-aufgabe-text={aufgabe.typ==="aufbau"?aufgabe.aufgabe.frage:aufgabe.frage}>
   <h2>{aufgabe.typ==="aufbau"?aufgabe.aufgabe.frage:aufgabe.frage}</h2>
   {aufgabe.typ==="aufbau"&&<ul className="my-5 list-disc space-y-2 pl-5" aria-label="Gegebene Größen">{aufgabe.aufgabe.gegeben.map(g=><li key={g}>{g}</li>)}</ul>}
   {aufgabe.typ==="aufbau"&&<AuftragsSkizze einheit={aufgabe.aufgabe.einheitId}/>}
   <label className={styles.notiz}>{fertig?"Meine überarbeitete Formelnotiz":"Mein Formelansatz in eigenen Worten"}<textarea value={v.formel} maxLength={20000} onChange={e=>aendern({formel:e.target.value})}/></label>
   <p className="my-4 text-sm">Je Schritt: ein Punkt für den passenden Rechenwert und ein Punkt für die geforderte Einheit. Die freie Formelnotiz vergleichst du selbst.</p>
   {schritte.map((s,i)=>{const a=v.antworten[s.id]??{wert:"",einheit:""},r=v.ergebnis?.schritte[s.id];return <fieldset key={s.id} className="my-5 rounded-xl border p-4" style={{borderColor:"var(--border)"}}><legend className="px-2 font-semibold">{i+1}. {s.label}</legend><p className="text-sm">{s.ganzzahl?"Ganze Anzahl eingeben.":`Auf ${s.stellen} Nachkommastellen runden. Intern möglichst ungerundet weiterrechnen.`}</p><div className={styles.antwort}><label>Dein Wert für {s.label}<input inputMode="decimal" disabled={fertig} value={a.wert} aria-invalid={!!fehler&&(leseDezimalzahl(a.wert)===null||/[.,]$/.test(a.wert.trim()))||undefined} onChange={e=>aendern({antworten:{...v.antworten,[s.id]:{...a,wert:e.target.value}}})}/></label><label>Einheit für {s.label}<select disabled={fertig} value={a.einheit} onChange={e=>aendern({antworten:{...v.antworten,[s.id]:{...a,einheit:e.target.value}}})}><option value="">Bitte wählen</option>{[...s.einheiten].sort((a,b)=>a.localeCompare(b,"de")).map(u=><option key={u} value={u}>{u}</option>)}</select></label></div>{fertig&&r&&<p>{r.wertRichtig?"Rechenwert passt.":"Rechenwert nacharbeiten."} {r.einheitRichtig?"Einheit passt.":`Geforderte Einheit: ${s.einheit}.`}</p>}</fieldset>;})}
   {!fertig&&<button className="hauptaktion" onClick={abgeben}>Rechenweg abgeben</button>}
   {fehlerHinweis}
   {fertig&&v.ergebnis&&<section className={styles.feedback} aria-label="Auswertung des Rechenwegs"><h2>{v.ergebnis.erreicht} von {v.ergebnis.moeglich} Punkten</h2><p>{v.nachErklaerung?"Neue Variante unmittelbar nach einem Muster: als Nacharbeit gespeichert.":v.hilfen.length?"Mit Lernhilfe bearbeitet.":"Vor der Abgabe ohne erfasste Lernhilfe bearbeitet."} Erfasst werden nur Hilfen innerhalb der App.</p><p><strong>Deine erste Formelnotiz:</strong> {v.erstFormel||"Keine Formelnotiz eingetragen."}</p><h3 className="mt-4 font-semibold">Ein möglicher Rechenweg</h3>{aufgabe.typ==="aufbau"?<ol className="mt-2 list-decimal space-y-3 pl-5">{aufgabe.aufgabe.schritte.map(s=><li key={s.id}>{s.formel} → {s.einsetzen} → <strong>{s.wert.toLocaleString("de-DE",{minimumFractionDigits:s.stellen,maximumFractionDigits:s.stellen})} {s.einheit}</strong></li>)}</ol>:<p>{aufgabe.erklaerung}</p>}{aufgabe.typ==="aufbau"&&<p>{aufgabe.aufgabe.erklaerung}</p>}<label className="mt-4 flex items-start gap-3"><input type="checkbox" checked={v.selbstVerglichen} onChange={e=>aendern({selbstVerglichen:e.target.checked})}/><span>Ich habe meinen Formelansatz und die Bezugsgrößen mit dem Muster verglichen. Diese Selbsteinschätzung verändert die Punkte nicht.</span></label><button className={styles.back} onClick={()=>starten(v.aufgabenId,true)}>Mit einer neuen Variante weiterüben</button></section>}
  </section>
 </div>;
}
function AuftragsSkizze({einheit}:{einheit:string}) {
 const dreieck=["aufbau-trig","aufbau-laengen","aufbau-gefaelle"].includes(einheit);
 return <figure className="my-5 rounded-xl p-3" style={{background:"var(--surface-2)"}}><svg viewBox="0 0 480 170" className="mx-auto h-auto max-h-44 w-full" role="img" aria-label={dreieck?"Schematisches rechtwinkliges Dreieck mit waagerechter Strecke, Höhe und schräger Länge":"Rechenskizze: Angaben aus dem Auftrag führen über eigene Zwischenschritte zur gesuchten Größe"}>
  {dreieck?<g fill="none" stroke="currentColor" strokeWidth="2"><path d="M85 125H360V35Z"/><path d="M340 125V105H360"/><g fill="currentColor" stroke="none" fontSize="16"><text x="160" y="153">waagerechte Strecke</text><text x="370" y="83">Höhe</text><text x="170" y="60">schräge Länge</text></g></g>:<g fill="none" stroke="currentColor" strokeWidth="2"><rect x="10" y="55" width="120" height="65" rx="10"/><path d="M137 88H174m-8-8 8 8-8 8"/><rect x="184" y="55" width="120" height="65" rx="10"/><path d="M312 88h36m-8-8 8 8-8 8"/><rect x="358" y="55" width="112" height="65" rx="10"/><g fill="currentColor" stroke="none" fontSize="14"><text x="28" y="92">Gegeben</text><text x="200" y="83">Eigene</text><text x="200" y="103">Schritte</text><text x="375" y="92">Gesucht</text></g></g>}
 </svg><figcaption className="mt-2 text-sm">Orientierungsskizze ohne Maßstab. Verwende ausschließlich die Angaben und geometrischen Voraussetzungen deines Auftrags.</figcaption></figure>;
}
