import { describe, expect, it } from 'vitest';
import {
  MOCK_QUESTIONS,
  answerText,
  isCorrect,
  variantBank,
  validateDraft,
  variantMatch,
  variantMulti,
  variantSort,
  type ClozeQuestion,
  type MatchQuestion,
  type MultiQuestion,
  type SortQuestion,
  type SpotQuestion,
  type TrueFalseQuestion,
} from './index';

const byType = <T extends { type: string }>(t: string) => MOCK_QUESTIONS.filter((q) => q.type === t) as unknown as T[];

describe('question types', () => {
  it('the pool uses every type, not only multiple choice', () => {
    const types = new Set(MOCK_QUESTIONS.map((q) => q.type));
    for (const t of ['choice', 'estimate', 'order', 'truefalse', 'match', 'cloze', 'multi', 'sort', 'spot']) expect(types.has(t as never)).toBe(true);
    const choice = MOCK_QUESTIONS.filter((q) => q.type === 'choice').length;
    expect(choice / MOCK_QUESTIONS.length).toBeLessThan(0.6);
  });

  it('checks true/false answers', () => {
    const q = byType<TrueFalseQuestion>('truefalse')[0]!;
    expect(isCorrect(q, { type: 'truefalse', value: q.answer })).toBe(true);
    expect(isCorrect(q, { type: 'truefalse', value: !q.answer })).toBe(false);
    expect(isCorrect(q, { type: 'choice', index: 0 })).toBe(false);
  });

  it('checks matching answers: every pair must be right', () => {
    const q = byType<MatchQuestion>('match')[0]!;
    const right = Object.fromEntries(q.pairs);
    expect(isCorrect(q, { type: 'match', pairs: right })).toBe(true);
    const [a, b] = [q.pairs[0]![0], q.pairs[1]![0]];
    const swapped = { ...right, [a]: right[b]!, [b]: right[a]! };
    expect(isCorrect(q, { type: 'match', pairs: swapped })).toBe(false);
    expect(isCorrect(q, { type: 'match', pairs: {} })).toBe(false);
  });

  it('checks gap texts word by word', () => {
    const q = byType<ClozeQuestion>('cloze')[0]!;
    expect(isCorrect(q, { type: 'cloze', words: q.answers })).toBe(true);
    expect(isCorrect(q, { type: 'cloze', words: [...q.answers].reverse() })).toBe(q.answers.length === 1);
    expect(isCorrect(q, { type: 'cloze', words: [] })).toBe(false);
  });

  it('checks several right answers: all of them and nothing else', () => {
    const q = byType<MultiQuestion>('multi')[0]!;
    expect(isCorrect(q, { type: 'multi', indices: q.answers })).toBe(true);
    expect(isCorrect(q, { type: 'multi', indices: [...q.answers].reverse() })).toBe(true);
    expect(isCorrect(q, { type: 'multi', indices: q.answers.slice(1) })).toBe(false);
    const wrong = q.options.findIndex((_, i) => !q.answers.includes(i));
    expect(isCorrect(q, { type: 'multi', indices: [...q.answers, wrong] })).toBe(false);
    expect(answerText(q, 'de')).toBe('Kohlendioxid, Methan, Lachgas');
  });

  it('checks sorting into folders item by item', () => {
    const q = byType<SortQuestion>('sort')[0]!;
    const right = Object.fromEntries(q.items);
    expect(isCorrect(q, { type: 'sort', groups: right })).toBe(true);
    const [a, b] = [q.items[0]!, q.items.find((it) => it[1] !== q.items[0]![1])!];
    expect(isCorrect(q, { type: 'sort', groups: { ...right, [a[0]]: b[1] } })).toBe(false);
    expect(isCorrect(q, { type: 'sort', groups: {} })).toBe(false);
    expect(answerText(q, 'de')).toContain('Säugetiere: Wal, Fledermaus');
    for (let v = 0; v < 4; v++) expect([...variantSort(q, v)].sort()).toEqual(q.items.map((it) => it[0]).sort());
    for (let v = 0; v < 4; v++) expect([...variantMulti(byType<MultiQuestion>('multi')[0]!, v)].sort()).toEqual([0, 1, 2, 3, 4]);
  });

  it('checks the wrong statement of a text', () => {
    const q = byType<SpotQuestion>('spot')[0]!;
    expect(isCorrect(q, { type: 'spot', index: q.wrong })).toBe(true);
    expect(isCorrect(q, { type: 'spot', index: (q.wrong + 1) % q.lines.length })).toBe(false);
    expect(answerText(q, 'de')).toBe(q.lines[q.wrong]);
  });

  it('rejects AI drafts of the new types that do not fit', () => {
    const draft = (q: unknown, patch: Record<string, unknown>) => {
      const { id: _i, deepen: _d, bridge: _b, fragments, ...rest } = JSON.parse(JSON.stringify(q));
      return validateDraft({ ...rest, fragments: fragments.map(({ id: _f, ...f }: Record<string, unknown>) => f), ...patch });
    };
    const multi = byType<MultiQuestion>('multi')[0]!;
    expect(draft(multi, {}).ok).toBe(true);
    // one right answer is a plain choice, all right is no question
    expect(draft(multi, { answers: [0] }).ok).toBe(false);
    expect(draft(multi, { answers: [0, 1, 2, 3, 4] }).ok).toBe(false);
    expect(draft(multi, { answers: [0, 0, 2] }).ok).toBe(false);
    const sort = byType<SortQuestion>('sort')[0]!;
    expect(draft(sort, {}).ok).toBe(true);
    expect(draft(sort, { items: sort.items.map(([l]) => [l, 0]) }).ok).toBe(false);
    expect(draft(sort, { items: [...sort.items.slice(0, 5), ['Wal', 1]] }).ok).toBe(false);
    const spot = byType<SpotQuestion>('spot')[0]!;
    expect(draft(spot, {}).ok).toBe(true);
    expect(draft(spot, { wrong: 9 }).ok).toBe(false);
    expect(draft(spot, { lines: spot.lines.slice(0, 2) }).ok).toBe(false);
  });

  it('every new question is well formed', () => {
    for (const q of byType<MatchQuestion>('match')) {
      expect(q.pairs.length, q.id).toBeGreaterThanOrEqual(3);
      expect(new Set(q.pairs.map((p) => p[0])).size, q.id).toBe(q.pairs.length);
      expect(new Set(q.pairs.map((p) => p[1])).size, q.id).toBe(q.pairs.length);
    }
    for (const q of byType<ClozeQuestion>('cloze')) {
      const gaps = (q.text.match(/\{\d+\}/g) ?? []).length;
      expect(gaps, q.id).toBe(q.answers.length);
      for (let i = 0; i < gaps; i++) expect(q.text, q.id).toContain(`{${i}}`);
      for (const a of q.answers) expect(q.bank, q.id).toContain(a);
      expect(new Set(q.bank).size, q.id).toBe(q.bank.length);
    }
    for (const q of MOCK_QUESTIONS) {
      expect(q.fragments.some((f) => f.kind === 'key'), q.id).toBe(true);
    }
  });

  it('shuffles per attempt, never showing the solved order', () => {
    for (const q of byType<MatchQuestion>('match')) {
      const rights = q.pairs.map((p) => p[1]);
      for (let v = 0; v < 6; v++) {
        const s = variantMatch(q, v);
        expect([...s].sort()).toEqual([...rights].sort());
        expect(s.join()).not.toBe(rights.join());
      }
    }
    for (const q of byType<ClozeQuestion>('cloze')) {
      expect([...variantBank(q, 1)].sort()).toEqual([...q.bank].sort());
    }
  });

  it('describes the right answer in words', () => {
    for (const q of MOCK_QUESTIONS) expect(answerText(q, 'de').length, q.id).toBeGreaterThan(0);
    const tf = byType<TrueFalseQuestion>('truefalse').find((q) => q.answer)!;
    expect(answerText(tf, 'de')).toBe('Stimmt');
    expect(answerText(tf, 'es')).toBe('Verdadero');
    const estimate = MOCK_QUESTIONS.find((q) => q.id === 'ear-universe')!;
    expect(answerText(estimate, 'de')).toBe('13,8 Mrd. Jahre');
    expect(answerText(estimate, 'en')).toBe('13.8 Mrd. Jahre');
  });
});
