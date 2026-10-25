import { beforeEach, describe, expect, it } from "vitest";
import { AUFBAU_EINHEITEN, aufbauKey, erzeugeAufbauAufgabe, leseAufbauStand, neuerAufbauStand, parseAufbauStand, pruefeAufbauAufgabe } from "@/lib/matheAufbau";
import { appStorage } from "@/lib/lernSpeicher";

// Independent reference calculations for the printed first variant. These do
// not obtain answers from the authored solution or evaluate its formula string.
const referenzen: Record<string, number[]> = {
  "formeln-1": [4], "formeln-2": [.16, 16], "formeln-3": [20, 10],
  "trig-1": [.8660254037844386, 4.618802153517006], "trig-2": [.5773502691896257, 2.309401076758503], "trig-3": [5, 36.86989764584402],
  "flaechen-1": [24, 6, 30], "flaechen-2": [96, 110.85125168440814], "flaechen-3": [40, 38],
  "laengen-1": [4, 5], "laengen-2": [5.656854249492381, 6.4031242374328485], "laengen-3": [6.4031242374328485, 7.0710678118654755],
  "lattung-1": [13, 33.07692307692308], "lattung-2": [3.84, 13], "lattung-3": [15, 33.333333333333336],
  "bedarf-1": [.068, 882.3529411764706, 953], "bedarf-2": [.9, 6, 48], "bedarf-3": [3, 10.3, 2.575],
  "waerme-1": [.16, 4], "waerme-2": [4, 2863 / 650, 650 / 2863], "waerme-3": [58 / 15, 203 / 15],
  "gefaelle-1": [12, 1.1457628381751035], "gefaelle-2": [5.24077792830412, .2096311171321648], "gefaelle-3": [3, 1.7183580016554572],
  "masse-1": [.2, 100], "masse-2": [.192, 86.4], "masse-3": [.014, 100.8],
  "kosten-1": [54, 648, 771.12], "kosten-2": [12, 360, 860], "kosten-3": [50, 950, 1130.5],
};
beforeEach(() => appStorage.clear());
describe("Fachmathe-Aufbau: unabhängige Rechenprüfung", () => {
  it.each(Object.entries(referenzen))("prüft die Rechenschritte von %s gegen unabhängig nachgerechnete Werte", (id, zahlen) => {
    const a = erzeugeAufbauAufgabe(`aufbau-${id}`, 0);
    expect(a.schritte).toHaveLength(zahlen.length);
    a.schritte.forEach((s, i) => expect(s.wert).toBeCloseTo(zahlen[i], 10));
    const antworten = Object.fromEntries(a.schritte.map((s, i) => [s.id, { wert: zahlen[i].toFixed(s.stellen), einheit: s.einheit }]));
    expect(pruefeAufbauAufgabe(a, antworten)).toMatchObject({ richtig: true, erreicht: zahlen.length, moeglich: zahlen.length });
  });
  it("hat zehn vollständige Einheiten und drei verschiedene Aufgaben je Einheit", () => {
    expect(AUFBAU_EINHEITEN).toHaveLength(10);
    expect(new Set(AUFBAU_EINHEITEN.map(e => e.art)).size).toBe(10);
    const ids = AUFBAU_EINHEITEN.flatMap(e => e.aufgabenIds);
    expect(new Set(ids).size).toBe(30);
    expect(new Set(Object.keys(referenzen).map(id => `aufbau-${id}`))).toEqual(new Set(ids));
    for (const e of AUFBAU_EINHEITEN) {
      expect(e.aufgabenIds).toHaveLength(3);
      expect(e.text.split(/\s+/).length).toBeGreaterThanOrEqual(80);
      expect(e.text.split(/\s+/).length).toBeLessThanOrEqual(150);
      expect(e.beispiel.length).toBeGreaterThan(25);
    }
  });
  it("erzeugt für alle 150 Zahlenvarianten gültige und reproduzierbare Aufgaben", () => {
    for (const e of AUFBAU_EINHEITEN) for (const id of e.aufgabenIds) {
      const varianten = new Set<string>();
      for (let v = 0; v < 5; v++) {
        const a = erzeugeAufbauAufgabe(id, v);
        expect(a).toEqual(erzeugeAufbauAufgabe(id, v));
        expect(a.schritte.every(s => Number.isFinite(s.wert) && s.wert > 0 && s.einheiten.includes(s.einheit))).toBe(true);
        expect(a.schritte.filter(s => s.ganzzahl).every(s => Number.isInteger(s.wert) && s.toleranz === 0)).toBe(true);
        varianten.add(JSON.stringify(a.gegeben));
      }
      expect(varianten.size).toBe(5);
    }
  });
  it("behält ungerundete Zwischenwerte für U-Wert und Stückbedarf bei", () => {
    const waerme = erzeugeAufbauAufgabe("aufbau-waerme-2", 0);
    const u = waerme.schritte.at(-1)!;
    expect(u.wert).toBeCloseTo(650 / 2863, 12);
    const stueck = erzeugeAufbauAufgabe("aufbau-bedarf-1", 1);
    // 75 / 0.068 × 1.08 = 1191.176..., not early-rounded 1103 × 1.08.
    expect(stueck.schritte.at(-1)?.wert).toBe(1192);
    // 1 m first roll + 6 × 0.9 m = exactly 6.4 m; no eighth roll.
    expect(erzeugeAufbauAufgabe("aufbau-bedarf-2", 1).schritte[1].wert).toBe(7);
  });
  it("bewertet passende Teilantworten getrennt und prüft die Einheit", () => {
    const a = erzeugeAufbauAufgabe("aufbau-formeln-2", 0);
    expect(pruefeAufbauAufgabe(a, { dicke: { wert: ".160", einheit: "m" }, zentimeter: { wert: "16", einheit: "m" } })).toMatchObject({ bewertung: "teilweise", erreicht: 1, moeglich: 2 });
    expect(pruefeAufbauAufgabe(a, { dicke: { wert: ".160", einheit: "" }, zentimeter: { wert: "16", einheit: "cm" } })).toBeNull();
  });
  it("hält Dezimaltoleranzen ein und akzeptiert keine gebrochenen Stückzahlen", () => {
    const a = erzeugeAufbauAufgabe("aufbau-formeln-1", 0);
    expect(pruefeAufbauAufgabe(a, { breite: { wert: "4,005", einheit: "m" } })?.richtig).toBe(true);
    expect(pruefeAufbauAufgabe(a, { breite: { wert: "4,0051", einheit: "m" } })?.richtig).toBe(false);
    const s = erzeugeAufbauAufgabe("aufbau-lattung-1", 0);
    expect(pruefeAufbauAufgabe(s, { anzahl: { wert: "13.001", einheit: "Stück" }, abstand: { wert: "33,1", einheit: "cm" } })).toMatchObject({ erreicht: 1, bewertung: "teilweise" });
  });
  it.each(["", " ", "NaN", "Infinity", "2+2", "4m", "0x4", "4e0", "1,2,3"])("erzeugt mit ungültiger Eingabe %j keine Bewertung", wert => {
    expect(pruefeAufbauAufgabe(erzeugeAufbauAufgabe("aufbau-formeln-1", 0), { breite: { wert, einheit: "m" } })).toBeNull();
  });
  it.each([-1, 1.5, NaN, Infinity, 1_000_000_001])("verwirft die unzulässige Variantennummer %s", v => {
    expect(() => erzeugeAufbauAufgabe("aufbau-formeln-1", v)).toThrow();
  });
});
describe("Fachmathe-Aufbau: gespeicherte Varianten", () => {
  it("stellt Zahlen, Zwischenschritte, Notiz und tatsächliche Antwort unverändert wieder her", () => {
    const e = AUFBAU_EINHEITEN[1], s = neuerAufbauStand(e, 3);
    const v = s.versuche[e.aufgabenIds[0]];
    v.antworten.kosinus = { wert: "0,", einheit: "ohne Einheit" };
    v.hilfen = ["kosinus"]; s.notiz = "Ankathete gehört zum Kosinus";
    appStorage.setItem(aufbauKey(e.id), JSON.stringify(s));
    expect(leseAufbauStand(e)).toEqual(s);
    expect(parseAufbauStand(JSON.stringify(s), e)?.versuche[e.aufgabenIds[0]].aufgabe.variante).toBe(3);
  });
  it("erfindet keine rückwirkenden Erfolge und übernimmt keinen falschen Abschluss", () => {
    const e = AUFBAU_EINHEITEN[0], s = neuerAufbauStand(e, 0);
    s.abgeschlossen = true;
    const gelesen = parseAufbauStand(JSON.stringify(s), e)!;
    expect(gelesen.abgeschlossen).toBe(false);
    expect(Object.values(gelesen.versuche).every(v => !v.reviewResult)).toBe(true);
  });
  it("bewertet gespeicherte Ergebnisse anhand der echten Eingaben neu", () => {
    const e = AUFBAU_EINHEITEN[0], s = neuerAufbauStand(e, 0), v = s.versuche[e.aufgabenIds[0]];
    v.antworten.breite = { wert: "0", einheit: "m" };
    v.ergebnis = { richtig: true, bewertung: "richtig", erreicht: 1, moeglich: 1, schritte: {} };
    expect(parseAufbauStand(JSON.stringify(s), e)?.versuche[e.aufgabenIds[0]].ergebnis?.richtig).toBe(false);
  });
  it("verwirft manipulierte Zahlen und lässt nicht lesbare Originaldaten erhalten", () => {
    const e = AUFBAU_EINHEITEN[0], s = neuerAufbauStand(e, 0);
    s.versuche[e.aufgabenIds[0]].aufgabe.schritte[0].wert = 999;
    expect(parseAufbauStand(JSON.stringify(s), e)).toBeNull();
    appStorage.setItem(aufbauKey(e.id), "kaputt");
    leseAufbauStand(e);
    expect(appStorage.getItem(aufbauKey(e.id))).toBe("kaputt");
  });
});
