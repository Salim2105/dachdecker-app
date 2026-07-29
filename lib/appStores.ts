export function createStringStore(key: string) {
  let cache: string | undefined;
  const listeners = new Set<() => void>();
  return {
    subscribe(cb: () => void) {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    getSnapshot(): string {
      if (typeof window === "undefined") return "";
      if (cache === undefined) cache = localStorage.getItem(key) ?? "";
      return cache;
    },
    getServerSnapshot: () => "",
    set(value: string) {
      cache = value;
      try {
        if (typeof window !== "undefined") {
          if (value) localStorage.setItem(key, value);
          else localStorage.removeItem(key);
        }
      } catch {}
      listeners.forEach((l) => l());
    },
  };
}

export const datumStore = createStringStore("pruefungsdatum");
export const letztesLfStore = createStringStore("letztesLf");

/** Eingabeart beim Lückentext: Wörter antippen statt tippen (für Handschuhe). */
const wortbankRaw = createStringStore("wortbank");
export const wortbankStore = {
  subscribe: wortbankRaw.subscribe,
  getSnapshot: () => wortbankRaw.getSnapshot() === "1",
  getServerSnapshot: () => false,
  set: (an: boolean) => wortbankRaw.set(an ? "1" : ""),
};

/**
 * Ton beim Prüfen einer Antwort. Standardmäßig AN.
 *
 * Umgekehrt gespeichert als die Wortbank: hier steht "0" für aus, leer für an.
 * Sonst wäre der Standard aus, und ein Ton, den man erst suchen muss, hört
 * niemand je.
 */
const tonRaw = createStringStore("ton-aus");
export const tonStore = {
  subscribe: tonRaw.subscribe,
  getSnapshot: () => tonRaw.getSnapshot() !== "0",
  // Auf dem Server still — sonst gäbe es beim Hydrieren einen Zustandssprung.
  getServerSnapshot: () => true,
  set: (an: boolean) => tonRaw.set(an ? "" : "0"),
};
