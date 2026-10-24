import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Separate public trial export; the private deployment stays protected. */
export async function prepareProbe(root = process.cwd()) {
  const source = resolve(root, 'out');
  for (const file of ['index.html', 'sw.js', 'manifest.webmanifest']) await readFile(resolve(source, file));
  const target = resolve(root, '.probe-export');
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
  await cp(source, target, { recursive: true });
  for (const file of ['_worker.js', '_routes.json']) await rm(resolve(target, file), { force: true });
  await writeFile(resolve(target, '_headers'), '/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  Referrer-Policy: no-referrer\n  X-Content-Type-Options: nosniff\n/sw.js\n  Cache-Control: no-cache\n');
  return target;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await prepareProbe();
  console.log('Testversion ohne Anmeldung vorbereitet. Der private Export bleibt unverändert.');
}
