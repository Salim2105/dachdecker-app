import { beforeEach, describe, expect, it } from "vitest";
import { appStorage } from "@/lib/lernSpeicher";
import { FALL_THEMEN } from "@/lib/pruefungsFaelle";
import { istPraxisSvg, ladePraxisVorbereitung, neuePraxisVorbereitung, parsePraxisVorbereitung, planungFesthalten, praxisVorbereitungKey, speicherePraxisVorbereitung } from "@/lib/praxisVorbereitung";
beforeEach(()=>appStorage.clear());
describe("Praxisblätter und getrennte Übungsprotokolle",()=>{
 it.each(FALL_THEMEN)("stellt $titel mit Skizze und vier Gesprächsimpulsen wieder her",t=>{
  const s=neuePraxisVorbereitung(t.id,1000);speicherePraxisVorbereitung(s);expect(ladePraxisVorbereitung(t.id)).toEqual(s);expect(s.blatt.gespraech).toHaveLength(4);
  [s.blatt.werkzeuge,s.blatt.material,s.blatt.sicherheit,s.blatt.kontrolle,s.blatt.ablauf,s.blatt.zeichenKriterien].forEach(xs=>expect(xs.length).toBeGreaterThan(0));expect(s.planung).toBe(false);expect(s.ausgefuehrt).toBe(false);expect(s.rueckmeldungErfasst).toBe(false);
 });
 it("erhält die erste Planung trotz späterer Überarbeitung",()=>{
  const basis={...neuePraxisVorbereitung("ziegeldach",1000),werkzeugeText:"Maßband",materialText:"Ziegel",ablaufText:"Auftrag klären"};const erst=planungFesthalten(basis,2000),neu=planungFesthalten({...erst,ablaufText:"Auch Anschlüsse abstimmen"},3000);
  expect(neu.erstePlanung).toEqual({werkzeuge:"Maßband",material:"Ziegel",ablauf:"Auftrag klären",am:2000});speicherePraxisVorbereitung(neu);expect(ladePraxisVorbereitung("ziegeldach")?.ablaufText).toContain("Anschlüsse");
 });
 it("wertet weder Vorbereitung noch Skizzeneinschätzung zu praktischer Abnahme auf",()=>{
  const s=planungFesthalten({...neuePraxisVorbereitung("flachdach"),werkzeugeText:"Werkzeug",materialText:"Material",ablaufText:"Ablauf",zeichnung:"richtig"});speicherePraxisVorbereitung(s);const g=ladePraxisVorbereitung("flachdach")!;
  expect(g.planung).toBe(true);expect(g.ausgefuehrt).toBe(false);expect(g.rueckmeldungErfasst).toBe(false);expect(appStorage.getItem("kompetenznachweise-v1")).toBeNull();expect(appStorage.getItem("fortschritt-v1")).toBeNull();expect(parsePraxisVorbereitung(JSON.stringify({...s,rueckmeldungErfasst:true}))).toBeNull();
 });
 it("überschreibt beschädigte gespeicherte Stände nicht",()=>{
  const key=praxisVorbereitungKey("sanierung");appStorage.setItem(key,"{kaputt");expect(()=>speicherePraxisVorbereitung(neuePraxisVorbereitung("sanierung"))).toThrow(/bleibt erhalten/);expect(appStorage.getItem(key)).toBe("{kaputt");
 });
 it("weist unmögliche Daten und unbekannte Kontrollpunkte zurück",()=>{
  const s=neuePraxisVorbereitung("schiefer");expect(parsePraxisVorbereitung(JSON.stringify({...s,ausgefuehrtAm:"2026-02-30"}))).toBeNull();expect(parsePraxisVorbereitung(JSON.stringify({...s,kontrolliert:["kontrolle-999"]}))).toBeNull();expect(parsePraxisVorbereitung(JSON.stringify({...s,kontrolliert:["kontrolle-"]}))).toBeNull();
 });
 it("lässt importierte SVGs weder Script noch externe Bilder ausführen",()=>{
  ['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>','<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><path d="M0 0L1 1"/></svg>','<svg xmlns="http://www.w3.org/2000/svg"><image href="https://example.org/image"/></svg>','<svg xmlns="http://www.w3.org/2000/svg"><path fill="url(https://example.org)" d="M0 0L1 1"/></svg>'].forEach(s=>expect(istPraxisSvg(s)).toBe(false));
 });
});
