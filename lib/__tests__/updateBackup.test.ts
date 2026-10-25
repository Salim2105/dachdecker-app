import { Blob as NodeBlob } from "node:buffer";
import { IDBFactory } from "fake-indexeddb";
import { afterEach,beforeEach,describe,expect,it,vi } from "vitest";

beforeEach(()=>{vi.resetModules();localStorage.clear();vi.stubGlobal("indexedDB",new IDBFactory());vi.stubGlobal("Blob",NodeBlob);});
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
describe("vollständige Sicherung der drei Ausbaustufen",()=>{
  it("stellt neue Runden, Antworten, Projektverweise, Bilddaten und lokale Rückmeldungen gemeinsam wieder her",async()=>{
    const s=await import("@/lib/lernSpeicher"),b=await import("@/lib/backup");
    await s.initializeStorage();
    const review=await import("@/lib/review"),tasks=await import("@/lib/reviewTasks"),math=await import("@/lib/matheAufbau"),projekt=await import("@/lib/bauprojekte"),bild=await import("@/lib/bildtraining"),feedback=await import("@/lib/feedback");
    const r=tasks.createReviewSession("alles",15,1800000000000,()=>.2);
    const ref=r.tasks[0].ref,key=review.reviewKey(ref);
    r.answers[key]={...tasks.emptyReviewAnswer(),wert:"12,",hilfen:["tipp"]};tasks.saveReviewSession(r);
    review.recordReviewResult({ref:{quelle:"mathe",id:"aufbau-trig-1",version:1,lernzielIds:["aufbau-trig"]},versuchId:"eigener-versuch",am:1800000000000,bewertung:"teilweise",hilfen:[]});
    const m=math.neuerAufbauStand(math.AUFBAU_EINHEITEN[0],3);m.notiz="Nach der Breite umstellen";s.appStorage.setItem(math.aufbauKey(math.AUFBAU_EINHEITEN[0].id),JSON.stringify(m));
    const p=projekt.neuerProjektStand(projekt.BAUPROJEKTE[0]);p.zahlen.schraege="99";p.zahlenGeprueft=["schraege"];p.referenzen=["schraege"];p.hilfen.push("referenz:schraege");s.appStorage.setItem(projekt.projektKey(p.projekt.id),JSON.stringify(p));
    const v=bild.neuerBildStand(bild.BILD_AUFGABEN[0]);v.notiz="Die Unterdeckung liegt unter den Latten";s.appStorage.setItem(bild.bildStandKey(bild.BILD_AUFGABEN[0].id),JSON.stringify(v));
    s.appStorage.setItem(feedback.FEEDBACK_KEY,JSON.stringify({lokalerEntwurf:"Begriff zu schwer"}));
    s.appStorage.setItem(`drawing:draft:${p.versuchId}`,JSON.stringify({photoKey:"private-projekt-foto"}));
    const bytes=new Uint8Array([0,5,17,254,255]);await s.writeBlob("private-projekt-foto",new Blob([bytes],{type:"image/png"}));
    const vorher=await s.snapshotStorage(),checked=b.pruefeArchiv(await b.exportiereArchiv())!;
    expect(checked.version).toBe(2);expect(checked.daten).toEqual(vorher.daten);
    s.appStorage.clear();await s.deleteBlob("private-projekt-foto");await b.importiereArchiv(checked);
    expect(tasks.parseReviewSession(s.appStorage.getItem(tasks.reviewSessionKey("alles")))).toEqual(r);
    expect(math.leseAufbauStand(math.AUFBAU_EINHEITEN[0])).toEqual(m);
    expect(projekt.leseProjektStand(s.appStorage.getItem(projekt.projektKey(p.projekt.id)),projekt.BAUPROJEKTE[0])).toEqual(p);
    expect(s.appStorage.getItem(feedback.FEEDBACK_KEY)).toBe(vorher.daten[feedback.FEEDBACK_KEY]);
    expect(review.loadReviewRecords()["mathe:aufbau-trig-1:v1"].verlauf).toHaveLength(1);
    expect(new Uint8Array(await(await s.readBlob("private-projekt-foto"))!.arrayBuffer())).toEqual(bytes);
  },20000);
});
