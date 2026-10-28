/** A synchronous view of strings, backed by transactional IndexedDB writes.
 * The shell waits for initializeStorage before mounting features. Old browsers
 * retain localStorage for strings; photos require durable IndexedDB storage.
 */
export const STORAGE_DATABASE = "dachdecker-lernwerkstatt";
export type StorageStatus = Readonly<{
  phase: "idle" | "loading" | "ready" | "error";
  backend: "local" | "indexeddb";
  error: string | null;
  pending: number;
}>;
export interface StorageSnapshot { daten: Record<string, string>; dateien: Map<string, Blob> }

let status: StorageStatus = { phase: "idle", backend: "local", error: null, pending: 0 };
const listeners = new Set<() => void>();
let database: IDBDatabase | null = null;
let initialization: Promise<void> | null = null;
let cache = new Map<string, string>();
let queue: Promise<unknown> = Promise.resolve();
let sequence = 0;
const dirty = new Map<string, { value: string | null; sequence: number }>();

export function getStorageStatus(): StorageStatus { return status; }
export function subscribeStorageStatus(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
function publish(change: Partial<StorageStatus>) {
  const next = { ...status, ...change };
  if (Object.keys(next).every((key) => next[key as keyof StorageStatus] === status[key as keyof StorageStatus])) return;
  status = next;
  listeners.forEach((listener) => listener());
}
function errorText(error: unknown): string {
  if (error instanceof DOMException && error.name === "QuotaExceededError") return "Der Gerätespeicher ist voll. Bitte Speicher freigeben und erneut speichern.";
  return "Deine Änderungen konnten nicht dauerhaft gespeichert werden. Bitte sichere deinen Stand und versuche es erneut.";
}
function local(): Storage {
  if (typeof window === "undefined") throw new Error("Der Lernspeicher ist nur auf dem Gerät verfügbar.");
  return window.localStorage;
}
function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Speicherzugriff fehlgeschlagen."));
  });
}
function complete(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error("Speichertransaktion abgebrochen."));
    tx.onerror = () => { /* onabort reports the complete transaction failure */ };
  });
}
async function writeTransaction(db: IDBDatabase, stores: string | string[], write: (tx: IDBTransaction) => void): Promise<void> {
  const tx = db.transaction(stores, "readwrite");
  const done = complete(tx);
  try { write(tx); }
  catch (error) {
    // put() can throw synchronously (quota, cloning, invalid data). Earlier
    // requests must be aborted too, otherwise a half-restored backup can commit.
    try { tx.abort(); } catch { /* already aborted */ }
    await done.catch(() => {});
    throw error;
  }
  await done;
}
function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  publish({ pending: status.pending + 1 });
  const result = queue.then(operation);
  queue = result.then(() => {
    publish({ pending: status.pending - 1, ...(dirty.size === 0 ? { phase: "ready" as const, error: null } : {}) });
  }, (error: unknown) => {
    publish({ phase: "error", error: errorText(error), pending: status.pending - 1 });
  });
  return result;
}

export function initializeStorage(): Promise<void> {
  if (initialization) return initialization;
  initialization = (async () => {
    publish({ phase: "loading" });
    if (typeof indexedDB === "undefined") {
      // No promise of durable photo storage in this compatibility mode.
      local();
      publish({ phase: "ready", backend: "local", error: null });
      return;
    }
    const opening = indexedDB.open(STORAGE_DATABASE, 1);
    opening.onupgradeneeded = () => {
      const db = opening.result;
      db.createObjectStore("strings");
      db.createObjectStore("blobs");
      db.createObjectStore("meta");
    };
    opening.onblocked = () => publish({ phase: "error", error: "Bitte andere Fenster der App schließen, damit der Lernspeicher geöffnet werden kann." });
    const db = await request(opening);
    try {
      // The migration marker and all values commit together. A failed migration
      // never marks an incomplete copy as finished and leaves the old data intact.
      const tx = db.transaction(["strings", "meta"], "readwrite");
      const done = complete(tx);
      const strings = tx.objectStore("strings");
      const marker = tx.objectStore("meta").get("local-migration-v1");
      marker.onsuccess = () => {
        if (marker.result) return;
        try {
          const previous = local();
          for (let i = 0; i < previous.length; i++) {
            const key = previous.key(i);
            if (key !== null) strings.put(previous.getItem(key)!, key);
          }
          tx.objectStore("meta").put(true, "local-migration-v1");
        } catch { tx.abort(); }
      };
      await done;
      const readTx = db.transaction("strings", "readonly");
      const readDone = complete(readTx);
      const values = request(readTx.objectStore("strings").getAll());
      const keys = request(readTx.objectStore("strings").getAllKeys());
      const [storedValues, storedKeys] = await Promise.all([values, keys]);
      await readDone;
      cache = new Map(storedKeys.map((key, i) => [String(key), String(storedValues[i])]));
      database = db;
      db.onversionchange = () => {
        db.close();
        publish({ phase: "error", error: "Der Lernspeicher wurde in einem anderen Fenster aktualisiert. Bitte die App neu öffnen." });
      };
      publish({ phase: "ready", backend: "indexeddb", error: null });
    } catch (error) { db.close(); throw error; }
  })().catch((error: unknown) => {
    initialization = null;
    publish({ phase: "error", error: errorText(error) });
    throw error;
  });
  return initialization;
}

function persistDirty(): Promise<void> {
  return enqueue(async () => {
    if (!database) return;
    const batch = new Map(dirty);
    if (!batch.size) return;
    await writeTransaction(database, "strings", (tx) => {
      for (const [key, item] of batch) {
        if (item.value === null) tx.objectStore("strings").delete(key);
        else tx.objectStore("strings").put(item.value, key);
      }
    });
    for (const [key, item] of batch) if (dirty.get(key)?.sequence === item.sequence) dirty.delete(key);
  });
}
function writeString(key: string, value: string | null) {
  if (!database) {
    try {
      if (value === null) local().removeItem(key); else local().setItem(key, value);
    } catch (error) { publish({ phase: "error", error: errorText(error) }); throw error; }
    return;
  }
  if (value === null) cache.delete(key); else cache.set(key, value);
  dirty.set(key, { value, sequence: ++sequence });
  void persistDirty().catch(() => { /* exposed through status and flushStorage */ });
}
const storageMethods = {
  get length() { return database ? cache.size : (typeof window === "undefined" ? 0 : local().length); },
  key(index: number) { return database ? [...cache.keys()][index] ?? null : local().key(index); },
  getItem(key: string) { return database ? cache.get(String(key)) ?? null : (typeof window === "undefined" ? null : local().getItem(String(key))); },
  setItem(key: string, value: string) { writeString(String(key), String(value)); },
  removeItem(key: string) { writeString(String(key), null); },
  clear() {
    const keys = database ? [...cache.keys()] : Object.keys(local());
    for (const key of keys) writeString(key, null);
  },
};
// Existing session code enumerates Object.keys(Storage). Preserve that behavior.
export const appStorage: Storage = new Proxy(storageMethods, {
  ownKeys: () => database ? [...cache.keys()] : (typeof window === "undefined" ? [] : Object.keys(local())),
  getOwnPropertyDescriptor: (_target, key) => typeof key === "string" && storageMethods.getItem(key) !== null
    ? { enumerable: true, configurable: true, value: storageMethods.getItem(key) } : undefined,
}) as Storage;

export async function flushStorage(): Promise<void> {
  // Effects may enqueue another write while the previously captured queue is
  // settling (for example the shell's font setting on opening an assessment).
  // Drain the current queue before deciding that a dirty value is a failure.
  for (;;) {
    const captured = queue;
    await captured;
    if (captured !== queue) continue;
    if (dirty.size || status.phase === "error") throw new Error(status.error ?? "Änderungen sind noch nicht dauerhaft gespeichert.");
    return;
  }
}
export async function retryStorageWrites(): Promise<void> {
  await initializeStorage();
  await persistDirty();
  await flushStorage();
}
async function requireDatabase(): Promise<IDBDatabase> {
  await initializeStorage();
  if (!database) {
    const message = "Fotos und Bilddateien können auf diesem Gerät nicht dauerhaft gespeichert werden. Bitte einen aktuellen Browser oder die Mac-App verwenden.";
    publish({ phase: "error", error: message });
    throw new Error(message);
  }
  return database;
}
export async function readBlob(key: string): Promise<Blob | null> {
  const db = await requireDatabase();
  await queue;
  const tx = db.transaction("blobs", "readonly");
  const done = complete(tx);
  const value = await request(tx.objectStore("blobs").get(key));
  await done;
  return value ?? null;
}
export async function writeBlob(key: string, blob: Blob): Promise<void> {
  const db = await requireDatabase();
  return enqueue(async () => {
    await writeTransaction(db, "blobs", (tx) => { tx.objectStore("blobs").put(blob, key); });
  });
}
export async function deleteBlob(key: string): Promise<void> {
  const db = await requireDatabase();
  return enqueue(async () => {
    await writeTransaction(db, "blobs", (tx) => { tx.objectStore("blobs").delete(key); });
  });
}
export async function snapshotStorage(): Promise<StorageSnapshot> {
  await initializeStorage();
  // A backup also rescues cached changes after a failed durable write. Wait
  // for in-flight transactions, but keep the recoverable cache exportable.
  await queue;
  const daten = Object.fromEntries(Object.keys(appStorage).map((key) => [key, appStorage.getItem(key)!]));
  const dateien = new Map<string, Blob>();
  if (database) {
    const tx = database.transaction("blobs", "readonly");
    const done = complete(tx);
    const [keys, values] = await Promise.all([request(tx.objectStore("blobs").getAllKeys()), request(tx.objectStore("blobs").getAll())]);
    await done;
    keys.forEach((key, index) => dateien.set(String(key), values[index]));
  }
  return { daten, dateien };
}
/** Merge exactly the validated backup's areas. Unrelated drafts remain intact. */
export async function restoreStorage(snapshot: StorageSnapshot, removeKeys: string[] = []): Promise<void> {
  await initializeStorage();
  await flushStorage();
  if (!database) {
    if (snapshot.dateien.size) throw new Error("Diese Sicherung enthält Bilder und benötigt IndexedDB.");
    const before = new Map([...Object.keys(snapshot.daten), ...removeKeys].map((key) => [key, appStorage.getItem(key)]));
    try {
      for (const [key, value] of Object.entries(snapshot.daten)) appStorage.setItem(key, value);
      for (const key of removeKeys) appStorage.removeItem(key);
    } catch (error) {
      for (const [key, value] of before) {
        try { if (value === null) local().removeItem(key); else local().setItem(key, value); } catch { /* persistent error remains visible */ }
      }
      throw error;
    }
    return;
  }
  const db = database;
  await enqueue(async () => {
    await writeTransaction(db, ["strings", "blobs"], (tx) => {
      for (const [key, value] of Object.entries(snapshot.daten)) tx.objectStore("strings").put(value, key);
      for (const key of removeKeys) tx.objectStore("strings").delete(key);
      for (const [key, blob] of snapshot.dateien) tx.objectStore("blobs").put(blob, key);
    });
    for (const [key, value] of Object.entries(snapshot.daten)) cache.set(key, value);
    for (const key of removeKeys) cache.delete(key);
  });
}
