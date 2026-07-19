"use client";
import type { Aufgabe, Bewertung } from "@/content/schema";
import { McCard } from "@/components/aufgaben/McCard";
import { ClozeCard } from "@/components/aufgaben/ClozeCard";
import { CalcCard } from "@/components/aufgaben/CalcCard";
import { DiagramCard } from "@/components/aufgaben/DiagramCard";
import { DrawCard } from "@/components/aufgaben/DrawCard";
import { FachbegriffCard } from "@/components/aufgaben/FachbegriffCard";

export function AufgabeSwitch({
  aufgabe,
  onErgebnis,
}: {
  aufgabe: Aufgabe;
  onErgebnis: (b: Bewertung) => void;
}) {
  switch (aufgabe.typ) {
    case "mc":
      return <McCard aufgabe={aufgabe} onErgebnis={onErgebnis} />;
    case "cloze":
      return <ClozeCard aufgabe={aufgabe} onErgebnis={onErgebnis} />;
    case "calc":
      return <CalcCard aufgabe={aufgabe} onErgebnis={onErgebnis} />;
    case "diagram":
      return <DiagramCard aufgabe={aufgabe} onErgebnis={onErgebnis} />;
    case "draw":
      return <DrawCard aufgabe={aufgabe} onErgebnis={onErgebnis} />;
    case "fachbegriff":
      return <FachbegriffCard aufgabe={aufgabe} onErgebnis={onErgebnis} />;
    default:
      return null;
  }
}
