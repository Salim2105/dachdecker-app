import { beforeEach, describe, expect, it } from "vitest";
import { createReviewSession, freezeReviewTask, getReviewTasks, parseReviewSession, reviewSessionKey, saveReviewSession, selectReviewTasks, validReviewTask, emptyReviewAnswer, type ReviewTask } from "@/lib/reviewTasks";
import { recordReviewResult, reviewKey } from "@/lib/review";
import { speichereBewertung } from "@/lib/progress";
import { appStorage } from "@/lib/lernSpeicher";

const jetzt=Date.UTC(2026,9,25,12);
beforeEach(()=>localStorage.clear());
const task=(typ:string)=>getReviewTasks().find(t=>t.payload.typ===typ)!;
describe("gemeinsame Tagesrunde",()=>{
  it("verbindet Fachwissen, beide Mathestufen, Sprachen, kurze Projekte, 24 Bild- und 20 Werkstattaufgaben",()=>{
    const aufgaben=getReviewTasks();
    expect(new Set(aufgaben.map(a=>a.payload.typ))).toEqual(new Set(["fachwissen","mathe","sprache","aufbau","projekt","bild"]));
    expect(aufgaben.filter(a=>a.payload.typ==="aufbau")).toHaveLength(30);
    expect(aufgaben.filter(a=>a.payload.typ==="projekt")).toHaveLength(12);
    expect(aufgaben.filter(a=>a.ref.id.startsWith("pruefungs-transfer-"))).toHaveLength(6);
    expect(aufgaben.filter(a=>a.payload.typ==="bild")).toHaveLength(44);
    expect(aufgaben.filter(a=>a.payload.typ==="bild"&&!a.ref.id.startsWith("werkstatt-"))).toHaveLength(24);
    expect(aufgaben.filter(a=>a.payload.typ==="bild"&&a.ref.id.startsWith("werkstatt-"))).toHaveLength(20);
    expect(new Set(aufgaben.map(a=>reviewKey(a.ref))).size).toBe(aufgaben.length);
    for(const a of aufgaben)expect(validReviewTask(freezeReviewTask(a,()=>.4)),a.ref.id).toBe(true);
  });
  it("friert echte Rechenparameter und Wiederholungsvarianten ein",()=>{
    const calc=getReviewTasks().find(t=>t.payload.typ==="fachwissen"&&t.payload.aufgabe.typ==="calc")!;
    const s=createReviewSession("alles",15,jetzt,()=>.6);
    s.tasks=[freezeReviewTask(calc,()=>.2),freezeReviewTask(task("aufbau"),()=>.8),freezeReviewTask(task("projekt"),()=>.4)];
    const vorher=JSON.stringify(s);saveReviewSession(s);
    expect(JSON.stringify(parseReviewSession(appStorage.getItem(reviewSessionKey("alles"))))).toBe(vorher);
    const frozen=s.tasks[0].payload;
    expect(frozen.typ==="fachwissen"&&frozen.aufgabe.typ==="calc"&&frozen.aufgabe.parameter.every(p=>p.min===p.max)).toBe(true);
  });
  it("zeigt fällige Übungen vor neuen und lässt künftige Termine aus",()=>{
    const a=task("mathe"),b=task("sprache"),c=task("projekt");
    recordReviewResult({ref:b.ref,versuchId:"sprache",am:jetzt-3*86400000,bewertung:"falsch",hilfen:[]});
    recordReviewResult({ref:a.ref,versuchId:"mathe",am:jetzt,bewertung:"richtig",hilfen:[]});
    const selection=selectReviewTasks("alles",15,jetzt,[a,c,b]);
    expect(selection[0].ref).toEqual(b.ref);expect(selection).not.toContain(a);expect(selection).toContain(c);
  });
  it("liest Fachwissenfälligkeit aus dem unveränderten bisherigen Fortschritt",()=>{
    const a=task("fachwissen");speichereBewertung(a.ref.id,"falsch",{am:jetzt-2*86400000});
    expect(selectReviewTasks("alles",5,jetzt,[task("sprache"),a])[0].ref.id).toBe(a.ref.id);
  });
  it("bietet lange fällige Rechenketten nur in einem passenden Zeitfenster vollständig an",()=>{
    const a={...task("aufbau"),sekunden:400};
    recordReviewResult({ref:a.ref,versuchId:"kette",am:jetzt-3*86400000,bewertung:"falsch",hilfen:[]});
    expect(selectReviewTasks("alles",5,jetzt,[task("sprache"),a])).toEqual([task("sprache")]);
    expect(selectReviewTasks("alles",5,jetzt,[a])).toEqual([]);
    expect(selectReviewTasks("alles",15,jetzt,[a])[0]).toEqual(a);
  });
  it("mischt neue Quellen auch bei großem Fachwissenpool",()=>{
    const selection=selectReviewTasks("alles",30,jetzt);
    expect(new Set(selection.map(t=>t.ref.quelle))).toEqual(new Set(["fachwissen","mathe","sprache","projekt","bild"]));
  });
  it("behält Runden, tatsächliche Eingaben und Ergebnisse beim Filterwechsel",()=>{
    const s=createReviewSession("alles",15,jetzt,()=>.1),a=s.tasks[0];
    s.answers[reviewKey(a.ref)]={...emptyReviewAnswer(),wert:"3,14",original:{luecken:'{"0":"Sparren"}'}};
    saveReviewSession(s);saveReviewSession(createReviewSession("tief",5,jetzt,()=>.2));
    expect(parseReviewSession(appStorage.getItem(reviewSessionKey("alles")))).toEqual(s);
  });
  it("ergänzt beschädigte Runden nicht still durch andere Aufgaben",()=>{
    const s=createReviewSession("alles",15,jetzt,()=>.1);
    expect(parseReviewSession(JSON.stringify({...s,index:s.tasks.length+1}))).toBeNull();
    expect(parseReviewSession(JSON.stringify({...s,tasks:[...s.tasks,s.tasks[0]]}))).toBeNull();
    const unsafe:ReviewTask={...s.tasks[0],route:"https://fremde.example"};
    expect(parseReviewSession(JSON.stringify({...s,tasks:[unsafe]}))).toBeNull();
  });
});
