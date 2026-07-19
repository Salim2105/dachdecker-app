import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

// Eigene App-Marke: zwei ineinanderliegende Dach-Chevrons (Kupfer auf Schiefer).
function svg({ inset = 0 } = {}) {
  const s = 512;
  const k = (1 - inset) ; // Skalierung der Marke (für maskable kleiner)
  const cx = s / 2;
  const tx = (x) => cx + (x - cx) * k;
  const ty = (y) => cx + (y - cx) * k;
  const p1 = `M${tx(86)} ${ty(300)} L${tx(256)} ${ty(150)} L${tx(426)} ${ty(300)}`;
  const p2 = `M${tx(120)} ${ty(360)} L${tx(256)} ${ty(240)} L${tx(392)} ${ty(360)}`;
  return `<svg xmlns='http://www.w3.org/2000/svg' width='${s}' height='${s}' viewBox='0 0 ${s} ${s}'>
  <rect width='${s}' height='${s}' fill='#23262b'/>
  <path d='${p1}' fill='none' stroke='#c07d4a' stroke-width='${36 * k}' stroke-linejoin='round' stroke-linecap='round'/>
  <path d='${p2}' fill='none' stroke='#8f5c34' stroke-width='${24 * k}' stroke-linejoin='round' stroke-linecap='round'/>
</svg>`;
}

async function render(name, size, opts) {
  await sharp(Buffer.from(svg(opts)))
    .resize(size, size)
    .png()
    .toFile(join(outDir, name));
  console.log("wrote", name);
}

await render("icon-192.png", 192, {});
await render("icon-512.png", 512, {});
await render("maskable-512.png", 512, { inset: 0.2 });
console.log("done");
