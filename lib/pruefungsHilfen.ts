/** Optional assessment scope. It records in-app actions, never external aids. */
let aktiv = "";
const listeners = new Set<() => void>();
export const pruefungsHilfenSnapshot = () => aktiv;
export const pruefungsHilfenServerSnapshot = () => "";
export const subscribePruefungsHilfen = (f: () => void) => { listeners.add(f); return () => { listeners.delete(f); }; };
export function registrierePruefungsHilfen(versuchId: string): () => void {
 aktiv = versuchId; listeners.forEach(f => f());
 return () => { if (aktiv === versuchId) { aktiv = ""; listeners.forEach(f => f()); } };
}
export function meldePruefungsHilfe(art: string): void {
 if (aktiv && typeof window !== "undefined") window.dispatchEvent(new CustomEvent("dachdecker:pruefung-hilfe", { detail: { art, versuchId: aktiv } }));
}
