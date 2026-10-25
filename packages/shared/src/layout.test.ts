import { describe, expect, it } from 'vitest';
import {
  LAYOUT_VERSION,
  MAX_LINK,
  MOCK_QUESTIONS,
  Pool,
  ROOT_QUESTIONS,
  SECTORS,
  SECTOR_ANGLE,
  breachesOf,
  clampToZone,
  completeNode,
  createNetwork,
  initialPlayer,
  initialUnlockedAreas,
  linksCross,
  migrateSave,
  recordBoss,
  recordCorrect,
  relayout,
  seededRng,
  sectorOfArea,
  traceVia,
  zoneOf,
  zoneOfArea,
  type Link,
  type NetworkState,
  type PlayerState,
} from './index';

const pool = new Pool(MOCK_QUESTIONS);
const DAY = '2026-10-01';

/** Plays with perfect answers, always the oldest open node, breaking every wall it reaches. */
function grow(steps: number): PlayerState {
  let p = initialPlayer(pool);
  for (let i = 0; i < steps; i++) {
    const fw = p.network.firewalls!.find((f) => recordBoss(p, pool, f.id, true).passed);
    if (fw) {
      p = recordBoss(p, pool, fw.id, true).player;
      continue;
    }
    const open = Object.values(p.network.nodes)
      .filter((n) => n.state === 'open')
      .sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));
    if (open.length === 0) break;
    p = recordCorrect(p, pool, open[0]!.id, DAY, 0).player;
  }
  return p;
}

/** The traces as the map draws them, and for each node how far it is from the spot it grew from. */
function traces(net: NetworkState): { links: Link[]; reach: Record<string, number> } {
  const gaps = breachesOf(net.firewalls);
  const links: Link[] = [];
  const reach: Record<string, number> = {};
  for (const n of Object.values(net.nodes)) {
    const from = n.parentId ? net.nodes[n.parentId]!.pos : { x: 0, y: 0 };
    const via = traceVia(gaps, from, n.pos);
    const pts = [from, ...via, n.pos];
    for (let i = 1; i < pts.length; i++) links.push({ a: pts[i - 1]!, b: pts[i]! });
    if (!n.parentId) continue;
    // behind a gap a node grows from the spot just inside its zone
    const start = via.length ? clampToZone(via[via.length - 1]!, zoneOfArea(pool.get(n.questionId).area)) : from;
    reach[n.id] = Math.hypot(n.pos.x - start.x, n.pos.y - start.y);
  }
  return { links, reach };
}

function crossings(links: Link[]): number {
  let c = 0;
  for (let i = 0; i < links.length; i++) for (let j = i + 1; j < links.length; j++) if (linksCross(links[i]!, links[j]!)) c++;
  return c;
}

describe('local growth (D60)', () => {
  it('a bridge in the core leads to a sector next to it, never across the core', () => {
    const opposite = (s: (typeof SECTORS)[number]) =>
      SECTORS.find((o) => Math.abs(Math.cos(SECTOR_ANGLE[o] - SECTOR_ANGLE[s]) + 1) < 1e-9)!;
    for (let i = 0; i < SECTORS.length; i++) {
      for (const seed of ['a', 'b', 'c', 'd', 'e', 'f']) {
        const net = createNetwork(pool, ROOT_QUESTIONS);
        const ctx = { pool, unlockedAreas: initialUnlockedAreas(), skill: {}, interest: {}, rng: seededRng(seed) };
        const r = completeNode(net, `n${i}`, 1, DAY, ctx);
        const root = sectorOfArea(pool.get(net.nodes[`n${i}`]!.questionId).area);
        for (const n of r.spawned) {
          expect(sectorOfArea(pool.get(n.questionId).area), `${root} ${seed}`).not.toBe(opposite(root));
          expect(Math.hypot(n.pos.x - net.nodes[`n${i}`]!.pos.x, n.pos.y - net.nodes[`n${i}`]!.pos.y)).toBeLessThanOrEqual(MAX_LINK + 1);
        }
      }
    }
  });

  it('every new node appears next to the spot it grew from, and the traces do not cross', () => {
    const p = grow(160);
    const { links, reach } = traces(p.network);
    for (const [id, d] of Object.entries(reach)) expect(d, id).toBeLessThanOrEqual(MAX_LINK + 1);
    // before D60 this game drew about a hundred crossings; the exact few depend on the built-in pool
    expect(crossings(links)).toBeLessThanOrEqual(4);
  });

  it('a branch with no topic in reach and its own used up waits instead of running across the map', () => {
    const net = createNetwork(pool, ROOT_QUESTIONS);
    // a physics node deep in the science wedge: the neighbouring sectors are too far away
    const deep = { ...net.nodes['n0']!, id: 'n4', parentId: 'n0', kind: 'deepen' as const, pos: { x: 0, y: -380, z: 0.5 } };
    const physics = MOCK_QUESTIONS.filter((q) => q.area === 'physics').map((q) => q.id);
    const state: NetworkState = { ...net, nodes: { ...net.nodes, n4: deep }, usedQuestions: [...new Set([...net.usedQuestions, ...physics])] };
    const ctx = { pool, unlockedAreas: initialUnlockedAreas(), skill: {}, interest: {}, rng: seededRng('w') };
    const r = completeNode(state, 'n4', 1, DAY, ctx);
    expect(r.spawned).toHaveLength(0);
    expect(r.state.nodes['n4']!.waiting).toEqual(expect.arrayContaining(['deepen', 'bridge']));
  });

  it('an old map is placed anew once, with the same nodes and short links', () => {
    const grown = grow(60);
    // a map from before D60: the same tree, but the places scattered over the map
    const rng = seededRng('scatter');
    const nodes = Object.fromEntries(
      Object.values(grown.network.nodes).map((n) => [
        n.id,
        n.kind === 'root' ? n : { ...n, pos: { ...n.pos, x: (rng() - 0.5) * 1600, y: (rng() - 0.5) * 1600 } },
      ]),
    );
    // and one node hangs on the root on the far side of the core
    const far = Object.values(nodes).find((n) => n.kind !== 'root' && sectorOfArea(pool.get(n.questionId).area) === 'humanities')!;
    nodes[far.id] = { ...far, parentId: 'n0' };
    const old: PlayerState = { ...grown, network: { ...grown.network, nodes, layout: undefined } };
    const m = migrateSave(old, pool);
    expect(m.network.layout).toBe(LAYOUT_VERSION);
    expect(Object.keys(m.network.nodes)).toEqual(Object.keys(nodes));
    for (const n of Object.values(m.network.nodes)) {
      const before = nodes[n.id]!;
      // a node may hang on a nearer node now; everything else stays
      expect({ ...n, pos: before.pos, parentId: before.parentId }).toEqual(before);
      expect(!!n.parentId).toBe(!!before.parentId);
      expect(zoneOf(n.pos.x, n.pos.y), n.id).toBe(n.kind === 'root' ? 'core' : zoneOfArea(pool.get(n.questionId).area));
    }
    expect(m.network.nodes[far.id]!.parentId).not.toBe('n0');
    const { links, reach } = traces(m.network);
    for (const [id, d] of Object.entries(reach)) expect(d, id).toBeLessThanOrEqual(MAX_LINK + 1);
    expect(crossings(links)).toBeLessThanOrEqual(4);
    // placed once: a current map stays as it is
    expect(relayout(m.network, pool)).toBe(m.network);
  });
});
