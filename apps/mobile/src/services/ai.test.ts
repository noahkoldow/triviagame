import { describe, expect, it } from 'vitest';
import { MOCK_QUESTIONS, validateDraft } from '@nexus/shared';
import { httpQuestionApi, offlineQuestionApi, questionApi } from './ai';

/** A question as the server stores it: a validated draft with its content-hashed id. */
function served(type: string) {
  const v = validateDraft(MOCK_QUESTIONS.find((q) => q.type === type)!);
  if (!v.ok) throw new Error('mock question must validate');
  return JSON.parse(JSON.stringify(v.question));
}

function fakeFetch(answer: unknown, status = 200) {
  const calls: { url: string; body: any; headers: Record<string, string> }[] = [];
  const f = async (url: string, init: { method: string; headers: Record<string, string>; body: string }) => {
    calls.push({ url, body: JSON.parse(init.body), headers: init.headers });
    return { ok: status >= 200 && status < 300, status, json: async () => answer };
  };
  return { f, calls };
}

const req = { area: 'physics', difficulty: 2 as const, count: 2, have: ['sci-light'] };

describe('content API client', () => {
  it('asks by area and level only: no prompt, nothing about the player', async () => {
    const { f, calls } = fakeFetch({ questions: [served('match')] });
    const qs = await httpQuestionApi('https://api.test', f).fetch(req);
    expect(qs).toHaveLength(1);
    expect(calls[0]!.url).toBe('https://api.test/questions');
    expect(Object.keys(calls[0]!.body).sort()).toEqual(['area', 'count', 'difficulty', 'have']);
    expect(calls[0]!.headers['Authorization']).toBeUndefined();
  });

  it('drops anything that does not validate', async () => {
    const good = served('cloze');
    const { f } = fakeFetch({ questions: [good, { ...good, id: 'forged' }, { nope: 1 }, 'x'] });
    expect((await httpQuestionApi('https://api.test', f).fetch(req)).map((q) => q.id)).toEqual([good.id]);
  });

  it('throws on a broken backend so the caller can back off', async () => {
    await expect(httpQuestionApi('https://api.test', fakeFetch({}, 503).f).fetch(req)).rejects.toThrow('503');
    await expect(httpQuestionApi('https://api.test', fakeFetch({ text: 'x' }).f).fetch(req)).rejects.toThrow();
  });

  it('works offline without a backend', async () => {
    expect(questionApi('')).toBe(offlineQuestionApi);
    expect(await offlineQuestionApi.fetch(req)).toEqual([]);
    expect(questionApi('https://api.test').live).toBe(true);
  });
});
