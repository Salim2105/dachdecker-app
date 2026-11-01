import { describe, expect, it } from "vitest";
import { dachDeckung, dachMedien, dachPakete, dachVariante, istDachMedienPfad, istDachMedienRef, istMedienAsset } from "@/lib/dach3dMedien";

describe("Feste, versionierte und passive Dachmedien", () => {
  it("unterscheidet die tatsächlichen Deckungen und führt gültige Detailansichten zur passenden Variante", () => {
    expect(dachDeckung("flachdach", "falzziegel")).toBe("warmdach");
    expect(dachVariante("walmdach", "biber-doppel")).toBe("walmdach-biber-doppel");
    const m = dachMedien("steildach", "biber-doppel", "s04");
    expect(m.version).toBe(2);
    expect(m.modell?.url).toBe("/dach-medien/v2/steildach-biber-doppel/s04/modell.glb");
    expect(m.bilder.schnitt).toBe("/dach-vorschau/v2/steildach-biber-doppel/s04-schnitt.webp");
    expect(m.fehler).toBe("/dach-vorschau/v2/steildach-biber-doppel/s04-fehler.webp");
    expect(() => dachMedien("walmdach", "falzziegel", "s04")).toThrow(/andere/);
  });
  it.each(["https://fremd.example/a.glb", "//fremd/a.webp", "steildach-falzziegel/../privat.webp", "steildach-falzziegel/%2e%2e/a.webp", "steildach-falzziegel/a.svg", "steildach-falzziegel/a.js", "steildach-falzziegel/a.glb?x=1", "fremdes-dach/a.glb", "v2/steildach-falzziegel/../privat.webp", "v3/steildach-falzziegel/modell.glb", "gemeinsam/licht.hdr", "v2/steildach-falzziegel/licht.hdr"])("weist unzulässigen Pfad %s ab", id => expect(istDachMedienPfad(id)).toBe(false));
  it("führt alte und neue Pakete mit einer gemeinsamen, lokal ausgelieferten Lichtumgebung", () => {
    for (const p of dachPakete()) {
      expect(p.assets.some(a => a.id.startsWith(`${p.id}-`))).toBe(true);
      expect(p.assets.some(a => a.id.startsWith(`v2/${p.id}-`))).toBe(true);
      const umgebung = p.assets.find(a => a.id === "v2/gemeinsam/royal_esplanade_1k.hdr");
      expect(umgebung).toMatchObject({ typ: "umgebung", url: "/dach-medien/v2/gemeinsam/royal_esplanade_1k.hdr" });
      expect(istMedienAsset(umgebung)).toBe(true);
      expect(istMedienAsset({ ...umgebung, typ: "bild" })).toBe(false);
      expect(istMedienAsset({ ...umgebung, url: "https://fremd.example/licht.hdr" })).toBe(false);
      expect(p.bytes).toBe(p.assets.reduce((sum, a) => sum + a.bytes, 0));
    }
  });
  it("nimmt nur vollständige lokale Metadaten und vorhandene fachliche Detailverweise an", () => {
    const id = "steildach-falzziegel/s03/modell.glb", a = { id, url: `/dach-medien/v1/${id}`, bytes: 10, sha256: "a".repeat(64), typ: "modell" };
    expect(istMedienAsset(a)).toBe(true);
    expect(istMedienAsset({ ...a, sha256: "falsch" })).toBe(false);
    expect(istMedienAsset({ ...a, bytes: 0 })).toBe(false);
    expect(istMedienAsset({ ...a, typ: "bild" })).toBe(false);
    expect(istMedienAsset({ ...a, url: "https://fremd.example/modell.glb" })).toBe(false);
    const ref = { version: 1, form: "walmdach", deckung: "biber-doppel", detailId: "w01", ansicht: "nah" };
    expect(istDachMedienRef(ref)).toBe(true);
    expect(istDachMedienRef({ ...ref, version: 2 })).toBe(true);
    expect(istDachMedienRef({ ...ref, version: 3 })).toBe(false);
    expect(istDachMedienRef({ ...ref, detailId: "s04" })).toBe(false);
    expect(istDachMedienRef({ ...ref, deckung: "warmdach" })).toBe(false);
    expect(istDachMedienRef({ ...ref, ansicht: "fehler" })).toBe(false);
  });
});
