"use client";
import { useState } from "react";
import type { DachMedienRef } from "@/lib/dach3dTypen";
import { istDachBildRef } from "@/lib/dach3dAufgaben";

export function DachBild({ medium, alt, className }: { medium: DachMedienRef; alt: string; className?: string }) {
  const [fehlend, setFehlend] = useState("");
  if (!istDachBildRef(medium)) return <p role="alert">Diese gespeicherte Ansicht ist nicht gültig. Deine Antworten bleiben erhalten.</p>;
  const quelle = `/dach-vorschau/v1/${medium.form}-${medium.deckung}/${medium.detailId}-${medium.ansicht}.webp`;
  return fehlend === quelle ? <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}><p>{alt}</p><p>Die feste Ansicht ist gerade nicht verfügbar. Die Aufgabenbeschreibung enthält die Angaben für deine Entscheidung.</p></div> :
    // Own versioned renders keep their exact aspect ratio without a remote image service.
    // eslint-disable-next-line @next/next/no-img-element
    <img className={className} src={quelle} alt={alt} width={960} height={640} loading="lazy" onError={() => setFehlend(quelle)} style={{ width: "100%", height: "auto", objectFit: "contain", borderRadius: "1rem" }} />;
}
