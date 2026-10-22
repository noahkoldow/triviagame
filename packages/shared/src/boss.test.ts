import { describe, expect, it } from 'vitest';
import {
  BOSS_PASS,
  BOSS_QUESTIONS,
  BOSS_REWARD,
  MOCK_QUESTIONS,
  Pool,
  SECTORS,
  bossQuestions,
  createFirewalls,
  initialPlayer,
  recordBoss,
  sectorOfArea,
} from './index';

const pool = new Pool(MOCK_QUESTIONS);

describe('firewalls (bosses)', () => {
  it('stand on the four borders between neighbouring sectors', () => {
    const fws = createFirewalls();
    expect(fws).toHaveLength(4);
    expect(new Set(fws.map((f) => f.id)).size).toBe(4);
    for (const f of fws) {
      expect(SECTORS).toContain(f.a);
      expect(SECTORS).toContain(f.b);
      expect(f.a).not.toBe(f.b);
      expect(Math.hypot(f.x, f.y)).toBeCloseTo(640, 3);
      expect(f.broken).toBe(false);
    }
    // the first one sits between science (up) and nature (right): up and to the right
    expect(fws[0]!.x).toBeGreaterThan(0);
    expect(fws[0]!.y).toBeLessThan(0);
  });

  it('draw questions from both sectors, alternating, deterministic', () => {
    for (const fw of createFirewalls()) {
      const qs = bossQuestions(pool, fw, {});
      expect(qs).toHaveLength(BOSS_QUESTIONS);
      expect(qs.map((q) => sectorOfArea(q.area))).toEqual([fw.a, fw.b, fw.a, fw.b]);
      expect(new Set(qs.map((q) => q.id)).size).toBe(BOSS_QUESTIONS);
      expect(bossQuestions(pool, fw, {}).map((q) => q.id)).toEqual(qs.map((q) => q.id));
    }
  });

  it('a new attempt can bring different questions', () => {
    const fw = createFirewalls()[0]!;
    const first = bossQuestions(pool, fw, {}).map((q) => q.id);
    const later = [1, 2, 3, 4, 5].map((n) => bossQuestions(pool, { ...fw, attempts: n }, {}).map((q) => q.id));
    expect(later.some((ids) => ids.join() !== first.join())).toBe(true);
  });

  it('breaking one pays the reward and opens a new zone in both sectors', () => {
    const p = initialPlayer(pool);
    const fw = p.network.firewalls![0]!;
    const r = recordBoss(p, pool, fw.id, BOSS_PASS);
    expect(r.passed).toBe(true);
    expect(r.player.network.firewalls!.find((f) => f.id === fw.id)!.broken).toBe(true);
    expect(r.player.gems).toBe(p.gems + BOSS_REWARD.gems);
    expect(r.player.bits).toBe(p.bits + BOSS_REWARD.bits);
    expect(r.areas).toHaveLength(2);
    expect(new Set(r.areas.map((a) => sectorOfArea(a)))).toEqual(new Set([fw.a, fw.b]));
    for (const a of r.areas) expect(r.player.unlockedAreas).toContain(a);
    expect(r.spawned.length).toBeGreaterThan(0);
  });

  it('failing costs integrity and counts the attempt, but breaks nothing', () => {
    const p = initialPlayer(pool);
    const fw = p.network.firewalls![1]!;
    const r = recordBoss(p, pool, fw.id, BOSS_PASS - 1);
    expect(r.passed).toBe(false);
    expect(r.player.integrity).toBe(p.integrity - 1);
    const after = r.player.network.firewalls!.find((f) => f.id === fw.id)!;
    expect(after.broken).toBe(false);
    expect(after.attempts).toBe(1);
    expect(r.spawned).toHaveLength(0);
    expect(r.player.unlockedAreas).toEqual(p.unlockedAreas);
  });

  it('leaves the cache alone', () => {
    const p = initialPlayer(pool);
    const withCache = { ...p, cache: [{ questionId: 'sci-light', fragmentId: 'sci-light-f1' }] };
    const r = recordBoss(withCache, pool, p.network.firewalls![0]!.id, BOSS_QUESTIONS);
    expect(r.player.cache).toEqual(withCache.cache);
  });

  it('can only be broken once', () => {
    const p = initialPlayer(pool);
    const fw = p.network.firewalls![0]!;
    const once = recordBoss(p, pool, fw.id, BOSS_QUESTIONS).player;
    const again = recordBoss(once, pool, fw.id, BOSS_QUESTIONS);
    expect(again.passed).toBe(false);
    expect(again.player).toBe(once);
  });
});
