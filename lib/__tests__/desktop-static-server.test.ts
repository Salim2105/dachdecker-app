// @vitest-environment node
import { createServer, type Server } from "node:http";
import { createRequire } from "node:module";
import { mkdtemp, mkdir, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { createStaticHandler } = require("../../electron/static-server.js");
let server: Server, root: string, origin: string;
beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "dach-video-http-"));
  await mkdir(join(root, "out", "praxisvideos", "v1"), { recursive: true });
  await writeFile(join(root, "out", "index.html"), "Start");
  await writeFile(join(root, "out", "projekte.html"), "Projekte");
  await writeFile(join(root, "out", "404.html"), "Fehlt");
  await writeFile(join(root, "out", "praxisvideos", "v1", "demo.mp4"), "0123456789");
  await writeFile(join(root, "out", "praxisvideos", "v1", "demo.vtt"), "WEBVTT\n");
  await writeFile(join(root, "privat.txt"), "privat");
  await symlink(join(root, "privat.txt"), join(root, "out", "nicht-oeffentlich.txt"));
  server = createServer(createStaticHandler(join(root, "out")));
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Kein Testport");
  origin = `http://127.0.0.1:${address.port}`;
});
afterAll(async () => { server?.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); await rm(root, { recursive: true, force: true }); });

describe("Mac-App: echter statischer HTTP-Server", () => {
  it("liefert saubere Next-Routen und korrekte Videotypen inklusive HEAD", async () => {
    expect(await (await fetch(origin + "/")).text()).toBe("Start");
    expect(await (await fetch(origin + "/projekte?ansicht=uebersicht")).text()).toBe("Projekte");
    const head = await fetch(origin + "/praxisvideos/v1/demo.mp4", { method: "HEAD", headers: { Range: "bytes=0-1" } });
    expect(head.status).toBe(200); expect(head.headers.get("Content-Type")).toBe("video/mp4");
    expect(head.headers.get("Content-Length")).toBe("10"); expect(head.headers.get("Accept-Ranges")).toBe("bytes"); expect(await head.text()).toBe("");
    expect((await fetch(origin + "/praxisvideos/v1/demo.vtt")).headers.get("Content-Type")).toBe("text/vtt; charset=utf-8");
  });
  it.each([["bytes=0-1", "01"], ["bytes=5-", "56789"], ["bytes=-3", "789"], ["bytes=8-999", "89"]])("spult %s ohne die ganze Datei zu senden", async (range, body) => {
    const response = await fetch(origin + "/praxisvideos/v1/demo.mp4", { headers: { Range: range } });
    expect(response.status).toBe(206); expect(response.headers.get("Content-Length")).toBe(String(body.length));
    expect(await response.text()).toBe(body);
  });
  it.each(["bytes=10-", "bytes=-0", "bytes=6-2", "bytes=a-b", "bytes=999999999999999999999999-"])("weist unbrauchbaren Bereich %s zurück", async range => {
    const response = await fetch(origin + "/praxisvideos/v1/demo.mp4", { headers: { Range: range } });
    expect(response.status).toBe(416); expect(response.headers.get("Content-Range")).toBe("bytes */10"); expect(await response.text()).toBe("");
  });
  it("bewahrt Fehlerrouten und gibt weder Nachbardateien noch andere Methoden frei", async () => {
    for (const path of ["/nicht-oeffentlich.txt", "/..%2fprivat.txt", "/unbekannt.mp4"]) expect((await fetch(origin + path)).status).toBe(404);
    expect((await fetch(origin + "/%zz")).status).toBe(400);
    const response = await fetch(origin, { method: "POST" }); expect(response.status).toBe(405); expect(response.headers.get("Allow")).toBe("GET, HEAD");
  });
});
