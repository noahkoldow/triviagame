import { describe, expect, it } from 'vitest';
import {
  MOCK_QUESTIONS,
  Pool,
  SECTOR_ANGLE,
  areaDistance,
  createOutposts,
  initialPlayer,
  initialUnlockedAreas,
  placeNode,
  recordCorrect,
  rootPosition,
  sectorOfArea,
  steerTarget,
  unlockArea,
} from './index';

const pool = new Pool(MOCK_QUESTIONS);

describe('outposts', () => {
  it('scatters one disturbed outpost per area that is not open yet', () => {
    const o = createOutposts(initialUnlockedAreas());
    expect(o).toHaveLength(AREAS.length - initialUnlockedAreas().length);
    expect(o.every((x) => !x.connected)).toBe(true);
    for (const a of o) {
      let d = Math.atan2(a.y, a.x) - SECTOR_ANGLE[sectorOfArea(a.area)];
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      expect(Math.abs(d)).toBeLessThan(0.8);
      expect(Math.hypot(a.x, a.y)).toBeGreaterThan(700);
    }
    expect(createOutposts(initialUnlockedAreas())).toEqual(o);
  });

  it('measures how far two topics are apart', () => {
    expect(areaDistance('physics', 'physics')).toBe(0);
    expect(areaDistance('physics', 'biomedicine')).toBe(1);
    expect(areaDistance('biomedicine', 'physics')).toBe(1);
    expect(areaDistance('physics', 'economy')).toBe(2);
  });

  it('points a branch to the nearest disturbed outpost of its own sector', () => {
    const o = createOutposts(initialUnlockedAreas());
    const t = steerTarget(o, { x: 0, y: -200 }, 'science')!;
    expect(sectorOfArea(t.area)).toBe('science');
    expect(steerTarget(o.map((x) => ({ ...x, connected: true })), { x: 0, y: 0 }, 'science')).toBeUndefined();
  });

  it('bends new nodes toward the target', () => {
    const parent = { ...rootPosition('science') };
    const target = { x: 900, y: -700 };
    const base = { parent, kind: 'deepen' as const, mainSector: 'science' as const, existing: [parent], seed: 'x' };
    const plain = placeNode(base);
    const leaning = placeNode({ ...base, target: { ...target, pull: 0.7 } });
    const dist = (p: { x: number; y: number }) => Math.hypot(p.x - target.x, p.y - target.y);
    expect(dist(leaning)).toBeLessThan(dist(plain));
  });

  it('connects an outpost when growth reaches it and opens its area', () => {
    const p0 = initialPlayer(pool);
    const n0 = p0.network.nodes['n0']!;
    // put the biomedicine outpost right next to the first node
    const outposts = p0.network.outposts!.map((o) =>
      o.area === 'biomedicine' ? { ...o, x: n0.pos.x, y: n0.pos.y } : o,
    );
    const p = { ...p0, network: { ...p0.network, outposts } };
    const r = recordCorrect(p, pool, 'n0', '2026-10-01', 0);
    expect(r.reachedAreas).toEqual(['biomedicine']);
    expect(r.player.unlockedAreas).toContain('biomedicine');
    expect(r.player.network.outposts!.find((o) => o.area === 'biomedicine')!.connected).toBe(true);
    const fresh = r.spawned.map((id) => r.player.network.nodes[id]!);
    expect(fresh.some((n) => pool.get(n.questionId).area === 'biomedicine')).toBe(true);
  });

  it('replace the locked debris fields: no locked nodes spawn any more', () => {
    let p = initialPlayer(pool);
    for (let i = 0; i < 12; i++) {
      const open = Object.values(p.network.nodes).find((n) => n.state === 'open');
      if (!open) break;
      p = recordCorrect(p, pool, open.id, '2026-10-01', 0).player;
    }
    expect(Object.values(p.network.nodes).filter((n) => n.locked || n.kind === 'debris')).toHaveLength(0);
  });

  it('can be connected with gems', () => {
    const p = { ...initialPlayer(pool), gems: 100 };
    const u = unlockArea(p, 'biomedicine', pool)!;
    expect(u.unlockedAreas).toContain('biomedicine');
    expect(u.network.outposts!.find((o) => o.area === 'biomedicine')!.connected).toBe(true);
    expect(Object.values(u.network.nodes).some((n) => pool.get(n.questionId).area === 'biomedicine')).toBe(true);
    // without a pool it only opens the area
    expect(unlockArea(p, 'biomedicine')!.network.outposts!.find((o) => o.area === 'biomedicine')!.connected).toBe(false);
  });
});

describe('question texts', () => {
  it('every question has a keyword and a short intro', () => {
    for (const q of MOCK_QUESTIONS) {
      expect(q.topic.length, q.id).toBeGreaterThan(2);
      expect(q.intro.length, q.id).toBeGreaterThan(20);
      expect(q.intro.length, q.id).toBeLessThan(160);
    }
  });
});

import { AREAS, footprint } from './index';

describe('knowledge footprint', () => {
  it('is empty at the start and has one entry per area', () => {
    const f = footprint(initialPlayer(pool), pool);
    expect(f).toHaveLength(AREAS.length);
    expect(f.every((a) => a.solved === 0 && a.depth === 0 && a.coverage === 0)).toBe(true);
  });

  it('grows where the player solved something', () => {
    const p = recordCorrect(initialPlayer(pool), pool, 'n0', '2026-10-01', 0).player;
    const f = footprint(p, pool);
    const physics = f.find((a) => a.area === 'physics')!;
    expect(physics.solved).toBe(1);
    expect(physics.depth).toBeGreaterThan(0);
    expect(physics.coverage).toBeGreaterThan(0);
    expect(physics.coverage).toBeLessThanOrEqual(1);
    expect(f.find((a) => a.area === 'arts')!.solved).toBe(0);
  });
});
