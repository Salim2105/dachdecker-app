import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Aufgabe } from "@/content/schema";
import { LernfeldUebung } from "@/components/LernfeldUebung";
import { appStorage } from "@/lib/lernSpeicher";
import { uebungsSessionId } from "@/lib/fortsetzung";

let query = "";
vi.mock("next/navigation", () => ({useSearchParams: () => new URLSearchParams(query)}));
const aufgaben: Aufgabe[] = ["a", "b", "c"].map((id, i) => ({id, typ:"mc", lernfeld:"lf01", thema:i < 2 ? "Dach" : "Wand", quelle:"Test", konfidenz:"hoch", frage:`Frage ${id}`, optionen:["Ja", "Nein"], korrekt:[0], erklaerung:"Test"}));
const alt = (ids:string[], extra = {}) => JSON.stringify({aufgabenIds:ids, index:0, ergebnisse:[], beantwortet:false, nacharbeit:false, nacharbeitErgebnisse:[], ...extra});
function adresse(neu:string) {query=neu;window.history.replaceState(null,"",`/lernen/lf01/ueben${neu ? `?${neu}` : ""}`);}
beforeEach(() => {appStorage.clear();adresse("");vi.spyOn(window,"scrollTo").mockImplementation(() => {});});
afterEach(() => {cleanup();vi.restoreAllMocks();adresse("");});

describe("Themenwechsel ohne verlorene Antworten", () => {
  it("erhält eine freie Quizrunde und unabhängige Entwürfe beim Wechsel zwischen Themen", () => {
    const original = alt(["a", "b", "c"]);
    appStorage.setItem("dd-session-lf01", original);
    appStorage.setItem("dd-entwurf-lf01:a-uebung-notiz", '"Meine freie Runde"');
    adresse("thema=Dach");
    const {rerender} = render(<LernfeldUebung lfId="lf01" aufgaben={aufgaben}/>);
    expect((screen.getByRole("textbox", {name:"Deine Antwort"}) as HTMLTextAreaElement).value).toBe("");
    fireEvent.change(screen.getByRole("textbox", {name:"Deine Antwort"}), {target:{value:"Dachantwort"}});
    adresse("thema=Wand");rerender(<LernfeldUebung lfId="lf01" aufgaben={aufgaben}/>);
    fireEvent.change(screen.getByRole("textbox", {name:"Deine Antwort"}), {target:{value:"Wandantwort"}});
    adresse("thema=Dach");rerender(<LernfeldUebung lfId="lf01" aufgaben={aufgaben}/>);
    expect((screen.getByRole("textbox", {name:"Deine Antwort"}) as HTMLTextAreaElement).value).toBe("Dachantwort");
    expect(appStorage.getItem("dd-session-lf01")).toBe(original);
    expect(appStorage.getItem("dd-entwurf-lf01:a-uebung-notiz")).toBe('"Meine freie Runde"');
    adresse("");rerender(<LernfeldUebung lfId="lf01" aufgaben={aufgaben}/>);
    expect((screen.getByRole("textbox", {name:"Deine Antwort"}) as HTMLTextAreaElement).value).toBe("Meine freie Runde");
  });
  it("übernimmt einen alten passenden Themenstand vor dem Öffnen einschließlich der nächsten Eingabe", () => {
    const original = alt(["a", "b"], {index:1, ergebnisse:["richtig"]});
    appStorage.setItem("dd-session-lf01", original);
    appStorage.setItem("dd-entwurf-lf01:b-uebung-notiz", '"Angefangene zweite Antwort"');
    adresse("thema=Dach");render(<LernfeldUebung lfId="lf01" aufgaben={aufgaben}/>);
    expect(screen.getByText("Frage b")).toBeDefined();
    expect((screen.getByRole("textbox", {name:"Deine Antwort"}) as HTMLTextAreaElement).value).toBe("Angefangene zweite Antwort");
    expect(JSON.parse(appStorage.getItem(`dd-session-${uebungsSessionId("lf01", false, "Dach")}`)!)).toEqual(JSON.parse(original));
    expect(appStorage.getItem("dd-session-lf01")).toBe(original);
  });
});
