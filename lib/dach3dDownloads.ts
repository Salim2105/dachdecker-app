import { DACH_FORMEN, gehoertDachAssetZu, istMedienAsset, type DachPaket } from "@/lib/dach3dMedien";
import type { MedienAsset } from "@/lib/dach3dTypen";

/** Public, reproducible downloads are deliberately outside the private ZIP store. */
export const DACH_MEDIEN_CACHE = "dachdecker-medien-v1";
export const DACH_MEDIEN_INDEX_CACHE = "dachdecker-medien-index-v1";
const STAGING_PREFIX = "dachdecker-medien-staging-v1-";
const STAGING_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_STAGING_CLEANUP = 64;
const listeners = new Set<() => void>();
export const subscribeDachDownloads = (listener: () => void): (() => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const melden = () => listeners.forEach(f => f());
const inArbeit = new Set<string>();
export interface DachDownloadFortschritt { geladen: number; gesamt: number; dateien: number; gesamtDateien: number }
export interface DachPaketStatus { status: "fehlt" | "gespeichert" | "aelter"; bytes: number; am?: number }
interface PaketMarker { version: 1; id: string; am: number; assets: MedienAsset[] }
const markerKey = (id: string) => `/dach-medien/paket-${id}.json`;
export const dachAssetCacheKey = (sha256: string) => `/dach-medien/_inhalt/${sha256}`;
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
function cacheStorage(): CacheStorage {
  if (typeof caches === "undefined") throw new Error("Offline-Medien können in diesem Browser nicht gespeichert werden. Die Lerntexte und festen Ansichten bleiben verfügbar.");
  return caches;
}
function validPaket(p: DachPaket): boolean {
  return !!p && DACH_FORMEN.includes(p.id) && typeof p.titel === "string" && Array.isArray(p.assets) && p.assets.length > 0 && p.assets.length < 10000 && p.assets.every(a => istMedienAsset(a) && gehoertDachAssetZu(a.id, p.id)) && new Set(p.assets.map(a => a.id)).size === p.assets.length && p.bytes === p.assets.reduce((s, a) => s + a.bytes, 0);
}
function validMarker(v: unknown): v is PaketMarker {
  return obj(v) && v.version === 1 && DACH_FORMEN.includes(v.id as DachPaket["id"]) && typeof v.am === "number" && Number.isFinite(v.am) && v.am >= 0 && Array.isArray(v.assets) && v.assets.length > 0 && v.assets.length < 10000 && v.assets.every(istMedienAsset) && new Set(v.assets.map(a => a.id)).size === v.assets.length;
}
async function marker(id: string): Promise<PaketMarker | null> {
  const index = await cacheStorage().open(DACH_MEDIEN_INDEX_CACHE);
  const response = await index.match(markerKey(id));
  if (!response) return null;
  try { const data: unknown = await response.json(); return validMarker(data) && data.id === id ? data : null; }
  catch { return null; }
}
function identisch(a: MedienAsset[], b: MedienAsset[]): boolean {
  const sort = (werte: MedienAsset[]) => [...werte].map(v => `${v.id}:${v.sha256}:${v.bytes}`).sort();
  return JSON.stringify(sort(a)) === JSON.stringify(sort(b));
}
/** A closed/crashed tab cannot run finally. Under the shared lock no other
 * participating tab owns staging data. Without Web Locks we only expire named
 * day-old stages, retaining recent/unknown stages that may still be in use. */
async function alteZwischenspeicherEntfernen(cs: CacheStorage, exklusiv: boolean, eigenerStage?: string): Promise<void> {
  const jetzt = Date.now();
  const kandidaten = (await cs.keys()).filter(name => {
    if (!name.startsWith(STAGING_PREFIX) || name === eigenerStage) return false;
    if (exklusiv) return true;
    const zeit = /^(\d{13,16})-(?:steildach|walmdach|flachdach)-[a-f0-9-]+$/.exec(name.slice(STAGING_PREFIX.length));
    const erstellt = zeit ? Number(zeit[1]) : NaN;
    return Number.isSafeInteger(erstellt) && erstellt >= 0 && jetzt - erstellt > STAGING_TTL_MS;
  }).slice(0, MAX_STAGING_CLEANUP);
  for (const name of kandidaten) await cs.delete(name);
}
/** Only roll back bytes first copied by this failed transaction. Never sweep
 * older complete packages or another roof's content-addressed shared files. */
async function verwaisteKopienEntfernen(cs: CacheStorage, kopiert: Set<string>): Promise<void> {
  if (!kopiert.size) return;
  const behalten = new Set<string>();
  for (const id of DACH_FORMEN) {
    const m = await marker(id);
    for (const a of m?.assets ?? []) behalten.add(dachAssetCacheKey(a.sha256));
  }
  const cache = await cs.open(DACH_MEDIEN_CACHE);
  for (const pfad of kopiert) if (!behalten.has(pfad)) await cache.delete(pfad);
}
export async function dachPaketStatus(paket: DachPaket): Promise<DachPaketStatus> {
  const alt = await marker(paket.id);
  if (!alt) return { status: "fehlt", bytes: 0 };
  const cache = await cacheStorage().open(DACH_MEDIEN_CACHE);
  const vorhanden = await Promise.all(alt.assets.map(a => cache.match(dachAssetCacheKey(a.sha256))));
  if (vorhanden.some(a => !a)) return { status: "fehlt", bytes: 0 };
  return { status: identisch(alt.assets, paket.assets) ? "gespeichert" : "aelter", bytes: alt.assets.reduce((s, a) => s + a.bytes, 0), am: alt.am };
}
function abbruch(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("Der Download wurde abgebrochen. Ein zuvor gespeichertes Paket bleibt verfügbar.", "AbortError");
}
async function sha256(bytes: Uint8Array): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error("Die Medienprüfung benötigt einen sicheren Browserzugriff. Bitte die HTTPS-Website oder die Mac-App verwenden.");
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}
async function lesen(response: Response, asset: MedienAsset, signal: AbortSignal | undefined, onBytes: (n: number) => void): Promise<Uint8Array> {
  if (!response.ok || response.type === "opaque" || response.redirected) throw new Error(`Die Mediendatei „${asset.id}“ konnte nicht geladen werden.`);
  if (!response.body) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength !== asset.bytes) throw new Error("Die heruntergeladene Mediendatei ist unvollständig.");
    onBytes(bytes.byteLength); return bytes;
  }
  const reader = response.body.getReader(), teile: Uint8Array[] = []; let anzahl = 0;
  try {
    while (true) {
      abbruch(signal);
      const { done, value } = await reader.read();
      if (done) break;
      anzahl += value.byteLength;
      if (anzahl > asset.bytes) throw new Error("Die heruntergeladene Mediendatei entspricht nicht der angegebenen Größe.");
      teile.push(value); onBytes(value.byteLength);
    }
  } catch (error) { await reader.cancel().catch(() => {}); throw error; }
  if (anzahl !== asset.bytes) throw new Error("Die heruntergeladene Mediendatei ist unvollständig.");
  const bytes = new Uint8Array(anzahl); let offset = 0;
  for (const teil of teile) { bytes.set(teil, offset); offset += teil.byteLength; }
  return bytes;
}
/** Content-addressed writes never replace the bytes of a previously valid package. */
export async function ladeDachPaket(paket: DachPaket, options: { signal?: AbortSignal; onProgress?: (p: DachDownloadFortschritt) => void } = {}): Promise<void> {
  if (!validPaket(paket)) throw new Error("Dieses Dachpaket ist noch nicht vollständig verfügbar.");
  const cs = cacheStorage();
  if (inArbeit.size) throw new Error("Ein Dachpaket wird bereits heruntergeladen. Bitte diesen Vorgang zuerst abschließen.");
  const stageName = `${STAGING_PREFIX}${Date.now()}-${paket.id}-${globalThis.crypto.randomUUID()}`;
  inArbeit.add(paket.id); melden();
  const fortschritt: DachDownloadFortschritt = { geladen: 0, gesamt: paket.bytes, dateien: 0, gesamtDateien: paket.assets.length };
  const publish = () => options.onProgress?.({ ...fortschritt });
  let release: (() => void) | undefined;
  let exklusiv = false;
  const kopiert = new Set<string>();
  try {
    // Another tab must not commit a package marker concurrently with deletion.
    if (typeof navigator !== "undefined" && navigator.locks) {
      let acquired!: (ok: boolean) => void;
      const ready = new Promise<boolean>(resolve => { acquired = resolve; });
      const hold = new Promise<void>(resolve => { release = resolve; });
      void navigator.locks.request("dachdecker-medien-download", { ifAvailable: true }, async lock => {
        acquired(!!lock); if (lock) await hold;
      }).catch(() => acquired(false));
      if (!await ready) throw new Error("In einem anderen Fenster werden Dachmedien geändert. Bitte dort zuerst den Vorgang abschließen.");
      exklusiv = true;
    }
    abbruch(options.signal); publish();
    await alteZwischenspeicherEntfernen(cs, exklusiv, stageName);
    const cache = await cs.open(DACH_MEDIEN_CACHE), stage = await cs.open(stageName);
    for (const asset of paket.assets) {
      abbruch(options.signal);
      const cacheKey = dachAssetCacheKey(asset.sha256);
      if (await cache.match(cacheKey) || await stage.match(cacheKey)) fortschritt.geladen += asset.bytes;
      else {
        const response = await fetch(asset.url, { signal: options.signal, credentials: "same-origin", cache: "no-store", redirect: "error" });
        const bytes = await lesen(response, asset, options.signal, n => { fortschritt.geladen += n; publish(); });
        if (await sha256(bytes) !== asset.sha256) throw new Error("Die heruntergeladene Mediendatei hat eine abweichende Prüfsumme. Das bisherige Paket bleibt erhalten.");
        await stage.put(cacheKey, new Response(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer, { headers: { "Content-Type": asset.typ === "modell" ? "model/gltf-binary" : asset.typ === "umgebung" ? "image/vnd.radiance" : response.headers.get("Content-Type") ?? "image/webp", "Content-Length": String(asset.bytes), "X-Dach-Sha256": asset.sha256 } }));
      }
      fortschritt.dateien++; publish();
    }
    abbruch(options.signal);
    for (const request of await stage.keys()) {
      const response = await stage.match(request);
      if (!response) throw new Error("Ein Zwischenspeicher ist nicht vollständig. Bitte den Download erneut starten.");
      const pfad = new URL(request.url).pathname;
      const vorher = await cache.match(request);
      await cache.put(request, response);
      if (!vorher) kopiert.add(pfad);
    }
    abbruch(options.signal);
    const index = await cs.open(DACH_MEDIEN_INDEX_CACHE);
    const neu: PaketMarker = { version: 1, id: paket.id, am: Date.now(), assets: paket.assets };
    await index.put(markerKey(paket.id), new Response(JSON.stringify(neu), { headers: { "Content-Type": "application/json" } }));
    melden();
  } catch (error) {
    // Without a global lock another tab may currently depend on these bytes
    // before committing its marker. Leave them for a later explicit deletion.
    if (exklusiv) await verwaisteKopienEntfernen(cs, kopiert).catch(() => {});
    if (error instanceof DOMException && error.name === "QuotaExceededError") throw new Error("Der Gerätespeicher reicht für dieses Dachpaket nicht aus. Entferne ein anderes Medienpaket oder gib Speicher frei. Lernstände und bisher vollständige Pakete bleiben erhalten.");
    throw error;
  } finally {
    await cs.delete(stageName).catch(() => {}); release?.(); inArbeit.delete(paket.id); melden();
  }
}
export async function loescheDachPaket(paket: DachPaket): Promise<void> {
  if (!DACH_FORMEN.includes(paket.id)) throw new Error("Dieses Dachpaket ist nicht bekannt.");
  if (inArbeit.size) throw new Error("Warte bitte, bis der laufende Download beendet oder abgebrochen ist.");
  inArbeit.add(paket.id);
  const loeschen = async (exklusiv: boolean) => {
    const cs = cacheStorage(), index = await cs.open(DACH_MEDIEN_INDEX_CACHE);
    await alteZwischenspeicherEntfernen(cs, exklusiv);
    // Removing the marker first leaves all other packages independently valid.
    await index.delete(markerKey(paket.id));
    const behalten = new Set<string>();
    for (const id of DACH_FORMEN) { const m = await marker(id); for (const a of m?.assets ?? []) behalten.add(a.sha256); }
    const cache = await cs.open(DACH_MEDIEN_CACHE);
    for (const request of await cache.keys()) {
      const hash = new URL(request.url, typeof location === "undefined" ? "https://dach.local" : location.origin).pathname.split("/").at(-1)!;
      if (!behalten.has(hash)) await cache.delete(request);
    }
    melden();
  };
  try {
    if (typeof navigator !== "undefined" && navigator.locks) await navigator.locks.request("dachdecker-medien-download", { ifAvailable: true }, async lock => {
      if (!lock) throw new Error("In einem anderen Fenster werden Dachmedien geändert. Bitte dort zuerst den Vorgang abschließen.");
      await loeschen(true);
    });
    else await loeschen(false);
  } finally { inArbeit.delete(paket.id); melden(); }
}
