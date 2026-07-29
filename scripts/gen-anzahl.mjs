// Erzeugt content/anzahl.json — die Aufgabenzahlen je Lernfeld.
//
// Warum eine generierte Datei statt einer Zählung zur Laufzeit: Die Startseite
// zeigt die Prüfungsreife über den gesamten Stoff. Zum Rechnen braucht sie nur
// die Gesamtzahl, nicht die Aufgaben selbst — wer dafür getAufgaben() aufruft,
// zieht 2 MB Aufgabentext ins Browser-Bundle, nur um bis 2027 zu zählen.
//
// Gezählt werden ausschließlich sichtbare Aufgaben (konfidenz !== "pruefen"),
// genau wie istSichtbar() in content/schema.ts es zur Laufzeit tut.
import fs from "node:fs";
import path from "node:path";

const wurzel = path.join(import.meta.dirname, "..");
const contentDir = path.join(wurzel, "content");

const { lernfelder } = JSON.parse(
  fs.readFileSync(path.join(contentDir, "lernfelder.json"), "utf8"),
);

const proLernfeld = {};
let gesamt = 0;

for (const lf of lernfelder) {
  const datei = path.join(contentDir, lf.id, "aufgaben.json");
  let anzahl = 0;
  if (fs.existsSync(datei)) {
    const aufgaben = JSON.parse(fs.readFileSync(datei, "utf8"));
    anzahl = aufgaben.filter((a) => a.konfidenz !== "pruefen").length;
  }
  proLernfeld[lf.id] = anzahl;
  gesamt += anzahl;
}

const ziel = path.join(contentDir, "anzahl.json");
fs.writeFileSync(ziel, JSON.stringify({ gesamt, proLernfeld }, null, 2) + "\n");
console.log(`anzahl.json erzeugt: ${gesamt} sichtbare Aufgaben in ${lernfelder.length} Einheiten`);
