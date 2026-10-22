import { validateFiles } from './files';
import { hashString } from './rng';
import { AREAS, areaById } from './taxonomy';
import type { Fragment, FragmentKind, Question, QuestionType, Sector } from './types';

/**
 * The AI side of the content: what the model is asked for, and what is accepted from it.
 * Nothing the model writes reaches a player unchecked: it is parsed, validated against a
 * strict schema for every question type, and can be sent through a second "checker" pass.
 * The model itself sits behind `QuestionGenerator` / `QuestionChecker`, so it can be a mock,
 * a backend function or any provider, without changing the game.
 */

export const QUESTION_TYPES: QuestionType[] = ['choice', 'estimate', 'order', 'truefalse', 'match', 'cloze'];

export interface GenerationRequest {
  /** One of the fixed taxonomy areas: the model picks within it, it does not invent topics. */
  area: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  type: QuestionType;
  /** How many questions to ask for. */
  count: number;
  /** Topics that already exist in this area, to avoid. */
  avoidTopics?: string[];
}

/** The model returns text; the validator decides what is usable. */
export interface QuestionGenerator {
  generate(prompt: string, request?: GenerationRequest): Promise<string>;
}

export interface CheckResult {
  ok: boolean;
  issues: string[];
}

/** The second pass: is the answer unambiguous, are the decoys really wrong, is it solvable from the fragments? */
export interface QuestionChecker {
  check(q: Question): Promise<CheckResult>;
}

// ---------------------------------------------------------------------------
// Prompt

/** The JSON shape of one question per type, as shown to the model. */
const SHAPES: Record<QuestionType, string> = {
  choice: '{ "type": "choice", "options": ["…", "…", "…", "…"], "answer": <index of the right option> }',
  estimate: '{ "type": "estimate", "answer": <number>, "tolerance": <0 to 0.5, relative; 0 only for exact numbers such as years>, "unit": "…" }',
  order: '{ "type": "order", "items": ["…", "…", "…"] }   // items in the CORRECT order, 3 to 6',
  truefalse: '{ "type": "truefalse", "answer": true | false }   // "stem" is the statement to judge',
  match: '{ "type": "match", "pairs": [["left", "right"], …] }   // 3 to 6 pairs, every left and right unique',
  cloze: '{ "type": "cloze", "text": "… {0} … {1} …", "answers": ["…", "…"], "bank": ["…", …] }   // gaps {0}, {1}; bank holds all answers plus wrong words',
};

export function buildGenerationPrompt(req: GenerationRequest): string {
  const area = areaById(req.area);
  return [
    'You write quiz questions for a German-language knowledge game. Answer with JSON only: an array of questions, no prose, no code fences.',
    `Topic area: ${area.de} (${area.en}). Difficulty: ${req.difficulty} of 5. Type: ${req.type}. Number of questions: ${req.count}.`,
    req.avoidTopics?.length ? `Do not repeat these topics: ${req.avoidTopics.join(', ')}.` : '',
    '',
    'Every question has these common fields:',
    '{ "area": "' + req.area + '", "difficulty": ' + req.difficulty + ', "topic": "<keyword, 3-40 chars, does NOT give the answer>",',
    '  "intro": "<1-2 sentences about the topic, 20-160 chars, does NOT give the answer>", "stem": "<the question or statement, max 220 chars>",',
    '  "explanation": "<why the answer is right, 10-400 chars>",',
    '  "fragments": [ { "kind": "key" | "context" | "decoy", "hint": "<label, max 18 chars>", "text": "<one fact, max 200 chars>", "files": [ <optional, see below> ] } ],',
    '  …plus the fields of the type below }',
    '',
    `Type fields: ${SHAPES[req.type]}`,
    '',
    'Rules:',
    '- Write in German. Facts must be correct and checkable; if unsure, leave the question out.',
    '- The answer must be unambiguous and exactly one answer is right.',
    '- 4 to 6 fragments: 1 to 3 "key" fragments (together they let a player solve the question), 1 or 2 "context", at least 1 "decoy" (plausible, true or false, but irrelevant to the answer). Hints are short labels and must not reveal the answer.',
    '- No fragment, topic or intro may state the answer outright where it would make the question trivial: key fragments contain the knowledge, not the literal solution word.',
    '- Neutral, family-friendly content. No people from the news, no medical or legal advice.',
    '',
    'Files (optional, for key and context fragments): the folder of a fragment can hold 1 to 5 files that the player has to search. The fact of the fragment must be in at least one file; other files add context or are plausible but irrelevant. Each file:',
    '  { "name": "Notizen.txt", "kind": "note", "text": "<10-400 chars>" }',
    '  { "name": "Artikel.txt", "kind": "article", "text": "<3-4 short paragraphs separated by a blank line, max 900 chars; the fact sits inside, not in a headline>", "source": "<where it is from>" }',
    '  { "name": "Diagramm.png", "kind": "image", "alt": "<what it shows, 10-200 chars>", "chart": <one of:',
    '      { "chart": "bars", "title": "…", "unit": "…", "items": [ { "label": "…", "value": <number> } ] }   // 2-6 bars',
    '      { "chart": "timeline", "title": "…", "events": [ { "label": "…", "year": <whole number> } ] }   // 2-6 events',
    '      { "chart": "table", "title": "…", "columns": ["…", "…"], "rows": [ ["…", "…"] ] }   // 2-5 columns, 1-6 rows',
    '  > }',
    'Images are drawn from this description, so use real, checkable numbers. File names must not give the answer away.',
  ]
    .filter((l) => l !== '')
    .join('\n');
}

/** The prompt for the checker pass. */
export function buildCheckPrompt(q: Question): string {
  return [
    'You check a quiz question for a German-language knowledge game. Answer with JSON only: { "ok": true | false, "issues": ["…"] }.',
    'Check: 1) Is every stated fact correct? 2) Is exactly one answer right, unambiguously? 3) Are the decoy fragments irrelevant or wrong, and do the key fragments really allow solving the question? 4) Do topic, intro and hints avoid giving the answer away?',
    'Question:',
    JSON.stringify(q),
  ].join('\n');
}

/** Reads the checker's answer; anything unclear counts as "not ok". */
export function parseCheck(text: string): CheckResult {
  const raw = extractJson(text);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, issues: ['unreadable checker answer'] };
  const o = raw as { ok?: unknown; issues?: unknown };
  const issues = Array.isArray(o.issues) ? o.issues.filter((x): x is string => typeof x === 'string') : [];
  return { ok: o.ok === true && issues.length === 0, issues };
}

// ---------------------------------------------------------------------------
// Parsing

/** Finds the JSON in a model answer, also when it sits inside a code fence or is surrounded by prose. */
export function extractJson(text: string): unknown {
  const t = text.trim();
  const tryParse = (s: string) => {
    try {
      return JSON.parse(s);
    } catch {
      return undefined;
    }
  };
  const direct = tryParse(t);
  if (direct !== undefined) return direct;
  const fenced = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    const v = tryParse(fenced[1]!.trim());
    if (v !== undefined) return v;
  }
  for (const [open, close] of [['[', ']'], ['{', '}']] as const) {
    const a = t.indexOf(open);
    const b = t.lastIndexOf(close);
    if (a >= 0 && b > a) {
      const v = tryParse(t.slice(a, b + 1));
      if (v !== undefined) return v;
    }
  }
  return undefined;
}

/** The list of drafts in a model answer (a single object counts as a list of one). */
export function parseDrafts(text: string): unknown[] {
  const raw = extractJson(text);
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') return [raw];
  return [];
}

// ---------------------------------------------------------------------------
// Validation

export type Validation = { ok: true; question: Question } | { ok: false; errors: string[] };

const isStr = (x: unknown): x is string => typeof x === 'string';
const clean = (x: unknown) => (isStr(x) ? x.trim() : '');
const norm = (s: string) => s.trim().toLowerCase();

/** True if `text` mentions `secret` as a word of its own (so "Rom" does not hit "Roman"). */
function mentions(text: string, secret: string): boolean {
  const s = norm(secret);
  if (s.length < 3) return false;
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\p{L}\\p{N}])`, 'iu');
  return re.test(text);
}

/**
 * Checks a draft from the model against the schema and the content rules and turns it into a
 * question. Everything that is wrong is reported, not just the first problem.
 */
export function validateDraft(raw: unknown, expect?: { area?: string; type?: QuestionType }): Validation {
  const errors: string[] = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, errors: ['not an object'] };
  const d = raw as Record<string, unknown>;

  const area = clean(d['area']);
  if (!AREAS.some((a) => a.id === area)) errors.push(`unknown area "${area}"`);
  if (expect?.area && area !== expect.area) errors.push(`area is "${area}", asked for "${expect.area}"`);

  const type = d['type'] as QuestionType;
  if (!QUESTION_TYPES.includes(type)) errors.push(`unknown type "${String(d['type'])}"`);
  if (expect?.type && type !== expect.type) errors.push(`type is "${String(type)}", asked for "${expect.type}"`);

  const difficulty = d['difficulty'];
  if (!Number.isInteger(difficulty) || (difficulty as number) < 1 || (difficulty as number) > 5) errors.push('difficulty must be an integer from 1 to 5');

  const topic = clean(d['topic']);
  const intro = clean(d['intro']);
  const stem = clean(d['stem']);
  const explanation = clean(d['explanation']);
  if (topic.length < 3 || topic.length > 40) errors.push('topic must be 3 to 40 characters');
  if (intro.length < 20 || intro.length > 160) errors.push('intro must be 20 to 160 characters');
  if (stem.length < 8 || stem.length > 220) errors.push('stem must be 8 to 220 characters');
  if (explanation.length < 10 || explanation.length > 400) errors.push('explanation must be 10 to 400 characters');

  // fragments
  const fragments: Fragment[] = [];
  const rawFrags = Array.isArray(d['fragments']) ? (d['fragments'] as unknown[]) : [];
  if (rawFrags.length < 3 || rawFrags.length > 7) errors.push('3 to 7 fragments are needed');
  const hints = new Set<string>();
  rawFrags.forEach((f, i) => {
    const o = (f && typeof f === 'object' ? f : {}) as Record<string, unknown>;
    const kind = o['kind'] as FragmentKind;
    const hint = clean(o['hint']);
    const text = clean(o['text']);
    if (!['key', 'context', 'decoy'].includes(kind)) errors.push(`fragment ${i + 1}: unknown kind`);
    if (hint.length < 2 || hint.length > 18) errors.push(`fragment ${i + 1}: hint must be 2 to 18 characters`);
    if (text.length < 10 || text.length > 200) errors.push(`fragment ${i + 1}: text must be 10 to 200 characters`);
    if (hints.has(norm(hint))) errors.push(`fragment ${i + 1}: duplicate hint "${hint}"`);
    hints.add(norm(hint));
    let files: Fragment['files'];
    if (o['files'] !== undefined) {
      const v = validateFiles(o['files']);
      v.errors.forEach((e) => errors.push(`fragment ${i + 1}: ${e}`));
      files = v.files;
    }
    fragments.push({ id: `f${i + 1}`, kind, hint, text, ...(files && files.length ? { files } : {}) });
  });
  const keys = fragments.filter((f) => f.kind === 'key').length;
  if (keys < 1 || keys > 3) errors.push('1 to 3 key fragments are needed');
  if (!fragments.some((f) => f.kind === 'decoy')) errors.push('at least one decoy fragment is needed');

  // type specific; `secrets` are the strings that topic, intro and hints must not give away
  const secrets: string[] = [];
  let typed: Record<string, unknown> = {};
  switch (type) {
    case 'choice': {
      const options = Array.isArray(d['options']) ? (d['options'] as unknown[]).map(clean) : [];
      const answer = d['answer'];
      if (options.length < 3 || options.length > 5) errors.push('3 to 5 options are needed');
      if (options.some((o) => o === '' || o.length > 80)) errors.push('options must be 1 to 80 characters');
      if (new Set(options.map(norm)).size !== options.length) errors.push('options must be unique');
      if (!Number.isInteger(answer) || (answer as number) < 0 || (answer as number) >= options.length) errors.push('answer must be the index of an option');
      else secrets.push(options[answer as number]!);
      typed = { type, options, answer };
      break;
    }
    case 'estimate': {
      const answer = d['answer'];
      const tolerance = d['tolerance'];
      if (typeof answer !== 'number' || !Number.isFinite(answer)) errors.push('answer must be a number');
      if (typeof tolerance !== 'number' || tolerance < 0 || tolerance > 0.5) errors.push('tolerance must be between 0 (exact) and 0.5');
      if (typeof answer === 'number') secrets.push(String(answer));
      typed = { type, answer, tolerance, unit: clean(d['unit']) };
      break;
    }
    case 'order': {
      const items = Array.isArray(d['items']) ? (d['items'] as unknown[]).map(clean) : [];
      if (items.length < 3 || items.length > 6) errors.push('3 to 6 items are needed');
      if (items.some((o) => o === '' || o.length > 80)) errors.push('items must be 1 to 80 characters');
      if (new Set(items.map(norm)).size !== items.length) errors.push('items must be unique');
      typed = { type, items };
      break;
    }
    case 'truefalse': {
      if (typeof d['answer'] !== 'boolean') errors.push('answer must be true or false');
      typed = { type, answer: d['answer'] };
      break;
    }
    case 'match': {
      const pairs = (Array.isArray(d['pairs']) ? (d['pairs'] as unknown[]) : []).map((p) =>
        Array.isArray(p) ? ([clean(p[0]), clean(p[1])] as [string, string]) : (['', ''] as [string, string]),
      );
      if (pairs.length < 3 || pairs.length > 6) errors.push('3 to 6 pairs are needed');
      if (pairs.some(([l, r]) => !l || !r || l.length > 40 || r.length > 40)) errors.push('pair entries must be 1 to 40 characters');
      if (new Set(pairs.map((p) => norm(p[0]))).size !== pairs.length) errors.push('left entries must be unique');
      if (new Set(pairs.map((p) => norm(p[1]))).size !== pairs.length) errors.push('right entries must be unique');
      typed = { type, pairs };
      break;
    }
    case 'cloze': {
      const text = clean(d['text']);
      const answers = Array.isArray(d['answers']) ? (d['answers'] as unknown[]).map(clean) : [];
      const bank = Array.isArray(d['bank']) ? (d['bank'] as unknown[]).map(clean) : [];
      const gaps = text.match(/\{\d+\}/g) ?? [];
      if (answers.length < 1 || answers.length > 3) errors.push('1 to 3 gaps are supported');
      if (gaps.length !== answers.length) errors.push(`the text has ${gaps.length} gaps but ${answers.length} answers`);
      for (let i = 0; i < answers.length; i++) if (!text.includes(`{${i}}`)) errors.push(`the text is missing the gap {${i}}`);
      if (answers.some((a) => a === '' || a.length > 30)) errors.push('answers must be 1 to 30 characters');
      if (bank.length < answers.length + 1 || bank.length > 8) errors.push('the bank needs the answers plus at least one wrong word (max 8 words)');
      if (new Set(bank.map(norm)).size !== bank.length) errors.push('bank words must be unique');
      for (const a of answers) if (!bank.map(norm).includes(norm(a))) errors.push(`the bank does not contain the answer "${a}"`);
      secrets.push(...answers);
      typed = { type, text, answers, bank };
      break;
    }
    default:
      break;
  }

  // topic, intro and fragment hints must not give the answer away
  for (const s of secrets) {
    if (mentions(topic, s) || mentions(intro, s)) errors.push(`topic or intro gives away the answer "${s}"`);
    if (fragments.some((f) => mentions(f.hint, s))) errors.push(`a fragment hint gives away the answer "${s}"`);
  }

  // the optional pull toward neighbouring sectors
  let side: Partial<Record<Sector, number>> | undefined;
  if (d['side'] && typeof d['side'] === 'object') {
    side = {};
    for (const [k, v] of Object.entries(d['side'] as Record<string, unknown>)) {
      if (!['science', 'nature', 'culture', 'history'].includes(k) || typeof v !== 'number' || v < 0 || v > 1) errors.push('side must map sectors to 0..1');
      else side[k as Sector] = v;
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  const id = `ai-${hashString(`${area}|${stem}|${JSON.stringify(typed)}`).toString(36)}`;
  const question = {
    id,
    area,
    side,
    topic,
    intro,
    stem,
    fragments: fragments.map((f, i) => ({ ...f, id: `${id}-f${i + 1}` })),
    explanation,
    difficulty: difficulty as 1 | 2 | 3 | 4 | 5,
    deepen: [],
    bridge: [],
    ...typed,
  } as unknown as Question;
  return { ok: true, question };
}

// ---------------------------------------------------------------------------
// The pipeline

export interface GenerationResult {
  accepted: Question[];
  rejected: { reasons: string[] }[];
}

/**
 * Asks the model for questions and keeps only what passes the schema and, if given, the
 * checker. Duplicates (same id) and questions of the wrong area or type are rejected too.
 */
export async function generateQuestions(
  generator: QuestionGenerator,
  checker: QuestionChecker | undefined,
  req: GenerationRequest,
  known: Set<string> = new Set(),
): Promise<GenerationResult> {
  const out: GenerationResult = { accepted: [], rejected: [] };
  let text: string;
  try {
    text = await generator.generate(buildGenerationPrompt(req), req);
  } catch (e) {
    return { accepted: [], rejected: [{ reasons: [`generator failed: ${e instanceof Error ? e.message : String(e)}`] }] };
  }
  const drafts = parseDrafts(text);
  if (drafts.length === 0) return { accepted: [], rejected: [{ reasons: ['no JSON in the model answer'] }] };
  for (const draft of drafts.slice(0, Math.max(1, req.count))) {
    const v = validateDraft(draft, { area: req.area, type: req.type });
    if (!v.ok) {
      out.rejected.push({ reasons: v.errors });
      continue;
    }
    if (known.has(v.question.id) || out.accepted.some((q) => q.id === v.question.id)) {
      out.rejected.push({ reasons: ['duplicate question'] });
      continue;
    }
    if (checker) {
      let r: CheckResult;
      try {
        r = await checker.check(v.question);
      } catch (e) {
        r = { ok: false, issues: [`checker failed: ${e instanceof Error ? e.message : String(e)}`] };
      }
      if (!r.ok) {
        out.rejected.push({ reasons: r.issues.length ? r.issues : ['checker did not approve'] });
        continue;
      }
    }
    out.accepted.push(v.question);
  }
  return out;
}
