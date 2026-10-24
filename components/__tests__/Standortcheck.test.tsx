import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import Lernhilfe from "@/app/lernhilfe/page";
import { appStorage } from "@/lib/lernSpeicher";
import { STANDORT_FRAGEN, STANDORT_KEY, ladeStandortcheck } from "@/lib/standortcheck";
import { ladeLernsignale } from "@/lib/lerndiagnose";

beforeEach(()=>{appStorage.clear();vi.spyOn(window,"scrollTo").mockImplementation(()=>{});});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
describe("Standortcheck mit gespeicherten tatsächlichen Antworten",()=>{
 it("behält eine noch ungeprüfte Antwort und leitet aus einem Einheitenfehler zur passenden Übung",()=>{
  const first=render(<Lernhilfe/>);
  fireEvent.click(screen.getByRole("button",{name:"Standortcheck starten"}));
  fireEvent.click(screen.getByRole("radio",{name:"24 cm"}));
  first.unmount();render(<Lernhilfe/>);
  expect((screen.getByRole("radio",{name:"24 cm"}) as HTMLInputElement).checked).toBe(true);
  expect(ladeLernsignale()).toHaveLength(0);
  fireEvent.click(screen.getByRole("button",{name:"Antwort vergleichen"}));
  expect(ladeLernsignale()).toHaveLength(1);
  expect(ladeLernsignale()[0]).toMatchObject({richtig:false,kategorie:"einheiten",lernzielId:"laengen"});
  expect(screen.getByRole("link",{name:"Passenden Lernschritt öffnen →"}).getAttribute("href")).toBe("/grundlagen/mathe#laengen");
  fireEvent.click(screen.getByRole("button",{name:"Pause machen und speichern"}));
  fireEvent.click(screen.getByRole("button",{name:"Standortcheck fortsetzen"}));
  expect(screen.queryByRole("button",{name:"Antwort vergleichen"})).toBeNull();
  expect(ladeLernsignale()).toHaveLength(1);
 });
 it("beendet alle sechs Fragen ohne daraus eine dauerhafte Lernereinstufung zu machen",()=>{
  render(<Lernhilfe/>);fireEvent.click(screen.getByRole("button",{name:"Standortcheck starten"}));
  for(const [i,f] of STANDORT_FRAGEN.entries()){
   fireEvent.click(screen.getByRole("radio",{name:f.optionen[f.korrekt]}));
   fireEvent.click(screen.getByRole("button",{name:"Antwort vergleichen"}));
   fireEvent.click(screen.getByRole("button",{name:i<5?"Nächste Einstiegsaufgabe":"Meine nächsten Übungen ansehen"}));
  }
  expect(ladeStandortcheck().fertig).toBe(true);
  expect(ladeLernsignale()).toHaveLength(6);
  expect(screen.getByText(/Im Moment gibt es keine offenen Übungshinweise/)).toBeDefined();
  fireEvent.click(screen.getByRole("button",{name:"Neuen Standortcheck beginnen"}));
  expect(ladeStandortcheck().geprueft).toHaveLength(0);
  expect(ladeLernsignale()).toHaveLength(6);
 });
 it("akzeptiert weder leere Abschlussbehauptungen noch doppelte Prüfmarkierungen aus einem beschädigten Entwurf",()=>{
  appStorage.setItem(STANDORT_KEY,JSON.stringify({index:0,antworten:{},geprueft:[],fertig:true}));
  expect(ladeStandortcheck().fertig).toBe(false);
  appStorage.setItem(STANDORT_KEY,JSON.stringify({index:0,antworten:{"check-einheit":1},geprueft:["check-einheit","check-einheit"],fertig:false}));
  expect(ladeStandortcheck().geprueft).toHaveLength(0);
 });
});
