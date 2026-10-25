import { afterEach,beforeEach,describe,expect,it,vi } from "vitest";
import { cleanup,fireEvent,render,screen,within } from "@testing-library/react";
import { ProjektWerkstatt } from "@/components/projekte/ProjektWerkstatt";
import { BAUPROJEKTE,leseProjektStand,projektKey } from "@/lib/bauprojekte";

vi.mock("@/components/aufgaben/DrawCard",()=>({DrawCard:({aufgabe,onErgebnis}:{aufgabe:{id:string};onErgebnis:(b:"teilweise")=>void})=><button data-testid="zeichnung" data-id={aufgabe.id} onClick={()=>onErgebnis("teilweise")}>Meine Zeichnung selbst vergleichen</button>}));
beforeEach(()=>{localStorage.clear();window.history.replaceState(null,"","/projekte");vi.spyOn(window,"scrollTo").mockImplementation(()=>{});});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
const p=BAUPROJEKTE[0];
const stand=()=>leseProjektStand(localStorage.getItem(projektKey(p.id)),p)!;
function oeffnen(){fireEvent.click(screen.getByRole("button",{name:new RegExp(p.titel)}));}
describe("Projektwerkstatt",()=>{
  it("behält Notizen, Begleitung und Arbeitsschritt beim Wechsel und nach Wiederöffnen",()=>{
    const v=render(<ProjektWerkstatt/>);oeffnen();
    fireEvent.change(screen.getByLabelText("Meine Projektnotizen"),{target:{value:"Wasserweg skizzieren"}});
    fireEvent.click(screen.getByRole("button",{name:"Selbst probieren"}));
    fireEvent.click(screen.getByRole("button",{name:/3Rechnen|3 Rechnen/}));
    expect(stand().schritt).toBe(2);expect(stand().hilfen).toContain("begleitung:0");
    v.unmount();render(<ProjektWerkstatt/>);
    expect((screen.getByLabelText("Meine Projektnotizen")as HTMLTextAreaElement).value).toBe("Wasserweg skizzieren");
    expect(screen.getByRole("button",{name:"Selbst probieren"}).getAttribute("aria-pressed")).toBe("true");
    expect(stand().schritt).toBe(2);
  });
  it("erhält einen falschen Vorwert und gibt abhängige Aufgaben erst nach Referenzhilfe frei",()=>{
    render(<ProjektWerkstatt/>);oeffnen();fireEvent.click(screen.getByRole("button",{name:/3Rechnen|3 Rechnen/}));
    const felder=screen.getAllByRole("textbox")as HTMLInputElement[];
    const vor=felder[0],nach=felder[1];expect(nach.disabled).toBe(true);
    fireEvent.change(vor,{target:{value:"99"}});
    fireEvent.click(screen.getAllByRole("button",{name:"Rechenschritt prüfen"})[0]);
    expect(nach.disabled).toBe(true);
    fireEvent.click(screen.getByRole("button",{name:/Mit Referenzwert 5 m weiterarbeiten/}));
    expect(nach.disabled).toBe(false);expect(vor.value).toBe("99");
    expect(stand().referenzen).toContain("schraege");expect(stand().hilfen).toContain("referenz:schraege");
  });
  it("verknüpft die Zeichnung mit einem stabilen Projektversuch und trennt ihre Selbsteinschätzung",()=>{
    const v=render(<ProjektWerkstatt/>);oeffnen();fireEvent.click(screen.getByRole("button",{name:/5Ablauf und Detail|5 Ablauf und Detail/}));
    const id=screen.getByTestId("zeichnung").getAttribute("data-id");
    fireEvent.click(screen.getByTestId("zeichnung"));expect(stand().zeichnen).toBe("teilweise");
    v.unmount();render(<ProjektWerkstatt/>);expect(screen.getByTestId("zeichnung").getAttribute("data-id")).toBe(id);
    fireEvent.click(screen.getByRole("button",{name:/6Ergebnis erklären|6 Ergebnis erklären/}));
    expect(within(screen.getByRole("heading",{name:"Dein Projekt im Überblick"}).parentElement!).getByText(/0 von 8/)).toBeTruthy();
    expect(screen.getByRole("button",{name:"Projekt als bearbeitet speichern"}).hasAttribute("disabled")).toBe(true);
  });
});
