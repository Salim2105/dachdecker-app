import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import Home from "@/app/page";
import Lernen from "@/app/lernen/page";
import Ueben from "@/app/ueben/page";
import { getLernfelder } from "@/lib/lernfelder";
import { appStorage } from "@/lib/lernSpeicher";

beforeEach(()=>appStorage.clear());afterEach(cleanup);
describe("Aufgeräumte Einstiegsseiten",()=>{
  it("bietet auf der Übersicht Weiterlernen, Tagesrunde und persönliche Hinweise statt wiederholter Kataloge",()=>{
    appStorage.setItem("lernwerkstatt-zuletzt-route","/grundlagen/mathe#aufbau-laengen");
    render(<Home/>);
    expect(screen.getByRole("link",{name:"Weiterlernen"}).getAttribute("href")).toBe("/grundlagen/mathe#aufbau-laengen");
    expect(screen.getByRole("heading",{name:"Deine Tagesrunde"})).toBeDefined();
    expect(screen.getByRole("heading",{name:"Deine Lernhinweise"})).toBeDefined();
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
