import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AREAS,
  BASE_SKILL,
  DEFAULT_LANG,
  MOCK_QUESTIONS,
  POOL_MAX_COUNT,
  POOL_MAX_HAVE,
  Pool,
  acceptServed,
  localizeQuestion,
  targetDifficulty,
  type Lang,
  type Question,
  type SkillMap,
} from '@nexus/shared';
import { API_BASE } from '../config';
import { questionApi, type QuestionApi } from './ai';

/**
 * The questions on this device: the built-in ones plus everything the backend delivered.
 * The game is open-ended: whenever an unlocked area runs low on unused questions, more are
 * fetched, and branches that waited for questions grow (see `growWaitingNodes`).
 *
 * The pool speaks the player's language (`setContentLanguage`): built-in questions exist in every
 * language under the same id, so nodes keep their question. Delivered questions are written in one
 * language; only those of the current language are drawn for new nodes (`pool.list`), the others
 * stay readable (`pool.byId`) for nodes that already show them.
 */
export const pool = new Pool(MOCK_QUESTIONS);

const AI_POOL_KEY = 'nexus:ai-pool:v1';
/** Fetch more for an area once fewer unused questions than this are left. */
const LOW_WATER = 3;
/** After a failed or empty answer an area waits this long before asking again. */
const BACKOFF_MS = 10 * 60 * 1000;
/** Everything the backend delivered, in every language, as delivered. */
const delivered: Question[] = [];
const retryAt = new Map<string, number>();
let current: Lang = DEFAULT_LANG;
let running: { lang: Lang; done: Promise<number> } | null = null;

const langOf = (q: Question): Lang => q.lang ?? DEFAULT_LANG;

/** Puts the questions of `lang` into play: built-in ones translated, delivered ones of that language. */
export function setContentLanguage(lang: Lang): void {
  current = lang;
  pool.list.length = 0;
  pool.byId.clear();
  for (const q of MOCK_QUESTIONS) {
    const shown = localizeQuestion(q, lang);
    pool.list.push(shown);
    pool.byId.set(shown.id, shown);
  }
  for (const q of delivered) {
    const shown = localizeQuestion(q, lang);
    pool.byId.set(shown.id, shown);
    if (langOf(q) === lang) pool.list.push(shown);
  }
}

function add(q: Question): boolean {
  if (pool.byId.has(q.id)) return false;
  delivered.push(q);
  const shown = localizeQuestion(q, current);
  pool.byId.set(shown.id, shown);
  if (langOf(q) === current) pool.list.push(shown);
  return true;
}

/** Restore delivered questions before hydrating nodes that may refer to them. */
export async function restoreAiQuestions(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(AI_POOL_KEY);
    if (!raw) return;
    const saved: unknown = JSON.parse(raw);
    if (!Array.isArray(saved)) return;
    for (const item of saved) {
      const q = acceptServed(item);
      if (q) add(q);
    }
  } catch {
    // a damaged or unavailable local cache: the built-in questions remain playable
  }
}

export interface RefillInput {
  unlockedAreas: string[];
  usedQuestions: string[];
  skill: SkillMap;
}

/**
 * Tops up every unlocked area that is running low, at the player's level there and in the
 * current language. Resolves to the number of new questions (0 offline or on errors; the game
 * never waits for this).
 */
export function refillPool(input: RefillInput, api: QuestionApi = questionApi(API_BASE)): Promise<number> {
  if (!api.live) return Promise.resolve(0);
  // a refill for another language is still running: run again for this one afterwards
  if (running) return running.lang === current ? running.done : running.done.then(() => refillPool(input, api));
  const lang = current;
  const done = (async () => {
    let added = 0;
    const used = new Set(input.usedQuestions);
    for (const area of AREAS.filter((a) => input.unlockedAreas.includes(a.id))) {
      const inArea = pool.list.filter((q) => q.area === area.id);
      if (inArea.filter((q) => !used.has(q.id)).length >= LOW_WATER) continue;
      const key = `${lang}:${area.id}`;
      if ((retryAt.get(key) ?? 0) > Date.now()) continue;
      try {
        const got = await api.fetch({
          area: area.id,
          difficulty: targetDifficulty(input.skill[area.id] ?? BASE_SKILL),
          count: POOL_MAX_COUNT,
          have: inArea.map((q) => q.id).slice(-POOL_MAX_HAVE),
          lang,
        });
        const fresh = got.filter((q) => q.area === area.id && add(q)).length;
        added += fresh;
        if (fresh === 0) retryAt.set(key, Date.now() + BACKOFF_MS);
      } catch {
        // network, budget or backend down: try this area again later
        retryAt.set(key, Date.now() + BACKOFF_MS);
      }
    }
    if (added > 0) await AsyncStorage.setItem(AI_POOL_KEY, JSON.stringify(delivered)).catch(() => {});
    return added;
  })().finally(() => {
    running = null;
  });
  running = { lang, done };
  return done;
}
