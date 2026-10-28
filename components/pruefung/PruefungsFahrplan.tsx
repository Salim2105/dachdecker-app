"use client";
import { useState, useSyncExternalStore } from "react";
import { LernLink } from "@/components/LernLink";
import { datumStore } from "@/lib/appStores";
import { appStorage } from "@/lib/lernSpeicher";
import { VORBEREITUNGS_PROFIL } from "@/lib/pruefungsVorbereitungTypen";
import {
 PRUEFUNGS_PLAN_KEY, PLAN_EVENT, ladePruefungsPlan, parsePruefungsPlan, erstelleWochenplan,
 kalenderTag, startePlanBlock, merkeAktuellenPlanBlock, speicherePruefungsPlan, erledigePlanBlock,
 type PruefungsPlan, type PlanBlock, type TagesBudget,
} from "@/lib/pruefungsPlan";

const panel={background:"var(--surface)",borderColor:"var(--border)"};
const input={background:"var(--surface-2)",borderColor:"var(--border)",color:"var(--text)"};
const TAGE=["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];
const datumText=(d:string)=>new Intl.DateTimeFormat("de-DE",{weekday:"short",day:"2-digit",month:"2-digit",timeZone:"UTC"}).format(new Date(`${d}T12:00:00Z`));
const subscribe=(cb:()=>void)=>{window.addEventListener(PLAN_EVENT,cb);window.addEventListener("storage",cb);return()=>{window.removeEventListener(PLAN_EVENT,cb);window.removeEventListener("storage",cb);};};
const snapshot=()=>appStorage.getItem(PRUEFUNGS_PLAN_KEY);
const serverSnapshot=()=>null;
function BudgetOptionen(){return <>{[0,5,15,30].map(m=><option key={m} value={m}>{m?`${m} Minuten`:"Lernfrei"}</option>)}</>;}

export function PruefungsPlanHinweis(){
 const raw=useSyncExternalStore(subscribe,snapshot,serverSnapshot);
 const datum=useSyncExternalStore(datumStore.subscribe,datumStore.getSnapshot,datumStore.getServerSnapshot);
 const [now]=useState(()=>Date.now());
 if(!raw)return null;
 const plan=parsePruefungsPlan(raw);
 if(!plan)return <aside className="mt-4 rounded-2xl border p-4" style={panel}><p>Dein Prüfungsfahrplan braucht Aufmerksamkeit. Die gespeicherten Daten bleiben erhalten.</p><LernLink href="/pruefung#fahrplan" className="mt-2 inline-block underline">Fahrplan öffnen →</LernLink></aside>;
 const tag=erstelleWochenplan(plan,datum,now).find(t=>t.bloecke.some(b=>b.status!=="erledigt")),block=tag?.bloecke.find(b=>b.status!=="erledigt");
 return <aside className="mt-4 rounded-2xl border p-4" style={panel} aria-label="Dein nächster Schritt im Prüfungsfahrplan"><strong>Dein Prüfungsfahrplan</strong><p className="mt-1 text-sm" style={{color:"var(--text-muted)"}}>{block?`${datumText(block.datum)} · ${block.minuten} Minuten: ${block.ziel}`:"Für die nächsten Tage ist kein Lernblock eingeplant. Du kannst deine verfügbaren Zeiten anpassen."}</p><LernLink href="/pruefung#fahrplan" className="mt-3 inline-block font-semibold underline underline-offset-4" style={{color:"var(--accent)"}}>Wochenplan öffnen →</LernLink></aside>;
}

export function PruefungsFahrplan(){
 const [plan,setPlan]=useState(ladePruefungsPlan);
 const datum=useSyncExternalStore(datumStore.subscribe,datumStore.getSnapshot,datumStore.getServerSnapshot);
 const [now]=useState(()=>Date.now());
 const [fehler,setFehler]=useState("");
 const [ansicht,setAnsicht]=useState(7);
 const [von,setVon]=useState(()=>kalenderTag(now));
 const [bis,setBis]=useState(()=>kalenderTag(now));
 const [ausnahmeMinuten,setAusnahmeMinuten]=useState<TagesBudget>(0);
 const [grund,setGrund]=useState("Urlaub oder Blockunterricht");
 const [musterDatum,setMusterDatum]=useState(()=>kalenderTag(now));
 const [aktiv,setAktiv]=useState(()=>appStorage.getItem(PRUEFUNGS_PLAN_KEY)!==null);
 if(!plan)return <section className="rounded-2xl border p-5" style={panel}><h2 className="text-xl font-bold">Dein Fahrplan bleibt erhalten.</h2><p role="alert" className="mt-2">Der gespeicherte Plan kann nicht gelesen werden. Bitte sichere deine Daten, bevor du einen neuen Plan anlegst.</p><LernLink href="/fortschritt" className="mt-4 inline-block underline">Zur Datensicherung →</LernLink></section>;
 const heute=kalenderTag(now,plan.zeitzone),wochen=erstelleWochenplan(plan,datum,now);
 function speichern(neu:PruefungsPlan):boolean{
  try{speicherePruefungsPlan(neu);setPlan(neu);setAktiv(true);setFehler("");return true;}catch(e){setFehler(e instanceof Error?e.message:"Der Plan konnte nicht gespeichert werden.");return false;}
 }
 function beginnen(block:PlanBlock):boolean{
  try{const neu=startePlanBlock(plan!,block),gestartet=neu.bloecke.find(b=>b.id===block.id)!;speicherePruefungsPlan(neu);if(gestartet.art==="tagesrunde")merkeAktuellenPlanBlock(gestartet);setPlan(neu);setAktiv(true);setFehler("");return true;}catch(e){setFehler(e instanceof Error?e.message:"Die Runde konnte nicht gestartet werden.");return false;}
 }
 function ausnahmeHinzufuegen(){
  if(!von||!bis||bis<von){setFehler("Wähle einen gültigen Zeitraum. Das Ende muss am selben Tag oder nach dem Beginn liegen.");return;}
  speichern({...plan!,ausnahmen:[...plan!.ausnahmen,{id:globalThis.crypto.randomUUID(),von,bis,minuten:ausnahmeMinuten,grund:grund.trim()||"Abweichende Lernzeit"}]});
 }
 return <div className="space-y-6">
  <header className="rounded-[24px] border p-6" style={{...panel,background:"var(--tint-teal)",color:"var(--on-tint-teal)"}}><p className="text-xs font-bold uppercase tracking-wider">DEIN ZIEL. DEINE VERFÜGBARE ZEIT.</p><h2 className="mt-2 text-3xl font-bold">Dein Prüfungsfahrplan</h2><p className="mt-3">{VORBEREITUNGS_PROFIL.titel}</p><p className="mt-1 text-sm">{VORBEREITUNGS_PROFIL.hinweis}</p><p className="mt-4 max-w-prose">Fällige Wiederholungen und passende Lernschritte werden innerhalb deiner Zeit verteilt. Ausgefallene Tage erzeugen kein zusätzliches Pflichtpensum.</p></header>
  {fehler&&<p role="alert" className="rounded-xl border p-4" style={{borderColor:"var(--bad)",color:"var(--bad)"}}>{fehler}</p>}
  <section className="rounded-2xl border p-5" style={panel} aria-labelledby="fahrplan-einstellungen"><h2 id="fahrplan-einstellungen" className="text-xl font-bold">Wann kannst du lernen?</h2><label className="mt-4 block font-semibold">Mein Prüfungstermin<input type="date" className="mt-2 block min-h-12 rounded-xl border p-3" style={input} value={datum} onChange={e=>datumStore.set(e.target.value)}/></label><p className="mt-2 text-sm" style={{color:"var(--text-muted)"}}>{!datum?"Ohne Termin zeigen wir eine rollierende Vorschau für vier Wochen.":datum<heute?"Dein Prüfungstermin liegt in der Vergangenheit. Bitte passe ihn an; es entsteht kein Nachholpensum.":"Wir planen bis zu deinem Termin, höchstens vier Wochen im Voraus."}</p>
   <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{TAGE.map((name,i)=><label key={name} className="flex min-w-0 flex-col gap-2 text-sm font-semibold">Zeit am {name}<select aria-label={`Lernzeit am ${name}`} className="min-h-12 rounded-xl border p-3" style={input} value={plan.wochentage[i]} onChange={e=>speichern({...plan,wochentage:plan.wochentage.map((m,j)=>i===j?Number(e.target.value) as TagesBudget:m)})}><BudgetOptionen/></select></label>)}</div>
   {!aktiv&&<button className="hauptaktion mt-5" onClick={()=>speichern(plan)}>Fahrplan aktivieren</button>}<p className="mt-4 text-sm" style={{color:"var(--text-muted)"}}>Etwa 20 % bleiben für Rückmeldung und Reserve. Eine lange Rechenkette wird nicht in eine zu kurze Runde gepackt. Kalender: {plan.zeitzone}.</p>
  </section>
  <details className="rounded-2xl border p-5" style={panel}><summary className="min-h-10 cursor-pointer font-bold">Urlaub, Blockunterricht und einzelne Ausnahmen</summary><p className="mt-3 text-sm">Lege selbst fest, wie viel Zeit du in diesem Zeitraum hast. Blockunterricht verändert dein Pensum nicht automatisch. Bei überlappenden Zeiträumen gilt der zuletzt hinzugefügte Eintrag.</p>
   <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="flex flex-col gap-2">Von<input type="date" value={von} onChange={e=>setVon(e.target.value)} className="min-h-12 rounded-xl border p-3" style={input}/></label><label className="flex flex-col gap-2">Bis<input type="date" value={bis} onChange={e=>setBis(e.target.value)} className="min-h-12 rounded-xl border p-3" style={input}/></label><label className="flex flex-col gap-2">Abweichende Lernzeit<select value={ausnahmeMinuten} onChange={e=>setAusnahmeMinuten(Number(e.target.value) as TagesBudget)} className="min-h-12 rounded-xl border p-3" style={input}><BudgetOptionen/></select></label><label className="flex flex-col gap-2">Bezeichnung<input value={grund} maxLength={200} onChange={e=>setGrund(e.target.value)} className="min-h-12 rounded-xl border p-3" style={input}/></label></div><button className="mt-4 min-h-12 rounded-xl border px-4 py-2 font-semibold" style={input} onClick={ausnahmeHinzufuegen}>Ausnahme hinzufügen</button>
   {plan.ausnahmen.length>0&&<ul className="mt-4 space-y-3">{plan.ausnahmen.map(a=><li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3" style={input}><span>{a.grund} · {a.von} bis {a.bis} · {a.minuten?`${a.minuten} Minuten`:"lernfrei"}</span><button className="min-h-11 px-3 underline" onClick={()=>speichern({...plan,ausnahmen:plan.ausnahmen.filter(x=>x.id!==a.id)})} aria-label={`Ausnahme ${a.grund} entfernen`}>Entfernen</button></li>)}</ul>}
  </details>
  <section className="rounded-2xl border p-5" style={panel} aria-labelledby="muster-termin"><h2 id="muster-termin" className="text-xl font-bold">Zeit für einen ganzen Musterlauf</h2><p className="mt-2 text-sm">Plane dafür ausdrücklich einen zusätzlichen Termin ein: 90 Minuten App-Training. Das ist keine bestätigte Dortmunder Prüfungsdauer.</p><div className="mt-4 flex flex-wrap items-end gap-3"><label className="flex flex-col gap-2">Zusätzlicher Mustertermin<input type="date" min={heute} value={musterDatum} onChange={e=>setMusterDatum(e.target.value)} className="min-h-12 rounded-xl border p-3" style={input}/></label><button className="min-h-12 rounded-xl border px-4 py-2 font-semibold" style={input} onClick={()=>{if(!musterDatum||musterDatum<heute){setFehler("Wähle einen heutigen oder zukünftigen Mustertermin.");return;}speichern({...plan,musterTermine:[...new Set([...plan.musterTermine,musterDatum])].sort()});}}>Mustertermin einplanen</button></div>
   {plan.musterTermine.length>0&&<ul className="mt-3 space-y-2">{plan.musterTermine.filter(d=>d>=heute).map(d=><li key={d} className="flex flex-wrap items-center gap-3 text-sm"><span>{datumText(d)} · zusätzlich 90 Minuten</span><button className="min-h-11 px-3 underline" onClick={()=>speichern({...plan,musterTermine:plan.musterTermine.filter(x=>x!==d)})} aria-label={`Mustertermin ${d} entfernen`}>Entfernen</button></li>)}</ul>}
  </section>
  <section aria-labelledby="wochenvorschau"><div className="flex flex-wrap items-center justify-between gap-3"><h2 id="wochenvorschau" className="text-2xl font-bold">Deine nächsten Schritte</h2><button className="min-h-11 rounded-xl border px-4 py-2 text-sm" style={input} onClick={()=>setAnsicht(ansicht===7?28:7)}>{ansicht===7?"Vier Wochen anzeigen":"Eine Woche anzeigen"}</button></div><p className="mt-2 text-sm" style={{color:"var(--text-muted)"}}>Angefangene Runden bleiben erhalten. Eine Markierung als bearbeitet steuert deinen Plan; fachliche Lernnachweise entstehen beim Lösen der Aufgaben.</p>
   <div className="mt-4 space-y-3">{wochen.slice(0,ansicht).map(tag=><article key={tag.datum} className="rounded-2xl border p-4" style={panel}><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">{datumText(tag.datum)}{tag.datum===heute?" · Heute":""}</h3><span className="text-sm" style={{color:"var(--text-muted)"}}>{tag.minuten?`${tag.minuten} Minuten inklusive Rückmeldung`:"Lernfrei"}</span></div>{tag.hinweis&&<p className="mt-2 text-sm">{tag.hinweis}</p>}{tag.bloecke.map(block=><div key={block.id} className="mt-3 rounded-xl p-3" style={{background:"var(--surface-2)"}}><strong>{block.titel}{block.status==="erledigt"?" · Bearbeitet ✓":block.status==="begonnen"?" · Angefangen":""}</strong><p className="mt-1 text-sm">{block.ziel}</p><p className="mt-1 text-xs" style={{color:"var(--text-muted)"}}>{block.art==="musterlauf"?"Zusätzlich 90 Minuten":`${block.aufgabeIds.length} vollständige Aufgaben · etwa ${Math.ceil(block.geschaetztSekunden/60)} Minuten Bearbeitung plus Rückmeldung`}</p><div className="mt-3 flex flex-wrap items-center gap-3"><LernLink className="inline-flex min-h-11 items-center rounded-xl border px-4 py-2 font-semibold" style={{...input,color:"var(--accent)"}} href={block.route} onClick={e=>{if(!beginnen(block))e.preventDefault();}}>{block.status==="empfohlen"?"Geplante Runde starten":"Runde öffnen"} →</LernLink>{block.status==="begonnen"&&<button className="min-h-11 px-3 text-sm underline" onClick={()=>speichern(erledigePlanBlock(plan,block.id))}>Als bearbeitet markieren</button>}</div></div>)}</article>)}</div>
  </section>
 </div>;
}
