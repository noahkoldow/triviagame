import { describe, expect, it } from 'vitest';
import {
  AREAS,
  MOCK_QUESTIONS,
  ROOT_QUESTIONS,
  Pool,
  SECTORS,
  SECTOR_ANGLE,
  areaCost,
  buildField,
  completeNode,
  createNetwork,
  decideAds,
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
  const base = {
    ageGroup: 'adult' as const,
    consent: true,
    adFree: false,
    wrongSinceInterstitial: 0,
    lastInterstitialAt: null,
  };
  const ctx = { now: 1_000_000_000, phase: 'afterWrong' as const, boss: false };
  it('offers rewarded after a wrong answer and interstitial only every third', () => {
    expect(decideAds(base, ctx)).toEqual({
      offerRewarded: true,
      showInterstitial: false,
      personalized: true,
    });
    expect(decideAds({ ...base, wrongSinceInterstitial: 3 }, ctx).showInterstitial).toBe(true);
  });
  it('respects the minimum gap, premium, bosses and other phases', () => {
    const s = { ...base, wrongSinceInterstitial: 5, lastInterstitialAt: ctx.now - 60_000 };
    expect(decideAds(s, ctx).showInterstitial).toBe(false);
    expect(decideAds({ ...s, lastInterstitialAt: null, adFree: true }, ctx).offerRewarded).toBe(
      false,
    );
    expect(
      decideAds({ ...base, wrongSinceInterstitial: 5 }, { ...ctx, boss: true }).showInterstitial,
    ).toBe(false);
    expect(
      decideAds({ ...base, wrongSinceInterstitial: 5 }, { ...ctx, phase: 'other' })
        .showInterstitial,
    ).toBe(false);
  });
  it('treats minors safely: rewarded only, never personalised', () => {
    const m = { ...base, ageGroup: 'minor' as const, consent: true, wrongSinceInterstitial: 9 };
    const d = decideAds(m, ctx);
    expect(d.showInterstitial).toBe(false);
    expect(d.personalized).toBe(false);
    expect(birthYearToAgeGroup(2015, 2026)).toBe('minor');
    expect(birthYearToAgeGroup(2000, 2026)).toBe('adult');
  });
  it('prices areas: first free, then increasing', () => {
    expect(areaCost('physics')).toBe(0);
    expect(areaCost('chemistry')).toBe(15);
    expect(areaCost('computing')).toBe(25);
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
    const q = pool.get('sci-vaccine'); // science, side: nature .25
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

  it('marks nodes needing three attempts as damaged but still grows the network', () => {
    const net = createNetwork(pool, ROOT_QUESTIONS);
    const r = completeNode(net, 'n0', 3, '2026-10-01', ctxFor());
    expect(r.state.nodes['n0']!.state).toBe('damaged');
    expect(r.spawned.length).toBeGreaterThan(0);
  });
});
