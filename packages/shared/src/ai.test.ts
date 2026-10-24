import { describe, expect, it } from 'vitest';
import {
  MOCK_QUESTIONS,
  QUESTION_TYPES,
  buildCheckPrompt,
  buildGenerationPrompt,
  extractJson,
  generateQuestions,
  parseCheck,
  parseDrafts,
  validateDraft,
  type QuestionChecker,
  type QuestionGenerator,
} from './index';

type Q = (typeof MOCK_QUESTIONS)[number];

/** A question as the model would send it: no ids. */
const asDraft = (q: Q) => {
  const { id: _id, fragments, deepen: _d, bridge: _b, ...rest } = JSON.parse(JSON.stringify(q));
  return { ...rest, fragments: fragments.map(({ id: _fid, ...f }: Record<string, unknown>) => f) };
};
const firstOf = (type: string) => MOCK_QUESTIONS.find((q) => q.type === type)!;

describe('AI drafts: the schema covers every question type', () => {
  it('accepts every existing question as a draft', () => {
    const failed: string[] = [];
    for (const q of MOCK_QUESTIONS) {
      const v = validateDraft(asDraft(q));
      if (!v.ok) failed.push(`${q.id}: ${v.errors.join('; ')}`);
    }
    expect(failed).toEqual([]);
  });

  it('knows all six types', () => {
    expect(QUESTION_TYPES).toHaveLength(6);
    for (const t of QUESTION_TYPES) expect(MOCK_QUESTIONS.some((q) => q.type === t), t).toBe(true);
  });

  it('turns a valid draft into a question with stable ids', () => {
    const d = asDraft(firstOf('match'));
    const a = validateDraft(d);
    const b = validateDraft(d);
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) {
      expect(a.question.id).toBe(b.question.id);
      expect(a.question.id.startsWith('ai-')).toBe(true);
      expect(a.question.fragments.every((f) => f.id.startsWith(a.question.id))).toBe(true);
      expect(a.question.type).toBe('match');
    }
  });
});

describe('AI drafts: what is rejected', () => {
  const errorsOf = (d: unknown) => {
    const v = validateDraft(d);
    return v.ok ? [] : v.errors;
  };
  const bad = (type: string, patch: (d: Record<string, any>) => void) => {
    const d = asDraft(firstOf(type)) as Record<string, any>;
    patch(d);
    return errorsOf(d);
  };

  it('rejects things that are not questions', () => {
    expect(errorsOf(null)).not.toEqual([]);
    expect(errorsOf('hello')).not.toEqual([]);
    expect(errorsOf([])).not.toEqual([]);
    expect(errorsOf({})).not.toEqual([]);
  });

  it('rejects a choice question whose answer index is out of range or whose options repeat', () => {
    expect(bad('choice', (d) => (d.answer = 9)).join()).toMatch(/index/);
    expect(bad('choice', (d) => (d.options = ['a', 'a', 'b'])).join()).toMatch(/unique/);
  });

  it('rejects a gap text whose gaps and answers do not fit', () => {
    expect(bad('cloze', (d) => (d.text = 'Nur eine Lücke {0} hier ohne die zweite.')).join()).toMatch(/gaps/);
    expect(bad('cloze', (d) => (d.bank = d.answers)).join()).toMatch(/wrong word/);
    expect(bad('cloze', (d) => (d.bank = ['x', 'y', 'z'])).join()).toMatch(/does not contain/);
  });

  it('rejects matching pairs that repeat a side', () => {
    expect(bad('match', (d) => (d.pairs = [['A', 'X'], ['A', 'Y'], ['B', 'Z']])).join()).toMatch(/left/);
    expect(bad('match', (d) => (d.pairs = [['A', 'X'], ['B', 'X'], ['C', 'Z']])).join()).toMatch(/right/);
    expect(bad('match', (d) => (d.pairs = [['A', 'X']])).join()).toMatch(/pairs/);
  });

  it('rejects a true/false question without a boolean answer', () => {
    expect(bad('truefalse', (d) => (d.answer = 'ja')).join()).toMatch(/true or false/);
  });

  it('rejects estimates without a sensible tolerance', () => {
    expect(bad('estimate', (d) => (d.tolerance = 3)).join()).toMatch(/tolerance/);
    expect(bad('estimate', (d) => (d.answer = 'viel')).join()).toMatch(/number/);
  });

  it('rejects bad fragments: no key, too many keys, no decoy, long hints', () => {
    expect(bad('choice', (d) => d.fragments.forEach((f: any) => (f.kind = 'context'))).join()).toMatch(/key/);
    expect(bad('choice', (d) => d.fragments.forEach((f: any) => (f.kind = 'key'))).join()).toMatch(/key/);
    expect(bad('choice', (d) => d.fragments.forEach((f: any) => f.kind === 'decoy' && (f.kind = 'context'))).join()).toMatch(/decoy/);
    expect(bad('choice', (d) => (d.fragments[0].hint = 'ein viel zu langes Etikett für ein Teil')).join()).toMatch(/hint/);
  });

  it('rejects a topic, intro or hint that gives the answer away', () => {
    const q = firstOf('choice') as Extract<Q, { type: 'choice' }>;
    const right = q.options[q.answer]!;
    expect(bad('choice', (d) => (d.intro = `Die Lösung ist ${right}, wie jeder weiß, der es gelernt hat.`)).join()).toMatch(/gives away/);
    expect(bad('choice', (d) => (d.topic = right)).join()).toMatch(/gives away/);
  });

  it('does not mistake a longer word for the answer', () => {
    const d = asDraft(firstOf('cloze')) as Record<string, any>;
    d.intro = 'Römische Technik und das Wort Romantik haben wenig miteinander zu tun, aber beides ist spannend.';
    d.answers = ['Rom', ...d.answers.slice(1)];
    d.bank = ['Rom', ...d.bank.filter((w: string) => w !== d.answers[0]).slice(0, 3)];
    expect(errorsOf(d).join()).not.toMatch(/gives away the answer "Rom"/);
  });

  it('rejects an unknown area, difficulty or type', () => {
    expect(bad('choice', (d) => (d.area = 'astrology')).join()).toMatch(/area/);
    expect(bad('choice', (d) => (d.difficulty = 9)).join()).toMatch(/difficulty/);
    expect(bad('choice', (d) => (d.type = 'riddle')).join()).toMatch(/type/);
  });
});

describe('AI: prompts and parsing', () => {
  it('asks for the right area, difficulty and type, and shows the shape of that type', () => {
    for (const type of QUESTION_TYPES) {
      const p = buildGenerationPrompt({ area: 'physics', difficulty: 2, type, count: 3, avoidTopics: ['Schall'] });
      expect(p).toContain('Physik');
      expect(p).toContain(`Type: ${type}`);
      expect(p).toContain('Difficulty: 2');
      expect(p).toContain('Schall');
      expect(p).toContain(`"type": "${type}"`);
    }
  });

  it('does not hard-wire a model name', () => {
    const p = buildGenerationPrompt({ area: 'arts', difficulty: 1, type: 'cloze', count: 1 });
    expect(p.toLowerCase()).not.toMatch(/gemini|gpt|claude/);
    // the scope of the area steers the topics
    expect(p).toContain('Renaissance');
  });

  it('finds JSON in plain, fenced and chatty answers', () => {
    expect(extractJson('[{"a":1}]')).toEqual([{ a: 1 }]);
    expect(extractJson('```json\n[{"a":1}]\n```')).toEqual([{ a: 1 }]);
    expect(extractJson('Hier sind die Fragen:\n[{"a":1}]\nViel Spaß!')).toEqual([{ a: 1 }]);
    expect(extractJson('kein json')).toBeUndefined();
    expect(parseDrafts('{"a":1}')).toEqual([{ a: 1 }]);
    expect(parseDrafts('nichts')).toEqual([]);
  });

  it('reads the checker answer strictly', () => {
    expect(parseCheck('{"ok":true,"issues":[]}')).toEqual({ ok: true, issues: [] });
    expect(parseCheck('{"ok":true,"issues":["unklar"]}').ok).toBe(false);
    expect(parseCheck('{"ok":false,"issues":["falsch"]}')).toEqual({ ok: false, issues: ['falsch'] });
    expect(parseCheck('keine Ahnung').ok).toBe(false);
    expect(buildCheckPrompt(MOCK_QUESTIONS[0]!)).toContain(MOCK_QUESTIONS[0]!.stem);
  });
});

describe('AI: the pipeline', () => {
  const fake = (text: string): QuestionGenerator => ({ generate: async () => text });

  it('keeps valid questions and drops invalid ones, for every type', async () => {
    for (const type of QUESTION_TYPES) {
      const q = MOCK_QUESTIONS.find((x) => x.type === type)!;
      const good = asDraft(q);
      const broken = { ...good, fragments: [] };
      const r = await generateQuestions(fake('```json\n' + JSON.stringify([good, broken]) + '\n```'), undefined, {
        area: q.area,
        difficulty: q.difficulty,
        type,
        count: 2,
      });
      expect(r.accepted, type).toHaveLength(1);
      expect(r.rejected, type).toHaveLength(1);
      expect(r.accepted[0]!.type).toBe(type);
    }
  });

  it('rejects questions of another area or type than asked for', async () => {
    const q = MOCK_QUESTIONS.find((x) => x.type === 'truefalse')!;
    const r = await generateQuestions(fake(JSON.stringify([asDraft(q)])), undefined, {
      area: q.area === 'arts' ? 'physics' : 'arts',
      difficulty: 1,
      type: 'truefalse',
      count: 1,
    });
    expect(r.accepted).toHaveLength(0);
    expect(r.rejected[0]!.reasons.join()).toMatch(/area/);
  });

  it('drops duplicates and known questions', async () => {
    const q = MOCK_QUESTIONS.find((x) => x.type === 'cloze')!;
    const d = asDraft(q);
    const req = { area: q.area, difficulty: q.difficulty, type: 'cloze' as const, count: 3 };
    const twice = await generateQuestions(fake(JSON.stringify([d, d])), undefined, req);
    expect(twice.accepted).toHaveLength(1);
    const known = new Set([twice.accepted[0]!.id]);
    const again = await generateQuestions(fake(JSON.stringify([d])), undefined, req, known);
    expect(again.accepted).toHaveLength(0);
  });

  it('lets the checker veto, and survives a checker that fails', async () => {
    const q = firstOf('match');
    const d = asDraft(q);
    const req = { area: q.area, difficulty: q.difficulty, type: 'match' as const, count: 1 };
    const veto: QuestionChecker = { check: async () => ({ ok: false, issues: ['Fakt falsch'] }) };
    const a = await generateQuestions(fake(JSON.stringify([d])), veto, req);
    expect(a.accepted).toHaveLength(0);
    expect(a.rejected[0]!.reasons).toEqual(['Fakt falsch']);
    const boom: QuestionChecker = {
      check: async () => {
        throw new Error('offline');
      },
    };
    const b = await generateQuestions(fake(JSON.stringify([d])), boom, req);
    expect(b.accepted).toHaveLength(0);
    expect(b.rejected[0]!.reasons.join()).toMatch(/checker failed/);
    const ok: QuestionChecker = { check: async () => ({ ok: true, issues: [] }) };
    expect((await generateQuestions(fake(JSON.stringify([d])), ok, req)).accepted).toHaveLength(1);
  });

  it('survives a generator that fails or answers nonsense', async () => {
    const req = { area: 'physics', difficulty: 1 as const, type: 'choice' as const, count: 1 };
    const down: QuestionGenerator = {
      generate: async () => {
        throw new Error('no network');
      },
    };
    expect((await generateQuestions(down, undefined, req)).accepted).toHaveLength(0);
    const nonsense = await generateQuestions(fake('Ich bin eine freundliche KI!'), undefined, req);
    expect(nonsense.accepted).toHaveLength(0);
    expect(nonsense.rejected[0]!.reasons.join()).toMatch(/no JSON/);
  });
});
