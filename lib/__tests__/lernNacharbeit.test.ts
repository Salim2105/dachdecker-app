import { beforeEach,describe,expect,it } from "vitest";
import { aufbauNacharbeit,bildNacharbeit,projektAktivNacharbeit,projektZahlNacharbeit,transferNacharbeit } from "@/lib/lernNacharbeit";
import { istLernHinweis } from "@/lib/lernHinweise";
import { erzeugeAufbauAufgabe,pruefeAufbauAufgabe } from "@/lib/matheAufbau";
import { BILD_AUFGABEN } from "@/lib/bildtraining";
import { BAUPROJEKTE,instantiateProjektTransfer } from "@/lib/bauprojekte";
import { starteAktivitaet,type Aktivitaet } from "@/lib/aktivitaeten";
import { ladeLernsignale,lernEmpfehlungen,neueProjektSignale,speichereLernsignaleEinmal,DIAGNOSE_KEY } from "@/lib/lerndiagnose";
import { recordReviewResult,loadReviewRecords,reviewKey } from "@/lib/review";

beforeEach(()=>localStorage.clear());
function richtigeAntwort(a:Aktivitaet){const v=starteAktivitaet(a);if(a.typ==="zuordnen")v.zuordnung=Object.fromEntries(a.paare.map(p=>[p.id,p.id]));else if(a.typ==="reihenfolge")v.reihenfolge=a.schritte.map(s=>s.id);else v.auswahl=a.optionen.filter(o=>o.korrekt).map(o=>o.id);return v;}
describe("gezielte Nacharbeit",()=>{
 it("unterscheidet eine beobachtbar falsche Einheit vom Rechenansatz",()=>{
  const a=erzeugeAufbauAufgabe("aufbau-formeln-2",0),v={dicke:{wert:"0,160",einheit:"cm"},zentimeter:{wert:"1,6",einheit:"cm"}},r=pruefeAufbauAufgabe(a,v)!;
  const h=aufbauNacharbeit(a,v,r);expect(h.map(h=>h.kategorie)).toEqual(["einheiten","formel"]);
  expect(h[0].hinweis).toContain("cm gewählt. Gesucht ist m");expect(h[1].hinweis).toContain("Schichtdicke in Zentimetern");
  expect(h.every(istLernHinweis)).toBe(true);expect(h.every(h=>h.route==="/grundlagen/mathe#aufbau-formeln")).toBe(true);
 });
 it("bietet bei gebrochener Stückzahl eine konkrete Rundungshilfe statt einer behaupteten Fehlerursache",()=>{
  const a=erzeugeAufbauAufgabe("aufbau-lattung-1",0),v={anzahl:{wert:"12,5",einheit:"Stück"},abstand:{wert:"34,4",einheit:"cm"}};
  expect(aufbauNacharbeit(a,v,pruefeAufbauAufgabe(a,v)!)[0].hinweis).toContain("ganze Anzahl");
 });
 it("ordnet alle Projektberechnungen einem tatsächlich vorhandenen Übungsziel zu",()=>{
  for(const p of BAUPROJEKTE)for(const r of p.rechnungen){const [h]=projektZahlNacharbeit(p,r,false);expect(istLernHinweis(h)).toBe(true);expect(h.hinweis).toContain(r.tipp);}
  expect(projektZahlNacharbeit(BAUPROJEKTE[0],BAUPROJEKTE[0].rechnungen[0],false)[0].route).toBe("/grundlagen/mathe#aufbau-laengen");
 });
 it("gibt den tatsächlich noch nicht passenden Bildbereich und eine passende nächste Übung an",()=>{
  const a=BILD_AUFGABEN[0];if(a.aktivitaet.typ!=="zuordnen")throw Error();
  const v=richtigeAntwort(a.aktivitaet);v.zuordnung.p2="p1";
  const h=bildNacharbeit(a,v)[0];expect(h.hinweis).toContain("Bildbereich 2");expect(h.hinweis).not.toContain("Bildbereich 1");expect(h.kategorie).toBe("schichten");
  const fehler=BILD_AUFGABEN.find(a=>a.projektId==="flachdach"&&a.art==="fehler")!;
  expect(bildNacharbeit(fehler,starteAktivitaet(fehler.aktivitaet))[0]).toMatchObject({kategorie:"wasserweg",route:"/bildtraining#bild-flachdach-massnahme"});
 });
 it("bewertet zwei verschiedene Aktivitäten zu demselben Arbeitsablauf als gemeinsames Lernziel",()=>{
  const p=BAUPROJEKTE[0],b=BILD_AUFGABEN.find(a=>a.projektId===p.id&&a.art==="folge")!;
  expect(projektAktivNacharbeit(p,"ablauf",richtigeAntwort(p.aktivitaeten.ablauf))[0].lernzielId).toBe(bildNacharbeit(b,richtigeAntwort(b.aktivitaet))[0].lernzielId);
 });
 it("unterscheidet Einheit und Rechenweg auch bei kurzen Projektaufgaben",()=>{
  const a=instantiateProjektTransfer("ziegeldach",()=>.2);
  expect(transferNacharbeit(a,false,"m")[0]).toMatchObject({kategorie:"einheiten",route:"/grundlagen/mathe#aufbau-flaechen"});
  expect(transferNacharbeit(a,false,"m²")[0].kategorie).toBe("rechenweg");
 });
});
describe("dauerhafte und eindeutige Lernhinweise",()=>{
 it("leitet neue Hinweise aus dem gespeicherten Versuch ab, ohne alte Erfolge zu erfinden oder doppelt zu speichern",()=>{
  const a=erzeugeAufbauAufgabe("aufbau-formeln-1",0),v={breite:{wert:"4",einheit:"cm"}},h=aufbauNacharbeit(a,v,pruefeAufbauAufgabe(a,v)!);
  const r={ref:{quelle:"mathe" as const,id:a.id,version:1,lernzielIds:[a.einheitId]},versuchId:"neuer-versuch",am:Date.now(),bewertung:"falsch" as const,hilfen:[],hinweise:h};
  recordReviewResult(r);recordReviewResult(r);
  expect(ladeLernsignale()).toHaveLength(1);expect(ladeLernsignale()[0].hinweis).toContain("cm gewählt");
  expect(localStorage.getItem(DIAGNOSE_KEY)).toBeNull();expect(loadReviewRecords()[reviewKey(r.ref)].verlauf).toHaveLength(1);
  const alt={...r,versuchId:"alter-versuch",hinweise:undefined};recordReviewResult(alt);expect(ladeLernsignale()).toHaveLength(1);
 });
 it("zählt einen aus dem Projektentwurf wiederhergestellten Hinweis genau einmal",()=>{
  const p=BAUPROJEKTE[0],h=projektZahlNacharbeit(p,p.rechnungen[0],false),s=neueProjektSignale("projekt-versuch","projekt-ziegeldach-schraege",h,[],0);
  speichereLernsignaleEinmal(s);speichereLernsignaleEinmal(JSON.parse(JSON.stringify(s)));
  expect(ladeLernsignale()).toHaveLength(1);expect(lernEmpfehlungen(ladeLernsignale())[0].route).toBe("/grundlagen/mathe#aufbau-laengen");
 });
 it("nimmt Unterstützungsbedarf zurück, sobald zwei verschiedene passende Aufgaben unabhängig gelöst wurden",()=>{
  const t=Date.now(),h=projektZahlNacharbeit(BAUPROJEKTE[0],BAUPROJEKTE[0].rechnungen[0],false);
  speichereLernsignaleEinmal(neueProjektSignale("projekt-versuch","projekt-ziegeldach-schraege",h,[],0,t-3000));
  for(const [i,id]of["aufbau-laengen-1","aufbau-laengen-2"].entries()){
   const a=erzeugeAufbauAufgabe(id,0),v=Object.fromEntries(a.schritte.map(s=>[s.id,{wert:String(s.wert),einheit:s.einheit}]));
   recordReviewResult({ref:{quelle:"mathe",id,version:1,lernzielIds:[a.einheitId]},versuchId:`loesung-${i}`,am:t-2000+i,bewertung:"richtig",hilfen:[],hinweise:aufbauNacharbeit(a,v,pruefeAufbauAufgabe(a,v)!)});
  }
  expect(lernEmpfehlungen(ladeLernsignale(),t)).toEqual([]);
 });
 it("verwendet Nachschlagen und direkte Wiederholung nicht als unabhängigen Abruf",()=>{
  const t=Date.now(),p=BAUPROJEKTE[0];speichereLernsignaleEinmal(neueProjektSignale("projekt-versuch","falsch",projektZahlNacharbeit(p,p.rechnungen[0],false),[],0,t-1000));
  for(const id of["aufbau-laengen-1","aufbau-laengen-2"]){const a=erzeugeAufbauAufgabe(id,0);recordReviewResult({ref:{quelle:"mathe",id,version:1,lernzielIds:[a.einheitId]},versuchId:id,am:t,bewertung:"richtig",hilfen:["begriff:glossar-werkstatt-hypotenuse"],hinweise:[{kategorie:"rechenweg",lernzielId:a.einheitId,route:`/grundlagen/mathe#${a.einheitId}`,thema:a.titel,richtig:true,hinweis:"Richtig mit Hilfe."}]});}
  expect(lernEmpfehlungen(ladeLernsignale(),t).length).toBeGreaterThan(0);
 });
 it("lehnt manipulierte Zieladressen ab und schützt gespeicherte Prüfungsdaten",()=>{
  const a=erzeugeAufbauAufgabe("aufbau-formeln-1",0),h=aufbauNacharbeit(a,{breite:{wert:"0",einheit:"m"}},pruefeAufbauAufgabe(a,{breite:{wert:"0",einheit:"m"}})!);
  expect(()=>recordReviewResult({ref:{quelle:"mathe",id:a.id,version:1,lernzielIds:[a.einheitId]},versuchId:"fremd",am:Date.now(),bewertung:"falsch",hilfen:[],hinweise:h.map(h=>({...h,route:"https://fremd.invalid"}))})).toThrow();
  expect(ladeLernsignale()).toEqual([]);
 });
});
