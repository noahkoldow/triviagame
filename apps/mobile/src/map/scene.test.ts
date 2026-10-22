import { describe, expect, it, vi } from 'vitest';

// Skia's native objects are replaced by recorders; this checks the map logic, not the drawing.
vi.mock('@shopify/react-native-skia', () => {
  const builder = () => {
    const calls: unknown[][] = [];
    const rec = (name: string) => (...a: unknown[]) => {
      calls.push([name, ...a]);
    };
    return {
      moveTo: rec('moveTo'),
      lineTo: rec('lineTo'),
      quadTo: rec('quadTo'),
      addCircle: rec('addCircle'),
      close: rec('close'),
      detach: () => ({ calls }),
    };
  };
  return { Skia: { PathBuilder: { Make: builder } }, PaintStyle: { Fill: 0, Stroke: 1 } };
});
vi.mock('react-native-reanimated', () => ({ useDerivedValue: (f: () => unknown) => ({ value: f() }) }));

import {
  MOCK_QUESTIONS,
  Pool,
  initialPlayer,
  recordCorrect,
  recordWrong,
  sectorOfArea,
  snapToHex,
} from '@nexus/shared';
import { buildHexScene, type TraceEdge } from './hexmap';
import { buildStrand, type Site } from './scenery';

const pool = new Pool(MOCK_QUESTIONS);

function sitesAndEdges(p: ReturnType<typeof initialPlayer>): { sites: Site[]; edges: TraceEdge[] } {
  const nodes = Object.values(p.network.nodes).map((n) => ({ ...n, pos: { ...n.pos, ...snapToHex(n.pos.x, n.pos.y) } }));
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const sites: Site[] = nodes.map((n) => {
    const area = pool.get(n.questionId).area;
    return {
      id: n.id,
      x: n.pos.x,
      y: n.pos.y,
      area,
      sector: sectorOfArea(area),
      state: n.locked ? 'locked' : n.state,
      noise: n.state === 'damaged' || (n.state === 'open' && n.attempts > 0),
    };
  });
  for (const o of p.network.outposts ?? []) {
    if (o.connected) continue;
    sites.push({ id: o.id, ...snapToHex(o.x, o.y), area: o.area, sector: sectorOfArea(o.area), state: 'locked', noise: true });
  }
  const edges: TraceEdge[] = nodes.map((n) => ({
    from: n.parentId ? byId[n.parentId]!.pos : { x: 0, y: 0 },
    to: n.pos,
    sector: sectorOfArea(pool.get(n.questionId).area),
    lit: n.state !== 'open',
  }));
  return { sites, edges };
}

describe('map scene', () => {
  it('loads the node and chip drawings (module-level paths)', async () => {
    const v = await import('./NodeViews');
    expect(typeof v.CoreTile).toBe('function');
    expect(typeof v.NodeTile).toBe('function');
    expect(typeof v.OutpostTile).toBe('function');
  });

  it('builds for a fresh game with outposts', () => {
    const { sites, edges } = sitesAndEdges(initialPlayer(pool));
    const s = buildHexScene(sites, edges);
    expect(s.tiles.length).toBeGreaterThan(100);
    expect(s.circuit.length).toBeGreaterThan(0);
    expect(s.noise).toHaveLength(3);
    expect(s.ghosts.length).toBeGreaterThan(0);
  });

  it('builds after a few answers, with damaged nodes and the preview strand', () => {
    let p = initialPlayer(pool);
    p = recordWrong(p, pool, 'n0');
    p = recordWrong(p, pool, 'n0');
    p = recordCorrect(p, pool, 'n0', '2026-10-01', 0).player;
    p = recordCorrect(p, pool, 'n1', '2026-10-01', 0).player;
    const { sites, edges } = sitesAndEdges(p);
    const strand = buildStrand();
    const s = buildHexScene([...sites, ...strand], edges);
    expect(s.tiles.length).toBeGreaterThan(200);
    // no two tiles in the same cell
    const keys = new Set(s.tiles.map((t) => `${Math.round(t.x)},${Math.round(t.y)}`));
    expect(keys.size).toBe(s.tiles.length);
  });
});
