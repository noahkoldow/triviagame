import { NOTE_FILE } from './files';
import { CONTENT_EN } from './i18n/content.en';
import { CONTENT_ES } from './i18n/content.es';
import { CONTENT_FR } from './i18n/content.fr';
import type { Lang } from './lang';
import type { FragmentFile, Question } from './types';

/**
 * The built-in questions in every language. The German questions in `content.ts` are the source:
 * ids, areas, answers (indices, numbers, true/false), difficulty and the links between questions
 * live there. A translation only holds the words a player reads, in the same order, so a node
 * keeps its question when the player changes the language.
 */
export interface QuestionText {
  topic: string;
  intro: string;
  stem: string;
  /** The explanation after answering. */
  why: string;
  /** [hint, text] of every fragment, in the order of the source. */
  f: [string, string][];
  /** The files of the fragments that have some in the source, by fragment number (1 = "-f1"). */
  files?: Record<number, FragmentFile[]>;
  /** choice: the options in the source's order (the answer index stays). */
  options?: string[];
  /** estimate */
  unit?: string;
  /** order: the items in the right order. */
  items?: string[];
  /** match: the pairs in the source's order. */
  pairs?: [string, string][];
  /** cloze */
  text?: string;
  answers?: string[];
  bank?: string[];
}

/** Translations of the built-in questions by language and question id (German is the source). */
export const QUESTION_TEXTS: Record<Exclude<Lang, 'de'>, Record<string, QuestionText>> = {
  en: CONTENT_EN,
  fr: CONTENT_FR,
  es: CONTENT_ES,
};

/** Folders without files get their plain note under a name in that language. */
function withNotes(q: Question, lang: Lang): Question {
  if (lang === 'de' || q.fragments.every((f) => f.files?.length)) return q;
  return {
    ...q,
    fragments: q.fragments.map((f) =>
      f.files?.length ? f : { ...f, files: [{ name: NOTE_FILE[lang], kind: 'note', text: f.text }] },
    ),
  };
}

/**
 * A question as the player reads it in `lang`. Questions from the server are written in one
 * language and stay as they are; built-in questions are translated (German if a translation is
 * missing).
 */
export function localizeQuestion(q: Question, lang: Lang): Question {
  if (q.lang) return withNotes(q, q.lang);
  if (lang === 'de') return q;
  const t = QUESTION_TEXTS[lang][q.id];
  if (!t) return q;
  const base = {
    ...q,
    topic: t.topic,
    intro: t.intro,
    stem: t.stem,
    explanation: t.why,
    fragments: q.fragments.map((f, i) => {
      const [hint, text] = t.f[i] ?? [f.hint, f.text];
      const files = t.files?.[i + 1];
      return { ...f, hint, text, ...(files ? { files } : {}) };
    }),
  };
  return withNotes(typedText(base, q, t), lang);
}

/** The type's own words; answers that are not words (index, number, true/false) stay the source's. */
function typedText(base: Omit<Question, 'type'>, q: Question, t: QuestionText): Question {
  switch (q.type) {
    case 'choice':
      return { ...base, type: 'choice', options: t.options ?? q.options, answer: q.answer };
    case 'estimate':
      return { ...base, type: 'estimate', answer: q.answer, tolerance: q.tolerance, unit: t.unit ?? q.unit };
    case 'order':
      return { ...base, type: 'order', items: t.items ?? q.items };
    case 'truefalse':
      return { ...base, type: 'truefalse', answer: q.answer };
    case 'match':
      return { ...base, type: 'match', pairs: t.pairs ?? q.pairs };
    case 'cloze':
      return { ...base, type: 'cloze', text: t.text ?? q.text, answers: t.answers ?? q.answers, bank: t.bank ?? q.bank };
  }
}
