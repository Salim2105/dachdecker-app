import { beforeEach, describe, expect, it } from "vitest";
import { appStorage } from "@/lib/lernSpeicher";
import {
  ERPROBUNG_KEY, ERPROBUNGS_AUFGABEN, erprobungAlsCsv, erprobungAlsJson, erprobungsAuswertung, hatBeobachtung,
  ladeErprobung, leereBeobachtung, leereErprobung, leseErprobung, neueErprobungsSitzung, speichereErprobung,
} from "@/lib/erprobung";

beforeEach(() => appStorage.clear());

describe("tatsächlich beobachtete Azubi-Erprobungen", () => {
  it("beginnt ohne Teilnehmende oder erfundene Ergebnisse", () => {
    expect(ladeErprobung()).toEqual({ version: 1, auswahl: null, sitzungen: [] });
    const s = neueErprobungsSitzung(leereErprobung(), "", 123, "test-1").sitzungen[0];
    expect(s.code).toBe("Person 01");
    expect(erprobungsAuswertung(s)).toEqual({ erfasst: 0, selbststaendig: 0, mitHilfe: 0, nichtGelungen: 0, ergebnisOffen: 8 });
    expect(JSON.parse(erprobungAlsJson(s)).beobachtungen).toEqual([]);
    expect(erprobungAlsCsv(s).split("\r\n")).toHaveLength(1);
    expect(hatBeobachtung(leereBeobachtung())).toBe(false);
  });

  it("stellt Auswahl, Selbstauskunft, Ergebnisse, Zeit und unveränderte Notizen wieder her", () => {
    const stand = neueErprobungsSitzung(leereErprobung(), "  A03  ", 1770000000000, "test-1");
    stand.sitzungen[0].aufgabeId = "mathe";
    stand.sitzungen[0].vorwissen = "2. Lehrjahr; Flächen neu";
    stand.sitzungen[0].beobachtungen.mathe = { ...leereBeobachtung(), ergebnis: "mit_hilfe", hilfe: "Formel eingeblendet", begriffe: "Quadratmeter", missverstaendnis: "Umfang statt Fläche", notiz: 'Sagte: „jetzt klar“\nNeue Maße selbst gerechnet.', dauerSekunden: 153 };
    speichereErprobung(stand);
    expect(ladeErprobung()).toEqual(stand);
    const zweite = neueErprobungsSitzung(ladeErprobung()!, "A04", 1770000000001, "test-2");
    expect(zweite.sitzungen[0]).toEqual(stand.sitzungen[0]);
    expect(zweite.auswahl).toBe("test-2");
    expect(erprobungsAuswertung(zweite.sitzungen[0]).mitHilfe).toBe(1);
    expect(erprobungsAuswertung(zweite.sitzungen[1]).erfasst).toBe(0);
  });

  it("zählt eine offene Aufgabe mit Notiz als Beobachtung, ohne einen Erfolg zu behaupten", () => {
    const s = neueErprobungsSitzung(leereErprobung(), "A01", 123, "test-1").sitzungen[0];
    s.beobachtungen.begriff = { ...leereBeobachtung(), notiz: "Person hat pausiert; Ergebnis noch offen." };
    expect(erprobungsAuswertung(s)).toEqual({ erfasst: 1, selbststaendig: 0, mitHilfe: 0, nichtGelungen: 0, ergebnisOffen: 8 });
    const beobachtungen = JSON.parse(erprobungAlsJson(s)).beobachtungen;
    expect(beobachtungen).toHaveLength(1);
    expect(beobachtungen[0].ergebnis).toBe("offen");
    expect(beobachtungen[0].aufgabeId).toBe("begriff");
  });

  it("exportiert nur erfasste Beobachtungen und hält CSV-Notizen als Text", () => {
    const s = neueErprobungsSitzung(leereErprobung(), "=A1", 123, "test-1").sitzungen[0];
    s.beobachtungen.lernweg = leereBeobachtung();
    s.beobachtungen.englisch = { ...leereBeobachtung(), ergebnis: "nicht_gelungen", notiz: '=HYPERLINK("Test")\nFolgezeile; "Zitat"', dauerSekunden: 0 };
    expect(JSON.parse(erprobungAlsJson(s)).beobachtungen).toHaveLength(1);
    const csv = erprobungAlsCsv(s);
    expect(csv).toContain('"\'=A1"');
    expect(csv).toContain('"\'=HYPERLINK(""Test"")\nFolgezeile; ""Zitat"""');
    expect(csv).toContain('"Noch nicht geschafft"');
    expect(csv).not.toContain('"Eine kurze Lerneinheit finden"');
    expect(csv.endsWith(';"0"')).toBe(true);
    expect(JSON.parse(erprobungAlsJson(s)).beobachtungen[0].notiz).toBe(s.beobachtungen.englisch.notiz);
  });

  it("weist beschädigte, unbekannte und widersprüchliche Daten zurück, ohne das Original zu überschreiben", () => {
    const s = neueErprobungsSitzung(leereErprobung(), "A01", 123, "test-1");
    for (const raw of [
      "kein JSON", JSON.stringify({ ...s, auswahl: "fremd" }),
      JSON.stringify({ ...s, sitzungen: [s.sitzungen[0], s.sitzungen[0]] }),
      JSON.stringify({ ...s, sitzungen: [{ ...s.sitzungen[0], angelegt: 1e300 }] }),
      JSON.stringify({ ...s, sitzungen: [{ ...s.sitzungen[0], aufgabeId: "fremd" }] }),
      JSON.stringify({ ...s, sitzungen: [{ ...s.sitzungen[0], beobachtungen: { unbekannt: leereBeobachtung() } }] }),
      JSON.stringify({ ...s, sitzungen: [{ ...s.sitzungen[0], beobachtungen: { mathe: { ...leereBeobachtung(), ergebnis: "bestanden" } } }] }),
      JSON.stringify({ ...s, sitzungen: [{ ...s.sitzungen[0], beobachtungen: { mathe: { ...leereBeobachtung(), dauerSekunden: -1 } } }] }),
    ]) {
      appStorage.setItem(ERPROBUNG_KEY, raw);
      expect(leseErprobung(raw)).toBeNull();
      expect(ladeErprobung()).toBeNull();
      expect(appStorage.getItem(ERPROBUNG_KEY)).toBe(raw);
    }
    expect(() => neueErprobungsSitzung(s, "A02", 124, "test-1")).toThrow();
  });

  it("bietet acht verschiedene Szenarien mit Kriterien und vorhandenen App-Bereichen", () => {
    expect(new Set(ERPROBUNGS_AUFGABEN.map((a) => a.id)).size).toBe(8);
    expect(ERPROBUNGS_AUFGABEN.every((a) => a.kriterium.length > 50 && a.auftrag.length > 50 && a.route.startsWith("/"))).toBe(true);
  });
});
