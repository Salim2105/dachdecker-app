/** Read the generated ISO-BMFF container without requiring FFmpeg on a Mac. */
function boxes(bytes, start = 0, end = bytes.length) {
  const result = [];
  for (let offset = start; offset < end;) {
    if (offset + 8 > end) throw new Error("Unvollständiger MP4-Block");
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    let size = bytes.readUInt32BE(offset), header = 8;
    if (size === 1) { if (offset + 16 > end) throw new Error("Unvollständiger langer MP4-Block"); size = Number(bytes.readBigUInt64BE(offset + 8)); header = 16; }
    if (size === 0) size = end - offset;
    if (!Number.isSafeInteger(size) || size < header || offset + size > end) throw new Error("Ungültige MP4-Blockgröße");
    result.push({ type, start: offset, data: offset + header, end: offset + size });
    offset += size;
  }
  return result;
}
export function inspectMp4(bytes) {
  const root = boxes(bytes), moov = root.find(b => b.type === "moov"), mdat = root.find(b => b.type === "mdat");
  if (!moov || !mdat || !root.some(b => b.type === "ftyp")) throw new Error("MP4 ohne Film-/Mediendaten");
  const children = parent => boxes(bytes, parent.data, parent.end);
  const child = (parent, type) => { const box = children(parent).find(b => b.type === type); if (!box) throw new Error(`MP4 ohne ${type}`); return box; };
  const tracks = children(moov).filter(b => b.type === "trak").map(trak => {
    const mdia = child(trak, "mdia"), header = child(mdia, "mdhd"), handler = child(mdia, "hdlr");
    const v1 = bytes[header.data] === 1, timescale = bytes.readUInt32BE(header.data + (v1 ? 20 : 12));
    const duration = v1 ? Number(bytes.readBigUInt64BE(header.data + 24)) : bytes.readUInt32BE(header.data + 16);
    const table = child(child(mdia, "minf"), "stbl"), stsd = child(table, "stsd"), stts = child(table, "stts");
    const samples = boxes(bytes, stsd.data + 8, stsd.end);
    if (samples.length !== 1 || !timescale || !Number.isSafeInteger(duration)) throw new Error("Ungültige MP4-Spur");
    const entry = samples[0], kind = bytes.toString("ascii", handler.data + 8, handler.data + 12);
    let frames = 0, ticks = 0;
    const count = bytes.readUInt32BE(stts.data + 4);
    if (stts.data + 8 + count * 8 > stts.end) throw new Error("Ungültige MP4-Zeittabelle");
    for (let i = 0; i < count; i++) { const n = bytes.readUInt32BE(stts.data + 8 + i * 8), delta = bytes.readUInt32BE(stts.data + 12 + i * 8); frames += n; ticks += n * delta; }
    return { kind, codec: entry.type, seconds: duration / timescale,
      ...(kind === "vide" ? { width: bytes.readUInt16BE(entry.start + 32), height: bytes.readUInt16BE(entry.start + 34), fps: frames * timescale / ticks } : {}),
      ...(kind === "soun" ? { channels: bytes.readUInt16BE(entry.start + 24) } : {}) };
  });
  return { fastStart: moov.start < mdat.start, tracks };
}
