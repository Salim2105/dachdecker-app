"use client";
import { getLernfelder, getAufgaben } from "@/lib/content";
import { useProgress } from "@/components/useProgress";
import { LernfeldCard } from "@/components/LernfeldCard";
import type { AufgabenFortschritt } from "@/content/schema";

const GRUPPEN = [
  { key: 1, label: "1. Lehrjahr" },
  { key: 2, label: "2. Lehrjahr" },
  { key: 3, label: "3. Lehrjahr" },
];

function anteil(fortschritt: Record<string, AufgabenFortschritt>, ids: string[]): number {
  if (ids.length === 0) return 0;
  const done = ids.filter((id) => fortschritt[id] && fortschritt[id].bewertung !== "falsch").length;
  return done / ids.length;
}

export default function LernenPage() {
  const { fortschritt } = useProgress();
  const alle = getLernfelder();
  const wiso = alle.filter((lf) => lf.id === "wiso");
  const lernfelder = alle.filter((lf) => lf.id !== "wiso");

  const karte = (lfId: string) => {
    const aufgaben = getAufgaben(lfId);
    return {
      anzahl: aufgaben.length,
      anteil: anteil(
        fortschritt,
        aufgaben.map((a) => a.id),
      ),
    };
  };

  return (
    <div>
      <h1 className="text-xl font-medium">Lernfelder</h1>
      <p
        className="mt-3 rounded-lg border-l-2 px-3 py-2 text-sm"
        style={{ background: "var(--surface)", borderColor: "var(--accent)", color: "var(--text-muted)" }}
      >
        Empfohlen: Lernfeld 7 vor 8–10 lernen. Gesperrt ist nichts — lerne in deinem Tempo.
      </p>

      {GRUPPEN.map((g) => {
        const items = lernfelder.filter((lf) => lf.lehrjahr === g.key);
        if (items.length === 0) return null;
        return (
          <section key={g.key} className="mt-6">
            <h2 className="mb-2 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
              {g.label}
            </h2>
            <div className="flex flex-col gap-2">
              {items.map((lf) => {
                const k = karte(lf.id);
                return (
                  <LernfeldCard key={lf.id} lernfeld={lf} fortschritt={k.anteil} anzahlAufgaben={k.anzahl} />
                );
              })}
            </div>
          </section>
        );
      })}

      {wiso.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            Wirtschafts- und Sozialkunde
          </h2>
          <div className="flex flex-col gap-2">
            {wiso.map((lf) => {
              const k = karte(lf.id);
              return (
                <LernfeldCard key={lf.id} lernfeld={lf} fortschritt={k.anteil} anzahlAufgaben={k.anzahl} />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
