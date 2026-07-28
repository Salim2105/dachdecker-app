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
