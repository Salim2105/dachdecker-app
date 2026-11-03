import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import * as reviewTasks from "@/lib/reviewTasks";
import HeutePage from "@/app/heute/page";
import {Tagesrunde,planRundenKey} from "@/components/review/Tagesrunde";
import {appStorage} from "@/lib/lernSpeicher";
import {reviewKey,loadReviewRecords,createReviewResult} from "@/lib/review";
import {getReviewTasks,parseReviewSession,reviewSessionKey,type ReviewTask,type ReviewSession} from "@/lib/reviewTasks";
import {PRUEFUNGS_PLAN_KEY,neuerPruefungsPlan,speicherePruefungsPlan,ladePruefungsPlan,merkeAktuellenPlanBlock,ladeAktuellenPlanBlock,type PlanBlock} from "@/lib/pruefungsPlan";
const now=Date.parse("2026-10-26T10:00:00Z");
const basic=()=>getReviewTasks().find(t=>t.payload.typ==="mathe")!;
const chain=()=>getReviewTasks().find(t=>t.payload.typ==="aufbau")!;
function seed(tasks:ReviewTask[]=[basic(),chain()]){
 const id="plan-2026-10-26-15",block:PlanBlock={id,datum:"2026-10-26",minuten:15,geschaetztSekunden:tasks.reduce((sum,t)=>sum+t.sekunden,0),titel:"Deine geplante Tagesrunde",ziel:"Einheiten und Rechenwege",route:`/heute?plan=${id}`,aufgabeIds:tasks.map(t=>reviewKey(t.ref)),art:"tagesrunde",status:"begonnen",gestartetAm:now};
 const plan=neuerPruefungsPlan();plan.bloecke=[block];speicherePruefungsPlan(plan);merkeAktuellenPlanBlock(block);
 window.history.replaceState(null,"",block.route);return block;
}
const stored=(block:PlanBlock)=>parseReviewSession(appStorage.getItem(planRundenKey(block.id)))!;
beforeEach(()=>{appStorage.clear();window.history.replaceState(null,"","/heute");vi.spyOn(Date,"now").mockReturnValue(now);});
afterEach(()=>{cleanup();vi.restoreAllMocks();window.history.replaceState(null,"","/");});
describe("Feste Tagesrunde aus dem Prüfungsfahrplan",()=>{
 it("friert genau die ausgewählten Aufgaben separat ein und erhält Entwurf, Zahlen und alte Runden",()=>{
  const block=seed();
  const frei:ReviewSession={version:1,id:"freie-runde",filter:"alles",minuten:30,startedAt:now,index:0,tasks:[basic()],answers:{},results:{}};
  const oldRaw=JSON.stringify(frei);appStorage.setItem(reviewSessionKey("alles"),oldRaw);appStorage.setItem("dd-session-heute","unberührte frühere Runde");
  const v=render(<HeutePage/>);
  expect(screen.getByRole("heading",{name:"Deine geplante Tagesrunde"})).toBeDefined();
  expect(appStorage.getItem("lernwerkstatt-zuletzt-route")).toBe(block.route);
  expect(stored(block).tasks.map(t=>reviewKey(t.ref))).toEqual(block.aufgabeIds);
  fireEvent.change(screen.getByLabelText("Dein Ergebnis"),{target:{value:"0,"}});
  const vorher=stored(block);v.unmount();vi.spyOn(Math,"random").mockReturnValue(.99);render(<HeutePage/>);
  expect((screen.getByLabelText("Dein Ergebnis") as HTMLInputElement).value).toBe("0,");
  expect(stored(block).tasks).toEqual(vorher.tasks);expect(stored(block).id).toBe(vorher.id);
  expect(appStorage.getItem(reviewSessionKey("alles"))).toBe(oldRaw);expect(appStorage.getItem("dd-session-heute")).toBe("unberührte frühere Runde");
  expect(screen.getByRole("link",{name:"Freie und bisherige Tagesrunden öffnen →"}).getAttribute("href")).toBe("/heute");
 });
 it("markiert den Plan erst nach vollständiger Bearbeitung und zählt nach Neustart kein Ergebnis doppelt",async()=>{
  const block=seed();const v=render(<HeutePage/>);const s=stored(block),first=s.tasks[0];
  if(first.payload.typ!=="mathe")throw new Error("Mathe erwartet");
  fireEvent.change(screen.getByLabelText("Dein Ergebnis"),{target:{value:String(first.payload.aufgabe.wert)}});
  fireEvent.change(screen.getByLabelText("Einheit"),{target:{value:first.payload.aufgabe.einheit}});
  fireEvent.click(screen.getByRole("button",{name:"Meine Antwort prüfen"}));
  expect(ladePruefungsPlan()?.bloecke[0].status).toBe("begonnen");
  fireEvent.click(screen.getByRole("button",{name:"Nächste Aufgabe →"}));
  const second=stored(block).tasks[1];if(second.payload.typ!=="aufbau")throw new Error("Rechenkette erwartet");
  for(const step of second.payload.aufgabe.schritte){fireEvent.change(screen.getByLabelText(`Ergebnis: ${step.label}`),{target:{value:String(step.wert)}});fireEvent.change(screen.getByLabelText(`Einheit: ${step.label}`),{target:{value:step.einheit}});}
  fireEvent.click(screen.getByRole("button",{name:"Meine Rechenkette prüfen"}));
  expect(ladePruefungsPlan()?.bloecke[0].status).toBe("begonnen");
  fireEvent.click(screen.getByRole("button",{name:"Runde abschließen →"}));
  await waitFor(()=>expect(ladePruefungsPlan()?.bloecke[0].status).toBe("erledigt"));
  expect(ladeAktuellenPlanBlock()?.status).toBe("erledigt");
  const records=loadReviewRecords();expect(records[reviewKey(first.ref)].verlauf).toHaveLength(1);expect(records[reviewKey(second.ref)].verlauf).toHaveLength(1);
  v.unmount();render(<HeutePage/>);
  expect(screen.getByRole("heading",{name:"Du hast Zusammenhänge geübt."})).toBeDefined();
  expect(loadReviewRecords()[reviewKey(first.ref)].verlauf).toHaveLength(1);expect(loadReviewRecords()[reviewKey(second.ref)].verlauf).toHaveLength(1);
 });
 it("erfindet bei einer nicht gestarteten Planadresse keine neue Runde",()=>{
  appStorage.setItem("lernwerkstatt-zuletzt-route","/sprache/deutsch#auftrag");window.history.replaceState(null,"","/heute?plan=unbekannt");render(<HeutePage/>);
  expect(screen.getByRole("alert").textContent).toContain("nicht gestartet");expect(appStorage.getItem(planRundenKey("unbekannt"))).toBeNull();expect(appStorage.getItem(reviewSessionKey("alles"))).toBeNull();
  expect(appStorage.getItem("lernwerkstatt-zuletzt-route")).toBe("/sprache/deutsch#auftrag");
 });
 it("ersetzt unbekannte Aufgaben nicht durch andere Fragen",()=>{
  const block=seed();const plan=ladePruefungsPlan()!;const unbekannt={...block,aufgabeIds:["mathe:entfernt:v1"]};plan.bloecke=[unbekannt];speicherePruefungsPlan(plan);merkeAktuellenPlanBlock(unbekannt);
  render(<HeutePage/>);expect(screen.getByRole("alert").textContent).toContain("keine Ersatzaufgaben");expect(appStorage.getItem(planRundenKey(block.id))).toBeNull();
 });
 it("lässt beschädigte gespeicherte Planrunden unangetastet",()=>{
  const block=seed();appStorage.setItem(planRundenKey(block.id),"beschädigte Runde");render(<HeutePage/>);
  expect(screen.getByRole("alert").textContent).toContain("nicht überschrieben");expect(appStorage.getItem(planRundenKey(block.id))).toBe("beschädigte Runde");
 });
 it("zeigt bei einer leeren Zeitwahl den Budgetgrund statt einer behaupteten fehlenden Fälligkeit",()=>{
  vi.spyOn(reviewTasks,"createReviewSession").mockReturnValue({version:1,id:"leer",filter:"alles",minuten:5,startedAt:now,index:0,tasks:[],answers:{},results:{}});
  render(<Tagesrunde/>);expect(screen.getByRole("heading",{name:"Für diese Zeit passt gerade keine Aufgabe."})).toBeDefined();
  expect(screen.queryByText("Hier ist gerade nichts fällig.")).toBeNull();
 });
 it("verwendet einen vorhandenen Snapshot auch wenn der aktuelle Plan inzwischen geändert wurde",()=>{
  const block=seed();const v=render(<HeutePage/>);const frozen=stored(block);v.unmount();
  const plan=ladePruefungsPlan()!;plan.wochentage=[0,0,0,0,0,0,0];appStorage.setItem(PRUEFUNGS_PLAN_KEY,JSON.stringify(plan));render(<HeutePage/>);
  expect(stored(block).tasks).toEqual(frozen.tasks);expect(stored(block).minuten).toBe(15);
 });
 it("öffnet den ausdrücklich fortgesetzten Mix trotz anderer Auswahl und früherer Quizrunde",()=>{
  const frei:ReviewSession={version:1,id:"freie-kurz-runde",filter:"kurz",minuten:15,startedAt:now,index:0,tasks:[basic()],answers:{},results:{}};
  appStorage.setItem(reviewSessionKey("kurz"),JSON.stringify(frei));appStorage.setItem("tagesrunde-filter","tief");appStorage.setItem("dd-session-heute","frühere Quizrunde");
  window.history.replaceState(null,"","/heute?runde=kurz");render(<HeutePage/>);
  expect(screen.getByRole("button",{name:/Kurz & aktiv/}).getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByRole("heading",{name:basic().titel})).toBeDefined();expect(appStorage.getItem("lernwerkstatt-zuletzt-route")).toBe("/heute?runde=kurz");
  expect(appStorage.getItem("dd-session-heute")).toBe("frühere Quizrunde");
  fireEvent.click(screen.getByRole("button",{name:/In Ruhe rechnen/}));
  expect(window.location.search).toBe("?runde=tief");expect(appStorage.getItem("lernwerkstatt-zuletzt-route")).toBe("/heute?runde=tief");
 });
 it("überschreibt beim Öffnen einer abgeschlossenen Runde kein anderes letztes Lernziel",()=>{
  const block=seed();const frei:ReviewSession={version:1,id:`plan-runde-${block.id}:fertig`,filter:"alles",minuten:15,startedAt:now,index:1,tasks:[basic()],answers:{},results:{}};
  const task=frei.tasks[0],key=reviewKey(task.ref);frei.results[key]=createReviewResult(task.ref,`${frei.id}:${key}`,"richtig",{hilfen:[]},now);
  appStorage.setItem(planRundenKey(block.id),JSON.stringify(frei));appStorage.setItem("lernwerkstatt-zuletzt-route","/sprache/deutsch#auftrag");render(<HeutePage/>);
  expect(screen.getByRole("heading",{name:"Du hast Zusammenhänge geübt."})).toBeDefined();expect(appStorage.getItem("lernwerkstatt-zuletzt-route")).toBe("/sprache/deutsch#auftrag");
 });
});
