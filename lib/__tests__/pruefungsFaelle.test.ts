import { describe, expect, it } from "vitest";
import { erzeugePruefungsFall, FALL_THEMEN, MUSTER_FORMEN } from "@/lib/pruefungsFaelle";
import type { PruefungsFall, RechenTeil } from "@/lib/pruefungsVorbereitungTypen";

const schritte = (f: PruefungsFall) => f.teile.flatMap(t => t.typ === "rechnen" ? t.schritte : []);
const zahlen = (f: PruefungsFall) => schritte(f).map(s => s.wert);
const varianten = [0, 1, 2] as const;
const ids = FALL_THEMEN.map(t => t.id);

describe("Zusammenhängende Prüfungsfallakten", () => {
  it("bietet sechs Familien und drei benannte Musterformen ohne amtliche Prüfungsbehauptung", () => {
    expect(ids).toEqual(["ziegeldach", "flachdach", "sanierung", "schiefer", "metalldach", "fassade"]);
    expect(MUSTER_FORMEN.map(f => [...f.fallIds])).toEqual([["ziegeldach", "flachdach"], ["flachdach", "sanierung"], ["sanierung", "ziegeldach"]]);
    expect(new Set(MUSTER_FORMEN.map(f => f.id)).size).toBe(3);
  });
  it.each(ids)("verbindet %s mit acht Aufgaben, Praxisvorbereitung und verändertem Transfer", id => {
    for (const v of varianten) {
      const f = erzeugePruefungsFall(id, v);
      expect(f.version).toBe(1); expect(f.familie).toBe(id); expect(f.variante).toBe(v);
      expect(f.teile.map(t => t.typ)).toEqual(["auswahl", "auswahl", "rechnen", "rechnen", "auswahl", "reihenfolge", "zeichnung", "begruendung"]);
      expect(new Set(f.teile.map(t => t.id)).size).toBe(8);
      for (const t of f.teile) {
        expect(t.id.startsWith(`${id}-`)).toBe(true);
        expect(t.auftrag.length).toBeGreaterThan(25); expect(t.hinweis).toBeTruthy(); expect(t.erklaerung).toBeTruthy();
        expect(t.kompetenzen.length).toBeGreaterThan(0); expect(t.minuten).toBeGreaterThan(0);
        if (t.typ === "zeichnung" || t.typ === "begruendung") {
          expect(t.kriterien.length).toBeGreaterThanOrEqual(3);
          expect(t.muster.length).toBeGreaterThan(30); expect(t.musterKurz).toBeTruthy();
        }
        if (t.kompetenzen.includes("detail")) expect(t.typ).toBe("zeichnung");
      }
      expect(f.teile[1].kompetenzen).toEqual(["plan"]);
      expect(f.praxis.gespraech).toHaveLength(4);
      [f.praxis.werkzeuge, f.praxis.material, f.praxis.sicherheit, f.praxis.kontrolle].forEach(liste => expect(liste.length).toBeGreaterThanOrEqual(3));
      expect(f.transfer.frage.length).toBeGreaterThan(80); expect(f.transfer.erklaerung.length).toBeGreaterThan(45);
      expect(Number.isFinite(f.transfer.wert)).toBe(true); expect(f.transfer.wert).toBeGreaterThan(0);
    }
  });
  it("hält die Varianten bei gleicher Auswahl identisch und trennt sie von fremden Änderungen", () => {
    for (const id of ids) {
      const a = erzeugePruefungsFall(id, 1), b = erzeugePruefungsFall(id, 1);
      expect(a).toEqual(b); expect(a).not.toBe(b);
      a.angaben[0] = "Verändert"; a.praxis.werkzeuge.push("Fremder Eintrag");
      const teil = a.teile[0]; if (teil.typ === "auswahl") teil.optionen[0].text = "Verändert";
      expect(erzeugePruefungsFall(id, 1)).toEqual(b);
      expect(erzeugePruefungsFall(id, 0).parameter).not.toEqual(erzeugePruefungsFall(id, 2).parameter);
    }
  });
  it("verwendet eindeutige Rechenschritte mit gültigen Abhängigkeiten und Rundungsangaben", () => {
    for (const id of ids) for (const v of varianten) {
      const s = schritte(erzeugePruefungsFall(id, v));
      expect(new Set(s.map(t => t.id)).size).toBe(s.length);
      s.forEach((t, i) => {
        expect(Number.isFinite(t.wert)).toBe(true); expect(t.wert).toBeGreaterThan(0);
        expect(t.einheiten).toContain(t.einheit); expect(t.punkte).toBe(2);
        expect(t.formel).toBeTruthy(); expect(t.toleranz).toBeGreaterThanOrEqual(0);
        if (t.stellen === 0) expect(Number.isInteger(t.wert)).toBe(true);
        if (t.abhaengigVon) expect(s.slice(0, i).map(v => v.id)).toContain(t.abhaengigVon);
      });
    }
  });
  it("liefert Auftragspläne ohne aktive Inhalte und ohne ausgerechnete Lösungstabellen", () => {
    for (const id of ids) for (const v of varianten) {
      const f = erzeugePruefungsFall(id, v);
      expect(f.svg).toContain("ohne Maßstab");
      expect(f.svg).not.toMatch(/<script|foreignObject|<image|onload|javascript:|https?:\/\/(?!www\.w3\.org)/i);
      expect(f.svg).not.toMatch(/Gesamtmenge|Bestellmenge|Grundbedarf|U =|R =|A = 100/);
      expect(f.angaben.join(" ")).not.toMatch(/undefined|NaN|Infinity/);
    }
  });
  it("beschriftet die Diagramme mit denselben vorgegebenen Maßen wie die Aufgaben", () => {
    for (const v of varianten) {
      const z = erzeugePruefungsFall("ziegeldach", v), p = z.parameter;
      expect(z.svg).toContain(`B = ${p.breite} m`); expect(z.svg).toContain(`h = ${p.hoehe} m`); expect(z.svg).toContain(`l = ${p.laenge} m`);
      const f = erzeugePruefungsFall("flachdach", v);
      expect(f.svg).toContain(`l = ${f.parameter.laenge} m`); expect(f.svg).toContain(`b = ${f.parameter.breite} m`);
      const fa = erzeugePruefungsFall("fassade", v);
      expect(fa.svg).toContain(`B = ${fa.parameter.breite} m`); expect(fa.svg).toContain(`H = ${fa.parameter.hoehe} m`);
    }
  });
  it.each(["nicht-vorhanden", "__proto__", "constructor"])("weist unbekannten Fall %s zurück", id => expect(() => erzeugePruefungsFall(id)).toThrow());
  it.each([-1, 3, .5, NaN, Infinity])("weist ungültige Variante %s zurück", v => expect(() => erzeugePruefungsFall("ziegeldach", v)).toThrow());
});

describe("Unabhängig nachgerechnete Varianten", () => {
  it.each([
    ["ziegeldach", [[4, 5, 100, 1250, 1375], [6, 10, 180, 2250, 2475], [5, 13, 208, 2600, 2860]]],
    ["flachdach", [[48, 12, 4.8, 52.8], [70, 17.5, 7, 77], [96, 24, 9.6, 105.6]]],
    ["sanierung", [[4, 1 / 4.5, 3.2, 128], [5, 1 / 5.5, 6, 240], [6, 1 / 6.5, 5.76, 230.4]]],
    ["schiefer", [[70, 1750, 1838], [60, 1500, 1575], [72, 1800, 1890]]],
    ["metalldach", [[10, 80, 10.56], [13, 117, 9.9], [15, 150, 15.4]]],
    ["fassade", [[24, 3, 21, 42, 47], [40, 4, 36, 72, 80], [48, 6, 42, 84, 93]]],
  ] as const)("prüft sämtliche Rechenwerte für %s", (id, erwartet) => {
    for (const v of varianten) {
      const werte = zahlen(erzeugePruefungsFall(id, v));
      expect(werte).toHaveLength(erwartet[v].length);
      werte.forEach((n, i) => expect(n, `${id}:${v}:${i}`).toBeCloseTo(erwartet[v][i], 8));
    }
  });
  it("hält Metallbahnenbreite ausreichend und erhöht genaue Stückgrenzen nicht durch Fließkommafehler", () => {
    for (const v of varianten) {
      const f = erzeugePruefungsFall("metalldach", v), n = zahlen(f)[0];
      expect(n * .5).toBeGreaterThanOrEqual(f.parameter.breite);
      expect((n - 1) * .5).toBeLessThan(f.parameter.breite);
    }
    const z = erzeugePruefungsFall("ziegeldach", 2);
    expect((z.teile[3] as RechenTeil).schritte[1].wert).toBe(2860);
  });
  it.each([
    ["ziegeldach", [50, 90, 104]], ["flachdach", [1, 1.25, 1.5]], ["sanierung", [8, 10, 12]],
    ["schiefer", [197, 237, 315]], ["metalldach", [10.56, 11.88, 13.2]], ["fassade", [18, 32, 36]],
  ] as const)("prüft die veränderte Transferanforderung für %s", (id, erwartet) => {
    for (const v of varianten) expect(erzeugePruefungsFall(id, v).transfer.wert).toBeCloseTo(erwartet[v], 8);
  });
});
