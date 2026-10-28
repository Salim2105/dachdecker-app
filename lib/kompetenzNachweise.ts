import { appStorage } from "@/lib/lernSpeicher";
import { DIAGNOSE_KEY, speichereLernsignaleEinmal, type LernSignal } from "@/lib/lerndiagnose";
import { istLernRoute, type LernKategorie } from "@/lib/lernHinweise";
import { KOMPETENZEN, type KompetenzId, type FallVersuch } from "@/lib/pruefungsVorbereitungTypen";

export const KOMPETENZ_NACHWEISE_KEY = "kompetenznachweise-v1";
export const FALL_LERNHINWEISE_KEY = "fall-lernhinweise-v1";
export type NachweisArt = "automatisch" | "selbst" | "praxis";
export interface KompetenzNachweis {
  id: string; versuchId: string; aufgabeId: string; kompetenz: KompetenzId;
  familie: string; thema: string; variante: string; inhaltsVersion: number;
  profilId: string; profilVersion?: number; am: number; art: NachweisArt;
  modus: "begleitet" | "probelauf" | "mathe" | "transfer" | "selbst" | "praxis";
  erreicht: number; moeglich: number; richtig: boolean; hilfen: string[];
  nachErklaerung: boolean; erstversuch: boolean; transfer: boolean;
  transferArt?: "kontextaufgabe" | "anderer-fallkontext";
}
export interface EinzelNachweisInput {
  versuchId: string; aufgabeId: string; familie: string; variante: string | number;
  version?: number; am?: number; richtig: boolean; hilfen?: string[];
  nachErklaerung?: boolean; erstversuch?: boolean; thema?: string; kompetenz?: KompetenzId;
}
export interface SelbstNachweisInput {
  versuchId: string; aufgabeId: string; familie: string; variante: string | number;
  kompetenz: KompetenzId; am?: number; art?: "selbst" | "praxis";
  richtig?: boolean; hilfen?: string[]; thema?: string;
}
export type KompetenzStatus = "offen" | "unterstuetzt" | "selbststaendig" | "bestaetigt";
export const KOMPETENZ_STATUS: Record<KompetenzStatus, string> = {
  offen: "Noch nicht erprobt", unterstuetzt: "Mit Unterstützung geübt",
  selbststaendig: "Selbstständig gezeigt", bestaetigt: "Später bestätigt",
};
export interface KompetenzStand {
  kompetenz: KompetenzId; status: KompetenzStatus; unabhaengig: number;
  familien: number; transfer: boolean; selbst: number; praxis: number;
  auffrischen: boolean; nachweise: KompetenzNachweis[];
}
const TAG = 86_400_000;
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0 && v.length <= 1000;
const zeit = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 8_640_000_000_000_000;
const nummer = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;
const kompetenz = (v: unknown): v is KompetenzId => typeof v === "string" && Object.hasOwn(KOMPETENZEN, v);
const erlaubt = new Set(["taschenrechner", "werkzeug:taschenrechner"]);
const ohneErlaubteWerkzeuge = (hilfen: string[]) => [...new Set(hilfen.filter(h => !erlaubt.has(h)))];

export function istKompetenzNachweis(v: unknown): v is KompetenzNachweis {
  return obj(v) && ["id", "versuchId", "aufgabeId", "familie", "thema", "variante", "profilId"].every(k => text(v[k])) &&
    kompetenz(v.kompetenz) && (v.profilVersion === undefined || Number.isSafeInteger(v.profilVersion) && Number(v.profilVersion) > 0) &&
    Number.isSafeInteger(v.inhaltsVersion) && Number(v.inhaltsVersion) > 0 && zeit(v.am) &&
    ["automatisch", "selbst", "praxis"].includes(String(v.art)) &&
    ["begleitet", "probelauf", "mathe", "transfer", "selbst", "praxis"].includes(String(v.modus)) &&
    (v.art === "automatisch" ? ["begleitet", "probelauf", "mathe", "transfer"].includes(String(v.modus)) : v.modus === v.art) &&
    nummer(v.erreicht) && nummer(v.moeglich) && v.erreicht <= v.moeglich &&
    (v.art !== "automatisch" || v.moeglich > 0) && typeof v.richtig === "boolean" &&
    (!v.richtig || v.art !== "automatisch" || v.erreicht === v.moeglich) &&
    Array.isArray(v.hilfen) && v.hilfen.every(text) && typeof v.nachErklaerung === "boolean" &&
    typeof v.erstversuch === "boolean" && typeof v.transfer === "boolean" &&
    (v.transferArt === undefined || ["kontextaufgabe", "anderer-fallkontext"].includes(String(v.transferArt)));
}
export function parseKompetenzNachweise(raw: string | null): KompetenzNachweis[] | null {
  if (raw === null) return [];
  try {
    const v: unknown = JSON.parse(raw);
    if (!obj(v) || v.version !== 1 || !Array.isArray(v.nachweise) || !v.nachweise.every(istKompetenzNachweis) ||
      new Set(v.nachweise.map(n => n.id)).size !== v.nachweise.length) return null;
    return v.nachweise;
  } catch { return null; }
}
export function ladeKompetenzNachweise(): KompetenzNachweis[] {
  return parseKompetenzNachweise(appStorage.getItem(KOMPETENZ_NACHWEISE_KEY)) ?? [];
}
export function kompetenzSpeicherFehler(): boolean {
  return parseKompetenzNachweise(appStorage.getItem(KOMPETENZ_NACHWEISE_KEY)) === null;
}
const listeners = new Set<() => void>();
export function subscribeKompetenzNachweise(listener: () => void): () => void {
  listeners.add(listener);
  if (typeof window !== "undefined") window.addEventListener("storage", listener);
  return () => { listeners.delete(listener); if (typeof window !== "undefined") window.removeEventListener("storage", listener); };
}
export const kompetenzSnapshot = () => appStorage.getItem(KOMPETENZ_NACHWEISE_KEY) ?? "";

/** Immutable evidence lives outside the bounded review and diagnosis history. */
export function speichereKompetenzNachweise(neu: KompetenzNachweis[]): void {
  if (!neu.length) return;
  if (!neu.every(istKompetenzNachweis)) throw new Error("Der Kompetenznachweis ist unvollständig.");
  const alt = parseKompetenzNachweise(appStorage.getItem(KOMPETENZ_NACHWEISE_KEY));
  if (!alt) throw new Error("Die Kompetenznachweise können nicht gelesen werden. Bitte sichere deinen Stand, bevor du weiterarbeitest.");
  const ids = new Set(alt.map(n => n.id));
  const hinzu = neu.filter(n => { if (ids.has(n.id)) return false; ids.add(n.id); return true; });
  if (!hinzu.length) return;
  appStorage.setItem(KOMPETENZ_NACHWEISE_KEY, JSON.stringify({ version: 1, nachweise: [...alt, ...hinzu].sort((a, b) => a.am - b.am) }));
  listeners.forEach(l => l());
}
function einzel(input: EinzelNachweisInput, transfer: boolean): void {
  const modus = transfer ? "transfer" : "mathe";
  const k = input.kompetenz ?? "rechnen";
  speichereKompetenzNachweise([{
    id: `${modus}:${input.versuchId}:${input.aufgabeId}:${k}`, versuchId: input.versuchId,
    aufgabeId: input.aufgabeId, kompetenz: k, familie: input.familie,
    thema: input.thema ?? input.familie, variante: String(input.variante), inhaltsVersion: input.version ?? 1,
    profilId: "dortmund-dachdeckung", profilVersion: 1, am: input.am ?? Date.now(), art: "automatisch", modus,
    erreicht: input.richtig ? 1 : 0, moeglich: 1, richtig: input.richtig,
    hilfen: ohneErlaubteWerkzeuge(input.hilfen ?? []), nachErklaerung: input.nachErklaerung ?? false,
    erstversuch: input.erstversuch ?? true, transfer,
    ...(transfer ? {transferArt: "kontextaufgabe" as const} : {}),
  }]);
}
export const recordMatheNachweis = (input: EinzelNachweisInput): void => einzel(input, false);
export const recordTransferNachweis = (input: EinzelNachweisInput): void => einzel(input, true);
export function recordSelbstNachweis(input: SelbstNachweisInput): void {
  const art = input.art ?? "selbst";
  speichereKompetenzNachweise([{
    id: `${art}:${input.versuchId}:${input.aufgabeId}:${input.kompetenz}`, versuchId: input.versuchId,
    aufgabeId: input.aufgabeId, kompetenz: input.kompetenz, familie: input.familie,
    thema: input.thema ?? input.familie, variante: String(input.variante), inhaltsVersion: 1,
    profilId: "dortmund-dachdeckung", profilVersion: 1, am: input.am ?? Date.now(), art, modus: art,
    erreicht: 0, moeglich: 0, richtig: input.richtig ?? false, hilfen: [...new Set(input.hilfen ?? [])],
    nachErklaerung: true, erstversuch: true, transfer: false,
  }]);
}

/** One case/competency produces one automatic proof, regardless of step count. */
export function syncFallNachweise(v: FallVersuch): void {
  if (v.abgegebenAm === null) return;
  const vorher = parseKompetenzNachweise(appStorage.getItem(KOMPETENZ_NACHWEISE_KEY));
  if (!vorher) throw new Error("Die Kompetenznachweise können nicht gelesen werden. Bitte sichere deinen Stand.");
  const neu: KompetenzNachweis[] = [];
  for (const fall of v.faelle) {
    for (const k of Object.keys(KOMPETENZEN) as KompetenzId[]) {
      const teile = fall.teile.filter(t => t.kompetenzen.includes(k) && t.typ !== "zeichnung" && t.typ !== "begruendung");
      if (!teile.length) continue;
      const bewertungen = teile.map(t => v.bewertungen[t.id]);
      if (bewertungen.some(b => !b || b.selbst || b.moeglich <= 0)) continue;
      const hilfen = ohneErlaubteWerkzeuge(teile.flatMap(t => [
        ...(v.antworten[t.id]?.hilfen ?? []), ...(v.antworten[t.id]?.musterOffen ? ["muster"] : []),
        ...v.hilfsEreignisse.filter(e => e.teilId === t.id || e.teilId === "*").map(e => e.art),
      ]));
      const erreicht = bewertungen.reduce((s, b) => s + b.erreicht, 0);
      const moeglich = bewertungen.reduce((s, b) => s + b.moeglich, 0);
      // Earlier case blocks of the same submitted dossier also establish a
      // genuinely different context; they still cannot satisfy time spacing.
      const kontexte = [...vorher, ...neu];
      const andererKontext = v.modus === "probelauf" && hilfen.length === 0 && erreicht === moeglich &&
        bewertungen.every(b => b.richtig) &&
        !kontexte.some(n => n.kompetenz === k && n.familie === fall.familie && unabhaengigerNachweis(n)) &&
        kontexte.some(n => n.kompetenz === k && n.familie !== fall.familie && n.am <= v.abgegebenAm! && unabhaengigerNachweis(n));
      neu.push({
        id: `fall:${v.id}:${fall.id}:${k}`, versuchId: v.id, aufgabeId: fall.id, kompetenz: k,
        familie: fall.familie, thema: fall.titel, variante: String(fall.variante), inhaltsVersion: fall.version,
        profilId: v.profilId, profilVersion: v.profilVersion, am: v.abgegebenAm, art: "automatisch", modus: v.modus,
        erreicht, moeglich, richtig: erreicht === moeglich && bewertungen.every(b => b.richtig),
        hilfen, nachErklaerung: false, erstversuch: true, transfer: andererKontext,
        ...(andererKontext ? {transferArt: "anderer-fallkontext" as const} : {}),
      });
    }
  }
  if (v.wiso?.length) {
    const richtig = v.wiso.every(q => q.wahl.length === q.korrekt.length && q.korrekt.every(i => q.wahl.includes(i)));
    const hilfen = ohneErlaubteWerkzeuge(v.hilfsEreignisse.filter(e => e.teilId === "*" || e.teilId.startsWith("wiso")).map(e => e.art));
    neu.push({
      id: `wiso:${v.id}`, versuchId: v.id, aufgabeId: "wiso", kompetenz: "wiso", familie: "wiso", thema: "Wirtschafts- und Sozialkunde",
      variante: v.wiso.map(q => q.id).join("|").slice(0, 1000), inhaltsVersion: 1, profilId: v.profilId, profilVersion: v.profilVersion,
      am: v.abgegebenAm, art: "automatisch", modus: v.modus, erreicht: richtig ? 1 : 0, moeglich: 1,
      richtig, hilfen, nachErklaerung: false, erstversuch: true, transfer: false,
    });
  }
  speichereKompetenzNachweise(neu);
  syncFallLernhinweise(v);
}

/** Feedback is an aggregate per case/competency, not one new weakness per dependent number. */
export function syncFallLernhinweise(v: FallVersuch): void {
  if (v.abgegebenAm === null) return;
  const rawMarker = appStorage.getItem(FALL_LERNHINWEISE_KEY);
  let verarbeitet: string[] = [];
  if (rawMarker !== null) {
    try {
      const parsed: unknown = JSON.parse(rawMarker);
      if (!obj(parsed) || parsed.version !== 1 || !Array.isArray(parsed.versuche) || !parsed.versuche.every(text) || new Set(parsed.versuche).size !== parsed.versuche.length) throw new Error();
      verarbeitet = parsed.versuche;
    } catch { throw new Error("Die verarbeiteten Fall-Lernhinweise können nicht gelesen werden. Bitte sichere deinen Stand."); }
  }
  if (verarbeitet.includes(v.id)) return;
  const diagnose = appStorage.getItem(DIAGNOSE_KEY);
  if (diagnose !== null) {
    try { if (!Array.isArray(JSON.parse(diagnose))) throw new Error(); }
    catch { throw new Error("Deine Lernhinweise können nicht gelesen werden. Bitte sichere deinen Stand."); }
  }
  const kategorien: Record<KompetenzId, LernKategorie> = {plan:"leseverstehen",rechnen:"rechenweg",material:"fachwissen",ablauf:"ablauf",detail:"befund",erklaeren:"leseverstehen",wiso:"fachwissen"};
  const signale: LernSignal[] = [];
  for (const fall of v.faelle) for (const k of Object.keys(KOMPETENZEN) as KompetenzId[]) {
    const teile = fall.teile.filter(t => t.kompetenzen.includes(k) && t.typ !== "zeichnung" && t.typ !== "begruendung");
    if (!teile.length) continue;
    const bewertungen = teile.map(t => v.bewertungen[t.id]);
    if (bewertungen.some(b => !b || b.selbst || !Number.isFinite(b.moeglich) || b.moeglich <= 0 || !Number.isFinite(b.erreicht) || b.erreicht < 0 || b.erreicht > b.moeglich)) continue;
    const hilfen = ohneErlaubteWerkzeuge([
      ...(v.modus === "begleitet" ? ["begleiteter-fall"] : []),
      ...teile.flatMap(t => [...(v.antworten[t.id]?.hilfen ?? []), ...(v.antworten[t.id]?.musterOffen ? ["muster"] : []), ...v.hilfsEreignisse.filter(e => e.teilId === t.id || e.teilId === "*").map(e => e.art)]),
    ]);
    const richtig = bewertungen.every(b => b.richtig && b.erreicht === b.moeglich);
    const details = [...new Set(bewertungen.flatMap(b => b.hinweise))].join(" ");
    signale.push({
      id: `fall:${v.id}:${fall.id}:${k}`, am: v.abgegebenAm, quelle: "projekt",
      aufgabeId: `fall-${fall.familie}-${k}-v${fall.version}-${fall.variante}`, lernzielId: `fall-${fall.familie}-${k}`,
      kategorie: kategorien[k], richtig, hilfen,
      route: k === "rechnen" ? "/grundlagen/mathe?ansicht=pruefungsaufgaben" : `/projekte#${fall.familie}`,
      thema: `${fall.titel}: ${KOMPETENZEN[k]}`,
      hinweis: (details || (richtig ? hilfen.length ? "Bearbeite diesen Zusammenhang später an einer neuen Variante ohne Lernhilfe." : "Du hast diesen Zusammenhang selbstständig gelöst. Ein anderer Fall hilft beim späteren Übertragen." : `Vergleiche im Fall „${fall.titel}“ noch einmal die Angaben und deinen Lösungsweg.`)).slice(0, 1200),
    });
  }
  if (v.wiso?.length) {
    const richtig = v.wiso.every(q => q.wahl.length === q.korrekt.length && q.korrekt.every(i => q.wahl.includes(i)));
    signale.push({
      id: `fall:${v.id}:wiso:wiso`, am: v.abgegebenAm, quelle: "projekt",
      aufgabeId: `fall-wiso-${v.wiso.map(q => q.id).join("-")}`, lernzielId: "fall-wiso-wiso",
      kategorie: "fachwissen", richtig,
      hilfen: ohneErlaubteWerkzeuge([...(v.modus === "begleitet" ? ["begleiteter-fall"] : []), ...v.hilfsEreignisse.filter(e => e.teilId === "*" || e.teilId.startsWith("wiso")).map(e => e.art)]),
      route: "/lernen/wiso", thema: "Wirtschafts- und Sozialkunde im Musterlauf",
      hinweis: richtig ? "Frische die Zusammenhänge später mit anderen WiSo-Fragen auf." : "Vergleiche deine Antworten zu Rechten, Pflichten und wirtschaftlichen Entscheidungen mit den passenden WiSo-Erklärungen.",
    });
  }
  if (!signale.every(s => istLernRoute(s.route))) throw new Error("Ein Lernhinweis hat noch kein unterstütztes Übungsziel.");
  speichereLernsignaleEinmal(signale);
  // Keep this completion marker beyond the capped diagnostic history. A crash
  // between the two writes is safe because signal IDs are themselves stable.
  appStorage.setItem(FALL_LERNHINWEISE_KEY, JSON.stringify({version: 1, versuche: [...verarbeitet, v.id]}));
}
export function unabhaengigerNachweis(n: KompetenzNachweis): boolean {
  return n.art === "automatisch" && n.richtig && n.erreicht === n.moeglich && n.moeglich > 0 &&
    n.modus !== "begleitet" && n.erstversuch && !n.nachErklaerung && ohneErlaubteWerkzeuge(n.hilfen).length === 0;
}
/** A repeated exact variant cannot invent another independent demonstration. */
function unabhaengigeVarianten(werte: KompetenzNachweis[]): KompetenzNachweis[] {
  const gesehen = new Set<string>();
  return [...werte].filter(unabhaengigerNachweis).sort((a, b) => a.am - b.am).filter(n => {
    const key = `${n.familie}:${n.aufgabeId}:${n.variante}:v${n.inhaltsVersion}`;
    if (gesehen.has(key)) return false;
    gesehen.add(key); return true;
  });
}
function spaeterBestaetigt(werte: KompetenzNachweis[]): boolean {
  if (werte.length < 3 || new Set(werte.map(n => n.familie)).size < 2 || !werte.some(n => n.transfer)) return false;
  // Earliest first and latest third of each family/transfer kind dominate the
  // remaining candidates, keeping long histories small without day rounding.
  const erste = new Map<string, KompetenzNachweis>(), letzte = new Map<string, KompetenzNachweis>();
  for (const n of werte) {
    const key = `${n.familie}:${n.transfer}`;
    if (!erste.has(key)) erste.set(key, n);
    letzte.set(key, n);
  }
  for (const mitte of werte) for (const a of erste.values()) {
    if (mitte.am - a.am < TAG) continue;
    for (const c of letzte.values()) {
      if (c.am - mitte.am < TAG || c.am - a.am < 7 * TAG) continue;
      if (!a.transfer && !mitte.transfer && !c.transfer) continue;
      if (new Set([a.familie, mitte.familie, c.familie]).size >= 2) return true;
    }
  }
  return false;
}
export function kompetenzStand(k: KompetenzId, nachweise = ladeKompetenzNachweise(), jetzt = Date.now()): KompetenzStand {
  const werte = nachweise.filter(n => n.kompetenz === k && n.am <= jetzt).sort((a, b) => a.am - b.am);
  const unabhaengig = unabhaengigeVarianten(werte);
  const letzteAuto = werte.filter(n => n.art === "automatisch").at(-1);
  const status: KompetenzStatus = spaeterBestaetigt(unabhaengig) ? "bestaetigt" : unabhaengig.length ? "selbststaendig" : werte.some(n => n.art === "automatisch") ? "unterstuetzt" : "offen";
  return {
    kompetenz: k, status, unabhaengig: unabhaengig.length, familien: new Set(unabhaengig.map(n => n.familie)).size,
    transfer: unabhaengig.some(n => n.transfer), selbst: werte.filter(n => n.art === "selbst").length,
    praxis: werte.filter(n => n.art === "praxis").length, auffrischen: !!letzteAuto && !letzteAuto.richtig,
    nachweise: werte,
  };
}
