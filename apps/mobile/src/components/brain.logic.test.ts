import { describe, expect, it } from 'vitest';
import { REGION, dendrites, inCortex, mapNetwork, pathways } from './brain.logic';

const nodes = [
  { id: 'n0', parentId: null, pos: { x: 0, y: -240 }, sector: 'science' },
  { id: 'n1', parentId: null, pos: { x: 240, y: 0 }, sector: 'earth' },
  { id: 'n2', parentId: 'n0', pos: { x: 120, y: -900 }, sector: 'science' },
  { id: 'n3', parentId: 'n1', pos: { x: 1400, y: 300 }, sector: 'earth' },
];

describe('brain reveal geometry', () => {
  it('puts the whole network inside the frontal region, roots linked to the core', () => {
    const net = mapNetwork(nodes);
    expect(net.points).toHaveLength(nodes.length + 1);
    for (const p of net.points) expect(Math.hypot(p.x - REGION.x, p.y - REGION.y)).toBeLessThanOrEqual(REGION.r + 1e-6);
    const core = net.points[0]!;
    // the two roots start at the core, the children at their parents
    expect(net.edges[0]!.a).toEqual({ x: core.x, y: core.y });
    expect(net.edges[2]!.a).toEqual({ x: net.points[1]!.x, y: net.points[1]!.y });
    expect(mapNetwork(nodes)).toEqual(net);
  });

  it('copes with a network that is only the core', () => {
    expect(mapNetwork([]).points).toHaveLength(1);
  });

  it('fills the cortex with pathways around the region, the same every time', () => {
    const p = pathways('x', 120);
    expect(p.length).toBeGreaterThan(120);
    for (const c of p) {
      expect(inCortex(c.a)).toBe(true);
      expect(Math.hypot(c.a.x - REGION.x, c.a.y - REGION.y)).toBeGreaterThan(REGION.r);
    }
    expect(pathways('x', 120)).toEqual(p);
  });

  it('grows short dendrites from a cell', () => {
    const d = dendrites({ x: 10, y: 10 }, 'n1', 3, 12);
    expect(d).toHaveLength(3);
    for (const c of d) expect(Math.hypot(c.b.x - 10, c.b.y - 10)).toBeLessThanOrEqual(12 * 1.4 + 1e-6);
  });
});
