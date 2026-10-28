import {beforeEach,describe,expect,it} from "vitest";
import {appStorage} from "@/lib/lernSpeicher";
import {FALL_THEMEN,erzeugePruefungsFall} from "@/lib/pruefungsFaelle";
import {erzeugePruefungsTransfer,pruefungsTransferRef,pruefungsTransferFamilie,PRUEFUNGS_TRANSFER_ROUTE} from "@/lib/pruefungsTransfer";
import {getReviewTasks,freezeReviewTask,validReviewTask,parseReviewSession,reviewSessionKey,saveReviewSession,selectReviewTasks,type ReviewSession} from "@/lib/reviewTasks";
import {recordReviewResult,reviewKey,loadReviewRecords} from "@/lib/review";
import {instantiateProjektTransfer,pruefeProjektTransfer} from "@/lib/bauprojekte";
import {transferNacharbeit} from "@/lib/lernNacharbeit";
import {istLernHinweis,istLernRoute} from "@/lib/lernHinweise";
const now=Date.UTC(2026,9,28,10);
beforeEach(()=>appStorage.clear());
describe("Kontexttransfer in der gemeinsamen Wiederholung",()=>{
 it.each(FALL_THEMEN)("verknüpft $id eindeutig mit der bestehenden Projektquelle",({id})=>{
  const ref=pruefungsTransferRef(id),task=getReviewTasks().find(t=>t.ref.id===ref.id)!;
  expect(ref).toEqual({quelle:"projekt",id:`pruefungs-transfer-${id}`,version:1,lernzielIds:[`pruefungs-transfer-${id}`]});
  expect(task.ref).toEqual(ref);expect(task.route).toBe(PRUEFUNGS_TRANSFER_ROUTE);expect(task.payload.typ).toBe("projekt");
  expect(pruefungsTransferFamilie(ref.id)).toBe(id);expect(validReviewTask(task)).toBe(true);
 });
 it.each(FALL_THEMEN)("friert für $id alle drei echten Fallvarianten mit demselben Datensatz ein",({id})=>{
  const original=getReviewTasks().find(t=>t.ref.id===pruefungsTransferRef(id).id)!;
  for(const variante of [0,1,2]){
   const frozen=freezeReviewTask(original,()=>[0,.5,.99][variante]);expect(frozen.payload.typ).toBe("projekt");if(frozen.payload.typ!=="projekt")throw new Error("Projekt erwartet");
   const fall=erzeugePruefungsFall(id,variante),a=frozen.payload.aufgabe;
   expect(a.frage).toBe(fall.transfer.frage);expect(a.wert).toBe(fall.transfer.wert);expect(a.einheit).toBe(fall.transfer.einheit);expect(a.erklaerung).toBe(fall.transfer.erklaerung);expect(a.parameter).toEqual({...fall.parameter,variante});
   expect(pruefeProjektTransfer(a,String(a.wert))).toBe("richtig");expect(validReviewTask(frozen)).toBe(true);
  }
  if(original.payload.typ==="projekt")expect(original.payload.aufgabe.parameter.variante).toBe(0);
 });
 it("bewahrt Varianten und Antworten nach Speichern und Neustart unverändert",()=>{
  const tasks=FALL_THEMEN.map(f=>freezeReviewTask(getReviewTasks().find(t=>t.ref.id===pruefungsTransferRef(f.id).id)!,()=>.99));
  const s:ReviewSession={version:1,id:"transfer-runde",filter:"alles",minuten:30,startedAt:now,index:0,tasks,answers:{[reviewKey(tasks[0].ref)]:{wert:"0,",einheit:"m²",wahl:"",paare:{},hilfen:[]}},results:{}};
  saveReviewSession(s);expect(parseReviewSession(appStorage.getItem(reviewSessionKey("alles")))).toEqual(s);
 });
 it("verwendet dieselbe Ref wie die Prüfungs-Mathe und bietet Fehler später fällig an",()=>{
  const ref=pruefungsTransferRef("ziegeldach"),task=getReviewTasks().find(t=>t.ref.id===ref.id)!;
  const result={ref,versuchId:"matheprobe-1",bewertung:"falsch" as const,am:now-2*86400000,hilfen:[]};
  expect(recordReviewResult(result)).toBe(true);expect(recordReviewResult(result)).toBe(false);
  expect(selectReviewTasks("alles",5,now,[task])).toEqual([task]);expect(loadReviewRecords()[reviewKey(ref)].verlauf).toHaveLength(1);
 });
 it("lässt die bisherigen Projekttransfer-IDs und ihre Zufallszahlen unverändert",()=>{
  for(const f of FALL_THEMEN){
   const alt=getReviewTasks().find(t=>t.ref.id===`${f.id}-transfer`)!;
   const frozen=freezeReviewTask(alt,()=>.7);expect(frozen.payload).toEqual({typ:"projekt",aufgabe:instantiateProjektTransfer(f.id,()=>.7)});
   expect(pruefungsTransferFamilie(alt.ref.id)).toBeNull();
  }
  expect(()=>erzeugePruefungsTransfer("unbekannt")).toThrow();expect(()=>pruefungsTransferRef("unbekannt")).toThrow();
 });
 it("führt Kontextfehler zur passenden Prüfungs-Mathe statt zum früheren Projekt-Rechenthema",()=>{
  const a=erzeugePruefungsTransfer("sanierung",2),hinweise=transferNacharbeit(a,false,a.einheit);
  expect(hinweise).toHaveLength(1);expect(istLernHinweis(hinweise[0])).toBe(true);
  expect(hinweise[0].route).toBe(PRUEFUNGS_TRANSFER_ROUTE);expect(hinweise[0].lernzielId).toBe("pruefungs-transfer-sanierung");
  expect(hinweise[0].hinweis).toContain(a.erklaerung);expect(hinweise[0].route).not.toContain("aufbau-waerme");
  const einheit=transferNacharbeit(a,true,"m²")[0];expect(einheit.kategorie).toBe("einheiten");expect(einheit.richtig).toBe(false);
  const alt=instantiateProjektTransfer("sanierung",()=>0);expect(transferNacharbeit(alt,false,alt.einheit)[0].route).toBe("/grundlagen/mathe#aufbau-waerme");
 });
 it("erlaubt nur den exakt vorgesehenen lokalen Erklärungseinstieg",()=>{
  expect(istLernRoute(PRUEFUNGS_TRANSFER_ROUTE)).toBe(true);
  expect(istLernRoute(`${PRUEFUNGS_TRANSFER_ROUTE}&weiter=https://fremd.example`)).toBe(false);
  expect(istLernRoute("/grundlagen/mathe?ansicht=anderes")).toBe(false);
  expect(istLernRoute("https://fremd.example/grundlagen/mathe?ansicht=pruefungsaufgaben")).toBe(false);
 });
});
