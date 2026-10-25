import { describe, expect, it } from 'vitest';
import { barLayout, formatNumber, timelineLayout } from './chart.logic';

describe('chart layout', () => {
  it('writes numbers the German way', () => {
    expect(formatNumber(8849)).toBe('8.849');
    expect(formatNumber(209)).toBe('209');
    expect(formatNumber(1234567)).toBe('1.234.567');
    expect(formatNumber(2.5)).toBe('2,5');
  });

  it('writes numbers the way the player\'s language does', () => {
    expect(formatNumber(8849, 'en')).toBe('8,849');
    expect(formatNumber(2.5, 'en')).toBe('2.5');
    expect(formatNumber(8849, 'fr')).toBe('8\u202F849');
    expect(formatNumber(13.8, 'fr')).toBe('13,8');
    expect(formatNumber(8849, 'es')).toBe('8849');
    expect(formatNumber(300000, 'es')).toBe('300\u00A0000');
  });

  it('draws bars in proportion, the largest at full width', () => {
    const b = barLayout([{ label: 'a', value: 100 }, { label: 'b', value: 50 }, { label: 'c', value: 0 }], 200);
    expect(b[0]!.width).toBe(200);
    expect(b[1]!.width).toBe(100);
    expect(b[2]!.width).toBe(0);
  });

  it('keeps a tiny bar visible', () => {
    const b = barLayout([{ label: 'a', value: 10000 }, { label: 'b', value: 1 }], 200);
    expect(b[1]!.width).toBeGreaterThanOrEqual(6);
  });

  it('puts events in order of the years and alternates the labels', () => {
    const t = timelineLayout(
      [
        { label: 'Einheit', year: 1990 },
        { label: 'Bau', year: 1961 },
        { label: 'Öffnung', year: 1989 },
      ],
      300,
    );
    expect(t.map((e) => e.year)).toEqual([1961, 1989, 1990]);
    expect(t[0]!.x).toBe(36);
    expect(t[2]!.x).toBe(300 - 36);
    expect(t.map((e) => e.above)).toEqual([true, false, true]);
    for (let i = 1; i < t.length; i++) expect(t[i]!.x).toBeGreaterThan(t[i - 1]!.x);
  });

  it('copes with a single moment', () => {
    const t = timelineLayout([{ label: 'a', year: 2000 }, { label: 'b', year: 2000 }], 300);
    expect(t.every((e) => Number.isFinite(e.x))).toBe(true);
  });
});
