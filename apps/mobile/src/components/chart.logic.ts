import type { Lang } from '@nexus/shared';

/** Layout of the little charts; pure, so it can be tested. */

/** How each language groups thousands and writes decimals; `min` is the length from which digits are grouped. */
const NUMBERS: Record<Lang, { group: string; decimal: string; min: number }> = {
  de: { group: '.', decimal: ',', min: 4 },
  en: { group: ',', decimal: '.', min: 4 },
  fr: { group: '\u202F', decimal: ',', min: 4 },
  es: { group: '\u00A0', decimal: ',', min: 5 },
};

/** 8849 → "8.849" in German, "8,849" in English, "8 849" in French, "8849" in Spanish; decimals stay as they are. */
export function formatNumber(n: number, lang: Lang = 'de'): string {
  const { group, decimal, min } = NUMBERS[lang];
  const [int, dec] = String(n).split('.');
  const digits = int!.replace('-', '');
  const grouped = digits.length >= min ? int!.replace(/\B(?=(\d{3})+(?!\d))/g, group) : int!;
  return dec ? `${grouped}${decimal}${dec}` : grouped;
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

/**
 * Points of a line chart in a box of `width` × `height`: years from left to right, values from
 * the bottom (a little below the smallest value, so changes show) to the top.
 */
export function lineLayout(
  points: { year: number; value: number }[],
  width: number,
  height: number,
  pad = { left: 8, right: 8, top: 18, bottom: 18 },
): { year: number; value: number; x: number; y: number }[] {
  const lo = Math.min(...points.map((p) => p.value));
  const hi = Math.max(...points.map((p) => p.value));
  const span = Math.max(1e-9, hi - lo);
  const floor = lo - span * 0.15;
  const y0 = points[0]!.year;
  const years = Math.max(1, points[points.length - 1]!.year - y0);
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;
  return points.map((p) => ({
    ...p,
    x: pad.left + ((p.year - y0) / years) * w,
    y: pad.top + h - ((p.value - floor) / (hi - floor)) * h,
  }));
}

/** Slices of a pie, clockwise from twelve o'clock, as start and end angles in radians. */
export function pieSlices(items: { label: string; value: number }[]): { label: string; value: number; from: number; to: number }[] {
  const total = items.reduce((a, i) => a + i.value, 0) || 1;
  let at = -Math.PI / 2;
  return items.map((i) => {
    const from = at;
    at += (i.value / total) * Math.PI * 2;
    return { ...i, from, to: at };
  });
}

/** An SVG path of a pie slice around (cx, cy); a slice of the whole circle is drawn as two halves. */
export function slicePath(cx: number, cy: number, r: number, from: number, to: number): string {
  const pt = (a: number) => `${(cx + Math.cos(a) * r).toFixed(2)} ${(cy + Math.sin(a) * r).toFixed(2)}`;
  if (to - from >= Math.PI * 2 - 1e-6) {
    return `M ${pt(from)} A ${r} ${r} 0 1 1 ${pt(from + Math.PI)} A ${r} ${r} 0 1 1 ${pt(from)} Z`;
  }
  const large = to - from > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${pt(from)} A ${r} ${r} 0 ${large} 1 ${pt(to)} Z`;
}
