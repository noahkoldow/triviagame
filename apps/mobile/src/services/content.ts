import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AREAS,
  BASE_SKILL,
  MOCK_QUESTIONS,
  POOL_MAX_COUNT,
  POOL_MAX_HAVE,
  Pool,
  acceptServed,
  targetDifficulty,
  type Question,
  type SkillMap,
} from '@nexus/shared';
import { API_BASE } from '../config';
import { questionApi, type QuestionApi } from './ai';

/**
 * The questions on this device: the built-in ones plus everything the backend delivered.
 * The game is open-ended: whenever an unlocked area runs low on unused questions, more are
 * fetched, and branches that waited for questions grow (see `growWaitingNodes`).
 */
export const pool = new Pool(MOCK_QUESTIONS);

const AI_POOL_KEY = 'nexus:ai-pool:v1';
/** Fetch more for an area once fewer unused questions than this are left. */
const LOW_WATER = 3;
/** After a failed or empty answer an area waits this long before asking again. */
const BACKOFF_MS = 10 * 60 * 1000;
const builtIn = new Set(MOCK_QUESTIONS.map((q) => q.id));
const retryAt = new Map<string, number>();
let running: Promise<number> | null = null;

function add(q: Question): boolean {
  if (pool.byId.has(q.id)) return false;
  pool.list.push(q);
  pool.byId.set(q.id, q);
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
 * Tops up every unlocked area that is running low, at the player's level there. Resolves to the
 * number of new questions (0 offline or on errors; the game never waits for this).
 */
export function refillPool(input: RefillInput, api: QuestionApi = questionApi(API_BASE)): Promise<number> {
  if (!api.live) return Promise.resolve(0);
  running ??= (async () => {
    let added = 0;
    const used = new Set(input.usedQuestions);
    for (const area of AREAS.filter((a) => input.unlockedAreas.includes(a.id))) {
      const inArea = pool.list.filter((q) => q.area === area.id);
      if (inArea.filter((q) => !used.has(q.id)).length >= LOW_WATER) continue;
      if ((retryAt.get(area.id) ?? 0) > Date.now()) continue;
      try {
        const got = await api.fetch({
          area: area.id,
          difficulty: targetDifficulty(input.skill[area.id] ?? BASE_SKILL),
          count: POOL_MAX_COUNT,
          have: inArea.map((q) => q.id).slice(-POOL_MAX_HAVE),
        });
        const fresh = got.filter((q) => q.area === area.id && add(q)).length;
        added += fresh;
        if (fresh === 0) retryAt.set(area.id, Date.now() + BACKOFF_MS);
      } catch {
        // network, budget or backend down: try this area again later
        retryAt.set(area.id, Date.now() + BACKOFF_MS);
      }
    }
    if (added > 0) {
      const delivered = pool.list.filter((q) => !builtIn.has(q.id));
      await AsyncStorage.setItem(AI_POOL_KEY, JSON.stringify(delivered)).catch(() => {});
    }
    return added;
  })().finally(() => {
    running = null;
  });
  return running;
}
