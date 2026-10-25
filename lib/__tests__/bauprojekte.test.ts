import { beforeEach, describe, expect, it } from "vitest";
import { appStorage } from "@/lib/lernSpeicher";
import { BAUPROJEKTE, PROJEKT_TRANSFER, PROJEKT_SCHRITTE, darfProjektRechnen, instantiateProjektTransfer, leseProjektStand, neuerProjektStand, projektErgebnis, projektKey, projektVollstaendig, pruefeProjektTransfer, pruefeProjektZahl } from "@/lib/bauprojekte";
import { bewerteAktivitaet } from "@/lib/aktivitaeten";

beforeEach(()=>localStorage.clear());
describe("Baustellenprojekte",()=>{
  it("enthält sechs vollständige versionierte Projekte mit sechs Arbeitsschritten",()=>{
    expect(BAUPROJEKTE).toHaveLength(6);expect(PROJEKT_SCHRITTE).toHaveLength(6);
    expect(BAUPROJEKTE.filter(p=>p.ausgabe==="0.6")).toHaveLength(3);
    expect(new Set(BAUPROJEKTE.map(p=>p.id)).size).toBe(6);
    for(const p of BAUPROJEKTE){
      expect(p.hilfen).toHaveLength(6);expect(Object.keys(p.aktivitaeten)).toHaveLength(4);
      expect(p.rechnungen.length).toBeGreaterThanOrEqual(3);expect(p.zeichnung.schritte.length).toBeGreaterThanOrEqual(3);
      expect(p.kriterien.length).toBeGreaterThanOrEqual(3);expect(p.lernzielIds.length).toBeGreaterThan(0);
    }
  });
  it("prüft die tatsächlich angegebenen Mengen unabhängig nach",()=>{
    const referenz: Record<string,number[]>={ziegeldach:[5,100,12.5,1375],flachdach:[48,52.8,12],sanierung:[4,.2222222222222222,3.2],schiefer:[70,1750,1838],metalldach:[10,80,10.56],fassade:[21,42,47]};
    for(const p of BAUPROJEKTE)p.rechnungen.forEach((r,i)=>{
      expect(r.wert,`${p.id}:${r.id}`).toBeCloseTo(referenz[p.id][i],8);
      expect(pruefeProjektZahl(r,String(referenz[p.id][i]).replace(".",","))).toBe(true);
    });
  });
  it("erhält falsche Vorwerte und bietet für abhängige Schritte eine getrennte Referenzhilfe",()=>{
    const p=BAUPROJEKTE[0],s=neuerProjektStand(p),[vor,nach]=p.rechnungen;
    s.zahlen[vor.id]="99";s.zahlenGeprueft.push(vor.id);
    expect(darfProjektRechnen(s,nach)).toBe(false);
    s.referenzen.push(vor.id);s.hilfen.push(`referenz:${vor.id}`);
    expect(darfProjektRechnen(s,nach)).toBe(true);expect(s.zahlen[vor.id]).toBe("99");
    s.zahlen[nach.id]="100";s.zahlenGeprueft.push(nach.id);
    expect(pruefeProjektZahl(nach,s.zahlen[nach.id])).toBe(true);
    expect(projektErgebnis(s)).toEqual({richtig:1,gesamt:8});
  });
  it("bewahrt Projektversuch, Begleitung, Notizen und tatsächliche Antworten nach Neustart",()=>{
    const p=BAUPROJEKTE[0],s=neuerProjektStand(p);
    s.schritt=2;s.besucht=2;s.begleitet=false;s.zahlen.schraege="4,";s.notiz="Traufe prüfen";
    s.antworten.auftrag.auswahl=["o1"];appStorage.setItem(projektKey(p.id),JSON.stringify(s));
    const wieder=leseProjektStand(appStorage.getItem(projektKey(p.id)),p);
    expect(wieder).toEqual(s);expect(wieder?.projekt).not.toBe(p);
  });
  it("zählt Selbsteinschätzungen niemals zum automatischen Ergebnis",()=>{
    const s=neuerProjektStand(BAUPROJEKTE[0]);s.selbst="richtig";s.zeichnen="richtig";
    expect(projektErgebnis(s)).toEqual({richtig:0,gesamt:8});expect(projektVollstaendig(s)).toBe(false);
  });
  it("erlaubt einen Abschluss erst nach allen Übungen und Selbstvergleichen",()=>{
    const p=BAUPROJEKTE[0],s=neuerProjektStand(p);
    for(const[k,a]of Object.entries(p.aktivitaeten)){
      if(a.typ==="zuordnen")s.antworten[k].zuordnung=Object.fromEntries(a.paare.map(p=>[p.id,p.id]));
      else if(a.typ==="reihenfolge")s.antworten[k].reihenfolge=a.schritte.map(s=>s.id);
      else s.antworten[k].auswahl=a.optionen.filter(o=>o.korrekt).map(o=>o.id);
      s.geprueft.push(k);expect(bewerteAktivitaet(a,s.antworten[k]).richtig).toBe(true);
    }
    for(const r of p.rechnungen){s.zahlen[r.id]=String(r.wert);s.zahlenGeprueft.push(r.id);}
    s.zeichnen="teilweise";s.selbst="teilweise";s.musterOffen=true;s.erklaerung="Dachfläche und Grundfläche unterscheiden.";
    expect(projektVollstaendig(s)).toBe(true);expect(projektErgebnis(s)).toEqual({richtig:8,gesamt:8});
  });
  it("überschreibt beschädigte oder unvollständige Daten nicht",()=>{
    const p=BAUPROJEKTE[0],raw="{defekt";appStorage.setItem(projektKey(p.id),raw);
    expect(leseProjektStand(raw,p)).toBeNull();expect(appStorage.getItem(projektKey(p.id))).toBe(raw);
    const s=neuerProjektStand(p);s.schritt=7;expect(leseProjektStand(JSON.stringify(s),p)).toBeNull();
  });
  it.each(["", " ", "NaN", "Infinity", "12m", "3+4"])("bewertet ungültige Eingaben %j nicht",wert=>{
    expect(pruefeProjektZahl(BAUPROJEKTE[0].rechnungen[0],wert)).toBeNull();
  });
  it("liefert je Projekt eigenständig verständliche kurze Transferaufgaben mit eingefrorenen Varianten",()=>{
    expect(PROJEKT_TRANSFER).toHaveLength(6);
    for(const p of BAUPROJEKTE){
      const a=instantiateProjektTransfer(p.id,()=>.2),b=instantiateProjektTransfer(p.id,()=>.8);
      expect(a.frage).not.toBe(b.frage);expect(a.parameter).not.toEqual(b.parameter);
      expect(pruefeProjektTransfer(a,String(a.wert))).toBe("richtig");
      expect(pruefeProjektTransfer(JSON.parse(JSON.stringify(a)),String(a.wert+3))).toBe("falsch");
    }
  });
});
