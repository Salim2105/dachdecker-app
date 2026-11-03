import { istPraxisVideoPaket, istPraxisVideoPaketId } from "@/lib/praxisVideoMedien";
import type { PraxisVideoAsset, PraxisVideoPaket } from "@/lib/praxisVideoTypen";

/** Public, reproducible downloads are deliberately outside the private ZIP store. */
export const PRAXIS_VIDEO_CACHE = "dachdecker-praxisvideos-v1";
export const PRAXIS_VIDEO_INDEX_CACHE = "dachdecker-praxisvideos-index-v1";
const STAGING_PREFIX = "dachdecker-praxisvideos-staging-v1-";
const STAGING_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_STAGING_CLEANUP = 64;
const listeners = new Set<() => void>();
export const subscribePraxisVideoDownloads = (listener: () => void): (() => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const melden = () => listeners.forEach(f => f());
const inArbeit = new Set<string>();
export interface PraxisVideoDownloadFortschritt { geladen: number; gesamt: number; dateien: number; gesamtDateien: number }
export interface PraxisVideoPaketStatus { status: "fehlt" | "gespeichert" | "aelter"; bytes: number; am?: number }
export interface PraxisVideoLoeschErgebnis { speicherFreigegeben: boolean }
interface PaketMarker { version: 1; id: string; am: number; assets: PraxisVideoAsset[] }
const markerKey = (id: string) => `/praxisvideos/_pakete/${id}.json`;
export const praxisVideoAssetCacheKey = (sha256: string) => `/praxisvideos/_inhalt/${sha256}`;
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
function cacheStorage(): CacheStorage {
  if (typeof caches === "undefined") throw new Error("Offline-Medien können in diesem Browser nicht gespeichert werden. Die Lerntexte und festen Ansichten bleiben verfügbar.");
  return caches;
}
function validPaket(p: PraxisVideoPaket): boolean { return istPraxisVideoPaket(p); }
function validMarker(v: unknown): v is PaketMarker {
  return obj(v) && v.version === 1 && istPraxisVideoPaketId(v.id) && typeof v.am === "number" && Number.isFinite(v.am) && v.am >= 0 &&
    istPraxisVideoPaket({ ...v, titel: "Gespeichertes Videopaket", bytes: Array.isArray(v.assets) ? v.assets.reduce((sum: number, a: { bytes?: number }) => sum + Number(a?.bytes), 0) : 0 });
}
async function alleMarker(): Promise<PaketMarker[]> {
  const index = await cacheStorage().open(PRAXIS_VIDEO_INDEX_CACHE), ergebnis: PaketMarker[] = [];
  for (const request of await index.keys()) {
    const path = new URL(request.url, "https://dach.local").pathname;
    const id = path.match(/^\/praxisvideos\/_pakete\/([a-z0-9-]+)\.json$/)?.[1];
    if (!id || !istPraxisVideoPaketId(id)) continue;
    const m = await marker(id); if (m) ergebnis.push(m);
  }
  return ergebnis;
}
async function marker(id: string): Promise<PaketMarker | null> {
  const index = await cacheStorage().open(PRAXIS_VIDEO_INDEX_CACHE);
  const response = await index.match(markerKey(id));
  if (!response) return null;
  try { const data: unknown = await response.json(); return validMarker(data) && data.id === id ? data : null; }
  catch { return null; }
}
function identisch(a: PraxisVideoAsset[], b: PraxisVideoAsset[]): boolean {
  const sort = (werte: PraxisVideoAsset[]) => [...werte].map(v => `${v.id}:${v.sha256}:${v.bytes}`).sort();
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
    const zeit = /^(\d{13,16})-(?:clip|dach)-[a-z0-9-]+$/.exec(name.slice(STAGING_PREFIX.length));
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
  for (const m of await alleMarker()) {
    for (const a of m.assets) behalten.add(praxisVideoAssetCacheKey(a.sha256));
  }
  const cache = await cs.open(PRAXIS_VIDEO_CACHE);
  for (const pfad of kopiert) if (!behalten.has(pfad)) await cache.delete(pfad);
}
export async function praxisVideoPaketStatus(paket: PraxisVideoPaket): Promise<PraxisVideoPaketStatus> {
  if (!istPraxisVideoPaketId(paket.id)) throw new Error("Dieses Videopaket ist nicht bekannt.");
  const alt = await marker(paket.id);
  if (!alt) return { status: "fehlt", bytes: 0 };
  const cache = await cacheStorage().open(PRAXIS_VIDEO_CACHE);
  const vorhanden = await Promise.all(alt.assets.map(a => cache.match(praxisVideoAssetCacheKey(a.sha256))));
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
async function lesen(response: Response, asset: PraxisVideoAsset, signal: AbortSignal | undefined, onBytes: (n: number) => void): Promise<Uint8Array> {
  const ablehnen = async (nachricht: string): Promise<never> => {
    await response.body?.cancel().catch(() => {});
    throw new Error(nachricht);
  };
  // A range response can contain the expected bytes and still be an incomplete
  // representation. Downloads always require a complete 200 response.
  if (response.status !== 200 || response.type === "opaque" || response.redirected || response.headers.has("Content-Range")) {
    return ablehnen(`Die Mediendatei „${asset.id}“ konnte nicht vollständig geladen werden.`);
  }
  const laenge = response.headers.get("Content-Length"), kodierung = response.headers.get("Content-Encoding");
  // Fetch exposes decoded bytes. A compressed response's Content-Length refers
  // to its wire representation, so only compare unencoded lengths here.
  if (laenge !== null && (!/^\d+$/.test(laenge) || !Number.isSafeInteger(Number(laenge)) ||
      (!kodierung || kodierung === "identity") && Number(laenge) !== asset.bytes)) {
    return ablehnen("Die heruntergeladene Mediendatei entspricht nicht der angegebenen Größe.");
  }
  // Never fall back to an unbounded arrayBuffer allocation. All supported
  // download browsers expose a readable stream; a null body is empty.
  if (!response.body) return ablehnen("Die heruntergeladene Mediendatei ist unvollständig.");
  const reader = response.body.getReader(), teile: Uint8Array[] = []; let anzahl = 0;
  const abbrechen = () => { void reader.cancel().catch(() => {}); };
  signal?.addEventListener("abort", abbrechen, { once: true });
  try {
    while (true) {
      abbruch(signal);
      const { done, value } = await reader.read();
      abbruch(signal);
      if (done) break;
      anzahl += value.byteLength;
      if (anzahl > asset.bytes) throw new Error("Die heruntergeladene Mediendatei entspricht nicht der angegebenen Größe.");
      teile.push(value); onBytes(value.byteLength);
    }
  } catch (error) { await reader.cancel().catch(() => {}); throw error; }
  finally { signal?.removeEventListener("abort", abbrechen); reader.releaseLock(); }
  if (anzahl !== asset.bytes) throw new Error("Die heruntergeladene Mediendatei ist unvollständig.");
  const bytes = new Uint8Array(anzahl); let offset = 0;
  for (const teil of teile) { bytes.set(teil, offset); offset += teil.byteLength; }
  return bytes;
}
/** Content-addressed writes never replace the bytes of a previously valid package. */
export async function ladePraxisVideoPaket(paket: PraxisVideoPaket, options: { signal?: AbortSignal; onProgress?: (p: PraxisVideoDownloadFortschritt) => void } = {}): Promise<void> {
  if (!validPaket(paket)) throw new Error("Dieses Videopaket ist noch nicht vollständig verfügbar.");
  paket = { ...paket, assets: paket.assets.map(a => ({ ...a })) };
  const cs = cacheStorage();
  if (inArbeit.size) throw new Error("Ein Videopaket wird bereits heruntergeladen. Bitte diesen Vorgang zuerst abschließen.");
  const stageName = `${STAGING_PREFIX}${Date.now()}-${paket.id}-${globalThis.crypto.randomUUID()}`;
  inArbeit.add(paket.id); melden();
  const fortschritt: PraxisVideoDownloadFortschritt = { geladen: 0, gesamt: paket.bytes, dateien: 0, gesamtDateien: paket.assets.length };
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
      void navigator.locks.request("dachdecker-praxisvideos-download", { ifAvailable: true }, async lock => {
        acquired(!!lock); if (lock) await hold;
      }).catch(() => acquired(false));
      if (!await ready) throw new Error("In einem anderen Fenster werden Praxisvideos geändert. Bitte dort zuerst den Vorgang abschließen.");
      exklusiv = true;
    }
    abbruch(options.signal); publish();
    await alteZwischenspeicherEntfernen(cs, exklusiv, stageName);
    const cache = await cs.open(PRAXIS_VIDEO_CACHE), stage = await cs.open(stageName);
    for (const asset of paket.assets) {
      abbruch(options.signal);
      const cacheKey = praxisVideoAssetCacheKey(asset.sha256);
      if (await cache.match(cacheKey) || await stage.match(cacheKey)) fortschritt.geladen += asset.bytes;
      else {
        const response = await fetch(asset.url, { signal: options.signal, credentials: "same-origin", cache: "no-store", redirect: "error" });
        const bytes = await lesen(response, asset, options.signal, n => { fortschritt.geladen += n; publish(); });
        if (await sha256(bytes) !== asset.sha256) throw new Error("Die heruntergeladene Mediendatei hat eine abweichende Prüfsumme. Das bisherige Paket bleibt erhalten.");
        abbruch(options.signal);
        await stage.put(cacheKey, new Response(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer, { headers: { "Content-Type": asset.typ === "video" ? "video/mp4" : asset.typ === "untertitel" ? "text/vtt; charset=utf-8" : "image/webp", "Content-Length": String(asset.bytes), "X-Praxisvideo-Sha256": asset.sha256 } }));
      }
      fortschritt.dateien++; publish();
    }
    abbruch(options.signal);
    for (const request of await stage.keys()) {
      abbruch(options.signal);
      const response = await stage.match(request);
      if (!response) throw new Error("Ein Zwischenspeicher ist nicht vollständig. Bitte den Download erneut starten.");
      const pfad = new URL(request.url).pathname;
      const vorher = await cache.match(request);
      await cache.put(request, response);
      if (!vorher) kopiert.add(pfad);
    }
    abbruch(options.signal);
    const index = await cs.open(PRAXIS_VIDEO_INDEX_CACHE);
    abbruch(options.signal);
    const neu: PaketMarker = { version: 1, id: paket.id, am: Date.now(), assets: paket.assets };
    await index.put(markerKey(paket.id), new Response(JSON.stringify(neu), { headers: { "Content-Type": "application/json" } }));
    melden();
  } catch (error) {
    // Without a global lock another tab may currently depend on these bytes
    // before committing its marker. Leave them for a later explicit deletion.
    if (exklusiv) await verwaisteKopienEntfernen(cs, kopiert).catch(() => {});
    if (error instanceof DOMException && error.name === "QuotaExceededError") throw new Error("Der Gerätespeicher reicht für dieses Videopaket nicht aus. Entferne ein anderes Medienpaket oder gib Speicher frei. Lernstände und bisher vollständige Pakete bleiben erhalten.");
    throw error;
  } finally {
    await cs.delete(stageName).catch(() => {}); release?.(); inArbeit.delete(paket.id); melden();
  }
}
export async function loeschePraxisVideoPaket(paket: PraxisVideoPaket): Promise<PraxisVideoLoeschErgebnis> {
  if (!istPraxisVideoPaketId(paket.id)) throw new Error("Dieses Videopaket ist nicht bekannt.");
  if (inArbeit.size) throw new Error("Warte bitte, bis der laufende Download beendet oder abgebrochen ist.");
  inArbeit.add(paket.id);
  const loeschen = async (exklusiv: boolean): Promise<PraxisVideoLoeschErgebnis> => {
    const cs = cacheStorage(), index = await cs.open(PRAXIS_VIDEO_INDEX_CACHE);
    await alteZwischenspeicherEntfernen(cs, exklusiv);
    // Removing the marker first leaves all other packages independently valid.
    await index.delete(markerKey(paket.id));
    // Without Web Locks a different tab may have copied content and not yet
    // committed its marker. Preserve those bytes until a later locked cleanup.
    if (!exklusiv) { melden(); return { speicherFreigegeben: false }; }
    const behalten = new Set<string>();
    for (const m of await alleMarker()) for (const a of m.assets) behalten.add(a.sha256);
    const cache = await cs.open(PRAXIS_VIDEO_CACHE);
    for (const request of await cache.keys()) {
      const hash = new URL(request.url, typeof location === "undefined" ? "https://dach.local" : location.origin).pathname.split("/").at(-1)!;
      if (!behalten.has(hash)) await cache.delete(request);
    }
    melden();
    return { speicherFreigegeben: true };
  };
  try {
    if (typeof navigator !== "undefined" && navigator.locks) return await navigator.locks.request("dachdecker-praxisvideos-download", { ifAvailable: true }, async lock => {
      if (!lock) throw new Error("In einem anderen Fenster werden Praxisvideos geändert. Bitte dort zuerst den Vorgang abschließen.");
      return loeschen(true);
    });
    return await loeschen(false);
  } finally { inArbeit.delete(paket.id); melden(); }
}
