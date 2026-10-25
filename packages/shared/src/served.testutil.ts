import { MOCK_QUESTIONS } from './content';
import { Pool } from './network';

/**
 * The built-in questions plus copies under new ids, as if the question server had refilled every
 * area (D46). The zones are bigger than the built-in questions alone can fill, so tests that play
 * up to the walls use this pool.
 */
export function servedPool(copies = 4): Pool {
  return new Pool([
    ...MOCK_QUESTIONS,
    ...Array.from({ length: copies }, (_, k) => MOCK_QUESTIONS.map((q) => ({ ...q, id: `${q.id}~${k + 1}` }))).flat(),
  ]);
}
