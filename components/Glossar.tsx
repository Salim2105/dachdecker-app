"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { getBegriff, getGlossar, sucheBegriffe, type GlossarEintrag } from "@/lib/glossar";
import { oeffneGlossarBegriff } from "@/components/GlossarText";
import { GlossarSkizze } from "@/components/GlossarSkizze";

const keinAbonnement = () => () => {};
const vorlesenMoeglich = () => typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
const serverVorlesen = () => false;

function BegriffErklaerung({ begriff }: { begriff: GlossarEintrag }) {
  const [liest, setLiest] = useState(false);
  const [sprachfehler, setSprachfehler] = useState("");
  const verfuegbar = useSyncExternalStore(keinAbonnement, vorlesenMoeglich, serverVorlesen);
  const sprechauftrag = useRef<SpeechSynthesisUtterance | null>(null);
  const titelId = useId();

  useEffect(() => {
    const stoppen = () => {
      if (!sprechauftrag.current || !("speechSynthesis" in window)) return;
      sprechauftrag.current.onend = null;
      sprechauftrag.current.onerror = null;
      window.speechSynthesis.cancel();
      sprechauftrag.current = null;
      setLiest(false);
    };
    window.addEventListener("dachdecker:vorlesen-stoppen", stoppen);
    return () => {
      window.removeEventListener("dachdecker:vorlesen-stoppen", stoppen);
      if (!sprechauftrag.current || !("speechSynthesis" in window)) return;
      sprechauftrag.current.onend = null;
      sprechauftrag.current.onerror = null;
      window.speechSynthesis.cancel();
    };
  }, []);

  function vorlesen() {
    if (!verfuegbar) return;
    if (liest) {
      if (sprechauftrag.current) {
        sprechauftrag.current.onend = null;
        sprechauftrag.current.onerror = null;
      }
      window.speechSynthesis.cancel();
      sprechauftrag.current = null;
      setLiest(false);
      return;
    }
    try {
      const auftrag = new SpeechSynthesisUtterance(`${begriff.begriff}. Kurz erklärt. ${begriff.einfach} Beispiel auf der Baustelle. ${begriff.beispiel}`);
      auftrag.lang = "de-DE";
      auftrag.rate = 0.9;
      auftrag.onend = () => { setLiest(false); sprechauftrag.current = null; };
      auftrag.onerror = () => {
        setLiest(false);
        sprechauftrag.current = null;
        setSprachfehler("Das Vorlesen ist auf diesem Gerät gerade nicht verfügbar.");
      };
      window.speechSynthesis.cancel();
      sprechauftrag.current = auftrag;
      setSprachfehler("");
      setLiest(true);
      window.speechSynthesis.speak(auftrag);
    } catch {
      setLiest(false);
      sprechauftrag.current = null;
      setSprachfehler("Das Vorlesen ist auf diesem Gerät gerade nicht verfügbar.");
    }
  }

  return (
    <article aria-labelledby={titelId} className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Kurz erklärt</p>
      <h3 id={titelId} className="mt-1 break-words text-xl font-bold">{begriff.begriff}</h3>
      <p className="mt-3 leading-relaxed">{begriff.einfach}</p>
      {begriff.bild&&<GlossarSkizze bild={begriff.bild}/>}
      <div className="mt-4 rounded-xl p-3" style={{ background: "var(--accent-soft)" }}>
        <h4 className="text-sm font-semibold">Beispiel auf der Baustelle</h4>
        <p className="mt-1 text-sm leading-relaxed">{begriff.beispiel}</p>
      </div>
      {begriff.fachdefinition && (
        <details className="mt-4">
          <summary className="min-h-10 cursor-pointer py-2 font-semibold">Fachdefinition anzeigen</summary>
          <p className="mt-2 text-sm leading-relaxed">{begriff.fachdefinition}</p>
        </details>
      )}
      {begriff.aliases.length > 0 && <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>Auch bezeichnet als: {begriff.aliases.join(", ")}</p>}
      {verfuegbar ? (
        <button type="button" onClick={vorlesen} aria-pressed={liest} className="mt-4 min-h-11 rounded-lg border px-3 py-2 text-sm font-semibold" style={{ borderColor: "var(--border)" }}>
          {liest ? "Vorlesen stoppen" : "Erklärung vorlesen"}
        </button>
      ) : <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>Vorlesen ist auf diesem Gerät nicht verfügbar.</p>}
      {sprachfehler && <p role="status" className="mt-2 text-sm">{sprachfehler}</p>}
      <details className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
        <summary className="min-h-10 cursor-pointer py-2">Quellen und Herkunft</summary>
        <ul className="mt-1 list-disc space-y-2 pl-4">
          {begriff.quellen.map((quelle) => <li key={quelle}>{quelle}</li>)}
        </ul>
        <p className="mt-2">Die kurze Erklärung ist eine Sprachhilfe zur vorhandenen Lernsammlung.</p>
      </details>
    </article>
  );
}

interface GlossarProps {
  begriffId?: string;
  onBegriff?: (id: string) => void;
}

export function Glossar({ begriffId, onBegriff }: GlossarProps) {
  const [suche, setSuche] = useState("");
  const [auswahl, setAuswahl] = useState({ vorgabe: begriffId, id: begriffId });
  // Eine neue Auswahl aus dem Lerntext hat Vorrang. Die Suchanfrage bleibt dabei
  // erhalten; keine Zustandsänderung in einem Effect und kein Verlust beim Lesen.
  const aktiveId = auswahl.vorgabe === begriffId ? auswahl.id : begriffId;
  const ausgewaehlt = aktiveId ? getBegriff(aktiveId) : undefined;
  const treffer = sucheBegriffe(suche);
  const sucheId = useId();

  function auswaehlen(id: string) {
    setAuswahl({ vorgabe: begriffId, id });
    (onBegriff ?? oeffneGlossarBegriff)(id);
  }

  return (
    <section aria-label="Fachbegriffe nachschlagen" className="space-y-5">
      <div>
        <label htmlFor={sucheId} className="mb-2 block text-sm font-semibold">Begriff suchen</label>
        <input
          id={sucheId}
          type="search"
          value={suche}
          onChange={(event) => setSuche(event.target.value)}
          placeholder="Zum Beispiel: Freibord"
          className="min-h-12 w-full rounded-xl border px-3 py-2 text-base"
          style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
          autoComplete="off"
        />
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>Wähle im Lerntext ein markiertes Wort oder suche hier. {getGlossar().length} Begriffe stehen bereit.</p>
      </div>
      {ausgewaehlt && <BegriffErklaerung key={ausgewaehlt.id} begriff={ausgewaehlt} />}
      {aktiveId && !ausgewaehlt && <p role="status">Dieser Begriff ist nicht vorhanden. Suche nach einem anderen Wort.</p>}
      <div>
        <p role="status" className="mb-3 text-sm" style={{ color: "var(--text-muted)" }}>
          {treffer.length === 0 ? "Kein passender Begriff. Versuche ein kürzeres Wort oder eine andere Schreibweise." : `${treffer.length} ${treffer.length === 1 ? "Begriff" : "Begriffe"}${suche ? " gefunden" : " von A bis Z"}`}
        </p>
        <ul aria-label="Gefundene Begriffe" className="space-y-2">
          {treffer.map((begriff) => (
            <li key={begriff.id}>
              <button
                type="button"
                onClick={() => auswaehlen(begriff.id)}
                aria-label={begriff.begriff}
                aria-pressed={begriff.id === ausgewaehlt?.id}
                className="min-h-12 w-full rounded-xl border px-3 py-3 text-left text-base"
                style={{ borderColor: begriff.id === ausgewaehlt?.id ? "var(--accent)" : "var(--border)", background: begriff.id === ausgewaehlt?.id ? "var(--accent-soft)" : "var(--surface)" }}
              >
                <span className="block font-semibold">{begriff.begriff}</span>
                <span className="mt-1 block text-sm" style={{ color: "var(--text-muted)" }}>{begriff.einfach}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
