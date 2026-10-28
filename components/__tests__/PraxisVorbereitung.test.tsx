import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { PraxisVorbereitung } from "@/components/projekte/PraxisVorbereitung";
import { ProjektWerkstatt } from "@/components/projekte/ProjektWerkstatt";
import { appStorage } from "@/lib/lernSpeicher";
import { ladePraxisVorbereitung,praxisVorbereitungKey } from "@/lib/praxisVorbereitung";
import type { DrawAufgabe } from "@/content/schema";
vi.mock("@/components/aufgaben/DrawCard",()=>({DrawCard:({aufgabe,onErgebnis}:{aufgabe:DrawAufgabe;onErgebnis:(b:"teilweise")=>void})=><button data-testid="praxis-zeichnung" data-id={aufgabe.id} onClick={()=>onErgebnis("teilweise")}>Eigene Skizze vergleichen</button>}));
beforeEach(()=>{appStorage.clear();window.history.replaceState(null,"","/projekte?ansicht=praxis");vi.spyOn(window,"scrollTo").mockImplementation(()=>{});});afterEach(()=>{cleanup();vi.restoreAllMocks();window.history.replaceState(null,"","/");});
describe("Praktische Vorbereitung",()=>{
 it("behält aktuelle und erste Planung beim Wechsel und nach Neustart",()=>{
  const v=render(<PraxisVorbereitung/>);expect(screen.getAllByRole("option")).toHaveLength(6);
  fireEvent.change(screen.getByRole("textbox",{name:"Welche Werkzeuge brauche ich?"}),{target:{value:"Maßband und Bleistift"}});fireEvent.change(screen.getByRole("textbox",{name:"Welches Material und welche Angaben brauche ich?"}),{target:{value:"Ziegel und Sonderteile"}});fireEvent.change(screen.getByRole("textbox",{name:"Wie gehe ich vor?"}),{target:{value:"Plan prüfen"}});fireEvent.click(screen.getByRole("button",{name:"Meine Vorbereitung festhalten"}));fireEvent.change(screen.getByRole("textbox",{name:"Wie gehe ich vor?"}),{target:{value:"Auch Anschlüsse klären"}});
  fireEvent.change(screen.getByRole("combobox",{name:"Praxisthema auswählen"}),{target:{value:"fassade"}});expect((screen.getByRole("textbox",{name:"Welche Werkzeuge brauche ich?"})as HTMLTextAreaElement).value).toBe("");fireEvent.change(screen.getByRole("combobox",{name:"Praxisthema auswählen"}),{target:{value:"ziegeldach"}});expect((screen.getByRole("textbox",{name:"Wie gehe ich vor?"})as HTMLTextAreaElement).value).toBe("Auch Anschlüsse klären");expect(ladePraxisVorbereitung("ziegeldach")?.erstePlanung?.ablauf).toBe("Plan prüfen");v.unmount();render(<PraxisVorbereitung/>);expect((screen.getByRole("textbox",{name:"Welche Werkzeuge brauche ich?"})as HTMLTextAreaElement).value).toBe("Maßband und Bleistift");
 });
 it("unterscheidet eigene Ausführung, Feedbackentwurf und eingetragene Rückmeldung",()=>{
  render(<PraxisVorbereitung initialThema="flachdach"/>);fireEvent.click(screen.getByRole("checkbox",{name:"Ich habe den Auftrag praktisch geübt."}));expect(ladePraxisVorbereitung("flachdach")?.ausgefuehrt).toBe(true);fireEvent.change(screen.getByRole("textbox",{name:"Welche Rückmeldung habe ich erhalten?"}),{target:{value:"Wasserweg gut erklärt"}});expect(ladePraxisVorbereitung("flachdach")?.rueckmeldungErfasst).toBe(false);fireEvent.click(screen.getByRole("button",{name:"Rückmeldung als eingetragen markieren"}));expect(ladePraxisVorbereitung("flachdach")?.rueckmeldungErfasst).toBe(true);expect(within(screen.getByRole("region",{name:"Getrennte Praxisnachweise"})).getByText(/Rückmeldung aus Betrieb oder Schule eingetragen/)).toBeDefined();fireEvent.change(screen.getByRole("textbox",{name:"Welche Rückmeldung habe ich erhalten?"}),{target:{value:"Noch in Bearbeitung"}});expect(ladePraxisVorbereitung("flachdach")?.rueckmeldungErfasst).toBe(false);
 });
 it("verwendet nach Wiederöffnen dieselbe private Zeichnungs-ID",()=>{
  const v=render(<PraxisVorbereitung/>);fireEvent.click(screen.getByRole("button",{name:"Skizze zeichnen oder Papierfoto ergänzen"}));const id=screen.getByTestId("praxis-zeichnung").getAttribute("data-id");fireEvent.click(screen.getByTestId("praxis-zeichnung"));v.unmount();render(<PraxisVorbereitung/>);fireEvent.click(screen.getByRole("button",{name:"Skizze zeichnen oder Papierfoto ergänzen"}));expect(screen.getByTestId("praxis-zeichnung").getAttribute("data-id")).toBe(id);expect(ladePraxisVorbereitung("ziegeldach")?.zeichnung).toBe("teilweise");
 });
 it("schützt beschädigte Daten und gibt bestehenden Projekthashes Vorrang",()=>{
  appStorage.setItem(praxisVorbereitungKey("ziegeldach"),"kaputt");const v=render(<PraxisVorbereitung/>);expect(screen.getByRole("alert").textContent).toContain("nicht überschrieben");expect(appStorage.getItem(praxisVorbereitungKey("ziegeldach"))).toBe("kaputt");v.unmount();window.history.replaceState(null,"","/projekte?ansicht=praxis#ziegeldach");render(<ProjektWerkstatt/>);expect(screen.getByRole("textbox",{name:"Meine Projektnotizen"})).toBeDefined();expect(screen.queryByRole("heading",{name:"Dein Praxisblatt für Betrieb und Schule"})).toBeNull();fireEvent.click(screen.getByRole("button",{name:"← Alle Projekte"}));expect(screen.getByRole("heading",{name:"Vom Auftrag zum fertigen Plan."})).toBeDefined();
 });
 it("öffnet trotz gespeicherter Projektauswahl die Praxisblätter und druckt lokal",()=>{
  appStorage.setItem("bauprojekte-auswahl","fassade");const druck=vi.spyOn(window,"print").mockImplementation(()=>{});render(<ProjektWerkstatt/>);expect(screen.getByRole("heading",{name:"Dein Praxisblatt für Betrieb und Schule"})).toBeDefined();fireEvent.click(screen.getByRole("button",{name:"Praxisblatt drucken / als PDF sichern"}));expect(druck).toHaveBeenCalledOnce();
 });
});
