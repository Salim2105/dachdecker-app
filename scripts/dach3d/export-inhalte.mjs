import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const file = resolve(root, "lib/dach3dInhalte.ts");
const source = await readFile(file, "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
// This evaluates authored local source for the Blender build, never imported learning data.
const module = { exports: {} };
new Function("module", "exports", "require", compiled)(module, module.exports, createRequire(file));
const target = process.argv[2] ?? "/tmp/dach3d-inhalte.json";
await writeFile(target, JSON.stringify({ modelle: module.exports.DACH_MODELLE, details: module.exports.DACH_DETAILS }, null, 2));
console.log(`${module.exports.DACH_DETAILS.length} Dachdetails für die Modellherstellung nach ${target} exportiert.`);
