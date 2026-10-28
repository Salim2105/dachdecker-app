import { afterEach,beforeEach,describe,expect,it,vi } from "vitest";
import { act,cleanup,fireEvent,render,screen } from "@testing-library/react";
import { PruefungsMathe } from "@/components/mathe/PruefungsMathe";
import { MatheWerkstatt } from "@/components/mathe/MatheWerkstatt";
import { appStorage } from "@/lib/lernSpeicher";
import { ladePruefungsMatheStand } from "@/lib/pruefungsMathe";
import { recordMatheNachweis,recordTransferNachweis } from "@/lib/kompetenzNachweise";
vi.mock("@/lib/kompetenzNachweise",()=>({recordMatheNachweis:vi.fn(),recordTransferNachweis:vi.fn()}));
beforeEach(()=>{appStorage.clear();window.history.replaceState(null,"","/grundlagen/mathe");vi.spyOn(window,"scrollTo").mockImplementation(()=>{});vi.clearAllMocks();});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
const erste=()=>fireEvent.click(screen.getByRole("button",{name:/Formeln passend umstellen · Aufgabe 1/}));
describe("Unabhängiger Mathe-Probelauf",()=>{
 it("zeigt keineLösung vorAbgabe und erhält denEntwurf",()=>{
  const v=render(<PruefungsMathe/>);erste();expect(screen.queryByText(/Ein möglicher Rechenweg/)).toBeNull();expect(screen.queryByText(/b = A \/ l/)).toBeNull();
  fireEvent.change(screen.getByRole("textbox",{name:/Mein Formelansatz/}),{target:{value:"Fläche durch Länge"}});
  const zahl=screen.getAllByRole("textbox").find(e=>(e as HTMLInputElement).tagName==="INPUT")!;fireEvent.change(zahl,{target:{value:"0,"}});
  v.unmount();render(<PruefungsMathe/>);expect((screen.getByRole("textbox",{name:/Mein Formelansatz/})as HTMLTextAreaElement).value).toBe("Fläche durch Länge");expect((screen.getAllByRole("textbox").find(e=>(e as HTMLInputElement).tagName==="INPUT")as HTMLInputElement).value).toBe("0,");
 });
 it("sichert Erstabgabe vorMuster und kennzeichnet unmittelbareNacharbeit",()=>{
  const v=render(<PruefungsMathe/>);erste();const a=ladePruefungsMatheStand()!.versuche[0];
  fireEvent.change(screen.getByRole("textbox",{name:/Dein Wert/}),{target:{value:"4"}});fireEvent.change(screen.getByRole("combobox"),{target:{value:"m"}});fireEvent.click(screen.getByRole("button",{name:"Rechenweg abgeben"}));
  expect(screen.getByRole("heading",{name:"2 von 2 Punkten"})).toBeDefined();expect(recordMatheNachweis).toHaveBeenLastCalledWith(expect.objectContaining({versuchId:a.id,richtig:true,hilfen:[],nachErklaerung:false}));
  v.unmount();render(<PruefungsMathe/>);expect(ladePruefungsMatheStand()?.versuche).toHaveLength(1);
  fireEvent.click(screen.getByRole("button",{name:"Mit einer neuen Variante weiterüben"}));const neu=ladePruefungsMatheStand()!.versuche.at(-1)!;expect(neu.id).not.toBe(a.id);expect(neu.nachErklaerung).toBe(true);
 });
 it("unterscheidet erlaubtenRechner und Lernhilfen; fremdeVersuch-IDs bleiben unberücksichtigt",()=>{
  render(<PruefungsMathe/>);erste();const id=ladePruefungsMatheStand()!.aktiv!;
  act(()=>window.dispatchEvent(new CustomEvent("dachdecker:pruefung-hilfe",{detail:{versuchId:id,art:"taschenrechner"}})));
  act(()=>window.dispatchEvent(new CustomEvent("dachdecker:pruefung-hilfe",{detail:{versuchId:"fremd",art:"glossar"}})));expect(ladePruefungsMatheStand()!.versuche[0].hilfen).toEqual([]);
  act(()=>window.dispatchEvent(new CustomEvent("dachdecker:pruefung-hilfe",{detail:{versuchId:id,art:"glossar"}})));expect(ladePruefungsMatheStand()!.versuche[0]).toMatchObject({hilfen:["glossar"],werkzeuge:["taschenrechner"]});
 });
 it("erfasst verändertenKontext alsTransfer und bestätigt keineSelbstbewertung",()=>{
  render(<PruefungsMathe/>);fireEvent.click(screen.getByRole("button",{name:/Ziegeldach neu eindecken.*Kurze Transferaufgabe/}));
  const v=ladePruefungsMatheStand()!.versuche[0];if(v.aufgabe.typ!=="transfer")throw new Error("Transfer erwartet");
  fireEvent.change(screen.getByRole("textbox",{name:/Dein Wert/}),{target:{value:String(v.aufgabe.wert)}});fireEvent.change(screen.getByRole("combobox"),{target:{value:v.aufgabe.einheit}});fireEvent.click(screen.getByRole("button",{name:"Rechenweg abgeben"}));
  expect(recordTransferNachweis).toHaveBeenCalledWith(expect.objectContaining({versuchId:v.id,richtig:true,familie:"ziegeldach"}));expect(recordMatheNachweis).not.toHaveBeenCalled();
 });
 it("öffnet Prüfungsansicht trotzaltemBearbeitungspunkt, gültigerEinheitshash gewinnt",()=>{
  appStorage.setItem("fachmathe-auswahl","aufbau-trig");window.history.replaceState(null,"","/grundlagen/mathe?ansicht=pruefungsaufgaben");
  const v=render(<MatheWerkstatt/>);expect(screen.getByRole("heading",{name:"Dein Rechenweg zählt."})).toBeDefined();expect(appStorage.getItem("fachmathe-auswahl")).toBe("aufbau-trig");v.unmount();
  window.history.replaceState(null,"","/grundlagen/mathe?ansicht=pruefungsaufgaben#aufbau-trig");render(<MatheWerkstatt/>);expect(screen.getByRole("heading",{level:1,name:"Winkel, Höhe und Dachschräge"})).toBeDefined();
 });
});
