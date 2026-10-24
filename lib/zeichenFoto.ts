import { deleteBlob, writeBlob } from "@/lib/lernSpeicher";
import { erkenneFotoformat, FOTO_MAX_BYTES, type ZeichenFoto } from "@/lib/zeichenEntwurf";

declare global {
  interface Window {
    dachdeckerDesktop?: {
      platform: string;
      convertHeic: (foto: { bytes: ArrayBuffer; name: string }) => Promise<{ bytes: Uint8Array; mime: "image/png" }>;
    };
  }
}

export function leseFotoBytes(file: Blob): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === "function") return file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Die Fotodatei konnte nicht gelesen werden."));
    reader.onload = () => reader.result instanceof ArrayBuffer ? resolve(reader.result) : reject(new Error("Die Fotodatei konnte nicht gelesen werden."));
    reader.readAsArrayBuffer(file);
  });
}

async function pruefeBild(blob: Blob): Promise<void> {
  let breite: number; let hoehe: number;
  if (typeof createImageBitmap === "function") {
    const bild = await createImageBitmap(blob);
    breite = bild.width; hoehe = bild.height; bild.close();
  } else {
    const url = URL.createObjectURL(blob);
    try {
      const bild = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Das Foto ist beschädigt oder kann nicht geöffnet werden."));
        img.src = url;
      });
      breite = bild.naturalWidth; hoehe = bild.naturalHeight;
    } finally { URL.revokeObjectURL(url); }
  }
  if (!breite || !hoehe || breite > 16000 || hoehe > 16000 || breite * hoehe > 80_000_000) throw new Error("Das Foto hat zu viele Bildpunkte. Bitte exportiere es als kleineres JPEG oder PNG.");
}

/** Das Original bleibt im lokalen Blob-Speicher und damit in vollständigen Sicherungen. */
export async function importiereZeichenFoto(file: File, aufgabenId: string): Promise<ZeichenFoto> {
  if (file.size > FOTO_MAX_BYTES) throw new Error("Das Foto ist zu groß. Bitte wähle eine Datei bis 20 MB.");
  const bytes = await leseFotoBytes(file);
  const format = erkenneFotoformat(new Uint8Array(bytes));
  if (!format) throw new Error("Bitte wähle ein gültiges JPEG-, PNG- oder HEIC-Foto.");
  let anzeigeBytes = bytes;
  let anzeigeMime: string = format;
  if (format === "image/heic") {
    if (!window.dachdeckerDesktop || window.dachdeckerDesktop.platform !== "darwin") throw new Error("HEIC lässt sich in der Mac-App lokal öffnen. Im Browser bitte das Foto in Vorschau als JPEG oder PNG exportieren.");
    const ergebnis = await window.dachdeckerDesktop.convertHeic({ bytes, name: file.name });
    const png = new Uint8Array(ergebnis.bytes);
    if (png.length > 32 * 1024 * 1024 || erkenneFotoformat(png.subarray(0, Math.min(png.length, FOTO_MAX_BYTES))) !== "image/png") throw new Error("Die HEIC-Umwandlung hat kein gültiges PNG geliefert.");
    anzeigeBytes = png.slice().buffer;
    anzeigeMime = "image/png";
  }
  const nonce = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  const originalKey = `drawing:photo:${aufgabenId}:${nonce}:original`;
  const anzeigeKey = format === "image/heic" ? `drawing:photo:${aufgabenId}:${nonce}:display` : originalKey;
  await pruefeBild(new Blob([anzeigeBytes], { type: anzeigeMime }));
  try {
    await writeBlob(originalKey, new Blob([bytes], { type: format }));
    if (anzeigeKey !== originalKey) await writeBlob(anzeigeKey, new Blob([anzeigeBytes], { type: anzeigeMime }));
  } catch (error) {
    await Promise.allSettled([deleteBlob(originalKey), ...(anzeigeKey !== originalKey ? [deleteBlob(anzeigeKey)] : [])]);
    throw error;
  }
  return { originalKey, anzeigeKey, name: file.name.slice(0, 250), mime: format };
}
export async function loescheZeichenFoto(foto: ZeichenFoto): Promise<void> {
  await deleteBlob(foto.originalKey);
  if (foto.anzeigeKey !== foto.originalKey) await deleteBlob(foto.anzeigeKey);
}
