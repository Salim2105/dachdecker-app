"use client";
import { useState } from "react";
import Link from "next/link";
import { SessionRunner } from "@/components/session/SessionRunner";
import { getAufgaben, getLernfelder } from "@/lib/content";
import { ladeGespeicherteAufgaben } from "@/lib/uebungStand";

/** Existing attempts keep their exact old task order and draft keys. */
export default function AlteTagesrunde() {
  const [aufgaben] = useState(() => ladeGespeicherteAufgaben("dd-session-heute", getLernfelder().flatMap(lf => getAufgaben(lf.id))));
  if (!aufgaben) return <section className="werkstatt-karte"><p role="alert">Die bisherige Runde lässt sich gerade nicht vollständig öffnen. Ihr gespeicherter Stand bleibt erhalten. Du kannst ihn zuerst sichern oder oben zur neuen Tagesrunde wechseln.</p><Link href="/fortschritt">Datensicherung öffnen →</Link></section>;
  return <SessionRunner aufgaben={aufgaben} lfId="heute" />;
}
