import { acceptServed, type PoolRequest, type Question } from '@nexus/shared';

/**
 * The content API: the app asks our backend for questions by area, level and language and never sends a
 * prompt. The backend answers from its shared pool of checked questions and writes new ones
 * with the model only when needed. Every question that comes back is validated here again
 * (`acceptServed`), so nothing malformed can reach the game.
 */

export type Fetch = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export interface QuestionApi {
  /** True when a backend answers; false offline (built-in questions only). */
  live: boolean;
  fetch(req: PoolRequest): Promise<Question[]>;
}

/** Writing new questions can take the backend a while; after this the app stops waiting. */
const TIMEOUT_MS = 45_000;

export function httpQuestionApi(base: string, doFetch: Fetch = fetch as unknown as Fetch): QuestionApi {
  return {
    live: true,
    async fetch(req) {
      const abort = new AbortController();
      const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);
      const res = await doFetch(`${base}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area: req.area, difficulty: req.difficulty, count: req.count, have: req.have, lang: req.lang }),
        signal: abort.signal,
      }).finally(() => clearTimeout(timer));
      if (!res.ok) throw new Error(`backend answered ${res.status}`);
      const data = (await res.json()) as { questions?: unknown };
      if (!Array.isArray(data.questions)) throw new Error('backend answer has no questions');
      return data.questions.map((q) => acceptServed(q, req.lang)).filter((q): q is Question => q !== null);
    },
  };
}

/** Without a backend there is nothing new to fetch; the built-in questions carry the game. */
export const offlineQuestionApi: QuestionApi = { live: false, fetch: async () => [] };

export function questionApi(base: string, doFetch?: Fetch): QuestionApi {
  return base ? httpQuestionApi(base, doFetch) : offlineQuestionApi;
}
