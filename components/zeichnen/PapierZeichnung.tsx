"use client";
/* eslint-disable @next/next/no-img-element -- Lokale Blob-Fotos bleiben auf dem Gerät und verwenden keinen Bildserver. */
import { useEffect, useRef, useState } from "react";
import { flushStorage, readBlob } from "@/lib/lernSpeicher";
import { importiereZeichenFoto, loescheZeichenFoto } from "@/lib/zeichenFoto";
import type { ZeichenFoto } from "@/lib/zeichenEntwurf";

export function PapierZeichnung({ aufgabenId, foto, onChange }: {
  aufgabenId: string; foto?: ZeichenFoto; onChange: (foto: ZeichenFoto | undefined) => boolean;
}) {
  const [bild, setBild] = useState<{ key: string; url: string } | null>(null);
  const [fehler, setFehler] = useState("");
  const [busy, setBusy] = useState(false);
  const lebt = useRef(true);
  useEffect(() => { lebt.current = true; return () => { lebt.current = false; }; }, []);
  const anzeigeKey = foto?.anzeigeKey;
  useEffect(() => {
    if (!anzeigeKey) return;
    let aktiv = true; let url: string | undefined;
    readBlob(anzeigeKey).then((blob) => {
      if (!aktiv) return;
      if (!blob) { setFehler("Das gespeicherte Foto fehlt. Importiere es erneut oder stelle eine vollständige Sicherung wieder her."); return; }
      url = URL.createObjectURL(blob); setBild({ key: anzeigeKey, url });
    }).catch(() => { if (aktiv) setFehler("Das gespeicherte Foto konnte nicht geöffnet werden."); });
    return () => { aktiv = false; if (url) URL.revokeObjectURL(url); };
  }, [anzeigeKey]);

  async function importieren(file: File) {
    setBusy(true); setFehler("");
    const vorSchliessen = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", vorSchliessen);
    try {
      const neu = await importiereZeichenFoto(file, aufgabenId);
      // Auch nach einem Seitenwechsel die Zuordnung zum Entwurf abschließen.
      const gespeichert = onChange(neu);
      // Erst nach erfolgreichem Speichern umschalten; die vorherige Datei dann freigeben.
      if (gespeichert) {
        await flushStorage();
        if (foto) await loescheZeichenFoto(foto);
      }
    } catch (error) {
      if (lebt.current) setFehler(error instanceof Error ? error.message : "Das Foto konnte nicht gespeichert werden.");
    } finally { window.removeEventListener("beforeunload", vorSchliessen); if (lebt.current) setBusy(false); }
  }
  async function entfernen() {
    if (!foto) return;
    setBusy(true); setFehler("");
    try { if (onChange(undefined)) { await flushStorage(); await loescheZeichenFoto(foto); } }
    catch { setFehler("Das Foto konnte nicht entfernt werden. Bitte versuche es erneut."); }
    finally { if (lebt.current) setBusy(false); }
  }
  async function originalHerunterladen() {
    if (!foto) return;
    try {
      const blob = await readBlob(foto.originalKey);
      if (!blob) throw new Error("Das Originalfoto fehlt im Speicher.");
      const url = URL.createObjectURL(blob); const link = document.createElement("a");
      link.href = url; link.download = foto.name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { setFehler(error instanceof Error ? error.message : "Das Originalfoto konnte nicht geöffnet werden."); }
  }
  return <section className="mt-4 space-y-3" aria-label="Zeichnung auf Papier">
    <p className="text-sm" style={{ color: "var(--text-muted)" }}>Zeichne auf Papier und fotografiere dein Ergebnis. Dein Originalfoto bleibt auf diesem Gerät und ist in einer vollständigen Datensicherung enthalten. JPEG und PNG funktionieren überall; HEIC wird in der Mac-App lokal umgewandelt.</p>
    <label className="block text-sm font-medium">Foto der eigenen Zeichnung
      <input type="file" accept="image/jpeg,image/png,image/heic,image/heif,.heic,.heif" disabled={busy} className="mt-2 block min-h-11 w-full rounded-lg border p-2 text-sm" onChange={(e) => {
        const file = e.currentTarget.files?.[0]; e.currentTarget.value = "";
        if (file) void importieren(file);
      }} />
    </label>
    {busy && <p role="status" className="text-sm">Foto wird lokal gespeichert …</p>}
    {foto && <div className="space-y-2">
      {bild?.key === foto.anzeigeKey ? <div className="max-h-[600px] overflow-auto rounded-xl border bg-white p-2"><img src={bild.url} alt="Eigene Zeichnung auf Papier" className="mx-auto max-h-[580px] max-w-full object-contain" onError={() => setFehler("Das gespeicherte Foto ist beschädigt oder kann nicht angezeigt werden. Importiere es bitte erneut.")} /></div> : <p role="status" className="text-sm">Gespeichertes Foto wird geöffnet …</p>}
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{foto.name} · Original lokal gespeichert</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="min-h-11 rounded-lg border px-3 py-2 text-sm" disabled={busy} onClick={() => void originalHerunterladen()}>Originalfoto herunterladen</button>
        <button type="button" className="min-h-11 rounded-lg border px-3 py-2 text-sm" disabled={busy} onClick={() => void entfernen()}>Foto entfernen</button>
      </div>
    </div>}
    {fehler && <p role="alert" className="text-sm" style={{ color: "var(--bad)" }}>{fehler}</p>}
  </section>;
}
