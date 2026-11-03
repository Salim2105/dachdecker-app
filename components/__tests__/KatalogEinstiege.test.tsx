import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
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
    appStorage.setItem(b.key,b.id);appStorage.setItem("lernwerkstatt-zuletzt-route","/sprache/englisch#sicherheit");window.history.replaceState(null,"",`${b.route}?ansicht=uebersicht`);
    render(b.render());
    if (b.route === "/projekte") expect(screen.getByRole("link", {name:/Baustellenauftrag bearbeiten/}).getAttribute("href")).toBe("/projekte?ansicht=auftraege");
    else expect(screen.getAllByRole("button",{name:new RegExp(b.titel.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"))}).length).toBeGreaterThan(0);
    expect(appStorage.getItem(b.key)).toBe(b.id);
    expect(appStorage.getItem("lernwerkstatt-zuletzt-route")).toBe("/sprache/englisch#sicherheit");
  });
  it("öffnet trotz Katalogparameter den ausdrücklich angegebenen Einheitensprung", () => {
    window.history.replaceState(null,"",`${b.route}?ansicht=uebersicht#${b.id}`);
    render(b.render());
    expect(screen.getByRole("heading",{level:1}).textContent).toContain(b.titel);
  });
});

describe("Kompakte Kataloge", () => {
  it("zeigt genau vier Projekteinstiege und öffnet die sechs Aufträge ausdrücklich", () => {
    window.history.replaceState(null,"","/projekte?ansicht=uebersicht");
    const view = render(<ProjektWerkstatt/>);
    const links = screen.getByRole("navigation", {name:"Einstiege in die Projekte"}).querySelectorAll("a");
    expect(Array.from(links, a => a.getAttribute("href"))).toEqual(["/projekte#werkstatt", "/projekte#dach-entdecken", "/projekte?ansicht=auftraege", "/projekte?ansicht=praxis"]);
    expect(screen.queryByRole("button", {name:new RegExp(BAUPROJEKTE[0].titel)})).toBeNull();
    view.unmount();
    appStorage.setItem("bauprojekte-auswahl", "dach-steildach-s03");
    window.history.replaceState(null,"","/projekte?ansicht=auftraege");
    render(<ProjektWerkstatt/>);
    for (const p of BAUPROJEKTE) expect(screen.getByRole("button", {name:new RegExp(p.titel)})).toBeDefined();
    expect(appStorage.getItem("bauprojekte-auswahl")).toBe("dach-steildach-s03");
  });

  it("übergibt bei lokalen Wechseln und Browsernavigation den Fokus an die aktuelle Überschrift", () => {
    window.history.replaceState(null, "", "/sprache/deutsch?ansicht=uebersicht");
    render(<SprachWerkstatt sprache="deutsch"/>);
    const e = DEUTSCH_EINHEITEN[0];
    fireEvent.click(screen.getByRole("button", {name:new RegExp(e.titel)}));
    expect(document.activeElement).toBe(screen.getByRole("heading", {level:1}));
    fireEvent.click(screen.getByRole("button", {name:"← Alle Deutsch-Einheiten"}));
    expect(document.activeElement).toBe(screen.getByRole("heading", {name:"Deutsch fürs Handwerk"}));
    expect(appStorage.getItem("sprachwerkstatt-deutsch-auswahl")).toBe(e.id);
    window.history.replaceState(null, "", `/sprache/deutsch#${e.id}`);
    fireEvent(window, new PopStateEvent("popstate"));
    expect(screen.getByRole("heading", {level:1}).textContent).toBe(e.titel);
    expect(document.activeElement).toBe(screen.getByRole("heading", {level:1}));
  });

  it("filtert in Fachmathe innerhalb der gewählten Gruppe und macht selbstständige Aufgaben erreichbar", async () => {
    window.history.replaceState(null,"","/grundlagen/mathe?ansicht=uebersicht");
    render(<MatheWerkstatt/>);
    fireEvent.change(screen.getByRole("searchbox", {name:"Mathe-Einheiten suchen"}), {target:{value:"Meter Zentimeter"}});
    expect(screen.getByRole("button", {name:/Meter, Zentimeter und Millimeter/})).toBeDefined();
    expect(screen.queryByRole("button", {name:/Prozent und Zuschläge/})).toBeNull();
    fireEvent.click(screen.getByRole("button", {name:"Aufbau"}));
    expect(screen.getByRole("status").textContent).toContain("Keine Aufbau-Einheit");
    fireEvent.click(screen.getByRole("button", {name:"Selbstständig rechnen"}));
    await act(async () => { fireEvent.click(screen.getByRole("button", {name:"Selbstständig rechnen öffnen →"})); });
    expect(window.location.search).toBe("?ansicht=pruefungsaufgaben");
  });
});
