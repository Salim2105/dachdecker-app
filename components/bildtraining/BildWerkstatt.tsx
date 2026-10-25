"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { bereichsAuswahl } from "@/lib/bereichsAuswahl";
import { appStorage } from "@/lib/lernSpeicher";
import { BILD_AUFGABEN, BILD_THEMEN, bildStandKey, ladeBildStand, leseBildStand, neuerBildStand, pruefeBildAufgabe, type BildAufgabe, type BildStand } from "@/lib/bildtraining";
import { istAktivitaetVollstaendig, type AktivitaetAntwort } from "@/lib/aktivitaeten";
import { recordReviewResult } from "@/lib/review";
import { bildNacharbeit } from "@/lib/lernNacharbeit";
import { aktivitaetTexte } from "@/lib/aktivitaeten";
import { GlossarText, BegriffsListe, oeffneGlossarBegriff } from "@/components/GlossarText";
import { Nacharbeit } from "@/components/Nacharbeit";
import { AktivitaetsKarte } from "@/components/AktivitaetsKarte";
import { SafeSvg } from "@/components/SafeSvg";
import { PracticeArtwork } from "@/components/practice/PracticeArtwork";
import styles from "./Bildtraining.module.css";

const AUSWAHL_KEY="bildtraining-auswahl";
function letzteAufgabe(id:string){try{appStorage.setItem(AUSWAHL_KEY,id);appStorage.setItem("lernwerkstatt-zuletzt-route",`/bildtraining#${id}`);}catch{/* The global storage status stays visible. */}}
export function BildWerkstatt(){
 const [auswahl,setAuswahl]=useState(()=>bereichsAuswahl(BILD_AUFGABEN.map(a=>a.id),appStorage.getItem(AUSWAHL_KEY)));
 const [filter,setFilter]=useState("alle");
 useEffect(()=>{const wechseln=()=>{const id=window.location.hash.slice(1);setAuswahl(BILD_AUFGABEN.some(a=>a.id===id)?id:"");};window.addEventListener("hashchange",wechseln);window.addEventListener("popstate",wechseln);return()=>{window.removeEventListener("hashchange",wechseln);window.removeEventListener("popstate",wechseln);};},[]);
 function waehle(id:string){setAuswahl(id);try{if(id)letzteAufgabe(id);else appStorage.removeItem(AUSWAHL_KEY);}catch{}window.history.replaceState(null,"",`${window.location.pathname}${id?`#${id}`:""}`);window.scrollTo({top:0});}
 const aufgabe=BILD_AUFGABEN.find(a=>a.id===auswahl);
 if(aufgabe)return <BildEinheit key={aufgabe.id} aufgabe={aufgabe} zurueck={()=>waehle("")} weiter={()=>waehle(BILD_AUFGABEN[BILD_AUFGABEN.indexOf(aufgabe)+1]?.id??"")}/>;
 return <div>
  <section className={styles.hero}><div><span>DEIN AUGE FÜRS HANDWERK</span><h1>Genau hinsehen. Zusammenhänge erkennen.</h1><p>24 Bildaufgaben zu sechs Baustellenthemen. Bauteile erkennen, Abläufe ordnen und sichtbare Befunde untersuchen.</p><Link href="/projekte">Im ganzen Baustellenprojekt anwenden →</Link></div><PracticeArtwork art="zeichnen"/></section>
  <div className={styles.intro}><h2>Womit möchtest du anfangen?</h2><p>Die Zeichnungen zeigen vereinfachte Lernbeispiele. Jede Nummer ist auch mit Tastatur und Auswahlliste erreichbar.</p></div>
  <div className={styles.filter} role="group" aria-label="Bildaufgaben nach Baustellenthema filtern"><button aria-pressed={filter==="alle"} onClick={()=>setFilter("alle")}>Alle Themen</button>{BILD_THEMEN.map(t=><button key={t.id} aria-pressed={filter===t.id} onClick={()=>setFilter(t.id)}>{t.titel}</button>)}</div>
  {BILD_THEMEN.filter(t=>filter==="alle"||filter===t.id).map(t=><section className={styles.thema} key={t.id}><div className={styles.themeHead}><h2>{t.titel}</h2><span>Vier Wege, genauer hinzusehen</span></div><div className={styles.grid}>{BILD_AUFGABEN.filter(a=>a.projektId===t.id).map((a,i)=>{const s=ladeBildStand(a);return <button className={styles.karte} key={a.id} onClick={()=>waehle(a.id)}><span className={styles.nummer}>{String(i+1).padStart(2,"0")}</span><span><strong>{a.aktivitaet.titel}</strong><small>{a.minuten} Minuten · {a.art==="bauteile"?"Zuordnung":a.art==="folge"?"Reihenfolge":a.art==="fehler"?"Fehlersuche":"Befund prüfen"}</small><span>{a.lernziel}</span></span><span className={styles.badge}>{s.abgeschlossen?pruefeBildAufgabe(a,s.antwort)==="richtig"?"Bearbeitet ✓":"Noch üben":"Öffnen →"}</span></button>;})}</div></section>)}
 </div>;
}
/** Stateless task card: also usable for a fixed snapshot in the daily review. */
export function BildAntwortKarte({aufgabe:a,antwort,geprueft,onChange,onPruefen,onBegriff}:{aufgabe:BildAufgabe;antwort:AktivitaetAntwort;geprueft:boolean;onChange:(a:AktivitaetAntwort)=>void;onPruefen:()=>void;onBegriff?:(id:string)=>void}){
 const controls=useRef<HTMLDivElement>(null);
 return <>
  <figure className={styles.abbildung}><div className={styles.bild}><SafeSvg markup={a.svg}/>{a.bildbereiche.length>0&&<div className={styles.regionen} aria-label="Nummerierte Bildbereiche">{a.bildbereiche.map((b,i)=><button key={b.id} aria-label={`Bildbereich ${b.nummer} in der Liste zuordnen`} className={styles.region} style={{left:`${b.x/640*100}%`,top:`${b.y/310*100}%`}} onClick={()=>controls.current?.querySelectorAll<HTMLSelectElement>("select")[i]?.focus()}>{b.nummer}</button>)}</div>}</div><figcaption>{onBegriff?<GlossarText text={a.bildbeschreibung} onBegriff={onBegriff}/>:a.bildbeschreibung}<span>Schematische Lernzeichnung ohne Maßstab.</span></figcaption></figure>
  <div ref={controls}><AktivitaetsKarte aktivitaet={a.aktivitaet} antwort={antwort} geprueft={geprueft} onChange={onChange} onPruefen={onPruefen} onBegriff={onBegriff}/></div>
 </>;
}
function BildEinheit({aufgabe:a,zurueck,weiter}:{aufgabe:BildAufgabe;zurueck:()=>void;weiter:()=>void}){
 const [initial,setInitial]=useState(()=>leseBildStand(appStorage.getItem(bildStandKey(a.id)),a));
 const [fehler,setFehler]=useState("");
 if(!initial)return <section className="werkstatt-karte"><button className={styles.back} onClick={zurueck}>← Alle Bildaufgaben</button><h1>Gespeicherte Bildaufgabe prüfen</h1><p>Der vorhandene Stand konnte nicht gelesen werden. Deine Originaldaten bleiben unverändert.</p><Link className="mt-4 block underline" href="/fortschritt">Vollständige Sicherung öffnen →</Link><button className="hauptaktion mt-4" onClick={()=>{try{const key=bildStandKey(a.id);const raw=appStorage.getItem(key);if(raw!==null)appStorage.setItem(`${key}-original-${Date.now()}`,raw);const neu=neuerBildStand(a);appStorage.setItem(key,JSON.stringify(neu));setInitial(neu);}catch{setFehler("Die Originaldaten konnten noch nicht gesichert werden. Bitte zuerst den Speicherhinweis prüfen.");}}}>Original aufbewahren und Aufgabe neu beginnen</button>{fehler&&<p role="alert">{fehler}</p>}</section>;
 return <BildBearbeitung aufgabe={a} initial={initial} zurueck={zurueck} weiter={weiter}/>;
}
function BildBearbeitung({aufgabe:a,initial,zurueck,weiter}:{aufgabe:BildAufgabe;initial:BildStand;zurueck:()=>void;weiter:()=>void}){
 const [stand,setStand]=useState(initial);
 const ref=useRef(stand);
 const [hilfeOffen,setHilfeOffen]=useState(false);
 const [fehler,setFehler]=useState("");
 const ergebnisSpeichern=useCallback((s:BildStand)=>{if(!s.geprueft||s.bewertetAm===null)return;try{recordReviewResult({ref:{quelle:"bild",id:a.id,version:a.version,lernzielIds:a.lernzielIds},versuchId:s.versuchId,bewertung:pruefeBildAufgabe(a,s.antwort),am:s.bewertetAm,hilfen:s.hilfen,hinweise:s.nacharbeit});}catch{setFehler("Dein Übungsergebnis konnte nicht dauerhaft gespeichert werden. Bitte den Speicherhinweis prüfen.");}},[a]);
 useEffect(()=>{letzteAufgabe(a.id);ergebnisSpeichern(ref.current);},[a.id,ergebnisSpeichern]); // Replay is idempotent through the stable attempt ID.
 function speichern(s:BildStand){ref.current=s;setStand(s);try{appStorage.setItem(bildStandKey(a.id),JSON.stringify(s));return true;}catch{setFehler("Deine Bildaufgabe konnte nicht dauerhaft gespeichert werden. Bitte den Speicherhinweis prüfen.");return false;}}
 function aendern(antwort:AktivitaetAntwort){const vorher=ref.current;speichern({...vorher,antwort,geprueft:false,abgeschlossen:false,bewertetAm:null,nacharbeit:undefined,versuchId:vorher.geprueft?globalThis.crypto.randomUUID():vorher.versuchId,hilfen:vorher.geprueft?[...new Set([...vorher.hilfen,"musterloesung"])]:vorher.hilfen});}
 function pruefen(){const vorher=ref.current;if(vorher.geprueft||!istAktivitaetVollstaendig(a.aktivitaet,vorher.antwort))return;const neu={...vorher,geprueft:true,bewertetAm:Date.now(),nacharbeit:bildNacharbeit(a,vorher.antwort)};if(speichern(neu))ergebnisSpeichern(neu);}
 function begriff(id:string){if(!ref.current.geprueft)speichern({...ref.current,hilfen:[...new Set([...ref.current.hilfen,`begriff:${id}`])]});oeffneGlossarBegriff(id);}
 const bewertung=stand.geprueft?pruefeBildAufgabe(a,stand.antwort):null;
 return <div className={styles.einheit}>
  <button className={styles.back} onClick={zurueck}>← Alle Bildaufgaben</button>
  <header className={styles.unitHead}><span>BILDTRAINING · {a.minuten} MINUTEN</span><h1>{a.titel}</h1><p>{a.lernziel}</p></header>
  {fehler&&<p role="alert" className={styles.fehler}>{fehler}</p>}
  <BildAntwortKarte aufgabe={a} antwort={stand.antwort} geprueft={stand.geprueft} onChange={aendern} onPruefen={pruefen} onBegriff={begriff}/>
  <section className={styles.hilfe}><button aria-expanded={hilfeOffen} onClick={()=>{setHilfeOffen(!hilfeOffen);if(!hilfeOffen&&!ref.current.geprueft)speichern({...ref.current,hilfen:[...new Set([...ref.current.hilfen,"bildhinweis"]) ]});}}>Worauf sollte ich achten? {hilfeOffen?"−":"+"}</button>{hilfeOffen&&<p>{a.aktivitaet.erklaerung}</p>}</section>
  <BegriffsListe texte={[a.bildbeschreibung,...aktivitaetTexte(a.aktivitaet)]} onBegriff={begriff}/>
  {stand.geprueft&&<Nacharbeit hinweise={stand.nacharbeit} hilfen={stand.hilfen}/>}
  <label className={styles.notiz}>Mein Merksatz zu dieser Zeichnung<textarea value={stand.notiz} onChange={e=>speichern({...ref.current,notiz:e.target.value})}/></label>
  {stand.geprueft&&<section className={styles.ergebnis}><h2>{bewertung==="richtig"?"Zusammenhang erkannt.":"Hier lohnt sich ein zweiter Blick."}</h2><p>{stand.hilfen.length?"Mit Bildhinweis oder bereits gesehener Musterlösung bearbeitet.":"Vor dem Prüfen ohne aufgedeckten Bildhinweis bearbeitet."}</p>{stand.abgeschlossen?<p>Als bearbeitet gespeichert. {bewertung!=="richtig"?"Die offenen Zusammenhänge bleiben zum Üben erhalten.":"Spätere Wiederholungen zeigen, ob du dich auch dann erinnerst."}</p>:<button className="hauptaktion" onClick={()=>speichern({...ref.current,abgeschlossen:true})}>Bildaufgabe als bearbeitet speichern</button>}<button className={styles.back} onClick={weiter}>Nächste Bildaufgabe →</button></section>}
  <div className={styles.links}><Link href={`/projekte#${a.projektId}`}>Im Baustellenprojekt anwenden →</Link><Link href="/heute">Zur täglichen Wiederholung →</Link></div>
 </div>;
}
