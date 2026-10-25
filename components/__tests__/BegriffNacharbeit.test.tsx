import { afterEach,beforeEach,describe,expect,it,vi } from "vitest";
import { cleanup,fireEvent,render,screen,within } from "@testing-library/react";
import { AufbauWerkstatt } from "@/components/mathe/AufbauWerkstatt";
import { ProjektWerkstatt } from "@/components/projekte/ProjektWerkstatt";
import { AUFBAU_EINHEITEN,aufbauKey,neuerAufbauStand,parseAufbauStand } from "@/lib/matheAufbau";
import { ladeLernsignale } from "@/lib/lerndiagnose";
import { BAUPROJEKTE,projektKey,neuerProjektStand } from "@/lib/bauprojekte";
import { Glossar } from "@/components/Glossar";
const e=AUFBAU_EINHEITEN[0],props={einheit:e,zurueck:()=>{},weiter:()=>{}};
beforeEach(()=>{localStorage.clear();window.history.replaceState(null,"","/grundlagen/mathe");vi.spyOn(window,"scrollTo").mockImplementation(()=>{});});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
describe("Fachwörter und gezielte Übungen",()=>{
 it("erhält halbfertige Eingaben beim Nachschlagen und speichert die Hilfe vor der Auswertung",()=>{
  localStorage.setItem(aufbauKey(e.id),JSON.stringify(neuerAufbauStand(e,0)));const event=vi.fn();window.addEventListener("dachdecker:begriff",event);
  try{render(<AufbauWerkstatt {...props}/>);
   fireEvent.change(screen.getByLabelText("Dein Wert für Breite b"),{target:{value:"4,"}});
   fireEvent.click(screen.getAllByRole("button",{name:"Begriff erklären: Formel"})[0]);
   expect((screen.getByLabelText("Dein Wert für Breite b")as HTMLInputElement).value).toBe("4,");
   const s=parseAufbauStand(localStorage.getItem(aufbauKey(e.id)),e)!;
   expect(s.versuche[e.aufgabenIds[0]].hilfen).toContain("begriff:glossar-werkstatt-formel");expect(event).toHaveBeenCalledOnce();
  }finally{window.removeEventListener("dachdecker:begriff",event);}
 });
 it("zeigt einen konkreten Einheitenhinweis und behält ihn beim Wiederöffnen ohne Doppelzählung",()=>{
  localStorage.setItem(aufbauKey(e.id),JSON.stringify(neuerAufbauStand(e,0)));const v=render(<AufbauWerkstatt {...props}/>);
  fireEvent.change(screen.getByLabelText("Dein Wert für Breite b"),{target:{value:"4"}});fireEvent.change(screen.getByLabelText("Einheit für Breite b"),{target:{value:"cm"}});
  fireEvent.click(screen.getByRole("button",{name:"Alle Rechenschritte prüfen"}));
  const n=screen.getByRole("complementary",{name:"Gezielt weiterüben"});expect(n.textContent).toContain("cm gewählt. Gesucht ist m");
  expect(within(n).getByRole("link",{name:"Passende Erklärung und Übung öffnen →"}).getAttribute("href")).toBe("/grundlagen/mathe#aufbau-formeln");
  v.unmount();render(<AufbauWerkstatt {...props}/>);expect(ladeLernsignale()).toHaveLength(1);
 });
 it("übernimmt aus alten bereits geprüften Projekten keine erfundenen Diagnoseereignisse",()=>{
  const p=BAUPROJEKTE[0],s=neuerProjektStand(p);s.schritt=2;s.besucht=2;s.zahlen.schraege="99";s.zahlenGeprueft=["schraege"];
  localStorage.setItem(projektKey(p.id),JSON.stringify(s));window.history.replaceState(null,"","/projekte#ziegeldach");render(<ProjektWerkstatt/>);
  expect(ladeLernsignale()).toEqual([]);expect(screen.queryByRole("complementary",{name:"Gezielt weiterüben"})).toBeNull();
 });
 it("zeigt bei einem neuen Mathebegriff eine zugängliche beschriftete Lernskizze",()=>{
  render(<Glossar begriffId="glossar-werkstatt-hypotenuse"/>);
  expect(within(screen.getByRole("article")).getByText(/längste Seite/)).toBeTruthy();
  expect(screen.getByRole("img",{name:/Rechtwinkliges Dachdreieck/})).toBeTruthy();
 });
});
