const fs = require('node:fs');
const path = require('node:path');
const { parseByteRange } = require('./http-byte-range.cjs');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.vtt': 'text/vtt; charset=utf-8',
  '.glb': 'model/gltf-binary', '.hdr': 'image/vnd.radiance',
};

function createStaticHandler(directory) {
  const root = path.resolve(directory);
  function locate(url) {
    const input = decodeURIComponent(new URL(url, 'http://127.0.0.1').pathname).replace(/^\/+/, '');
    const base = path.resolve(root, input);
    const candidates = !input || input.endsWith('/') ? [path.join(base, 'index.html')] : [base, base + '.html', path.join(base, 'index.html')];
    for (const file of candidates) {
      if (!file.startsWith(root + path.sep)) continue;
      try {
        const actual = fs.realpathSync(file);
        if (!actual.startsWith(root + path.sep)) continue;
        const stat = fs.statSync(actual);
        if (stat.isFile()) return { file: actual, stat };
      } catch { /* Try the next static route representation. */ }
    }
    return null;
  }
  return function staticHandler(req, res) {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
    let found;
    try { found = locate(req.url || '/'); }
    catch { res.writeHead(400).end('Invalid URL'); return; }
    let status = 200;
    if (!found) { found = locate('/404.html'); status = 404; }
    if (!found) { res.writeHead(404, { 'Content-Length': '0' }).end(); return; }
    const { file, stat } = found;
    const headers = { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Content-Length': String(stat.size), 'Accept-Ranges': 'bytes', 'X-Content-Type-Options': 'nosniff' };
    const range = status === 200 && req.method === 'GET' ? parseByteRange(req.headers.range, stat.size) : null;
    if (range?.invalid) { res.writeHead(416, { ...headers, 'Content-Range': `bytes */${stat.size}`, 'Content-Length': '0' }).end(); return; }
    if (range) { status = 206; headers['Content-Range'] = `bytes ${range.start}-${range.end}/${stat.size}`; headers['Content-Length'] = String(range.end - range.start + 1); }
    res.writeHead(status, headers);
    if (req.method === 'HEAD') { res.end(); return; }
    const stream = fs.createReadStream(file, range ? { start: range.start, end: range.end } : undefined);
    stream.on('error', () => res.destroy());
    res.on('close', () => stream.destroy());
    stream.pipe(res);
  };
}
module.exports = { createStaticHandler, MIME };
