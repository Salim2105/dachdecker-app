import type { Bewertung } from "@/content/schema";
import { appStorage } from "@/lib/lernSpeicher";
import { leseZeichenEntwurf, neuerZeichenEntwurf, type ZeichenEntwurf } from "@/lib/zeichenEntwurf";

export function zeichenEntwurfKey(aufgabenId: string): string { return `drawing:draft:${aufgabenId}`; }
export function ladeZeichenEntwurf(aufgabenId: string): ZeichenEntwurf {
  return leseZeichenEntwurf(appStorage.getItem(zeichenEntwurfKey(aufgabenId)), aufgabenId) ?? neuerZeichenEntwurf(aufgabenId);
}
export function speichereZeichenEntwurf(entwurf: ZeichenEntwurf): void {
  appStorage.setItem(zeichenEntwurfKey(entwurf.aufgabenId), JSON.stringify(entwurf));
}

export const ZEICHENLAUF_KEY = "drawing:session";
export type ZeichenLauf = { ids: string[]; index: number; bewertungen: Record<string, Bewertung> };
export function ladeZeichenLauf(gueltigeIds: ReadonlySet<string>): ZeichenLauf | null {
  try {
    const text = appStorage.getItem(ZEICHENLAUF_KEY);
    if (!text) return null;
    const v = JSON.parse(text);
    if (!v || !Array.isArray(v.ids) || !v.ids.length || v.ids.length > 1000 || v.ids.some((id: unknown) => typeof id !== "string" || !gueltigeIds.has(id)) || !Number.isInteger(v.index) || v.index < 0 || v.index >= v.ids.length || !v.bewertungen || typeof v.bewertungen !== "object" || Array.isArray(v.bewertungen) || Object.entries(v.bewertungen).some(([id, b]) => !v.ids.includes(id) || !["richtig", "teilweise", "falsch"].includes(String(b)))) return null;
    return v as ZeichenLauf;
  } catch { return null; }
}
export function speichereZeichenLauf(lauf: ZeichenLauf | null): void {
  if (lauf) appStorage.setItem(ZEICHENLAUF_KEY, JSON.stringify(lauf));
  else appStorage.removeItem(ZEICHENLAUF_KEY);
}
