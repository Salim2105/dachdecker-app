/** Compact GLBs without remote decoders or losing semantic teaching nodes.
 * Standard KHR_mesh_quantization is supported directly by Three's GLTFLoader.
 * Positions retain 16-bit precision; no triangle or component is removed.
 */
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { quantize, prune } from "@gltf-transform/functions";
import { readFile, writeFile, rename } from "node:fs/promises";
import { resolve } from "node:path";

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
for (const arg of process.argv.slice(2)) {
  const file = resolve(arg);
  const before = await readFile(file);
  const document = await io.readBinary(before);
  // cleanup:false deliberately preserves empty Hotspot_* / Wasser_* nodes and
  // their extras; they are part of the keyboard and water-path interaction.
  await document.transform(quantize({ quantizePosition: 16, quantizeNormal: 12, quantizeTexcoord: 16, cleanup: false }), prune({ keepLeaves: true, keepExtras: true, keepAttributes: true }));
  const after = await io.writeBinary(document);
  const temporary = `${file}.tmp`;
  await writeFile(temporary, after);
  await rename(temporary, file);
  console.log(`DACH_GLB_COMPACT ${JSON.stringify({ file, vorher: before.length, nachher: after.length })}`);
}
