"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { Aufgabe } from "@/content/schema";
import { SessionRunner } from "@/components/session/SessionRunner";
import { uebungsSessionId } from "@/lib/fortsetzung";
import { uebernehmePassendeThemenrunde } from "@/lib/uebungStand";

export function LernfeldUebung({ lfId, aufgaben }: { lfId: string; aufgaben: Aufgabe[] }) {
  const params = useSearchParams();
  const rechnen = params.get("typ") === "rechnung";
  const thema = params.get("thema");
  const auswahl = aufgaben.filter((a) => (!rechnen || a.typ === "calc") && (!thema || a.thema === thema));
  if (!auswahl.length) return <p className="mt-5">Für diese Auswahl sind keine Aufgaben vorhanden. Wähle über den Lernpfad ein anderes Thema.</p>;
  return <>
    {rechnen && <p className="mb-4 rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>Rechentraining · {auswahl.length} Aufgaben. Formel und Rechenweg findest du nach deiner Antwort.</p>}
    {thema ? <Themenrunde key={`${lfId}:${rechnen}:${thema}`} aufgaben={auswahl} lfId={lfId} rechnen={rechnen} thema={thema} /> : <SessionRunner key={`${lfId}:${rechnen}`} aufgaben={auswahl} lfId={uebungsSessionId(lfId, rechnen)} zurueck={`/lernen/${lfId}`} />}
  </>;
}

function Themenrunde({ aufgaben, lfId, rechnen, thema }: { aufgaben: Aufgabe[]; lfId: string; rechnen: boolean; thema: string }) {
  const scope = uebungsSessionId(lfId, rechnen, thema);
  const vorbereiten = () => {
    try { uebernehmePassendeThemenrunde(uebungsSessionId(lfId, rechnen), scope, aufgaben); return ""; }
    catch { return "Deine bisherige Themenrunde konnte noch nicht übernommen werden. Sie bleibt gespeichert. Prüfe den Lernspeicher und versuche es erneut."; }
  };
  // Complete the idempotent legacy copy before SessionRunner restores answers.
  const [fehler, setFehler] = useState(vorbereiten);
  if (fehler) return <div role="alert"><p>{fehler}</p><button type="button" className="hauptaktion mt-3" onClick={() => setFehler(vorbereiten())}>Übernahme erneut versuchen</button></div>;
  return <><p className="mb-4 text-sm">Themenrunde: {thema} · {aufgaben.length} Aufgaben</p><SessionRunner aufgaben={aufgaben} lfId={scope} zurueck={`/lernen/${lfId}`} /></>;
}
