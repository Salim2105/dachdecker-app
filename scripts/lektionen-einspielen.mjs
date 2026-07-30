// Spielt die von der Workflow-Runde erzeugten Lektionen in content/<lf>/lektionen.json ein.
//
// Zwei Dinge passieren dabei automatisch, weil sie sich sonst durch 56 Lektionen
// von Hand ziehen müssten:
//
// 1. Die vom Gegenleser gemeldeten erfundenen Aussagen werden durch seinen
//    Ersatzsatz ersetzt. Was sich nicht eindeutig zuordnen lässt, wird gemeldet
//    statt stillschweigend übergangen — sonst bliebe eine Falschaussage drin.
// 2. Verbotene Formulierungen werden gesucht: Behauptungen über die
//    Gesellenprüfung sind unbelegbar, auch wenn sie der Gegenleser selbst in
//    einem Ersatzsatz verwendet hat.
//
// Aufruf: node scripts/lektionen-einspielen.mjs <ergebnis.json> [--schreiben]

import { readFileSync, writeFileSync } from "node:fs";

const [quelle, ...flags] = process.argv.slice(2);
const schreiben = flags.includes("--schreiben");
if (!quelle) {
  console.error("Aufruf: node scripts/lektionen-einspielen.mjs <ergebnis.json> [--schreiben]");
  process.exit(1);
}

const VERBOTEN = [
  /in der Pr[üu]fung/i,
  /f[üu]r die Pr[üu]fungsfrage/i,
  /wird abgefragt/i,
  /werden abgefragt/i,
  /mehr brauchst du/i,
  /Schl[üu]sselwort in der/i,
  /kommt (gern |oft |meist )?als L[üu]cke/i,
];

// Ein möglichst langes, eindeutiges Stück der beanstandeten Aussage suchen.
function findeBlock(inhalt, aussage) {
  const sauber = String(aussage).replace(/\s+/g, " ").trim();
  for (let laenge = Math.min(sauber.length, 120); laenge >= 30; laenge -= 10) {
    const nadel = sauber.slice(0, laenge);
    const treffer = inhalt.map((b, i) => (b.includes(nadel) ? i : -1)).filter((i) => i >= 0);
    if (treffer.length === 1) return { index: treffer[0], nadel };
  }
  return null;
}

// Was die automatische Zuordnung nicht trifft, steht hier ausgeschrieben.
// Auch Ersatzsätze des Gegenlesers landen hier, wenn er selbst eine verbotene
// Formulierung eingebaut hat — das ist zweimal vorgekommen.
const HAND_KORREKTUREN = [
  {
    lf: "lf04",
    suchen: "und am Ende entscheidest du, wann die Schalung wieder weg darf",
    ersetzen: "und am Ende musst du wissen, wann die Schalung wieder weg darf",
  },
  {
    lf: "lf03",
    suchen: "Für die Prüfungsfrage zählt das Maßverhältnis der Achsen",
    ersetzen: "Entscheidend ist das Maßverhältnis der Achsen",
  },
  {
    lf: "lf03",
    suchen: "Der Unterschied in einem Satz: Isometrie",
    ersetzen: "Der Unterschied liegt im Maßverhältnis: Isometrie",
  },
];

const daten = JSON.parse(readFileSync(quelle, "utf8"));
const bericht = { ersetzt: 0, handKorrekturen: 0, nichtZuzuordnen: [], verbotene: [] };

function handKorrekturen(einheit) {
  for (const k of HAND_KORREKTUREN.filter((x) => x.lf === einheit.lf)) {
    for (const l of einheit.lektionen) {
      for (const [i, b] of l.inhalt.entries()) {
        if (b.includes(k.suchen)) {
          l.inhalt[i] = b.replace(k.suchen, k.ersetzen);
          bericht.handKorrekturen++;
        }
      }
    }
  }
}

for (const einheit of daten.einheiten) {
  const { lf, lektionen, pruefung } = einheit;

  // --- Korrekturen anwenden ---
  for (const fund of pruefung?.erfundene_aussagen ?? []) {
    const lektion = lektionen.find((l) => l.thema === fund.lektion_thema);
    if (!lektion) {
      bericht.nichtZuzuordnen.push(`${lf}: Lektion "${fund.lektion_thema}" nicht gefunden`);
      continue;
    }
    const treffer = findeBlock(lektion.inhalt, fund.aussage);
    if (!treffer) {
      bericht.nichtZuzuordnen.push(`${lf}/${fund.lektion_thema}: "${String(fund.aussage).slice(0, 70)}…"`);
      continue;
    }
    const block = lektion.inhalt[treffer.index];
    if (/^streichen$/i.test(String(fund.ersatz).trim())) {
      // Nur den beanstandeten Satz entfernen, nicht den ganzen Block.
      const satz = block.split(/(?<=[.!?])\s+/).find((s) => s.includes(treffer.nadel.slice(0, 30)));
      lektion.inhalt[treffer.index] = satz ? block.replace(satz, "").replace(/\s+/g, " ").trim() : block;
    } else {
      const satz = block.split(/(?<=[.!?])\s+/).find((s) => s.includes(treffer.nadel.slice(0, 30)));
      lektion.inhalt[treffer.index] = satz
        ? block.replace(satz, fund.ersatz).replace(/\s+/g, " ").trim()
        : fund.ersatz;
    }
    bericht.ersetzt++;
  }

  // Erst nach den automatischen Korrekturen — sonst greift eine Handkorrektur
  // an einem Satz, den die automatische Ersetzung danach erst einsetzt.
  handKorrekturen(einheit);

  // --- Verbotene Formulierungen aufspüren, auch in Ersatzsätzen ---
  for (const l of lektionen) {
    for (const [i, b] of l.inhalt.entries()) {
      for (const r of VERBOTEN) {
        if (r.test(b)) bericht.verbotene.push(`${lf}/${l.thema}[${i}]: ${b.match(r)[0]} — ${b.slice(0, 90)}…`);
      }
    }
  }

  // --- Einspielen ---
  if (!schreiben) continue;
  const pfad = `content/${lf}/lektionen.json`;
  const bestand = JSON.parse(readFileSync(pfad, "utf8"));
  const hoechste = bestand.reduce((m, l) => {
    const n = Number(String(l.id).match(/-l(\d+)$/)?.[1] ?? 0);
    return Math.max(m, n);
  }, 0);
  const neu = lektionen.map((l, i) => ({
    id: `${lf}-l${String(hoechste + i + 1).padStart(2, "0")}`,
    lernfeld: lf,
    thema: l.thema,
    titel: l.titel,
    inhalt: l.inhalt,
    quelle: `Abgeleitet aus den geprüften Aufgaben dieses Lernfelds (Dachdecker-Fachbuch, Handwerk und Technik)`,
    konfidenz: "hoch",
  }));
  writeFileSync(pfad, JSON.stringify([...bestand, ...neu], null, 2) + "\n");
  console.log(`${lf}: ${bestand.length} + ${neu.length} = ${bestand.length + neu.length} Lektionen`);
}

console.log(`\nKorrekturen angewandt: ${bericht.ersetzt} automatisch, ${bericht.handKorrekturen} von Hand`);
if (bericht.nichtZuzuordnen.length) {
  console.log(`\nNICHT ZUZUORDNEN (${bericht.nichtZuzuordnen.length}) — von Hand prüfen:`);
  for (const z of bericht.nichtZuzuordnen) console.log("  " + z);
}
if (bericht.verbotene.length) {
  console.log(`\nVERBOTENE FORMULIERUNGEN (${bericht.verbotene.length}):`);
  for (const z of bericht.verbotene) console.log("  " + z);
}
if (!schreiben) console.log("\n(Probelauf — nichts geschrieben. Mit --schreiben einspielen.)");
