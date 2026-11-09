import { beforeEach, describe, expect, it } from "vitest";
import { appStorage } from "@/lib/lernSpeicher";
import { getPraxisVideo } from "@/lib/praxisVideoInhalte";
import type { PraxisVideo } from "@/lib/praxisVideoTypen";
import { istPraxisVideoLernStaende, ladePraxisVideoLernStand, neuerPraxisVideoLernStand, offenerPraxisVideoLernStand, praxisVideoLernStandKey, praxisVideoLernStaendeKey, speicherePraxisVideoLernStand } from "@/lib/praxisVideoLernStand";
const id = "werkstatt-falzziegel-schnitt";
const clip: PraxisVideo = { ...getPraxisVideo(id, 1)!, version: 2, lernpunkte: [{ id: `${id}-mitmachen`, kapitelId: "schritt-2", einheitId: id, aufgabeId: `${id}-a` }] };
beforeEach(() => appStorage.clear());
describe("Video-Lernstand je Werkstattversuch und Inhaltsfassung", () => {
  it("erhält offene Mitmachpunkte und trennt einen neuen Werkstattversuch", () => {
    const s = neuerPraxisVideoLernStand("werkstatt-a", clip);
    expect(s.modus).toBe("anschauen");
    s.modus = "mitmachen"; s.aktivLernpunktId = `${id}-mitmachen`;
    const gespeichert = speicherePraxisVideoLernStand(s);
    expect(ladePraxisVideoLernStand("werkstatt-a", clip)).toEqual(gespeichert);
    expect(ladePraxisVideoLernStand("werkstatt-b", clip).aktivLernpunktId).toBeNull();
    expect(offenerPraxisVideoLernStand("werkstatt-a", id)?.aktivLernpunktId).toBe(s.aktivLernpunktId);
    expect(offenerPraxisVideoLernStand("werkstatt-b", id)).toBeUndefined();
  });
  it("akzeptiert nur passende Sicherungsschlüssel und zugehörige Lernpunkte", () => {
    const s = neuerPraxisVideoLernStand("werkstatt-a", clip), key = praxisVideoLernStandKey(s.versuchId, s.videoId, s.videoVersion);
    expect(istPraxisVideoLernStaende({ [key]: s })).toBe(true);
    expect(istPraxisVideoLernStaende({ fremd: s })).toBe(false);
    expect(istPraxisVideoLernStaende({ [key]: { ...s, aktivLernpunktId: "anderer-punkt" } })).toBe(false);
    expect(istPraxisVideoLernStaende({ [key]: { ...s, videoVersion: 1 } })).toBe(false);
    expect(istPraxisVideoLernStaende({ [key]: { ...s, lernpunkte: { "anderer-punkt": "bearbeitet" } } })).toBe(false);
  });
  it("erhält einen beschädigten Stand und blockiert ein stilles Überschreiben", () => {
    appStorage.setItem(praxisVideoLernStaendeKey, "nicht-lesbar");
    expect(() => ladePraxisVideoLernStand("werkstatt-a", clip)).toThrow(/bleibt/);
    expect(() => speicherePraxisVideoLernStand(neuerPraxisVideoLernStand("werkstatt-a", clip))).toThrow();
    expect(appStorage.getItem(praxisVideoLernStaendeKey)).toBe("nicht-lesbar");
    expect(offenerPraxisVideoLernStand("werkstatt-a", id)).toBeUndefined();
  });
});
