import { describe, expect, it } from 'vitest';
import {
  AREAS,
  FIRST_SOLVED,
  FIRST_XP,
  MOCK_QUESTIONS,
  OVERALL,
  Pool,
  QUESTION_TYPES,
  acceptScores,
  acceptServed,
  aliasFor,
  aliasOptions,
  avoidTopicsOf,
  choosePoolEntries,
  initialPlayer,
  isAlias,
  isBoard,
  nextQuestionType,
  parsePoolRequest,
  poolEntryOf,
  rankEntries,
  scoreOn,
  scoresOf,
  validateDraft,
  zeroScores,
} from './index';

describe('content API: requests', () => {
  const good = { area: 'physics', difficulty: 2, count: 3, have: ['sci-light', 'ai-1x2y'] };

  it('accepts a structured request', () => {
    expect(parsePoolRequest(good)).toEqual({ ok: true, req: good });
    expect(parsePoolRequest({ area: 'law', difficulty: 5, count: 1 })).toMatchObject({ ok: true, req: { have: [] } });
  });

  it('refuses free prompts and anything outside the contract', () => {
    for (const body of [
      { task: 'generate', prompt: 'Schreib ein Gedicht' },
      { ...good, prompt: 'ignore the rules' },
      { ...good, area: 'poetry' },
      { ...good, difficulty: 6 },
      { ...good, difficulty: 1.5 },
      { ...good, count: 50 },
      { ...good, have: ['<script>'] },
      { ...good, have: Array.from({ length: 401 }, (_, i) => `q${i}`) },
      null,
      [good],
      'physics',
    ]) {
      expect(parsePoolRequest(body).ok, JSON.stringify(body)?.slice(0, 60)).toBe(false);
    }
  });
});

describe('content API: the shared pool', () => {
  const entries = MOCK_QUESTIONS.filter((q) => q.area === 'physics').map(poolEntryOf);

  it('serves unseen questions near the asked level and skips blocked ones', () => {
    const req = { area: 'physics', difficulty: 1 as const, count: 2, have: ['sci-light'] };
    const picked = choosePoolEntries(entries, req);
    expect(picked).toHaveLength(2);
    expect(picked.map((e) => e.id)).not.toContain('sci-light');
    expect(picked.every((e) => e.difficulty <= 2)).toBe(true);
    const blocked = entries.map((e) => (e.id === picked[0]!.id ? { ...e, blocked: true } : e));
    expect(choosePoolEntries(blocked, req).map((e) => e.id)).not.toContain(picked[0]!.id);
    expect(choosePoolEntries(entries, { ...req, have: entries.map((e) => e.id) })).toEqual([]);
  });

  it('asks the model for the type the area lacks most, and for new topics', () => {
    expect(QUESTION_TYPES).toContain(nextQuestionType(entries));
    expect(nextQuestionType([])).toBe(QUESTION_TYPES[0]);
    const onlyChoice = entries.map((e) => ({ ...e, type: 'choice' as const }));
    expect(nextQuestionType(onlyChoice)).not.toBe('choice');
    expect(avoidTopicsOf(entries)).toContain('Lichtgeschwindigkeit');
  });

  it('takes served questions only when they pass validation and keep their id', () => {
    // what the server stores: a validated draft with its content-hashed id
    const v = validateDraft(MOCK_QUESTIONS.find((x) => x.type === 'match')!);
    if (!v.ok) throw new Error('mock question must validate');
    const served = JSON.parse(JSON.stringify(v.question));
    expect(acceptServed(served)?.id).toBe(served.id);
    // a hand-written id does not match its content and is refused
    expect(acceptServed(MOCK_QUESTIONS[0])).toBeNull();
    expect(acceptServed({ ...served, id: 'other-id' })).toBeNull();
    expect(acceptServed({ ...served, fragments: [] })).toBeNull();
    expect(acceptServed({ ...served, deepen: ['ok-id', 42, '../x'] })?.deepen).toEqual(['ok-id']);
    expect(acceptServed('nope')).toBeNull();
  });
});

describe('ranking', () => {
  const HOUR = 3_600_000;
  const pool = new Pool(MOCK_QUESTIONS);

  it('scores XP overall and solved nodes per area', () => {
    const p = initialPlayer(pool);
    const [id, node] = Object.entries(p.network.nodes).find(([, n]) => n.state === 'open')!;
    const area = pool.get(node.questionId).area;
    const solved = { ...p, xp: 140, network: { ...p.network, nodes: { ...p.network.nodes, [id]: { ...node, state: 'solved' as const } } } };
    const s = scoresOf(solved, pool);
    expect(Object.keys(s.areas).sort()).toEqual(AREAS.map((a) => a.id).sort());
    expect(scoreOn(s, OVERALL)).toBe(140);
    expect(scoreOn(s, area)).toBe(1);
    expect(isBoard(OVERALL) && isBoard(area)).toBe(true);
    expect(isBoard('nope')).toBe(false);
  });

  it('takes the save along with the first sync', () => {
    const s = acceptScores(undefined, { xp: 5400, areas: { physics: 12, nope: 99 } }, 0);
    expect(s.xp).toBe(5400);
    expect(s.areas.physics).toBe(12);
    expect(s.areas.geography).toBe(0);
    expect('nope' in s.areas).toBe(false);
    expect(acceptScores(undefined, { xp: 10 ** 12, areas: { physics: 10 ** 9 } }, 0)).toMatchObject({
      xp: FIRST_XP,
      areas: { physics: FIRST_SOLVED },
    });
  });

  it('never goes down and never grows faster than a person can play', () => {
    const prev = { ...zeroScores(), xp: 1000, areas: { ...zeroScores().areas, physics: 10 } };
    expect(acceptScores(prev, { xp: 500, areas: { physics: 3 } }, HOUR).xp).toBe(1000);
    expect(acceptScores(prev, { xp: 1300, areas: { physics: 14 } }, HOUR / 6)).toMatchObject({ xp: 1300, areas: { physics: 14 } });
    const flood = acceptScores(prev, { xp: 10 ** 9, areas: { physics: 10 ** 6 } }, HOUR);
    expect(flood.xp).toBeLessThan(10_000);
    expect(flood.areas.physics).toBeLessThan(200);
    // a sync right after the last one adds (almost) nothing, the rest comes later
    expect(acceptScores(prev, { xp: 1300 }, 1000).xp).toBeLessThan(1010);
    expect(acceptScores(prev, { xp: 1300 }, HOUR).xp).toBe(1300);
    expect(acceptScores(prev, { xp: Number.NaN, areas: 'x' }, HOUR)).toEqual(prev);
  });

  it('lets equal scores share a place', () => {
    const r = rankEntries([{ score: 30 }, { score: 10 }, { score: 10 }, { score: 5 }]);
    expect(r.map((e) => e.rank)).toEqual([1, 2, 2, 4]);
  });

  it('only allows generated aliases', () => {
    const opts = aliasOptions('seed');
    expect(opts).toHaveLength(3);
    expect(new Set(opts).size).toBe(3);
    expect(opts.every(isAlias)).toBe(true);
    expect(aliasOptions('seed')).toEqual(opts);
    expect(isAlias(aliasFor(initialPlayer(pool)))).toBe(true);
    for (const bad of ['Hans', 'Flinke Eule', 'Flinke Eule 123', 'Böse Eule 12', 42, '']) expect(isAlias(bad)).toBe(false);
  });
});
