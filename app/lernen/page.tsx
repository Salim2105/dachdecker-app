"use client";
import Link from "next/link";
import { getLernfelder, getAufgaben } from "@/lib/content";
import { useProgress } from "@/components/useProgress";
import { LernfeldCard } from "@/components/LernfeldCard";
import { Fortsetzen } from "@/components/Fortsetzen";
import { useState } from "react";
import { lernStatus } from "@/lib/lernstand";
import type { AufgabenFortschritt } from "@/content/schema";

const GRUPPEN = [
  { key: 1, label: "1. Lehrjahr" },
  { key: 2, label: "2. Lehrjahr" },
  { key: 3, label: "3. Lehrjahr" },
];

function anteil(fortschritt: Record<string, AufgabenFortschritt>, ids: string[], jetzt: number): number {
  if (ids.length === 0) return 0;
  const done = ids.filter((id) => lernStatus(fortschritt[id], jetzt) === "gefestigt").length;
  return done / ids.length;
}

export default function LernenPage() {
  const { fortschritt } = useProgress();
  const [jetzt] = useState(() => Date.now());
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
        jetzt,
      ),
    };
  };

  return (
    <div>
      <h1 className="text-[26px] font-semibold tracking-tight">Dein Lernpfad</h1>
      <p className="mt-1 text-[15px]" style={{ color: "var(--text-muted)" }}>
        Deine Lernfelder, unterteilt in Kapitel und kurze Einheiten
      </p>
      <div className="mt-4">
        <Link href="/lernen/lf07" className="werkstatt-karte mb-4 block"><span className="text-sm" style={{color:"var(--accent)"}}>NEUE LERNWERKSTATT</span><h2 className="mt-2 text-xl font-semibold">LF7 · Dachentwässerung Schritt für Schritt</h2><p className="mt-2" style={{color:"var(--text-muted)"}}>Sechs Kapitel · 18 Einheiten · Lernziele, Begriffe und aktive Aufgaben</p><span className="mt-3 block underline" style={{color:"var(--accent)"}}>Mit dem Wasserweg beginnen →</span></Link>
        <Link href="/lernweg" className="my-4 block rounded-xl border p-4 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <span className="block font-semibold">Mit dem geführten Lernweg starten</span>
          <span className="mt-1 block" style={{ color: "var(--text-muted)" }}>Sechs Grundlagen-Einheiten: verstehen, erinnern, rechnen und anwenden.</span>
        </Link>
        <Fortsetzen />
      </div>
      <div
        className="mt-3 flex gap-2.5 rounded-[var(--r-md)] px-3 py-2.5 text-sm leading-relaxed"
        style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="mt-0.5 flex-shrink-0"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 7.5h.01" />
        </svg>
        <p>Empfohlen: Lernfeld 7 vor 8–10 lernen. Gesperrt ist nichts — lerne in deinem Tempo.</p>
      </div>

      {GRUPPEN.map((g) => {
        const items = lernfelder.filter((lf) => lf.lehrjahr === g.key);
        if (items.length === 0) return null;
        return (
          <section key={g.key} className="mt-6">
            <h2 className="mb-2 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
              {g.label}
            </h2>
            <div className="grid gap-3 xl:grid-cols-2">
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
          <div className="grid gap-3 xl:grid-cols-2">
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
