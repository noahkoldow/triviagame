import { describe, expect, it } from 'vitest';
import {
  LANGS,
  MOCK_QUESTIONS,
  NOTE_FILE,
  QUESTION_TEXTS,
  acceptServed,
  answerText,
  buildCheckPrompt,
  buildGenerationPrompt,
  poolKey,
  fileText,
  fragmentFiles,
  isCorrect,
  isLang,
  langFromLocale,
  localizeQuestion,
  parseNumber,
  relinkCacheFiles,
  validateDraft,
  type Answer,
  type Lang,
  type Question,
} from './index';

const FOREIGN = LANGS.filter((l): l is Exclude<Lang, 'de'> => l !== 'de');

/** A question as the model would send it: no ids (so it runs through the same validator as AI drafts). */
const asDraft = (q: Question) => {
  const { id: _id, fragments, deepen: _d, bridge: _b, ...rest } = JSON.parse(JSON.stringify(q));
  return { ...rest, fragments: fragments.map(({ id: _fid, ...f }: Record<string, unknown>) => f) };
};

/** The right answer of a question, as the player would enter it. */
function rightAnswer(q: Question): Answer {
  switch (q.type) {
    case 'choice':
      return { type: 'choice', index: q.answer };
    case 'estimate':
      return { type: 'estimate', value: q.answer };
    case 'order':
      return { type: 'order', items: q.items };
    case 'truefalse':
      return { type: 'truefalse', value: q.answer };
    case 'match':
      return { type: 'match', pairs: Object.fromEntries(q.pairs) };
    case 'cloze':
      return { type: 'cloze', words: q.answers };
    case 'multi':
      return { type: 'multi', indices: q.answers };
    case 'sort':
      return { type: 'sort', groups: Object.fromEntries(q.items) };
    case 'spot':
      return { type: 'spot', index: q.wrong };
    case 'locate':
      return { type: 'locate', lat: q.lat, lon: q.lon };
    case 'riddle':
      return { type: 'riddle', index: q.answer, clues: 1 };
    case 'source':
      return { type: 'source', index: q.reliable };
  }
}

describe('languages', () => {
  it('maps device locales to a game language, English for the rest', () => {
    expect(langFromLocale('de-AT')).toBe('de');
    expect(langFromLocale('fr_CA')).toBe('fr');
    expect(langFromLocale('es-419')).toBe('es');
    expect(langFromLocale('en-GB')).toBe('en');
    expect(langFromLocale('it-IT')).toBe('en');
    expect(langFromLocale(undefined)).toBe('en');
    expect(isLang('fr')).toBe(true);
    expect(isLang('it')).toBe(false);
  });

  it('reads numbers the way each language writes them', () => {
    expect(parseNumber('8.849', 'de')).toBe(8849);
    expect(parseNumber('13,8', 'de')).toBe(13.8);
    expect(parseNumber('8,849', 'en')).toBe(8849);
    expect(parseNumber('13.8', 'en')).toBe(13.8);
    expect(parseNumber('8 849', 'fr')).toBe(8849);
    expect(parseNumber('8 849', 'fr')).toBe(8849);
    expect(parseNumber('13,8', 'fr')).toBe(13.8);
    expect(parseNumber('300.000', 'es')).toBe(300000);
    expect(parseNumber('1.234,5', 'es')).toBe(1234.5);
    // lenient: a dot with one decimal is a decimal sign everywhere
    expect(parseNumber('13.8', 'de')).toBe(13.8);
    expect(parseNumber('2015', 'fr')).toBe(2015);
    expect(parseNumber('-4', 'en')).toBe(-4);
    expect(parseNumber('', 'de')).toBeNull();
    expect(parseNumber('zwölf', 'de')).toBeNull();
  });
});

describe('the AI writes in the player’s language', () => {
  const draft = asDraft(MOCK_QUESTIONS.find((q) => q.type === 'match')!);

  it('asks the model for the language, with area names and file names in it', () => {
    const fr = buildGenerationPrompt({ area: 'physics', difficulty: 2, type: 'choice', count: 3, lang: 'fr' });
    expect(fr).toContain('played in French');
    expect(fr).toContain('Sciences naturelles');
    expect(fr).toContain('"lang": "fr"');
    expect(fr).toContain('Diagramme.png');
    expect(fr).not.toMatch(/German/);
    const es = buildGenerationPrompt({ area: 'law', difficulty: 1, type: 'cloze', count: 1, lang: 'es' });
    expect(es).toContain('in Spanish');
    expect(es).toContain('Derecho y sociedad');
    expect(buildCheckPrompt({ ...MOCK_QUESTIONS[0]!, lang: 'en' })).toContain('correct, natural English');
    expect(buildCheckPrompt(MOCK_QUESTIONS[0]!)).toContain('German');
  });

  it('stamps drafts with the asked language and refuses another one', () => {
    const v = validateDraft(draft, { lang: 'es' });
    expect(v.ok && v.question.lang).toBe('es');
    const other = validateDraft({ ...draft, lang: 'fr' }, { lang: 'es' });
    expect(other.ok).toBe(false);
    expect(validateDraft({ ...draft, lang: 'tlh' }).ok).toBe(false);
    // the language does not change the id: the stem already differs between languages
    const de = validateDraft(draft);
    expect(de.ok && v.ok && de.question.id === v.question.id).toBe(true);
    expect(de.ok && de.question.lang).toBe(undefined);
  });

  it('keeps a pool per language and only accepts served questions in the asked one', () => {
    expect(poolKey('physics', 'fr')).toBe('fr_physics');
    expect(poolKey('physics', 'de')).not.toBe(poolKey('physics', 'en'));
    const v = validateDraft(draft, { lang: 'fr' });
    if (!v.ok) throw new Error('draft must validate');
    expect(acceptServed(v.question, 'fr')?.lang).toBe('fr');
    expect(acceptServed(v.question, 'en')).toBeNull();
    // questions without a language are German (the pool before the language picker)
    const plain = validateDraft(draft);
    if (!plain.ok) throw new Error('draft must validate');
    expect(acceptServed(plain.question, 'de')).not.toBeNull();
    expect(acceptServed(plain.question, 'es')).toBeNull();
  });
});

describe('built-in questions in every language', () => {
  it('has a translation of every question and nothing else', () => {
    for (const lang of FOREIGN) {
      const ids = Object.keys(QUESTION_TEXTS[lang]).sort();
      expect(ids, lang).toEqual(MOCK_QUESTIONS.map((q) => q.id).sort());
    }
  });

  it('keeps ids, answers and structure; only the words change', () => {
    for (const lang of FOREIGN) {
      for (const src of MOCK_QUESTIONS) {
        const q = localizeQuestion(src, lang);
        const at = `${lang} ${src.id}`;
        expect(q.id, at).toBe(src.id);
        expect(q.type, at).toBe(src.type);
        expect(q.difficulty, at).toBe(src.difficulty);
        expect(q.fragments.map((f) => [f.id, f.kind]), at).toEqual(src.fragments.map((f) => [f.id, f.kind]));
        expect(QUESTION_TEXTS[lang][src.id]!.f, at).toHaveLength(src.fragments.length);
        expect(q.stem, at).not.toBe(src.stem);
        // the right answer of the source is still right, and only that
        expect(isCorrect(q, rightAnswer(q)), at).toBe(true);
        if (q.type === 'choice' && src.type === 'choice') expect(q.options, at).toHaveLength(src.options.length);
        if (q.type === 'order' && src.type === 'order') expect(q.items, at).toHaveLength(src.items.length);
        if (q.type === 'match' && src.type === 'match') expect(q.pairs, at).toHaveLength(src.pairs.length);
        if (q.type === 'cloze' && src.type === 'cloze') {
          expect(q.answers, at).toHaveLength(src.answers.length);
          expect(q.bank, at).toHaveLength(src.bank.length);
        }
        if (q.type === 'estimate' && src.type === 'estimate') expect(q.unit === '', at).toBe(src.unit === '');
        expect(answerText(q, lang).length, at).toBeGreaterThan(0);
      }
    }
  });

  it('passes the same rules as AI drafts (lengths, no answer given away, files)', () => {
    const failed: string[] = [];
    for (const lang of FOREIGN) {
      for (const src of MOCK_QUESTIONS) {
        const v = validateDraft(asDraft(localizeQuestion(src, lang)));
        if (!v.ok) failed.push(`${lang} ${src.id}: ${v.errors.join('; ')}`);
      }
    }
    expect(failed).toEqual([]);
  });

  it('gives every folder its files, with the same kinds and charts as the source', () => {
    for (const lang of FOREIGN) {
      for (const src of MOCK_QUESTIONS) {
        const q = localizeQuestion(src, lang);
        src.fragments.forEach((f, i) => {
          const at = `${lang} ${src.id} f${i + 1}`;
          const mine = q.fragments[i]!.files!;
          if (!f.files?.length) {
            // a plain note under a name in the language
            expect(mine, at).toEqual([{ name: NOTE_FILE[lang], kind: 'note', text: q.fragments[i]!.text }]);
            return;
          }
          expect(mine.map((x) => x.kind), at).toEqual(f.files.map((x) => x.kind));
          mine.forEach((x, k) => {
            const s = f.files![k]!;
            expect(x.chart?.chart, at).toBe(s.chart?.chart);
            if (x.chart?.chart === 'bars' && s.chart?.chart === 'bars') expect(x.chart.items.map((b) => b.value), at).toEqual(s.chart.items.map((b) => b.value));
            if (x.chart?.chart === 'timeline' && s.chart?.chart === 'timeline') expect(x.chart.events.map((e) => e.year), at).toEqual(s.chart.events.map((e) => e.year));
          });
        });
      }
    }
  });

  it('keeps the numbers of a fragment findable in its folder', () => {
    // grouping signs differ per language: 8,849 / 8 849 / 8.849 are all 8849
    const plain = (s: string) => s.replace(/(\d)[.,\s  ](\d{3})(?!\d)/g, '$1$2');
    const nums = (s: string) => (plain(s).match(/\d+/g) ?? []).filter((n) => n.length >= 2 || Number(n) > 1);
    for (const lang of FOREIGN) {
      for (const src of MOCK_QUESTIONS) {
        const q = localizeQuestion(src, lang);
        q.fragments.forEach((f, i) => {
          if (!src.fragments[i]!.files?.length) return;
          const all = plain(fragmentFiles(f).map(fileText).join('\n'));
          for (const n of nums(f.text)) expect(all, `${lang} ${src.id} / ${f.hint}: ${n}`).toContain(n);
        });
      }
    }
  });

  it('keeps carried files when the language changes (file names are words of the language)', () => {
    const q = MOCK_QUESTIONS.find((x) => x.id === 'sci-light')!;
    const de = (id: string) => MOCK_QUESTIONS.find((x) => x.id === id);
    const en = (id: string) => {
      const src = de(id);
      return src && localizeQuestion(src, 'en');
    };
    const cache = [
      { questionId: q.id, fragmentId: q.fragments[0]!.id, file: 'Planeten.png' },
      // a folder without files: its note
      { questionId: q.id, fragmentId: q.fragments[2]!.id, file: 'Notiz.txt' },
      { questionId: q.id, fragmentId: q.fragments[0]!.id, file: 'gibt-es-nicht.txt' },
    ];
    const moved = relinkCacheFiles(cache, de, en);
    expect(moved.map((c) => c.file)).toEqual(['Planets.png', 'Note.txt']);
    expect(relinkCacheFiles(moved, en, de).map((c) => c.file)).toEqual(['Planeten.png', 'Notiz.txt']);
  });

  it('leaves German and questions from the server as they are', () => {
    const src = MOCK_QUESTIONS[0]!;
    expect(localizeQuestion(src, 'de')).toBe(src);
    const served: Question = { ...src, id: 'ai-x', lang: 'fr' };
    const shown = localizeQuestion(served, 'en');
    expect(shown.stem).toBe(src.stem);
    expect(shown.lang).toBe('fr');
  });
});
