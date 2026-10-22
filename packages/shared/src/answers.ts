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
  }
}
