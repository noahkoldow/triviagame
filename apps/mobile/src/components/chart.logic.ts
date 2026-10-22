/** Layout of the little charts; pure, so it can be tested. */

/** 8849 → "8.849" (German thousands separator); decimals stay as they are. */
export function formatNumber(n: number): string {
  const [int, dec] = String(n).split('.');
  const grouped = int!.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return dec ? `${grouped},${dec}` : grouped;
}

/** Bar widths in proportion to the value; a bar with a value is always visible. */
export function barLayout(
  items: { label: string; value: number }[],
  maxWidth: number,
): { label: string; value: number; width: number }[] {
  const max = Math.max(1, ...items.map((i) => i.value));
  return items.map((i) => ({
    ...i,
    width: i.value <= 0 ? 0 : Math.max(6, Math.round((i.value / max) * maxWidth)),
  }));
}

/**
 * Events on a line in order of the years. Labels alternate above and below the line so
 * neighbours do not overlap; `x` is a position from 0 to `width` with some padding.
 */
export function timelineLayout(
  events: { label: string; year: number }[],
  width: number,
  pad = 36,
): { label: string; year: number; x: number; above: boolean }[] {
  const sorted = [...events].sort((a, b) => a.year - b.year);
  const lo = sorted[0]!.year;
  const hi = sorted[sorted.length - 1]!.year;
  const span = Math.max(1, hi - lo);
  return sorted.map((e, i) => ({
    ...e,
    x: pad + ((e.year - lo) / span) * (width - 2 * pad),
    above: i % 2 === 0,
  }));
}
