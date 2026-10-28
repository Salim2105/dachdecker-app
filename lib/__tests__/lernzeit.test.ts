import {describe,expect,it} from "vitest";
import { getAufgaben } from "@/lib/content";
import { schaetzeSekunden,zeitAuswahl } from "@/lib/lernzeit";
import type { CalcAufgabe } from "@/content/schema";
const basis=getAufgaben("lf02").find(a=>a.typ==="calc") as CalcAufgabe;
const lang:CalcAufgabe={...basis,schritte:[...basis.schritte,...basis.schritte,...basis.schritte,...basis.schritte]};
describe("Zeitwahl ohne heimliches Überschreiten",()=>{
 it("erhält die Reserve und zwingt keine zu lange Rechenkette in fünf Minuten",()=>{
  expect(schaetzeSekunden(lang)).toBeGreaterThan(240);expect(zeitAuswahl([lang],5)).toEqual([]);
 });
 it("bietet die ganze Rechenkette bei ausreichender Zeit an, ohne sie zu zerlegen",()=>{
  expect(zeitAuswahl([lang],30)).toEqual([lang]);
  expect(zeitAuswahl([lang],30)[0]).toBe(lang);
 });
 it("überschreitet auch mit mehreren Aufgaben nicht achtzig Prozent der Zeit",()=>{
  const auswahl=zeitAuswahl(getAufgaben("lf02"),5);expect(auswahl.reduce((sum,a)=>sum+schaetzeSekunden(a),0)).toBeLessThanOrEqual(240);
 });
});
