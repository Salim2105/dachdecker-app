"use client";

import { useSyncExternalStore } from "react";
import { LernLink } from "@/components/LernLink";
import { appStorage, subscribeStorageStatus } from "@/lib/lernSpeicher";
import { parsePraxisVorbereitung, praxisVorbereitungKey } from "@/lib/praxisVorbereitung";
import { WERKSTATT_PFADE } from "@/lib/werkstattInhalte";
import { parseWerkstattStand, werkstattKey } from "@/lib/werkstattStand";

const keys = WERKSTATT_PFADE.flatMap(p => [...p.einheiten.map(e => werkstattKey(e.id)), praxisVorbereitungKey(`werkstatt-${p.id}`)]);
const snapshot = () => JSON.stringify(keys.map(k => appStorage.getItem(k)));
const serverSnapshot = () => "[]";

export function WerkstattFortschritt() {
  const raw = useSyncExternalStore(subscribeStorageStatus, snapshot, serverSnapshot);
  const values = JSON.parse(raw) as (string | null)[];
  const werte = new Map(keys.map((k, i) => [k, values[i] ?? null]));
  return <section className="werkstatt-karte mt-7" aria-labelledby="werkstatt-fortschritt">
    <span className="text-xs font-semibold tracking-widest" style={{ color: "var(--accent)" }}>VERSTEHEN · ÜBEN · AUSFÜHREN</span>
    <h2 id="werkstatt-fortschritt" className="mt-2 text-xl font-semibold">Dein Werkstatttraining</h2>
    <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>Digitale Antworten zeigen dein Verständnis des Übungsmodells. Deine praktische Ausführung und eingetragene Rückmeldung werden getrennt angezeigt.</p>
    <div className="mt-5 grid gap-4 lg:grid-cols-2">
      {WERKSTATT_PFADE.map(p => {
        let digital = 0, unterstuetzt = 0, defekt = false;
        for (const e of p.einheiten) {
          const text = werte.get(werkstattKey(e.id)) ?? null;
          const parsed = parseWerkstattStand(text);
          const stand = parsed?.einheit.id === e.id ? parsed : null;
          if (text !== null && !stand) defekt = true;
          if (stand && e.aufgaben.every(a => stand.geprueft.includes(a.id) && stand.abgaben[a.id]?.at(-1)?.bewertung.richtig)) {
            digital++;
            if (e.aufgaben.some(a => { const b = stand.abgaben[a.id]?.at(-1); return b && (b.modus === "begleitet" || b.hilfen.length > 0 || b.nachErklaerung); })) unterstuetzt++;
          }
        }
        const praxisRaw = werte.get(praxisVorbereitungKey(`werkstatt-${p.id}`)) ?? null;
        const parsedPraxis = parsePraxisVorbereitung(praxisRaw);
        const praxis = parsedPraxis?.blatt.thema === `werkstatt-${p.id}` ? parsedPraxis : null;
        if (praxisRaw !== null && !praxis) defekt = true;
        return <article key={p.id} className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <h3 className="font-semibold">{p.titel}</h3>
          <dl className="mt-3 space-y-3 text-sm">
            <div><dt className="font-semibold">Digital verstanden</dt><dd>{digital} von 10 Einheiten · beide Übungen richtig beantwortet</dd></div>
            <div><dt className="font-semibold">Davon mit Unterstützung</dt><dd>{unterstuetzt} Einheiten · Begleitung, Hinweis oder Nacharbeit genutzt</dd></div>
            <div><dt className="font-semibold">Praktisch ausgeführt</dt><dd>{praxis?.ausgefuehrt ? "Nach eigener Angabe geübt" : "Noch keine eigene Ausführung eingetragen"}</dd></div>
            <div><dt className="font-semibold">Rückmeldung</dt><dd>{praxis?.rueckmeldungErfasst ? "Rückmeldung eingetragen · lokal dokumentiert" : "Noch keine Rückmeldung eingetragen"}</dd></div>
          </dl>
          {defekt && <p role="alert" className="mt-3" style={{ color: "var(--bad)" }}>Ein gespeicherter Werkstattstand ist nicht lesbar. Er bleibt erhalten; erstelle bitte eine vollständige Sicherung.</p>}
          <div className="mt-4 flex flex-wrap gap-3"><LernLink className="min-h-11 py-2 underline" href={`/projekte#${p.einheiten[0].id}`}>Lernpfad öffnen →</LernLink><LernLink className="min-h-11 py-2 underline" href={`/projekte#werkstatt-praxis-${p.id}`}>Praxisblatt öffnen →</LernLink></div>
        </article>;
      })}
    </div>
  </section>;
}
