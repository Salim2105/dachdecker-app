import { appStorage } from "@/lib/lernSpeicher";
import { getReviewTasks, type ReviewTask } from "@/lib/reviewTasks";
import { loadReviewRecords, reviewKey } from "@/lib/review";
import { ladeFortschritt } from "@/lib/progress";
import { ladeLernsignale, lernEmpfehlungen } from "@/lib/lerndiagnose";

export const PRUEFUNGS_PLAN_KEY = "pruefungsfahrplan-v1";
export const PLAN_AKTUELL_KEY = "pruefungsplan-aktuell-v1";
export const PLAN_EVENT = "dachdecker:pruefungsplan";
export type TagesBudget = 0 | 5 | 15 | 30;
export interface PlanAusnahme { id: string; von: string; bis: string; minuten: TagesBudget; grund: string }
export interface PlanBlock {
 id: string; datum: string; minuten: 5 | 15 | 30 | 90; geschaetztSekunden: number;
 titel: string; ziel: string; route: string; aufgabeIds: string[];
 art: "tagesrunde" | "musterlauf"; status: "empfohlen" | "begonnen" | "erledigt";
 gestartetAm?: number; versuchId?: string;
}
export interface PruefungsPlan { version: 1; zeitzone: string; wochentage: TagesBudget[]; ausnahmen: PlanAusnahme[]; musterTermine: string[]; bloecke: PlanBlock[] }
export interface PlanTag { datum: string; minuten: TagesBudget; reserveMinuten: number; bloecke: PlanBlock[]; hinweis?: string }
export interface PlanKandidat { id: string; titel: string; route: string; sekunden: number; faelligAm: number | null; fokus?: boolean; lernzielIds?: string[] }
export interface PlanKontext { aufgaben: PlanKandidat[] }
const BUDGETS = [0,5,15,30] as const;
const text = (v: unknown): v is string => typeof v === "string" && !!v.trim() && v.length < 1200;
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
function datumGueltig(d: unknown): d is string {
 if (typeof d !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
 const date = new Date(`${d}T12:00:00Z`);
 return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === d;
}
function zoneGueltig(z: unknown): z is string {
 if (!text(z)) return false;
 try {new Intl.DateTimeFormat("de-DE",{timeZone:z}).format(0);return true;} catch {return false;}
}
/** Calendar arithmetic must not move a lesson to another day at a DST change. */
export function kalenderTag(now=Date.now(),zone="Europe/Berlin"): string {
 const parts=new Intl.DateTimeFormat("en-CA",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);
 return ["year","month","day"].map(k=>parts.find(t=>t.type===k)!.value).join("-");
}
export function addKalenderTage(datum: string,anzahl: number): string {
 if (!datumGueltig(datum) || !Number.isInteger(anzahl)) throw new Error("Ungültiger Kalendertag.");
 const d=new Date(`${datum}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+anzahl);return d.toISOString().slice(0,10);
}
export function neuerPruefungsPlan(): PruefungsPlan {
 const raw=Number(appStorage.getItem("lernzeit")),m:TagesBudget=raw===5||raw===30?raw:15;
 return {version:1,zeitzone:"Europe/Berlin",wochentage:[m,m,0,m,0,m,0],ausnahmen:[],musterTermine:[],bloecke:[]};
}
function blockGueltig(b:unknown): b is PlanBlock {
 if (!obj(b)||!text(b.id)||!datumGueltig(b.datum)||typeof b.minuten!=="number"||![5,15,30,90].includes(b.minuten)||typeof b.geschaetztSekunden!=="number"||!Number.isFinite(b.geschaetztSekunden)||b.geschaetztSekunden<0||!text(b.titel)||!text(b.ziel)||!text(b.route)||!["tagesrunde","musterlauf"].includes(String(b.art))||!["empfohlen","begonnen","erledigt"].includes(String(b.status))||!Array.isArray(b.aufgabeIds)||!b.aufgabeIds.every(text)||new Set(b.aufgabeIds).size!==b.aufgabeIds.length)return false;
 if (b.art==="tagesrunde"&&(b.minuten===90||b.geschaetztSekunden>b.minuten*60*.8+1||!b.aufgabeIds.length||b.route!==`/heute?plan=${encodeURIComponent(b.id)}`))return false;
 if (b.art==="musterlauf"&&(b.minuten!==90||b.route!=="/pruefung#muster-a"||b.aufgabeIds.length!==0))return false;
 return (b.gestartetAm===undefined||typeof b.gestartetAm==="number"&&Number.isFinite(b.gestartetAm)&&b.gestartetAm>=0)&&(b.versuchId===undefined||text(b.versuchId));
}
export function parsePruefungsPlan(raw:string|null): PruefungsPlan|null {
 if(raw===null)return null;
 try {
  const p:unknown=JSON.parse(raw);
  if(!obj(p)||p.version!==1||!zoneGueltig(p.zeitzone)||!Array.isArray(p.wochentage)||p.wochentage.length!==7||!p.wochentage.every(n=>typeof n==="number"&&(BUDGETS as readonly number[]).includes(n))||!Array.isArray(p.ausnahmen)||!p.ausnahmen.every(a=>obj(a)&&text(a.id)&&datumGueltig(a.von)&&datumGueltig(a.bis)&&a.bis>=a.von&&typeof a.minuten==="number"&&(BUDGETS as readonly number[]).includes(a.minuten)&&typeof a.grund==="string"&&a.grund.length<=1200)||!Array.isArray(p.musterTermine)||!p.musterTermine.every(datumGueltig)||!Array.isArray(p.bloecke)||!p.bloecke.every(blockGueltig)||new Set(p.bloecke.map(b=>b.id)).size!==p.bloecke.length)return null;
  return p as unknown as PruefungsPlan;
 }catch{return null;}
}
export function ladePruefungsPlan(): PruefungsPlan|null {
 const raw=appStorage.getItem(PRUEFUNGS_PLAN_KEY);return raw===null?neuerPruefungsPlan():parsePruefungsPlan(raw);
}
export function speicherePruefungsPlan(plan:PruefungsPlan):void {
 const raw=JSON.stringify(plan);if(!parsePruefungsPlan(raw))throw new Error("Der Prüfungsfahrplan ist unvollständig und wurde nicht überschrieben.");
 appStorage.setItem(PRUEFUNGS_PLAN_KEY,raw);if(typeof window!=="undefined")window.dispatchEvent(new Event(PLAN_EVENT));
}
export function budgetAmTag(plan:PruefungsPlan,datum:string):TagesBudget {
 const ex=[...plan.ausnahmen].reverse().find(a=>a.von<=datum&&a.bis>=datum);
 if(ex)return ex.minuten;
 return plan.wochentage[(new Date(`${datum}T12:00:00Z`).getUTCDay()+6)%7];
}
export function ladePlanKontext(now=Date.now(),tasks:ReviewTask[]=getReviewTasks()):PlanKontext {
 const records=loadReviewRecords(),fach=ladeFortschritt(),fokus=new Set(lernEmpfehlungen(ladeLernsignale(),now).map(h=>h.lernzielId));
 return {aufgaben:tasks.map(t=>({id:reviewKey(t.ref),titel:t.titel,route:t.route,sekunden:t.sekunden,faelligAm:t.ref.quelle==="fachwissen"?fach[t.ref.id]?.faelligAm??null:records[reviewKey(t.ref)]?.faelligAm??null,fokus:t.ref.lernzielIds.some(id=>fokus.has(id)),lernzielIds:t.ref.lernzielIds}))};
}
function waehleAufgaben(kontext:PlanKontext,minuten:TagesBudget,now:number,verwendet:Set<string>,tag:number):PlanKandidat[] {
 let rest=minuten*60*.8;
 const passend=kontext.aufgaben.filter(a=>Number.isFinite(a.sekunden)&&a.sekunden>0&&a.sekunden<=rest&&!verwendet.has(a.id));
 const faellig=passend.filter(a=>a.faelligAm!==null&&a.faelligAm<=now).sort((a,b)=>a.faelligAm!-b.faelligAm!||a.id.localeCompare(b.id));
 const weitere=passend.filter(a=>a.faelligAm===null);
 const verteilen=(liste:PlanKandidat[]):PlanKandidat[]=>{
  const gruppen=new Map<string,PlanKandidat[]>();
  for(const a of liste){const k=a.lernzielIds?.[0]??a.id.split(":")[0];gruppen.set(k,[...(gruppen.get(k)??[]),a]);}
  const queues=[...gruppen.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([,v])=>v),offset=queues.length?tag%queues.length:0,rotiert=[...queues.slice(offset),...queues.slice(0,offset)],aus:PlanKandidat[]=[];
  for(let i=0;i<Math.max(0,...rotiert.map(q=>q.length));i++)for(const q of rotiert)if(q[i])aus.push(q[i]);
  return aus;
 };
 const auswahl:PlanKandidat[]=[],neu=[...verteilen(weitere.filter(a=>a.fokus)),...verteilen(weitere.filter(a=>!a.fokus))];
 let wiederholBudget=minuten===5?rest:minuten===15?300:600;
 for(const a of faellig)if(a.sekunden<=rest&&(a.sekunden<=wiederholBudget||auswahl.length===0)){auswahl.push(a);rest-=a.sekunden;wiederholBudget-=a.sekunden;}
 for(const a of neu)if(a.sekunden<=rest){auswahl.push(a);rest-=a.sekunden;}
 for(const a of faellig)if(!auswahl.includes(a)&&a.sekunden<=rest){auswahl.push(a);rest-=a.sekunden;}
 return auswahl;
}
/** Viewing creates recommendations; starting freezes references. Missed days add no debt. */
export function erstelleWochenplan(plan:PruefungsPlan,pruefungsdatum:string,now=Date.now(),kontext=ladePlanKontext(now)):PlanTag[] {
 const heute=kalenderTag(now,plan.zeitzone),verwendet=new Set(plan.bloecke.filter(b=>b.datum>=kalenderTag(now,plan.zeitzone)).flatMap(b=>b.aufgabeIds)),tage:PlanTag[]=[];
 for(let i=0;i<28;i++){
  const datum=addKalenderTage(heute,i);
  if(datumGueltig(pruefungsdatum)&&pruefungsdatum>=heute&&datum>pruefungsdatum)break;
  const minuten=datum===pruefungsdatum?0:budgetAmTag(plan,datum),begonnen=plan.bloecke.filter(b=>b.datum===datum&&b.art==="tagesrunde"),bloecke=clone(begonnen);
  if(!begonnen.length&&minuten){
   const aufgaben=waehleAufgaben(kontext,minuten,now,verwendet,i);
   if(aufgaben.length){const id=`plan-${datum}-${minuten}`;bloecke.push({id,datum,minuten,geschaetztSekunden:aufgaben.reduce((s,a)=>s+a.sekunden,0),titel:"Deine geplante Tagesrunde",ziel:[...new Set(aufgaben.map(a=>a.titel))].slice(0,3).join(" · "),route:`/heute?plan=${encodeURIComponent(id)}`,aufgabeIds:aufgaben.map(a=>a.id),art:"tagesrunde",status:"empfohlen"});aufgaben.forEach(a=>verwendet.add(a.id));}
  }
  if(plan.musterTermine.includes(datum)){const id=`muster-${datum}`;bloecke.push(clone(plan.bloecke.find(b=>b.id===id)??{id,datum,minuten:90,geschaetztSekunden:5400,titel:"Zusätzlicher App-Musterlauf",ziel:"Zwei Fälle und WiSo ohne Prüfungsdruck erproben",route:"/pruefung#muster-a",aufgabeIds:[],art:"musterlauf",status:"empfohlen"}));}
  const hinweis=datum===pruefungsdatum?"Dein eingetragener Prüfungstag. Kein zusätzliches Tagespensum.":begonnen.some(b=>b.minuten!==minuten)?"Die angefangene Runde behält ihre ursprüngliche Zeitwahl.":minuten&&!bloecke.some(b=>b.art==="tagesrunde")?"Keine passende kurze Aufgabe offen. Eine längere Rechenkette kannst du gesondert einplanen.":undefined;
  tage.push({datum,minuten,reserveMinuten:minuten*.2,bloecke,hinweis});
 }
 return tage;
}
export function startePlanBlock(plan:PruefungsPlan,block:PlanBlock,versuchId?:string,now=Date.now()):PruefungsPlan {
 if(!blockGueltig(block))throw new Error("Diese Empfehlung ist nicht mehr gültig. Bitte den Wochenplan neu öffnen.");
 if(plan.bloecke.some(b=>b.id===block.id))return clone(plan);
 if(block.datum<kalenderTag(now,plan.zeitzone))throw new Error("Dieser Lerntag liegt in der Vergangenheit. Bitte die heutige Empfehlung öffnen.");
 if(block.art==="tagesrunde"){
  const pool=new Map(getReviewTasks().map(t=>[reviewKey(t.ref),t])),tasks=block.aufgabeIds.map(id=>pool.get(id));
  if(tasks.some(t=>!t)||tasks.reduce((s,t)=>s+(t?.sekunden??0),0)>block.minuten*60*.8+1)throw new Error("Die Aufgaben wurden aktualisiert. Bitte den Wochenplan neu öffnen.");
 }
 return {...clone(plan),bloecke:[...clone(plan.bloecke),{...clone(block),status:"begonnen",gestartetAm:now,...(versuchId?{versuchId}:{})}]};
}
export function merkeAktuellenPlanBlock(block:PlanBlock):void {
 if(!blockGueltig(block)||block.status==="empfohlen")throw new Error("Die geplante Runde wurde noch nicht gestartet.");
 appStorage.setItem(PLAN_AKTUELL_KEY,JSON.stringify(block));
}
export function ladeAktuellenPlanBlock():PlanBlock|null {
 try{const b:unknown=JSON.parse(appStorage.getItem(PLAN_AKTUELL_KEY)??"null");return blockGueltig(b)&&b.status!=="empfohlen"?b:null;}catch{return null;}
}
export function erledigePlanBlock(plan:PruefungsPlan,id:string):PruefungsPlan {
 return {...clone(plan),bloecke:plan.bloecke.map(b=>b.id===id?{...clone(b),status:"erledigt"}:clone(b))};
}
