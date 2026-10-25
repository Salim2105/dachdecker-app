import fs from "node:fs";
import path from "node:path";
import { evaluate } from "mathjs";

// Prüft die Daten und widersprüchliche identische Fragen, nicht die Richtigkeit
// der zitierten Bücher. Fachliche Freigabe braucht einen Vergleich mit Quellen.
const root = path.join(import.meta.dirname, "..", "content");
const ids = new Set();
const fragen = new Map();
const fehler = [];
let aufgaben = 0;
let lektionen = 0;
let rechenaufgaben = 0;
const pruefungsErgaenzungen = JSON.parse(fs.readFileSync(path.join(root, "pruefung", "ergaenzungen.json"), "utf8"));
const normal = (text) => text.toLocaleLowerCase("de-DE").replace(/\s+/g, " ").trim();

for (const ordner of fs.readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory())) {
  for (const typ of ["aufgaben", "lektionen"]) {
    const datei = path.join(root, ordner.name, `${typ}.json`);
    if (!fs.existsSync(datei)) continue;
    for (const eintrag of [...JSON.parse(fs.readFileSync(datei, "utf8")), ...(typ === "aufgaben" ? pruefungsErgaenzungen[ordner.name] ?? [] : [])]) {
      if (!eintrag.id || ids.has(eintrag.id)) fehler.push(`${eintrag.id}: fehlende oder doppelte ID`);
      ids.add(eintrag.id);
      if (!eintrag.quelle?.trim()) fehler.push(`${eintrag.id}: Quellenangabe fehlt`);
      if (eintrag.konfidenz === "pruefen") continue;
      if (typ === "lektionen") { lektionen++; continue; }
      aufgaben++;
      if (!eintrag.erklaerung?.trim()) fehler.push(`${eintrag.id}: Erklärung fehlt`);
      if (eintrag.typ === "calc") {
        rechenaufgaben++;
        const namen = new Set(eintrag.parameter.map((p) => p.name));
        for (const treffer of eintrag.aufgabentext.matchAll(/\{([^}]+)\}/g)) {
          if (!namen.has(treffer[1])) fehler.push(`${eintrag.id}: unbekannter Platzhalter ${treffer[0]}`);
        }
        for (const p of eintrag.parameter) {
          if (![p.min, p.max, p.schritt].every(Number.isFinite) || p.min > p.max || p.schritt <= 0) {
            fehler.push(`${eintrag.id}: ungültiger Parameterbereich für ${p.name}`);
          }
        }
        if (!eintrag.schritte.length || !Number.isFinite(eintrag.toleranzProzent) || eintrag.toleranzProzent < 0) {
          fehler.push(`${eintrag.id}: fehlende Schritte oder ungültige Toleranz`);
        }
        const textNamen = new Set(namen);
        for (const s of eintrag.schritte) {
          textNamen.add(s.ergebnisName);
          for (const treffer of s.beschreibung.matchAll(/\{([^}]+)\}/g)) {
            if (!textNamen.has(treffer[1])) fehler.push(`${eintrag.id}: unbekannter Platzhalter im Lösungsweg ${treffer[0]}`);
          }
        }
        // Stichproben bestätigen Ausführbarkeit, nicht die Baugeometrie.
        for (let probe = 0; probe < 5; probe++) {
          const scope = Object.fromEntries(eintrag.parameter.map((p, i) => {
            const mitte = Math.min(p.max, Math.max(p.min, Math.round(((p.min + p.max) / 2) / p.schritt) * p.schritt));
            const wert = probe === 0 ? p.min : probe === 1 ? p.max : probe === 2 ? mitte : (i + probe) % 2 ? p.min : p.max;
            return [p.name, wert];
          }));
          try {
            for (const s of eintrag.schritte) {
              const wert = Number(evaluate(s.formel, scope));
              if (!Number.isFinite(wert)) throw new Error(`kein endliches Ergebnis für ${s.formel}`);
              scope[s.ergebnisName] = wert;
            }
          } catch (error) {
            fehler.push(`${eintrag.id}: Rechenprobe ${probe + 1} scheitert: ${error.message}`);
          }
        }
      }
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
  console.log(`Inhaltsprüfung bestanden: ${aufgaben} Aufgaben, ${lektionen} Lektionen, ${rechenaufgaben} Rechenaufgaben mit je 5 Zahlenproben. Datenstruktur, Platzhalter, Quellenangaben und identische Fragen geprüft; keine vollständige fachliche Freigabe.`);
}
