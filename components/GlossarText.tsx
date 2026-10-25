"use client";

import { findeBegriffe, teileGlossarText } from "@/lib/glossar";

export function oeffneGlossarBegriff(id: string) {
  window.dispatchEvent(new CustomEvent("dachdecker:begriff", { detail: id }));
}
export function BegriffsListe({texte,onBegriff}:{texte:readonly string[];onBegriff?:(id:string)=>void}){
  const begriffe=findeBegriffe(texte.join("\n"));
  if(!begriffe.length)return null;
  return <details className="my-5 rounded-xl border p-4" style={{borderColor:"var(--border)",background:"var(--surface)"}}><summary className="min-h-11 cursor-pointer py-2 font-semibold">Deine Fachwörter nachschlagen ({begriffe.length})</summary><p className="my-3 text-sm" style={{color:"var(--text-muted)"}}>Wähle ein Wort. Deine Aufgabe und deine Eingaben bleiben geöffnet.</p><ul className="flex flex-wrap gap-2">{begriffe.map(b=><li key={b.id} className="min-w-0 max-w-full"><button type="button" className="min-h-11 max-w-full rounded-lg border px-3 py-2 text-sm" style={{borderColor:"var(--border)",color:"var(--accent-strong)",overflowWrap:"anywhere"}} onClick={()=>(onBegriff??oeffneGlossarBegriff)(b.id)} aria-label={`Begriff erklären: ${b.begriff}`}>{b.begriff}</button></li>)}</ul></details>;
}

interface GlossarTextProps {
  text: string;
  onBegriff?: (id: string) => void;
  showBegriffsliste?: boolean;
}

/** Inline-Inhalt: darf in Absätzen stehen und enthält keine verschachtelten Absätze. */
export function GlossarText({ text, onBegriff, showBegriffsliste = false }: GlossarTextProps) {
  const oeffnen = onBegriff ?? oeffneGlossarBegriff;
  const begriffe = showBegriffsliste ? findeBegriffe(text) : [];
  return (
    <>
      <span className="glossar-text">
        {teileGlossarText(text).map((teil, i) => teil.art === "text" ? teil.text : (
          <button
            key={i}
            type="button"
            onClick={() => oeffnen(teil.begriff.id)}
            aria-label={`Begriff erklären: ${teil.text}`}
            title={`Kurz erklärt: ${teil.begriff.begriff}`}
            className="rounded-sm font-semibold underline decoration-dotted underline-offset-4"
            style={{ color: "var(--accent-strong)", textAlign: "inherit", maxWidth:"100%", overflowWrap:"anywhere" }}
          >
            {teil.text}
          </button>
        ))}
      </span>
      {begriffe.length > 0 && (
        <span className="mt-4 block rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
          <span className="mb-2 block text-sm font-semibold">Begriffe in diesem Abschnitt</span>
          <span className="flex flex-wrap gap-2">
            {begriffe.map((begriff) => (
              <button
                key={begriff.id}
                type="button"
                onClick={() => oeffnen(begriff.id)}
                className="min-h-10 rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                aria-label={`Begriff erklären: ${begriff.begriff}`}
              >
                {begriff.begriff}
              </button>
            ))}
          </span>
        </span>
      )}
    </>
  );
}
