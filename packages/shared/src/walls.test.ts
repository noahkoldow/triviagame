import { describe, expect, it } from 'vitest';
import {
  AREAS,
  CORE_ZONE,
  MOCK_QUESTIONS,
  OUTER_ZONES,
  Pool,
  SECTOR_ANGLE,
  WALL_MARGIN,
  WALL_OUTER,
  WALL_RADIUS,
  areaDistance,
  breachCells,
  breachesOf,
  clampToZone,
  footprint,
  hexDistance,
  hexKey,
  hexNeighbors,
  hexToWorld,
  initialPlayer,
  initialUnlockedAreas,
  migrateSave,
  moveBreach,
  wallsOfLayout,
  placeNode,
  recordBoss,
  recordCorrect,
  rootPosition,
  sectorOfArea,
  unlockArea,
  wallBetween,
  wallCells,
  worldToHex,
  zoneOf,
  zoneOfArea,
  zoneRoute,
  type PlayerState,
} from './index';
import { servedPool } from './served.testutil';

const pool = servedPool();
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

describe('zones', () => {
  it('put the starting areas in the core and every other area in a slice of its own sector', () => {
    for (const a of initialUnlockedAreas()) expect(zoneOfArea(a)).toBe(CORE_ZONE);
    const outer = AREAS.filter((a) => !initialUnlockedAreas().includes(a.id)).map((a) => a.id);
    expect(OUTER_ZONES.map((z) => z.area).sort()).toEqual([...outer].sort());
    expect(zoneOf(0, 0)).toBe(CORE_ZONE);
    expect(zoneOf(0, -(WALL_RADIUS - 1))).toBe(CORE_ZONE);
    for (const z of OUTER_ZONES) {
      const mid = (z.from + z.to) / 2;
      const p = { x: Math.cos(mid) * (WALL_RADIUS + 330), y: Math.sin(mid) * (WALL_RADIUS + 330) };
      expect(zoneOf(p.x, p.y)).toBe(z.area);
      expect(zoneOfArea(z.area)).toBe(z.area);
      // the slice lies inside the wedge of its sector (science points up)
      const off = Math.atan2(Math.sin(mid - SECTOR_ANGLE[sectorOfArea(z.area)]), Math.cos(mid - SECTOR_ANGLE[sectorOfArea(z.area)]));
      expect(Math.abs(off)).toBeLessThan(Math.PI / 4);
    }
    const out = WALL_RADIUS + 330;
    expect(zoneOf(10, -out)).toBe('biomedicine');
    expect(zoneOf(-10, -out)).toBe('technology');
    expect(zoneOf(-out, 10)).toBe('law');
    expect(zoneOf(-out, -10)).toBe('economy');
  });

  it('are closed: no way leads from the core outward or between two slices without crossing a wall', () => {
    const wall = new Set(wallCells().map((c) => c.key));
    const limit = WALL_OUTER - 100;
    // flood the free cells from the core and from the middle of every slice
    const starts = [{ x: 0, y: 0 }, ...OUTER_ZONES.map((z) => ({ x: Math.cos((z.from + z.to) / 2) * (WALL_RADIUS + 430), y: Math.sin((z.from + z.to) / 2) * (WALL_RADIUS + 430) }))];
    for (const s of starts) {
      const zone = zoneOf(s.x, s.y);
      const start = worldToHex(s.x, s.y);
      const seen = new Set([hexKey(start)]);
      let frontier = [start];
      while (frontier.length) {
        const next = [];
        for (const h of frontier) {
          for (const nb of hexNeighbors(h)) {
            const k = hexKey(nb);
            const w = hexToWorld(nb);
            if (seen.has(k) || wall.has(k) || Math.hypot(w.x, w.y) > limit) continue;
            expect(zoneOf(w.x, w.y), `from ${zone}`).toBe(zone);
            seen.add(k);
            next.push(nb);
          }
        }
        frontier = next;
      }
      expect(seen.size).toBeGreaterThan(100);
    }
  });

  it('keeps clamped points away from the walls of their zone', () => {
    const zones = [CORE_ZONE, ...OUTER_ZONES.map((z) => z.area)];
    for (let i = 0; i < 200; i++) {
      const p = { x: Math.cos(i * 2.39) * (i * 9), y: Math.sin(i * 2.39) * (i * 9) };
      for (const zone of zones) {
        const c = clampToZone(p, zone);
        expect(zoneOf(c.x, c.y), `${zone} ${i}`).toBe(zone);
        const h = worldToHex(c.x, c.y);
        const near = Math.min(...wallCells().map((w) => hexDistance(w.hex, h)));
        expect(near, `${zone} ${i}`).toBeGreaterThanOrEqual(2);
        if (zoneOf(p.x, p.y) === zone && Math.hypot(c.x - p.x, c.y - p.y) > 0) {
          // a point inside its zone only moves when it was too close to a wall (in a corner of
          // a slice, away from two walls at once)
          expect(Math.hypot(c.x - p.x, c.y - p.y)).toBeLessThanOrEqual((WALL_MARGIN + 43) * Math.SQRT2);
        }
      }
    }
  });

  it('places a new node on its own side of the walls, even when it is pulled outward', () => {
    const parent = { x: 0, y: -(WALL_RADIUS - WALL_MARGIN), z: 0.5 };
    for (let i = 0; i < 60; i++) {
      const p = placeNode({
        parent,
        kind: i % 2 ? 'deepen' : 'bridge',
        mainSector: 'science',
        existing: [parent],
        seed: `s${i}`,
        target: { x: 0, y: -2000, pull: 0.9 },
        zone: CORE_ZONE,
      });
      expect(zoneOf(p.x, p.y)).toBe(CORE_ZONE);
      expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(WALL_RADIUS - WALL_MARGIN + 0.01);
    }
  });

  it('bends new nodes toward the target', () => {
    const parent = { ...rootPosition('science') };
    const target = { x: 300, y: -300 };
    const base = { parent, kind: 'deepen' as const, mainSector: 'science' as const, existing: [parent], seed: 'x', zone: CORE_ZONE };
    const plain = placeNode(base);
    const leaning = placeNode({ ...base, target: { ...target, pull: 0.7 } });
    const dist = (p: { x: number; y: number }) => Math.hypot(p.x - target.x, p.y - target.y);
    expect(dist(leaning)).toBeLessThan(dist(plain));
  });

  it('measures how far two topics are apart', () => {
    expect(areaDistance('physics', 'physics')).toBe(0);
    expect(areaDistance('physics', 'biomedicine')).toBe(1);
    expect(areaDistance('biomedicine', 'physics')).toBe(1);
    expect(areaDistance('physics', 'economy')).toBe(2);
  });
});

describe('walls', () => {
  it('separate every outer area from the core and from its neighbours, but not from areas across', () => {
    for (const [i, z] of OUTER_ZONES.entries()) {
      expect(wallBetween(z.area, CORE_ZONE).length).toBeGreaterThan(5);
      const next = OUTER_ZONES[(i + 1) % OUTER_ZONES.length]!.area;
      expect(wallBetween(z.area, next).length).toBeGreaterThan(20);
      const across = OUTER_ZONES[(i + 4) % OUTER_ZONES.length]!.area;
      expect(wallBetween(z.area, across)).toHaveLength(0);
    }
  });

  it('a gap takes out a few cells of the wall between the two zones', () => {
    const cell = wallBetween('biomedicine', CORE_ZONE)[3]!;
    const gap = breachCells('biomedicine', { x: cell.x, y: cell.y, from: CORE_ZONE });
    expect(gap.length).toBeGreaterThanOrEqual(3);
    expect(gap.length).toBeLessThanOrEqual(7);
    for (const g of gap) expect(g.zones).toEqual(expect.arrayContaining(['biomedicine', CORE_ZONE]));
  });

  it('moves a gap from the smaller walls before onto the same spot of the bigger walls', () => {
    const cell = wallBetween('biomedicine', CORE_ZONE)[3]!;
    // the ring lay at 470 before
    const old = { x: (cell.x * 470) / WALL_RADIUS, y: (cell.y * 470) / WALL_RADIUS, from: CORE_ZONE };
    expect(breachCells('biomedicine', old)).toHaveLength(0);
    const moved = moveBreach('biomedicine', old, wallsOfLayout(2));
    expect(Math.hypot(moved.x - cell.x, moved.y - cell.y)).toBeLessThan(60);
    expect(breachCells('biomedicine', moved).length).toBeGreaterThanOrEqual(3);
    // a gap on its wall stays
    const now = { x: cell.x, y: cell.y, from: CORE_ZONE };
    expect(moveBreach('biomedicine', now, wallsOfLayout(2))).toBe(now);
  });

  it.each([2, 3])('a save from layout %i gets its gaps moved onto the current walls and its nodes into their zones', (layout) => {
    const p = grow(160);
    const was = wallsOfLayout(layout);
    const scale = (v: { x: number; y: number }) => {
      const r = Math.hypot(v.x, v.y);
      const k =
        r <= WALL_RADIUS + 50
          ? was.radius / WALL_RADIUS
          : (was.radius + ((r - WALL_RADIUS) * (was.outer - was.radius)) / (WALL_OUTER - WALL_RADIUS)) / r;
      return { x: v.x * k, y: v.y * k };
    };
    // the same map as it lay with the walls of that layout
    const nodes = Object.fromEntries(Object.values(p.network.nodes).map((n) => [n.id, { ...n, pos: { ...n.pos, ...scale(n.pos) } }]));
    const firewalls = p.network.firewalls!.map((f) => (f.breach ? { ...f, breach: { ...f.breach, ...scale(f.breach) } } : f));
    const old: PlayerState = { ...p, network: { ...p.network, nodes, firewalls, layout } };
    const m = migrateSave(old, pool);
    for (const f of m.network.firewalls!.filter((x) => x.breach)) expect(breachCells(f.area, f.breach!).length, f.area).toBeGreaterThan(0);
    for (const n of Object.values(m.network.nodes)) {
      const zone = n.kind === 'root' ? CORE_ZONE : zoneOfArea(pool.get(n.questionId).area);
      expect(zoneOf(n.pos.x, n.pos.y), n.id).toBe(zone);
    }
  });

  it('routes between zones through the gaps', () => {
    const a = { area: 'biomedicine', breach: { x: 1, y: -480, from: CORE_ZONE } };
    const b = { area: 'climate', breach: { x: 600, y: -300, from: 'biomedicine' } };
    expect(zoneRoute([a, b], CORE_ZONE, CORE_ZONE)).toEqual([]);
    expect(zoneRoute([a, b], CORE_ZONE, 'climate')).toEqual([a.breach, b.breach]);
    expect(zoneRoute([a, b], 'climate', CORE_ZONE)).toEqual([b.breach, a.breach]);
    expect(zoneRoute([a], CORE_ZONE, 'climate')).toBeUndefined();
  });

  it('the network grows only on its side of the walls and enters an area through its gap', () => {
    const p = grow(160);
    const opened = p.network.firewalls!.filter((f) => f.broken);
    expect(opened.length).toBeGreaterThanOrEqual(4);
    const breaches = breachesOf(p.network.firewalls);
    for (const n of Object.values(p.network.nodes)) {
      const area = pool.get(n.questionId).area;
      expect(zoneOf(n.pos.x, n.pos.y), `${n.id} ${area}`).toBe(zoneOfArea(area));
      // a branch into another zone passes through gaps all the way
      const parent = n.parentId ? p.network.nodes[n.parentId]! : undefined;
      if (parent) expect(zoneRoute(breaches, zoneOf(parent.pos.x, parent.pos.y), zoneOfArea(area)), n.id).toBeDefined();
    }
    for (const f of opened) {
      const own = Object.values(p.network.nodes).filter((n) => pool.get(n.questionId).area === f.area);
      expect(own.length, f.area).toBeGreaterThan(0);
    }
  });

  it('replace the locked debris fields: no locked nodes spawn any more', () => {
    let p = initialPlayer(pool);
    for (let i = 0; i < 12; i++) {
      const open = Object.values(p.network.nodes).find((n) => n.state === 'open');
      if (!open) break;
      p = recordCorrect(p, pool, open.id, DAY, 0).player;
    }
    expect(Object.values(p.network.nodes).filter((n) => n.locked || n.kind === 'debris')).toHaveLength(0);
  });

  it('an area bought with gems opens through a gap where the network comes closest', () => {
    const p = { ...initialPlayer(pool), gems: 100 };
    const u = unlockArea(p, 'biomedicine', pool)!;
    expect(u.unlockedAreas).toContain('biomedicine');
    const fw = u.network.firewalls!.find((f) => f.area === 'biomedicine')!;
    expect(fw).toMatchObject({ broken: true, bought: true });
    expect(fw.breach!.from).toBe(CORE_ZONE);
    const fresh = Object.values(u.network.nodes).filter((n) => pool.get(n.questionId).area === 'biomedicine');
    expect(fresh).toHaveLength(1);
    expect(zoneOf(fresh[0]!.pos.x, fresh[0]!.pos.y)).toBe('biomedicine');
    // without a pool it only opens the area and the wall
    const bare = unlockArea(p, 'biomedicine')!;
    expect(bare.unlockedAreas).toContain('biomedicine');
    expect(Object.keys(bare.network.nodes)).toHaveLength(Object.keys(p.network.nodes).length);
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

describe('knowledge footprint', () => {
  it('is empty at the start and has one entry per area', () => {
    const f = footprint(initialPlayer(pool), pool);
    expect(f).toHaveLength(AREAS.length);
    expect(f.every((a) => a.solved === 0 && a.depth === 0 && a.coverage === 0)).toBe(true);
  });

  it('grows where the player solved something', () => {
    const p = recordCorrect(initialPlayer(pool), pool, 'n0', DAY, 0).player;
    const f = footprint(p, pool);
    const physics = f.find((a) => a.area === 'physics')!;
    expect(physics.solved).toBe(1);
    expect(physics.depth).toBeGreaterThan(0);
    expect(physics.coverage).toBeGreaterThan(0);
    expect(physics.coverage).toBeLessThanOrEqual(1);
    expect(f.find((a) => a.area === 'arts')!.solved).toBe(0);
  });
});
