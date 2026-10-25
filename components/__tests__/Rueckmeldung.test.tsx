import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Rueckmeldung } from "@/components/feedback/Rueckmeldung";
import { appStorage } from "@/lib/lernSpeicher";
import { ladeFeedback } from "@/lib/feedback";
const navigation=vi.hoisted(()=>({suche:null as string|null}));
vi.mock("next/navigation",()=>({useSearchParams:()=>new URLSearchParams(navigation.suche??window.location.search)}));

const share=vi.fn();const writeText=vi.fn();
beforeEach(()=>{
  navigation.suche=null;
  appStorage.clear();window.history.replaceState(null,"","/rueckmeldung?bereich=%2Flernen%2Flf07%23lf07-k01-e01&aufgabe=lf07-001&frage=Welche%20Bauteile%3F");
  Object.defineProperty(navigator,"share",{configurable:true,value:share});
  Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText}});
  share.mockReset();writeText.mockReset();
});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
function ausfuellen(){
  fireEvent.change(screen.getByRole("textbox",{name:/Was war unverständlich/}),{target:{value:"Ich verstehe das Wort Traufe nicht."}});
  fireEvent.change(screen.getByRole("textbox",{name:/Was hast du erwartet/}),{target:{value:"Ein Bild mit einer Markierung."}});
}
describe("Rückmeldung ohne automatische Übermittlung",()=>{
  it("übernimmt bei App-Navigation den aktuellen Routerkontext statt einer noch alten Browseradresse",()=>{
    navigation.suche="bereich=%2Fbildtraining%23bild-ziegeldach-fehler&aufgabe=bild-ziegeldach-fehler";
    render(<Rueckmeldung/>);
    expect(screen.getByRole("region",{name:"Kontext der Rückmeldung"}).textContent).toContain("/bildtraining#bild-ziegeldach-fehler");
    expect(screen.getByRole("link",{name:"Zum Bereich zurück →"}).getAttribute("href")).toBe("/bildtraining#bild-ziegeldach-fehler");
  });
  it("behält Kontext, Kategorie und angefangenen Text nach Wiederöffnung",()=>{
    const first=render(<Rueckmeldung/>);ausfuellen();fireEvent.change(screen.getByRole("combobox",{name:"Kategorie"}),{target:{value:"Bedienung"}});
    first.unmount();render(<Rueckmeldung/>);
    expect((screen.getByRole("textbox",{name:/Was war unverständlich/}) as HTMLTextAreaElement).value).toContain("Traufe");
    expect((screen.getByRole("combobox",{name:"Kategorie"}) as HTMLSelectElement).value).toBe("Bedienung");
    expect(ladeFeedback()?.entwurf.bereich).toBe("/lernen/lf07#lf07-k01-e01");expect(share).not.toHaveBeenCalled();
  });
  it("wertet einen Abbruch der Teilen-Funktion nicht als verschickte Rückmeldung",async()=>{
    share.mockRejectedValue(new DOMException("abgebrochen","AbortError"));render(<Rueckmeldung/>);ausfuellen();
    fireEvent.click(screen.getByRole("button",{name:"Rückmeldung teilen"}));
    await waitFor(()=>expect(screen.getByRole("status").textContent).toContain("Teilen abgebrochen"));
    expect(ladeFeedback()?.eintraege).toHaveLength(0);
    expect(ladeFeedback()?.entwurf.beobachtung).toContain("Traufe");
  });
  it("teilt nur auf Knopfdruck und bewahrt den erfolgreichen manuellen Vorgang lokal auf",async()=>{
    share.mockResolvedValue(undefined);render(<Rueckmeldung/>);ausfuellen();
    fireEvent.click(screen.getByRole("checkbox",{name:"Die angezeigte Aufgabenangabe anhängen"}));
    fireEvent.click(screen.getByRole("button",{name:"Rückmeldung teilen"}));
    await waitFor(()=>expect(screen.getByRole("status").textContent).toContain("Teilen-Funktion übergeben"));
    expect(share).toHaveBeenCalledTimes(1);expect(share.mock.calls[0][0].text).toContain("Welche Bauteile?");
    expect(ladeFeedback()?.eintraege[0].aktion).toBe("geteilt");
  });
  it("meldet Kopieren erst nach erfolgreicher Zwischenablage und erhält Entwürfe bei Verweigerung",async()=>{
    writeText.mockRejectedValue(new Error("blocked"));render(<Rueckmeldung/>);ausfuellen();
    fireEvent.click(screen.getByRole("button",{name:"Text kopieren"}));
    await waitFor(()=>expect(screen.getByRole("alert").textContent).toContain("nicht funktioniert"));
    expect(ladeFeedback()?.eintraege).toHaveLength(0);
    writeText.mockResolvedValue(undefined);fireEvent.click(screen.getByRole("button",{name:"Text kopieren"}));
    await waitFor(()=>expect(screen.getByRole("status").textContent).toContain("Rückmeldung kopiert"));
    expect(ladeFeedback()?.eintraege[0].aktion).toBe("kopiert");
  });
  it("bietet bei fehlender Teilen-Funktion Alternativen und schützt einen ungeteilten Entwurf beim Neuanlegen",async()=>{
    Object.defineProperty(navigator,"share",{configurable:true,value:undefined});render(<Rueckmeldung/>);ausfuellen();
    fireEvent.click(screen.getByRole("button",{name:"Rückmeldung teilen"}));
    await waitFor(()=>expect(screen.getByRole("status").textContent).toContain("nicht verfügbar"));
    expect(ladeFeedback()?.eintraege).toHaveLength(0);
    fireEvent.click(screen.getByRole("button",{name:"Neue Rückmeldung beginnen"}));
    fireEvent.click(screen.getByRole("button",{name:"Entwurf öffnen"}));
    expect((screen.getByRole("textbox",{name:/Was war unverständlich/}) as HTMLTextAreaElement).value).toContain("Traufe");
  });
  it("stellt einen ausdrücklichen JSON-Download bereit, ohne die Teilen-Funktion aufzurufen",async()=>{
    const create=vi.fn<(blob:Blob)=>string>(()=>"blob:feedback-test");
    const createVorher=Object.getOwnPropertyDescriptor(URL,"createObjectURL");
    const revokeVorher=Object.getOwnPropertyDescriptor(URL,"revokeObjectURL");
    Object.defineProperty(URL,"createObjectURL",{configurable:true,value:create});
    Object.defineProperty(URL,"revokeObjectURL",{configurable:true,value:vi.fn()});
    const click=vi.spyOn(HTMLAnchorElement.prototype,"click").mockImplementation(()=>{});
    try {
      render(<Rueckmeldung/>);ausfuellen();
      fireEvent.click(screen.getByRole("button",{name:"JSON herunterladen"}));
      await waitFor(()=>expect(screen.getByRole("status").textContent).toContain("zum Download bereitgestellt"));
      expect(create).toHaveBeenCalledTimes(1);expect(create.mock.calls[0][0]).toHaveProperty("type","application/json");
      expect(click).toHaveBeenCalledTimes(1);expect(share).not.toHaveBeenCalled();
      expect(ladeFeedback()?.eintraege[0].aktion).toBe("exportiert");
    } finally {
      if(createVorher)Object.defineProperty(URL,"createObjectURL",createVorher);else Reflect.deleteProperty(URL,"createObjectURL");
      if(revokeVorher)Object.defineProperty(URL,"revokeObjectURL",revokeVorher);else Reflect.deleteProperty(URL,"revokeObjectURL");
    }
  });
});
