import { beforeEach, describe, expect, it } from "vitest";
import type { Aufgabe } from "@/content/schema";
import { appStorage } from "@/lib/lernSpeicher";
import { uebungsFortsetzung, uebungsRoute, uebungsSessionId } from "@/lib/fortsetzung";
import { uebernehmePassendeThemenrunde } from "@/lib/uebungStand";

const aufgaben: Aufgabe[] = ["a", "b"].map(id => ({id, typ:"mc", lernfeld:"lf01", thema:"Dach & Wand", quelle:"Test", konfidenz:"hoch", frage:id, optionen:["Ja", "Nein"], korrekt:[0], erklaerung:"Test"}));
const raw = JSON.stringify({aufgabenIds:["a", "b"], index:1, ergebnisse:["richtig"], beantwortet:false, nacharbeit:false, nacharbeitErgebnisse:[]});
beforeEach(() => appStorage.clear());

describe("Getrennte Themenrunden", () => {
  it("erhält alte Sitzungsadressen und erzeugt vollständige Themenadressen", () => {
    expect(uebungsSessionId("lf01")).toBe("lf01");
    expect(uebungsSessionId("lf01", true)).toBe("lf01-rechnung");
    expect(uebungsRoute("lf01-einheit")).toBe("/lernen/lf01?ansicht=alte-runde");
    const scope = uebungsSessionId("lf01", true, "Dach & Wand / Maße");
    expect(uebungsRoute(scope)).toBe("/lernen/lf01/ueben?typ=rechnung&thema=Dach%20%26%20Wand%20%2F%20Ma%C3%9Fe");
    expect(uebungsRoute("lf01-thema-%ungueltig")).toBeNull();
  });
  it("findet eine Themenrunde auch über den bisherigen Fortsetzungszeiger", () => {
    const scope = uebungsSessionId("lf01", false, "Dach & Wand");
    appStorage.setItem(`dd-session-${scope}`, raw);
    expect(uebungsFortsetzung(scope, "lf01")).toMatchObject({href:"/lernen/lf01/ueben?thema=Dach%20%26%20Wand", thema:"Dach & Wand", index:1, total:2});
  });
  it("kopiert nur eine exakt passende alte Runde samt Eingaben und Zufallswerten", () => {
    const scope = uebungsSessionId("lf01", false, "Dach & Wand");
    appStorage.setItem("dd-session-lf01", raw);
    appStorage.setItem("dd-entwurf-lf01:b-uebung-notiz", '"Meine Erklärung"');
    appStorage.setItem("dd-calc-lf01:b", '{"a":4.5}');
    appStorage.setItem("dd-entwurf-lf01:fremd-uebung-notiz", '"Andere Aufgabe"');
    uebernehmePassendeThemenrunde("lf01", scope, aufgaben);
    expect(appStorage.getItem(`dd-session-${scope}`)).toBe(raw);
    expect(appStorage.getItem(`dd-entwurf-${scope}:b-uebung-notiz`)).toBe('"Meine Erklärung"');
    expect(appStorage.getItem(`dd-calc-${scope}:b`)).toBe('{"a":4.5}');
    expect(appStorage.getItem(`dd-entwurf-${scope}:fremd-uebung-notiz`)).toBeNull();
    expect(appStorage.getItem("dd-session-lf01")).toBe(raw);
    expect(appStorage.getItem("dd-entwurf-lf01:b-uebung-notiz")).toBe('"Meine Erklärung"');
    appStorage.setItem(`dd-entwurf-${scope}:b-uebung-notiz`, '"Weitergeschrieben"');
    uebernehmePassendeThemenrunde("lf01", scope, aufgaben);
    expect(appStorage.getItem(`dd-entwurf-${scope}:b-uebung-notiz`)).toBe('"Weitergeschrieben"');
  });
  it("lässt eine andere alte Aufgabenliste und eine vorhandene Themenrunde unangetastet", () => {
    const scope = uebungsSessionId("lf01", false, "Dach & Wand");
    appStorage.setItem("dd-session-lf01", raw);
    uebernehmePassendeThemenrunde("lf01", scope, aufgaben.slice(0, 1));
    expect(appStorage.getItem(`dd-session-${scope}`)).toBeNull();
    appStorage.setItem(`dd-session-${scope}`, "Eigene neuere Runde");
    uebernehmePassendeThemenrunde("lf01", scope, aufgaben);
    expect(appStorage.getItem(`dd-session-${scope}`)).toBe("Eigene neuere Runde");
    expect(appStorage.getItem("dd-session-lf01")).toBe(raw);
  });
});
