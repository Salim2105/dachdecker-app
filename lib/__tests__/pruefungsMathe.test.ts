import { beforeEach,describe,expect,it } from "vitest";
import { appStorage } from "@/lib/lernSpeicher";
import { abgegebenerPruefungsMatheVersuch,ladePruefungsMatheStand,neuePruefungsMatheAufgabe,neuerPruefungsMatheStand,neuerPruefungsMatheVersuch,parsePruefungsMatheStand,PRUEFUNGS_MATHE_AUFGABEN,PRUEFUNGS_MATHE_KEY,pruefePruefungsMathe,pruefungsMatheSchritte,speicherePruefungsMatheStand } from "@/lib/pruefungsMathe";
beforeEach(()=>appStorage.clear());
describe("Lösungsfreie Prüfungs-Mathe",()=>{
 it("stellt alle30Aufbauaufgaben in5Varianten und6Kontexttransfer bereit",()=>{
  expect(PRUEFUNGS_MATHE_AUFGABEN).toHaveLength(30);
  for(const a of PRUEFUNGS_MATHE_AUFGABEN)for(let variante=0;variante<5;variante++){
   const v=neuerPruefungsMatheVersuch(a.id,variante,100);
   expect(pruefungsMatheSchritte(v).every(s=>Number.isFinite(s.wert))).toBe(true);
   for(const s of pruefungsMatheSchritte(v))v.antworten[s.id]={wert:s.wert.toFixed(s.stellen),einheit:s.einheit};
   expect(pruefePruefungsMathe(v)?.richtig).toBe(true);
  }
  for(const id of ["ziegeldach","flachdach","sanierung","schiefer","metalldach","fassade"])expect(neuePruefungsMatheAufgabe(`transfer:${id}`).typ).toBe("transfer");
 });
 it("gibt getrennteWert-/Einheitenpunkte und akzeptiert zulässigeRundungsgrenzen",()=>{
  const v=neuerPruefungsMatheVersuch("aufbau-formeln-1",0,100),s=pruefungsMatheSchritte(v)[0];
  v.antworten[s.id]={wert:"4",einheit:"m²"};expect(pruefePruefungsMathe(v)).toMatchObject({erreicht:1,moeglich:2,richtig:false});
  v.antworten[s.id]={wert:"4",einheit:"m"};expect(pruefePruefungsMathe(v)).toMatchObject({erreicht:2,moeglich:2,richtig:true});
  v.antworten[s.id]={wert:"4,005",einheit:"m"};expect(pruefePruefungsMathe(v)?.richtig).toBe(true);
  v.antworten[s.id]={wert:"4,0051",einheit:"m"};expect(pruefePruefungsMathe(v)?.richtig).toBe(false);
 });
 it("deutet leere/unfertige/ungültigeEingaben nicht als beantwortet",()=>{
  const v=neuerPruefungsMatheVersuch("aufbau-formeln-1"),s=pruefungsMatheSchritte(v)[0];
  for(const wert of ["","0,","NaN","Infinity","12abc"]){v.antworten[s.id]={wert,einheit:"m"};expect(pruefePruefungsMathe(v)).toBeNull();}
  v.antworten[s.id]={wert:"4",einheit:"bananen"};expect(pruefePruefungsMathe(v)).toBeNull();
 });
 it("erhält eingefroreneAufgabe,halbfertigeEingabe und ursprünglicheFormel nachNeustart",()=>{
  const v=neuerPruefungsMatheVersuch("aufbau-laengen-1",2,100);v.formel="Pythagoras zuerst";v.antworten.halb={wert:"0,",einheit:"m"};
  const stand={...neuerPruefungsMatheStand(),aktiv:v.id,versuche:[v]};speicherePruefungsMatheStand(stand);
  expect(ladePruefungsMatheStand()).toEqual(stand);expect(ladePruefungsMatheStand()?.versuche[0].aufgabe).toEqual(v.aufgabe);
  for(const s of pruefungsMatheSchritte(v))v.antworten[s.id]={wert:s.wert.toFixed(s.stellen),einheit:s.einheit};
  const fertig=abgegebenerPruefungsMatheVersuch(v,200);expect(fertig.erstFormel).toBe("Pythagoras zuerst");
  const original=JSON.stringify(fertig);expect(abgegebenerPruefungsMatheVersuch(fertig,300)).toBe(fertig);expect(JSON.stringify(fertig)).toBe(original);expect(v.abgegebenAm).toBeNull();
 });
 it("weist beschädigteDaten zurück und überschreibt vorhandenenEntwurf nicht",()=>{
  const v=neuerPruefungsMatheVersuch("aufbau-formeln-1"),stand={...neuerPruefungsMatheStand(),aktiv:v.id,versuche:[v]};
  speicherePruefungsMatheStand(stand);const raw=appStorage.getItem(PRUEFUNGS_MATHE_KEY);
  expect(parsePruefungsMatheStand(JSON.stringify({...stand,aktiv:"unbekannt"}))).toBeNull();expect(()=>speicherePruefungsMatheStand({...stand,versuche:[v,v]})).toThrow();expect(appStorage.getItem(PRUEFUNGS_MATHE_KEY)).toBe(raw);
 });
 it("vertraut importiertenPunkten nicht und akzeptiert keine unsicherenSchritt-IDs",()=>{
  const v=neuerPruefungsMatheVersuch("aufbau-formeln-1",0,100),s=pruefungsMatheSchritte(v)[0];v.antworten={[s.id]:{wert:"4",einheit:"m"}};
  const fertig=abgegebenerPruefungsMatheVersuch(v,200);fertig.ergebnis!.erreicht=999;
  expect(parsePruefungsMatheStand(JSON.stringify({version:1,aktiv:fertig.id,versuche:[fertig]}))?.versuche[0].ergebnis?.erreicht).toBe(2);
  if(v.aufgabe.typ==="aufbau")v.aufgabe.aufgabe.schritte[0].id="__proto__";
  expect(parsePruefungsMatheStand(JSON.stringify({version:1,aktiv:v.id,versuche:[v]}))).toBeNull();
 });
});
