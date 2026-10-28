import type { Aufgabe } from "@/content/schema";
import { getAufgaben, getLernfelder } from "@/lib/content";
import { getCurriculum } from "@/lib/curriculum";
import { schaetzeSekunden } from "@/lib/lernzeit";
import { MATHE_EINHEITEN, type MatheAufgabe } from "@/lib/matheGrundlagen";
import { AUFBAU_EINHEITEN, erzeugeAufbauAufgabe, type AufbauAufgabe, type AufbauAntwort } from "@/lib/matheAufbau";
import { PROJEKT_TRANSFER, instantiateProjektTransfer, type ProjektTransfer } from "@/lib/bauprojekte";
import { BILD_AUFGABEN, type BildAufgabe } from "@/lib/bildtraining";
import type { AktivitaetAntwort } from "@/lib/aktivitaeten";
import { DEUTSCH_EINHEITEN, ENGLISCH_EINHEITEN, type SprachAufgabe } from "@/lib/sprachWerkstatt";
import { berechneSchritte } from "@/lib/calc";
import { instantiateExamQuestion } from "@/lib/exam";
import { appStorage } from "@/lib/lernSpeicher";
import { FALL_THEMEN } from "@/lib/pruefungsFaelle";
import { erzeugePruefungsTransfer, pruefungsTransferFamilie } from "@/lib/pruefungsTransfer";
import { ladeFortschritt } from "@/lib/progress";
import { loadReviewRecords, reviewKey, validReviewRef, validReviewResult, type ReviewRef, type ReviewResult } from "@/lib/review";

export type ReviewPayload = {typ:"fachwissen";aufgabe:Aufgabe} | {typ:"mathe";aufgabe:MatheAufgabe} | {typ:"sprache";aufgabe:SprachAufgabe}
  | {typ:"aufbau";aufgabe:AufbauAufgabe} | {typ:"projekt";aufgabe:ProjektTransfer} | {typ:"bild";aufgabe:BildAufgabe};
export interface ReviewTask { ref: ReviewRef; titel: string; thema: string; route: string; sekunden: number; tief: boolean; payload: ReviewPayload }
export type ReviewFilter = "alles" | "kurz" | "tief";
export interface ReviewAnswer { wert:string; einheit:string; wahl:string; paare:Record<string,string>; hilfen:string[]; original?:Record<string,string>; schritte?:Record<string,AufbauAntwort>; aktivitaet?:AktivitaetAntwort }
export interface ReviewSession {
  version:1; id:string; filter:ReviewFilter; minuten:number; startedAt:number;
  tasks:ReviewTask[]; index:number; answers:Record<string,ReviewAnswer>; results:Record<string,ReviewResult>;
}
export const emptyReviewAnswer = (): ReviewAnswer => ({wert:"",einheit:"",wahl:"",paare:{},hilfen:[]});
const clone = <T,>(v:T):T => JSON.parse(JSON.stringify(v));
let base:ReviewTask[]|undefined;
export function getReviewTasks():ReviewTask[] {
  if(base)return base;
  const goals = new Map<string,string[]>();
  for(const lf of getLernfelder())for(const e of getCurriculum(lf.id)?.kapitel.flatMap(k=>k.einheiten)??[])for(const id of e.aufgabenIds)goals.set(id,[...new Set([...(goals.get(id)??[]),e.id])]);
  const fach:ReviewTask[]=getLernfelder().flatMap(lf=>getAufgaben(lf.id)).map(a=>({
    ref:{quelle:"fachwissen",id:a.id,version:1,lernzielIds:goals.get(a.id)??[`${a.lernfeld}:${a.thema}`]},
    titel:a.thema,thema:a.thema,route:`/lernen/${a.lernfeld}/ueben`,sekunden:schaetzeSekunden(a),tief:a.typ==="calc"&&a.schritte.length>1,payload:{typ:"fachwissen",aufgabe:a},
  }));
  const mathe:ReviewTask[]=MATHE_EINHEITEN.flatMap(e=>e.fragen.map(a=>({ref:{quelle:"mathe" as const,id:a.id,version:e.version,lernzielIds:[e.id]},titel:e.titel,thema:e.titel,route:`/grundlagen/mathe#${e.id}`,sekunden:150,tief:true,payload:{typ:"mathe" as const,aufgabe:a}})));
  const sprache:ReviewTask[]=[...DEUTSCH_EINHEITEN,...ENGLISCH_EINHEITEN].flatMap(e=>e.aufgaben.map(a=>({ref:{quelle:"sprache" as const,id:`${e.sprache}:${a.id}`,version:1,lernzielIds:[`${e.sprache}-${e.id}`]},titel:e.titel,thema:e.titel,route:`/sprache/${e.sprache}#${e.id}`,sekunden:90,tief:false,payload:{typ:"sprache" as const,aufgabe:a}})));
  const aufbau:ReviewTask[]=AUFBAU_EINHEITEN.flatMap(e=>e.aufgabenIds.map(id=>({ref:{quelle:"mathe" as const,id,version:e.version,lernzielIds:[e.id]},titel:e.titel,thema:e.titel,route:`/grundlagen/mathe#${e.id}`,sekunden:240,tief:true,payload:{typ:"aufbau" as const,aufgabe:erzeugeAufbauAufgabe(id,0)}})));
  const projekt:ReviewTask[]=PROJEKT_TRANSFER.map(a=>({ref:{quelle:"projekt",id:a.id,version:a.version,lernzielIds:a.lernzielIds},titel:a.titel,thema:a.titel,route:a.route,sekunden:a.sekunden,tief:true,payload:{typ:"projekt",aufgabe:a}}));
  const bild:ReviewTask[]=BILD_AUFGABEN.map(a=>({ref:{quelle:"bild",id:a.id,version:a.version,lernzielIds:a.lernzielIds},titel:a.titel,thema:a.titel,route:`/bildtraining#${a.id}`,sekunden:a.minuten*60,tief:false,payload:{typ:"bild",aufgabe:a}}));
  const pruefungsTransfer:ReviewTask[]=FALL_THEMEN.map(f=>{
    const a=erzeugePruefungsTransfer(f.id);
    return {ref:{quelle:"projekt",id:a.id,version:a.version,lernzielIds:a.lernzielIds},titel:a.titel,thema:a.titel,route:a.route,sekunden:a.sekunden,tief:true,payload:{typ:"projekt",aufgabe:a}};
  });
  base=[...fach,...mathe,...sprache,...aufbau,...projekt,...bild,...pruefungsTransfer];return base;
}
export function freezeReviewTask(task:ReviewTask,random:()=>number=Math.random):ReviewTask {
  const frozen=clone(task);
  if(frozen.payload.typ==="fachwissen"&&frozen.payload.aufgabe.typ==="calc") {
    frozen.payload.aufgabe=instantiateExamQuestion(frozen.payload.aufgabe,random).task;
  }
  if(frozen.payload.typ==="aufbau") frozen.payload.aufgabe=erzeugeAufbauAufgabe(frozen.ref.id,Math.floor(random()*5));
  if(frozen.payload.typ==="projekt") {
    const familie=pruefungsTransferFamilie(frozen.ref.id);
    frozen.payload.aufgabe=familie?erzeugePruefungsTransfer(familie,Math.min(2,Math.max(0,Math.floor(random()*3)))):instantiateProjektTransfer(frozen.ref.id,random);
  }
  return frozen;
}
/** Old Fachwissen schedules are read directly; other sources use durable review records. */
export function selectReviewTasks(filter:ReviewFilter,minuten:number,now=Date.now(),pool=getReviewTasks()):ReviewTask[] {
  const records=loadReviewRecords(),legacy=ladeFortschritt();
  const due=(t:ReviewTask)=>t.ref.quelle==="fachwissen"?legacy[t.ref.id]?.faelligAm:records[reviewKey(t.ref)]?.faelligAm;
  const passend=pool.filter(t=>filter==="alles"||(filter==="tief"?t.tief:!t.tief));
  const faellig=passend.filter(t=>due(t)!==undefined&&due(t)!<=now).sort((a,b)=>due(a)!-due(b)!);
  const neu=passend.filter(t=>due(t)===undefined);
  // Rotate sources and learning areas so a large Fachwissen pool cannot hide language/math.
  const gruppen=new Map<string,ReviewTask[]>();
  for(const t of neu){const key=`${t.ref.quelle}:${t.ref.lernzielIds[0]??t.thema}`;gruppen.set(key,[...(gruppen.get(key)??[]),t]);}
  const quellen=new Map<string,ReviewTask[][]>();
  for(const g of gruppen.values())quellen.set(g[0].ref.quelle,[...(quellen.get(g[0].ref.quelle)??[]),g]);
  const neue:ReviewTask[]=[];
  const queues=[...quellen.values()].map(gs=>{const out:ReviewTask[]=[];for(let i=0;i<Math.max(0,...gs.map(g=>g.length));i++)for(const g of gs)if(g[i])out.push(g[i]);return out;});
  for(let i=0;i<Math.max(0,...queues.map(q=>q.length));i++)for(const q of queues)if(q[i])neue.push(q[i]);
  const auswahl:ReviewTask[]=[];let budget=minuten*60*.8;
  for(const t of [...faellig,...neue])if(t.sekunden<=budget){auswahl.push(t);budget-=t.sekunden;}
  return auswahl;
}
export function createReviewSession(filter:ReviewFilter,minuten:number,now=Date.now(),random:()=>number=Math.random):ReviewSession {
  return {version:1,id:`runde-${now}-${Math.floor(random()*1e9)}`,filter,minuten,startedAt:now,index:0,tasks:selectReviewTasks(filter,minuten,now).map(t=>freezeReviewTask(t,random)),answers:{},results:{}};
}
export const reviewSessionKey=(filter:ReviewFilter)=>`tagesrunde-v2-${filter}`;
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==="object"&&!Array.isArray(v);
const strings=(v:unknown):v is string[]=>Array.isArray(v)&&v.every(x=>typeof x==="string");
const finite=(v:unknown):v is number=>typeof v==="number"&&Number.isFinite(v);
const textMap=(v:unknown)=>object(v)&&Object.values(v).every(x=>typeof x==="string");
export function validReviewActivityAnswer(v:unknown):v is AktivitaetAntwort {
  return object(v)&&textMap(v.zuordnung)&&strings(v.reihenfolge)&&strings(v.auswahl);
}
export function validReviewSteps(v:unknown):v is Record<string,AufbauAntwort> {
  return object(v)&&Object.values(v).every(a=>object(a)&&typeof a.wert==="string"&&typeof a.einheit==="string");
}
export function validReviewTask(v:unknown):v is ReviewTask {
  if(!object(v)||!validReviewRef(v.ref)||!["titel","thema","route"].every(k=>typeof v[k]==="string")||typeof v.route!=="string"||!/^\/(lernen|grundlagen|sprache|projekte|bildtraining)(\/|#|$)/.test(v.route)||typeof v.sekunden!=="number"||!Number.isFinite(v.sekunden)||v.sekunden<=0||typeof v.tief!=="boolean"||!object(v.payload)||!object(v.payload.aufgabe))return false;
  const p=v.payload,a=p.aufgabe as Record<string,unknown>;
  if(p.typ==="fachwissen"){
    if(a.id!==v.ref.id||typeof a.lernfeld!=="string"||typeof a.thema!=="string"||typeof a.quelle!=="string"||!["hoch","mittel"].includes(String(a.konfidenz)))return false;
    if(a.typ==="mc")return typeof a.frage==="string"&&Array.isArray(a.optionen)&&a.optionen.length>1&&a.optionen.every(x=>typeof x==="string")&&Array.isArray(a.korrekt)&&a.korrekt.length>0&&a.korrekt.every(n=>Number.isInteger(n)&&Number(n)>=0&&Number(n)<(a.optionen as unknown[]).length);
    if(a.typ==="calc"){try{return Array.isArray(a.parameter)&&a.parameter.every(p=>object(p)&&p.min===p.max&&typeof p.min==="number"&&Number.isFinite(p.min))&&Array.isArray(a.schritte)&&berechneSchritte(a.schritte as never,Object.fromEntries((a.parameter as {name:string;min:number}[]).map(p=>[p.name,p.min]))).every(s=>Number.isFinite(s.wert));}catch{return false;}}
    if(a.typ==="cloze")return typeof a.text==="string"&&a.text.includes("{{");
    if(a.typ==="diagram")return typeof a.frage==="string"&&typeof a.svg==="string"&&object(a.zuordnung);
    return a.typ==="draw"?typeof a.aufgabentext==="string":a.typ==="fachbegriff"&&typeof a.begriff==="string";
  }
  if(p.typ==="mathe")return v.ref.quelle==="mathe"&&a.id===v.ref.id&&typeof a.frage==="string"&&typeof a.wert==="number"&&Number.isFinite(a.wert)&&typeof a.einheit==="string"&&Array.isArray(a.einheiten)&&a.einheiten.every(x=>typeof x==="string")&&Array.isArray(a.gegeben);
  if(p.typ==="aufbau")return v.ref.quelle==="mathe"&&a.id===v.ref.id&&a.version===v.ref.version&&typeof a.frage==="string"&&strings(a.gegeben)&&Number.isSafeInteger(a.variante)&&Array.isArray(a.schritte)&&a.schritte.length>0&&a.schritte.every(s=>object(s)&&["id","label","formel","einsetzen","einheit"].every(k=>typeof s[k]==="string")&&finite(s.wert)&&strings(s.einheiten)&&s.einheiten.includes(String(s.einheit))&&Number.isInteger(s.stellen)&&Number(s.stellen)>=0&&Number(s.stellen)<=8&&finite(s.toleranz)&&s.toleranz>=0&&typeof s.ganzzahl==="boolean")&&new Set(a.schritte.map(s=>s.id)).size===a.schritte.length;
  if(p.typ==="projekt")return v.ref.quelle==="projekt"&&a.id===v.ref.id&&a.version===v.ref.version&&typeof a.frage==="string"&&typeof a.einheit==="string"&&typeof a.erklaerung==="string"&&finite(a.wert)&&finite(a.toleranz)&&a.toleranz>=0&&object(a.parameter)&&Object.values(a.parameter).every(finite);
  if(p.typ==="bild"){
    if(v.ref.quelle!=="bild"||a.id!==v.ref.id||a.version!==v.ref.version||typeof a.svg!=="string"||typeof a.bildbeschreibung!=="string"||!Array.isArray(a.bildbereiche)||!a.bildbereiche.every(b=>object(b)&&typeof b.id==="string"&&Number.isInteger(b.nummer)&&finite(b.x)&&finite(b.y))||!object(a.aktivitaet))return false;
    const ac=a.aktivitaet;
    if(!["id","titel","auftrag","erklaerung"].every(k=>typeof ac[k]==="string"))return false;
    if(ac.typ==="zuordnen")return Array.isArray(ac.paare)&&ac.paare.length>0&&ac.paare.every(p=>object(p)&&["id","links","rechts"].every(k=>typeof p[k]==="string"));
    if(ac.typ==="reihenfolge")return Array.isArray(ac.schritte)&&ac.schritte.length>0&&ac.schritte.every(s=>object(s)&&typeof s.id==="string"&&typeof s.text==="string");
    return ["skizzenfehler","baustellenfall"].includes(String(ac.typ))&&typeof ac.situation==="string"&&Array.isArray(ac.optionen)&&ac.optionen.length>1&&ac.optionen.every(o=>object(o)&&typeof o.id==="string"&&typeof o.text==="string"&&typeof o.korrekt==="boolean");
  }
  if(p.typ==="sprache")return typeof a.id==="string"&&typeof a.frage==="string"&&(a.typ==="wahl"?Array.isArray(a.optionen)&&a.optionen.every(x=>typeof x==="string")&&Number.isInteger(a.korrekt)&&Number(a.korrekt)>=0&&Number(a.korrekt)<a.optionen.length:a.typ==="zuordnung"&&Array.isArray(a.paare)&&a.paare.every(p=>object(p)&&typeof p.links==="string"&&typeof p.rechts==="string"));
  return false;
}
export function parseReviewSession(raw:string|null):ReviewSession|null {
  if(!raw)return null;
  try{const s:unknown=JSON.parse(raw);if(!object(s)||s.version!==1||typeof s.id!=="string"||!["alles","kurz","tief"].includes(String(s.filter))||![5,15,30].includes(Number(s.minuten))||typeof s.startedAt!=="number"||!Number.isFinite(s.startedAt)||!Array.isArray(s.tasks)||!s.tasks.length||!s.tasks.every(validReviewTask)||new Set(s.tasks.map(t=>reviewKey(t.ref))).size!==s.tasks.length||!Number.isInteger(s.index)||Number(s.index)<0||Number(s.index)>s.tasks.length||!object(s.answers)||!object(s.results))return null;
    const keys=new Set(s.tasks.map(t=>reviewKey(t.ref)));
    for(const a of Object.values(s.answers))if(!object(a)||(a.schritte!==undefined&&!validReviewSteps(a.schritte))||(a.aktivitaet!==undefined&&!validReviewActivityAnswer(a.aktivitaet)))return null;
    for(const[k,a]of Object.entries(s.answers))if(!keys.has(k)||!object(a)||!["wert","einheit","wahl"].every(p=>typeof a[p]==="string")||!object(a.paare)||!Object.values(a.paare).every(x=>typeof x==="string")||!Array.isArray(a.hilfen)||!a.hilfen.every(x=>typeof x==="string")||(a.original!==undefined&&(!object(a.original)||!Object.values(a.original).every(x=>typeof x==="string"))))return null;
    for(const[k,r]of Object.entries(s.results))if(!keys.has(k)||!validReviewResult(r)||reviewKey(r.ref)!==k||r.versuchId!==`${s.id}:${k}`)return null;
    return s as unknown as ReviewSession;
  }catch{return null;}
}
export function saveReviewSession(s:ReviewSession){appStorage.setItem(reviewSessionKey(s.filter),JSON.stringify(s));}
