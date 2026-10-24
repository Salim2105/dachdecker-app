"use client";
import { useState } from "react";
import type { DrawAufgabe, Bewertung } from "@/content/schema";
import { SafeSvg } from "@/components/SafeSvg";
import { Erklaerung } from "@/components/aufgaben/Erklaerung";
import { ZeichenFlaeche } from "@/components/zeichnen/ZeichenFlaeche";
import { PapierZeichnung } from "@/components/zeichnen/PapierZeichnung";
import { ladeZeichenEntwurf, speichereZeichenEntwurf } from "@/lib/zeichenSpeicher";
import { selbstBewerten, type ZeichenEntwurf } from "@/lib/zeichenEntwurf";

const LABELS: Record<Bewertung, string> = { richtig: "Sitzt", teilweise: "Halb", falsch: "Nochmal" };

/** Eigenen Versuch zuerst festhalten, anschließend anhand sichtbarer Kriterien vergleichen. */
export function DrawCard({ aufgabe, onErgebnis, anfangsBewertung }: {
  aufgabe: DrawAufgabe;
  onErgebnis: (b: Bewertung) => void;
  /** Nur für den wiederhergestellten aktuellen Versuch; frühere Urteile schließen neue Übungen nicht ab. */
  anfangsBewertung?: Bewertung;
}) {
  const [entwurf, setEntwurf] = useState(() => ladeZeichenEntwurf(aufgabe.id));
  const [bewertung, setBewertung] = useState<Bewertung | null>(anfangsBewertung ?? null);
  const [speicherFehler, setSpeicherFehler] = useState("");

  function aktualisieren(neu: ZeichenEntwurf): boolean {
    setEntwurf(neu);
    try { speichereZeichenEntwurf(neu); setSpeicherFehler(""); return true; }
    catch { setSpeicherFehler("Dein Entwurf konnte nicht dauerhaft gespeichert werden. Lass die Aufgabe geöffnet und sichere deine Zeichnung als SVG beziehungsweise das Originalfoto."); return false; }
  }
  function bewerten(b: Bewertung) {
    if (bewertung !== null) return;
    aktualisieren({ ...entwurf, kriterien: [], selbstbewertung: selbstBewerten(b) });
    setBewertung(b);
    onErgebnis(b);
  }

  return <div>
    <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium" style={{ background: "var(--surface-2)", color: "var(--accent)" }}>✎ Zeichenwerkstatt</div>
    <p className="text-base font-medium leading-relaxed">{aufgabe.aufgabentext}</p>
    {aufgabe.vorgabeSvg && <SafeSvg markup={aufgabe.vorgabeSvg} className="my-4 flex justify-center rounded-xl border p-3 [&_svg]:max-w-full" />}
    <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>Zeichne direkt oder auf Papier. Schätze deinen Versuch ein, bevor du die Musterlösung ansiehst. Das Ergebnis ist ausdrücklich deine Selbsteinschätzung; die App bewertet freie Zeichnungen nicht automatisch.</p>

    <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Zeichenweg">
      {([['digital', 'Direkt zeichnen'], ['papier', 'Auf Papier zeichnen']] as const).map(([modus, label]) => <button key={modus} type="button" aria-pressed={entwurf.modus === modus} className="min-h-11 rounded-xl border px-4 py-2 text-sm font-medium" style={{ borderColor: "var(--border)", background: entwurf.modus === modus ? "var(--surface-2)" : "var(--surface)", color: "var(--text)" }} onClick={() => aktualisieren({ ...entwurf, modus })}>{label}</button>)}
    </div>
    <div className={bewertung !== null ? "mt-4 grid items-start gap-4 xl:grid-cols-2" : ""}>
      <div className="min-w-0">
        {bewertung !== null && <h3 className="text-sm font-semibold">Deine Zeichnung</h3>}
        {entwurf.modus === "digital"
          ? <ZeichenFlaeche entwurf={entwurf} onChange={aktualisieren} titel={aufgabe.aufgabentext} />
          : <PapierZeichnung aufgabenId={aufgabe.id} foto={entwurf.foto} onChange={(foto) => aktualisieren({ ...ladeZeichenEntwurf(aufgabe.id), foto })} />}
      </div>
      {bewertung !== null && <div className="min-w-0 space-y-3 rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <h3 className="text-sm font-semibold">Musterlösung</h3>
        <SafeSvg markup={aufgabe.loesungSvg} className="flex justify-center overflow-auto rounded-lg border p-3 [&_svg]:h-auto [&_svg]:max-w-full" />
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Vergleiche selbst: Welche Kriterien erfüllt deine Zeichnung? Die Häkchen sind deine eigene Prüfung und ändern deine erste Einschätzung nicht.</p>
        <ul className="space-y-3 text-sm">
          {aufgabe.schritte.map((schritt, i) => <li key={i}>
            <label className="flex min-h-11 items-start gap-3"><input type="checkbox" className="mt-1 shrink-0" checked={entwurf.kriterien[i] ?? false} onChange={(e) => {
              const kriterien = [...entwurf.kriterien];
              for (let j = 0; j <= i; j++) if (typeof kriterien[j] !== "boolean") kriterien[j] = false;
              kriterien[i] = e.target.checked; aktualisieren({ ...entwurf, kriterien });
            }} /><span>{schritt}</span></label>
          </li>)}
        </ul>
        <label className="block text-sm font-medium">Das verbessere ich beim nächsten Versuch
          <textarea className="mt-2 min-h-24 w-full rounded-lg border p-3 text-sm" maxLength={4000} value={entwurf.notizen} onChange={(e) => aktualisieren({ ...entwurf, notizen: e.target.value })} />
        </label>
        <Erklaerung text={aufgabe.erklaerung} quelle={aufgabe.quelle} />
      </div>}
    </div>

    {speicherFehler ? <p role="alert" className="mt-3 text-sm" style={{ color: "var(--bad)" }}>{speicherFehler}</p> : <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>Dein Entwurf bleibt bei dieser Aufgabe auf diesem Gerät erhalten.</p>}
    {bewertung === null ? <div className="mt-5">
      <p className="mb-2 text-sm font-medium">Wie sicher bist du?</p>
      <div className="flex flex-wrap gap-2">
        {(["richtig", "teilweise", "falsch"] as const).map((b) => <button key={b} type="button" onClick={() => bewerten(b)} className="min-h-14 min-w-24 flex-1 rounded-xl border px-3 py-3 text-sm font-medium" style={{ borderColor: "var(--border)", background: b === "richtig" ? "var(--ok)" : b === "falsch" ? "var(--bad)" : "var(--surface)", color: b === "richtig" ? "var(--ok-text)" : b === "falsch" ? "var(--bad-text)" : "var(--text)" }}>{LABELS[b]}</button>)}
      </div>
    </div> : <p className="mt-4 rounded-xl border p-3 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>Du hast getippt: <strong>{LABELS[bewertung]}</strong> · Als Selbsteinschätzung gespeichert. Prüfe deine Zeichnung in Ruhe mit den Kriterien.</p>}
  </div>;
}
