import { describe, expect, it, vi } from "vitest";
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Object3D, Texture, Vector3 } from "three";
import { dachKameraAbstand, dachRessource, detailVonObjekt, entsorgeDachModell, gueltigerOrbit, hatSichtbareDachGeometrie, konfiguriereDachModell, vorbereiteDachModell, wasserPunkte } from "@/components/dach3d/dach3dScene";

function scene() {
  const root = new Group();
  const timber = new Mesh(new BoxGeometry(2, 1, 3), new MeshStandardMaterial());
  timber.position.set(4, 2, -3); timber.userData = { layer: "tragwerk", montage_step: 0 };
  const tile = new Mesh(new BoxGeometry(2.2, .15, 3.2), new MeshStandardMaterial());
  tile.position.set(4, 2.7, -3); tile.userData = { layer: "deckung", montage_step: 3, detail_id: "s02" };
  root.add(timber, tile);
  return { root, timber, tile, basis: vorbereiteDachModell(root) };
}
describe("Dachmodell: echte Geometrie, Schichten und sichere Bedienung", () => {
  it("lädt nur eingebettete Bilder und ausdrücklich verzeichnete eigene Medien", () => {
    const origin = "https://dach.example", url = "/dach-medien/v1/steildach-falzziegel/s03/modell.glb", urls = new Set([url]);
    expect(dachRessource(url, origin, urls)).toBe(origin + url);
    expect(dachRessource("data:image/png;base64,AA==", origin, urls)).toBe("data:image/png;base64,AA==");
    expect(dachRessource("blob:https://dach.example/123", origin, urls)).toBe("blob:https://dach.example/123");
    for (const value of ["https://fremd.example" + url, url + "?fremd=1", url + "#bild", "/dach-medien/v1/fremd.png", "blob:https://fremd.example/123", "data:image/svg+xml;base64,PHN2Zz4="]) expect(() => dachRessource(value, origin, urls)).toThrow(/Materialdatei/);
  });
  it("setzt ein versetztes Modell auf den Boden und behält seine Proportionen", () => {
    const { basis, root } = scene();
    expect(basis.bounds.min.y).toBeCloseTo(0);
    expect(basis.center.x).toBeCloseTo(0); expect(basis.center.z).toBeCloseTo(0);
    expect(basis.size.x).toBeCloseTo(2.2); expect(basis.size.z).toBeCloseTo(3.2);
    expect(root.position.toArray().every(Number.isFinite)).toBe(true);
    expect(() => vorbereiteDachModell(new Group())).toThrow(/Geometrie/);
  });
  it("öffnet Schichten ohne kumulatives Verschieben und stellt die Ausgangslage wieder her", () => {
    const { root, tile, timber, basis } = scene(), original = tile.position.clone();
    const config = { schichten: ["deckung", "tragwerk"], ansicht: "aufbau", phase: "aufbau", schritt: 0 };
    konfiguriereDachModell(root, basis, config); const geoeffnet = tile.position.clone();
    expect(geoeffnet.y).toBeGreaterThan(original.y);
    konfiguriereDachModell(root, basis, config); expect(tile.position.equals(geoeffnet)).toBe(true);
    konfiguriereDachModell(root, basis, { ...config, ansicht: "nah", schichten: ["tragwerk"] });
    expect(tile.visible).toBe(false); expect(tile.position.equals(original)).toBe(true); expect(timber.visible).toBe(true);
    konfiguriereDachModell(root, basis, { ...config, ansicht: "nah" }); expect(tile.visible).toBe(true);
  });
  it("zeigt nur bereits montierte Teile und entfernt den Schnitt beim Ansichtswechsel", () => {
    const { root, tile, timber, basis } = scene();
    konfiguriereDachModell(root, basis, { schichten: ["deckung", "tragwerk"], ansicht: "schnitt", phase: "montage", schritt: 2 });
    expect(tile.visible).toBe(false); expect(timber.visible).toBe(true);
    expect((timber.material as MeshStandardMaterial).clippingPlanes).toHaveLength(1);
    konfiguriereDachModell(root, basis, { schichten: ["deckung", "tragwerk"], ansicht: "nah", phase: "montage", schritt: 3 });
    expect(tile.visible).toBe(true); expect((timber.material as MeshStandardMaterial).clippingPlanes).toEqual([]);
  });
  it("verschiebt untergeordnete Schichten nicht zweimal", () => {
    const { root, tile } = scene(), gruppe = new Group();
    root.remove(tile); gruppe.userData.layer = "deckung"; gruppe.add(tile); root.add(gruppe);
    const basis = vorbereiteDachModell(root), original = tile.position.clone();
    konfiguriereDachModell(root, basis, { schichten: ["deckung", "tragwerk"], ansicht: "aufbau", phase: "aufbau", schritt: 0 });
    expect(tile.position.equals(original)).toBe(true); expect(gruppe.position.y).toBeGreaterThan(0);
  });
  it("erkennt bewusst ausgeblendete Bauteile einschließlich verborgener Eltern", () => {
    const { root, tile, timber } = scene();
    expect(hatSichtbareDachGeometrie(root)).toBe(true);
    root.visible = false; expect(hatSichtbareDachGeometrie(root)).toBe(false);
    root.visible = true; tile.visible = false; timber.visible = false;
    expect(hatSichtbareDachGeometrie(root)).toBe(false);
  });
  it("öffnet nur bekannte, für die aktuelle Dachform erlaubte Bauteile", () => {
    const parent = new Group(), face = new Object3D(); parent.add(face); parent.userData.detail_id = "s04";
    expect(detailVonObjekt(face, ["s04"])).toBe("s04"); expect(detailVonObjekt(face, ["w01"])).toBeNull();
    parent.userData.detail_id = "javascript:alert(1)"; expect(detailVonObjekt(face, ["javascript:alert(1)"])).toBeNull();
    expect(detailVonObjekt(null, ["s04"])).toBeNull();
  });
  it("ordnet Wasserpunkte nach dem gespeicherten Wasserweg statt der Dateireihenfolge", () => {
    const root = new Group(); root.position.x = 3;
    for (const nr of [4, 1, 0]) { const p = new Object3D(); p.userData.water_step = nr; p.position.set(nr, 2, 0); root.add(p); }
    root.updateMatrixWorld(true);
    expect(wasserPunkte(root).map(p => p.toArray())).toEqual([[3, 2, 0], [4, 2, 0], [7, 2, 0]]);
  });
  it("weist ungültige und richtungslose Kamerastände zurück", () => {
    expect(gueltigerOrbit({ position: [5, 3, 2], target: [0, 1, 0] })).toBe(true);
    for (const v of [null, {}, { position: [NaN, 0, 0], target: [0, 0, 0] }, { position: [1001, 0, 0], target: [0, 0, 0] }, { position: [1, 2, 3], target: [1, 2, 3] }, { position: [1, 2], target: [0, 0, 0] }]) expect(gueltigerOrbit(v)).toBe(false);
  });
  it("hält auch lange diagonale Bauteile im Hoch- und Querformat vollständig im Bild", () => {
    const size = new Vector3(2.2, 2.7, 1.9), radius = size.length() / 2, halfY = 43 * Math.PI / 360;
    for (const aspect of [.5, .9, 1, 1.8]) {
      const distance = dachKameraAbstand(size, 43, aspect), halfX = Math.atan(Math.tan(halfY) * aspect);
      expect(Math.asin(radius / distance)).toBeLessThan(Math.min(halfX, halfY));
    }
    expect(dachKameraAbstand(size, 43, .5)).toBeGreaterThan(dachKameraAbstand(size, 43, 1.8));
  });
  it("gibt geteilte Geometrien, Materialien und Texturen beim Dachwechsel genau einmal frei", () => {
    const root = new Group(), geometry = new BoxGeometry(), texture = new Texture(), material = new MeshStandardMaterial({ map: texture, normalMap: texture });
    root.add(new Mesh(geometry, material), new Mesh(geometry, [material, material]));
    const g = vi.spyOn(geometry, "dispose"), m = vi.spyOn(material, "dispose"), t = vi.spyOn(texture, "dispose");
    entsorgeDachModell(root);
    expect(g).toHaveBeenCalledOnce(); expect(m).toHaveBeenCalledOnce(); expect(t).toHaveBeenCalledOnce();
  });
  it("schließt gemeinsam verwendete ImageBitmap-Quellen genau einmal", () => {
    const bild = { close: vi.fn() }, a = new Texture(), b = new Texture();
    a.source.data = bild; b.source.data = bild;
    const root = new Mesh(new BoxGeometry(), new MeshStandardMaterial({ map: a, normalMap: b }));
    entsorgeDachModell(root);
    expect(bild.close).toHaveBeenCalledOnce();
  });
});
