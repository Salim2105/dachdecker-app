"use client";
import { createContext, useContext, useCallback, useRef, useState, type SetStateAction } from "react";
import { appStorage } from "@/lib/lernSpeicher";

export const AufgabenKontext = createContext("");
export const useAufgabenId = (id: string) => { const scope = useContext(AufgabenKontext); return scope ? `${scope}:${id}` : id; };

/** Input drafts are distinct from graded attempts and are cleared on grading. */
export function useAufgabenEntwurf<T>(id: string, feld: string, initial: T, valid: (value: unknown) => value is T) {
  const scopedId = useAufgabenId(id);
  const key = `dd-entwurf-${scopedId}-${feld}`;
  const [value, setValue] = useState<T>(() => {
    try {
      const saved: unknown = JSON.parse(appStorage.getItem(key) || "null", (_key, value) => value && typeof value === "object" && Array.isArray(value.__set) ? new Set(value.__set) : value);
      return valid(saved) ? saved : initial;
    } catch { return initial; }
  });
  const aktuell = useRef(value);
  const set = useCallback((action: SetStateAction<T>) => {
    const next = typeof action === "function" ? (action as (old: T) => T)(aktuell.current) : action;
    aktuell.current = next;
    setValue(next);
    appStorage.setItem(key, JSON.stringify(next, (_key, value) => value instanceof Set ? { __set: [...value] } : value));
  }, [key]);
  return [value, set] as const;
}
export const istText = (value: unknown): value is string => typeof value === "string";
export const istTextRecord = (value: unknown): value is Record<string, string> => !!value && typeof value === "object" && !Array.isArray(value) && Object.values(value).every((v) => typeof v === "string");
export function loescheAufgabenEntwurf(id: string) {
  // The mixed round keeps the actual submitted answer even after the old card
  // clears its editable draft. Archive first, so a storage failure keeps it intact.
  const keys = Object.keys(appStorage).filter((key) => key.startsWith(`dd-entwurf-${id}-`));
  if (id.startsWith("tagesrunde:") && keys.length) {
    appStorage.setItem(`review-antwort-${id}`, JSON.stringify(Object.fromEntries(keys.map((key) => [key.slice(`dd-entwurf-${id}-`.length), appStorage.getItem(key) ?? ""]))));
  }
  for (const key of keys) appStorage.removeItem(key);
}
