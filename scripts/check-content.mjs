import fs from "node:fs";
import path from "node:path";

// Prüft die Daten und widersprüchliche identische Fragen, nicht die Richtigkeit
// der zitierten Bücher. Fachliche Freigabe braucht einen Vergleich mit Quellen.
const root = path.join(import.meta.dirname, "..", "content");
const ids = new Set();
const fragen = new Map();
const fehler = [];
let aufgaben = 0;
let lektionen = 0;
const normal = (text) => text.toLocaleLowerCase("de-DE").replace(/\s+/g, " ").trim();

for (const ordner of fs.readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory())) {
  for (const typ of ["aufgaben", "lektionen"]) {
    const datei = path.join(root, ordner.name, `${typ}.json`);
    if (!fs.existsSync(datei)) continue;
    for (const eintrag of JSON.parse(fs.readFileSync(datei, "utf8"))) {
      if (!eintrag.id || ids.has(eintrag.id)) fehler.push(`${eintrag.id}: fehlende oder doppelte ID`);
      ids.add(eintrag.id);
      if (!eintrag.quelle?.trim()) fehler.push(`${eintrag.id}: Quellenangabe fehlt`);
      if (eintrag.konfidenz === "pruefen") continue;
      if (typ === "lektionen") { lektionen++; continue; }
      aufgaben++;
      if (!eintrag.erklaerung?.trim()) fehler.push(`${eintrag.id}: Erklärung fehlt`);
      if (eintrag.typ !== "mc") continue;
      if (!eintrag.korrekt?.length || eintrag.korrekt.some((i) => !Number.isInteger(i) || i < 0 || i >= eintrag.optionen.length)) {
        fehler.push(`${eintrag.id}: ungültige richtige Antwort`);
        continue;
      }
      const frage = normal(eintrag.frage);
      const antwort = eintrag.korrekt.map((i) => normal(eintrag.optionen[i])).sort().join(" | ");
      const alt = fragen.get(frage);
      if (alt && alt.antwort !== antwort) fehler.push(`${alt.id} / ${eintrag.id}: identische Frage mit unterschiedlichen Musterantworten`);
      else fragen.set(frage, { id: eintrag.id, antwort });
    }
  }
}

if (fehler.length) {
  console.error(fehler.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Inhaltsprüfung bestanden: ${aufgaben} Aufgaben, ${lektionen} Lektionen. Datenstruktur, Quellenangaben und identische Fragen geprüft; keine fachliche Freigabe.`);
}
