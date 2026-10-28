import { afterEach,beforeEach,describe,expect,it,vi } from "vitest";
import { cleanup,fireEvent,render,screen,waitFor } from "@testing-library/react";
import { PruefungsFahrplan,PruefungsPlanHinweis } from "@/components/pruefung/PruefungsFahrplan";
import { appStorage } from "@/lib/lernSpeicher";
import { datumStore } from "@/lib/appStores";
import { PRUEFUNGS_PLAN_KEY,ladePruefungsPlan,ladeAktuellenPlanBlock } from "@/lib/pruefungsPlan";
import { wechsleLernziel } from "@/lib/lernNavigation";
vi.mock("@/lib/lernNavigation",()=>({wechsleLernziel:vi.fn()}));
beforeEach(()=>{appStorage.clear();datumStore.set("");vi.clearAllMocks();vi.spyOn(Date,"now").mockReturnValue(Date.parse("2026-10-26T10:00:00Z"));});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
describe("Persönlicher Prüfungsfahrplan",()=>{
 it("aktiviert einen veränderbaren Plan und verwendet den bestehenden Prüfungstermin",()=>{
  render(<PruefungsFahrplan/>);fireEvent.change(screen.getByLabelText("Mein Prüfungstermin"),{target:{value:"2026-11-04"}});expect(appStorage.getItem("pruefungsdatum")).toBe("2026-11-04");fireEvent.click(screen.getByRole("button",{name:"Fahrplan aktivieren"}));expect(ladePruefungsPlan()?.wochentage).toEqual([15,15,0,15,0,15,0]);fireEvent.change(screen.getByRole("combobox",{name:"Lernzeit am Montag"}),{target:{value:"5"}});expect(ladePruefungsPlan()?.wochentage[0]).toBe(5);
 });
 it("lässt Urlaub und Blockunterricht ausdrücklich als Budget erfassen",()=>{
  render(<PruefungsFahrplan/>);fireEvent.click(screen.getByText("Urlaub, Blockunterricht und einzelne Ausnahmen"));fireEvent.change(screen.getByLabelText("Von"),{target:{value:"2026-10-28"}});fireEvent.change(screen.getByLabelText("Bis"),{target:{value:"2026-10-30"}});fireEvent.change(screen.getByLabelText("Bezeichnung"),{target:{value:"Blockschule"}});fireEvent.change(screen.getByLabelText("Abweichende Lernzeit"),{target:{value:"5"}});fireEvent.click(screen.getByRole("button",{name:"Ausnahme hinzufügen"}));expect(ladePruefungsPlan()?.ausnahmen[0]).toMatchObject({von:"2026-10-28",bis:"2026-10-30",minuten:5,grund:"Blockschule"});
 });
 it("speichert konkrete Aufgaben vor dem Öffnen einer getrennten Runde",async()=>{
  render(<PruefungsFahrplan/>);fireEvent.click(screen.getAllByRole("link",{name:"Geplante Runde starten →"})[0]);await waitFor(()=>expect(wechsleLernziel).toHaveBeenCalled());const block=ladeAktuellenPlanBlock();expect(block?.status).toBe("begonnen");expect(block?.aufgabeIds.length).toBeGreaterThan(0);expect(block?.route).toBe(`/heute?plan=${block?.id}`);expect(wechsleLernziel).toHaveBeenCalledWith(block!.route);
 });
 it("bewahrt beschädigte Pläne und bietet die Sicherung an",()=>{
  appStorage.setItem(PRUEFUNGS_PLAN_KEY,"defekt");render(<PruefungsFahrplan/>);expect(screen.getByRole("alert").textContent).toContain("gespeicherte Plan");expect(screen.getByRole("link",{name:"Zur Datensicherung →"}).getAttribute("href")).toBe("/fortschritt");expect(appStorage.getItem(PRUEFUNGS_PLAN_KEY)).toBe("defekt");
 });
 it("hält die Übersicht vor Aktivierung frei von einer zweiten großen Planung",()=>{
  render(<PruefungsPlanHinweis/>);expect(screen.queryByRole("complementary")).toBeNull();
 });
});
