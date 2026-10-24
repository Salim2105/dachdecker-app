// @vitest-environment node
import { createRequire } from "node:module";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
const require = createRequire(import.meta.url);
const { validiereHeic, convertHeicToPng } = require("../../electron/heic.js");
const heic = new Uint8Array([0, 0, 0, 16, 102, 116, 121, 112, 104, 101, 105, 99, 0, 0, 0, 0]);
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
const temporaer: string[] = [];
afterEach(async () => { await Promise.all(temporaer.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))); });

describe("HEIC wird mit festem lokalen Befehl und begrenzter Dateiauswahl umgewandelt", () => {
  it("weist Pfade, zusätzliche Befehlsargumente und falsche Dateisignaturen zurück", () => {
    expect(() => validiereHeic({ bytes: heic, name: "../../Geheim.heic" })).toThrow("Ungültige");
    expect(() => validiereHeic({ bytes: heic, name: "Bild.heic", command: "rm" })).toThrow("Ungültige");
    expect(() => validiereHeic({ bytes: new Uint8Array(100), name: "Bild.heic" })).toThrow("kein HEIC");
    expect(validiereHeic({ bytes: heic, name: "Bild.heic" })).toEqual(Buffer.from(heic));
  });
  it("nutzt ausschließlich sips mit festen Argumenten und entfernt temporäre Originale nach Erfolg", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "zeichen-test-")); temporaer.push(tempRoot);
    const runFile = vi.fn(async (executable: string, args: string[], options: { timeout: number }) => {
      expect(executable).toBe("/usr/bin/sips");
      expect(options.timeout).toBe(30000);
      if (args[0] === "-g") return { stdout: "pixelWidth: 4000\npixelHeight: 3000" };
      expect(args.slice(0, 5)).toEqual(["-s", "format", "png", "--resampleHeightWidthMax", "2400"]);
      const output = args[args.indexOf("--out") + 1];
      expect(output.startsWith(tempRoot + path.sep)).toBe(true);
      await writeFile(output, png); return { stdout: "" };
    });
    const ergebnis = await convertHeicToPng({ bytes: heic, name: "Foto.heic" }, { platform: "darwin", tempRoot, runFile });
    expect(ergebnis.bytes).toEqual(png);
    expect(runFile).toHaveBeenCalledTimes(2);
    expect(await readdir(tempRoot)).toEqual([]);
  });
  it("räumt nach Decoderfehlern auf und verweigert unverhältnismäßig große Bilder", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "zeichen-test-")); temporaer.push(tempRoot);
    const runFile = vi.fn(async () => ({ stdout: "pixelWidth: 50000\npixelHeight: 50000" }));
    await expect(convertHeicToPng({ bytes: heic, name: "Foto.heic" }, { platform: "darwin", tempRoot, runFile })).rejects.toThrow("zu viele Bildpunkte");
    expect(runFile).toHaveBeenCalledTimes(1);
    expect(await readdir(tempRoot)).toEqual([]);
    await expect(convertHeicToPng({ bytes: heic, name: "Foto.heic" }, { platform: "linux", tempRoot, runFile })).rejects.toThrow("Mac-App");
  });
});
