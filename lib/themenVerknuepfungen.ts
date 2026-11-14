import type { LernEinheit } from "@/lib/curriculum";
import type { KursStand } from "@/lib/kursStand";
import { lernDachVerweise } from "@/lib/dach3dVerknuepfungen";
import { getWerkstattEinheit } from "@/lib/werkstattInhalte";
import { getDachPraxisVideo, getWerkstattPraxisVideo } from "@/lib/praxisVideoInhalte";
import { praxisVideoMedien } from "@/lib/praxisVideoMedien";

export interface ThemenAngebot {
  id: string; art: "Erklärung" | "Handwerk" | "3D-Modell" | "Film";
  titel: string; beschreibung: string; href: string;
}

// Explicit editorial connections: a shared learning field alone is not enough
// to promise that a film shows the very procedure explained in a lesson.
const WERKSTATT_LEKTIONEN: Record<string, readonly string[]> = {
  "lf02-l02": ["werkstatt-falzziegel-ziegel"],
  "lf02-l15": ["werkstatt-falzziegel-ziegel", "werkstatt-biber-doppel-ziegel"],
  "lf02-l06": ["werkstatt-falzziegel-laengen"],
  "lf08-l09": ["werkstatt-biber-doppel-ziegel"],
  "lf08-l12": ["werkstatt-falzziegel-laengen", "werkstatt-falzziegel-breiten"],
  "lf08-l13": ["werkstatt-falzziegel-ziegel", "werkstatt-biber-doppel-ziegel"],
  "lf08-l16": ["werkstatt-biber-doppel-ziegel", "werkstatt-biber-doppel-verlegen"],
  "lf08-l20": ["werkstatt-falzziegel-verlegen", "werkstatt-falzziegel-schnitt", "werkstatt-falzziegel-bearbeiten"],
  "lf08-l23": ["werkstatt-falzziegel-laengen", "werkstatt-falzziegel-breiten"],
};
const FLUESSIGABDICHTUNG = [
  { id: "lf10-l11-e01", lf: "lf10", titel: "Flüssigabdichtung als System verstehen", beschreibung: "Harz, Vliesarmierung und Aushärtebedingungen zusammenführen." },
  { id: "lf14-l02-e01", lf: "lf14", titel: "Gully, Rohr und schwierige Ecke abdichten", beschreibung: "Anschlüsse, Manschetten und geeignete Flüssigabdichtungen unterscheiden." },
] as const;

export function themenAngeboteFuer(einheit: Pick<LernEinheit, "id" | "lektionIds">): ThemenAngebot[] {
  const angebote: ThemenAngebot[] = [];
  if (einheit.lektionIds.some(id => id === "lf10-l11" || id === "lf14-l02")) {
    for (const e of FLUESSIGABDICHTUNG) if (e.id !== einheit.id) angebote.push({
      id: e.id, art: "Erklärung", titel: e.titel, beschreibung: e.beschreibung, href: `/lernen/${e.lf}#${e.id}`,
    });
  }
  for (const id of new Set(einheit.lektionIds.flatMap(id => WERKSTATT_LEKTIONEN[id] ?? []))) {
    const e = getWerkstattEinheit(id);
    if (!e) continue;
    const deckung = e.pfadId === "falzziegel" ? "Falzziegel" : "Biber-Doppeldeckung";
    angebote.push({ id: e.id, art: "Handwerk", titel: `${e.titel} · ${deckung}`, beschreibung: "Bildanleitung, eigene Aufgaben und Praxisauftrag am Schulmodell.", href: `/projekte#${e.id}` });
    const film = getWerkstattPraxisVideo(e.pfadId, e.slug);
    if (film && praxisVideoMedien(film).video) angebote.push({
      id: film.id, art: "Film", titel: film.titel, beschreibung: "Den passenden Handgriff als steuerbaren 3D-Lernfilm ansehen.", href: `/projekte?medium=film#${e.id}`,
    });
  }
  for (const ref of lernDachVerweise(einheit.lektionIds)) {
    angebote.push({ id: `modell-${ref.form}-${ref.detailId}`, art: "3D-Modell", titel: ref.titel, beschreibung: "Bauteil und Aufbau am Lehrdach untersuchen.", href: ref.href });
    const deckung = ref.form === "flachdach" ? "warmdach" : "falzziegel";
    const film = getDachPraxisVideo(ref.form, deckung, ref.detailId);
    if (film && praxisVideoMedien(film).video) angebote.push({
      id: film.id, art: "Film", titel: film.titel, beschreibung: "Den zugehörigen Aufbau als 3D-Lernfilm nachvollziehen.", href: `/projekte?medium=film&deckung=${deckung}#dach-${ref.form}-${ref.detailId}`,
    });
  }
  return angebote.filter((e, index) => angebote.findIndex(a => a.art === e.art && a.id === e.id) === index);
}

/** Direct practice reuses the saved answers without inventing a self-rating or
 * moving the prerequisite-based course phase forward. */
export function kontrollfragenEinstieg(e: Pick<LernEinheit, "aufgabenIds">, stand: KursStand, search: string): KursStand {
  const query = new URLSearchParams(search);
  if (query.get("schritt") !== "kontrollfragen" || !e.aufgabenIds.length) return stand;
  const index = e.aufgabenIds.indexOf(query.get("aufgabe") ?? "");
  return { ...stand, kontrollfragenDirekt: true, ...(index >= 0 ? { kontrolleIndex: index } : {}) };
}

export function kursFortsetzungsRoute(lf: string, id: string, direkt = false): string {
  return `/lernen/${lf}${direkt ? "?schritt=kontrollfragen" : ""}#${id}`;
}

export function filmGewuenscht(search: string): boolean {
  return new URLSearchParams(search).get("medium") === "film";
}
