import { beforeEach, describe, expect, it } from "vitest";
import { lernFortsetzung, letzterLernschritt } from "@/lib/lernFortsetzung";
import { appStorage } from "@/lib/lernSpeicher";
import { getAufgaben } from "@/lib/content";
import { getCurriculum } from "@/lib/curriculum";
import { kursStandKey, neuerKursStand } from "@/lib/kursStand";
import { MATHE_EINHEITEN } from "@/lib/matheGrundlagen";
import { AUFBAU_EINHEITEN, aufbauKey, neuerAufbauStand, pruefeAufbauAufgabe } from "@/lib/matheAufbau";
import { sprachEinheiten, sprachKey, leseSprachStand } from "@/lib/sprachWerkstatt";
import { BAUPROJEKTE, projektKey, neuerProjektStand } from "@/lib/bauprojekte";
import { WERKSTATT_PFADE } from "@/lib/werkstattInhalte";
import { neuerWerkstattStand, werkstattKey } from "@/lib/werkstattStand";
import { BILD_AUFGABEN, bildStandKey, neuerBildStand } from "@/lib/bildtraining";
import { getDachDetail } from "@/lib/dach3dInhalte";
import { dachAntwort, dachStandKey, neuerDachStand, pruefeDachAufgabe } from "@/lib/dach3dStand";
import { FALL_VERSUCH_KEY, abgegebenerFallVersuch, neuerFallVersuch } from "@/lib/fallVersuch";
import { EXAM_KEY, createExamAttempt, finishExam } from "@/lib/exam";
import { getPruefungsteile } from "@/lib/pruefung";
import { PRUEFUNGS_MATHE_KEY, abgegebenerPruefungsMatheVersuch, neuerPruefungsMatheVersuch, pruefungsMatheSchritte } from "@/lib/pruefungsMathe";
import { starteAktivitaet, type Aktivitaet } from "@/lib/aktivitaeten";
import { createReviewSession, planReviewSessionKey, reviewSessionKey } from "@/lib/reviewTasks";

const now = Date.UTC(2026, 10, 2, 12);
const speichern = (key: string, value: unknown) => appStorage.setItem(key, JSON.stringify(value));
const letzte = (href: string) => appStorage.setItem("lernwerkstatt-zuletzt-route", href);
function loesung(a: Aktivitaet) {
  const r = starteAktivitaet(a);
  if (a.typ === "zuordnen") r.zuordnung = Object.fromEntries(a.paare.map(p => [p.id, p.id]));
  else if (a.typ === "reihenfolge") r.reihenfolge = a.schritte.map(s => s.id);
  else r.auswahl = a.optionen.filter(o => o.korrekt).map(o => o.id);
  return r;
}
beforeEach(() => appStorage.clear());

describe("Gemeinsame Lernfortsetzung", () => {
  it("bevorzugt die gültige angefangene Einheit, dann fällige Aufgaben, dann die Lernfeldauswahl", () => {
    expect(lernFortsetzung(0, now)).toMatchObject({ art: "auswahl", href: "/lernen" });
    expect(lernFortsetzung(3, now)).toMatchObject({ art: "heute", href: "/heute", schritt: "3 Wiederholungen sind fällig." });
    letzte("/sprache/englisch#sicherheit");
    expect(lernFortsetzung(3, now)).toMatchObject({ art: "fortsetzen", href: "/sprache/englisch#sicherheit", schritt: "Sprachaufgabe 1 von 3" });
  });

  it.each([
    "/grundlagen/mathe#unbekannt", "/lernen/lf07#entfernte-einheit", "/lernen/lf999#lf999-e01",
    "/sprache/deutsch#unbekannt", "/bildtraining#unbekannt", "/projekte#unbekannt",
    "/projekte?deckung=warmdach#dach-steildach-s03", "/projekte#dach-flachdach-s03",
    "/rechner", "/taschenrechner", "/zeichnen", "/glossar", "https://fremd.test/lernen/lf07", "//fremd.test/lernen/lf07",
  ])("weicht bei unbekannten Zielen und Werkzeugen sicher aus: %s", href => {
    letzte(href);
    speichern("unbekannter-lernstand", { notiz: "Aufbewahren" });
    expect(lernFortsetzung(2, now)).toMatchObject({ art: "heute", href: "/heute" });
    expect(appStorage.getItem("lernwerkstatt-zuletzt-route")).toBe(href);
    expect(appStorage.getItem("unbekannter-lernstand")).toBe('{"notiz":"Aufbewahren"}');
  });

  it("validiert die Zuordnung von Lernfeld und Einheit statt nur deren Schreibweise", () => {
    const einheit = getCurriculum("lf07")!.kapitel[0].einheiten[0];
    expect(letzterLernschritt(`/lernen/lf08#${einheit.id}`, now)).toBeNull();
    const stand = { ...neuerKursStand(einheit), phase: 1, notiz: "Angefangene Erklärung" };
    speichern(kursStandKey(einheit), stand);
    letzte(`/lernen/lf07#${einheit.id}`);
    expect(lernFortsetzung(4, now)).toMatchObject({ titel: einheit.titel, schritt: "Selbst erklären", minuten: einheit.minuten });
    speichern(kursStandKey(einheit), { ...stand, phase: 4, abgeschlossen: true, verglichen: true, selbstbewertung: "richtig", ergebnisse: einheit.aufgabenIds.map(id => ({ id, bewertung: "richtig" })), ...(einheit.aktivitaet ? { aktivitaet: loesung(einheit.aktivitaet), aktivitaetGeprueft: true } : {}) });
    expect(lernFortsetzung(4, now).art).toBe("heute");
  });

  it("liest den alten Einheitzeiger nur mit einem wirklich vorhandenen Ziel", () => {
    const e = getCurriculum("lf07")!.kapitel[0].einheiten[0];
    speichern("lernwerkstatt-zuletzt", { lfId: "lf07", unitId: e.id });
    expect(lernFortsetzung(0, now).href).toBe(`/lernen/lf07#${e.id}`);
    speichern("lernwerkstatt-zuletzt", { lfId: "lf07", unitId: "unbekannt" });
    expect(lernFortsetzung(0, now).art).toBe("auswahl");
  });

  it("zeigt bei Fachmathe die gespeicherte Aufgabe und überspringt abgeschlossene Einheiten", () => {
    const e = MATHE_EINHEITEN[0], href = `/grundlagen/mathe#${e.id}`;
    const antworten = Object.fromEntries(e.fragen.map(f => [f.id, { wert: String(f.wert), einheit: f.einheit, hilfen: [], ergebnis: { richtig: true } }]));
    speichern(`fachmathe-${e.id}-v1`, { version: 1, index: 1, notiz: "Entwurf", antworten, abgeschlossen: false });
    expect(letzterLernschritt(href, now)).toMatchObject({ schritt: `Rechenaufgabe 2 von ${e.fragen.length}`, minuten: e.minuten });
    speichern(`fachmathe-${e.id}-v1`, { version: 1, index: 1, notiz: "Entwurf", antworten, abgeschlossen: true });
    expect(letzterLernschritt(href, now)).toBeNull();
  });

  it("zeigt nach ungültigen Fachmathe-Daten denselben ersten Schritt wie die Bearbeitung und erhält den Entwurf", () => {
    const e = MATHE_EINHEITEN[0], key = `fachmathe-${e.id}-v1`;
    speichern(key, { version: 1, index: 2, notiz: 42, antworten: {}, abgeschlossen: false });
    const original = appStorage.getItem(key);
    expect(letzterLernschritt(`/grundlagen/mathe#${e.id}`, now)?.schritt).toBe(`Rechenaufgabe 1 von ${e.fragen.length}`);
    expect(appStorage.getItem(key)).toBe(original);
  });

  it("liest Aufbau-Mathe mit dessen bestehendem Parser und erfindet keine Zeitangabe", () => {
    const e = AUFBAU_EINHEITEN[0], href = `/grundlagen/mathe#${e.id}`, stand = neuerAufbauStand(e, 0);
    stand.index = 1;
    speichern(aufbauKey(e.id), stand);
    expect(letzterLernschritt(href, now)).toMatchObject({ titel: e.titel, schritt: `Rechenaufgabe 2 von ${e.aufgabenIds.length}` });
    expect(letzterLernschritt(href, now)?.minuten).toBeUndefined();
    for (const v of Object.values(stand.versuche)) {
      v.antworten = Object.fromEntries(v.aufgabe.schritte.map(s => [s.id, { wert: String(s.wert), einheit: s.einheit }]));
      v.ergebnis = pruefeAufbauAufgabe(v.aufgabe, v.antworten)!;
    }
    speichern(aufbauKey(e.id), { ...stand, abgeschlossen: true });
    expect(letzterLernschritt(href, now)).toBeNull();
  });

  it.each(["deutsch", "englisch"] as const)("setzt %s exakt fort und bietet abgeschlossene Spracheinheiten nicht erneut an", sprache => {
    const e = sprachEinheiten(sprache)[0], href = `/sprache/${sprache}#${e.id}`;
    const stand = leseSprachStand(e);
    stand.index = 2;
    speichern(sprachKey(e), stand);
    expect(letzterLernschritt(href, now)).toMatchObject({ titel: e.titel, schritt: "Sprachaufgabe 3 von 3" });
    expect(letzterLernschritt(href, now)?.minuten).toBeUndefined();
    for (const a of e.aufgaben) stand.antworten[a.id] = { wahl: a.typ === "wahl" ? String(a.korrekt) : "", paare: a.typ === "zuordnung" ? Object.fromEntries(a.paare.map(p => [p.links, p.rechts])) : {}, hilfen: [], geprueft: true };
    speichern(sprachKey(e), { ...stand, abgeschlossen: true });
    expect(letzterLernschritt(href, now)).toBeNull();
  });

  it("zeigt den Projektschritt und die Werkstattphase aus ihren getrennten Lernständen", () => {
    const p = BAUPROJEKTE[0], projekt = neuerProjektStand(p, now);
    speichern(projektKey(p.id), { ...projekt, schritt: 2, besucht: 2 });
    expect(letzterLernschritt(`/projekte#${p.id}`, now)).toMatchObject({ titel: p.titel, schritt: "Schritt 3 von 6 · Rechnen", minuten: p.minuten });
    const e = WERKSTATT_PFADE[1].einheiten[0], stand = neuerWerkstattStand(e, now);
    speichern(werkstattKey(e.id), { ...stand, phase: "uebung", aufgabeIndex: 1 });
    expect(letzterLernschritt(`/projekte#${e.id}`, now)).toMatchObject({ titel: e.titel, schritt: "Selbst entscheiden · Aufgabe 2 von 2", minuten: e.minuten });
  });

  it("bewahrt Dachdeckung und Detail im Ziel und liest den genauen Montageschritt", () => {
    const href = "/projekte?deckung=biber-doppel#dach-steildach-s03", stand = neuerDachStand(now);
    stand.jeDach.steildach = { ...stand.jeDach.steildach, detailId: "s03", deckung: "biber-doppel", phase: "montage", schritt: 1 };
    speichern(dachStandKey, stand); letzte(href);
    expect(lernFortsetzung(9, now)).toMatchObject({ href, titel: getDachDetail("s03")!.titel, schritt: `Montage · Schritt 2 von ${getDachDetail("s03")!.schritte.length}` });
    expect(lernFortsetzung(9, now).minuten).toBeUndefined();
    let fertig = stand;
    for (const a of getDachDetail("s03")!.aufgaben) {
      const antwort = dachAntwort(fertig, a, now);
      antwort.auswahl = a.optionen.filter(o => o.korrekt).map(o => o.id);
      fertig = pruefeDachAufgabe({ ...fertig, antworten: { ...fertig.antworten, [a.id]: antwort } }, a.id, now);
    }
    speichern(dachStandKey, fertig);
    expect(lernFortsetzung(9, now).art).toBe("heute");
    expect(appStorage.getItem("lernwerkstatt-zuletzt-route")).toBe(href);
  });

  it("unterscheidet bei Bildern Bearbeitung, geprüfte Rückmeldung und Abschluss", () => {
    const a = BILD_AUFGABEN[0], href = `/bildtraining#${a.id}`, stand = neuerBildStand(a);
    speichern(bildStandKey(a.id), stand);
    expect(letzterLernschritt(href, now)).toMatchObject({ titel: a.titel, minuten: a.minuten });
    const geprueft = { ...stand, antwort: loesung(a.aktivitaet), geprueft: true, bewertetAm: now };
    speichern(bildStandKey(a.id), geprueft);
    expect(letzterLernschritt(href, now)?.schritt).toBe("Rückmeldung ansehen und als bearbeitet speichern");
    speichern(bildStandKey(a.id), { ...geprueft, abgeschlossen: true });
    expect(letzterLernschritt(href, now)).toBeNull();
  });

  it("setzt unabhängige Prüfungs-Mathe trotz alter Matheauswahl fort und überspringt Abgaben", () => {
    const versuch = neuerPruefungsMatheVersuch(AUFBAU_EINHEITEN[0].aufgabenIds[0], 0, now);
    appStorage.setItem("fachmathe-auswahl", MATHE_EINHEITEN[0].id);
    speichern(PRUEFUNGS_MATHE_KEY, { version: 1, aktiv: versuch.id, versuche: [versuch] });
    expect(letzterLernschritt("/grundlagen/mathe?ansicht=pruefungsaufgaben&fortsetzen=1", now)).toMatchObject({ bereich: "Fachmathe · Prüfungsaufgaben", schritt: `Rechenschritt 1 von ${pruefungsMatheSchritte(versuch).length}` });
    versuch.antworten = Object.fromEntries(pruefungsMatheSchritte(versuch).map(s => [s.id, { wert: String(s.wert), einheit: s.einheit }]));
    const abgegeben = abgegebenerPruefungsMatheVersuch(versuch, now + 1);
    speichern(PRUEFUNGS_MATHE_KEY, { version: 1, aktiv: versuch.id, versuche: [abgegeben] });
    expect(letzterLernschritt("/grundlagen/mathe?ansicht=pruefungsaufgaben&fortsetzen=1", now + 2)).toBeNull();
  });

  it("zeigt die aktuelle Fall-Teilaufgabe und überspringt abgegebene oder abgelaufene Prüfungen ohne Schreibzugriff", () => {
    const v = neuerFallVersuch(["ziegeldach"], "probelauf", true, now);
    v.index = 2;
    speichern(FALL_VERSUCH_KEY, v);
    expect(letzterLernschritt("/pruefung#fortsetzen", now)).toMatchObject({ schritt: `Teilaufgabe 3 von ${v.faelle[0].teile.length} · ${v.faelle[0].teile[2].titel}`, minuten: v.faelle[0].teile[2].minuten });
    const original = appStorage.getItem(FALL_VERSUCH_KEY);
    expect(letzterLernschritt("/pruefung#fortsetzen", v.frist! + 1)).toBeNull();
    expect(appStorage.getItem(FALL_VERSUCH_KEY)).toBe(original);
    speichern(FALL_VERSUCH_KEY, abgegebenerFallVersuch(v, now + 1));
    expect(letzterLernschritt("/pruefung#fortsetzen", now + 2)).toBeNull();
  });

  it("erhält ältere Lernfeld-Prüfungen einschließlich abgelaufener Originalstände unverändert", () => {
    const v = createExamAttempt(getPruefungsteile()[0], true, now, () => 0.2);
    v.index = 2;
    speichern(EXAM_KEY, v);
    expect(letzterLernschritt("/pruefung#feldtraining", now)).toMatchObject({ titel: expect.stringContaining(v.preset.titel), schritt: `Aufgabe 3 von ${v.questions.length} · ${v.questions[2].task.thema}` });
    const original = appStorage.getItem(EXAM_KEY);
    expect(letzterLernschritt("/pruefung#feldtraining", v.deadline! + 1)).toBeNull();
    expect(appStorage.getItem(EXAM_KEY)).toBe(original);
    speichern(EXAM_KEY, finishExam(v, now + 1));
    expect(letzterLernschritt("/pruefung#feldtraining", now + 2)).toBeNull();
  });

  it("bevorzugt die neu geöffnete Quizrunde und setzt ihren Themenfilter und Nacharbeit exakt fort", () => {
    const einheit = getCurriculum("lf07")!.kapitel[0].einheiten[0];
    speichern("lernwerkstatt-zuletzt", {lfId:"lf07", unitId:einheit.id});
    const alle = getAufgaben("lf03"), thema = alle[0].thema, aufgaben = alle.filter(a => a.thema === thema);
    const href = `/lernen/lf03/ueben?thema=${encodeURIComponent(thema)}`;
    letzte(href);
    speichern("dd-session-lf03", {aufgabenIds:aufgaben.map(a => a.id), index:0, ergebnisse:aufgaben.map((_, i) => i === 0 ? "falsch" : "richtig"), beantwortet:false, nacharbeit:true, nacharbeitErgebnisse:[]});
    const original = appStorage.getItem("dd-session-lf03");
    expect(lernFortsetzung(4, now)).toMatchObject({art:"fortsetzen", href, titel:thema, schritt:"Nacharbeit · Aufgabe 1 von 1"});
    expect(appStorage.getItem("dd-session-lf03")).toBe(original);
    expect(letzterLernschritt("/lernen/lf03/ueben?typ=unbekannt", now)).toBeNull();
    expect(letzterLernschritt("/lernen/lf03/ueben?thema=unbekannt", now)).toBeNull();
  });

  it("erhält frühere Quizrunden und ihren Nacharbeitsstand erreichbar", () => {
    appStorage.setItem("letzte-session", "lf03");
    speichern("dd-session-lf03", { aufgabenIds: ["alt-1", "alt-2"], index: 0, ergebnisse: ["falsch", "richtig"], beantwortet: false, nacharbeit: true, nacharbeitErgebnisse: [] });
    expect(lernFortsetzung(4, now)).toMatchObject({ art: "fortsetzen", href: "/lernen/lf03/ueben", schritt: "Nacharbeit · Aufgabe 1 von 1" });
    appStorage.removeItem("dd-session-lf03");
    expect(lernFortsetzung(4, now).art).toBe("heute");
  });

  it("setzt die tatsächlich aktive gemeinsame Tagesrunde mit ihrer eingefrorenen Dauer fort", () => {
    const stand = createReviewSession("kurz", 15, now, () => .2);
    stand.index = 1;
    speichern(reviewSessionKey("kurz"), stand);
    appStorage.setItem("tagesrunde-filter", "tief");
    appStorage.setItem("lernzeit", "30");
    letzte("/heute?runde=kurz");
    const original = appStorage.getItem(reviewSessionKey("kurz"));
    expect(lernFortsetzung(4, now)).toMatchObject({art:"fortsetzen", href:"/heute?runde=kurz", titel:stand.tasks[1].titel, schritt:`Aufgabe 2 von ${stand.tasks.length}`, minuten:15});
    expect(appStorage.getItem(reviewSessionKey("kurz"))).toBe(original);
    speichern(reviewSessionKey("kurz"), {...stand, index:stand.tasks.length});
    expect(lernFortsetzung(4, now)).toMatchObject({art:"heute", href:"/heute"});
  });

  it("erhält geplante Tagesrunden auch nach einer Planänderung und verwirft unbekannte Rundenadressen", () => {
    const id = "plan-2026-11-02-15", stand = createReviewSession("alles",15,now,()=>.2);
    stand.id = `plan-runde-${id}:snapshot`;
    speichern(planReviewSessionKey(id),stand);
    expect(letzterLernschritt(`/heute?plan=${id}`,now)).toMatchObject({href:`/heute?plan=${id}`, bereich:"Deine geplante Tagesrunde", minuten:15});
    for (const href of ["/heute?runde=unbekannt", "/heute?plan=unbekannt", `/heute?plan=${id}&runde=alles`, "/heute?runde=alles&runde=kurz"]) expect(letzterLernschritt(href,now)).toBeNull();
    speichern(planReviewSessionKey(id),{...stand,id:"andere-runde"});
    expect(letzterLernschritt(`/heute?plan=${id}`,now)).toBeNull();
  });

  it("verändert beschädigte moderne Tagesrunden beim Ausweichen nicht", () => {
    appStorage.setItem(reviewSessionKey("alles"),"beschädigter Entwurf");
    letzte("/heute?runde=alles");
    expect(lernFortsetzung(0,now)).toMatchObject({art:"auswahl",href:"/lernen"});
    expect(appStorage.getItem(reviewSessionKey("alles"))).toBe("beschädigter Entwurf");
    speichern(reviewSessionKey("alles"),createReviewSession("kurz",15,now,()=>.2));
    expect(letzterLernschritt("/heute?runde=alles",now)).toBeNull();
  });
});
