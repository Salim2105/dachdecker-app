import { beforeEach, describe, expect, it } from "vitest";
import { DIAGNOSE_KEY, ladeLernsignale, lernEmpfehlungen, leseLernsignale, speichereLernsignal, type LernSignal } from "@/lib/lerndiagnose";
import { appStorage } from "@/lib/lernSpeicher";

const TAG = 86_400_000;
const JETZT = Date.parse("2026-10-24T12:00:00Z");
function signal(n: number, patch: Partial<LernSignal> = {}): LernSignal {
  return { id: `versuch-${n}`, am: JETZT - 100 + n, quelle: "mathe", aufgabeId: `frage-${n}`, lernzielId: "laengen", richtig: false, kategorie: "einheiten", hilfen: [], route: "/grundlagen/mathe#laengen", thema: "Längen umrechnen", ...patch };
}
beforeEach(() => appStorage.clear());

describe("Gezielte Lernhinweise aus beobachteten Antworten", () => {
  it("zeigt die konkrete Übung zum Fehler und zur verwendeten Hilfe", () => {
    const hinweise = lernEmpfehlungen([signal(1), signal(2, { lernzielId: "fachwort", kategorie: "begriffe", richtig: true, hilfen: ["worterklaerung"], route: "/lernen/lf07#lf07-e01", thema: "Dachrinne" })], JETZT);
    expect(hinweise).toHaveLength(2);
    expect(hinweise[0]).toMatchObject({ kategorie: "einheiten", route: "/grundlagen/mathe#laengen", offen: 1 });
    expect(hinweise[0].grund).toContain("Längen umrechnen");
    expect(hinweise[1].grund).toContain("Hilfe genutzt");
  });
  it("berücksichtigt weder Selbsteinschätzungen noch alte oder zukünftige Antworten", () => {
    const werte = [signal(1, { selbstBewertet: true }), signal(2, { am: JETZT - 31 * TAG }), signal(3, { am: JETZT + 1 })];
    expect(lernEmpfehlungen(werte, JETZT)).toEqual([]);
  });
  it("löst einen früheren Einheitenfehler nach zwei verschiedenen unabhängigen Rechenaufgaben desselben Lernziels auf", () => {
    const werte = [signal(1), signal(2, { richtig: true, kategorie: "rechenweg" }), signal(3, { richtig: true, kategorie: "rechenweg" })];
    expect(lernEmpfehlungen(werte, JETZT)).toEqual([]);
  });
  it("verwechselt wiederholtes Richtigklicken derselben Aufgabe nicht mit zwei unabhängigen Lösungen", () => {
    const werte = [signal(1), ...[2, 3, 4, 5, 6].map((n) => signal(n, { aufgabeId: "immer-dieselbe", richtig: true }))];
    expect(lernEmpfehlungen(werte, JETZT)).toHaveLength(1);
    expect(lernEmpfehlungen(werte, JETZT)[0].offen).toBe(1);
  });
  it("zählt eine erneute Antwort nach einer benutzten Hilfe nicht als unabhängig", () => {
    const werte = [signal(1, { hilfen: ["formel"] }), signal(2, { aufgabeId: "frage-1", richtig: true }), signal(3, { richtig: true })];
    expect(lernEmpfehlungen(werte, JETZT)).toHaveLength(1);
    expect(lernEmpfehlungen([...werte, signal(4, { richtig: true })], JETZT)).toEqual([]);
  });
  it("lässt Selbsteinschätzungen einen Fehler nicht ausräumen", () => {
    const werte = [signal(1), signal(2, { richtig: true, selbstBewertet: true }), signal(3, { richtig: true, selbstBewertet: true })];
    expect(lernEmpfehlungen(werte, JETZT)[0].offen).toBe(1);
  });
  it("holt nach einem neuen Fehler keine bereits erledigten alten Fehler zurück", () => {
    const werte = [signal(1), signal(2, { richtig: true, kategorie: "rechenweg" }), signal(3, { richtig: true, kategorie: "rechenweg" }), signal(4, { kategorie: "formel" })];
    expect(lernEmpfehlungen(werte, JETZT)).toEqual([expect.objectContaining({ kategorie: "formel", offen: 1, versuche: 1 })]);
  });
  it("erhält Hinweise auf andere Lernziele trotz zweier Erfolge in einem anderen Ziel", () => {
    expect(lernEmpfehlungen([signal(1), signal(2, { lernzielId: "flaechen", richtig: true }), signal(3, { lernzielId: "flaechen", richtig: true })], JETZT)).toHaveLength(1);
  });
  it("sortiert importierte Ereignisse nach Zeit und zählt doppelte Ereignis-IDs nur einmal", () => {
    const werte = [signal(3, { richtig: true, kategorie: "rechenweg" }), signal(1), signal(2, { richtig: true, kategorie: "rechenweg" }), signal(2, { richtig: true, kategorie: "rechenweg" })];
    expect(leseLernsignale(JSON.stringify(werte)).map((s) => s.id)).toEqual(["versuch-1", "versuch-2", "versuch-3"]);
    expect(lernEmpfehlungen(werte, JETZT)).toEqual([]);
  });
});

describe("Gespeicherte Lernsignale", () => {
  it("speichert und lädt tatsächliche Antworten samt Hilfen und Ziel unverändert", () => {
    const { id: _id, am: _am, ...wert } = signal(1, { hilfen: ["formel"] });
    void _id; void _am;
    speichereLernsignal(wert, JETZT);
    expect(ladeLernsignale()).toEqual([expect.objectContaining({ ...wert, am: JETZT })]);
  });
  it("ignoriert ungültige Sicherungsdaten und fremde oder manipulierbare Zieladressen", () => {
    expect(leseLernsignale("kaputt")).toEqual([]);
    expect(leseLernsignale("{}")).toEqual([]);
    const ungueltigeRouten = ["https://example.org", "//example.org", "/lernen/../../einstellungen", "/sprache/deutsch#\nfehler", "/grundlagen/mathe?redirect=https://example.org", "/lernen\\example.org", "/unbekannt"];
    for (const route of ungueltigeRouten) expect(leseLernsignale(JSON.stringify([signal(1, { route })]))).toEqual([]);
    for (const patch of [{ richtig: "ja" }, { selbstBewertet: "nein" }, { hilfen: [false] }, { lernzielId: "" }, { kategorie: "langsam" }, { kategorie: ["formel"] }, { quelle: ["mathe"] }, { am: -1 }]) expect(leseLernsignale(JSON.stringify([{ ...signal(1), ...patch }]))).toEqual([]);
    expect(ladeLernsignale()).toEqual([]);
  });
  it("behält höchstens 240 Ereignisse und höchstens acht aktuelle Empfehlungen", () => {
    appStorage.setItem(DIAGNOSE_KEY, JSON.stringify(Array.from({ length: 300 }, (_, n) => signal(n, { lernzielId: `ziel-${n}` }))));
    const werte = ladeLernsignale();
    expect(werte).toHaveLength(240);
    expect(werte[0].id).toBe("versuch-60");
    expect(lernEmpfehlungen(werte, JETZT + 1000)).toHaveLength(8);
  });
  it("vergibt auch bei vollem Speicher und gleichem Zeitstempel eindeutige Ereignis-IDs", () => {
    const { id: _id, am: _am, ...wert } = signal(1);
    void _id; void _am;
    for (let n = 0; n < 245; n++) speichereLernsignal(wert, JETZT);
    const gespeichert = ladeLernsignale();
    expect(gespeichert).toHaveLength(240);
    expect(new Set(gespeichert.map((s) => s.id)).size).toBe(240);
  });
});
