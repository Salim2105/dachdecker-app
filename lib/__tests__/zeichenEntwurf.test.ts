import { describe, expect, it } from "vitest";
import {
  begrenzePunkt, erkenneFotoformat, fuegeElementHinzu, leseZeichenEntwurf, neuerZeichenEntwurf,
  selbstBewerten, zeichnungAlsSvg, zeichnungLeeren, zeichnungWiederholen, zeichnungZurueck,
  type ZeichenElement,
} from "@/lib/zeichenEntwurf";

const linie: ZeichenElement = { id: "linie-1", typ: "linie", start: { x: 10, y: 20 }, ende: { x: 100, y: 200 }, farbe: "#1f2937", breite: 3 };
const kreis: ZeichenElement = { id: "kreis-1", typ: "kreis", mitte: { x: 100, y: 200 }, radius: 50, farbe: "#b42318", breite: 2 };

describe("Zeichenentwürfe", () => {
  it("macht Leeren rückgängig und verwirft nur den überholten Wiederholungszweig", () => {
    const leer = neuerZeichenEntwurf("draw-1").verlauf;
    const eins = fuegeElementHinzu(leer, linie);
    const zwei = fuegeElementHinzu(eins, kreis);
    expect(leer.aktuell).toEqual([]);
    expect(zeichnungZurueck(zeichnungLeeren(zwei)).aktuell).toEqual([linie, kreis]);
    const zurueck = zeichnungZurueck(zwei);
    expect(zurueck.aktuell).toEqual([linie]);
    expect(zeichnungWiederholen(zurueck).aktuell).toEqual([linie, kreis]);
    expect(fuegeElementHinzu(zurueck, { ...kreis, id: "neu" }).nachher).toEqual([]);
  });
  it("stellt Vektoren, Undo-Zweig, Fotoverweise, Notizen und ausdrücklich manuelles Urteil wieder her", () => {
    const entwurf = { ...neuerZeichenEntwurf("draw-1"), verlauf: zeichnungZurueck(fuegeElementHinzu(fuegeElementHinzu(neuerZeichenEntwurf("draw-1").verlauf, linie), kreis)), zoom: 1.5,
      foto: { originalKey: "drawing:photo:draw-1:original", anzeigeKey: "drawing:photo:draw-1:display", name: "Papier.heic", mime: "image/heic" },
      kriterien: [true, false], notizen: "Den Ablauf genauer beschriften.", selbstbewertung: selbstBewerten("teilweise", 1234) };
    const geladen = leseZeichenEntwurf(JSON.stringify(entwurf), "draw-1");
    expect(geladen).toEqual(entwurf);
    expect(zeichnungWiederholen(geladen!.verlauf).aktuell).toHaveLength(2);
    expect(geladen?.selbstbewertung?.selbstBewertet).toBe(true);
  });
  it("verwirft fremde Aufgaben, ungültige Koordinaten und injizierte SVG-Attribute", () => {
    const entwurf = { ...neuerZeichenEntwurf("draw-1"), verlauf: { vorher: [], aktuell: [linie], nachher: [] } };
    expect(leseZeichenEntwurf(JSON.stringify(entwurf), "draw-2")).toBeNull();
    expect(leseZeichenEntwurf(JSON.stringify({ ...entwurf, verlauf: { ...entwurf.verlauf, aktuell: [{ ...linie, start: { x: -100, y: 20 } }] } }), "draw-1")).toBeNull();
    expect(leseZeichenEntwurf(JSON.stringify({ ...entwurf, verlauf: { ...entwurf.verlauf, aktuell: [{ ...linie, farbe: 'red" onload="alert(1)' }] } }), "draw-1")).toBeNull();
    expect(begrenzePunkt({ x: 1200, y: -30 })).toEqual({ x: 800, y: 0 });
  });
  it("exportiert Beschriftungen als Text und enthält weder Musterlösung noch ausführbare Tags", () => {
    const svg = zeichnungAlsSvg([linie, { id: "text", typ: "text", position: { x: 20, y: 30 }, text: '<script>alert("x")</script>', farbe: "#1f2937", breite: 3 }], "Eigene & erste Zeichnung");
    expect(svg).toContain('viewBox="0 0 800 500"');
    expect(svg).toContain("&lt;script&gt;");
    expect(svg).toContain("Eigene &amp; erste Zeichnung");
    expect(svg).not.toContain("<script>");
    expect(svg).not.toContain("Musterlösung");
  });
});

describe("Fotoformat wird über Dateisignatur erkannt", () => {
  it("akzeptiert JPEG, PNG und HEIC und weist umbenannte Dateien zurück", () => {
    expect(erkenneFotoformat(new Uint8Array([255, 216, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe("image/jpeg");
    expect(erkenneFotoformat(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]))).toBe("image/png");
    expect(erkenneFotoformat(new Uint8Array([0, 0, 0, 16, 102, 116, 121, 112, 104, 101, 105, 99, 0, 0, 0, 0]))).toBe("image/heic");
    expect(erkenneFotoformat(new TextEncoder().encode("<svg>kein Foto</svg>"))).toBeNull();
  });
});
