import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { appStorage } from "@/lib/lernSpeicher";
import { archiviereFallVersuch, ladeFallVerlauf, FALL_VERLAUF_KEY, abgegebenerFallVersuch, bewerteFallTeil, FALL_VERSUCH_KEY, ladeFallVersuch, neueTeilAntwort, neuerFallVersuch, parseFallVersuch, speichereFallVersuch } from "@/lib/fallVersuch";
import { EXAM_METADATA } from "@/lib/examMetadata";
import { erzeugePruefungsFall } from "@/lib/pruefungsFaelle";
import type { AuswahlTeil, RechenTeil, ReihenfolgeTeil } from "@/lib/pruefungsVorbereitungTypen";
const base={id:"test-teil",titel:"Rechnen am Dach",auftrag:"Berechne das Ergebnis.",kompetenzen:["rechnen" as const],minuten:4,hinweis:"Skizze nutzen",erklaerung:"Vergleiche deinen Weg."};
const rechnen:RechenTeil={...base,typ:"rechnen",schritte:[{id:"laenge",label:"Schräge",wert:5,einheit:"m",einheiten:["m","m²"],stellen:2,toleranz:.005,formel:"√(3²+4²)",punkte:4},{id:"anzahl",label:"Stückzahl",wert:12,einheit:"Stück",einheiten:["Stück","m²"],stellen:0,toleranz:0,formel:"aufrunden(11,5)",punkte:2}]};
beforeEach(()=>appStorage.clear());afterEach(()=>appStorage.clear());
describe("Transparente Fallbewertung",()=>{
 it("vergibt Wert- und Einheitenpunkte getrennt und gibt keine Punkte für leere Werte",()=>{
  const a=neueTeilAntwort();a.einheiten={laenge:"m",anzahl:"Stück"};expect(bewerteFallTeil(rechnen,a).erreicht).toBe(0);
  a.zahlen={laenge:"5,00",anzahl:"12"};expect(bewerteFallTeil(rechnen,a)).toMatchObject({erreicht:6,moeglich:6,richtig:true,selbst:false});
  a.einheiten.laenge="m²";expect(bewerteFallTeil(rechnen,a).erreicht).toBe(4);
 });
 it("prüft Dezimalkomma, Rundungsgrenze, falsche Zahlen und notwendige ganze Stückzahlen",()=>{
  const a=neueTeilAntwort();a.zahlen={laenge:"5,005",anzahl:"11,5"};a.einheiten={laenge:"m",anzahl:"Stück"};expect(bewerteFallTeil(rechnen,a).erreicht).toBe(5);
  a.zahlen.laenge="5,006";expect(bewerteFallTeil(rechnen,a).erreicht).toBe(3);
  a.zahlen.laenge="5meter";expect(bewerteFallTeil(rechnen,a).erreicht).toBe(1);
 });
 it("zieht falsche Auswahl ab und begrenzt bei null",()=>{
  const teil:AuswahlTeil={...base,typ:"auswahl",punkte:4,optionen:[{id:"a",text:"A",richtig:true},{id:"b",text:"B",richtig:true},{id:"c",text:"C",richtig:false},{id:"d",text:"D",richtig:false}]};
  const a=neueTeilAntwort();a.wahl=["a"];expect(bewerteFallTeil(teil,a).erreicht).toBe(2);
  a.wahl=["a","b","c"];expect(bewerteFallTeil(teil,a).erreicht).toBe(2);
  a.wahl=["c","d"];expect(bewerteFallTeil(teil,a).erreicht).toBe(0);
  a.wahl=["a","b"];expect(bewerteFallTeil(teil,a).richtig).toBe(true);
 });
 it("bewertet Reihenfolge anteilig und zählt doppelte Schritte nicht mehrfach",()=>{
  const t:ReihenfolgeTeil={...base,typ:"reihenfolge",punkte:4,schritte:[{id:"a",text:"Prüfen"},{id:"b",text:"Planen"},{id:"c",text:"Ausführen"},{id:"d",text:"Kontrollieren"}]};
  const a=neueTeilAntwort();a.reihenfolge=["a","b","d","c"];expect(bewerteFallTeil(t,a).erreicht).toBe(2);
  a.reihenfolge=["a","a","a","a"];expect(bewerteFallTeil(t,a).erreicht).toBe(0);
 });
 it("lässt Zeichnung und freie Erklärung aus dem automatischen Nenner",()=>{
  const t={...base,typ:"begruendung" as const,kriterien:["Begründet"],muster:"Ein Weg",musterKurz:"Ein Weg"};
  const a=neueTeilAntwort();a.text="Ich habe alles richtig erklärt.";a.kriterien={k1:"erfuellt"};
  expect(bewerteFallTeil(t,a)).toMatchObject({erreicht:0,moeglich:0,richtig:false,selbst:true});
 });
});
describe("Dauerhafter eigener Prüfungsversuch",()=>{
 it("ersetzt angefangene Arbeit erst nach vollständigem Archivieren",()=>{
  const v=neuerFallVersuch(["ziegeldach"],"begleitet"),neu=neuerFallVersuch(["flachdach"],"begleitet");speichereFallVersuch(v);
  expect(()=>speichereFallVersuch(neu)).toThrow(/zuerst archivieren/);expect(ladeFallVersuch()!.id).toBe(v.id);
  archiviereFallVersuch(v);speichereFallVersuch(neu);expect(ladeFallVersuch()!.id).toBe(neu.id);expect(ladeFallVerlauf()[0]).toEqual(v);
 });
 it.each(["ziegeldach","flachdach","sanierung","schiefer","metalldach","fassade"])("erhält alle drei vollständigen Inhaltsvarianten von %s",id=>{
  for(let variante=0;variante<3;variante++){
   const v=neuerFallVersuch([id],"probelauf",false,1000,variante);
   expect(parseFallVersuch(JSON.stringify(v))).toEqual(v);
   expect(parseFallVersuch(JSON.stringify(abgegebenerFallVersuch(v,2000)))).not.toBeNull();
  }
 });
 it("lehnt widersprüchliche gespeicherte Punkte und Bewertungen ab",()=>{
  const v=abgegebenerFallVersuch(neuerFallVersuch(["ziegeldach"],"probelauf",false,1000),2000);
  const id=v.faelle[0].teile[0].id;v.bewertungen[id].richtig=true;
  expect(parseFallVersuch(JSON.stringify(v))).toBeNull();
 });
 it("archiviert unfertige und abgegebene Versuche ohne doppelte Einträge oder stilles Löschen",()=>{
  const v=neuerFallVersuch(["ziegeldach"],"begleitet");archiviereFallVersuch(v);archiviereFallVersuch(v);expect(ladeFallVerlauf()).toHaveLength(1);
  const fertig=abgegebenerFallVersuch({...v,revision:1});archiviereFallVersuch(fertig);expect(ladeFallVerlauf()[0]).toEqual(fertig);
  expect(()=>archiviereFallVersuch({...fertig,revision:2})).toThrow(/Archivstand/);
  appStorage.setItem(FALL_VERLAUF_KEY,"defekt");expect(()=>archiviereFallVersuch(v)).toThrow(/bleibt erhalten/);expect(appStorage.getItem(FALL_VERLAUF_KEY)).toBe("defekt");
 });
 it("friert zusammengehörige Angaben und die absolute Frist ein und erhält Entwürfe",()=>{
  const v=neuerFallVersuch(["ziegeldach"],"probelauf",true,1000,1);
  const id=v.faelle[0].teile[0].id;v.antworten[id]={...neueTeilAntwort(),text:"0,",formel:"b = B/2",hilfen:["begriff"]};
  speichereFallVersuch(v);const restored=ladeFallVersuch()!;
  expect(restored.faelle).toEqual(v.faelle);expect(restored.faelle[0]).toEqual(erzeugePruefungsFall("ziegeldach",1));
  expect(restored.antworten[id].text).toBe("0,");expect(restored.frist).toBe(5401000);
  restored.faelle[0].parameter.eigenerWert=999;expect(v.faelle[0].parameter.eigenerWert).toBeUndefined();
 });
 it("speichert Abgabe nur einmal und bewertet sie nach Wiederöffnen nicht erneut",()=>{
  const v=neuerFallVersuch(["ziegeldach"],"begleitet",false,1000);const eingereicht=abgegebenerFallVersuch(v,2000);
  expect(v.abgegebenAm).toBeNull();expect(abgegebenerFallVersuch(eingereicht,9000)).toEqual(eingereicht);
  expect(Object.keys(eingereicht.bewertungen)).toHaveLength(v.faelle[0].teile.length);
  speichereFallVersuch(eingereicht);expect(ladeFallVersuch()).toEqual(eingereicht);
  expect(()=>speichereFallVersuch({...eingereicht,index:1,revision:1})).toThrow(/abgegebene/);
 });
 it("bewahrt defekte Stände und importierte alte v2-Prüfungen",()=>{
  appStorage.setItem("dd-pruefung-v2",'{"alter":"Prüfungsstand"}');appStorage.setItem(FALL_VERSUCH_KEY,"defekt");
  expect(()=>ladeFallVersuch()).toThrow(/bleibt erhalten/);
  expect(()=>speichereFallVersuch(neuerFallVersuch(["ziegeldach"],"begleitet"))).toThrow(/alte Prüfungsstand/);
  expect(appStorage.getItem(FALL_VERSUCH_KEY)).toBe("defekt");expect(appStorage.getItem("dd-pruefung-v2")).toBe('{"alter":"Prüfungsstand"}');
 });
 it("lehnt ungültige Zahlen, fremde Teil-IDs und doppelte Fall-IDs ab",()=>{
  const v=neuerFallVersuch(["ziegeldach"],"begleitet");expect(parseFallVersuch(JSON.stringify(v))).toEqual(v);
  expect(parseFallVersuch(JSON.stringify({...v,gestartetAm:-1}))).toBeNull();
  expect(parseFallVersuch(JSON.stringify({...v,antworten:{fremd:neueTeilAntwort()}}))).toBeNull();
  expect(parseFallVersuch(JSON.stringify({...v,faelle:[v.faelle[0],v.faelle[0]]}))).toBeNull();
 });
 it("friert Daten und Zeitvorgaben auch bei späteren Speicherungen ein",()=>{
  const v=neuerFallVersuch(["ziegeldach"],"probelauf",true,1000);speichereFallVersuch(v);
  expect(()=>speichereFallVersuch({...v,revision:1,frist:9999999})).toThrow(/Zeitvorgaben/);
  const geaendert=structuredClone(v);geaendert.revision=1;geaendert.faelle[0].parameter.neueZahl=42;
  expect(()=>speichereFallVersuch(geaendert)).toThrow(/Zeitvorgaben/);expect(ladeFallVersuch()).toEqual(v);
 });
 it("erhält die erste Erklärung und protokollierte Hilfen",()=>{
  const v=neuerFallVersuch(["ziegeldach"],"probelauf",false,1000),id=v.faelle[0].teile[0].id;
  v.antworten[id]={...neueTeilAntwort(),text:"Neue Fassung",erstText:"Mein erster Gedanke",hilfen:["formel"],musterOffen:true};
  v.hilfsEreignisse=[{teilId:id,art:"glossar",am:1001}];speichereFallVersuch(v);
  expect(()=>speichereFallVersuch({...v,revision:1,hilfsEreignisse:[]})).toThrow(/Hilfen/);
  expect(()=>speichereFallVersuch({...v,revision:1,antworten:{[id]:{...v.antworten[id],erstText:"Ersetzt"}}})).toThrow(/erste Erklärung/);
  expect(()=>speichereFallVersuch({...v,revision:1,antworten:{[id]:{...v.antworten[id],hilfen:[]}}})).toThrow(/erste Erklärung/);
  speichereFallVersuch({...v,revision:1,antworten:{[id]:{...v.antworten[id],text:"Weitere Überarbeitung"}}});expect(ladeFallVersuch()!.antworten[id].erstText).toBe("Mein erster Gedanke");
 });
 it("lehnt unbekannte Antwortschritte innerhalb einer bekannten Aufgabe ab",()=>{
  const v=neuerFallVersuch(["ziegeldach"],"probelauf"),teil=v.faelle[0].teile.find(t=>t.typ==="rechnen")!;
  v.antworten[teil.id]={...neueTeilAntwort(),zahlen:{fremderSchritt:"5"}};expect(parseFallVersuch(JSON.stringify(v))).toBeNull();
 });
 it("weist einen älteren Bearbeitungsstand in derselben Speicheransicht zurück",()=>{
  const v=neuerFallVersuch(["ziegeldach"],"begleitet");speichereFallVersuch({...v,revision:2});
  expect(()=>speichereFallVersuch({...v,revision:1})).toThrow(/neuerer/);expect(ladeFallVersuch()!.revision).toBe(2);
 });
 it("stellt zehn passende WiSo-MC-Fragen als eigene eingefrorene Momentaufnahme bereit",()=>{
  const v=neuerFallVersuch(["ziegeldach","flachdach"],"probelauf",false,1000,2,true);
  expect(v.wiso).toHaveLength(10);expect(v.wiso!.filter(w=>EXAM_METADATA[w.id].level==="anwendung")).toHaveLength(5);expect(v.wiso!.filter(w=>EXAM_METADATA[w.id].level==="pruefungsnah")).toHaveLength(5);expect(new Set(v.wiso!.map(w=>w.id)).size).toBe(10);
  expect(v.wiso!.every(w=>w.wahl.length===0&&w.korrekt.every(k=>k>=0&&k<w.optionen.length))).toBe(true);
  v.hilfsEreignisse.push({teilId:v.wiso![0].id,art:"glossar",am:1001});
  speichereFallVersuch(v);expect(ladeFallVersuch()!.wiso).toEqual(v.wiso);expect(ladeFallVersuch()!.hilfsEreignisse).toEqual(v.hilfsEreignisse);
 });
});
