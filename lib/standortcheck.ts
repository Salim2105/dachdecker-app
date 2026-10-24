import type { LernKategorie } from "@/lib/lerndiagnose";
import { appStorage } from "@/lib/lernSpeicher";
export interface CheckStand { index:number; antworten:Record<string,number>; geprueft:string[]; fertig:boolean }
export const STANDORT_KEY = "standortcheck-v1";
export function neuerStandortcheck():CheckStand { return {index:0,antworten:{},geprueft:[],fertig:false}; }
export function ladeStandortcheck():CheckStand {
 try {
  const s=JSON.parse(appStorage.getItem(STANDORT_KEY)||"null");
  if(!s||!Number.isInteger(s.index)||s.index<0||s.index>=STANDORT_FRAGEN.length||!s.antworten||typeof s.antworten!=="object"||Array.isArray(s.antworten)||!Array.isArray(s.geprueft)||typeof s.fertig!=="boolean")return neuerStandortcheck();
  for(const[id,n]of Object.entries(s.antworten)){const f=STANDORT_FRAGEN.find(q=>q.id===id);if(!f||!Number.isInteger(n)||Number(n)<0||Number(n)>=f.optionen.length)return neuerStandortcheck();}
  if(new Set(s.geprueft).size!==s.geprueft.length||!s.geprueft.every((id:unknown)=>typeof id==="string"&&STANDORT_FRAGEN.some(f=>f.id===id)&&Object.hasOwn(s.antworten,id)))return neuerStandortcheck();
  s.fertig=s.fertig&&STANDORT_FRAGEN.every(f=>s.geprueft.includes(f.id));
  return s;
 } catch {return neuerStandortcheck();}
}
export interface StandortFrage {id:string;frage:string;optionen:string[];korrekt:number;erklaerung:string;kategorie:LernKategorie;lernzielId:string;route:string;thema:string}
export const STANDORT_FRAGEN:StandortFrage[]=[
 {id:"check-einheit",frage:"Wie viele Zentimeter sind 2,4 Meter?",optionen:["24 cm","240 cm","2 400 cm"],korrekt:1,erklaerung:"Ein Meter hat 100 Zentimeter. Deshalb: 2,4 × 100 = 240 cm.",kategorie:"einheiten",lernzielId:"laengen",route:"/grundlagen/mathe#laengen",thema:"Längen umrechnen"},
 {id:"check-prozent",frage:"200 Ziegel plus ausdrücklich vorgegebene 10 % Reserve: Wie viele sind es insgesamt?",optionen:["20 Ziegel","210 Ziegel","220 Ziegel"],korrekt:2,erklaerung:"20 Ziegel sind nur die Reserve. Mit den ursprünglichen 200 ergibt das 220 Ziegel.",kategorie:"formel",lernzielId:"prozent",route:"/grundlagen/mathe#prozent",thema:"Zuschlag und Gesamtmenge"},
 {id:"check-flaeche",frage:"Ein rechteckiges Feld ist 4 m lang und 3 m breit. Welche Flächenrechnung passt?",optionen:["4 × 3 = 12 m²","2 × (4 + 3) = 14 m²","4 + 3 = 7 m²"],korrekt:0,erklaerung:"Länge mal Breite ergibt die Fläche. 2 × (Länge + Breite) wäre der Umfang in Metern.",kategorie:"formel",lernzielId:"flaechen",route:"/grundlagen/mathe#flaechen",thema:"Fläche und Umfang"},
 {id:"check-begriff",frage:"Was macht eine Dachrinne hauptsächlich?",optionen:["Sie trägt die Sparren.","Sie sammelt Regenwasser an der Traufe.","Sie dämmt den Dachraum."],korrekt:1,erklaerung:"Die Dachrinne sammelt das ablaufende Wasser an der Traufe und leitet es zum Ablauf weiter.",kategorie:"begriffe",lernzielId:"lf07-k01-e01",route:"/lernen/lf07#lf07-k01-e01",thema:"Bauteile und ihre Aufgaben"},
 {id:"check-lesen",frage:"Im Auftrag steht: „Mindestens drei Maße notieren.“ Welche Antwort erfüllt das?",optionen:["Zwei Maße reichen aus.","Genau drei Maße; vier wären falsch.","Drei oder mehr Maße."],korrekt:2,erklaerung:"Mindestens nennt eine Untergrenze. Drei oder mehr erfüllt die Angabe.",kategorie:"leseverstehen",lernzielId:"deutsch-grenzwoerter",route:"/sprache/deutsch#grenzwoerter",thema:"Arbeitsaufträge lesen"},
 {id:"check-englisch",frage:"Was bedeutet „Keep the access clear“ im Baustellenkontext?",optionen:["Den Zugang frei halten.","Die Fläche grün markieren.","Das Werkzeug einpacken."],korrekt:0,erklaerung:"Access bedeutet Zugang. Keep clear fordert dazu auf, diesen frei zu halten.",kategorie:"englisch",lernzielId:"englisch-sicherheit",route:"/sprache/englisch#sicherheit",thema:"Einfache Arbeitsanweisungen"},
];
