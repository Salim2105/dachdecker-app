// @vitest-environment node
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { prepareProbe } from "../../scripts/prepare-probe.mjs";

it("erstellt eine anmeldungsfreie Kopie und erhält den privaten Zugangsschutz", async () => {
  const root = await mkdtemp(join(tmpdir(), "dach-probe-"));
  try {
    await mkdir(join(root,"out","lernen"),{recursive:true});
    for(const [name,wert] of Object.entries({"index.html":"Start","sw.js":"offline","manifest.webmanifest":"{}","_worker.js":"privater Schutz","lernen/lf07.html":"Kurs"}))await writeFile(join(root,"out",name),wert);
    const target=await prepareProbe(root);
    expect(await readFile(join(root,"out","_worker.js"),"utf8")).toBe("privater Schutz");
    await expect(readFile(join(target,"_worker.js"))).rejects.toThrow();
    expect(await readFile(join(target,"lernen","lf07.html"),"utf8")).toBe("Kurs");
    expect(await readFile(join(target,"sw.js"),"utf8")).toBe("offline");
    expect(await readFile(join(target,"_headers"),"utf8")).toContain("noindex");
    await writeFile(join(target,"veraltet.html"),"alt");
    await prepareProbe(root);
    await expect(readFile(join(target,"veraltet.html"))).rejects.toThrow();
  } finally { await rm(root,{recursive:true,force:true}); }
});
