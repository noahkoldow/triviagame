import { describe, expect, it } from 'vitest';
import {
  AD_POLICY,
  AREAS,
  MOCK_QUESTIONS,
  ROOT_QUESTIONS,
  Pool,
  SECTORS,
  SECTOR_ANGLE,
  areaCost,
  buildField,
  completeNode,
  growMissing,
  createNetwork,
  appOpenDue,
  interstitialDue,
  logRewarded,
  rewardedLeft,
  initialUnlockedAreas,
  isCorrect,
  levelFromXp,
  polar,
  rewardFor,
  seededRng,
  sectorOfArea,
  sessionParams,
  streakAfter,
  targetDifficulty,
  updateSkill,
  variantOptions,
  applyReview,
  markDamaged,
  birthYearToAgeGroup,
  pickArea,
  type NetNode,
  type NetworkState,
  type RewardedLog,
  type SpawnContext,
} from './index';

const pool = new Pool(MOCK_QUESTIONS);

describe('content integrity', () => {
  it('has unique ids and valid references', () => {
    const ids = new Set<string>();
    for (const q of MOCK_QUESTIONS) {
      expect(ids.has(q.id)).toBe(false);
      ids.add(q.id);
      expect(AREAS.some((a) => a.id === q.area)).toBe(true);
    }
    for (const q of MOCK_QUESTIONS) {
      for (const r of [...q.deepen, ...q.bridge]) expect(ids.has(r), `${q.id} -> ${r}`).toBe(true);
    }
    for (const id of Object.values(ROOT_QUESTIONS)) expect(ids.has(id)).toBe(true);
  });

  it('guarantees solvable questions: keys fit the cache and are always in the field', () => {
    for (const q of MOCK_QUESTIONS) {
      const keys = q.fragments.filter((f) => f.kind === 'key');
      expect(keys.length, q.id).toBeGreaterThan(0);
      const { slots } = sessionParams(q);
      expect(keys.length, q.id).toBeLessThanOrEqual(slots);
      for (let v = 0; v < 5; v++) {
        const field = buildField(q, v).map((f) => f.id);
        for (const k of keys) expect(field).toContain(k.id);
      }
    }
  });

  it('has valid answers', () => {
    for (const q of MOCK_QUESTIONS) {
      if (q.type === 'choice') {
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
        const v = variantOptions(q, 3);
        expect(v.options[v.answer]).toBe(q.options[q.answer]);
      }
    }
  });

  it('covers every unlocked starting sector with a free area', () => {
    const free = initialUnlockedAreas();
    for (const s of SECTORS) expect(free.some((a) => sectorOfArea(a) === s)).toBe(true);
  });
});

describe('answers', () => {
  it('checks choice, estimate and order', () => {
    const c = pool.get('sci-light');
    if (c.type !== 'choice') throw new Error();
    expect(isCorrect(c, { type: 'choice', index: c.answer })).toBe(true);
    expect(isCorrect(c, { type: 'choice', index: (c.answer + 1) % 4 })).toBe(false);
    const e = pool.get('nat-everest');
    expect(isCorrect(e, { type: 'estimate', value: 8800 })).toBe(true);
    expect(isCorrect(e, { type: 'estimate', value: 8000 })).toBe(false);
    const y = pool.get('his-wall');
    expect(isCorrect(y, { type: 'estimate', value: 1989 })).toBe(true);
    expect(isCorrect(y, { type: 'estimate', value: 1990 })).toBe(false);
    const o = pool.get('his-timeline');
    if (o.type !== 'order') throw new Error();
    expect(isCorrect(o, { type: 'order', items: o.items })).toBe(true);
    expect(isCorrect(o, { type: 'order', items: [...o.items].reverse() })).toBe(false);
  });
});

describe('skill & rewards', () => {
  it('moves skill in the right direction', () => {
    expect(updateSkill(1000, 3, true)).toBeGreaterThan(1000);
    expect(updateSkill(1000, 3, false)).toBeLessThan(1000);
    expect(targetDifficulty(1000)).toBe(1);
    expect(targetDifficulty(1600)).toBe(4);
  });
  it('rewards first-try success most', () => {
    const a = rewardFor({ difficulty: 4, attempts: 1, rewinds: 0, kind: 'deepen' });
    const b = rewardFor({ difficulty: 4, attempts: 3, rewinds: 1, kind: 'deepen' });
    expect(a.xp).toBeGreaterThan(b.xp);
    expect(a.gems).toBe(1);
    expect(b.gems).toBe(0);
  });
  it('levels up and keeps streaks with freezes', () => {
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(1000).level).toBeGreaterThan(3);
    expect(streakAfter(3, '2026-10-01', '2026-10-02', 0).streak).toBe(4);
    expect(streakAfter(3, '2026-10-01', '2026-10-03', 1)).toEqual({ streak: 4, freezes: 0 });
    expect(streakAfter(3, '2026-10-01', '2026-10-05', 1).streak).toBe(1);
    // a new month refills the freezes before the gap is counted
    expect(streakAfter(3, '2026-09-30', '2026-10-03', 0)).toEqual({ streak: 4, freezes: 0 });
    expect(streakAfter(3, '2026-10-30', '2026-11-01', 0)).toEqual({ streak: 4, freezes: 1 });
  });
  it('schedules damaged nodes for review', () => {
    const n: NetNode = {
      id: 'n',
      questionId: 'q',
      parentId: null,
      kind: 'root',
      state: 'solved',
      pos: { x: 0, y: 0, z: 0 },
      attempts: 3,
      box: 0,
    };
    let d = markDamaged(n, '2026-10-01');
    expect(d.state).toBe('damaged');
    expect(d.dueDay).toBe('2026-10-02');
    for (let i = 0; i < 4; i++) d = applyReview(d, true, '2026-10-20');
    expect(d.state).toBe('solved');
    expect(applyReview({ ...d, state: 'damaged', box: 3 }, false, '2026-10-20').box).toBe(1);
  });
});

describe('monetization', () => {
  const P = AD_POLICY;
  const base = {
    ageGroup: 'adult' as const,
    adFree: false,
    solved: P.forcedAfterSolved,
    breaksSinceInterstitial: P.interstitialEveryBreaks,
    lastAdAt: null,
    now: 1_000_000_000,
  };
  it('shows an interstitial every n-th break once the first session is over', () => {
    expect(interstitialDue(base)).toBe(true);
    expect(interstitialDue({ ...base, breaksSinceInterstitial: P.interstitialEveryBreaks - 1 })).toBe(false);
    expect(interstitialDue({ ...base, solved: P.forcedAfterSolved - 1 })).toBe(false);
  });
  it('keeps the gap to the last ad of any kind, respects ad-free and the switch', () => {
    expect(interstitialDue({ ...base, lastAdAt: base.now - P.interstitialMinGapMs + 1 })).toBe(false);
    expect(interstitialDue({ ...base, lastAdAt: base.now - P.interstitialMinGapMs })).toBe(true);
    expect(interstitialDue({ ...base, adFree: true })).toBe(false);
    expect(interstitialDue(base, { ...P, interstitials: false })).toBe(false);
  });
  it('greets a returning player with an app-open ad, rarely', () => {
    const open = { ...base, lastAppOpenAt: null, awayMs: null };
    expect(appOpenDue(open)).toBe(true);
    expect(appOpenDue({ ...open, awayMs: P.appOpenMinAwayMs - 1 })).toBe(false);
    expect(appOpenDue({ ...open, lastAppOpenAt: base.now - P.appOpenMinGapMs + 1 })).toBe(false);
    expect(appOpenDue({ ...open, lastAdAt: base.now - 1000 })).toBe(false);
    expect(appOpenDue({ ...open, solved: 0 })).toBe(false);
  });
  it('treats minors safely: nothing forced', () => {
    expect(interstitialDue({ ...base, ageGroup: 'minor', breaksSinceInterstitial: 9 })).toBe(false);
    expect(appOpenDue({ ...base, ageGroup: 'minor', lastAppOpenAt: null, awayMs: null })).toBe(false);
    expect(birthYearToAgeGroup(2015, 2026)).toBe('minor');
    expect(birthYearToAgeGroup(2000, 2026)).toBe('adult');
  });
  it('limits rewarded videos per placement and day', () => {
    let log: RewardedLog = { day: null, counts: {} };
    for (let i = 0; i < P.rewardedPerDay.gems; i++) log = logRewarded(log, 'gems', '2026-10-24');
    expect(rewardedLeft(log, 'gems', '2026-10-24')).toBe(0);
    expect(rewardedLeft(log, 'energy', '2026-10-24')).toBe(P.rewardedPerDay.energy);
    expect(rewardedLeft(log, 'gems', '2026-10-25')).toBe(P.rewardedPerDay.gems);
    expect(logRewarded(log, 'gems', '2026-10-25').counts).toEqual({ gems: 1 });
  });
  it('prices areas: first free, then increasing', () => {
    expect(areaCost('physics')).toBe(0);
    expect(areaCost('biomedicine')).toBe(15);
    expect(areaCost('technology')).toBe(25);
  });
});

describe('interest', () => {
  it('reserves a share for the least explored area', () => {
    const rng = seededRng('x');
    let wide = 0;
    for (let i = 0; i < 500; i++) {
      const a = pickArea(['a', 'b'], { a: { a: 50, b: 1 } }, { a: 10, b: 0 }, rng);
      if (a === 'b') wide++;
    }
    // ~20 % wide view plus a few sampled picks
    expect(wide).toBeGreaterThan(60);
    expect(wide).toBeLessThan(200);
  });
});

describe('network growth', () => {
  function ctxFor(unlocked = initialUnlockedAreas(), seed = 's'): SpawnContext {
    return { pool, unlockedAreas: unlocked, skill: {}, interest: {}, rng: seededRng(seed) };
  }

  it('starts with one root per sector at the right angle', () => {
    const net = createNetwork(pool, ROOT_QUESTIONS);
    const roots = Object.values(net.nodes);
    expect(roots).toHaveLength(4);
    for (const s of SECTORS) {
      const n = roots.find((r) => sectorOfArea(pool.get(r.questionId).area) === s)!;
      expect(Math.abs(polar(n.pos).th - SECTOR_ANGLE[s])).toBeLessThan(1e-6);
    }
  });

  it('solving spawns a deepening and a bridge', () => {
    const net = createNetwork(pool, ROOT_QUESTIONS);
    const r = completeNode(net, 'n0', 1, '2026-10-01', ctxFor());
    const kinds = r.spawned.map((n) => n.kind);
    expect(kinds).toContain('deepen');
    expect(kinds).toContain('bridge');
    expect(r.state.nodes['n0']!.state).toBe('solved');
    const deepen = r.spawned.find((n) => n.kind === 'deepen')!;
    expect(pool.get(deepen.questionId).area).toBe(pool.get('sci-light').area);
  });

  it('keeps a node in its main sector but bends it toward a side sector', () => {
    const q = pool.get('sci-vaccine'); // science, side: humanities .15
    expect(sectorOfArea(q.area)).toBe('science');
    const net = createNetwork(pool, { ...ROOT_QUESTIONS, science: 'sci-vaccine' });
    const th = polar(net.nodes['n0']!.pos).th;
    expect(th).toBeCloseTo(SECTOR_ANGLE.science, 5); // roots stay on axis
    const r = completeNode(
      createNetwork(pool, { ...ROOT_QUESTIONS, science: 'sci-water' }),
      'n0',
      1,
      't',
      ctxFor(),
    );
    const vacc = r.spawned.find((n) => n.questionId === 'sci-vaccine');
    if (vacc) {
      const a = polar(vacc.pos).th;
      const diff = Math.abs(a - SECTOR_ANGLE.science);
      expect(diff).toBeLessThan(1.0); // still inside the science wedge (+ small bend)
    }
  });

  it('never repeats a question and spaces nodes unevenly but without overlap', () => {
    let state: NetworkState = createNetwork(pool, ROOT_QUESTIONS);
    const ctx = ctxFor(
      AREAS.map((a) => a.id),
      'play',
    );
    let guard = 0;
    for (;;) {
      const open = Object.values(state.nodes).find((n) => n.state === 'open' && !n.locked);
      if (!open || guard++ > 100) break;
      state = completeNode(state, open.id, 1, '2026-10-01', ctx).state;
    }
    expect(new Set(state.usedQuestions).size).toBe(state.usedQuestions.length);
    expect(state.usedQuestions.length).toBeGreaterThan(24);
    const nodes = Object.values(state.nodes);
    let minD = Infinity;
    const gaps: number[] = [];
    for (const a of nodes) {
      for (const b of nodes) {
        if (a.id >= b.id) continue;
        minD = Math.min(minD, Math.hypot(a.pos.x - b.pos.x, a.pos.y - b.pos.y));
      }
      if (a.parentId) {
        const p = state.nodes[a.parentId]!;
        gaps.push(Math.hypot(a.pos.x - p.pos.x, a.pos.y - p.pos.y));
      }
    }
    expect(minD).toBeGreaterThan(40);
    const spread = Math.max(...gaps) - Math.min(...gaps);
    expect(spread).toBeGreaterThan(40);
  });

  it('is deterministic for the same seed', () => {
    const run = () => {
      const net = createNetwork(pool, ROOT_QUESTIONS);
      return completeNode(net, 'n1', 1, 't', ctxFor(undefined, 'same')).state;
    };
    expect(run()).toEqual(run());
  });

  it('first try grows deepening and bridge', () => {
    const r = completeNode(createNetwork(pool, ROOT_QUESTIONS), 'n0', 1, '2026-10-01', ctxFor());
    expect(r.state.nodes['n0']!.state).toBe('solved');
    expect(r.spawned.map((n) => n.kind)).toEqual(expect.arrayContaining(['deepen', 'bridge']));
  });

  it('second try only grows the deepening and withholds the bridge', () => {
    const r = completeNode(createNetwork(pool, ROOT_QUESTIONS), 'n0', 2, '2026-10-01', ctxFor());
    expect(r.state.nodes['n0']!.state).toBe('damaged');
    expect(r.state.nodes['n0']!.missing).toEqual(['bridge']);
    expect(r.spawned.map((n) => n.kind)).toEqual(['deepen']);
  });

  it('three attempts damage the node and grow nothing until it is repaired', () => {
    const r = completeNode(createNetwork(pool, ROOT_QUESTIONS), 'n0', 3, '2026-10-01', ctxFor());
    expect(r.state.nodes['n0']!.state).toBe('damaged');
    expect(r.spawned).toHaveLength(0);
    expect(r.state.nodes['n0']!.missing).toEqual(['deepen', 'bridge']);
  });

  it('grows the withheld children after a repair', () => {
    const net = completeNode(createNetwork(pool, ROOT_QUESTIONS), 'n0', 3, '2026-10-01', ctxFor()).state;
    const g = growMissing(net, 'n0', ctxFor());
    expect(g.spawned.length).toBeGreaterThan(0);
    expect(g.state.nodes['n0']!.missing).toBeUndefined();
    expect(growMissing(g.state, 'n0', ctxFor()).spawned).toHaveLength(0);
  });
});

import { HEX_R, hexDistance, hexLine, hexNeighbors, hexToWorld, snapToHex, worldToHex } from './hex';

describe('hex grid', () => {
  it('round-trips cells through world coordinates', () => {
    for (const h of [{ q: 0, r: 0 }, { q: 3, r: -2 }, { q: -5, r: 4 }]) {
      const w = hexToWorld(h);
      expect(worldToHex(w.x, w.y)).toEqual(h);
    }
  });

  it('snaps a point to a cell centre within one cell radius', () => {
    const p = snapToHex(101, -57);
    expect(Math.hypot(p.x - 101, p.y + 57)).toBeLessThanOrEqual(HEX_R);
  });

  it('has six neighbours at distance 1', () => {
    const n = hexNeighbors({ q: 2, r: 2 });
    expect(n).toHaveLength(6);
    for (const c of n) expect(hexDistance({ q: 2, r: 2 }, c)).toBe(1);
  });

  it('draws a connected line of cells', () => {
    const line = hexLine({ q: 0, r: 0 }, { q: 5, r: -3 });
    expect(line[0]).toEqual({ q: 0, r: 0 });
    expect(line[line.length - 1]).toEqual({ q: 5, r: -3 });
    for (let i = 1; i < line.length; i++) expect(hexDistance(line[i - 1]!, line[i]!)).toBe(1);
  });
});
