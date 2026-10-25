import { seededRng, type Rng } from './rng';
import type { Fragment, Question } from './types';

export interface SessionParams {
  /** How many fragments the player can keep in the cache. */
  slots: number;
  /** How many debris pieces lie around the node. */
  fieldSize: number;
}

export function sessionParams(q: Question): SessionParams {
  const keys = q.fragments.filter((f) => f.kind === 'key').length;
  const slots = Math.max(3, keys + 1);
  const fieldSize = Math.min(q.fragments.length, slots + 1 + Math.ceil(q.difficulty / 2));
  return { slots, fieldSize };
}

function shuffle<T>(items: T[], rng: Rng): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/**
 * Chooses the debris pieces for one attempt. Key fragments are always present
 * (fairness rule); the rest is filled with context and decoys. A different
 * `variant` gives a different mix and order for retries.
 */
export function buildField(q: Question, variant: number): Fragment[] {
  const rng = seededRng(`${q.id}:${variant}`);
  const { fieldSize } = sessionParams(q);
  const keys = q.fragments.filter((f) => f.kind === 'key');
  const rest = shuffle(
    q.fragments.filter((f) => f.kind !== 'key'),
    rng,
  );
  return shuffle([...keys, ...rest.slice(0, Math.max(0, fieldSize - keys.length))], rng);
}

/** Shuffles choice options per attempt; returns the new options and index of the answer. */
export function variantOptions(
  q: Extract<Question, { type: 'choice' }>,
  variant: number,
): { options: string[]; answer: number } {
  const rng = seededRng(`opt:${q.id}:${variant}`);
  const idx = shuffle(
    q.options.map((_, i) => i),
    rng,
  );
  return { options: idx.map((i) => q.options[i]!), answer: idx.indexOf(q.answer) };
}

/** The options of a question with several right answers, shuffled per attempt (as indices into `q.options`). */
export function variantMulti(q: Extract<Question, { type: 'multi' }>, variant: number): number[] {
  return shuffle(
    q.options.map((_, i) => i),
    seededRng(`multi:${q.id}:${variant}`),
  );
}

/** The items of a sorting question, shuffled per attempt. */
export function variantSort(q: Extract<Question, { type: 'sort' }>, variant: number): string[] {
  return shuffle(
    q.items.map((it) => it[0]),
    seededRng(`sort:${q.id}:${variant}`),
  );
}

/** The right-hand column of a matching question, shuffled per attempt; never already in order. */
export function variantMatch(q: Extract<Question, { type: 'match' }>, variant: number): string[] {
  const rights = q.pairs.map((p) => p[1]);
  const rng = seededRng(`mat:${q.id}:${variant}`);
  for (let i = 0; i < 8; i++) {
    const s = shuffle(rights, rng);
    if (s.some((r, k) => r !== rights[k])) return s;
  }
  return [...rights].reverse();
}

/** The word bank of a cloze question, shuffled per attempt. */
export function variantBank(q: Extract<Question, { type: 'cloze' }>, variant: number): string[] {
  return shuffle(q.bank, seededRng(`bank:${q.id}:${variant}`));
}

/** Order questions are shown shuffled; never in the solved order. */
export function variantOrder(q: Extract<Question, { type: 'order' }>, variant: number): string[] {
  const rng = seededRng(`ord:${q.id}:${variant}`);
  for (let i = 0; i < 8; i++) {
    const s = shuffle(q.items, rng);
    if (s.some((it, k) => it !== q.items[k])) return s;
  }
  return [...q.items].reverse();
}
