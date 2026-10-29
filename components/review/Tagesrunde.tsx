"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { LernLink } from "@/components/LernLink";
import type { Bewertung, BewertungsKontext } from "@/content/schema";
import { LernzeitWahl } from "@/components/LernzeitWahl";
import { AufgabeSwitch } from "@/components/session/AufgabeSwitch";
import { AufgabenKontext } from "@/components/useAufgabenEntwurf";
import { SafeSvg } from "@/components/SafeSvg";
import { GlossarText, oeffneGlossarBegriff } from "@/components/GlossarText";
import { Nacharbeit } from "@/components/Nacharbeit";
import { aufbauNacharbeit, basisNacharbeit, bildNacharbeit, transferNacharbeit } from "@/lib/lernNacharbeit";
import { BildAntwortKarte } from "@/components/bildtraining/BildWerkstatt";
import { lernzeitStore } from "@/lib/appStores";
import { appStorage } from "@/lib/lernSpeicher";
import { berechneSchritte } from "@/lib/calc";
import { mischeAnzeige, starteAktivitaet } from "@/lib/aktivitaeten";
import { pruefeMathe } from "@/lib/matheGrundlagen";
import { pruefeAufbauAufgabe } from "@/lib/matheAufbau";
import { pruefeProjektTransfer } from "@/lib/bauprojekte";
import { pruefeBildAufgabe } from "@/lib/bildtraining";
import { pruefeSprachAntwort } from "@/lib/sprachWerkstatt";
import { createReviewResult, recordReviewResult, reviewKey, reviewStorageError, type ReviewResult } from "@/lib/review";
import { mitWerkstattReviewKontext, syncWerkstattReviewNachweise } from "@/lib/werkstattNachweise";
import { createReviewSession, emptyReviewAnswer, parseReviewSession, reviewSessionKey, saveReviewSession, getReviewTasks, freezeReviewTask, type ReviewAnswer, type ReviewFilter, type ReviewSession, type ReviewTask } from "@/lib/reviewTasks";
import { ladeAktuellenPlanBlock, ladePruefungsPlan, erledigePlanBlock, speicherePruefungsPlan, merkeAktuellenPlanBlock } from "@/lib/pruefungsPlan";
import styles from "./Tagesrunde.module.css";

const filter: { id: ReviewFilter; titel: string; erklaerung: string }[] = [
  { id: "alles", titel: "Bunter Mix", erklaerung: "Fachwissen, Mathe und Sprache verbinden" },
  { id: "kurz", titel: "Kurz & aktiv", erklaerung: "Begriffe, Entscheidungen und Sprache" },
  { id: "tief", titel: "In Ruhe rechnen", erklaerung: "Rechenketten vollständig bearbeiten" },
];
const quellen: Record<string, string> = { fachwissen: "Dachdeckerwissen", mathe: "Fachmathe", sprache: "Sprache am Bau", projekt: "Baustellentransfer", bild: "Bildtraining" };
const clientSubscribe = () => () => {};
const clientTrue = () => true;
const clientFalse = () => false;
const fehlertext = (e: unknown) => e instanceof Error ? e.message : "Dein Stand konnte nicht gespeichert werden. Bitte erstelle eine Sicherung.";

export function Tagesrunde({planId}:{planId?:string} = {}) {
  const client = useSyncExternalStore(clientSubscribe, clientTrue, clientFalse);
  return client ? planId !== undefined ? <GeplanteTagesrundeAufGeraet key={planId} planId={planId}/> : <TagesrundeAufGeraet /> : <p>Deine Tagesrunde wird geöffnet …</p>;
}

/** A planned round has its own storage key and never replaces a free/legacy round. */
export const planRundenKey = (id:string) => `tagesrunde-plan-${id}`;
function GeplanteTagesrundeAufGeraet({planId}:{planId:string}) {
  return <div className={styles.werkstatt}>
    <header className={styles.hero}><span className={styles.kicker}>Dein Prüfungsfahrplan</span><h1>Deine geplante Tagesrunde</h1><p>Diese feste Auswahl gehört zu deinem Fahrplan. Deine anderen angefangenen Runden bleiben erhalten.</p></header>
    <div className="my-4 flex flex-wrap gap-4"><LernLink href="/heute" className="min-h-11 py-2 underline">Freie und bisherige Tagesrunden öffnen →</LernLink><LernLink href="/pruefung#fahrplan" className="min-h-11 py-2 underline">Zum Prüfungsfahrplan →</LernLink></div>
    <Runde key={`plan:${planId}`} art="alles" minuten={15} planId={planId}/>
  </div>;
}

function TagesrundeAufGeraet() {
  const [art, setArt] = useState<ReviewFilter>(() => { const v = appStorage.getItem("tagesrunde-filter"); return v === "kurz" || v === "tief" ? v : "alles"; });
  const [nummer, setNummer] = useState(0);
  const [bestaetigen, setBestaetigen] = useState(false);
  const [fehler, setFehler] = useState("");
  const minuten = useSyncExternalStore(lernzeitStore.subscribe, lernzeitStore.getSnapshot, lernzeitStore.getServerSnapshot);
  function wechseln(v: ReviewFilter) {
    try { appStorage.setItem("tagesrunde-filter", v); setArt(v); setBestaetigen(false); }
    catch (e) { setFehler(fehlertext(e)); }
  }
  function neueRunde() {
    try {
      const key = reviewSessionKey(art), alt = appStorage.getItem(key);
      if (alt !== null) appStorage.setItem(`tagesrunde-archiv-${Date.now()}-${art}-${globalThis.crypto.randomUUID()}`, alt);
      appStorage.removeItem(key);
      setNummer(n => n + 1); setBestaetigen(false); setFehler("");
    } catch (e) { setFehler(fehlertext(e)); }
  }
  return <div className={styles.werkstatt}>
    <header className={styles.hero}>
      <span className={styles.kicker}>Deine gemeinsame Tagesrunde</span>
      <h1>Ein bisschen üben. Viel verbinden.</h1>
      <p>Fällige Wiederholungen zuerst, danach neue Aufgaben aus verschiedenen Lernbereichen. Du kannst jederzeit Pause machen.</p>
      <div className={styles.zeichen} aria-hidden="true">⌂ <span>+ ×</span> Aa</div>
    </header>
    <section className={styles.auswahl} aria-label="Deine Runde wählen">
      <LernzeitWahl />
      <p className={styles.hinweis}>Die Zeitwahl gilt für die nächste Runde. Jede Auswahl behält ihre angefangene Runde.</p>
      <div className={styles.filter}>{filter.map(f => <button key={f.id} aria-pressed={art === f.id} onClick={() => wechseln(f.id)}><strong>{f.titel}</strong><span>{f.erklaerung}</span></button>)}</div>
      {!bestaetigen ? <button className={styles.textknopf} onClick={() => setBestaetigen(true)}>Neue Runde mit gewählter Zeit</button> : <div className={styles.bestaetigung}>
        <p>Die aktuelle Runde wird archiviert. Möchtest du eine neue Runde beginnen?</p>
        <button className="hauptaktion" onClick={neueRunde}>Neue Runde beginnen</button><button className={styles.textknopf} onClick={() => setBestaetigen(false)}>Aktuelle Runde behalten</button>
      </div>}
    </section>
    {(fehler || reviewStorageError()) && <p role="alert" className={styles.fehler}>{fehler || "Der Wiederholungsstand kann nicht gelesen werden. Bitte sichere deine Daten, bevor du weiterarbeitest."} <Link href="/fortschritt">Zur Datensicherung</Link></p>}
    <Runde key={`${art}:${nummer}`} art={art} minuten={minuten} />
  </div>;
}

function Runde({ art, minuten, planId }: { art: ReviewFilter; minuten: number; planId?:string }) {
  const speicherKey=planId!==undefined ? planRundenKey(planId) : reviewSessionKey(art);
  const [geladen] = useState(() => {
    const raw=appStorage.getItem(speicherKey);
    if(raw!==null) {
      const stand=parseReviewSession(raw);
      const passend=planId===undefined || !!stand && stand.filter==="alles" && stand.id.startsWith(`plan-runde-${planId}:`) && stand.tasks.reduce((sum,t)=>sum+t.sekunden,0)<=stand.minuten*60*.8+1 && (stand.index<stand.tasks.length || stand.tasks.every(t=>stand.results[reviewKey(t.ref)]));
      return {raw,stand:passend?stand:null,fehler:""};
    }
    if(planId===undefined)return {raw,stand:createReviewSession(art,minuten),fehler:""};
    const block=ladeAktuellenPlanBlock(),plan=ladePruefungsPlan();
    if(!planId || planId.length>200 || !block || block.id!==planId || block.art!=="tagesrunde" || block.minuten===90 || !plan?.bloecke.some(b=>b.id===planId && b.status!=="empfohlen"))return {raw,stand:null,fehler:"Diese geplante Runde wurde nicht gestartet oder ihr Planbezug fehlt. Öffne die Empfehlung erneut im Prüfungsfahrplan. Andere Runden bleiben erhalten."};
    const pool=new Map(getReviewTasks().map(t=>[reviewKey(t.ref),t]));
    const tasks=block.aufgabeIds.map(id=>pool.get(id));
    if(!tasks.length || tasks.some(t=>!t) || tasks.reduce((sum,t)=>sum+(t?.sekunden??0),0)>block.minuten*60*.8+1)return {raw,stand:null,fehler:"Die geplante Aufgabenliste ist nicht mehr vollständig verfügbar. Es wurden keine Ersatzaufgaben gewählt. Bitte öffne deinen Prüfungsfahrplan."};
    const stand:ReviewSession={version:1,id:`plan-runde-${planId}:${globalThis.crypto.randomUUID()}`,filter:"alles",minuten:block.minuten,startedAt:Date.now(),index:0,tasks:tasks.map(t=>freezeReviewTask(t!)),answers:{},results:{}};
    return {raw,stand,fehler:""};
  });
  function schreibe(neu:ReviewSession) {
    if(planId===undefined)saveReviewSession(neu);
    else appStorage.setItem(speicherKey,JSON.stringify(neu));
  }
  const [stand, setStand] = useState(geladen.stand);
  const aktuell = useRef(stand);
  const [fehler, setFehler] = useState("");
  function speichern(neu: ReviewSession) {
    try { schreibe(neu); aktuell.current = neu; setStand(neu); setFehler(""); return true; }
    catch (e) { setFehler(fehlertext(e)); return false; }
  }
  useEffect(() => {
    try {
      if (geladen.raw === null && geladen.stand?.tasks.length) {
        if(planId===undefined)saveReviewSession(geladen.stand);
        else appStorage.setItem(speicherKey,JSON.stringify(geladen.stand));
      }
      // The answer and result are saved before updating the common scheduler.
      // Replaying finishes an interrupted write without counting it twice.
      for (const r of Object.values(geladen.stand?.results ?? {})) { recordReviewResult(r); syncWerkstattReviewNachweise(r); }
    } catch (e) { queueMicrotask(() => setFehler(fehlertext(e))); }
  }, [geladen,planId,speicherKey]);
  useEffect(()=>{
    if(planId===undefined || !stand || !stand.tasks.length || stand.index!==stand.tasks.length || !stand.tasks.every(t=>stand.results[reviewKey(t.ref)]))return;
    try {
      const plan=ladePruefungsPlan(),block=plan?.bloecke.find(b=>b.id===planId);
      if(!plan || !block)throw new Error("Die Runde ist gespeichert; der zugehörige Fahrplan kann gerade nicht aktualisiert werden.");
      if(block.status!=="erledigt")speicherePruefungsPlan(erledigePlanBlock(plan,planId));
      const aktuellBlock=ladeAktuellenPlanBlock();
      if(aktuellBlock?.id===planId && aktuellBlock.status!=="erledigt")merkeAktuellenPlanBlock({...aktuellBlock,status:"erledigt"});
    }catch(e){queueMicrotask(()=>setFehler(fehlertext(e)));}
  },[planId,stand]);
  if (!stand) return <section className={styles.karte}><h2>Deine angefangene Runde bleibt erhalten.</h2><p role="alert">{geladen.fehler || "Dieser Stand lässt sich gerade nicht lesen. Er wird nicht überschrieben. Erstelle eine Sicherung oder beginne oben ausdrücklich eine neue Runde; dabei wird der bisherige Stand archiviert."}</p><Link href="/fortschritt">Datensicherung öffnen →</Link></section>;
  if (!stand.tasks.length) return <section className={styles.karte}><h2>Für diese Zeit passt gerade keine Aufgabe.</h2><p>Wähle einen anderen Mix oder mehr Zeit. Eine längere Rechenkette bleibt vollständig und wird nicht in eine zu kurze Runde gepackt.</p><Link href="/lernen">Zum Lernpfad →</Link></section>;
  const task = stand.tasks[stand.index], key = task ? reviewKey(task.ref) : "", answer = stand.answers[key] ?? emptyReviewAnswer(), result = stand.results[key];
  const scope = `tagesrunde:${stand.id}:${key}`;
  function aendern(update: Partial<ReviewAnswer>) {
    const s = aktuell.current!;
    if (s.results[key]) return;
    speichern({ ...s, answers: { ...s.answers, [key]: { ...(s.answers[key] ?? emptyReviewAnswer()), ...update } } });
  }
  function hilfe(id: string) { const a = aktuell.current!.answers[key] ?? emptyReviewAnswer(); if (!a.hilfen.includes(id)) aendern({ hilfen: [...a.hilfen, id] }); }
  function bewerten(b: Bewertung, kontext?: BewertungsKontext) {
    const s = aktuell.current!;
    if (s.results[key]) return;
    let a = s.answers[key] ?? emptyReviewAnswer();
    if (task.payload.typ === "bild" && !a.aktivitaet) a = { ...a, aktivitaet: starteAktivitaet(task.payload.aufgabe.aktivitaet) };
    if (task.payload.typ === "fachwissen") {
      try { const raw: unknown = JSON.parse(appStorage.getItem(`review-antwort-${scope}:${task.payload.aufgabe.id}`) ?? "null"); if (raw && typeof raw === "object" && !Array.isArray(raw) && Object.values(raw).every(v => typeof v === "string")) a = { ...a, original: raw as Record<string, string> }; } catch { /* no archived text for a purely visual self-assessment */ }
    }
    let r: ReviewResult = createReviewResult(task.ref,`${s.id}:${key}`,b,{ hilfen: [...new Set([...a.hilfen, ...(kontext?.mitHilfe ? ["Antwortmöglichkeiten"] : [])])], selbstBewertet: kontext?.selbstBewertet, nachErklaerung: kontext?.nachErklaerung });
    try { r = mitWerkstattReviewKontext(r); } catch (e) { setFehler(fehlertext(e)); return; }
    const p=task.payload;
    if(p.typ==="aufbau"){const e=pruefeAufbauAufgabe(p.aufgabe,a.schritte??{});if(e)r.hinweise=aufbauNacharbeit(p.aufgabe,a.schritte??{},e);}
    if(p.typ==="mathe"){const e=pruefeMathe(p.aufgabe,a.wert,a.einheit);if(e)r.hinweise=basisNacharbeit(p.aufgabe,task.ref.lernzielIds[0],task.titel,e);}
    if(p.typ==="bild"&&a.aktivitaet)r.hinweise=bildNacharbeit(p.aufgabe,a.aktivitaet);
    if(p.typ==="projekt")r.hinweise=transferNacharbeit(p.aufgabe,b==="richtig",a.einheit);
    if (!speichern({ ...s, answers: { ...s.answers, [key]: a }, results: { ...s.results, [key]: r } })) return;
    try { recordReviewResult(r); syncWerkstattReviewNachweise(r); } catch (e) { setFehler(fehlertext(e)); }
  }
  function navigieren(index: number) { speichern({ ...aktuell.current!, index }); }
  if (!task) return <section className={styles.karte}>
    <span className={styles.kicker}>Runde abgeschlossen</span><h2>Du hast Zusammenhänge geübt.</h2>
    {fehler && <p role="alert" className={styles.fehler}>{fehler}</p>}
    <p>{Object.keys(stand.results).length} von {stand.tasks.length} Aufgaben bearbeitet. {Object.values(stand.results).filter(r => r.bewertung === "richtig").length} Antworten waren richtig.</p>
    <p>Genutzte Hilfen und Selbsteinschätzungen bleiben erkennbar. Was noch unsicher ist, kommt früher wieder.</p>
    <div className={styles.ergebnisliste}>{stand.tasks.map((t, i) => <button key={reviewKey(t.ref)} onClick={() => navigieren(i)}><span>{i + 1}. {t.titel}</span><strong>{bewertungsText(stand.results[reviewKey(t.ref)]?.bewertung)}</strong></button>)}</div>
    <Link className="hauptaktion" href="/ueben">Im Übungsraum weiter →</Link>
  </section>;
  return <section className={styles.karte} aria-label="Aktuelle Aufgabe" data-aufgabe-id={task.ref.id} data-aufgabe-text={task.titel}>
    <header className={styles.kopf}><div><span className={styles.kicker}>{quellen[task.ref.quelle]}</span><h2>{task.titel}</h2></div><span className={styles.zaehler}>{stand.index + 1} / {stand.tasks.length}</span></header>
    <progress className={styles.fortschritt} value={Object.keys(stand.results).length} max={stand.tasks.length} aria-label="Bearbeitete Aufgaben" />
    <p className={styles.hinweis}>Diese Runde: etwa {stand.minuten} Minuten · ohne Zeitdruck · automatisch auf diesem Gerät gespeichert</p>
    {fehler && <p role="alert" className={styles.fehler}>{fehler}</p>}
    {result ? <div className={styles.feedback}>
      <h3 role="status">{bewertungsText(result.bewertung)}</h3>
      <GespeicherteAntwort task={task} answer={answer} />
      <Loesung task={task} />
      <Nacharbeit hinweise={result.hinweise} hilfen={result.hilfen}/>
      {(result.hilfen.length > 0 || result.selbstBewertet || result.nachErklaerung) && <p className={styles.hinweis}>{[result.selbstBewertet ? "Selbsteinschätzung" : "", result.hilfen.length ? `Mit Hilfe: ${[...new Set(result.hilfen.map(h=>h.startsWith("begriff:")?"Begriffserklärung":h))].join(", ")}` : "", result.nachErklaerung ? "Direkt nach einer Erklärung bearbeitet" : ""].filter(Boolean).join(" · ")}. Das verlängert die langfristigen Erfolgsabstände nicht.</p>}
    </div> : task.payload.typ === "fachwissen" ? <AufgabenKontext.Provider value={scope}><AufgabeSwitch key={scope} aufgabe={task.payload.aufgabe} onErgebnis={bewerten} modus="pruefung" /></AufgabenKontext.Provider> : <EigeneAufgabe task={task} answer={answer} onChange={aendern} onHilfe={hilfe} onErgebnis={bewerten} />}
    {!result && <LernLink className={styles.textknopf} href={task.route} onClick={() => hilfe("Erklärung geöffnet")}>Erklärung im Lernbereich öffnen ↗</LernLink>}
    <footer className={styles.fuss}><button disabled={stand.index === 0} onClick={() => navigieren(stand.index - 1)}>← Zurück</button><button className="hauptaktion" disabled={!result} onClick={() => navigieren(stand.index + 1)}>{stand.index + 1 === stand.tasks.length ? "Runde abschließen →" : "Nächste Aufgabe →"}</button></footer>
  </section>;
}

function bewertungsText(b?: Bewertung) { return b === "richtig" ? "Das passt!" : b === "teilweise" ? "Ein Teil passt schon." : b === "falsch" ? "Hier üben wir weiter." : "Noch offen"; }

function EigeneAufgabe({ task, answer, onChange, onHilfe, onErgebnis }: { task: ReviewTask; answer: ReviewAnswer; onChange: (v: Partial<ReviewAnswer>) => void; onHilfe: (id: string) => void; onErgebnis: (b: Bewertung) => void }) {
  const begriff=(id:string)=>{onHilfe(`begriff:${id}`);oeffneGlossarBegriff(id);};
  const text=(t:string)=><GlossarText text={t} onBegriff={begriff}/>;
  if (task.payload.typ === "aufbau") {
    const a = task.payload.aufgabe, r = pruefeAufbauAufgabe(a, answer.schritte ?? {});
    return <div className={styles.aufgabe}><p>{text(a.frage)}</p><ul>{a.gegeben.map(g => <li key={g}>{text(g)}</li>)}</ul>
      {a.schritte.map((s, i) => <fieldset className={styles.schritt} key={s.id}><legend>{i + 1}. {s.label}</legend><div className={styles.eingaben}><label>Ergebnis: {s.label}<input inputMode="decimal" value={answer.schritte?.[s.id]?.wert ?? ""} onChange={e => onChange({ schritte: { ...answer.schritte, [s.id]: { wert: e.target.value, einheit: answer.schritte?.[s.id]?.einheit ?? "" } } })} /></label><label>Einheit: {s.label}<select value={answer.schritte?.[s.id]?.einheit ?? ""} onChange={e => onChange({ schritte: { ...answer.schritte, [s.id]: { wert: answer.schritte?.[s.id]?.wert ?? "", einheit: e.target.value } } })}><option value="">Bitte wählen</option>{s.einheiten.map(e => <option key={e}>{e}</option>)}</select></label></div><p className={styles.hinweis}>{s.ganzzahl ? "Ganze Zahl angeben." : `Auf ${s.stellen} Nachkommastellen runden.`} Rechne mit ungerundeten Zwischenwerten weiter.</p></fieldset>)}
      <details className={styles.hilfe} onToggle={e => { if (e.currentTarget.open) onHilfe("Formelhinweise"); }}><summary>Ich brauche einen Ansatz</summary><ul>{a.schritte.map(s => <li key={s.id}>{s.label}: {s.formel}</li>)}</ul></details>
      <button className="hauptaktion" disabled={r === null} onClick={() => { if (r) onErgebnis(r.bewertung); }}>Meine Rechenkette prüfen</button></div>;
  }
  if (task.payload.typ === "projekt") {
    const a = task.payload.aufgabe, r = pruefeProjektTransfer(a, answer.wert);
    return <div className={styles.aufgabe}><p>{text(a.frage)}</p><div className={styles.eingaben}><label>Dein Ergebnis<input inputMode="decimal" value={answer.wert} onChange={e => onChange({ wert: e.target.value })} /></label><label>Einheit<select value={answer.einheit} onChange={e => onChange({ einheit: e.target.value })}><option value="">Bitte wählen</option>{[...new Set([a.einheit, "m", "m²", "cm", "Stück", "mm", "m²K/W"])].map(e => <option key={e}>{e}</option>)}</select></label></div><p className={styles.hinweis}>Dezimalzahlen sind möglich. Die Einheit gehört zu deiner Antwort.</p><button className="hauptaktion" disabled={r === null || !answer.einheit} onClick={() => { if (r) onErgebnis(answer.einheit === a.einheit ? r : "falsch"); }}>Meine Antwort prüfen</button></div>;
  }
  if (task.payload.typ === "bild") {
    const a = task.payload.aufgabe, antwort = answer.aktivitaet ?? starteAktivitaet(a.aktivitaet);
    return <BildAntwortKarte aufgabe={a} antwort={antwort} geprueft={false} onChange={aktivitaet => onChange({ aktivitaet })} onPruefen={() => onErgebnis(pruefeBildAufgabe(a, antwort))} onBegriff={begriff}/>;
  }
  if (task.payload.typ === "mathe") {
    const m = task.payload.aufgabe, r = pruefeMathe(m, answer.wert, answer.einheit);
    return <div className={styles.aufgabe}><p>{text(m.frage)}</p><ul>{m.gegeben.map(g => <li key={g}>{text(g)}</li>)}</ul>
      <div className={styles.eingaben}><label>Dein Ergebnis<input inputMode="decimal" value={answer.wert} onChange={e => onChange({ wert: e.target.value })} /></label><label>Einheit<select value={answer.einheit} onChange={e => onChange({ einheit: e.target.value })}><option value="">Bitte wählen</option>{m.einheiten.map(e => <option key={e}>{e}</option>)}</select></label></div>
      {answer.wert.trim() && r === null && <p className={styles.hinweis}>Gib eine Zahl ohne Einheit ein und wähle die Einheit daneben.</p>}
      <details className={styles.hilfe} onToggle={e => { if (e.currentTarget.open) onHilfe("Formelhinweis"); }}><summary>Ich brauche einen Ansatz</summary><p>{m.formel}</p></details>
      <button className="hauptaktion" disabled={r === null} onClick={() => { if (r) onErgebnis(r.richtig ? "richtig" : "falsch"); }}>Meine Antwort prüfen</button>
    </div>;
  }
  if (task.payload.typ === "sprache") {
    const s = task.payload.aufgabe, r = pruefeSprachAntwort(s, { ...answer, geprueft: false });
    return <div className={styles.aufgabe}><p>{s.frage}</p>{s.typ === "wahl" ? <fieldset className={styles.optionen}><legend className="sr-only">Deine Antwort</legend>{s.optionen.map((o, i) => <label key={`${i}:${o}`}><input type="radio" name={reviewKey(task.ref)} checked={answer.wahl === String(i)} onChange={() => onChange({ wahl: String(i) })} /><span>{o}</span></label>)}</fieldset> : <div className={styles.paare}>{s.paare.map(p => <label key={p.links}><span>{p.links}</span><select value={answer.paare[p.links] ?? ""} onChange={e => onChange({ paare: { ...answer.paare, [p.links]: e.target.value } })}><option value="">Bedeutung wählen</option>{mischeAnzeige(s.paare, task.ref.id).map(z => <option key={z.rechts}>{z.rechts}</option>)}</select></label>)}</div>}
      <details className={styles.hilfe} onToggle={e => { if (e.currentTarget.open) onHilfe("Sprachhinweis"); }}><summary>Ein kleiner Hinweis</summary><p>{s.tipp}</p></details><button className="hauptaktion" disabled={r === null} onClick={() => { if (r !== null) onErgebnis(r ? "richtig" : "falsch"); }}>Meine Antwort prüfen</button></div>;
  }
  return null;
}

function Loesung({ task }: { task: ReviewTask }) {
  const p = task.payload;
  if (p.typ === "mathe") return <div><h4>So geht der Rechenweg</h4><p>{p.aufgabe.formel} → {p.aufgabe.einsetzen} = {p.aufgabe.wert.toLocaleString("de-DE")} {p.aufgabe.einheit}</p><p>{p.aufgabe.erklaerung}</p></div>;
  if (p.typ === "sprache") return <div><h4>Die passende Lösung</h4>{p.aufgabe.typ === "wahl" ? <p>{p.aufgabe.optionen[p.aufgabe.korrekt]}</p> : <ul>{p.aufgabe.paare.map(z => <li key={z.links}>{z.links}: {z.rechts}</li>)}</ul>}<p>{p.aufgabe.erklaerung}</p></div>;
  if (p.typ === "aufbau") return <div><h4>So hängt die Rechenkette zusammen</h4><ol>{p.aufgabe.schritte.map(s => <li key={s.id}><strong>{s.label}:</strong> {s.formel} → {s.einsetzen} = {s.wert.toLocaleString("de-DE", { maximumFractionDigits: s.stellen })} {s.einheit}</li>)}</ol><p>{p.aufgabe.erklaerung}</p></div>;
  if (p.typ === "projekt") return <div><h4>Der Zusammenhang auf der Baustelle</h4><p>{p.aufgabe.erklaerung}</p></div>;
  if (p.typ === "bild") {
    const a = p.aufgabe.aktivitaet;
    return <div><SafeSvg markup={p.aufgabe.svg} /><p>{p.aufgabe.bildbeschreibung}</p><h4>Darauf kommt es an</h4><p>{a.erklaerung}</p>{a.typ === "zuordnen" ? <ul>{a.paare.map(z => <li key={z.id}>{z.links}: {z.rechts}</li>)}</ul> : a.typ === "reihenfolge" ? <ol>{a.schritte.map(s => <li key={s.id}>{s.text}</li>)}</ol> : <ul>{a.optionen.filter(o => o.korrekt).map(o => <li key={o.id}>{o.text}</li>)}</ul>}</div>;
  }
  const a = p.aufgabe;
  return <div><h4>Lösung und Zusammenhang</h4>
    {a.typ === "mc" && <ul>{a.korrekt.map(i => <li key={i}>{a.optionen[i]}</li>)}</ul>}
    {a.typ === "cloze" && <p>{a.text.replace(/\{\{(.+?)\}\}/g, "$1")}</p>}
    {a.typ === "calc" && <ol>{berechneSchritte(a.schritte, Object.fromEntries(a.parameter.map(p => [p.name, p.min]))).map((s, i) => <li key={i}>{s.beschreibung}: {s.wert.toLocaleString("de-DE")} {s.einheit}</li>)}</ol>}
    {a.typ === "diagram" && <><SafeSvg markup={a.svg} /><ul>{Object.entries(a.zuordnung).map(([id, text]) => <li key={id}>{id}: {text}</li>)}</ul></>}
    {a.typ === "draw" && <><SafeSvg markup={a.loesungSvg} /><ul>{a.schritte.map(s => <li key={s}>{s}</li>)}</ul></>}
    {a.typ === "fachbegriff" && <p><strong>{a.begriff}:</strong> {a.definition}</p>}
    <p>{a.erklaerung}</p>
  </div>;
}

function GespeicherteAntwort({ task, answer }: { task: ReviewTask; answer: ReviewAnswer }) {
  if (task.payload.typ === "mathe") return <p><strong>Deine Antwort:</strong> {answer.wert} {answer.einheit}</p>;
  if (task.payload.typ === "sprache") return <div><strong>Deine Antwort:</strong>{task.payload.aufgabe.typ === "wahl" ? <p>{task.payload.aufgabe.optionen[Number(answer.wahl)]}</p> : <ul>{Object.entries(answer.paare).map(([k, v]) => <li key={k}>{k}: {v}</li>)}</ul>}</div>;
  if (task.payload.typ === "projekt") return <p><strong>Deine Antwort:</strong> {answer.wert} {answer.einheit}</p>;
  if (task.payload.typ === "aufbau") return <div><strong>Deine Rechenschritte:</strong><ul>{task.payload.aufgabe.schritte.map(s => <li key={s.id}>{s.label}: {answer.schritte?.[s.id]?.wert} {answer.schritte?.[s.id]?.einheit}</li>)}</ul></div>;
  if (task.payload.typ === "bild") {
    const a = task.payload.aufgabe.aktivitaet, v = answer.aktivitaet;
    return <div><strong>Deine gespeicherte Antwort:</strong><ul>{a.typ === "zuordnen" ? a.paare.map(p => <li key={p.id}>{p.links}: {a.paare.find(z => z.id === v?.zuordnung[p.id])?.rechts ?? "Nicht gewählt"}</li>) : a.typ === "reihenfolge" ? v?.reihenfolge.map((id, i) => <li key={id}>{i + 1}. {a.schritte.find(s => s.id === id)?.text}</li>) : v?.auswahl.map(id => <li key={id}>{a.optionen.find(o => o.id === id)?.text}</li>)}</ul></div>;
  }
  const a = task.payload.aufgabe;
  const werte = Object.entries(answer.original ?? {}).filter(([k]) => !k.endsWith("abruf")).flatMap(([, raw]) => {
    try {
      const v: unknown = JSON.parse(raw);
      if (typeof v === "string") return v.trim() ? [v] : [];
      if (v && typeof v === "object" && "__set" in v && Array.isArray(v.__set) && a.typ === "mc") return v.__set.filter((i): i is number => Number.isInteger(i)).map(i => a.optionen[i]).filter(Boolean);
      if (v && typeof v === "object" && !Array.isArray(v)) return Object.values(v).filter((x): x is string => typeof x === "string" && !!x.trim());
    } catch { /* old draft fields can be absent */ }
    return [];
  });
  return werte.length ? <div><strong>Deine gespeicherte Antwort:</strong><ul>{werte.map((v, i) => <li key={i}>{v}</li>)}</ul></div> : null;
}
