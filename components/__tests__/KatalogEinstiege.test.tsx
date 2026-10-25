import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MatheWerkstatt } from "@/components/mathe/MatheWerkstatt";
import { SprachWerkstatt } from "@/components/sprache/SprachWerkstatt";
import { ProjektWerkstatt } from "@/components/projekte/ProjektWerkstatt";
import { BildWerkstatt } from "@/components/bildtraining/BildWerkstatt";
import { appStorage } from "@/lib/lernSpeicher";
import { MATHE_EINHEITEN } from "@/lib/matheGrundlagen";
import { DEUTSCH_EINHEITEN, ENGLISCH_EINHEITEN } from "@/lib/sprachWerkstatt";
import { BAUPROJEKTE } from "@/lib/bauprojekte";
import { BILD_AUFGABEN } from "@/lib/bildtraining";

beforeEach(() => {appStorage.clear();vi.spyOn(window,"scrollTo").mockImplementation(()=>{});});
afterEach(() => {cleanup();vi.restoreAllMocks();window.history.replaceState(null,"","/");});
const beispiele = [
  {route:"/grundlagen/mathe", key:"fachmathe-auswahl", id:MATHE_EINHEITEN[0].id, titel:MATHE_EINHEITEN[0].titel, render:()=> <MatheWerkstatt/>},
  {route:"/sprache/deutsch", key:"sprachwerkstatt-deutsch-auswahl", id:DEUTSCH_EINHEITEN[0].id, titel:DEUTSCH_EINHEITEN[0].titel, render:()=> <SprachWerkstatt sprache="deutsch"/>},
  {route:"/sprache/englisch", key:"sprachwerkstatt-englisch-auswahl", id:ENGLISCH_EINHEITEN[0].id, titel:ENGLISCH_EINHEITEN[0].titel, render:()=> <SprachWerkstatt sprache="englisch"/>},
  {route:"/projekte", key:"bauprojekte-auswahl", id:BAUPROJEKTE[0].id, titel:BAUPROJEKTE[0].titel, render:()=> <ProjektWerkstatt/>},
  {route:"/bildtraining", key:"bildtraining-auswahl", id:BILD_AUFGABEN[0].id, titel:BILD_AUFGABEN[0].aktivitaet.titel, render:()=> <BildWerkstatt/>},
];
describe.each(beispiele)("Katalogeinstieg $route", b => {
  it("zeigt die Auswahl und lässt den gespeicherten Bearbeitungspunkt unverändert", () => {
    appStorage.setItem(b.key,b.id);window.history.replaceState(null,"",`${b.route}?ansicht=uebersicht`);
    render(b.render());
    expect(screen.getAllByRole("button",{name:new RegExp(b.titel.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"))}).length).toBeGreaterThan(0);
    expect(appStorage.getItem(b.key)).toBe(b.id);
  });
  it("öffnet trotz Katalogparameter den ausdrücklich angegebenen Einheitensprung", () => {
    window.history.replaceState(null,"",`${b.route}?ansicht=uebersicht#${b.id}`);
    render(b.render());
    expect(screen.getByRole("heading",{level:1}).textContent).toContain(b.titel);
  });
});
