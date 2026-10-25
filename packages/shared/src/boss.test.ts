import { describe, expect, it } from 'vitest';
import {
  BOSS_PASS,
  BOSS_QUESTIONS,
  BOSS_REWARD,
  CORE_ZONE,
  MOCK_QUESTIONS,
  OUTER_ZONES,
  Pool,
  WALL_MARGIN,
  WALL_RADIUS,
  bossQuestions,
  breachCells,
  createFirewalls,
  fightFrom,
  firewallReached,
  firewallSteps,
  hexDistance,
  initialPlayer,
  recordBoss,
  recordCorrect,
  sectorOfArea,
  WALL_REACH,
  WALL_SIGHT,
  wallTarget,
  wallsInSight,
  worldToHex,
  zoneOf,
  type PlayerState,
} from './index';

const pool = new Pool(MOCK_QUESTIONS);

/** The network already stands at the wall around `area`: the first node moves right in front of it. */
function atWall(p: PlayerState, area: string): PlayerState {
  const z = OUTER_ZONES.find((o) => o.area === area)!;
  const mid = (z.from + z.to) / 2;
  const r = WALL_RADIUS - WALL_MARGIN;
  const n0 = p.network.nodes['n0']!;
  const moved = { ...n0, pos: { ...n0.pos, x: Math.cos(mid) * r, y: Math.sin(mid) * r } };
  return { ...p, network: { ...p.network, nodes: { ...p.network.nodes, n0: moved } } };
}

const fwOf = (p: PlayerState, area: string) => p.network.firewalls!.find((f) => f.area === area)!;

describe('firewalls (bosses)', () => {
  it('stand around the eight outer areas', () => {
    const fws = createFirewalls();
    expect(fws).toHaveLength(8);
    expect(new Set(fws.map((f) => f.id)).size).toBe(8);
    expect(fws.map((f) => f.area)).toEqual(OUTER_ZONES.map((z) => z.area));
    for (const f of fws) expect(f).toMatchObject({ broken: false, attempts: 0 });
  });

  it('draw questions from both sides of the wall, alternating, deterministic', () => {
    for (const fw of createFirewalls()) {
      const qs = bossQuestions(pool, fw, {}, 'physics');
      expect(qs).toHaveLength(BOSS_QUESTIONS);
      expect(qs.map((q) => q.area)).toEqual(['physics', fw.area, 'physics', fw.area]);
      expect(new Set(qs.map((q) => q.id)).size).toBe(BOSS_QUESTIONS);
      expect(bossQuestions(pool, fw, {}, 'physics').map((q) => q.id)).toEqual(qs.map((q) => q.id));
    }
  });

  it('a new attempt can bring different questions', () => {
    const fw = createFirewalls()[0]!;
    const first = bossQuestions(pool, fw, {}, 'physics').map((q) => q.id);
    const later = [1, 2, 3, 4, 5].map((n) => bossQuestions(pool, { ...fw, attempts: n }, {}, 'physics').map((q) => q.id));
    expect(later.some((ids) => ids.join() !== first.join())).toBe(true);
  });

  it('cannot be attacked before the network stands at the wall', () => {
    const p = initialPlayer(pool);
    const fw = fwOf(p, 'biomedicine');
    const nodes = Object.values(p.network.nodes);
    expect(firewallReached(nodes, fw)).toBe(false);
    expect(firewallSteps(nodes, fw)).toBeGreaterThan(1);
    expect(recordBoss(p, pool, fw.id, BOSS_QUESTIONS)).toEqual({ player: p, passed: false, spawned: [], areas: [] });
    const there = atWall(p, 'biomedicine');
    expect(firewallReached(Object.values(there.network.nodes), fw)).toBe(true);
    expect(fightFrom(pool, Object.values(there.network.nodes), fw)).toBe('physics');
    // the wall next to it is still out of reach
    expect(firewallReached(Object.values(there.network.nodes), fwOf(p, 'astronomy'))).toBe(false);
  });

  it('branches lean toward the walls of their own sector until the network reaches them', () => {
    const p = initialPlayer(pool);
    const nodes = Object.values(p.network.nodes);
    const t = wallTarget(p.network.firewalls, nodes, { x: 0, y: -150 }, 'science')!;
    expect(sectorOfArea(t.firewall.area)).toBe('science');
    expect(zoneOf(t.x, t.y)).toBe(t.firewall.area);
    // a reached or broken wall is no target any more
    const reached = atWall(p, t.firewall.area);
    expect(wallTarget(reached.network.firewalls, Object.values(reached.network.nodes), { x: 0, y: -150 }, 'science')?.firewall.id).not.toBe(
      t.firewall.id,
    );
    const broken = p.network.firewalls!.map((f) => ({ ...f, broken: true }));
    expect(wallTarget(broken, nodes, { x: 0, y: 0 }, 'science')).toBeUndefined();
  });

  it('breaking one pays the reward and tears a gap where the network stands', () => {
    const p = atWall(initialPlayer(pool), 'biomedicine');
    const fw = fwOf(p, 'biomedicine');
    const r = recordBoss(p, pool, fw.id, BOSS_PASS);
    expect(r.passed).toBe(true);
    const after = fwOf(r.player, 'biomedicine');
    expect(after.broken).toBe(true);
    expect(after.bought).toBeUndefined();
    expect(after.breach!.from).toBe(CORE_ZONE);
    // the gap is next to the node that stood at the wall
    const n0 = p.network.nodes['n0']!.pos;
    expect(Math.hypot(after.breach!.x - n0.x, after.breach!.y - n0.y)).toBeLessThan(200);
    expect(breachCells('biomedicine', after.breach!).length).toBeGreaterThan(2);
    expect(r.player.gems).toBe(p.gems + BOSS_REWARD.gems);
    expect(r.player.bits).toBe(p.bits + BOSS_REWARD.bits);
    expect(r.areas).toEqual(['biomedicine']);
    expect(r.player.unlockedAreas).toContain('biomedicine');
    // a first node of the area waits right behind the gap
    expect(r.spawned).toHaveLength(1);
    const fresh = r.player.network.nodes[r.spawned[0]!]!;
    expect(pool.get(fresh.questionId).area).toBe('biomedicine');
    expect(zoneOf(fresh.pos.x, fresh.pos.y)).toBe('biomedicine');
    expect(fresh.parentId).toBe('n0');
    expect(Math.hypot(fresh.pos.x - after.breach!.x, fresh.pos.y - after.breach!.y)).toBeLessThan(200);
  });

  it('the area behind the gap grows on its own side', () => {
    const p = atWall(initialPlayer(pool), 'biomedicine');
    const r = recordBoss(p, pool, fwOf(p, 'biomedicine').id, BOSS_QUESTIONS);
    const grown = recordCorrect(r.player, pool, r.spawned[0]!, '2026-10-01', 0);
    for (const id of grown.spawned) {
      const n = grown.player.network.nodes[id]!;
      const area = pool.get(n.questionId).area;
      expect(zoneOf(n.pos.x, n.pos.y)).toBe(area === 'biomedicine' ? 'biomedicine' : CORE_ZONE);
    }
  });

  it('failing costs integrity and counts the attempt, but breaks nothing', () => {
    const p = atWall(initialPlayer(pool), 'technology');
    const fw = fwOf(p, 'technology');
    const r = recordBoss(p, pool, fw.id, BOSS_PASS - 1);
    expect(r.passed).toBe(false);
    expect(r.player.integrity).toBe(p.integrity - 1);
    const after = fwOf(r.player, 'technology');
    expect(after.broken).toBe(false);
    expect(after.breach).toBeUndefined();
    expect(after.attempts).toBe(1);
    expect(r.spawned).toHaveLength(0);
    expect(r.player.unlockedAreas).toEqual(p.unlockedAreas);
  });

  it('leaves the cache alone', () => {
    const p = atWall(initialPlayer(pool), 'biomedicine');
    const withCache = { ...p, cache: [{ questionId: 'sci-light', fragmentId: 'sci-light-f1', file: 'Notiz.txt' }] };
    const r = recordBoss(withCache, pool, fwOf(p, 'biomedicine').id, BOSS_QUESTIONS);
    expect(r.player.cache).toEqual(withCache.cache);
  });

  it('shows only the walls the network has come close to', () => {
    const p = initialPlayer(pool);
    expect(wallsInSight(Object.values(p.network.nodes), p.network.firewalls!)).toEqual({ cells: [], signs: [] });
    const there = atWall(p, 'biomedicine');
    const sight = wallsInSight(Object.values(there.network.nodes), there.network.firewalls!);
    expect(sight.cells.length).toBeGreaterThan(3);
    for (const c of sight.cells) expect(c.away).toBeLessThanOrEqual(WALL_SIGHT);
    expect(sight.cells.some((c) => c.look === 'active' && c.firewall === 'fw-biomedicine')).toBe(true);
    const sign = sight.signs.find((s) => s.area === 'biomedicine')!;
    expect(sign).toMatchObject({ reached: true });
    // the sign names the node at the wall, where the trace to the wall starts
    const at = there.network.nodes[sign.node]!;
    expect(hexDistance(worldToHex(at.pos.x, at.pos.y), worldToHex(sign.x, sign.y))).toBeLessThanOrEqual(WALL_REACH);
    // once broken, the gap shows and the rest of that wall guards nothing any more
    const r = recordBoss(there, pool, 'fw-biomedicine', BOSS_QUESTIONS).player;
    const after = wallsInSight(Object.values(r.network.nodes), r.network.firewalls!);
    expect(after.cells.some((c) => c.look === 'gap')).toBe(true);
    expect(after.cells.some((c) => c.firewall === 'fw-biomedicine')).toBe(false);
    expect(after.signs.some((s) => s.area === 'biomedicine')).toBe(false);
  });

  it('can only be broken once', () => {
    const p = atWall(initialPlayer(pool), 'biomedicine');
    const fw = fwOf(p, 'biomedicine');
    const once = recordBoss(p, pool, fw.id, BOSS_QUESTIONS).player;
    const again = recordBoss(once, pool, fw.id, BOSS_QUESTIONS);
    expect(again.passed).toBe(false);
    expect(again.player).toBe(once);
  });
});
