import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DEUTSCH_EINHEITEN, ENGLISCH_EINHEITEN, leereSprachAntwort, leseSprachStand, pruefeSprachAntwort, sprachKey, type SprachAntwort } from "@/lib/sprachWerkstatt";
import { SprachWerkstatt } from "@/components/sprache/SprachWerkstatt";
import { appStorage } from "@/lib/lernSpeicher";
import { DIAGNOSE_KEY, ladeLernsignale } from "@/lib/lerndiagnose";

beforeEach(()=>{appStorage.clear();window.history.replaceState(null,"","/sprache/deutsch");vi.spyOn(window,"scrollTo").mockImplementation(()=>{});});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});

describe("Sprachwerkstatt: überprüfbare Aufgaben",()=>{
  it("bietet zwölf konkrete Einheiten mit eindeutigen Lösungen und getrenntem Schreibvergleich",()=>{
    const alle=[...DEUTSCH_EINHEITEN,...ENGLISCH_EINHEITEN];
    expect(DEUTSCH_EINHEITEN).toHaveLength(6);expect(ENGLISCH_EINHEITEN).toHaveLength(6);
    const ids:string[]=[];
    for(const e of alle){
      expect(e.aufgaben).toHaveLength(3);expect(e.text.split(/\s+/).length).toBeGreaterThanOrEqual(80);
      expect(e.schreiben.kriterien).toHaveLength(3);
      for(const a of e.aufgaben){
        ids.push(a.id);const antwort=leereSprachAntwort();
        expect(pruefeSprachAntwort(a,antwort)).toBeNull();
        if(a.typ==="wahl")antwort.wahl=String(a.korrekt);
        else {expect(new Set(a.paare.map((p)=>p.rechts)).size).toBe(a.paare.length);antwort.paare=Object.fromEntries(a.paare.map((p)=>[p.links,p.rechts]));}
        expect(pruefeSprachAntwort(a,antwort)).toBe(true);
      }
    }
    expect(new Set(ids).size).toBe(36);
  });
  it("verwirft ungültige Auswahlwerte und erkennt vertauschte Bedeutungen",()=>{
    const e=DEUTSCH_EINHEITEN[0];const a=e.aufgaben[0];
    for(const wahl of ["", "-1", "1abc", "99", "NaN"])expect(pruefeSprachAntwort(a,{...leereSprachAntwort(),wahl})).toBeNull();
    const z=e.aufgaben[1];expect(z.typ).toBe("zuordnung");if(z.typ!=="zuordnung")throw new Error("Zuordnung fehlt");
    const paare=Object.fromEntries(z.paare.map((p)=>[p.links,p.rechts]));
    [paare[z.paare[0].links],paare[z.paare[1].links]]=[paare[z.paare[1].links],paare[z.paare[0].links]];
    expect(pruefeSprachAntwort(z,{...leereSprachAntwort(),paare})).toBe(false);
    paare[z.paare[0].links]="unbekannt";
    expect(pruefeSprachAntwort(z,{...leereSprachAntwort(),paare})).toBeNull();
  });
  it("übernimmt keinen Abschluss aus einer unvollständigen oder beschädigten Sicherung",()=>{
    const e=DEUTSCH_EINHEITEN[0];const s=leseSprachStand(e);
    appStorage.setItem(sprachKey(e),JSON.stringify({...s,abgeschlossen:true}));
    expect(leseSprachStand(e).abgeschlossen).toBe(false);
    appStorage.setItem(sprachKey(e),JSON.stringify({...s,index:99,text:"beschädigt"}));
    expect(leseSprachStand(e)).toEqual(s);
    appStorage.setItem(sprachKey(e),JSON.stringify({...s,antworten:{"auftrag-1":{...leereSprachAntwort(),wahl:"99",geprueft:true}}}));
    expect(leseSprachStand(e)).toEqual(s);
  });
});

describe("Sprachwerkstatt: unterbrechen und fortsetzen",()=>{
  it("folgt einer neuen Einheit in der Adresse und beendet Vorlesen beim Verlassen",()=>{
    const cancel=vi.fn();vi.stubGlobal("speechSynthesis",{cancel,speak:vi.fn()});
    window.history.replaceState(null,"","/sprache/englisch#werkzeuge");
    render(<SprachWerkstatt sprache="englisch"/>);
    expect(appStorage.getItem("sprachwerkstatt-englisch-auswahl")).toBe("werkzeuge");
    act(()=>{window.history.replaceState(null,"","/sprache/englisch#sicherheit");window.dispatchEvent(new HashChangeEvent("hashchange"));});
    expect(screen.getByRole("heading",{level:1}).textContent).toBe("Safety words: Warnungen verstehen");
    expect(appStorage.getItem("lernwerkstatt-zuletzt-route")).toBe("/sprache/englisch#sicherheit");
    expect(cancel).toHaveBeenCalled();
    act(()=>{window.history.replaceState(null,"","/sprache/englisch");window.dispatchEvent(new PopStateEvent("popstate"));});
    expect(screen.getByRole("heading",{level:1}).textContent).toBe("Baustellenenglisch. Schritt für Schritt.");
  });
  it("stellt eine konkrete Einheit, Auswahl und eigenen Text nach erneutem Öffnen wieder her",()=>{
    window.history.replaceState(null,"","/sprache/deutsch#auftrag");
    const first=render(<SprachWerkstatt sprache="deutsch"/>);
    fireEvent.click(screen.getByRole("radio",{name:"Die Rinnenstücke kontrollieren"}));
    fireEvent.change(screen.getByRole("textbox"),{target:{value:"Ich prüfe die vier Pakete vor dem Transport."}});
    expect(appStorage.getItem("lernwerkstatt-zuletzt-route")).toBe("/sprache/deutsch#auftrag");
    first.unmount();render(<SprachWerkstatt sprache="deutsch"/>);
    expect((screen.getByRole("radio",{name:"Die Rinnenstücke kontrollieren"}) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("Ich prüfe die vier Pakete vor dem Transport.");
    expect(appStorage.getItem(DIAGNOSE_KEY)).toBeNull();
  });
  it("speichert die konkrete Zuordnung und Aufgabe beim Wechsel und zählt nur abgegebene Antworten",()=>{
    window.history.replaceState(null,"","/sprache/deutsch#auftrag");
    const first=render(<SprachWerkstatt sprache="deutsch"/>);
    fireEvent.click(screen.getByRole("radio",{name:"Die Rinnenstücke kontrollieren"}));
    fireEvent.click(screen.getByRole("button",{name:"Antwort vergleichen"}));
    expect(ladeLernsignale()).toHaveLength(1);expect(ladeLernsignale()[0].richtig).toBe(true);
    fireEvent.click(screen.getByRole("button",{name:"Nächste Sprachaufgabe"}));
    fireEvent.change(screen.getByRole("combobox",{name:"Bedeutung zu sechs Stücke"}),{target:{value:"Menge"}});
    first.unmount();render(<SprachWerkstatt sprache="deutsch"/>);
    expect((screen.getByRole("combobox",{name:"Bedeutung zu sechs Stücke"}) as HTMLSelectElement).value).toBe("Menge");
    expect(screen.getByText("Aufgabe 2 von 3")).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Antwort vergleichen"}));
    expect(screen.getByRole("alert").textContent).toContain("jedem Begriff");
    expect(ladeLernsignale()).toHaveLength(1);
  });
  it("markiert eine Wiederholung nach Rückmeldung als unterstützt",()=>{
    window.history.replaceState(null,"","/sprache/deutsch#auftrag");render(<SprachWerkstatt sprache="deutsch"/>);
    fireEvent.click(screen.getByRole("radio",{name:"Die Rinnen heute montieren"}));
    fireEvent.click(screen.getByRole("button",{name:"Antwort vergleichen"}));
    fireEvent.click(screen.getByRole("button",{name:"Noch einmal versuchen"}));
    fireEvent.click(screen.getByRole("radio",{name:"Die Rinnenstücke kontrollieren"}));
    fireEvent.click(screen.getByRole("button",{name:"Antwort vergleichen"}));
    const [erster,zweiter]=ladeLernsignale();
    expect(erster.richtig).toBe(false);expect(erster.hilfen).toEqual([]);
    expect(zweiter.richtig).toBe(true);expect(zweiter.hilfen).toContain("rueckmeldung");
  });
  it("weist Schreibtext ausdrücklich der Selbsteinschätzung zu und erhält diese nach Schließen des Musters",()=>{
    window.history.replaceState(null,"","/sprache/englisch#sicherheit");const first=render(<SprachWerkstatt sprache="englisch"/>);
    fireEvent.change(screen.getByRole("textbox"),{target:{value:"I do not understand. Please explain."}});
    fireEvent.click(screen.getByRole("button",{name:"Mit einem Schreibbeispiel vergleichen"}));
    fireEvent.click(screen.getByRole("button",{name:"Die Kriterien passen zu meinem Text"}));
    expect(ladeLernsignale()).toHaveLength(1);expect(ladeLernsignale()[0].selbstBewertet).toBe(true);
    expect(screen.getByText(/Eigene Einschätzung/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Schreibbeispiel schließen"}));
    first.unmount();render(<SprachWerkstatt sprache="englisch"/>);
    fireEvent.click(screen.getByRole("button",{name:"Mit einem Schreibbeispiel vergleichen"}));
    expect(screen.getByRole("button",{name:"Die Kriterien passen zu meinem Text"}).getAttribute("aria-pressed")).toBe("true");
    fireEvent.change(screen.getByRole("textbox"),{target:{value:"I do not understand."}});
    expect(screen.getByRole("button",{name:"Die Kriterien passen zu meinem Text"}).getAttribute("aria-pressed")).toBe("false");
  });
  it("merkt sich Worthilfe und unabhängige Sprachbereiche getrennt",()=>{
    window.history.replaceState(null,"","/sprache/englisch#sicherheit");render(<SprachWerkstatt sprache="englisch"/>);
    fireEvent.click(screen.getByRole("button",{name:/Deine Worthilfe öffnen/}));
    fireEvent.click(screen.getByRole("radio",{name:"Den Zugang freihalten"}));
    fireEvent.click(screen.getByRole("button",{name:"Antwort vergleichen"}));
    expect(ladeLernsignale()[0]).toMatchObject({quelle:"englisch",lernzielId:"englisch-sicherheit",route:"/sprache/englisch#sicherheit",hilfen:["wortliste"]});
    expect(leseSprachStand(DEUTSCH_EINHEITEN[0]).antworten).toEqual({});
    const antwort=leseSprachStand(ENGLISCH_EINHEITEN[4]).antworten["sicherheit-1"] as SprachAntwort;
    expect(antwort.geprueft).toBe(true);
  });
});
