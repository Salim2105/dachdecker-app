import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AktivitaetsKarte } from "@/components/AktivitaetsKarte";
import { bewerteAktivitaet, mischeAnzeige, starteAktivitaet, type Aktivitaet } from "@/lib/aktivitaeten";

import { SprachWerkstatt } from "@/components/sprache/SprachWerkstatt";
import { DEUTSCH_EINHEITEN, leseSprachStand, sprachKey } from "@/lib/sprachWerkstatt";
import { appStorage } from "@/lib/lernSpeicher";

afterEach(cleanup);
const basis = { id: "lf07-test-aktiv", version: 1, titel: "Wasserweg verstehen", auftrag: "Ordne die Bauteile zu.", erklaerung: "Jedes Bauteil hat eine eigene Aufgabe." };

describe("Stabile Anzeige und gespeicherte Aktivitätsantworten", () => {
  it("behält Fallauswahl und angezeigte Positionen bei erneutem Rendern und Öffnen", () => {
    const a: Aktivitaet = { ...basis, typ: "baustellenfall", situation: "Eine Rinne soll geprüft werden.", optionen: [
      { id: "richtig", text: "Den freien Wasserweg prüfen", korrekt: true },
      { id: "falsch-a", text: "Den Ablauf verschließen", korrekt: false },
      { id: "falsch-b", text: "Verstopfungen ignorieren", korrekt: false },
    ] };
    const onChange = vi.fn(); const onPruefen = vi.fn(); let antwort = starteAktivitaet(a);
    const view = render(<AktivitaetsKarte aktivitaet={a} antwort={antwort} geprueft={false} onChange={onChange} onPruefen={onPruefen}/>);
    const reihenfolge = () => screen.getAllByRole("checkbox").map((x) => x.closest("label")?.textContent);
    const vorher = reihenfolge();
    expect(vorher).toEqual(mischeAnzeige(a.optionen, `${a.id}:auswahl`).map((o) => o.text));
    fireEvent.click(screen.getByRole("checkbox", { name: "Den freien Wasserweg prüfen" }));
    antwort = onChange.mock.lastCall![0];
    expect(antwort.auswahl).toEqual(["richtig"]);
    view.rerender(<AktivitaetsKarte aktivitaet={a} antwort={antwort} geprueft={false} onChange={onChange} onPruefen={onPruefen}/>);
    expect(reihenfolge()).toEqual(vorher);
    view.unmount();
    render(<AktivitaetsKarte aktivitaet={a} antwort={antwort} geprueft={false} onChange={onChange} onPruefen={onPruefen}/>);
    expect(reihenfolge()).toEqual(vorher);
    expect((screen.getByRole("checkbox", { name: "Den freien Wasserweg prüfen" }) as HTMLInputElement).checked).toBe(true);
    expect(bewerteAktivitaet(a, antwort).richtig).toBe(true);
  });
  it("mischt Auswahlbedeutungen und bewahrt ihre Antwort-IDs beim erneuten Öffnen", () => {
    const a: Aktivitaet = { ...basis, typ: "zuordnen", paare: [
      { id: "rinne", links: "Dachrinne", rechts: "Sammelt Wasser an der Traufe" },
      { id: "rohr", links: "Fallrohr", rechts: "Leitet das Wasser senkrecht ab" },
      { id: "bogen", links: "Rohrbogen", rechts: "Verändert die Richtung des Rohres" },
      { id: "stutzen", links: "Stutzen", rechts: "Verbindet Rinne und Ableitung" },
    ] };
    const onChange = vi.fn(); const antwort = { ...starteAktivitaet(a), zuordnung: { rinne: "rinne" } };
    const props = { aktivitaet: a, antwort, geprueft: false, onChange, onPruefen: vi.fn() };
    const first = render(<AktivitaetsKarte {...props}/>);
    const optionen = () => Array.from((screen.getByRole("combobox", { name: "Dachrinne" }) as HTMLSelectElement).options).map((o) => [o.value, o.text]);
    const vorher = optionen();
    expect(vorher.slice(1)).toEqual(mischeAnzeige(a.paare, `${a.id}:zuordnung`).map((p) => [p.id, p.rechts]));
    first.unmount(); render(<AktivitaetsKarte {...props}/>);
    expect(optionen()).toEqual(vorher);
    expect((screen.getByRole("combobox", { name: "Dachrinne" }) as HTMLSelectElement).value).toBe("rinne");
    fireEvent.change(screen.getByRole("combobox", { name: "Fallrohr" }), { target: { value: "rohr" } });
    expect(onChange.mock.lastCall![0].zuordnung).toEqual({ rinne: "rinne", rohr: "rohr" });
  });
  it("zeigt die gespeicherte Reihenfolge und ersetzt sie nicht durch eine neue Mischung", () => {
    const a: Aktivitaet = { ...basis, typ: "reihenfolge", schritte: [
      { id: "plan", text: "Plan lesen" }, { id: "mass", text: "Maße prüfen" }, { id: "bau", text: "Bauteil montieren" }, { id: "kontrolle", text: "Ergebnis kontrollieren" },
    ] };
    const antwort = { ...starteAktivitaet(a), reihenfolge: ["mass", "plan", "bau", "kontrolle"] };
    const onChange = vi.fn();
    const props = { aktivitaet: a, antwort, geprueft: false, onChange, onPruefen: vi.fn() };
    const first = render(<AktivitaetsKarte {...props}/>);
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["1. Maße prüfen↑↓", "2. Plan lesen↑↓", "3. Bauteil montieren↑↓", "4. Ergebnis kontrollieren↑↓"]);
    fireEvent.click(screen.getByRole("button", { name: "Schritt 1 nach unten" }));
    const gespeichert = onChange.mock.lastCall![0];
    expect(gespeichert.reihenfolge).toEqual(["plan", "mass", "bau", "kontrolle"]);
    first.unmount(); render(<AktivitaetsKarte {...props} antwort={gespeichert}/>);
    expect(screen.getAllByRole("listitem")[0].textContent).toBe("1. Plan lesen↑↓");
    expect(bewerteAktivitaet(a, gespeichert).richtig).toBe(true);
  });
});

// Auch Sprachzuordnungen speichern Bedeutungen statt sichtbarer Positionen.
it("behält gemischte Sprachbedeutungen und eine gespeicherte Auswahl nach Neustart", () => {
  appStorage.clear();
  window.history.replaceState(null, "", "/sprache/deutsch#auftrag");
  const e = DEUTSCH_EINHEITEN[0]; const f = e.aufgaben[1];
  if (f.typ !== "zuordnung") throw new Error("Test benötigt Sprachzuordnung");
  appStorage.setItem(sprachKey(e), JSON.stringify({ ...leseSprachStand(e), index: 1 }));
  const first = render(<SprachWerkstatt sprache="deutsch"/>);
  const auswahl = () => screen.getByRole("combobox", { name: "Bedeutung zu sechs Stücke" }) as HTMLSelectElement;
  const reihenfolge = () => Array.from(auswahl().options).slice(1).map((o) => o.value);
  const vorher = reihenfolge();
  expect(vorher).toEqual(mischeAnzeige(f.paare, `${e.sprache}:${e.id}:${f.id}:bedeutungen`).map((p) => p.rechts));
  fireEvent.change(auswahl(), { target: { value: "Menge" } });
  first.unmount(); render(<SprachWerkstatt sprache="deutsch"/>);
  expect(reihenfolge()).toEqual(vorher);
  expect(auswahl().value).toBe("Menge");
  appStorage.clear();
});
