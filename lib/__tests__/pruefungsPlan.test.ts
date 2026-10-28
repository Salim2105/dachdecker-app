import { beforeEach,describe,expect,it } from "vitest";
import { appStorage } from "@/lib/lernSpeicher";
import { reviewKey } from "@/lib/review";
import { getReviewTasks } from "@/lib/reviewTasks";
import { PRUEFUNGS_PLAN_KEY,PLAN_AKTUELL_KEY,neuerPruefungsPlan,parsePruefungsPlan,kalenderTag,addKalenderTage,budgetAmTag,erstelleWochenplan,startePlanBlock,ladePruefungsPlan,speicherePruefungsPlan,merkeAktuellenPlanBlock,ladeAktuellenPlanBlock,type PlanKontext } from "@/lib/pruefungsPlan";
const JETZT=Date.parse("2026-10-26T09:00:00Z");
const kontext:PlanKontext={aufgaben:[
 {id:"fachwissen:a:v1",titel:"Fällige Aufgabe",route:"/heute",sekunden:90,faelligAm:JETZT-1000},
 {id:"mathe:a:v1",titel:"Kurzer Rechenweg",route:"/heute",sekunden:180,faelligAm:null,lernzielIds:["rechnen"]},
 {id:"bild:a:v1",titel:"Befund prüfen",route:"/heute",sekunden:120,faelligAm:null,lernzielIds:["befund"]},
 {id:"mathe:lang:v1",titel:"Lange Rechenkette",route:"/heute",sekunden:900,faelligAm:JETZT-10000},
]};
beforeEach(()=>appStorage.clear());
describe("Prüfungsfahrplan",()=>{
 it("übernimmt die gewählte Lernzeit und startet mit vier verfügbaren Tagen",()=>{
  appStorage.setItem("lernzeit","5");const p=neuerPruefungsPlan();expect(p.wochentage.filter(Boolean)).toEqual([5,5,5,5]);expect(p.zeitzone).toBe("Europe/Berlin");expect(erstelleWochenplan(p,"",JETZT,kontext)).toHaveLength(28);
 });
 it("überschreitet weder fünf Minuten noch die Rückmeldungsreserve und packt keine lange Rechnung hinein",()=>{
  const p=neuerPruefungsPlan();p.wochentage=[5,5,5,5,5,5,5];const tage=erstelleWochenplan(p,"",JETZT,kontext);
  for(const t of tage)for(const b of t.bloecke){expect(b.geschaetztSekunden).toBeLessThanOrEqual(240);expect(b.aufgabeIds).not.toContain("mathe:lang:v1");}expect(tage[0].bloecke[0].aufgabeIds[0]).toBe("fachwissen:a:v1");
 });
 it("bevorzugt eine fällige längere Rechenkette, wenn sie in die ganze Tagesrunde passt",()=>{
  const p=neuerPruefungsPlan();const tag=erstelleWochenplan(p,"",JETZT,{aufgaben:[{id:"mathe:faellig:v1",titel:"Zusammenhängend rechnen",route:"/heute",sekunden:540,faelligAm:JETZT-1},kontext.aufgaben[2]]})[0];expect(tag.bloecke[0].aufgabeIds[0]).toBe("mathe:faellig:v1");expect(tag.bloecke[0].geschaetztSekunden).toBeLessThanOrEqual(720);
 });
 it("zeigt bei ausschließlich zu langen Aufgaben eine Lücke statt einer überlangen Runde",()=>{
  const p=neuerPruefungsPlan();p.wochentage=[5,5,5,5,5,5,5];const tag=erstelleWochenplan(p,"",JETZT,{aufgaben:[kontext.aufgaben[3]]})[0];expect(tag.bloecke).toEqual([]);expect(tag.hinweis).toContain("längere Rechenkette");
 });
 it("erhöht nach mehreren ausgefallenen Tagen das Budget nicht",()=>{
  const p=neuerPruefungsPlan();p.wochentage=[15,15,15,15,15,15,15];const tage=erstelleWochenplan(p,"",Date.parse("2026-10-29T10:00:00Z"),kontext);expect(tage.every(t=>t.minuten===15)).toBe(true);
 });
 it("wendet Ausnahmen über Monatsgrenzen an; der letzte Eintrag hat Vorrang",()=>{
  const p=neuerPruefungsPlan();p.wochentage=[15,15,15,15,15,15,15];p.ausnahmen=[{id:"urlaub",von:"2026-10-30",bis:"2026-11-03",minuten:0,grund:"Urlaub"},{id:"schule",von:"2026-11-02",bis:"2026-11-04",minuten:5,grund:"Blockschule"}];expect(budgetAmTag(p,"2026-10-31")).toBe(0);expect(budgetAmTag(p,"2026-11-02")).toBe(5);expect(budgetAmTag(p,"2026-11-05")).toBe(15);
 });
 it("verwendet Kalendertage bei Sommer-/Winterzeit und Jahreswechsel",()=>{
  expect(kalenderTag(Date.parse("2026-10-24T22:30:00Z"))).toBe("2026-10-25");expect(addKalenderTage("2026-10-25",1)).toBe("2026-10-26");expect(addKalenderTage("2027-03-28",1)).toBe("2027-03-29");expect(addKalenderTage("2026-12-31",1)).toBe("2027-01-01");expect(()=>addKalenderTage("2026-02-30",1)).toThrow();
 });
 it("endet am Prüfungstag ohne Pflichtblock; vergangene Termine erzeugen kein Nachholpensum",()=>{
  const p=neuerPruefungsPlan(),tage=erstelleWochenplan(p,"2026-10-27",JETZT,kontext);expect(tage).toHaveLength(2);expect(tage[1].minuten).toBe(0);expect(tage[1].hinweis).toContain("Prüfungstag");expect(erstelleWochenplan(p,"2026-10-01",JETZT,kontext)).toHaveLength(28);
 });
 it("behält begonnene Aufgabenverweise bei Änderungen von Budget und Pool",()=>{
  const p=neuerPruefungsPlan(),task=getReviewTasks().find(t=>t.sekunden<=240)!;
  const pool:PlanKontext={aufgaben:[{id:reviewKey(task.ref),titel:task.titel,route:task.route,sekunden:task.sekunden,faelligAm:null}]};const block=erstelleWochenplan(p,"",JETZT,pool)[0].bloecke[0],begonnen=startePlanBlock(p,block,"runde-123",JETZT);
  const neu={...begonnen,wochentage:[0,0,0,0,0,0,0] as typeof p.wochentage},tag=erstelleWochenplan(neu,"",JETZT,{aufgaben:[]})[0];expect(tag.bloecke[0].aufgabeIds).toEqual(block.aufgabeIds);expect(tag.bloecke[0].versuchId).toBe("runde-123");expect(tag.hinweis).toContain("ursprüngliche Zeitwahl");expect(startePlanBlock(begonnen,block,"andere-runde",JETZT).bloecke).toHaveLength(1);merkeAktuellenPlanBlock(tag.bloecke[0]);expect(ladeAktuellenPlanBlock()?.id).toBe(block.id);
 });
 it("plant ausdrücklich zusätzliche 90-Minuten-Termine getrennt vom Tagesbudget",()=>{
  const p=neuerPruefungsPlan();p.musterTermine=["2026-10-26"];const tag=erstelleWochenplan(p,"",JETZT,kontext)[0];expect(tag.minuten).toBe(15);expect(tag.bloecke.find(b=>b.art==="musterlauf")?.minuten).toBe(90);
 });
 it("lässt beschädigte Pläne unangetastet und validiert vor dem Schreiben",()=>{
  appStorage.setItem(PRUEFUNGS_PLAN_KEY,"{beschädigt");expect(ladePruefungsPlan()).toBeNull();expect(()=>speicherePruefungsPlan({...neuerPruefungsPlan(),wochentage:[90] as never})).toThrow();expect(appStorage.getItem(PRUEFUNGS_PLAN_KEY)).toBe("{beschädigt");appStorage.setItem(PLAN_AKTUELL_KEY,JSON.stringify({route:"https://fremd.example"}));expect(ladeAktuellenPlanBlock()).toBeNull();
 });
 it("weist alte Empfehlungen und unbekannte Aufgaben vor dem Start zurück",()=>{
  const p=neuerPruefungsPlan(),block=erstelleWochenplan(p,"",JETZT,kontext)[0].bloecke[0];expect(()=>startePlanBlock(p,block,undefined,Date.parse("2026-10-29T12:00:00Z"))).toThrow("Vergangenheit");expect(()=>startePlanBlock(p,block,undefined,JETZT)).toThrow("aktualisiert");
 });
 it("stellt Pläne wieder her ohne einen zweiten Prüfungstermin",()=>{
  const p=neuerPruefungsPlan();speicherePruefungsPlan(p);expect(ladePruefungsPlan()).toEqual(p);expect(Object.hasOwn(JSON.parse(appStorage.getItem(PRUEFUNGS_PLAN_KEY)!),"pruefungsdatum")).toBe(false);expect(parsePruefungsPlan(JSON.stringify({...p,ausnahmen:[{id:"a",von:"2026-02-30",bis:"2026-03-01",minuten:0,grund:""}]}))).toBeNull();
 });
});
