import { beforeEach,afterEach,describe,expect,it } from "vitest";
import { cleanup,fireEvent,render,screen } from "@testing-library/react";
import { AufbauWerkstatt } from "@/components/mathe/AufbauWerkstatt";
import { AUFBAU_EINHEITEN,aufbauKey,neuerAufbauStand,parseAufbauStand } from "@/lib/matheAufbau";
import { loadReviewRecords } from "@/lib/review";

const e=AUFBAU_EINHEITEN[0],props={einheit:e,zurueck:()=>{},weiter:()=>{}};
beforeEach(()=>{localStorage.clear();localStorage.setItem(aufbauKey(e.id),JSON.stringify(neuerAufbauStand(e,0)));});
afterEach(cleanup);
describe("Aufbau-Mathewerkstatt",()=>{
  it("behält Zwischeneingaben und Zahlen beim Schließen und bewertet die Antwort nach erneutem Öffnen einmal",()=>{
    const v=render(<AufbauWerkstatt {...props}/>);
    fireEvent.change(screen.getByLabelText("Dein Wert für Breite b"),{target:{value:"4,"}});
    fireEvent.change(screen.getByLabelText("Einheit für Breite b"),{target:{value:"m"}});
    fireEvent.change(screen.getByLabelText("Dein Merksatz in eigenen Worten"),{target:{value:"Durch Länge teilen"}});
    v.unmount();const w=render(<AufbauWerkstatt {...props}/>);
    expect((screen.getByLabelText("Dein Wert für Breite b")as HTMLInputElement).value).toBe("4,");
    fireEvent.change(screen.getByLabelText("Dein Wert für Breite b"),{target:{value:"4"}});
    fireEvent.click(screen.getByRole("button",{name:"Alle Rechenschritte prüfen"}));
    expect(screen.getByRole("status").textContent).toContain("1 von 1");
    const event=loadReviewRecords()["mathe:aufbau-formeln-1:v1"].verlauf[0];
    w.unmount();render(<AufbauWerkstatt {...props}/>);
    expect(loadReviewRecords()["mathe:aufbau-formeln-1:v1"].verlauf).toEqual([event]);
    expect((screen.getByLabelText("Dein Merksatz in eigenen Worten")as HTMLTextAreaElement).value).toBe("Durch Länge teilen");
  });
  it("archiviert alte Antworten vor einer neuen Zahlenvariante und merkt die gesehene Erklärung",()=>{
    render(<AufbauWerkstatt {...props}/>);
    fireEvent.change(screen.getByLabelText("Dein Wert für Breite b"),{target:{value:"4"}});
    fireEvent.change(screen.getByLabelText("Einheit für Breite b"),{target:{value:"m"}});
    fireEvent.click(screen.getByRole("button",{name:"Alle Rechenschritte prüfen"}));
    fireEvent.click(screen.getByRole("button",{name:"Noch einmal mit neuen Zahlen"}));
    const s=parseAufbauStand(localStorage.getItem(aufbauKey(e.id)),e)!;
    expect(s.archiv?.[0].antworten.breite.wert).toBe("4");
    expect(s.versuche[e.aufgabenIds[0]].aufgabe.variante).toBe(1);
    expect(s.versuche[e.aufgabenIds[0]].hilfen).toContain("erklaerung");
    expect((screen.getByLabelText("Dein Wert für Breite b")as HTMLInputElement).value).toBe("");
  });
});
