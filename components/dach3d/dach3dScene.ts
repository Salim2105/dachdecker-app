import { Box3, Material, Mesh, Object3D, Plane, Texture, Vector3 } from "three";

export const DACH_SCHICHTEN = ["deckung", "lattung", "zusatzebene", "daemmung", "luftdichtheit", "tragwerk"] as const;
const schichten = new Set<string>(DACH_SCHICHTEN);
const idMuster = /^(?:g0[1-6]|s(?:0[1-9]|1[01])|w0[1-4]|f0[1-9]|a0[1-4])$/;

/** GLB images may be embedded; all external resources must be authored assets. */
export function dachRessource(value: string, origin: string, erlaubt: ReadonlySet<string>): string {
  if (/^data:image\/(?:png|jpeg|webp);base64,/i.test(value)) return value;
  if (value.startsWith(`blob:${origin}/`)) return value;
  const target = new URL(value, `${origin}/`);
  if (target.origin !== origin || target.search || target.hash || !erlaubt.has(target.pathname)) throw new Error("Das Modell verweist auf eine unbekannte Materialdatei.");
  return target.href;
}

export function detailVonObjekt(object: Object3D | null, erlaubt: readonly string[]): string | null {
  for (let node = object; node; node = node.parent) {
    const id: unknown = node.userData.detail_id;
    if (typeof id === "string" && idMuster.test(id) && erlaubt.includes(id)) return id;
  }
  return null;
}

export function modellMaterialien(root: Object3D): Material[] {
  const alle = new Set<Material>();
  root.traverse(node => {
    if (node instanceof Mesh) for (const mat of Array.isArray(node.material) ? node.material : [node.material]) alle.add(mat);
  });
  return [...alle];
}

export function hatSichtbareDachGeometrie(root: Object3D): boolean {
  let sichtbar = false;
  root.traverseVisible(node => { if (node instanceof Mesh) sichtbar = true; });
  return sichtbar;
}

/** Every parsed model belongs to exactly one active Canvas; there is no shared loader cache. */
export function entsorgeDachModell(root: Object3D): void {
  const geometrien = new Set<Mesh["geometry"]>();
  const texturen = new Set<Texture>();
  const bilder = new Set<{ close: () => void }>();
  root.traverse(node => { if (node instanceof Mesh) geometrien.add(node.geometry); });
  for (const mat of modellMaterialien(root)) {
    for (const value of Object.values(mat)) if (value instanceof Texture) texturen.add(value);
    mat.dispose();
  }
  for (const geo of geometrien) geo.dispose();
  for (const texture of texturen) {
    const quelle: unknown = texture.source.data;
    const images = Array.isArray(quelle) ? quelle : [quelle];
    for (const image of images) if (image && typeof image === "object" && typeof image.close === "function") bilder.add(image);
    texture.dispose();
  }
  // GLTFLoader may own ImageBitmap CPU allocations. Disposing the GPU texture
  // alone does not release those; private scenes never share them with peers.
  for (const image of bilder) image.close();
}

export interface DachSzeneBasis {
  bounds: Box3; center: Vector3; size: Vector3;
  positionen: Map<Object3D, Vector3>; sichtbar: Map<Object3D, boolean>;
}

export function vorbereiteDachModell(root: Object3D): DachSzeneBasis {
  root.updateMatrixWorld(true);
  const box = new Box3().setFromObject(root);
  if (box.isEmpty()) throw new Error("Das Modell enthält keine darstellbare Geometrie.");
  const center = box.getCenter(new Vector3());
  root.position.add(new Vector3(-center.x, -box.min.y, -center.z));
  root.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(root), positionen = new Map<Object3D, Vector3>(), sichtbar = new Map<Object3D, boolean>();
  root.traverse(node => {
    positionen.set(node, node.position.clone()); sichtbar.set(node, node.visible);
    if (node instanceof Mesh) { node.castShadow = true; node.receiveShadow = true; }
  });
  return { bounds, center: bounds.getCenter(new Vector3()), size: bounds.getSize(new Vector3()), positionen, sichtbar };
}

function schichtVorfahre(node: Object3D): boolean {
  for (let n = node.parent; n; n = n.parent) if (schichten.has(String(n.userData.layer))) return true;
  return false;
}

/** Layer changes always start from the original transforms, avoiding cumulative drift. */
export function konfiguriereDachModell(root: Object3D, basis: DachSzeneBasis, config: {
  schichten: readonly string[]; ansicht: string; phase: string; schritt: number;
}): void {
  const sichtbar = new Set(config.schichten);
  for (const [node, pos] of basis.positionen) {
    node.position.copy(pos); node.visible = basis.sichtbar.get(node) ?? true;
    const layer = String(node.userData.layer ?? "");
    if (schichten.has(layer)) {
      node.visible &&= sichtbar.has(layer);
      if (config.ansicht === "aufbau" && !schichtVorfahre(node)) {
        const index = DACH_SCHICHTEN.indexOf(layer as typeof DACH_SCHICHTEN[number]);
        node.position.y += (DACH_SCHICHTEN.length - 1 - index) * Math.max(.035, basis.size.y * .075);
      }
    }
    const schritt: unknown = node.userData.montage_step;
    if (config.phase === "montage" && typeof schritt === "number" && Number.isFinite(schritt)) node.visible &&= schritt <= config.schritt;
  }
  const plane = config.ansicht === "schnitt" ? [new Plane(new Vector3(-1, 0, 0), basis.center.x)] : [];
  for (const mat of modellMaterialien(root)) { mat.clippingPlanes = plane; mat.clipShadows = plane.length > 0; mat.needsUpdate = true; }
  root.updateMatrixWorld(true);
}

export function wasserPunkte(root: Object3D): Vector3[] {
  const punkte: { nr: number; p: Vector3 }[] = [];
  root.traverse(node => {
    const extra: unknown = node.userData.water_step;
    const match = /^Wasser_([0-4])(?:\.\d+)?$/.exec(node.name);
    const nr = typeof extra === "number" ? extra : match ? Number(match[1]) : -1;
    if (Number.isInteger(nr) && nr >= 0 && nr <= 4) punkte.push({ nr, p: node.getWorldPosition(new Vector3()) });
  });
  return [...new Map(punkte.sort((a, b) => a.nr - b.nr).map(x => [x.nr, x.p])).values()];
}

export interface DachOrbit { position: [number, number, number]; target: [number, number, number] }
export function gueltigerOrbit(v: unknown): v is DachOrbit {
  if (!v || typeof v !== "object") return false;
  const a = v as Record<string, unknown>;
  if (![a.position, a.target].every(x => Array.isArray(x) && x.length === 3 && x.every(n => typeof n === "number" && Number.isFinite(n) && Math.abs(n) <= 1000))) return false;
  const position = a.position as number[], target = a.target as number[];
  // A camera at its own target has no viewing direction. Reject it before
  // passing imported positions into OrbitControls.
  return position.some((value, index) => Math.abs(value - target[index]) > .000001);
}
