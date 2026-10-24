import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AREAS,
  MOCK_QUESTIONS,
  Pool,
  QUESTION_TYPES,
  initialUnlockedAreas,
  validateDraft,
  type Question,
} from '@nexus/shared';
import { AI_ENDPOINT } from '../config';
import { questionSource } from './ai';

/** Local source of questions; accepted Gemini questions join this pool when configured. */
export interface ContentProvider {
  loadQuestions(): Promise<Question[]>;
}

export const mockContent: ContentProvider = {
  async loadQuestions() {
    return MOCK_QUESTIONS;
  },
};

export const pool = new Pool(MOCK_QUESTIONS);

const AI_POOL_KEY = 'nexus:ai-pool:v1';
const AI_LAST_ATTEMPT_KEY = 'nexus:ai-pool:last-attempt';
const AI_POOL_TARGET = 12;
const AI_AREA_TARGET = 3;
const AI_RETRY_DELAY_MS = 60 * 60 * 1000;

/** Restore previously validated questions before hydrating nodes that may refer to them. */
export async function restoreAiQuestions(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(AI_POOL_KEY);
    if (!raw) return;
    const saved: unknown = JSON.parse(raw);
    if (!Array.isArray(saved)) return;
    for (const item of saved) {
      if (!item || typeof item !== 'object' || typeof (item as { id?: unknown }).id !== 'string')
        continue;
      const checked = validateDraft(item);
      if (!checked.ok || checked.question.id !== (item as { id: string }).id) continue;
      const q = checked.question;
      if (pool.byId.has(q.id)) continue;
      pool.list.push(q);
      pool.byId.set(q.id, q);
    }
  } catch {
    // Ignore a damaged or unavailable local cache; bundled questions remain playable.
  }
}

/** Fill a local starter pool with checked questions; the backend enforces the project-wide budget. */
export async function primeAiPool(): Promise<void> {
  if (!AI_ENDPOINT) return;
  try {
    const lastAttempt = Number(await AsyncStorage.getItem(AI_LAST_ATTEMPT_KEY));
    if (Number.isFinite(lastAttempt) && Date.now() - lastAttempt < AI_RETRY_DELAY_MS) return;

    const areas = AREAS.filter((area) => initialUnlockedAreas().includes(area.id));
    if (areas.length === 0) return;
    const dayIndex = Math.floor(Date.now() / 86_400_000);
    for (const [areaIndex, area] of areas.entries()) {
      const existing = pool.list.filter((q) => q.id.startsWith('ai-') && q.area === area.id);
      const count = Math.min(AI_AREA_TARGET - existing.length, AI_POOL_TARGET - pool.list.filter((q) => q.id.startsWith('ai-')).length);
      if (count <= 0) break;
      const type = QUESTION_TYPES[(dayIndex + areaIndex) % QUESTION_TYPES.length]!;
      const request = {
        area: area.id,
        difficulty: 1 as const,
        type,
        count,
        avoidTopics: pool.list.filter((q) => q.area === area.id).map((q) => q.topic).slice(-20),
      };
      const result = await questionSource(AI_ENDPOINT).fetch(request, new Set(pool.list.map((q) => q.id)));
      for (const q of result.accepted) {
        pool.list.push(q);
        pool.byId.set(q.id, q);
      }
      const generated = pool.list.filter((entry) => entry.id.startsWith('ai-'));
      await AsyncStorage.setItem(AI_POOL_KEY, JSON.stringify(generated));
    }
    await AsyncStorage.setItem(AI_LAST_ATTEMPT_KEY, String(Date.now()));
  } catch {
    // Gemini, network, quota or local storage failures leave the mock pool available.
  }
}
