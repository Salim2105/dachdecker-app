import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { KompetenzUebersicht } from "@/components/fortschritt/KompetenzUebersicht";
import { appStorage } from "@/lib/lernSpeicher";
import { KOMPETENZ_NACHWEISE_KEY, recordMatheNachweis, recordSelbstNachweis, recordTransferNachweis } from "@/lib/kompetenzNachweise";
const zeit=Date.UTC(2026,0,2),TAG=86400000;
beforeEach(()=>appStorage.clear());afterEach(()=>{cleanup();vi.restoreAllMocks();});
describe("Kompetenzübersicht",()=>{
 it("zeigt ehrliche Lücken, ohne alte Trainingsdaten aufzuwerten oder zu verändern",()=>{
  appStorage.setItem("fortschritt-v1",JSON.stringify({alt:{bewertung:"richtig"}}));render(<KompetenzUebersicht/>);
  expect(screen.getByRole("heading",{name:"Was du schon selbstständig gezeigt hast"})).toBeDefined();
  expect(screen.getAllByText("Noch nicht erprobt")).toHaveLength(5);
  expect(screen.getByText(/Alte Lernstände bleiben erhalten/)).toBeDefined();
  expect(screen.getByText(/Ein Erfolg beim Ziegeldach bedeutet nicht automatisch/)).toBeDefined();
  expect(appStorage.getItem("fortschritt-v1")).toContain('"alt"');
 });
 it("zeigt die bestätigte Leistung und erprobte Themen getrennt",()=>{
  recordMatheNachweis({versuchId:"a",aufgabeId:"flaeche",familie:"ziegeldach",variante:0,richtig:true,am:zeit});
  recordMatheNachweis({versuchId:"b",aufgabeId:"flaeche",familie:"ziegeldach",variante:1,richtig:true,am:zeit+TAG});
  recordTransferNachweis({versuchId:"c",aufgabeId:"neuer-fall",familie:"flachdach",variante:0,richtig:true,am:zeit+7*TAG,thema:"Ein anderer Wasserweg"});
  render(<KompetenzUebersicht/>);
  expect(screen.getByRole("button",{name:/Rechenwege und Einheiten Später bestätigt/})).toBeDefined();
  expect(screen.getByText("Ein anderer Wasserweg")).toBeDefined();expect(screen.getAllByText("Noch kein Nachweis")).toHaveLength(4);
  expect(screen.getByText("Ein selbstständiger Kontexttransfer liegt vor.")).toBeDefined();
 });
 it("weist freie Begründungen als eigene Vergleiche ohne automatische Punkte aus",()=>{
  recordSelbstNachweis({versuchId:"frei",aufgabeId:"erklaerung",familie:"ziegeldach",variante:0,kompetenz:"erklaeren",richtig:true,am:zeit,thema:"Wasserweg begründen"});
  render(<KompetenzUebersicht/>);const knopf=screen.getByRole("button",{name:/Entscheidungen begründen Selbst eingeschätzt/});fireEvent.click(knopf);
  expect(within(knopf).getByText("1 eigene Vergleiche · getrennt von automatischen Punkten")).toBeDefined();
  expect(screen.getByText(/Selbsteinschätzung · keine automatische Fachbewertung/)).toBeDefined();expect(screen.queryByText("Später bestätigt")).toBeNull();
 });
 it("zeigt einen neu hinzugefügten Nachweis auch ohne Seitenneustart",()=>{
  const uhr=vi.spyOn(Date,"now").mockReturnValue(zeit);render(<KompetenzUebersicht/>);
  uhr.mockReturnValue(zeit+1000);
  act(()=>recordMatheNachweis({versuchId:"live",aufgabeId:"flaeche",familie:"ziegeldach",variante:0,richtig:true,am:zeit+1000,thema:"Neu erprobt"}));
  expect(screen.getByRole("button",{name:/Rechenwege und Einheiten Selbstständig gezeigt/})).toBeDefined();
  expect(screen.getByText("Neu erprobt")).toBeDefined();
 });
 it("zeigt beschädigte Nachweise sichtbar an und lässt sie erhalten",()=>{
  appStorage.setItem(KOMPETENZ_NACHWEISE_KEY,"defekt");render(<KompetenzUebersicht/>);
  expect(screen.getByRole("alert").textContent).toContain("nicht gelesen");expect(appStorage.getItem(KOMPETENZ_NACHWEISE_KEY)).toBe("defekt");
 });
});
