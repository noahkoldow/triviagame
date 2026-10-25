import { describe, expect, it } from 'vitest';
import {
  MOCK_QUESTIONS,
  answerText,
  buildCheckPrompt,
  distanceKm,
  fileText,
  formatLatLon,
  generateQuestions,
  groundingEvidence,
  isCorrect,
  redact,
  redactedParts,
  riddleBonus,
  validateChart,
  validateDraft,
  validateFiles,
  type LocateQuestion,
  type Question,
  type RiddleQuestion,
  type SourceQuestion,
} from './index';

const byType = <T extends Question>(t: string) => MOCK_QUESTIONS.find((q) => q.type === t) as T;

/** A built-in question as the model would send it, with some fields changed. */
const draft = (q: Question, patch: Record<string, unknown> = {}) => {
  const { id: _i, deepen: _d, bridge: _b, fragments, ...rest } = JSON.parse(JSON.stringify(q));
  return { ...rest, fragments: fragments.map(({ id: _f, ...f }: Record<string, unknown>) => f), ...patch };
};

describe('tap the place on a map', () => {
  const q = byType<LocateQuestion>('locate');

  it('measures distances on the globe', () => {
    // Paris – Berlin is about 880 km
    expect(distanceKm(48.86, 2.35, 52.52, 13.4)).toBeGreaterThan(860);
    expect(distanceKm(48.86, 2.35, 52.52, 13.4)).toBeLessThan(900);
    expect(distanceKm(10, 20, 10, 20)).toBe(0);
  });

  it('is right within the tolerance only', () => {
    expect(isCorrect(q, { type: 'locate', lat: q.lat, lon: q.lon })).toBe(true);
    // Alexandria is close enough to Cairo, Khartoum is not
    expect(isCorrect(q, { type: 'locate', lat: 31.2, lon: 29.9 })).toBe(true);
    expect(isCorrect(q, { type: 'locate', lat: 15.5, lon: 32.6 })).toBe(false);
    expect(answerText(q, 'de')).toBe('Kairo (30° N, 31° O)');
    expect(formatLatLon(-33.9, -70.6, 'es')).toBe('34° S, 71° O');
    expect(formatLatLon(40.4, -3.7, 'en')).toBe('40° N, 4° W');
  });

  it('rejects places outside their map and silly tolerances', () => {
    expect(validateDraft(draft(q)).ok).toBe(true);
    expect(validateDraft(draft(q, { lat: 60 })).ok).toBe(false);
    expect(validateDraft(draft(q, { tolerance: 5000 })).ok).toBe(false);
    expect(validateDraft(draft(q, { region: { west: 10, south: 0, east: 12, north: 45 } })).ok).toBe(false);
  });
});

describe('who am I?', () => {
  const q = byType<RiddleQuestion>('riddle');

  it('pays more the fewer clues were open', () => {
    expect(isCorrect(q, { type: 'riddle', index: q.answer, clues: 3 })).toBe(true);
    expect(isCorrect(q, { type: 'riddle', index: q.answer + 1, clues: 1 })).toBe(false);
    expect(riddleBonus(q, { type: 'riddle', index: q.answer, clues: 1 })).toBe(6);
    expect(riddleBonus(q, { type: 'riddle', index: q.answer, clues: q.clues.length })).toBe(0);
    expect(riddleBonus(q, { type: 'riddle', index: q.answer + 1, clues: 1 })).toBe(0);
  });

  it('rejects a clue that names the answer', () => {
    expect(validateDraft(draft(q)).ok).toBe(true);
    const v = validateDraft(draft(q, { clues: [...q.clues.slice(0, 2), 'Man nennt mich Marie Curie, die Forscherin.'] }));
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.errors.join()).toMatch(/clue gives away/);
  });
});

describe('check the source', () => {
  const q = byType<SourceQuestion>('source');

  it('is right for the reliable source only', () => {
    expect(isCorrect(q, { type: 'source', index: q.reliable })).toBe(true);
    expect(isCorrect(q, { type: 'source', index: (q.reliable + 1) % q.sources.length })).toBe(false);
    expect(answerText(q, 'de')).toBe(q.sources[q.reliable]!.name);
  });

  it('needs an origin for every source', () => {
    expect(validateDraft(draft(q)).ok).toBe(true);
    expect(validateDraft(draft(q, { sources: q.sources.map((s) => ({ ...s, origin: '' })) })).ok).toBe(false);
    expect(validateDraft(draft(q, { sources: q.sources.slice(0, 1), reliable: 0 })).ok).toBe(false);
  });
});

describe('redacted files and maps', () => {
  it('hides what morph.ai blacked out, also from the search', () => {
    const text = 'Der Fluss mündet bei [[Alexandria]] ins Meer.';
    expect(redactedParts(text)).toEqual([
      { text: 'Der Fluss mündet bei ', hidden: false },
      { text: 'Alexandria', hidden: true },
      { text: ' ins Meer.', hidden: false },
    ]);
    expect(redact(text)).toBe('Der Fluss mündet bei ██████████ ins Meer.');
    expect(fileText({ name: 'Beschaedigt.txt', kind: 'redacted', text })).not.toContain('Alexandria');
    expect(validateFiles([{ name: 'Beschaedigt.txt', kind: 'redacted', text }]).errors).toEqual([]);
    expect(validateFiles([{ name: 'Beschaedigt.txt', kind: 'redacted', text: 'Nichts ist geschwärzt.' }]).errors[0]).toMatch(/1 to 3 words/);
  });

  it('checks the places of a map', () => {
    const map = (places: unknown, region?: unknown) => validateChart({ chart: 'map', title: 'Nil', places, ...(region ? { region } : {}) }).errors;
    expect(map([{ label: 'Kairo', lat: 30, lon: 31 }])).toEqual([]);
    expect(map([{ label: 'Kairo', lat: 30, lon: 31 }], { west: 20, south: 10, east: 45, north: 35 })).toEqual([]);
    expect(map([{ label: 'Kairo', lat: 30, lon: 31 }], { west: 40, south: 10, east: 60, north: 35 })).toContain('every place must lie inside the region');
    expect(map([{ label: 'Nirgendwo', lat: 120, lon: 31 }]).join()).toMatch(/latitude/);
    expect(map([])).toContain('a map needs 1 to 6 places');
  });
});

describe('checking with a web search', () => {
  it('keeps only web links from the grounding, each once', () => {
    const meta = {
      groundingChunks: [
        { web: { uri: 'https://example.org/a', title: 'A' } },
        { web: { uri: 'https://example.org/a', title: 'A again' } },
        { web: { uri: 'javascript:alert(1)' } },
        { retrievedContext: { uri: 'gs://x' } },
        { web: { uri: 'https://example.org/b' } },
      ],
    };
    expect(groundingEvidence(meta)).toEqual([{ uri: 'https://example.org/a', title: 'A' }, { uri: 'https://example.org/b' }]);
    expect(groundingEvidence(undefined)).toEqual([]);
    expect(groundingEvidence({ groundingChunks: 'nope' })).toEqual([]);
  });

  it('asks the checker to search only when grounded', () => {
    const q = MOCK_QUESTIONS[0]!;
    expect(buildCheckPrompt(q, true)).toMatch(/Google Search/);
    expect(buildCheckPrompt(q)).not.toMatch(/Google Search/);
  });

  it('passes what the checker found on with the accepted question', async () => {
    const q = byType<LocateQuestion>('locate');
    const generator = { generate: async () => JSON.stringify([draft(q, { lang: 'de' })]) };
    const evidence = [{ uri: 'https://example.org/cairo' }];
    const checker = { check: async () => ({ ok: true, issues: [], evidence }) };
    const r = await generateQuestions(generator, checker, { area: q.area, difficulty: q.difficulty, type: 'locate', count: 1, lang: 'de' });
    expect(r.accepted).toHaveLength(1);
    expect(r.evidence[r.accepted[0]!.id]).toEqual(evidence);
  });
});
