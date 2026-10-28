import { beforeEach, describe, expect, it } from "vitest";
import { appStorage } from "@/lib/lernSpeicher";
import { DIAGNOSE_KEY, ladeLernsignale, lernEmpfehlungen } from "@/lib/lerndiagnose";
import { neuerFallVersuch, neueTeilAntwort, abgegebenerFallVersuch } from "@/lib/fallVersuch";
import type { FallVersuch } from "@/lib/pruefungsVorbereitungTypen";
import { KOMPETENZ_NACHWEISE_KEY, kompetenzStand, ladeKompetenzNachweise, parseKompetenzNachweise, recordMatheNachweis, recordTransferNachweis, recordSelbstNachweis, syncFallNachweise, unabhaengigerNachweis, syncFallLernhinweise, FALL_LERNHINWEISE_KEY } from "@/lib/kompetenzNachweise";

const TAG=86400000, start=Date.UTC(2026,0,2,12);
beforeEach(()=>appStorage.clear());
function korrekt(familie="ziegeldach",zeit=start,variante=0,modus:"probelauf"|"begleitet"="probelauf"):FallVersuch {
  const v=neuerFallVersuch([familie],modus,false,zeit,variante);
  for(const f of v.faelle)for(const t of f.teile){
    const a=neueTeilAntwort();
    if(t.typ==="auswahl")a.wahl=t.optionen.filter(o=>o.richtig).map(o=>o.id);
    if(t.typ==="reihenfolge")a.reihenfolge=t.schritte.map(s=>s.id);
    if(t.typ==="rechnen")for(const s of t.schritte){a.zahlen[s.id]=String(s.wert);a.einheiten[s.id]=s.einheit;}
    v.antworten[t.id]=a;
  }
  return v;
}
function rechnen(versuchId:string,am:number,familie="ziegeldach",variante=versuchId,hilfe:string[]=[]) {
  recordMatheNachweis({versuchId,aufgabeId:"dachflaeche",familie,variante,am,richtig:true,hilfen:hilfe});
}
describe("Dauerhafte Kompetenznachweise",()=>{
  it("fasst einen Fall je Kompetenz zusammen und zählt Wiederöffnen einmal",()=>{
    const v=abgegebenerFallVersuch(korrekt(),start+5000);syncFallNachweise(v);
    const erster=ladeKompetenzNachweise();syncFallNachweise(v);expect(ladeKompetenzNachweise()).toEqual(erster);
    expect(erster.filter(n=>n.kompetenz==="rechnen")).toHaveLength(1);
    expect(erster.find(n=>n.kompetenz==="rechnen")?.richtig).toBe(true);
    expect(erster.some(n=>n.kompetenz==="detail"||n.kompetenz==="erklaeren")).toBe(false);
  });
  it("zählt laufende Fälle nicht und erlaubte Taschenrechner nicht als Lernhilfe",()=>{
    const v=korrekt();syncFallNachweise(v);expect(ladeKompetenzNachweise()).toEqual([]);
    v.hilfsEreignisse=[{teilId:"*",art:"taschenrechner",am:start}];syncFallNachweise(abgegebenerFallVersuch(v,start+5000));
    expect(ladeKompetenzNachweise().every(unabhaengigerNachweis)).toBe(true);
  });
  it("eine Hilfe entwertet nicht pauschal die unabhängig gelösten anderen Kompetenzen",()=>{
    const v=korrekt();const t=v.faelle[0].teile.find(t=>t.typ==="rechnen")!;v.antworten[t.id].hilfen=["referenzwert"];
    syncFallNachweise(abgegebenerFallVersuch(v,start+5000));const n=ladeKompetenzNachweise();
    expect(unabhaengigerNachweis(n.find(x=>x.kompetenz==="rechnen")!)).toBe(false);
    expect(unabhaengigerNachweis(n.find(x=>x.kompetenz==="plan")!)).toBe(true);
  });
  it("behandelt begleitete Übungen konservativ als unterstütztes Lernen",()=>{
    syncFallNachweise(abgegebenerFallVersuch(korrekt("ziegeldach",start,0,"begleitet"),start+5000));
    expect(kompetenzStand("rechnen",ladeKompetenzNachweise(),start+10000).status).toBe("unterstuetzt");
  });
  it("bestätigt verschiedene Familien mit zeitlichem Abstand und Kontexttransfer",()=>{
    rechnen("a",start);rechnen("b",start+TAG);
    recordTransferNachweis({versuchId:"c",aufgabeId:"neuer-auftrag",familie:"flachdach",variante:1,am:start+7*TAG,richtig:true});
    const s=kompetenzStand("rechnen",ladeKompetenzNachweise(),start+8*TAG);
    expect(s.status).toBe("bestaetigt");expect(s.familien).toBe(2);expect(s.transfer).toBe(true);
  });
  it("drei Kalenderdaten um Mitternacht reichen nicht für tatsächliche Zeitabstände",()=>{
    rechnen("a",Date.UTC(2026,2,27,23,59));rechnen("b",Date.UTC(2026,2,28,0,1));
    recordTransferNachweis({versuchId:"c",aufgabeId:"transfer",familie:"flachdach",variante:1,am:Date.UTC(2026,2,29,0,1),richtig:true});
    expect(kompetenzStand("rechnen",ladeKompetenzNachweise(),Date.UTC(2026,2,30)).status).toBe("selbststaendig");
  });
  it("wiederholte gleiche Varianten oder nur neue Zahlen derselben Familie bestätigen keine breite Übertragung",()=>{
    rechnen("a",start,"ziegeldach","gleich");rechnen("b",start+TAG,"ziegeldach","gleich");rechnen("c",start+8*TAG,"ziegeldach","gleich");
    expect(kompetenzStand("rechnen",ladeKompetenzNachweise(),start+9*TAG).unabhaengig).toBe(1);
    rechnen("d",start+9*TAG,"ziegeldach","andere-zahl");
    expect(kompetenzStand("rechnen",ladeKompetenzNachweise(),start+10*TAG).status).toBe("selbststaendig");
  });
  it("Muster, sofortige Nacharbeit und Selbsteinschätzung erzeugen keine unabhängigen Erfolge",()=>{
    rechnen("a",start,"ziegeldach","a",["muster"]);
    recordTransferNachweis({versuchId:"b",aufgabeId:"transfer",familie:"flachdach",variante:1,am:start+8*TAG,richtig:true,nachErklaerung:true});
    recordSelbstNachweis({versuchId:"c",aufgabeId:"erklaerung",familie:"sanierung",variante:1,kompetenz:"rechnen",richtig:true,am:start+9*TAG});
    const s=kompetenzStand("rechnen",ladeKompetenzNachweise(),start+10*TAG);
    expect(s.status).toBe("unterstuetzt");expect(s.selbst).toBe(1);expect(s.unabhaengig).toBe(0);
  });
  it("eine spätere neue unabhängige Variante kann trotz früherer Hilfe zählen",()=>{
    rechnen("a",start,"ziegeldach","a",["muster"]);rechnen("b",start+2*TAG,"ziegeldach","b");
    expect(kompetenzStand("rechnen",ladeKompetenzNachweise(),start+3*TAG).status).toBe("selbststaendig");
  });
  it("frühere Bestätigung bleibt bei späterem Fehler sichtbar mit Auffrischungshinweis",()=>{
    rechnen("a",start);rechnen("b",start+TAG,"flachdach");
    recordTransferNachweis({versuchId:"c",aufgabeId:"transfer",familie:"sanierung",variante:1,am:start+7*TAG,richtig:true});
    recordMatheNachweis({versuchId:"d",aufgabeId:"flaeche",familie:"ziegeldach",variante:2,am:start+8*TAG,richtig:false});
    const s=kompetenzStand("rechnen",ladeKompetenzNachweise(),start+9*TAG);expect(s.status).toBe("bestaetigt");expect(s.auffrischen).toBe(true);
  });
  it("markiert die erste unabhängig gelöste andere Fallfamilie als Kontexttransfer",()=>{
    syncFallNachweise(abgegebenerFallVersuch(korrekt("ziegeldach",start),start+5000));
    syncFallNachweise(abgegebenerFallVersuch(korrekt("flachdach",start+2*TAG),start+2*TAG+5000));
    const plan=ladeKompetenzNachweise().filter(n=>n.kompetenz==="plan");expect(plan.map(n=>n.transfer)).toEqual([false,true]);expect(plan[1].transferArt).toBe("anderer-fallkontext");
    syncFallNachweise(abgegebenerFallVersuch(korrekt("flachdach",start+9*TAG,1),start+9*TAG+5000));
    expect(ladeKompetenzNachweise().filter(n=>n.kompetenz==="plan").at(-1)?.transfer).toBe(false);
    expect(kompetenzStand("plan",ladeKompetenzNachweise(),start+10*TAG).status).toBe("bestaetigt");
  });
  it("erkennt zwei Fallkontexte im selben Musterlauf, behauptet aber keinen Zeitabstand",()=>{
    const a=korrekt("ziegeldach"), b=korrekt("flachdach");
    a.faelle.push(...b.faelle);Object.assign(a.antworten,b.antworten);
    syncFallNachweise(abgegebenerFallVersuch(a,start+5000));
    const s=kompetenzStand("plan",ladeKompetenzNachweise(),start+10000);
    expect(s.familien).toBe(2);expect(s.transfer).toBe(true);expect(s.status).toBe("selbststaendig");
  });
  it("frühe Nachweise fallen nicht aus der begrenzten Diagnose-/Wiederholungshistorie",()=>{
    for(let i=0;i<70;i++)rechnen(`a-${i}`,start+i*TAG,"ziegeldach",String(i));
    expect(ladeKompetenzNachweise()).toHaveLength(70);
  });
  it("erfindet aus alten Daten keine neuen Nachweise und überschreibt beschädigte Daten nicht",()=>{
    appStorage.setItem("fortschritt-v1",JSON.stringify({a:{bewertung:"richtig"}}));expect(ladeKompetenzNachweise()).toEqual([]);
    appStorage.setItem(KOMPETENZ_NACHWEISE_KEY,"kaputt");expect(parseKompetenzNachweise("kaputt")).toBeNull();
    expect(()=>rechnen("a",start)).toThrow(/nicht gelesen/);expect(appStorage.getItem(KOMPETENZ_NACHWEISE_KEY)).toBe("kaputt");
  });
});


describe("Fall-Ergebnisse leiten gezielte Nacharbeit ab",()=>{
 it("fasst zwei zusammenhängende Rechenfehler zu einem Lernzielhinweis zusammen",()=>{
  const v=korrekt();
  for(const t of v.faelle[0].teile.filter(t=>t.typ==="rechnen"))for(const s of t.schritte)v.antworten[t.id].zahlen[s.id]="0";
  const abgegeben=abgegebenerFallVersuch(v,start+5000);syncFallNachweise(abgegeben);syncFallNachweise(abgegeben);
  const n=ladeLernsignale().filter(s=>s.lernzielId==="fall-ziegeldach-rechnen");
  expect(n).toHaveLength(1);expect(n[0].richtig).toBe(false);expect(n[0].quelle).toBe("projekt");
  expect(n[0].route).toBe("/grundlagen/mathe?ansicht=pruefungsaufgaben");
  const hinweise=lernEmpfehlungen(ladeLernsignale(),start+10000).filter(h=>h.lernzielId==="fall-ziegeldach-rechnen");
  expect(hinweise).toHaveLength(1);expect(hinweise[0].offen).toBe(1);
 });
 it("übernimmt Hilfen und trennt begleitete richtige Antworten von unabhängigen Erfolgen",()=>{
  const v=abgegebenerFallVersuch(korrekt("ziegeldach",start,0,"begleitet"),start+5000);syncFallNachweise(v);
  const n=ladeLernsignale().find(s=>s.lernzielId==="fall-ziegeldach-rechnen")!;
  expect(n.richtig).toBe(true);expect(n.hilfen).toContain("begleiteter-fall");
  expect(lernEmpfehlungen(ladeLernsignale(),start+10000).some(h=>h.lernzielId===n.lernzielId)).toBe(true);
  expect(ladeLernsignale().some(s=>s.lernzielId.endsWith("detail")||s.lernzielId.endsWith("erklaeren"))).toBe(false);
 });
 it("zwei spätere richtige andere Varianten erledigen einen kurzfristigen Hinweis ohne Nachweise umzuschreiben",()=>{
  const v=korrekt();const t=v.faelle[0].teile.find(t=>t.typ==="rechnen")!;
  if(t.typ==="rechnen")v.antworten[t.id].zahlen[t.schritte[0].id]="0";
  syncFallNachweise(abgegebenerFallVersuch(v,start+5000));const vorher=ladeKompetenzNachweise()[0];
  syncFallNachweise(abgegebenerFallVersuch(korrekt("ziegeldach",start+TAG,1),start+TAG+5000));
  syncFallNachweise(abgegebenerFallVersuch(korrekt("ziegeldach",start+2*TAG,2),start+2*TAG+5000));
  expect(lernEmpfehlungen(ladeLernsignale(),start+3*TAG).some(h=>h.lernzielId==="fall-ziegeldach-rechnen")).toBe(false);
  expect(ladeKompetenzNachweise().find(n=>n.id===vorher.id)).toEqual(vorher);
 });
 it("holt eine abgebrochene Ableitung nach und zählt nach Kürzen der Diagnosehistorie nicht erneut",()=>{
  const v=abgegebenerFallVersuch(korrekt(),start+5000);syncFallLernhinweise(v);
  const ids=ladeLernsignale().map(s=>s.id);expect(ids.length).toBeGreaterThan(0);
  syncFallLernhinweise(v);expect(ladeLernsignale().map(s=>s.id)).toEqual(ids);
  appStorage.setItem(DIAGNOSE_KEY,"[]");syncFallLernhinweise(v);expect(ladeLernsignale()).toEqual([]);
  expect(appStorage.getItem(FALL_LERNHINWEISE_KEY)).toContain(v.id);
 });
 it("überschreibt eine beschädigte Diagnosehistorie nicht",()=>{
  appStorage.setItem(DIAGNOSE_KEY,"kaputt");const v=abgegebenerFallVersuch(korrekt(),start+5000);
  expect(()=>syncFallLernhinweise(v)).toThrow(/Lernhinweise können nicht gelesen/);
  expect(appStorage.getItem(DIAGNOSE_KEY)).toBe("kaputt");expect(appStorage.getItem(FALL_LERNHINWEISE_KEY)).toBeNull();
 });
});
