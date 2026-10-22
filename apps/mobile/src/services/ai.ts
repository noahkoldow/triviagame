import {
  MOCK_QUESTIONS,
  buildCheckPrompt,
  generateQuestions,
  parseCheck,
  type CheckResult,
  type GenerationRequest,
  type GenerationResult,
  type Question,
  type QuestionChecker,
  type QuestionGenerator,
} from '@nexus/shared';

/**
 * The AI providers. All of them return plain text that the shared pipeline parses and
 * validates (`generateQuestions`), so nothing here can put a bad question into the game.
 */

type Fetch = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

async function post(endpoint: string, body: unknown, doFetch: Fetch, token?: string): Promise<string> {
  const res = await doFetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`backend answered ${res.status}`);
  const data = (await res.json()) as { text?: unknown };
  if (typeof data.text !== 'string') throw new Error('backend answer has no text');
  return data.text;
}

/**
 * Calls our own backend, which holds the key, picks the model and enforces the daily budget
 * and the kill switch. The app sends only the prompt: no player data.
 */
export function httpGenerator(endpoint: string, doFetch: Fetch = fetch as unknown as Fetch, token?: string): QuestionGenerator {
  return { generate: (prompt) => post(endpoint, { task: 'generate', prompt }, doFetch, token) };
}

/** The second pass (the "checker"), also through the backend. */
export function httpChecker(endpoint: string, doFetch: Fetch = fetch as unknown as Fetch, token?: string): QuestionChecker {
  return {
    async check(q: Question): Promise<CheckResult> {
      return parseCheck(await post(endpoint, { task: 'check', prompt: buildCheckPrompt(q) }, doFetch, token));
    },
  };
}

/**
 * Offline stand-in: answers in the JSON the model would send, taken from the built-in questions
 * of the asked area and type. Used for development and tests, and while no backend is set up.
 */
export function mockGenerator(source: Question[] = MOCK_QUESTIONS): QuestionGenerator {
  return {
    async generate(_prompt, req) {
      const hits = source
        .filter((q) => (!req || (q.area === req.area && q.type === req.type)))
        .slice(0, req?.count ?? 3)
        .map((q) => {
          const { id: _id, fragments, deepen: _d, bridge: _b, ...rest } = JSON.parse(JSON.stringify(q));
          return { ...rest, fragments: fragments.map(({ id: _f, ...f }: Record<string, unknown>) => f) };
        });
      return JSON.stringify(hits);
    },
  };
}

/** Asks for questions: through the backend when there is one, otherwise from the built-in set. */
export function questionSource(endpoint: string, doFetch?: Fetch) {
  const live = endpoint !== '';
  const generator = live ? httpGenerator(endpoint, doFetch) : mockGenerator();
  const checker = live ? httpChecker(endpoint, doFetch) : undefined;
  return {
    live,
    fetch(req: GenerationRequest, known?: Set<string>): Promise<GenerationResult> {
      return generateQuestions(generator, checker, req, known);
    },
  };
}
