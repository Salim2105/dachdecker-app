"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { bereichsAuswahl } from "@/lib/bereichsAuswahl";
import { appStorage } from "@/lib/lernSpeicher";
import { recordReviewResult, type ReviewResult } from "@/lib/review";
import { speichereLernsignal } from "@/lib/lerndiagnose";
import { mischeAnzeige } from "@/lib/aktivitaeten";
import { leseSprachStand, leereSprachAntwort, pruefeSprachAntwort, sprachEinheiten, sprachKey, type SprachAntwort, type SprachEinheit, type SprachStand, type WerkstattSprache } from "@/lib/sprachWerkstatt";
import { PracticeArtwork } from "@/components/practice/PracticeArtwork";
import { LernIllustration } from "@/components/design/LernIllustration";
import styles from "./Sprache.module.css";

export function SprachWerkstatt({ sprache }: { sprache: WerkstattSprache }) {
  const einheiten=sprachEinheiten(sprache);
  const [auswahl,setAuswahl]=useState(()=>bereichsAuswahl(einheiten.map(e=>e.id),appStorage.getItem(`sprachwerkstatt-${sprache}-auswahl`)));
  useEffect(()=>{
    const ausAdresse=()=>{
      const hash=window.location.hash.slice(1);
      const id=einheiten.some((e)=>e.id===hash)?hash:"";
      setAuswahl(id);try{if(id)appStorage.setItem(`sprachwerkstatt-${sprache}-auswahl`,id);}catch{ /* Der gemeinsame Speicherhinweis zeigt den fehlgeschlagenen Schreibzugriff. */ }
    };
    window.addEventListener("hashchange",ausAdresse);window.addEventListener("popstate",ausAdresse);
    return ()=>{window.removeEventListener("hashchange",ausAdresse);window.removeEventListener("popstate",ausAdresse);};
  },[sprache,einheiten]);
  function waehle(id:string) {
    setAuswahl(id);
    try{appStorage.setItem(`sprachwerkstatt-${sprache}-auswahl`,id);if(id)appStorage.setItem("lernwerkstatt-zuletzt-route",`/sprache/${sprache}#${id}`);}catch{ /* Der gemeinsame Speicherhinweis bleibt sichtbar; die Einheit kann geöffnet werden. */ }
    window.history.replaceState(null,"",`${window.location.pathname}${id?`#${id}`:""}`);
    window.scrollTo({top:0});
  }
  const e=einheiten.find((e)=>e.id===auswahl);
  if(e)return <SprachLerneinheit key={e.id} einheit={e} zurueck={()=>waehle("")} weiter={()=>waehle(einheiten[einheiten.indexOf(e)+1]?.id??"")} />;
  return <div>
    <section className={styles.hero}><div><span>DEINE SPRACHWERKZEUGE</span><h1>{sprache==="deutsch"?"Deutsch fürs Handwerk.":"Baustellenenglisch. Schritt für Schritt."}</h1><p>{sprache==="deutsch"?"Aufträge verstehen, Arbeit erklären und klar nachfragen. Kurze Situationen aus deinem Ausbildungsalltag.":"Werkzeuge, Maße und klare Rückfragen: einfache englische Sätze, die du auf der Baustelle verstehst."}</p><Link href="/lernhilfe">Deine nächsten Übungen finden →</Link></div><PracticeArtwork art="begriffe"/></section>
    <div className={styles.intro}><h2>Verstehen. Ausprobieren. Anwenden.</h2><p>Jede Einheit verbindet eine kurze Erklärung, drei Aufgaben und eine freiwillige Schreibübung. Ohne Zeitdruck.</p></div>
    <div className={styles.grid}>{einheiten.map((e,i)=><button className={styles.card} key={e.id} onClick={()=>waehle(e.id)}><span className={styles.nummer}>{String(i+1).padStart(2,"0")}</span><span><strong>{e.titel}</strong><small>6–8 Minuten · 3 Sprachaufgaben</small><span>{e.ziel}</span></span><span aria-label={leseSprachStand(e).abgeschlossen?"Bearbeitet":"Öffnen"}>{leseSprachStand(e).abgeschlossen?"✓":"→"}</span></button>)}</div>
    <p className={styles.crosslink}>Noch ein Werkzeug für dich: <Link href={sprache==="deutsch"?"/sprache/englisch":"/sprache/deutsch"}>{sprache==="deutsch"?"Baustellenenglisch entdecken":"Deutsch fürs Handwerk entdecken"} →</Link></p>
  </div>;
}

function SprachLerneinheit({einheit:e,zurueck,weiter}:{einheit:SprachEinheit;zurueck:()=>void;weiter:()=>void}) {
  const [stand,setStand]=useState(()=>leseSprachStand(e));
  const ref=useRef(stand);
  const [fehler,setFehler]=useState("");
  const [wortlisteOffen,setWortlisteOffen]=useState(false);
  const [wortlisteGesehen,setWortlisteGesehen]=useState(()=>Object.values(stand.antworten).some((a)=>a.hilfen.includes("wortliste")));
  const fragenTitel=useRef<HTMLHeadingElement>(null);
  const vorherigerIndex=useRef(stand.index);
  useEffect(()=>{if(vorherigerIndex.current!==stand.index){fragenTitel.current?.focus();vorherigerIndex.current=stand.index;}},[stand.index]);
  useEffect(()=>{
    try{appStorage.setItem("lernwerkstatt-zuletzt-route",`/sprache/${e.sprache}#${e.id}`);appStorage.setItem(`sprachwerkstatt-${e.sprache}-auswahl`,e.id);}catch{ /* StorageGate zeigt den Fehler; Inhalte bleiben bedienbar. */ }
    return ()=>{if(typeof window!=="undefined" && "speechSynthesis" in window)window.speechSynthesis.cancel();};
  },[e.sprache,e.id]);
  useEffect(()=>{
    let aktiv=true;
    try {
      // Only new submissions have a stored review event. Older drafts and
      // historical checked answers never manufacture retrospective success.
      for(const a of Object.values(ref.current.antworten))for(const r of a.reviews??[])recordReviewResult(r);
    }catch{queueMicrotask(()=>{if(aktiv)setFehler("Deine Antwort bleibt gespeichert. Ihr Wiederholungstermin konnte noch nicht übernommen werden. Bitte den Speicherhinweis prüfen.");});}
    return ()=>{aktiv=false;};
  },[e.id]);
  const f=e.aufgaben[stand.index];
  const antwort=stand.antworten[f.id]??leereSprachAntwort();
  const fertig=e.aufgaben.every((a)=>stand.antworten[a.id]?.geprueft);
  function speichern(neu:SprachStand) {
    ref.current=neu;setStand(neu);
    try{appStorage.setItem(sprachKey(e),JSON.stringify(neu));return true;}catch{setFehler("Dein Sprachentwurf konnte nicht dauerhaft gespeichert werden. Bitte den Speicherhinweis prüfen.");return false;}
  }
  function aendere(patch:Partial<SprachAntwort>) {
    const aktuell=ref.current;
    speichern({...aktuell,antworten:{...aktuell.antworten,[f.id]:{...(aktuell.antworten[f.id]??leereSprachAntwort()),...patch}}});
  }
  function hilfe(id:string) {
    const aktuell=ref.current.antworten[f.id]??leereSprachAntwort();
    if(!aktuell.hilfen.includes(id))aendere({hilfen:[...aktuell.hilfen,id]});
  }
  function signal(richtig:boolean,hilfen:string[],selbstBewertet=false) {
    try{speichereLernsignal({quelle:e.sprache,aufgabeId:selbstBewertet?`${e.id}-schreiben`:f.id,lernzielId:`${e.sprache}-${e.id}`,richtig,selbstBewertet,kategorie:e.sprache==="englisch"?"englisch":e.id==="fachwort"?"begriffe":"leseverstehen",hilfen,route:`/sprache/${e.sprache}#${e.id}`,thema:e.titel});}catch{setFehler("Deine Lernrückmeldung konnte nicht dauerhaft gespeichert werden. Bitte den Speicherhinweis prüfen.");}
  }
  function pruefen() {
    const aktuell=ref.current.antworten[f.id]??leereSprachAntwort();
    if(aktuell.geprueft)return;
    const r=pruefeSprachAntwort(f,aktuell);
    if(r===null){setFehler(f.typ==="wahl"?"Wähle zuerst eine Antwort aus.":"Ordne zuerst jedem Begriff eine Bedeutung zu.");return;}
    const hilfen=[...new Set([...aktuell.hilfen,...(wortlisteGesehen?["wortliste"]:[])])];
    const review:ReviewResult={ref:{quelle:"sprache",id:`${e.sprache}:${f.id}`,version:1,lernzielIds:[`${e.sprache}-${e.id}`]},versuchId:`sprache-${globalThis.crypto.randomUUID()}`,bewertung:r?"richtig":"falsch",am:Date.now(),hilfen,nachErklaerung:hilfen.includes("rueckmeldung")};
    setFehler("");
    const neu={...aktuell,geprueft:true,hilfen,reviews:[...(aktuell.reviews??[]),review]};
    if(!speichern({...ref.current,antworten:{...ref.current.antworten,[f.id]:neu}}))return;
    try{recordReviewResult(review);}catch{setFehler("Deine Antwort bleibt gespeichert. Ihr Wiederholungstermin konnte noch nicht übernommen werden. Bitte den Speicherhinweis prüfen.");}
    signal(r,hilfen);
  }
  function selbstBewerten(wert:"passt"|"unsicher") {
    if(ref.current.selbst===wert)return;
    speichern({...ref.current,selbst:wert});signal(wert==="passt",["schreibmuster"],true);
  }
  function sprechen() {
    if(typeof window==="undefined" || !("speechSynthesis" in window)){setFehler("Die Vorlesefunktion ist auf diesem Gerät nicht verfügbar. Du kannst alle Aufgaben auch ohne Ton bearbeiten.");return;}
    window.speechSynthesis.cancel();
    const satz=new SpeechSynthesisUtterance(e.beispiel.split("—")[0].replace(/[“”„]/g,"").trim());
    satz.lang="en-GB";satz.rate=0.85;
    satz.onerror=()=>setFehler("Die englische Stimme ist auf diesem Gerät gerade nicht verfügbar. Der Beispielsatz bleibt lesbar.");
    window.speechSynthesis.speak(satz);
  }
  const richtig=antwort.geprueft?pruefeSprachAntwort(f,antwort):null;
  const loesung=f.typ==="wahl"?f.optionen[f.korrekt]:f.paare.map((p)=>`${p.links} → ${p.rechts}`).join("; ");
  return <div className={styles.einheit}>
    <button className={styles.back} onClick={zurueck}>← Alle {e.sprache==="deutsch"?"Deutsch-Einheiten":"Englisch-Einheiten"}</button>
    <header className={styles.unitHead}><span>{e.sprache==="deutsch"?"DEUTSCH FÜRS HANDWERK":"BAUSTELLENENGLISCH"} · 6–8 MINUTEN</span><h1>{e.titel}</h1><p>{e.ziel}</p></header>
    {fehler&&<p role="alert" className={styles.fehler}>{fehler}</p>}
    {stand.abgeschlossen?<section className={styles.success}><LernIllustration motiv="erfolg"/><h2>Ein Sprachwerkzeug mehr.</h2><p>{e.aufgaben.filter((a)=>{const v=stand.antworten[a.id];return v?.geprueft&&pruefeSprachAntwort(a,v);}).length} von {e.aufgaben.length} zuletzt geprüften Antworten passen. Wiederholungen und genutzte Hilfen bleiben erkennbar.</p><button className="hauptaktion" onClick={weiter}>Nächste Spracheinheit →</button><Link href="/lernhilfe">Deine nächsten Übungen ansehen</Link><button className={styles.back} onClick={()=>speichern({...ref.current,abgeschlossen:false})}>Antworten und eigene Formulierung ansehen</button></section>:<>
      <section className={styles.text}><h2>Erst verstehen</h2><p>{e.text}</p><strong>{e.merksatz}</strong><div className={styles.example}><span>BEISPIEL AUS DEM HANDWERK</span><p>{e.sprache==="englisch"?<><span lang="en">{e.beispiel.split("—")[0]}</span>—{e.beispiel.split("—").slice(1).join("—")}</>:e.beispiel}</p>{e.sprache==="englisch"&&<button className={styles.back} onClick={sprechen}>Englischen Beispielsatz anhören</button>}</div></section>
      <section className={styles.words}><button aria-expanded={wortlisteOffen} className={styles.wordButton} onClick={()=>{setWortlisteOffen(!wortlisteOffen);if(!wortlisteOffen){setWortlisteGesehen(true);hilfe("wortliste");}}}>Deine Worthilfe {wortlisteOffen?"schließen":"öffnen"} <span aria-hidden="true">{wortlisteOffen?"−":"+"}</span></button>{wortlisteOffen&&<dl>{e.woerter.map((w)=><div key={w.wort}><dt lang={e.sprache==="englisch"?"en":undefined}>{w.wort}</dt><dd>{w.bedeutung}</dd></div>)}</dl>}</section>
      <section className={styles.task} data-aufgabe-id={`${e.sprache}:${f.id}`} data-aufgabe-text={f.frage}><div className={styles.taskHead}><span>JETZT DU</span><span>Aufgabe {stand.index+1} von {e.aufgaben.length}</span></div><h2 tabIndex={-1} ref={fragenTitel}>{f.frage}</h2>
        {f.typ==="wahl"?<fieldset className={styles.options} disabled={antwort.geprueft}><legend className="sr-only">Deine Antwort</legend>{f.optionen.map((o,i)=><label key={o}><input type="radio" name={f.id} value={i} checked={antwort.wahl===String(i)} onChange={()=>aendere({wahl:String(i)})}/><span lang={e.sprache==="englisch"&&["werkzeuge-3","masse-3","nachfragen-1"].includes(f.id)?"en":undefined}>{o}</span></label>)}</fieldset>:<div className={styles.pairs}>{f.paare.map((p)=><label key={p.links}><span lang={e.sprache==="englisch"?"en":undefined}>{p.links}</span><select aria-label={`Bedeutung zu ${p.links}`} disabled={antwort.geprueft} value={antwort.paare[p.links]??""} onChange={(ev)=>aendere({paare:{...antwort.paare,[p.links]:ev.target.value}})}><option value="">Bedeutung wählen</option>{mischeAnzeige(f.paare, `${e.sprache}:${e.id}:${f.id}:bedeutungen`).map((q)=><option key={q.rechts}>{q.rechts}</option>)}</select></label>)}</div>}
        {!antwort.geprueft&&<button className="hauptaktion" onClick={pruefen}>Antwort vergleichen</button>}
        <details className={styles.hint} key={f.id} onToggle={(ev)=>{if(ev.currentTarget.open)hilfe("tipp");}}><summary>Ein kleiner Hinweis</summary><p>{f.tipp}</p></details>
        {antwort.geprueft&&<div className={styles.feedback} role="status"><strong>{richtig?"Das passt.":"Schau die Bedeutung noch einmal an."}</strong><p>{f.erklaerung}</p><p><strong>Passende Antwort:</strong> {loesung}</p><small>{antwort.hilfen.length?"Mit Worthilfe, Hinweis oder bereits gesehener Rückmeldung bearbeitet.":"Vor dem Vergleichen ohne aufgedeckte Worthilfe oder Hinweis bearbeitet."}</small><div><button className={styles.back} onClick={()=>aendere({geprueft:false,hilfen:[...new Set([...antwort.hilfen,"rueckmeldung"]) ]})}>Noch einmal versuchen</button>{stand.index<e.aufgaben.length-1&&<button className="hauptaktion" onClick={()=>speichern({...ref.current,index:stand.index+1})}>Nächste Sprachaufgabe</button>}</div></div>}
      </section>
      <section className={styles.writing}><span>FREIWILLIG ANWENDEN</span><h2>Deine eigenen Worte</h2><label>{e.schreiben.auftrag}<textarea value={stand.text} lang={e.sprache==="englisch"?"en":undefined} onChange={(ev)=>speichern({...ref.current,text:ev.target.value,selbst:undefined})}/></label><p>Dein Text bleibt gespeichert. Die Formulierung wird von dir selbst mit einem Beispiel verglichen.</p><button className={styles.back} aria-expanded={stand.musterOffen} onClick={()=>speichern({...ref.current,musterOffen:!stand.musterOffen})}>{stand.musterOffen?"Schreibbeispiel schließen":"Mit einem Schreibbeispiel vergleichen"}</button>{stand.musterOffen&&<div className={styles.model}><h3>Eine mögliche Formulierung</h3><p lang={e.sprache==="englisch"?"en":undefined}>{e.schreiben.muster}</p><ul>{e.schreiben.kriterien.map((k)=><li key={k}>{k}</li>)}</ul><strong>Eigene Einschätzung · zählt nicht zum automatischen Ergebnis</strong><div><button className={styles.self} aria-pressed={stand.selbst==="passt"} disabled={!stand.text.trim()} onClick={()=>selbstBewerten("passt")}>Die Kriterien passen zu meinem Text</button><button className={styles.self} aria-pressed={stand.selbst==="unsicher"} disabled={!stand.text.trim()} onClick={()=>selbstBewerten("unsicher")}>Ich brauche noch eine Erklärung</button></div>{!stand.text.trim()&&<p>Schreibe zuerst deine eigene Formulierung auf.</p>}</div>}</section>
      <div className={styles.footer}><button className={styles.back} disabled={stand.index===0} onClick={()=>speichern({...ref.current,index:stand.index-1})}>Vorherige Sprachaufgabe</button>{fertig&&<button className="hauptaktion" onClick={()=>speichern({...ref.current,abgeschlossen:true})}>Spracheinheit abschließen</button>}<Link href={e.anschluss}>Im Fachwissen weiterlernen →</Link></div>
    </>}
  </div>;
}
