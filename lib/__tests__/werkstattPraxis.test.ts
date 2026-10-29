import { beforeEach, describe, expect, it } from "vitest";
import { appStorage } from "@/lib/lernSpeicher";
import { FALL_THEMEN } from "@/lib/pruefungsFaelle";
import { WERKSTATT_PRAXIS_THEMEN, werkstattPraxisBlatt } from "@/lib/werkstattPraxis";
import { PRAXIS_VORBEREITUNG_THEMEN, istPraxisSvg, ladePraxisVorbereitung, neuePraxisVorbereitung, parsePraxisVorbereitung, planungFesthalten, praxisVorbereitungKey, speicherePraxisVorbereitung } from "@/lib/praxisVorbereitung";

beforeEach(()=>appStorage.clear());
describe("Eigene Praxisblätter für beide Deckungswege",()=>{
  it("ergänzt zwei getrennte Vorlagen, ohne Prüfungsfamilien oder alte Schlüssel zu verändern",()=>{
    expect(FALL_THEMEN).toHaveLength(6);
    expect(PRAXIS_VORBEREITUNG_THEMEN).toHaveLength(8);
    expect(WERKSTATT_PRAXIS_THEMEN.map(t=>t.id)).toEqual(["werkstatt-falzziegel","werkstatt-biber-doppel"]);
    const alt=neuePraxisVorbereitung("ziegeldach",1000);
    alt.notiz="Alte Planung bleibt";speicherePraxisVorbereitung(alt);
    for(const thema of WERKSTATT_PRAXIS_THEMEN){
      const s=neuePraxisVorbereitung(thema.id,2000);
      expect(s.blatt.thema).toBe(thema.id);
      expect(s.blatt.gespraech).toHaveLength(4);
      expect(s.blatt.ablauf).toHaveLength(8);
      expect(istPraxisSvg(s.blatt.svg)).toBe(true);
      expect(istPraxisSvg(s.blatt.musterSvg)).toBe(true);
      expect(s.blatt.angaben.join(" ")).toContain("Modellmaße");
      speicherePraxisVorbereitung(s);
      expect(ladePraxisVorbereitung(thema.id)).toEqual(s);
    }
    expect(ladePraxisVorbereitung("ziegeldach")).toEqual(alt);
    expect(praxisVorbereitungKey("ziegeldach")).toBe("praxisvorbereitung-ziegeldach-v1");
    expect(werkstattPraxisBlatt("kein-thema")).toBeUndefined();
  });

  it("erhält getrennte erste Planung, praktische Angabe und eingetragene Rückmeldung",()=>{
    const s=neuePraxisVorbereitung("werkstatt-biber-doppel",1000);
    const vorbereitet=planungFesthalten({...s,werkzeugeText:"Maßband",materialText:"Biber",ablaufText:"Bezüge messen"},2000);
    const ausgefuehrt={...vorbereitet,aktualisiertAm:3000,ablaufText:"Ergänzte Reihenfolge",ausgefuehrt:true,ausgefuehrtAm:"2026-10-29",ausfuehrungNotiz:"Kleines Feld praktisch gedeckt",rueckmeldung:{datum:"2026-10-29",name:"",rolle:"Ausbilder",text:"Versatz kontrolliert"},rueckmeldungErfasst:true};
    speicherePraxisVorbereitung(ausgefuehrt);
    const geladen=ladePraxisVorbereitung("werkstatt-biber-doppel")!;
    expect(geladen.erstePlanung?.ablauf).toBe("Bezüge messen");
    expect(geladen.ablaufText).toBe("Ergänzte Reihenfolge");
    expect(geladen.ausgefuehrt).toBe(true);
    expect(geladen.rueckmeldungErfasst).toBe(true);
    expect(appStorage.getItem("kompetenznachweise-v1")).toBeNull();
    expect(parsePraxisVorbereitung(JSON.stringify({...s,rueckmeldungErfasst:true}))).toBeNull();
  });

  it("erhält beschädigte neue Daten und weist aktives importiertes SVG zurück",()=>{
    const key=praxisVorbereitungKey("werkstatt-falzziegel");
    appStorage.setItem(key,"{kaputt");
    expect(()=>speicherePraxisVorbereitung(neuePraxisVorbereitung("werkstatt-falzziegel"))).toThrow(/bleibt erhalten/);
    expect(appStorage.getItem(key)).toBe("{kaputt");
    const s=neuePraxisVorbereitung("werkstatt-biber-doppel");
    s.blatt.svg='<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>';
    expect(parsePraxisVorbereitung(JSON.stringify(s))).toBeNull();
  });
});
