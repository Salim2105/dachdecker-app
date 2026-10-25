import { getLernfeld } from "@/lib/lernfelder";
import { ladeSitzungsInfo } from "@/lib/uebungStand";

/** Auch ältere Quizrunden bleiben über die gemeinsame Fortsetzung erreichbar. */
export function uebungsFortsetzung(letzte: string, lf: string) {
  for (const id of new Set([letzte, lf].filter(Boolean))) {
    const einheit = id.endsWith("-einheit");
    const rechnen = id.endsWith("-rechnung");
    const feld = getLernfeld(einheit ? id.slice(0, -8) : rechnen ? id.slice(0, -9) : id);
    if (id !== "heute" && !feld) continue;
    const stand = ladeSitzungsInfo(id);
    if (!stand) continue;
    return {
      ...stand,
      href: id === "heute" ? "/heute" : einheit ? `/lernen/${feld!.id}` : `/lernen/${feld!.id}/ueben${rechnen ? "?typ=rechnung" : ""}`,
      titel: id === "heute" ? "Heutige Runde fortsetzen" : einheit ? "Lerneinheit fortsetzen" : "Übung fortsetzen",
      thema: id === "heute" ? "Heute dran" : feld!.titel,
    };
  }
  return null;
}
