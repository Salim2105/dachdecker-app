/** Shared by the packaged Mac server and the generated offline worker. */
function parseByteRange(value, size) {
  if (!value) return null;
  const input = value.trim();
  if (!/^bytes=/i.test(input) || input.includes(',')) return null;
  const match = /^bytes=(\d*)-(\d*)$/i.exec(input);
  if (!match || !Number.isSafeInteger(size) || size <= 0 || !match[1] && !match[2]) return { invalid: true };
  const first = match[1] === '' ? null : Number(match[1]);
  const last = match[2] === '' ? null : Number(match[2]);
  if (first !== null && !Number.isSafeInteger(first) || last !== null && !Number.isSafeInteger(last)) return { invalid: true };
  if (first === null) {
    if (last <= 0) return { invalid: true };
    return { start: Math.max(0, size - last), end: size - 1 };
  }
  if (first >= size || last !== null && last < first) return { invalid: true };
  return { start: first, end: last === null ? size - 1 : Math.min(last, size - 1) };
}
module.exports = { parseByteRange };
