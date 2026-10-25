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
  structureOpenCost,
  CACHE_FILES_PER_AREA,
  archiveAdd,
  archiveClear,
  archiveDrop,
  archiveReorder,
  archiveSwap,
  cacheAddFile,
  cacheContents,
  cacheDropFile,
  cacheFilesIn,
  cacheFreeSlots,
  cacheHasFolder,
  fragmentFiles,
  ENERGY_REGEN_MS,
  HEAL_COST,
  MAX_ENERGY,
  MAX_INTEGRITY,
  canStartNode,
  isUnstable,
  maintenanceTargets,
  recordMaintenance,
  healIntegrity,
  msToNextEnergy,
  regenEnergy,
  debrisOffsets,
  type PlayerState,
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

  it('wrong answers cost integrity and count attempts, but never trigger ads (D55)', () => {
    let p = initialPlayer(pool);
    p = recordWrong(p, pool, 'n0');
    p = recordWrong(p, pool, 'n0');
    expect(p.integrity).toBe(3);
    expect(p.network.nodes['n0']!.attempts).toBe(2);
    expect(p.ads.breaksSinceInterstitial).toBe(0);
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
    expect(rev.player.network.nodes['n0']!.state).toBe('solved');
    expect(dueReviews(rev.player, '2026-10-30')).toEqual([]);
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
    expect(unlockArea(p, 'biomedicine')).toBeNull(); // costs 15, we have 5
    const rich = { ...p, gems: 40 };
    const u = unlockArea(rich, 'biomedicine')!;
    expect(u.gems).toBe(25);
    expect(u.unlockedAreas).toContain('biomedicine');
    expect(unlockArea(u, 'biomedicine')).toBeNull();
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

describe('folder structure', () => {
  const e = (f: string, q = 'sci-light') => ({ questionId: q, fragmentId: f });

  it('has no size limit and rejects duplicates', () => {
    let p = initialPlayer(pool);
    for (let i = 0; i < 25; i++) p = archiveAdd(p, e(`f${i}`))!;
    expect(p.archive).toHaveLength(25);
    expect(archiveAdd(p, e('f0'))).toBeNull();
  });

  it('takes folders out again, and they can be filed once more', () => {
    let p = archiveAdd(initialPlayer(pool), e('a'))!;
    p = archiveDrop(p, e('a'));
    expect(p.archive).toEqual([]);
    expect(archiveAdd(p, e('a'))).not.toBeNull();
    expect(archiveDrop(p, e('never-added'))).toBe(p);
  });

  it('is ordered by the player: swap, reorder, clear', () => {
    let p = initialPlayer(pool);
    for (const f of ['a', 'b', 'c']) p = archiveAdd(p, e(f))!;
    const ids = (x: typeof p) => x.archive.map((c) => c.fragmentId);
    expect(ids(archiveSwap(p, e('c'), e('b')))).toEqual(['a', 'c', 'b']);
    expect(archiveSwap(p, e('a'), e('zzz'))).toBe(p);
    expect(ids(archiveReorder(p, [e('c'), e('a'), e('zzz')]))).toEqual(['c', 'a', 'b']);
    expect(archiveClear(p).archive).toEqual([]);
  });

  it('costs a little more to open in a question the bigger it gets', () => {
    expect([0, 1, 10, 11, 20, 21, 500].map(structureOpenCost)).toEqual([0, 1, 1, 2, 2, 3, 3]);
  });

  it('pays the energy it costs, or refuses', () => {
    const p = initialPlayer(pool);
    expect(spendRewind(p, 0, 3)!.energy).toBe(p.energy - 3);
    expect(spendRewind({ ...p, energy: 2 }, 0, 3)).toBeNull();
    expect(spendRewind({ ...p, energy: 3 }, 0, 3)!.energy).toBe(0);
  });

  it('stays after an attempt', () => {
    const p = archiveAdd(initialPlayer(pool), e('sci-light-f1'))!;
    expect(recordWrong(p, pool, 'n0').archive).toEqual(p.archive);
    expect(recordCorrect(p, pool, 'n0', '2026-10-01', 0).player.archive).toEqual(p.archive);
  });
});

describe('cache', () => {
  /** The first file of a fragment of a question, as a cache entry. */
  const file = (qid: string, i: number) => {
    const f = pool.get(qid).fragments[i]!;
    return { questionId: qid, fragmentId: f.id, file: fragmentFiles(f)[0]!.name };
  };

  it('holds at most three files per area, any number of areas', () => {
    let p = initialPlayer(pool);
    for (let i = 0; i < 3; i++) p = cacheAddFile(p, pool, file('sci-light', i))!;
    expect(cacheFreeSlots(p, pool, 'physics')).toBe(0);
    expect(cacheAddFile(p, pool, file('sci-light', 3))).toBeNull();
    // another area has its own three places
    p = cacheAddFile(p, pool, file('nat-everest', 0))!;
    expect(p.cache).toHaveLength(4);
    expect(cacheFilesIn(p, pool, 'geography')).toHaveLength(1);
    // dropping frees a place again
    p = cacheDropFile(p, file('sci-light', 0));
    expect(cacheFreeSlots(p, pool, 'physics')).toBe(1);
  });

  it('refuses duplicates and files that do not exist', () => {
    const p = cacheAddFile(initialPlayer(pool), pool, file('sci-light', 0))!;
    expect(cacheAddFile(p, pool, file('sci-light', 0))).toBeNull();
    expect(cacheAddFile(p, pool, { ...file('sci-light', 1), file: 'gibtsnicht.txt' })).toBeNull();
    expect(cacheAddFile(p, pool, { questionId: 'nope', fragmentId: 'x', file: 'a' })).toBeNull();
  });

  it('resolves carried files to their content, also per area', () => {
    let p = cacheAddFile(initialPlayer(pool), pool, file('sci-light', 0))!;
    p = cacheAddFile(p, pool, file('nat-everest', 0))!;
    const all = cacheContents(p, pool);
    expect(all.map((c) => c.area)).toEqual(['physics', 'geography']);
    expect(cacheContents(p, pool, 'physics')).toHaveLength(1);
    expect(cacheContents(p, pool, 'physics')[0]!.file.name).toBe(file('sci-light', 0).file);
    expect(cacheHasFolder(p, { questionId: 'sci-light', fragmentId: pool.get('sci-light').fragments[0]!.id })).toBe(true);
  });

  it('empties the area of the question after an attempt, other areas stay', () => {
    let p = cacheAddFile(initialPlayer(pool), pool, file('sci-light', 0))!;
    p = cacheAddFile(p, pool, file('nat-everest', 0))!;
    const left = (x: typeof p) => cacheContents(x, pool).map((c) => c.area);
    expect(left(recordWrong(p, pool, 'n0'))).toEqual(['geography']);
    expect(left(recordCorrect(p, pool, 'n0', '2026-10-01', 0).player)).toEqual(['geography']);
  });

  it('always has room for a file of every key fragment (fairness)', () => {
    for (const q of MOCK_QUESTIONS) {
      expect(q.fragments.filter((f) => f.kind === 'key').length, q.id).toBeLessThanOrEqual(CACHE_FILES_PER_AREA);
    }
  });

  it('every question has one to three key fragments', () => {
    for (const q of MOCK_QUESTIONS) {
      const keys = q.fragments.filter((f) => f.kind === 'key').length;
      expect(keys, q.id).toBeGreaterThanOrEqual(1);
      expect(keys, q.id).toBeLessThanOrEqual(3);
    }
  });

  it('places debris deterministically', () => {
    const a = debrisOffsets('n0:0', 5);
    expect(a).toEqual(debrisOffsets('n0:0', 5));
    expect(a).toHaveLength(5);
  });
});

describe('consequences', () => {
  it('pays a bonus only when a file of every key fragment was carried', () => {
    const q = pool.get('sci-light');
    const keys = q.fragments.filter((f) => f.kind === 'key');
    let ready = initialPlayer(pool);
    for (const k of keys) {
      ready = cacheAddFile(ready, pool, { questionId: q.id, fragmentId: k.id, file: fragmentFiles(k)[0]!.name })!;
    }
    const clean = recordCorrect(ready, pool, 'n0', '2026-10-01', 0);
    const bare = recordCorrect(initialPlayer(pool), pool, 'n0', '2026-10-01', 0);
    expect(clean.prepared).toBe(true);
    expect(bare.prepared).toBe(false);
    expect(clean.reward.bits).toBeGreaterThan(bare.reward.bits);
    expect(recordCorrect(ready, pool, 'n0', '2026-10-01', 1).prepared).toBe(false);
  });

  it('energy refills over time, not with answers', () => {
    const t0 = 1_000_000;
    let p = spendRewind(initialPlayer(pool), t0)!;
    expect(p.energy).toBe(MAX_ENERGY - 1);
    expect(recordCorrect(p, pool, 'n0', '2026-10-01', 0).player.energy).toBe(MAX_ENERGY - 1);
    expect(msToNextEnergy(p, t0 + 5 * 60_000)).toBe(ENERGY_REGEN_MS - 5 * 60_000);
    p = regenEnergy(p, t0 + ENERGY_REGEN_MS + 1);
    expect(p.energy).toBe(MAX_ENERGY);
    expect(p.energyAt).toBeNull();
  });

  it('cannot open the cache without energy', () => {
    let p: PlayerState = { ...initialPlayer(pool), energy: 0, energyAt: 0 };
    expect(spendRewind(p, 10)).toBeNull();
    p = regenEnergy(p, ENERGY_REGEN_MS * 2);
    expect(p.energy).toBe(2);
  });

  it('blocks new nodes at integrity 0 but never repairs', () => {
    const solved = recordCorrect(initialPlayer(pool), pool, 'n0', '2026-10-01', 0).player;
    const p0 = { ...solved, integrity: 0 };
    expect(canStartNode(p0, 'n1', '2026-10-01')).toBe(false);
    expect(canStartNode(initialPlayer(pool), 'n0', '2026-10-01')).toBe(true);
    const broken = completeNode3();
    expect(canStartNode({ ...broken, integrity: 0 }, 'n0', '2026-10-01')).toBe(true);
  });

  it('never locks up: without a way to win integrity back, new nodes stay open', () => {
    // five wrong answers before anything is solved: nothing to repair or maintain
    let p = initialPlayer(pool);
    for (let i = 0; i < 5; i++) p = recordWrong(p, pool, 'n0');
    expect(p.integrity).toBe(0);
    expect(isUnstable(p, '2026-10-01')).toBe(false);
    expect(canStartNode(p, 'n1', '2026-10-01')).toBe(true);
  });

  it('maintenance wins integrity back once a day per solved node', () => {
    const solved = recordCorrect(initialPlayer(pool), pool, 'n0', '2026-10-01', 0).player;
    const p0 = { ...solved, integrity: 0 };
    expect(maintenanceTargets(p0, '2026-10-01')).toEqual(['n0']);
    expect(isUnstable(p0, '2026-10-01')).toBe(true);
    const ok = recordMaintenance(p0, pool, 'n0', true, '2026-10-01');
    expect(ok.integrity).toBe(1);
    expect(recordMaintenance(ok, pool, 'n0', true, '2026-10-01')).toBe(ok);
    expect(maintenanceTargets(ok, '2026-10-01')).toEqual([]);
    expect(maintenanceTargets(ok, '2026-10-02')).toEqual(['n0']);
    // a wrong answer uses up the day as well, without a penalty
    const bad = recordMaintenance(p0, pool, 'n0', false, '2026-10-01');
    expect(bad.integrity).toBe(0);
    expect(maintenanceTargets(bad, '2026-10-01')).toEqual([]);
    // the cache belongs to the next node and stays
    const f = pool.get('nat-everest').fragments[0]!;
    const withCache = cacheAddFile(p0, pool, { questionId: 'nat-everest', fragmentId: f.id, file: fragmentFiles(f)[0]!.name })!;
    expect(recordMaintenance(withCache, pool, 'n0', true, '2026-10-01').cache).toHaveLength(1);
  });

  it('one right repair heals the node; only a due one pays', () => {
    const broken = { ...completeNode3(), integrity: 2 };
    const early = recordReviewResult(broken, pool, 'n0', true, '2026-10-01');
    expect(early.due).toBe(false);
    expect(early.reward).toEqual({ xp: 0, bits: 0, gems: 0 });
    expect(early.player.integrity).toBe(2);
    expect(early.player.network.nodes['n0']!.state).toBe('solved');
    expect(early.spawned.length).toBeGreaterThan(0);
    const due = recordReviewResult(broken, pool, 'n0', true, '2026-10-02');
    expect(due.due).toBe(true);
    expect(due.player.network.nodes['n0']!.state).toBe('solved');
    expect(due.player.integrity).toBe(3);
  });

  it('a wrong repair keeps the node damaged until tomorrow', () => {
    const broken = completeNode3();
    const r = recordReviewResult(broken, pool, 'n0', false, '2026-10-02');
    expect(r.player.network.nodes['n0']!.state).toBe('damaged');
    expect(r.player.network.nodes['n0']!.dueDay).toBe('2026-10-03');
    expect(r.spawned).toEqual([]);
  });

  it('heals integrity with gems, and a repair gives one back', () => {
    const p = { ...initialPlayer(pool), integrity: 0, gems: HEAL_COST };
    const healed = healIntegrity(p)!;
    expect(healed.integrity).toBe(MAX_INTEGRITY);
    expect(healed.gems).toBe(0);
    expect(healIntegrity({ ...p, gems: 0 })).toBeNull();
    const broken = { ...completeNode3(), integrity: 2 };
    const r = recordReviewResult(broken, pool, 'n0', true, '2026-10-05');
    expect(r.player.integrity).toBe(3);
    expect(r.spawned.length).toBeGreaterThan(0);
  });
});

function completeNode3() {
  let p = initialPlayer(pool);
  p = recordWrong(p, pool, 'n0');
  p = recordWrong(p, pool, 'n0');
  return recordCorrect(p, pool, 'n0', '2026-10-01', 0).player;
}
