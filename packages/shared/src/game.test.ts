import { describe, expect, it } from 'vitest';
import {
  MOCK_QUESTIONS,
  Pool,
  chooseNode,
  dueReviews,
  initialPlayer,
  openDebris,
  recordCorrect,
  recordReviewResult,
  recordWrong,
  unlockArea,
  spendRewind,
  buyCosmetic,
  CACHE_SLOTS,
  cacheAdd,
  cacheDrop,
  cacheSwap,
  debrisOffsets,
} from './index';

const pool = new Pool(MOCK_QUESTIONS);

describe('player flow', () => {
  it('grows the network and pays rewards on a correct answer', () => {
    const p0 = chooseNode(initialPlayer(pool), pool, 'n0');
    expect(p0.interest['physics']!.a).toBeGreaterThan(1);
    const r = recordCorrect(p0, pool, 'n0', '2026-10-01', 0);
    expect(r.spawned.length).toBeGreaterThanOrEqual(2);
    expect(r.player.xp).toBeGreaterThan(0);
    expect(r.player.streak.count).toBe(1);
    expect(Object.keys(r.player.codex).length).toBeGreaterThan(0);
    // decoys never enter the codex
    expect(Object.keys(r.player.codex).some((id) => id.startsWith('sci-light-f4'))).toBe(false);
  });

  it('wrong answers cost integrity, count attempts and feed the ad counter', () => {
    let p = initialPlayer(pool);
    p = recordWrong(p, pool, 'n0');
    p = recordWrong(p, pool, 'n0');
    expect(p.integrity).toBe(3);
    expect(p.network.nodes['n0']!.attempts).toBe(2);
    expect(p.ads.wrongSinceInterstitial).toBe(2);
    expect(p.skill['physics']!).toBeLessThan(1000);
  });

  it('a node needing three tries becomes damaged and returns for review', () => {
    let p = initialPlayer(pool);
    p = recordWrong(recordWrong(p, pool, 'n0'), pool, 'n0');
    const r = recordCorrect(p, pool, 'n0', '2026-10-01', 0);
    expect(r.player.network.nodes['n0']!.state).toBe('damaged');
    expect(dueReviews(r.player, '2026-10-01')).toEqual([]);
    expect(dueReviews(r.player, '2026-10-02')).toEqual(['n0']);
    const rev = recordReviewResult(r.player, pool, 'n0', true, '2026-10-02');
    expect(rev.player.network.nodes['n0']!.box).toBe(2);
    expect(rev.reward.xp).toBeGreaterThan(0);
  });

  it('halves rewards when integrity is empty', () => {
    const full = recordCorrect(initialPlayer(pool), pool, 'n0', '2026-10-01', 0).reward;
    const empty = recordCorrect(
      { ...initialPlayer(pool), integrity: 0 },
      pool,
      'n0',
      '2026-10-01',
      0,
    ).reward;
    expect(empty.xp).toBeLessThan(full.xp);
  });

  it('spends energy on rewinds only while available', () => {
    const p = initialPlayer(pool);
    expect(spendRewind(p)!.energy).toBe(p.energy - 1);
    expect(spendRewind({ ...p, energy: 0 })).toBeNull();
  });

  it('unlocks areas and debris with gems, never below zero', () => {
    const p = initialPlayer(pool);
    expect(unlockArea(p, 'chemistry')).toBeNull(); // costs 15, we have 5
    const rich = { ...p, gems: 40 };
    const u = unlockArea(rich, 'chemistry')!;
    expect(u.gems).toBe(25);
    expect(u.unlockedAreas).toContain('chemistry');
    expect(unlockArea(u, 'chemistry')).toBeNull();
    expect(openDebris(rich, 'n0')).toBeNull(); // not a locked debris node
  });

  it('sells cosmetics for bits', () => {
    const p = { ...initialPlayer(pool), bits: 100 };
    const b = buyCosmetic(p, 'lime')!;
    expect(b.bits).toBe(40);
    expect(b.activeCosmetic).toBe('lime');
    expect(buyCosmetic(b, 'gold')).toBeNull();
  });
});

describe('cache', () => {
  const e = (f: string, q = 'sci-light') => ({ questionId: q, fragmentId: f });

  it('holds at most CACHE_SLOTS fragments and rejects duplicates', () => {
    let p = initialPlayer(pool);
    for (let i = 0; i < CACHE_SLOTS; i++) p = cacheAdd(p, e(`f${i}`))!;
    expect(p.cache).toHaveLength(CACHE_SLOTS);
    expect(cacheAdd(p, e('extra'))).toBeNull();
    expect(cacheAdd(p, e('f0'))).toBeNull();
  });

  it('swaps and drops entries', () => {
    let p = cacheAdd(initialPlayer(pool), e('a'))!;
    p = cacheSwap(p, e('a'), e('b'))!;
    expect(p.cache).toEqual([e('b')]);
    expect(cacheSwap(p, e('zzz'), e('c'))).toBeNull();
    expect(cacheDrop(p, e('b')).cache).toEqual([]);
  });

  it('is emptied after an attempt', () => {
    const p = cacheAdd(initialPlayer(pool), e('a'))!;
    expect(recordWrong(p, pool, 'n0').cache).toEqual([]);
    expect(recordCorrect(p, pool, 'n0', '2026-10-01', 0).player.cache).toEqual([]);
  });

  it('always fits the key fragments of every question (fairness)', () => {
    for (const q of MOCK_QUESTIONS) {
      expect(q.fragments.filter((f) => f.kind === 'key').length).toBeLessThanOrEqual(CACHE_SLOTS);
    }
  });

  it('places debris deterministically', () => {
    const a = debrisOffsets('n0:0', 5);
    expect(a).toEqual(debrisOffsets('n0:0', 5));
    expect(a).toHaveLength(5);
  });
});
