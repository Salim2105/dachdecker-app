"use client";
import { useEffect, useState } from "react";
import { ladeFortschritt, speichereBewertung } from "@/lib/progress";
import type { AufgabenFortschritt, Bewertung } from "@/content/schema";

export function useProgress() {
  const [fortschritt, setF] = useState<Record<string, AufgabenFortschritt>>({});
  useEffect(() => setF(ladeFortschritt()), []);
  const bewerte = (id: string, b: Bewertung) => {
    speichereBewertung(id, b);
    setF(ladeFortschritt());
  };
  return { fortschritt, bewerte };
}
