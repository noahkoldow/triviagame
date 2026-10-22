import { describe, expect, it } from 'vitest';
import { MOCK_QUESTIONS, QUESTION_TYPES } from '@nexus/shared';
import { httpChecker, httpGenerator, mockGenerator, questionSource } from './ai';

const asDraftText = (qs: typeof MOCK_QUESTIONS) =>
  JSON.stringify(
    qs.map((q) => {
      const { id: _i, fragments, deepen: _d, bridge: _b, ...rest } = JSON.parse(JSON.stringify(q));
      return { ...rest, fragments: fragments.map(({ id: _f, ...f }: Record<string, unknown>) => f) };
    }),
  );

function fakeFetch(answer: unknown, status = 200) {
  const calls: { url: string; body: any; headers: Record<string, string> }[] = [];
  const f = async (url: string, init: { method: string; headers: Record<string, string>; body: string }) => {
    calls.push({ url, body: JSON.parse(init.body), headers: init.headers });
    return { ok: status >= 200 && status < 300, status, json: async () => answer };
  };
  return { f, calls };
}

describe('AI providers', () => {
  it('the mock answers for every question type in the pool', async () => {
    const src = questionSource('');
    expect(src.live).toBe(false);
    for (const type of QUESTION_TYPES) {
      const q = MOCK_QUESTIONS.find((x) => x.type === type)!;
      const r = await src.fetch({ area: q.area, difficulty: q.difficulty, type, count: 1 });
      expect(r.accepted, type).toHaveLength(1);
      expect(r.accepted[0]!.type).toBe(type);
    }
  });

  it('the mock answers with nothing for an area it has no question for', async () => {
    const r = await questionSource('').fetch({ area: 'medicine', difficulty: 5, type: 'cloze', count: 1 });
    expect(r.accepted).toHaveLength(0);
  });

  it('sends the prompt to the backend and nothing about the player', async () => {
    const q = MOCK_QUESTIONS.find((x) => x.type === 'match')!;
    const calls: { url: string; body: any }[] = [];
    const f = async (url: string, init: { method: string; headers: Record<string, string>; body: string }) => {
      const body = JSON.parse(init.body);
      calls.push({ url, body });
      const text = body.task === 'generate' ? asDraftText([q]) : '{"ok":true,"issues":[]}';
      return { ok: true, status: 200, json: async () => ({ text }) };
    };
    const src = questionSource('https://example.test/ai', f);
    expect(src.live).toBe(true);
    const r = await src.fetch({ area: q.area, difficulty: q.difficulty, type: 'match', count: 1 });
    expect(r.accepted).toHaveLength(1);
    const gen = calls.find((c) => c.body.task === 'generate')!;
    expect(gen.url).toBe('https://example.test/ai');
    expect(Object.keys(gen.body).sort()).toEqual(['prompt', 'task']);
    expect(gen.body.prompt).toContain('Type: match');
    // the checker was asked too
    expect(calls.some((c) => c.body.task === 'check')).toBe(true);
  });

  it('lets the backend checker decide', async () => {
    const q = MOCK_QUESTIONS.find((x) => x.type === 'cloze')!;
    const answers: any[] = [{ text: asDraftText([q]) }, { text: '{"ok":false,"issues":["Fakt unsicher"]}' }];
    const f = async () => ({ ok: true, status: 200, json: async () => answers.shift() });
    const r = await questionSource('https://example.test/ai', f).fetch({ area: q.area, difficulty: q.difficulty, type: 'cloze', count: 1 });
    expect(r.accepted).toHaveLength(0);
    expect(r.rejected[0]!.reasons).toEqual(['Fakt unsicher']);
  });

  it('survives a backend that is down or answers badly', async () => {
    const req = { area: 'physics', difficulty: 1 as const, type: 'choice' as const, count: 1 };
    const down = fakeFetch({}, 503);
    expect((await questionSource('https://example.test/ai', down.f).fetch(req)).accepted).toHaveLength(0);
    const odd = fakeFetch({ nope: 1 });
    const r = await questionSource('https://example.test/ai', odd.f).fetch(req);
    expect(r.accepted).toHaveLength(0);
    expect(r.rejected[0]!.reasons.join()).toMatch(/generator failed/);
  });

  it('sends a token only when it is given', async () => {
    const a = fakeFetch({ text: '[]' });
    await httpGenerator('https://x.test', a.f).generate('p');
    expect(a.calls[0]!.headers['Authorization']).toBeUndefined();
    const b = fakeFetch({ text: '[]' });
    await httpGenerator('https://x.test', b.f, 'abc').generate('p');
    expect(b.calls[0]!.headers['Authorization']).toBe('Bearer abc');
    const c = fakeFetch({ text: '{"ok":true,"issues":[]}' });
    expect(await httpChecker('https://x.test', c.f).check(MOCK_QUESTIONS[0]!)).toEqual({ ok: true, issues: [] });
    expect(typeof mockGenerator().generate).toBe('function');
  });
});
