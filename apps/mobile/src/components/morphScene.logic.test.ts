import { describe, expect, it } from 'vitest';
import {
  SOURCE,
  buildCells,
  buildLinks,
  cellState,
  noiseActivity,
  speckles,
} from './morphScene.logic';

describe('intro scene', () => {
  const cells = buildCells();

  it('has a 37-cell network with a core and neighbouring links', () => {
    expect(cells).toHaveLength(37);
    expect(cells.filter((c) => c.ring === 0)).toHaveLength(1);
    const links = buildLinks(cells);
    expect(links.length).toBeGreaterThan(80);
    for (const [a, b] of links) expect(a).toBeLessThan(b);
  });

  it('breaks from MORPH outward: cells near it fall before the far ones (on average)', () => {
    const d = (c: (typeof cells)[number]) => Math.hypot(c.x - SOURCE.x, c.y - SOURCE.y);
    const sorted = [...cells].sort((a, b) => d(a) - d(b));
    const avg = (xs: typeof cells) => xs.reduce((t, c) => t + c.thr, 0) / xs.length;
    expect(avg(sorted.slice(0, 10))).toBeLessThan(avg(sorted.slice(-10)));
  });

  it('everything is healthy at first and dead at the end', () => {
    expect(cells.every((c) => cellState(c, 0, 0) === 'healthy')).toBe(true);
    expect(cells.every((c) => cellState(c, 1.2, 0) === 'dead')).toBe(true);
  });

  it('passes through a flickering state on the way', () => {
    for (const c of cells) {
      const seen = new Set<string>();
      for (let a = 0; a <= 1.2; a += 0.01) seen.add(cellState(c, a, 0));
      expect(seen.has('noisy'), `cell ${c.q},${c.r}`).toBe(true);
    }
  });

  it('only a spark around the core comes back', () => {
    const relit = cells.filter((c) => cellState(c, 1.2, 1) === 'relit');
    expect(relit.length).toBeGreaterThan(0);
    expect(relit.every((c) => c.ring <= 1)).toBe(true);
    expect(cells.filter((c) => cellState(c, 1.2, 1) === 'dead').length).toBeGreaterThan(20);
  });

  it('static swells and fades, and is deterministic', () => {
    expect(noiseActivity(0, 0)).toBe(0);
    expect(noiseActivity(0.5, 0)).toBeGreaterThan(noiseActivity(0.1, 0));
    expect(noiseActivity(1, 1)).toBeLessThan(noiseActivity(1, 0));
    const box = { x0: -100, y0: -100, x1: 100, y1: 100 };
    expect(speckles(3, 0.8, box)).toEqual(speckles(3, 0.8, box));
    expect(speckles(3, 0, box)).toHaveLength(0);
    expect(speckles(4, 1, box).length).toBeGreaterThan(30);
  });
});
