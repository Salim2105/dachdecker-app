import { beforeEach, describe, expect, it } from "vitest";
import { BILD_AUFGABEN, pruefeBildAufgabe } from "@/lib/bildtraining";
import { starteAktivitaet } from "@/lib/aktivitaeten";
import { appStorage } from "@/lib/lernSpeicher";
import { WERKSTATT_PFADE } from "@/lib/werkstattInhalte";
import { WERKSTATT_WIEDERHOLUNGEN, getWerkstattWiederholung, werkstattWiederholungRoute } from "@/lib/werkstattWiederholung";
import { createReviewSession, freezeReviewTask, getReviewTasks, parseReviewSession, selectReviewTasks, validReviewTask } from "@/lib/reviewTasks";
import { bildNacharbeit } from "@/lib/lernNacharbeit";
import { recordReviewResult, reviewKey, loadReviewRecords } from "@/lib/review";
import { istLernHinweis } from "@/lib/lernHinweise";
import { istPraxisSvg } from "@/lib/praxisVorbereitung";

beforeEach(()=>appStorage.clear());
const now=Date.UTC(2026,9,29,12);
describe("Werkstattschritte später wiederholen",()=>{
  it("verbindet jede der 20 Einheiten eindeutig mit ihrer eigenen kurzen Bildfrage",()=>{
    const ids=WERKSTATT_PFADE.flatMap(p=>p.einheiten.map(e=>e.wiederholungId));
    expect(WERKSTATT_WIEDERHOLUNGEN).toHaveLength(20);
    expect(new Set(ids).size).toBe(20);
    expect(new Set(WERKSTATT_WIEDERHOLUNGEN.map(a=>a.id))).toEqual(new Set(ids));
    expect(BILD_AUFGABEN).toHaveLength(24);
    for(const pfad of WERKSTATT_PFADE)for(const e of pfad.einheiten){
      const a=getWerkstattWiederholung(e.wiederholungId)!;
      expect(a.lernzielIds).toEqual(e.lernzielIds);
      expect(a.bildbeschreibung.length).toBeGreaterThan(50);
      expect(a.aktivitaet.typ).toBe("baustellenfall");
      expect(istPraxisSvg(a.svg)).toBe(true);
      expect(werkstattWiederholungRoute(a.id)).toBe(`/projekte#${e.id}`);
    }
    expect(getWerkstattWiederholung("werkstatt-unbekannt")).toBeUndefined();
    expect(werkstattWiederholungRoute("werkstatt-unbekannt")).toBeUndefined();
  });

  it("bewertet ausdrücklich richtige Antworten und belohnt kein Alles-Ankreuzen",()=>{
    for(const a of WERKSTATT_WIEDERHOLUNGEN){
      if(a.aktivitaet.typ!=="baustellenfall")throw new Error("Unerwartetes Aufgabenformat");
      const r=starteAktivitaet(a.aktivitaet);
      r.auswahl=a.aktivitaet.optionen.filter(o=>o.korrekt).map(o=>o.id);
      expect(pruefeBildAufgabe(a,r),a.id).toBe("richtig");
      expect(pruefeBildAufgabe(a,{...r,auswahl:a.aktivitaet.optionen.map(o=>o.id)}),a.id).not.toBe("richtig");
      const hinweise=bildNacharbeit(a,r);
      expect(hinweise[0].route).toBe(werkstattWiederholungRoute(a.id));
      expect(hinweise[0].lernzielId).toBe(a.lernzielIds[0]);
      expect(hinweise.every(istLernHinweis)).toBe(true);
    }
  });

  it("stellt den eingefrorenen Aufgaben- und Antwortstand nach Neustart exakt wieder her",()=>{
    const tasks=getReviewTasks().filter(t=>t.ref.id.startsWith("werkstatt-"));
    expect(tasks).toHaveLength(20);
    const s=createReviewSession("kurz",5,now,()=>.2);
    s.tasks=tasks.slice(0,2).map(t=>freezeReviewTask(t));
    s.answers[reviewKey(s.tasks[0].ref)]={wert:"",einheit:"",wahl:"",paare:{},hilfen:[],aktivitaet:{zuordnung:{},reihenfolge:[],auswahl:["o2"]}};
    expect(parseReviewSession(JSON.stringify(s))).toEqual(s);
    for(const t of tasks)expect(validReviewTask(freezeReviewTask(t)),t.ref.id).toBe(true);
    const unsafe=structuredClone(tasks[0]);
    if(unsafe.payload.typ!=="bild")throw new Error("Unerwartete Quelle");
    unsafe.payload.aufgabe.svg='<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
    expect(validReviewTask(unsafe)).toBe(false);
    unsafe.payload.aufgabe.svg='<svg xmlns="http://www.w3.org/2000/svg"><image href="https://example.org/x"/></svg>';
    expect(validReviewTask(unsafe)).toBe(false);
    const ohneZiel=structuredClone(tasks[0]);
    if(ohneZiel.payload.typ!=="bild")throw new Error("Unerwartete Quelle");
    ohneZiel.payload.aufgabe.lernzielIds=[];
    expect(validReviewTask(ohneZiel)).toBe(false);
    const verschachtelt=structuredClone(tasks[0]);
    if(verschachtelt.payload.typ!=="bild"||verschachtelt.payload.aufgabe.aktivitaet.typ!=="baustellenfall")throw new Error("Unerwartete Quelle");
    verschachtelt.payload.aufgabe.aktivitaet.svg='<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
    expect(validReviewTask(verschachtelt)).toBe(false);
  });

  it("übernimmt fällige Werkstattfragen und wertet erneut geöffnete Ergebnisse einmal",()=>{
    const t=getReviewTasks().find(t=>t.ref.id.startsWith("werkstatt-"))!;
    const result={ref:t.ref,versuchId:"gespeicherte-werkstatt-runde",am:now-3*86400000,bewertung:"falsch" as const,hilfen:[]};
    expect(recordReviewResult(result)).toBe(true);
    expect(recordReviewResult(result)).toBe(false);
    expect(loadReviewRecords()[reviewKey(t.ref)].verlauf).toHaveLength(1);
    expect(selectReviewTasks("kurz",5,now,[t])).toEqual([t]);
    expect(appStorage.getItem("kompetenznachweise-v1")).toBeNull();
  });
});
