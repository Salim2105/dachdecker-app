"use client";
import { useSearchParams } from "next/navigation";
import type { Aufgabe } from "@/content/schema";
import { SessionRunner } from "@/components/session/SessionRunner";

export function LernfeldUebung({ lfId, aufgaben }: { lfId: string; aufgaben: Aufgabe[] }) {
  const params = useSearchParams();
  const rechnen = params.get("typ") === "rechnung";
  const thema = params.get("thema");
  const auswahl = aufgaben.filter((a) => (!rechnen || a.typ === "calc") && (!thema || a.thema === thema));
  if (!auswahl.length) return <p className="mt-5">Für diese Auswahl sind keine Aufgaben vorhanden. Wähle über den Lernpfad ein anderes Thema.</p>;
  return <>
    {rechnen && <p className="mb-4 rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>Rechentraining · {auswahl.length} Aufgaben. Formel und Rechenweg findest du nach deiner Antwort.</p>}
    <SessionRunner key={`${lfId}:${rechnen}:${thema}`} aufgaben={auswahl} lfId={rechnen ? `${lfId}-rechnung` : lfId} zurueck={`/lernen/${lfId}`} />
  </>;
}
