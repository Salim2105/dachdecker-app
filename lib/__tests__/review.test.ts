import { beforeEach, describe, expect, it, vi } from "vitest";
import { appStorage } from "@/lib/lernSpeicher";
import { ladeFortschritt, speichereBewertung } from "@/lib/progress";
import { loadReviewRecords, parseReviewStore, recordReviewResult, REVIEW_KEY, reviewDue, reviewKey, reviewMastered, reviewStorageError, validReviewResult, type ReviewRef, type ReviewResult } from "@/lib/review";

const TAG = 86400000, start = Date.UTC(2026, 9, 25, 12);
const ref: ReviewRef = {quelle:"mathe",id:"aufbau-trig-1",version:1,lernzielIds:["aufbau-trig"]};
function result(n = 0, patch: Partial<ReviewResult> = {}): ReviewResult {
  return {ref,versuchId:`versuch-${n}`,bewertung:"richtig",am:start+n*TAG,hilfen:[],...patch};
}
beforeEach(()=>{localStorage.clear();vi.restoreAllMocks();});

describe("dauerhafte gemeinsame Wiederholung",()=>{
  it("speichert eine Antwort genau einmal, auch nach erneuter Auswertung",()=>{
    expect(recordReviewResult(result())).toBe(true);
    const gespeichert=appStorage.getItem(REVIEW_KEY);
    expect(recordReviewResult(result())).toBe(false);
    expect(appStorage.getItem(REVIEW_KEY)).toBe(gespeichert);
    expect(loadReviewRecords()[reviewKey(ref)].verlauf).toHaveLength(1);
  });
  it("hält Aufgabenquellen und Inhaltsversionen getrennt",()=>{
    recordReviewResult(result());
    const sprache={...ref,quelle:"sprache" as const};
    const zweiteVersion={...ref,version:2};
    recordReviewResult(result(0,{ref:sprache}));recordReviewResult(result(0,{ref:zweiteVersion}));
    expect(Object.keys(loadReviewRecords())).toHaveLength(3);
  });
  it("lässt unabhängige Erfolge an verschiedenen Tagen wachsen",()=>{
    recordReviewResult(result(0));recordReviewResult(result(3));recordReviewResult(result(8));
    const s=loadReviewRecords()[reviewKey(ref)];
    expect(s.intervallTage).toBe(8);expect(s.faelligAm).toBe(start+16*TAG);
    expect(reviewMastered(s)).toBe(true);
  });
  it("verlängert durch wiederholte Antworten am selben Tag nichts",()=>{
    recordReviewResult(result(0));recordReviewResult(result(1,{am:start+1000}));
    expect(loadReviewRecords()[reviewKey(ref)].intervallTage).toBe(2);
    expect(loadReviewRecords()[reviewKey(ref)].faelligAm).toBe(start+2*TAG);
  });
  it("setzt Fehler auf einen Tag zurück und lässt Teilerfolg zunächst nach zwei Tagen wiederkommen",()=>{
    recordReviewResult(result(0));recordReviewResult(result(3,{bewertung:"falsch"}));
    expect(loadReviewRecords()[reviewKey(ref)].intervallTage).toBe(1);
    recordReviewResult(result(5,{bewertung:"teilweise"}));
    expect(loadReviewRecords()[reviewKey(ref)].intervallTage).toBe(2);
    recordReviewResult(result(8,{bewertung:"teilweise"}));
    expect(loadReviewRecords()[reviewKey(ref)].intervallTage).toBe(3);
  });
  it.each([{hilfen:["tipp"]},{selbstBewertet:true},{nachErklaerung:true}])("zählt unterstützte Antworten nicht als unabhängige Erfolge: %j",(hilfe)=>{
    for(let n=0;n<3;n++)recordReviewResult(result(n*3,hilfe));
    const s=loadReviewRecords()[reviewKey(ref)];
    expect(s.intervallTage).toBe(1);expect(reviewMastered(s)).toBe(false);
  });
  it("begrenzte Diagnosehistorie ist nicht der Wiederholungsspeicher",()=>{
    recordReviewResult(result());appStorage.setItem("lerndiagnose-v1","[]");
    expect(reviewDue(ref)).toBe(start+2*TAG);
  });
  it("übernimmt bestehende Fachwissenstände ohne rückwirkende neue Erfolge",()=>{
    const fach={...ref,quelle:"fachwissen" as const,id:"lf07-001"};
    speichereBewertung(fach.id,"teilweise",{am:start});
    expect(loadReviewRecords()).toEqual({});expect(reviewDue(fach)).toBe(ladeFortschritt()[fach.id].faelligAm);
    const r=result(4,{ref:fach});recordReviewResult(r);recordReviewResult(r);
    expect(ladeFortschritt()[fach.id].verlauf).toHaveLength(2);
  });
  it("holt einen nach Unterbrechung fehlenden Wiederholungseintrag ohne doppelte Fachbewertung nach",()=>{
    const fach={...ref,quelle:"fachwissen" as const,id:"lf07-001"};
    const r=result(0,{ref:fach});
    speichereBewertung(fach.id,r.bewertung,{am:r.am,versuchId:r.versuchId});
    recordReviewResult(r);
    expect(ladeFortschritt()[fach.id].verlauf).toHaveLength(1);
    expect(loadReviewRecords()[reviewKey(fach)].verlauf).toHaveLength(1);
  });
  it("ändert bei verspätetem älterem Ergebnis keinen bereits aktuellen Termin",()=>{
    recordReviewResult(result(4));const vorher=loadReviewRecords()[reviewKey(ref)];
    recordReviewResult(result(1,{bewertung:"falsch"}));const nachher=loadReviewRecords()[reviewKey(ref)];
    expect(nachher.faelligAm).toBe(vorher.faelligAm);expect(nachher.letzterVersuch).toBe(vorher.letzterVersuch);
    expect(nachher.verlauf.map(r=>r.am)).toEqual([start+TAG,start+4*TAG]);
  });
  it("schützt bei wiederhergestellten Prüfungen auch den kanonischen Fachwissenstand",()=>{
    const fach={...ref,quelle:"fachwissen" as const,id:"lf07-001"};
    recordReviewResult(result(4,{ref:fach}));const vorher=ladeFortschritt()[fach.id];
    recordReviewResult(result(1,{ref:fach,bewertung:"falsch"}));const nachher=ladeFortschritt()[fach.id];
    expect(nachher.faelligAm).toBe(vorher.faelligAm);expect(nachher.gesehenAm).toBe(vorher.gesehenAm);
    expect(nachher.bewertung).toBe("richtig");expect(nachher.verlauf).toHaveLength(2);
  });
  it("bewahrt beschädigte gespeicherte Daten und zeigt einen Fehler",()=>{
    appStorage.setItem(REVIEW_KEY,"{kaputt");
    expect(reviewStorageError()).toBe(true);expect(()=>recordReviewResult(result())).toThrow(/Sicherung/);
    expect(appStorage.getItem(REVIEW_KEY)).toBe("{kaputt");
  });
  it("weist ungültige Rückmeldungen zurück",()=>{
    expect(validReviewResult(result(0,{am:Infinity}))).toBe(false);
    expect(validReviewResult({...result(),ref:{...ref,version:0}})).toBe(false);
    expect(validReviewResult({...result(),bewertung:{toString:()=>"richtig"}})).toBe(false);
    expect(parseReviewStore('{"version":1,"staende":{"falsch":{}}}')).toBeNull();
  });
});
