import type { Answer, Question } from './types';

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
export function answerText(q: Question): string {
  switch (q.type) {
    case 'choice':
      return q.options[q.answer] ?? '';
    case 'estimate':
      return `${q.answer} ${q.unit}`.trim();
    case 'order':
      return q.items.join(' → ');
    case 'truefalse':
      return q.answer ? 'Stimmt' : 'Stimmt nicht';
    case 'match':
      return q.pairs.map(([l, r]) => `${l} – ${r}`).join(', ');
    case 'cloze':
      return q.answers.join(', ');
  }
}
