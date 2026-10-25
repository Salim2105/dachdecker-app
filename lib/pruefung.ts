import type { Aufgabe, Bewertung } from "@/content/schema";
import { getAufgaben, getLernfelder } from "@/lib/content";
import { EXAM_METADATA, type ExamLevel } from "@/lib/examMetadata";

/**
 * Nur diese Aufgabentypen werden automatisch bewertet. draw und fachbegriff
 * bewertet man selbst — in einer Prüfung ohne Rückmeldung ginge das nicht.
 */
const AUTO_TYPEN = ["mc", "cloze", "calc", "diagram"];

export function istAutoBewertbar(a: Aufgabe): boolean {
  return AUTO_TYPEN.includes(a.typ);
}

export interface Pruefungsteil {
  id: string;
  titel: string;
  beschreibung: string;
  lernfelder: string[];
  anzahl: number;
  minuten: number;
  stufe?: ExamLevel;
}

function fachLernfelder(): string[] {
  return getLernfelder()
    .map((lf) => lf.id)
    .filter((id) => id !== "wiso");
}

export function getPruefungsteile(): Pruefungsteil[] {
  const alle = fachLernfelder();
  return [
    {
      id: "lf07-grundlagen", titel: "Grundlagen", stufe: "grundlagen",
      beschreibung: "LF7: Bauteile, Begriffe und einzelne Zusammenhänge der Dachentwässerung.",
      lernfelder: ["lf07"], anzahl: 10, minuten: 15,
    },
    {
      id: "lf07-anwendung", titel: "Anwendung", stufe: "anwendung",
      beschreibung: "LF7: Rechenwege, Materialwahl und Entscheidungen bei der Ausführung.",
      lernfelder: ["lf07"], anzahl: 15, minuten: 25,
    },
    {
      id: "lf07-pruefungsnah", titel: "Prüfungsnah", stufe: "pruefungsnah",
      beschreibung: "LF7: zusammenhängende Entscheidungen, Bemessung und Transfer auf Baustellenfälle.",
      lernfelder: ["lf07"], anzahl: 20, minuten: 40,
    },
    ...getLernfelder().filter((lf) => lf.id !== "lf07").flatMap((lf): Pruefungsteil[] => [
      { id: `${lf.id}-grundlagen`, titel: "Grundlagen", stufe: "grundlagen", lernfelder: [lf.id], anzahl: 10, minuten: 15,
        beschreibung: `${lf.titel}: Begriffe, Bauteile und einzelne Zusammenhänge sicher erkennen.` },
      { id: `${lf.id}-anwendung`, titel: "Anwendung", stufe: "anwendung", lernfelder: [lf.id], anzahl: 10, minuten: 20,
        beschreibung: `${lf.titel}: bekannte Verfahren, Zusammenhänge und Maßnahmen anwenden.` },
      { id: `${lf.id}-pruefungsnah`, titel: "Prüfungsnah", stufe: "pruefungsnah", lernfelder: [lf.id], anzahl: 10, minuten: 30,
        beschreibung: `${lf.titel}: mehrere Angaben oder Baustellensituationen verknüpfen und Entscheidungen beurteilen.` },
    ]),
    {
      id: "teil1",
      titel: "Grundlagen — Lernfeld 1 bis 9",
      beschreibung: "Gemischtes Training. Gleiche Verteilung über Lernfelder, keine offizielle Prüfungsgewichtung.",
      lernfelder: alle.filter((id) => /^lf0[1-9]$/.test(id)),
      anzahl: 30,
      minuten: 45,
    },
    {
      id: "teil2",
      titel: "Fachwissen — alle Lernfelder",
      beschreibung: "Der gesamte fachliche Stoff: Lernfeld 1 bis 17 und die Anhänge, gemischt.",
      lernfelder: alle,
      anzahl: 40,
      minuten: 60,
    },
    {
      id: "wiso",
      titel: "Wirtschafts- und Sozialkunde",
      beschreibung: "Nur WiSo — eigener Prüfungsbereich in der schriftlichen Prüfung.",
      lernfelder: ["wiso"],
      anzahl: 15,
      minuten: 25,
    },
  ];
}

/** Lernfelder und Aufgabentypen ausgewogen üben, ohne amtliche Gewichtung zu behaupten. */
export function ziehePruefung(pool: Aufgabe[], anzahl: number, zufall: () => number = Math.random): Aufgabe[] {
  const felder = new Map<string, Map<string, Aufgabe[]>>();
  for (const a of pool) {
    const typen = felder.get(a.lernfeld) ?? new Map<string, Aufgabe[]>();
    const gruppe = typen.get(a.typ) ?? [];
    gruppe.push(a);
    typen.set(a.typ, gruppe);
    felder.set(a.lernfeld, typen);
  }
  const reihum = (gruppen: Aufgabe[][]): Aufgabe[] => {
    const auswahl: Aufgabe[] = [];
    for (let i = 0; i < Math.max(0, ...gruppen.map((g) => g.length)); i++) {
      for (const g of gruppen) if (g[i]) auswahl.push(g[i]);
    }
    return auswahl;
  };
  const gruppen = zieheAufgaben([...felder.values()], felder.size, zufall)
    .map((typen) => reihum(zieheAufgaben([...typen.values()], typen.size, zufall).map((g) => zieheAufgaben(g, g.length, zufall))));
  return reihum(gruppen).slice(0, Math.max(0, anzahl));
}

export function poolFuer(teil: Pruefungsteil): Aufgabe[] {
  return teil.lernfelder.flatMap((id) => getAufgaben(id)).filter(istAutoBewertbar)
    .filter((a) => Boolean(EXAM_METADATA[a.id]) && (!teil.stufe || EXAM_METADATA[a.id].level === teil.stufe));
}

export function zieheAufgaben<T>(
  pool: T[],
  anzahl: number,
  zufall: () => number = Math.random,
): T[] {
  const a = [...pool];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(zufall() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(anzahl, a.length));
}

/** Teilweise richtig zählt einen halben Punkt. */
export function punkteFuer(b: Bewertung): number {
  return b === "richtig" ? 1 : b === "teilweise" ? 0.5 : 0;
}

export function prozentFuer(ergebnisse: Bewertung[], gesamt: number): number {
  if (gesamt === 0) return 0;
  const punkte = ergebnisse.reduce((s, b) => s + punkteFuer(b), 0);
  return (punkte / gesamt) * 100;
}

export interface Notenstufe {
  ab: number;
  note: number;
  text: string;
}

/**
 * Üblicher Bewertungsschlüssel für Prüfungen bei Kammern. Den verbindlichen
 * Schlüssel legt die zuständige Kammer fest — hier zur groben Einordnung.
 */
export const NOTENSCHLUESSEL: Notenstufe[] = [
  { ab: 92, note: 1, text: "sehr gut" },
  { ab: 81, note: 2, text: "gut" },
  { ab: 67, note: 3, text: "befriedigend" },
  { ab: 50, note: 4, text: "ausreichend" },
  { ab: 30, note: 5, text: "mangelhaft" },
  { ab: 0, note: 6, text: "ungenügend" },
];

export function noteFuer(prozent: number): Notenstufe {
  return NOTENSCHLUESSEL.find((n) => prozent >= n.ab) ?? NOTENSCHLUESSEL[NOTENSCHLUESSEL.length - 1];
}

/** @deprecated Nur für alte Protokolle; der neue Prüfungsraum verwendet das Trainingsziel 80 %. */
export function bestanden(prozent: number): boolean {
  return prozent >= 50;
}

export function formatiereZeit(sekunden: number): string {
  const s = Math.max(0, Math.floor(sekunden));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** Kurzfassung einer Aufgabe fürs Protokoll — je nach Typ die Frage oder der Text. */
function frageVon(a: Aufgabe): string {
  switch (a.typ) {
    case "mc":
    case "diagram":
      return a.frage;
    case "cloze":
      return a.text.replace(/\{\{(.+?)\}\}/g, "___");
    case "calc":
    case "draw":
      return a.aufgabentext;
    case "fachbegriff":
      return a.begriff;
  }
}

/**
 * Textprotokoll einer abgeschlossenen Prüfung.
 *
 * Die Auswertung auf dem Bildschirm ist weg, sobald man eine neue Prüfung
 * startet. Das Protokoll bleibt — und genau die falsch beantworteten Aufgaben
 * mit ihrer Erklärung sind das, was man am Abend danach durchgeht.
 */
export function pruefungsprotokoll(
  titel: string,
  aufgaben: Aufgabe[],
  ergebnisse: Bewertung[],
  jetzt: number,
): string {
  const prozent = prozentFuer(ergebnisse, aufgaben.length);
  const note = noteFuer(prozent);
  const datum = new Date(jetzt).toLocaleString("de-DE");

  const zeilen: string[] = [
    `Prüfungsprotokoll — ${titel}`,
    datum,
    "",
    `Ergebnis: ${prozent.toFixed(0)} % · Note ${note.note} (${note.text}) · ${
      bestanden(prozent) ? "bestanden" : "nicht bestanden"
    }`,
    `${ergebnisse.filter((e) => e === "richtig").length} von ${aufgaben.length} voll richtig`,
    "",
  ];

  const proLf = new Map<string, { richtig: number; gesamt: number }>();
  aufgaben.forEach((a, i) => {
    const e = proLf.get(a.lernfeld) ?? { richtig: 0, gesamt: 0 };
    e.gesamt += 1;
    e.richtig += punkteFuer(ergebnisse[i] ?? "falsch");
    proLf.set(a.lernfeld, e);
  });

  zeilen.push("Nach Lernfeld");
  for (const [lf, e] of [...proLf.entries()].sort(
    (a, b) => a[1].richtig / a[1].gesamt - b[1].richtig / b[1].gesamt,
  )) {
    zeilen.push(`  ${lf.padEnd(10)} ${e.richtig} / ${e.gesamt}`);
  }

  const offen = aufgaben.filter((_, i) => ergebnisse[i] !== "richtig");
  zeilen.push("", `Zum Nacharbeiten (${offen.length})`, "");
  for (const a of offen) {
    const i = aufgaben.indexOf(a);
    const b = ergebnisse[i] ?? "nicht bearbeitet";
    zeilen.push(`[${a.lernfeld}] ${frageVon(a)}`);
    zeilen.push(`  Bewertung: ${b}`);
    zeilen.push(`  ${a.erklaerung}`);
    zeilen.push(`  Quelle: ${a.quelle}`);
    zeilen.push("");
  }

  return zeilen.join("\n");
}
