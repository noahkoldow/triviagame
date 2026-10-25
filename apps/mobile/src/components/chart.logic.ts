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
