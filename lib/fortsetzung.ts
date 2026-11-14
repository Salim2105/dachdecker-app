import { getLernfeld } from "@/lib/lernfelder";
import { ladeSitzungsInfo } from "@/lib/uebungStand";

/** Topic rounds own their answers and generated calculation values. Legacy
 * unfiltered and calculation rounds deliberately keep their original IDs. */
export function uebungsSessionId(lfId: string, rechnen = false, thema?: string | null): string {
  const basis = `${lfId}${rechnen ? "-rechnung" : ""}`;
  return thema ? `${basis}-thema-${encodeURIComponent(thema)}` : basis;
}

function sitzungsAuswahl(id: string) {
  const trenner = id.indexOf("-thema-");
  const basis = trenner < 0 ? id : id.slice(0, trenner);
  let thema: string | null = null;
  if (trenner >= 0) {
    try { thema = decodeURIComponent(id.slice(trenner + 7)); } catch { return null; }
    if (!thema) return null;
  }
  const einheit = basis.endsWith("-einheit"), rechnen = basis.endsWith("-rechnung");
  if (einheit && thema) return null;
  const feld = getLernfeld(einheit ? basis.slice(0, -8) : rechnen ? basis.slice(0, -9) : basis);
  return feld ? { feld, einheit, rechnen, thema } : null;
}

/** Auch ältere Quizrunden bleiben über die gemeinsame Fortsetzung erreichbar. */
export function uebungsFortsetzung(letzte: string, lf: string) {
  for (const id of new Set([letzte, lf].filter(Boolean))) {
    const auswahl = sitzungsAuswahl(id);
    if (id !== "heute" && !auswahl) continue;
    const stand = ladeSitzungsInfo(id);
    if (!stand) continue;
    return {
      ...stand,
      href: id === "heute" ? "/heute" : auswahl!.einheit ? `/lernen/${auswahl!.feld.id}` : uebungsRoute(id)!,
      titel: id === "heute" ? "Heutige Runde fortsetzen" : auswahl!.einheit ? "Lerneinheit fortsetzen" : "Übung fortsetzen",
      thema: id === "heute" ? "Heute dran" : auswahl!.thema ?? auswahl!.feld.titel,
    };
  }
  return null;
}

/** Canonical activity route, without changing older saved pointers. */
export function uebungsRoute(id: string): string | null {
  if (id === "heute") return "/heute";
  const auswahl = sitzungsAuswahl(id);
  if (!auswahl) return null;
  const { feld, einheit, rechnen, thema } = auswahl;
  if (einheit) return `/lernen/${feld.id}?ansicht=alte-runde`;
  const query = [rechnen ? "typ=rechnung" : "", thema ? `thema=${encodeURIComponent(thema)}` : ""].filter(Boolean).join("&");
  return `/lernen/${feld.id}/ueben${query ? `?${query}` : ""}`;
}
