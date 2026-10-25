import { describe, expect, it } from "vitest";
import { NAV_GRUPPEN, WERKSTATT_NAV, SERVICE_NAV, MOBILE_NAV, aktiverBereich, bereichsTitel, navigationsZiel } from "@/lib/navigation";
import { bereichsAuswahl } from "@/lib/bereichsAuswahl";

describe("16 direkte Lernbereiche", () => {
  it("führt jeden Bereich genau einmal in vier Gruppen und trennt mobile Schnellzugriffe", () => {
    expect(NAV_GRUPPEN.map(g => g.eintraege.length)).toEqual([4, 5, 5, 2]);
    expect(new Set(WERKSTATT_NAV.map(e => e.href)).size).toBe(16);
    expect(MOBILE_NAV.map(e => e.label)).toEqual(["Start", "Heute", "Bereiche", "Lernstand"]);
  });
  it.each(WERKSTATT_NAV)("markiert $label auch mit Katalog und Einheitensprung", e => {
    expect(aktiverBereich(`${navigationsZiel(e)}#einheit`)).toBe(e.href);
    expect(bereichsTitel(e.href)).toBe(e.label);
  });
  it.each(["lf01", "lf13a", "lf13b", "anhang1", "anhang3", "wiso"])("erhält Lern- und Übungsadressen für %s", id => {
    expect(aktiverBereich(`/lernen/${id}/`)).toBe("/lernen");
    expect(aktiverBereich(`/lernen/${id}/ueben?typ=rechnung`)).toBe("/ueben");
  });
  it("erhält Praxisalias und Serviceeinträge, ohne fremde Routen zu markieren", () => {
    expect(aktiverBereich("/lernweg")).toBe("/praxis");
    SERVICE_NAV.forEach(e => { expect(bereichsTitel(e.href)).toBe(e.label); expect(aktiverBereich(e.href)).toBe(e.href); });
    ["/nicht-vorhanden", "/lernen-alt", "/lernen/lf01/anderes"].forEach(p => expect(aktiverBereich(p)).toBeNull());
  });
});
describe("Katalog oder Bearbeitungspunkt", () => {
  const ids = ["einheit-a", "einheit-b"];
  it("öffnet beim Menüaufruf die Übersicht statt der gespeicherten Einheit", () => {
    expect(bereichsAuswahl(ids, "einheit-a", {hash:"", search:"?ansicht=uebersicht"})).toBe("");
  });
  it("gibt einem gültigen Einheitensprung Vorrang vor Katalog und altem Stand", () => {
    expect(bereichsAuswahl(ids, "einheit-a", {hash:"#einheit-b", search:"?ansicht=uebersicht"})).toBe("einheit-b");
  });
  it("setzt alte Links ohne Katalog fort und wechselt bei unbekannten IDs nicht unbemerkt zur alten Aufgabe", () => {
    expect(bereichsAuswahl(ids, "einheit-a", {hash:"", search:""})).toBe("einheit-a");
    expect(bereichsAuswahl(ids, "unbekannt", {hash:"", search:""})).toBe("");
    expect(bereichsAuswahl(ids, "einheit-a", {hash:"#unbekannt", search:""})).toBe("");
  });
});
