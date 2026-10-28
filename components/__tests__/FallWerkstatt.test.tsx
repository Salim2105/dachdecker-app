import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FallWerkstatt } from "@/components/pruefung/FallWerkstatt";
import { FallZeichnung } from "@/components/pruefung/FallZeichnung";
import { appStorage } from "@/lib/lernSpeicher";
import { FALL_VERSUCH_KEY, FALL_VERLAUF_KEY, ladeFallVersuch, ladeFallVerlauf, neuerFallVersuch, speichereFallVersuch } from "@/lib/fallVersuch";
import { meldePruefungsHilfe, pruefungsHilfenSnapshot } from "@/lib/pruefungsHilfen";
import { zeichenEntwurfKey } from "@/lib/zeichenSpeicher";
import { leseZeichenEntwurf } from "@/lib/zeichenEntwurf";

beforeEach(() => {
  appStorage.clear();
  window.history.replaceState(null, "", "/pruefung#faelle");
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const aktuell = () => ladeFallVersuch()!;
const roh = () => appStorage.getItem(FALL_VERSUCH_KEY)!;
const teil = (nummer: number) => fireEvent.click(screen.getByRole("button", { name: new RegExp(`^Teilaufgabe ${nummer}:`) }));
async function starten(probe = false, variante = 0) {
  const ansicht = render(<FallWerkstatt/>);
  if (probe) fireEvent.click(screen.getByRole("button", {name:"Selbstständiger Probelauf"}));
  if (variante) fireEvent.change(screen.getByLabelText("Aufgabenvariante"), {target:{value:String(variante)}});
  fireEvent.click(screen.getByRole("button", {name:"Fall öffnen · Ziegeldach neu eindecken"}));
  await screen.findByRole("navigation", {name:"Teilaufgaben"});
  return ansicht;
}
async function abgeben() {
  fireEvent.click(screen.getByRole("button", {name:"Bearbeitung abgeben und auswerten"}));
  await screen.findByRole("region", {name:"Auswertung"});
  await waitFor(() => expect(ladeFallVerlauf().some(v => v.id === aktuell().id && v.abgegebenAm !== null)).toBe(true));
}

describe("Prüfungsfälle als vollständiger Lernablauf", () => {
  it("zeigt im Probelauf keine Lösung vor der Abgabe und kennzeichnet angeforderte Hilfe", async () => {
    await starten(true); teil(3);
    expect(screen.queryByRole("button", {name:"Meine Antwort prüfen und Erklärung ansehen"})).toBeNull();
    expect(screen.queryByText(/Die halbe Breite beträgt 4 m/)).toBeNull();
    expect(screen.queryByText(/^Referenzwert:/)).toBeNull();
    fireEvent.click(screen.getByRole("button", {name:"Einen Denkhinweis anfordern"}));
    expect(screen.getByText(/Der First liegt mittig. Bestimme das rechtwinklige halbe Profil/)).toBeDefined();
    expect(aktuell().antworten["ziegeldach-geometrie"].hilfen).toContain("denkhinweis");
    expect(screen.queryByText(/Die halbe Breite beträgt 4 m/)).toBeNull();
    await abgeben();
    expect(screen.getByText(/Die halbe Breite beträgt 4 m/)).toBeDefined();
    expect(screen.getByText(/Keine offizielle Bestehensregel/)).toBeDefined();
  });

  it("setzt einen halben Rechenwert, Ansatz und dieselbe eingefrorene Variante nach Neuöffnung fort", async () => {
    const ansicht = await starten(true, 2); teil(3);
    fireEvent.change(screen.getByLabelText("Dein Wert für Halbe Gebäudebreite"), {target:{value:"0,"}});
    fireEvent.change(screen.getByLabelText("Meine Formel und mein Ansatz"), {target:{value:"b = B / 2"}});
    const vor = aktuell();
    ansicht.unmount(); render(<FallWerkstatt/>);
    fireEvent.click(screen.getByRole("button", {name:"Fall fortsetzen"}));
    await screen.findByLabelText("Dein Wert für Halbe Gebäudebreite");
    expect((screen.getByLabelText("Dein Wert für Halbe Gebäudebreite") as HTMLInputElement).value).toBe("0,");
    expect((screen.getByLabelText("Meine Formel und mein Ansatz") as HTMLTextAreaElement).value).toBe("b = B / 2");
    expect(aktuell().id).toBe(vor.id); expect(aktuell().faelle).toEqual(vor.faelle);
    expect(aktuell().antworten).toEqual(vor.antworten); expect(aktuell().index).toBe(2);
  });

  it("trennt zugelassenen Taschenrechner und Begriffshilfe und protokolliert Hilfe pro aktiver Aufgabe einmal", async () => {
    await starten(true);
    expect(pruefungsHilfenSnapshot()).toBe(aktuell().id);
    act(() => meldePruefungsHilfe("taschenrechner"));
    expect(aktuell().werkzeuge).toEqual(["taschenrechner"]);
    expect(aktuell().hilfsEreignisse).toEqual([]);
    act(() => meldePruefungsHilfe("glossar"));
    act(() => meldePruefungsHilfe("glossar"));
    expect(aktuell().hilfsEreignisse).toHaveLength(1);
    expect(aktuell().hilfsEreignisse[0]).toMatchObject({teilId:"ziegeldach-auftrag", art:"glossar"});
    expect(aktuell().antworten["ziegeldach-auftrag"].hilfen).toEqual(["glossar"]);
    teil(3); act(() => meldePruefungsHilfe("glossar"));
    expect(aktuell().hilfsEreignisse).toHaveLength(2);
    expect(aktuell().antworten["ziegeldach-geometrie"].hilfen).toEqual(["glossar"]);
    fireEvent.click(screen.getByRole("button", {name:"← Fallauswahl"}));
    expect(pruefungsHilfenSnapshot()).toBe("");
    const gespeichert = roh(); act(() => meldePruefungsHilfe("glossar")); expect(roh()).toBe(gespeichert);
  });

  it("erhält falsche Vorwerte und markiert Referenzhilfe auch bei nachgelagerten Rechenschritten", async () => {
    await starten(true); teil(3);
    fireEvent.change(screen.getByLabelText("Dein Wert für Halbe Gebäudebreite"), {target:{value:"99"}});
    fireEvent.change(screen.getByLabelText("Dein Wert für Wahre Dachschräge"), {target:{value:"123"}});
    fireEvent.click(screen.getByRole("button", {name:"Referenzwert als Lernhilfe ansehen · Halbe Gebäudebreite"}));
    expect((screen.getByLabelText("Dein Wert für Halbe Gebäudebreite") as HTMLInputElement).value).toBe("99");
    expect((screen.getByLabelText("Dein Wert für Wahre Dachschräge") as HTMLInputElement).value).toBe("123");
    expect(screen.getByText(/Referenzwert: 4 m/)).toBeDefined();
    const v = aktuell();
    expect(v.antworten["ziegeldach-geometrie"].hilfen).toContain("referenz:ziegeldach-halb");
    expect(v.antworten["ziegeldach-menge"].hilfen).toContain("referenz:ziegeldach-halb");
    expect(v.hilfsEreignisse.filter(e => e.art === "referenz:ziegeldach-halb").map(e => e.teilId)).toEqual(["ziegeldach-geometrie", "ziegeldach-menge"]);
    teil(4); expect(aktuell().antworten["ziegeldach-geometrie"].zahlen["ziegeldach-halb"]).toBe("99");
  });

  it("hält abgegebene Antworten und Punkte bei Navigation und späterem Selbstvergleich unverändert", async () => {
    const ansicht = await starten(true); teil(8);
    fireEvent.change(screen.getByLabelText("Meine eigene Begründung"), {target:{value:"Meine erste eigene Begründung."}});
    await abgeben();
    const fest = roh(), archiv = appStorage.getItem(FALL_VERLAUF_KEY), id = aktuell().id;
    fireEvent.change(screen.getByLabelText("Meine eigene Begründung"), {target:{value:"Nach dem Muster überarbeitet."}});
    const reflexion = JSON.parse(appStorage.getItem(`fallreflexion-${id}-v1`)!);
    expect(reflexion["ziegeldach-erklaerung"].erstText).toBe("Meine erste eigene Begründung.");
    expect(reflexion["ziegeldach-erklaerung"].text).toBe("Nach dem Muster überarbeitet.");
    teil(3);
    expect((screen.getByLabelText("Dein Wert für Halbe Gebäudebreite") as HTMLInputElement).readOnly).toBe(true);
    teil(8);
    expect((screen.getByLabelText("Meine eigene Begründung") as HTMLTextAreaElement).value).toBe("Nach dem Muster überarbeitet.");
    expect(roh()).toBe(fest); expect(appStorage.getItem(FALL_VERLAUF_KEY)).toBe(archiv);
    ansicht.unmount(); render(<FallWerkstatt/>);
    fireEvent.click(screen.getByRole("button", {name:"Auswertung öffnen"}));
    await screen.findByRole("region", {name:"Auswertung"});
    expect((screen.getByLabelText("Meine eigene Begründung") as HTMLTextAreaElement).value).toBe("Nach dem Muster überarbeitet.");
    expect(roh()).toBe(fest);
  });

  it("archiviert einen angefangenen Fall mit tatsächlichen Antworten vor dem nächsten Start", async () => {
    await starten();
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    const alt = aktuell();
    expect(alt.antworten["ziegeldach-auftrag"].wahl).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", {name:"← Fallauswahl"}));
    fireEvent.click(screen.getByRole("button", {name:"Fall öffnen · Flachdach mit Anschluss und Ablauf"}));
    await waitFor(() => expect(aktuell().faelle[0].id).toBe("flachdach"));
    expect(aktuell().id).not.toBe(alt.id);
    expect(ladeFallVerlauf().find(v => v.id === alt.id)).toEqual(alt);
    expect(ladeFallVerlauf()[0].abgegebenAm).toBeNull();
  });

  it.each(["versuch", "verlauf"] as const)("zeigt unlesbare %s-Daten an und überschreibt sie nicht durch einen Neustart", art => {
    const vorher = neuerFallVersuch(["ziegeldach"], "probelauf");
    if (art === "verlauf") speichereFallVersuch(vorher);
    const key = art === "versuch" ? FALL_VERSUCH_KEY : FALL_VERLAUF_KEY;
    appStorage.setItem(key, "{beschädigt");
    const alterVersuch = appStorage.getItem(FALL_VERSUCH_KEY);
    render(<FallWerkstatt/>);
    expect(screen.getByRole("alert").textContent).toContain("nicht lesbar");
    const start = screen.getByRole("button", {name:"Fall öffnen · Ziegeldach neu eindecken"});
    expect((start as HTMLButtonElement).disabled).toBe(true);fireEvent.click(start);
    expect(appStorage.getItem(key)).toBe("{beschädigt");
    expect(appStorage.getItem(FALL_VERSUCH_KEY)).toBe(alterVersuch);
  });
});

it("erhält die mit Tastatur gezeichnete Abgabe auch bei weiteren Zeichen-Ereignissen", () => {
  const id = "integration:abgegebene-zeichnung", titel = "Eigenes Dachprofil";
  const ansicht = render(<FallZeichnung id={id} titel={titel}/>);
  const flaeche = screen.getByRole("application", {name:"Zeichenfläche"});
  fireEvent.keyDown(flaeche, {key:"Enter"});fireEvent.keyDown(flaeche, {key:"ArrowRight"});fireEvent.keyDown(flaeche, {key:"Enter"});
  const key = zeichenEntwurfKey(id), gespeichert = appStorage.getItem(key)!;
  expect(leseZeichenEntwurf(gespeichert, id)?.verlauf.aktuell).toHaveLength(1);
  ansicht.rerender(<FallZeichnung id={id} titel={titel} abgegeben/>);
  fireEvent.keyDown(flaeche, {key:"Enter"});fireEvent.keyDown(flaeche, {key:"ArrowDown"});fireEvent.keyDown(flaeche, {key:"Enter"});
  expect(appStorage.getItem(key)).toBe(gespeichert);
});
