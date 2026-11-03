import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import Home from "@/app/page";
import Lernen from "@/app/lernen/page";
import Ueben from "@/app/ueben/page";
import { getLernfelder } from "@/lib/lernfelder";
import { appStorage } from "@/lib/lernSpeicher";

beforeEach(()=>appStorage.clear());afterEach(cleanup);
describe("Aufgeräumte Einstiegsseiten",()=>{
  it("bietet eine konkrete Fortsetzung und zwei kompakte Alternativen",()=>{
    appStorage.setItem("lernwerkstatt-zuletzt-route","/grundlagen/mathe#aufbau-laengen");
    render(<Home/>);
    expect(screen.getByRole("link",{name:"Weiterlernen"}).getAttribute("href")).toBe("/grundlagen/mathe#aufbau-laengen");
    expect(screen.getByRole("heading",{name:"Wahre Sparren-, Grat- und Kehllängen"})).toBeDefined();
    expect(screen.getByRole("navigation",{name:"Andere Lernmöglichkeiten"}).querySelectorAll("a")).toHaveLength(2);
    expect(screen.getByRole("link",{name:/^Tagesrunde /}).getAttribute("href")).toBe("/heute");
    expect(screen.getByRole("link",{name:/^Gezielt weiterüben /}).getAttribute("href")).toBe("/lernhilfe");
    expect(document.querySelectorAll(".home-hero-cta")).toHaveLength(1);
    expect(document.querySelector(".home-exam-date")?.hasAttribute("open")).toBe(false);
    expect(screen.queryByText(/Dem Wasser/)).toBeNull();expect(screen.queryByText("Heute mal anders lernen.")).toBeNull();
  });
  it("behält auf der Startseite auch ältere angefangene Quizrunden erreichbar",()=>{
    appStorage.setItem("letzte-session","lf03");
    appStorage.setItem("dd-session-lf03",JSON.stringify({aufgabenIds:["alt-1","alt-2"],index:1,ergebnisse:["richtig"],beantwortet:false}));
    render(<Home/>);
    expect(screen.getByRole("link",{name:"Weiterlernen"}).getAttribute("href")).toBe("/lernen/lf03/ueben");
  });
  it("zeigt alle 22 Lernbereiche einschließlich Anhängen und WiSo",()=>{
    render(<Lernen/>);
    const felder=getLernfelder();
    felder.forEach(lf=>expect(screen.getByRole("link",{name:new RegExp(lf.titel.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"))}).getAttribute("href")).toBe(`/lernen/${lf.id}`));
    expect(screen.queryByText(/Mit dem Wasserweg beginnen/)).toBeNull();
  });
  it("beschränkt Quiz & Aufgaben auf die Lernfeldauswahl und öffnet die passende bestehende Route",()=>{
    render(<Ueben/>);
    expect(screen.getAllByRole("option")).toHaveLength(22);
    fireEvent.change(screen.getByRole("combobox"),{target:{value:"anhang3"}});
    expect(screen.getByRole("link",{name:"Aufgaben starten →"}).getAttribute("href")).toBe("/lernen/anhang3/ueben");
    expect(screen.queryByText("Baustellenprojekte öffnen →")).toBeNull();
  });
});
