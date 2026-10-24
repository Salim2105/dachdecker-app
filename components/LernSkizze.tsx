import type { LernIllustration } from "@/lib/curriculum";

export function LernSkizze({ illustration: i }: { illustration: LernIllustration }) {
  const beschriftung = {
    wasserweg: ["Dachfläche", "Dachrinne", "Stutzen", "Fallrohr"],
    rinne: ["Gebäudeseite", "Rinnenfalz", "Rinnenquerschnitt", "Wulst außen"],
    regen: ["A: Fläche", "r: Regenspende", "C: Abflussbeiwert", "Q: Abfluss"],
    ablauf: ["Dachfläche", "Tiefpunkt", "Dachablauf", "Ableitung"],
    montage: ["Wasserweg planen", "Gefälle festlegen", "Bauteile montieren", "Bewegung sichern"],
    abwicklung: ["Kreis einteilen", "Höhen abtragen", "Umfang abwickeln", "Punkte verbinden"],
  } as Record<string, string[]>;
  const labels = i.art === "rinne" ? ["Gebäude", "Falz höher", "Rinne", "Wulst tiefer"] : beschriftung[i.art];
  return <figure className="my-5 rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
    <svg viewBox="0 0 640 170" role="img" aria-label={labels.join(" → ")} className="w-full">
      {i.art === "rinne" ? <><path d="M170 30v45q150 140 300 5V65" fill="none" stroke="currentColor" strokeWidth="4" /><path d="M190 85h280l34 18m-34-18 34-18" fill="none" stroke="var(--ok)" strokeWidth="3" /><text x="70" y="24" fill="currentColor" fontSize="18">Gebäude · Falz höher</text><text x="395" y="145" fill="currentColor" fontSize="18">Wulst außen tiefer</text></>
      : labels.map((label, index) => <g key={label}><rect x={index * 160 + 3} y="35" width="145" height="90" rx="12" fill="var(--surface)" stroke="var(--border)" strokeWidth="2" /><text x={index * 160 + 75} y="65" textAnchor="middle" fontSize="22" fill="var(--accent)">{index + 1}</text><text x={index * 160 + 75} y="95" textAnchor="middle" fontSize="14" fill="currentColor">{label}</text>{index < 3 && <path d={`M${index * 160 + 148} 80h14l-6-6m6 6-6 6`} fill="none" stroke="var(--accent)" strokeWidth="2" />}</g>)}
    </svg><figcaption className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>{i.beschriftung}</figcaption>
  </figure>;
}
