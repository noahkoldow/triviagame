import type { Lang } from './lang';
import type { Answer, Question } from './types';

/** The two buttons of a true/false question. */
export const TRUE_FALSE: Record<Lang, { yes: string; no: string }> = {
  de: { yes: 'Stimmt', no: 'Stimmt nicht' },
  en: { yes: 'True', no: 'False' },
  fr: { yes: 'Vrai', no: 'Faux' },
  es: { yes: 'Verdadero', no: 'Falso' },
};

export function isCorrect(q: Question, a: Answer): boolean {
  if (q.type !== a.type) return false;
  switch (q.type) {
    case 'choice':
      return a.type === 'choice' && a.index === q.answer;
    case 'estimate': {
      if (a.type !== 'estimate') return false;
      const tol = Math.abs(q.answer) * q.tolerance;
      return Math.abs(a.value - q.answer) <= tol;
    }
    case 'order':
      return (
        a.type === 'order' &&
        a.items.length === q.items.length &&
        a.items.every((it, i) => it === q.items[i])
      );
    case 'truefalse':
      return a.type === 'truefalse' && a.value === q.answer;
    case 'match':
      return a.type === 'match' && q.pairs.every(([l, r]) => a.pairs[l] === r);
    case 'cloze':
      return (
        a.type === 'cloze' &&
        a.words.length === q.answers.length &&
        a.words.every((w, i) => w === q.answers[i])
      );
  }
}

/** The right answer as text, for feedback. */
export function answerText(q: Question, lang: Lang): string {
  switch (q.type) {
    case 'choice':
      return q.options[q.answer] ?? '';
    case 'estimate':
      // years must not be grouped, so only the decimal sign follows the language
      return `${lang === 'en' ? q.answer : String(q.answer).replace('.', ',')} ${q.unit}`.trim();
    case 'order':
      return q.items.join(' → ');
    case 'truefalse':
      return q.answer ? TRUE_FALSE[lang].yes : TRUE_FALSE[lang].no;
    case 'match':
      return q.pairs.map(([l, r]) => `${l} – ${r}`).join(', ');
    case 'cloze':
      return q.answers.join(', ');
  }
}

/**
 * A typed number as the player's language writes it. English groups with "," and uses "." for
 * decimals, German, French and Spanish the other way round (French also groups with spaces).
 * Lenient: with both signs the last one is the decimal sign, and a sign that is not followed by
 * exactly three digits is read as decimals. Null when it is not a number.
 */
export function parseNumber(text: string, lang: Lang): number | null {
  let t = text.trim().replace(/[\s\u00A0\u202F']/g, '');
  const group = lang === 'en' ? ',' : '.';
  const dots = (t.match(/\./g) ?? []).length;
  const commas = (t.match(/,/g) ?? []).length;
  if (dots && commas) {
    const decimal = t.lastIndexOf('.') > t.lastIndexOf(',') ? '.' : ',';
    t = t.split(decimal === '.' ? ',' : '.').join('');
    t = t.replace(decimal, '.');
  } else if (dots + commas > 0) {
    const sign = dots ? '.' : ',';
    const grouping = dots + commas > 1 || (sign === group && /^[-+]?\d{1,3}[.,]\d{3}$/.test(t));
    t = grouping ? t.split(sign).join('') : t.replace(sign, '.');
  }
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(t)) return null;
  const v = Number(t);
  return Number.isFinite(v) ? v : null;
}
