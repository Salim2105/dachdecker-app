import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
async function authored(file) {
  const source = await readFile(resolve(root, file), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const module = { exports: {} };
  new Function("module", "exports", "require", compiled)(module, module.exports, createRequire(resolve(root, file)));
  return module.exports;
}
const { DACH_DETAILS, DACH_MODELLE } = await authored("lib/dach3dInhalte.ts");
const { WERKSTATT_PFADE } = await authored("lib/werkstattInhalte.ts");
const first = (text) => text.match(/^.*?[.!?](?:\s|$)/u)?.[0].trim() ?? text;
const roofNames = { steildach: "Satteldach mit Gaube", walmdach: "Walmdach", flachdach: "nicht belüfteten Warmdach" };
const coveringNames = { falzziegel: "Falzziegeln", "biber-doppel": "Biberschwanz-Doppeldeckung", warmdach: "oberer Abdichtung" };
function chapters(entries) {
  let time = 0;
  return entries.map(([id, titel, text]) => {
    const start = time;
    time += Math.max(3, text.split(/\s+/u).length / 2.5 + .25);
    return { id, titel, start: +start.toFixed(3), ende: +time.toFixed(3), text };
  });
}
function video(data, entries) {
  const kapitel = chapters(entries);
  return { ...data, version: 1, dauer: kapitel.at(-1).ende, kapitel, transkript: kapitel.map(k => k.text).join("\n\n") };
}
const videos = DACH_MODELLE.flatMap(modell => modell.deckungen.flatMap(deckung => modell.detailIds.map(detailId => {
  const detail = DACH_DETAILS.find(d => d.id === detailId);
  return video({ id: `dach-${modell.id}-${deckung}-${detailId}`, typ: "dachdetail", titel: detail.titel, form: modell.id, deckung, detailId }, [
    ["einordnung", "Einordnung im Lehrmodell", `Am ${roofNames[modell.id]} mit ${coveringNames[deckung]} betrachten wir: ${detail.titel}. Es gelten die vorgegebenen Anschlüsse dieses Lehrmodells.`],
    ["funktion", "Funktion und Bauteile", first(detail.funktion)],
    ...detail.schritte.map((s, i) => [`schritt-${i + 1}`, s.titel, first(s.handlung)]),
    ["fehlerkorrektur", "Fehler erkennen und korrigieren", `${detail.kontrolle.fehler} ${detail.kontrolle.korrektur}`],
  ]);
})));

for (const pfad of WERKSTATT_PFADE) for (const slug of ["schnitt", "bearbeiten", "verlegen", "kontrolle"]) {
  const unit = pfad.einheiten.find(e => e.slug === slug);
  const biber = pfad.id === "biber-doppel";
  const name = biber ? "Biberschwanz-Doppeldeckung" : "Falzziegel";
  const craft = {
    schnitt: [
      ["funktion", "Schnitt und Nutzstück", "Ein Passstück muss zur Anschlusskante passen und seine vorgesehenen Funktionsbereiche behalten."],
      ["schritt-1", "Anschluss übertragen", "Übertrage die Anschlusskante mit der Schablone. Prüfe Orientierung und Maßbezug, bevor du anzeichnest."],
      ["schritt-2", "Schnittlinie anzeichnen", "Verbinde die bestätigten Punkte zu einem feinen Anriss. Kennzeichne die linke Seite als Nutzstück und die rechte als Reststück."],
      ["schritt-3", "Funktionsbereiche prüfen", biber ? "Prüfe am Nutzstück die erforderliche Überdeckung, die Aufhängung und die vorgesehene Befestigungsmöglichkeit." : "Prüfe am Nutzstück Aufhängung, notwendige Falzbereiche und die vorgesehene Befestigungsmöglichkeit."],
      ["schritt-4", "Bearbeitung vorbereiten", "Gleiche die Schnittseite mit dem freigegebenen Bearbeitungsverfahren ab. Die Schnittfuge gehört auf die vorgesehene Seite des Anrisses."],
      ["fehlerkorrektur", "Fehler und Korrektur", "Ist das Nutzstück spiegelverkehrt markiert oder verliert es einen benötigten Funktionsbereich, wird es nicht bearbeitet. Korrigiere die Schablone oder kläre eine passende Anschlusslösung und prüfe erneut."],
    ],
    bearbeiten: [
      ["funktion", "Werkzeug und Werkstück", "Die Bearbeitung folgt der zum Werkstoff und Werkzeug gehörenden betrieblichen Arbeitsanweisung. Am bodennahen Muster zeigen wir die freigegebene Folge nach Unterweisung."],
      ["schritt-1", "Anriss und Schutz prüfen", "Kennzeichne Nutzstück und Reststück. Prüfe das passende Werkzeug sowie die in der Arbeitsanweisung festgelegten Schutzmaßnahmen."],
      ["schritt-2", "Werkstück abstützen", "Lege das Musterstück auf die vorgesehene Werkstückauflage. Nutzstück und abzutrennender Bereich brauchen die für dieses Verfahren vorgesehene Führung oder Abstützung."],
      ["schritt-3", "Schnitt kontrolliert führen", "Führe das freigegebene Werkzeug nach Unterweisung kontrolliert entlang des Anrisses. Bearbeitungsrichtung und Schnittseite bleiben sichtbar; die Schnittfuge verändert das fertige Maß."],
      ["schritt-4", "Kante und Funktion prüfen", biber ? "Prüfe Kontur, Kante und Risse. Überdeckung, Aufhängung und vorgesehene Befestigung müssen nach der Bearbeitung möglich bleiben." : "Prüfe Kontur, Kante und Risse. Aufhängung, nötiger Falz und vorgesehene Befestigung müssen nach der Bearbeitung möglich bleiben."],
      ["fehlerkorrektur", "Fehler und Korrektur", "Kippt das Werkstück oder liegt der Schnitt auf der falschen Seite, unterbrich die Bearbeitung. Kläre Auflage und Schnittbezug nach Arbeitsanweisung. Ein gerissenes oder funktional beschädigtes Teil wird ausgesondert."],
    ],
    verlegen: [
      ["funktion", "Deckschema und Wasserführung", biber ? "Bei der Doppeldeckung hängt jede Reihe auf einer eigenen Latte. Fugenversatz und Überdeckung führen Wasser auf die darunterliegende Ziegelfläche." : "Aufhängung, Kopf- und Seitenfalz bilden mit der Auflage das vorgegebene Deckschema. Passender Sitz und Überdeckung führen Wasser weiter."],
      ["schritt-1", "Reihenfolge festlegen", "Lies die Modellkarte und ordne die vier Übungsziegel außerhalb des Felds. Die vorgegebene Reihenfolge ist A, B, C und D."],
      ["schritt-2", "Untere Reihe einsetzen", "Setze A und B in die unteren Zielplätze. Prüfe im Schnitt, ob beide richtig auf der vorgesehenen Latte hängen."],
      ["schritt-3", "Obere Reihe ergänzen", biber ? "Setze C und D mit halbem Modulversatz ein. Benachbarte Fugen stehen nicht übereinander. Über zwei Reihenabstände bleiben im Schulmodell acht Zentimeter Höhenüberdeckung." : "Setze C und D in die oberen Plätze. Füge die vorgesehenen Falzbereiche passend zusammen. Ein Nachbar darf dabei nicht angehoben werden."],
      ["schritt-4", "Verband kontrollieren", biber ? "Prüfe Flucht, Versatz, Überdeckung und Aufhängung. Der regelmäßige Lattenabstand dieses Schulmodells beträgt fünfzehn Zentimeter." : "Prüfe Flucht, Auflage und Falzschluss. Die Modellkarte gibt vierunddreißig Zentimeter Decklänge und vierundzwanzig Zentimeter Deckbreite vor."],
      ["fehlerkorrektur", "Fehler und Korrektur", biber ? "Stehen Fugen unmittelbar übereinander, nimm die betroffene obere Reihe zurück. Stelle den vorgegebenen Versatz her und prüfe Wasserweg und Befestigung erneut." : "Drückt ein Falz den Nachbarziegel hoch, nimm das betroffene Teil zurück. Stelle Auflage und Falzschluss passend her und prüfe die folgende Reihe erneut."],
    ],
    kontrolle: [
      ["funktion", "Kontrollkriterien", "Die Kontrolle verbindet Maße, Sitz, Wasserweg und Befestigung. Ein gerader Ziegelfuß allein bestätigt das gesamte Feld noch nicht."],
      ["schritt-1", "Maße gegenprüfen", "Vergleiche Endbezüge, Gesamtmaß und mehrere Teilungsmaße mit der Systemkarte. Prüfe auch die Flucht über mehrere Reihen."],
      ["schritt-2", "Sitz und Verband prüfen", biber ? "Verfolge im Schnitt die Überdeckung und die Aufhängung jeder Reihe. Prüfe den halben Modulversatz und die gesondert geplanten Randstücke." : "Prüfe Aufhängung, Auflage und Falzschluss. Suche einen angehobenen Ziegel und verfolge seinen Einfluss auf die angrenzende Reihe."],
      ["schritt-3", "Wasser und Befestigung prüfen", "Verfolge Deckung und Zusatzebene getrennt bis zum vorgesehenen Anschluss. Prüfe die drei ausdrücklich nummerierten Befestigungspunkte des Schulmodells."],
      ["schritt-4", "Befund dokumentieren", "Ordne jede Abweichung ihrer betroffenen Funktion zu. Halte Befund und geplante Korrektur fest; stimme ungeklärte Anschlüsse mit der Betreuung ab."],
      ["fehlerkorrektur", "Korrigieren und erneut prüfen", "Ein überdeckter Fehler gilt nicht als behoben. Nimm die betroffene Stelle zurück, korrigiere die konkrete Ursache und kontrolliere dieselben Kriterien erneut. Dokumentiere Ergebnis und erhaltene Rückmeldung getrennt."],
    ],
  };
  videos.push(video({ id: unit.id, typ: "handgriff", titel: unit.titel, pfadId: pfad.id, slug }, [
    ["einordnung", "Bodennahes Schulmodell", `${name}: ${unit.titel}. Die Maße und die gezeigte Arbeitsfolge gehören ausschließlich zum bodennahen Schulmodell.`],
    ...craft[slug],
  ]));
}
if (videos.length !== 112 || new Set(videos.map(v => v.id)).size !== 112) throw new Error("112 eindeutige Videos erwartet");
const target = resolve(root, "content/praxisvideos-inhalte.json");
// Preserve verified narration timing when rerunning after editorial validation.
let previous;
try { previous = JSON.parse(await readFile(target, "utf8")); } catch { previous = null; }
for (const v of videos) {
  const old = previous?.videos?.find(p => p.id === v.id && p.transkript === v.transkript);
  if (old) { v.dauer = old.dauer; v.kapitel = v.kapitel.map((k, i) => ({ ...k, start: old.kapitel[i].start, ende: old.kapitel[i].ende })); }
}
await mkdir(dirname(target), { recursive: true });
await writeFile(target, JSON.stringify({ version: 1, videos }, null, 2) + "\n");
console.log(`${videos.length} fachlich abgeleitete Praxisskripte: ${target}`);
