/** Ein Zahlenfeld ist kein Rechenausdruck. Verhindert z. B. parseFloat("12abc"). */
export function leseDezimalzahl(text: string): number | null {
  if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(text.trim())) return null;
  const wert = Number(text.trim().replace(",", "."));
  return Number.isFinite(wert) ? wert : null;
}
