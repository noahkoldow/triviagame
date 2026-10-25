import { QUESTION_TYPES, validateDraft } from './ai';
import { DEFAULT_LANG, LANGS, isLang, type Lang } from './lang';
import { isArea } from './taxonomy';
import type { Question, QuestionType } from './types';

/**
 * The content API between app and server. The app may only ask for questions by area and level;
 * it never sends a prompt. The server answers from a shared pool of checked questions and lets
 * the model write new ones only when the pool has nothing left the player has not seen.
 */

export interface PoolRequest {
  area: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** How many questions the app wants (1–3). */
  count: number;
  /** Ids of the questions of this area the app already has. */
  have: string[];
  /** The language the questions are written in; every language has its own pool. */
  lang: Lang;
}

export const POOL_MAX_COUNT = 3;
export const POOL_MAX_HAVE = 400;
const ID = /^[a-z0-9-]{1,64}$/;
const FIELDS = ['area', 'difficulty', 'count', 'have', 'lang'];

/** The document of the shared pool for an area in a language (`poolIndex/{key}`). */
export function poolKey(area: string, lang: Lang): string {
  return `${lang}_${area}`;
}

/** Strict check of a request body; anything else (a prompt, extra fields) is refused. */
export function parsePoolRequest(body: unknown): { ok: true; req: PoolRequest } | { ok: false; error: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: 'body must be an object' };
  const b = body as Record<string, unknown>;
  const extra = Object.keys(b).filter((k) => !FIELDS.includes(k));
  if (extra.length) return { ok: false, error: `unknown fields: ${extra.join(', ')}` };
  if (typeof b.area !== 'string' || !isArea(b.area)) return { ok: false, error: 'unknown area' };
  const d = b.difficulty;
  if (!Number.isInteger(d) || (d as number) < 1 || (d as number) > 5) return { ok: false, error: 'difficulty must be 1 to 5' };
  const c = b.count;
  if (!Number.isInteger(c) || (c as number) < 1 || (c as number) > POOL_MAX_COUNT) {
    return { ok: false, error: `count must be 1 to ${POOL_MAX_COUNT}` };
  }
  const have = b.have ?? [];
  if (!Array.isArray(have) || have.length > POOL_MAX_HAVE || !have.every((x) => typeof x === 'string' && ID.test(x))) {
    return { ok: false, error: `have must be up to ${POOL_MAX_HAVE} question ids` };
  }
  // apps from before the language picker do not send one: they play in German
  const lang = b.lang ?? DEFAULT_LANG;
  if (!isLang(lang)) return { ok: false, error: `lang must be one of ${LANGS.join(', ')}` };
  return { ok: true, req: { area: b.area, difficulty: d as PoolRequest['difficulty'], count: c as number, have, lang } };
}

// --- reports -------------------------------------------------------------

/** Why a player reports a question (Apple 1.2: a way to flag objectionable content). */
export const REPORT_REASONS = ['wrong', 'unclear', 'offensive', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export interface QuestionReport {
  questionId: string;
  reason: ReportReason;
  lang: Lang;
}

/** Reports from different clients before a generated question is withheld from the pool. */
export const REPORTS_TO_BLOCK = 3;

/** Strict check of a report body: a question id, a reason and the language, nothing else. */
export function parseReport(body: unknown): { ok: true; report: QuestionReport } | { ok: false; error: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: 'body must be an object' };
  const b = body as Record<string, unknown>;
  const extra = Object.keys(b).filter((k) => !['questionId', 'reason', 'lang'].includes(k));
  if (extra.length) return { ok: false, error: `unknown fields: ${extra.join(', ')}` };
  if (typeof b.questionId !== 'string' || !ID.test(b.questionId)) return { ok: false, error: 'questionId must be a question id' };
  if (!REPORT_REASONS.includes(b.reason as ReportReason)) return { ok: false, error: `reason must be one of ${REPORT_REASONS.join(', ')}` };
  if (!isLang(b.lang)) return { ok: false, error: `lang must be one of ${LANGS.join(', ')}` };
  return { ok: true, report: { questionId: b.questionId, reason: b.reason as ReportReason, lang: b.lang } };
}

/** The index with one entry blocked; the same array if it is not there or already blocked. */
export function blockEntry(entries: PoolEntry[], id: string): PoolEntry[] {
  return entries.some((e) => e.id === id && !e.blocked) ? entries.map((e) => (e.id === id ? { ...e, blocked: true } : e)) : entries;
}

/** What the server keeps per question in the index of an area. */
export interface PoolEntry {
  id: string;
  difficulty: number;
  type: QuestionType;
  topic: string;
  /** Reported often enough to be withheld. */
  blocked?: boolean;
}

export function poolEntryOf(q: Question): PoolEntry {
  return { id: q.id, difficulty: q.difficulty, type: q.type, topic: q.topic };
}

/** The entries to serve: unseen, not blocked, closest to the asked level, older ones first. */
export function choosePoolEntries(entries: PoolEntry[], req: PoolRequest): PoolEntry[] {
  const have = new Set(req.have);
  return entries
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => !e.blocked && !have.has(e.id))
    .sort((a, b) => Math.abs(a.e.difficulty - req.difficulty) - Math.abs(b.e.difficulty - req.difficulty) || a.i - b.i)
    .slice(0, req.count)
    .map(({ e }) => e);
}

/** The question type an area has least of, so the pool stays varied. */
export function nextQuestionType(entries: PoolEntry[]): QuestionType {
  const count = (t: QuestionType) => entries.filter((e) => e.type === t).length;
  return QUESTION_TYPES.reduce((best, t) => (count(t) < count(best) ? t : best), QUESTION_TYPES[0]!);
}

/** Recent topics of an area, so the model writes about something new. */
export function avoidTopicsOf(entries: PoolEntry[], n = 30): string[] {
  return [...new Set(entries.map((e) => e.topic))].slice(-n);
}

/**
 * Checks a question that came from the server (or local storage) before it joins the game:
 * it must pass the same validation as a model draft and keep its id.
 */
export function acceptServed(item: unknown, lang?: Lang): Question | null {
  if (!item || typeof item !== 'object' || typeof (item as { id?: unknown }).id !== 'string') return null;
  const v = validateDraft(item);
  if (!v.ok || v.question.id !== (item as { id: string }).id) return null;
  // asked for one language, a question in another one is no use
  if (lang && (v.question.lang ?? DEFAULT_LANG) !== lang) return null;
  const raw = item as { deepen?: unknown; bridge?: unknown };
  const ids = (x: unknown) => (Array.isArray(x) ? x.filter((s): s is string => typeof s === 'string' && ID.test(s)) : []);
  return { ...v.question, deepen: ids(raw.deepen), bridge: ids(raw.bridge) };
}
