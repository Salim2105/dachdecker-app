import type { Bewertung } from "@/content/schema";

export const ZEICHENBREITE = 800;
export const ZEICHENHOEHE = 500;
export const FOTO_MAX_BYTES = 20 * 1024 * 1024;
const MAX_ELEMENTE = 2000;
const MAX_PUNKTE = 10000;
const MAX_VERLAUF = 30;

export type ZeichenWerkzeug = "freihand" | "linie" | "kreis" | "text";
export type ZeichenPunkt = { x: number; y: number };
type StrichBasis = { id: string; farbe: string; breite: number };
export type ZeichenElement =
  | (StrichBasis & { typ: "freihand"; punkte: ZeichenPunkt[] })
  | (StrichBasis & { typ: "linie"; start: ZeichenPunkt; ende: ZeichenPunkt })
  | (StrichBasis & { typ: "kreis"; mitte: ZeichenPunkt; radius: number })
  | (StrichBasis & { typ: "text"; position: ZeichenPunkt; text: string });
export type ZeichenVerlauf = {
  vorher: ZeichenElement[][];
  aktuell: ZeichenElement[];
  nachher: ZeichenElement[][];
};
export type ZeichenFoto = { originalKey: string; anzeigeKey: string; name: string; mime: string };
export type ZeichenSelbstbewertung = { bewertung: Bewertung; selbstBewertet: true; zeitpunkt: number };
export type ZeichenEntwurf = {
  version: 1;
  aufgabenId: string;
  verlauf: ZeichenVerlauf;
  raster: boolean;
  zoom: number;
  werkzeug: ZeichenWerkzeug;
  farbe: string;
  breite: number;
  beschriftung: string;
  modus: "digital" | "papier";
  foto?: ZeichenFoto;
  kriterien: boolean[];
  notizen: string;
  selbstbewertung?: ZeichenSelbstbewertung;
};

export function neuerZeichenEntwurf(aufgabenId: string): ZeichenEntwurf {
  return { version: 1, aufgabenId, verlauf: { vorher: [], aktuell: [], nachher: [] }, raster: true, zoom: 1, werkzeug: "freihand", farbe: "#1f2937", breite: 3, beschriftung: "", modus: "digital", kriterien: [], notizen: "" };
}

export function begrenzePunkt(p: ZeichenPunkt): ZeichenPunkt {
  return { x: Math.max(0, Math.min(ZEICHENBREITE, p.x)), y: Math.max(0, Math.min(ZEICHENHOEHE, p.y)) };
}

export function fuegeElementHinzu(verlauf: ZeichenVerlauf, element: ZeichenElement): ZeichenVerlauf {
  if (verlauf.aktuell.length >= MAX_ELEMENTE) throw new Error("Die Zeichnung enthält bereits 2000 Elemente. Exportiere sie, bevor du eine neue beginnst.");
  return { vorher: [...verlauf.vorher, verlauf.aktuell].slice(-MAX_VERLAUF), aktuell: [...verlauf.aktuell, element], nachher: [] };
}
export function zeichnungLeeren(verlauf: ZeichenVerlauf): ZeichenVerlauf {
  return verlauf.aktuell.length ? { vorher: [...verlauf.vorher, verlauf.aktuell].slice(-MAX_VERLAUF), aktuell: [], nachher: [] } : verlauf;
}
export function zeichnungZurueck(verlauf: ZeichenVerlauf): ZeichenVerlauf {
  if (!verlauf.vorher.length) return verlauf;
  return { vorher: verlauf.vorher.slice(0, -1), aktuell: verlauf.vorher[verlauf.vorher.length - 1], nachher: [verlauf.aktuell, ...verlauf.nachher].slice(0, MAX_VERLAUF) };
}
export function zeichnungWiederholen(verlauf: ZeichenVerlauf): ZeichenVerlauf {
  if (!verlauf.nachher.length) return verlauf;
  return { vorher: [...verlauf.vorher, verlauf.aktuell].slice(-MAX_VERLAUF), aktuell: verlauf.nachher[0], nachher: verlauf.nachher.slice(1) };
}

export function selbstBewerten(bewertung: Bewertung, zeitpunkt = Date.now()): ZeichenSelbstbewertung {
  return { bewertung, selbstBewertet: true, zeitpunkt };
}

const istObjekt = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const istZahl = (v: unknown, min: number, max: number): v is number => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
const istPunkt = (v: unknown): v is ZeichenPunkt => istObjekt(v) && istZahl(v.x, 0, ZEICHENBREITE) && istZahl(v.y, 0, ZEICHENHOEHE);
function istElement(v: unknown): v is ZeichenElement {
  if (!istObjekt(v) || typeof v.id !== "string" || v.id.length > 100 || typeof v.farbe !== "string" || !/^#[0-9a-f]{6}$/i.test(v.farbe) || !istZahl(v.breite, 1, 20)) return false;
  if (v.typ === "freihand") return Array.isArray(v.punkte) && v.punkte.length > 0 && v.punkte.length <= MAX_PUNKTE && v.punkte.every(istPunkt);
  if (v.typ === "linie") return istPunkt(v.start) && istPunkt(v.ende);
  if (v.typ === "kreis") return istPunkt(v.mitte) && istZahl(v.radius, 0, Math.hypot(ZEICHENBREITE, ZEICHENHOEHE));
  return v.typ === "text" && istPunkt(v.position) && typeof v.text === "string" && v.text.length <= 200;
}
const istElementListe = (v: unknown): v is ZeichenElement[] => Array.isArray(v) && v.length <= MAX_ELEMENTE && v.every(istElement);
const istVerlaufListe = (v: unknown): v is ZeichenElement[][] => Array.isArray(v) && v.length <= MAX_VERLAUF && v.every(istElementListe);

/** Gespeicherte/aus Sicherungen importierte Vektoren werden vor dem Rendern geprüft. */
export function leseZeichenEntwurf(json: string | null, aufgabenId: string): ZeichenEntwurf | null {
  if (!json || json.length > 16 * 1024 * 1024) return null;
  try {
    const v: unknown = JSON.parse(json);
    if (!istObjekt(v) || v.version !== 1 || v.aufgabenId !== aufgabenId || !istObjekt(v.verlauf) || !istElementListe(v.verlauf.aktuell) || !istVerlaufListe(v.verlauf.vorher) || !istVerlaufListe(v.verlauf.nachher)) return null;
    if (typeof v.raster !== "boolean" || !istZahl(v.zoom, 0.5, 2) || !["freihand", "linie", "kreis", "text"].includes(String(v.werkzeug)) || typeof v.farbe !== "string" || !/^#[0-9a-f]{6}$/i.test(v.farbe) || !istZahl(v.breite, 1, 20) || typeof v.beschriftung !== "string" || v.beschriftung.length > 200 || (v.modus !== "digital" && v.modus !== "papier") || !Array.isArray(v.kriterien) || v.kriterien.length > 100 || !v.kriterien.every((k) => typeof k === "boolean") || typeof v.notizen !== "string" || v.notizen.length > 4000) return null;
    if (v.foto !== undefined && (!istObjekt(v.foto) || !["originalKey", "anzeigeKey", "name", "mime"].every((k) => typeof v.foto === "object" && typeof (v.foto as Record<string, unknown>)[k] === "string") || !String(v.foto.originalKey).startsWith("drawing:photo:") || !String(v.foto.anzeigeKey).startsWith("drawing:photo:"))) return null;
    if (v.selbstbewertung !== undefined && (!istObjekt(v.selbstbewertung) || !["richtig", "teilweise", "falsch"].includes(String(v.selbstbewertung.bewertung)) || v.selbstbewertung.selbstBewertet !== true || !istZahl(v.selbstbewertung.zeitpunkt, 0, Number.MAX_SAFE_INTEGER))) return null;
    return v as ZeichenEntwurf;
  } catch { return null; }
}

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
/** Export enthält nur eigene Vektoren, keine Musterlösung und keine ausführbaren Inhalte. */
export function zeichnungAlsSvg(elemente: ZeichenElement[], titel: string): string {
  const inhalt = elemente.map((e) => {
    const stil = `stroke="${e.farbe}" stroke-width="${e.breite}" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
    if (e.typ === "linie") return `<line x1="${e.start.x}" y1="${e.start.y}" x2="${e.ende.x}" y2="${e.ende.y}" ${stil}/>`;
    if (e.typ === "kreis") return `<circle cx="${e.mitte.x}" cy="${e.mitte.y}" r="${e.radius}" ${stil}/>`;
    if (e.typ === "text") return `<text x="${e.position.x}" y="${e.position.y}" fill="${e.farbe}" font-family="sans-serif" font-size="20">${xml(e.text)}</text>`;
    return `<polyline points="${e.punkte.map((p) => `${p.x},${p.y}`).join(" ")}" ${stil}/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ZEICHENBREITE}" height="${ZEICHENHOEHE}" viewBox="0 0 ${ZEICHENBREITE} ${ZEICHENHOEHE}"><title>${xml(titel)}</title><rect width="100%" height="100%" fill="#ffffff"/>${inhalt}</svg>`;
}

/** Dateiendungen allein reichen nicht: Fotos müssen eine passende Dateisignatur haben. */
export function erkenneFotoformat(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/heic" | null {
  if (bytes.length > FOTO_MAX_BYTES || bytes.length < 12) return null;
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b)) return "image/png";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  if (String.fromCharCode(...bytes.slice(4, 8)) !== "ftyp") return null;
  const boxEnde = Math.min(new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0), bytes.length, 256);
  for (let i = 8; i + 4 <= boxEnde; i += 4) {
    if (["heic", "heix", "hevc", "hevx", "mif1", "msf1"].includes(String.fromCharCode(...bytes.slice(i, i + 4)))) return "image/heic";
  }
  return null;
}
