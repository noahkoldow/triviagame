import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { catchUpStory, initialPlayer, migrateSave, relinkCacheFiles, type Lang, type PlayerState } from '@nexus/shared';
import { deviceLang } from '../locale';
import { pool, restoreAiQuestions, setContentLanguage } from '../services/content';

const KEY = 'nexus:v1';

const withLang = (p: PlayerState, lang: Lang): PlayerState => ({ ...p, profile: { ...p.profile, lang } });

// a new player starts in the language of the device (and picks one in the onboarding); saves from
// before the language picker are German, because the base of the merge in `hydrate` is
let state: PlayerState = withLang(initialPlayer(pool), deviceLang());
let hydrated = false;
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | undefined;

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, 300);
}

export async function hydrate(): Promise<void> {
  try {
    await restoreAiQuestions();
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<PlayerState>;
      const base = initialPlayer(pool);
      const hasQuestions =
        !saved.network?.nodes ||
        Object.values(saved.network.nodes).every((node) => pool.byId.has(node.questionId));
      if (hasQuestions) {
        const merged: PlayerState = {
          ...base,
          ...saved,
          profile: { ...base.profile, ...saved.profile },
          streak: { ...base.streak, ...saved.streak },
          ads: { ...base.ads, ...saved.ads },
          shop: { ...base.shop, ...saved.shop },
          stats: { ...base.stats, ...saved.stats },
          story: { ...base.story, ...saved.story },
          league: { ...base.league, ...saved.league },
          // saves from before the walls get them in `migrateSave`
          network: saved.network?.nodes ? saved.network : base.network,
        };
        // old saves: areas of the former taxonomy move to the new one (D44); saves from before the
        // story count what already happened as seen, except the latest beat
        const migrated = migrateSave(merged, pool);
        state = saved.story ? migrated : catchUpStory(migrated, pool);
      }
    }
  } catch {
    // corrupt or unavailable storage: start fresh
  }
  setContentLanguage(state.profile.lang);
  hydrated = true;
  emit();
}

export function getState(): PlayerState {
  return state;
}

export function update(fn: (p: PlayerState) => PlayerState | null): boolean {
  const next = fn(state);
  if (!next) return false;
  state = next;
  persist();
  emit();
  return true;
}

export function resetGame(): void {
  // a new game, but in the same language
  state = withLang(initialPlayer(pool), state.profile.lang);
  persist();
  emit();
}

/**
 * Switches UI, story and questions to another language. Built-in questions keep their ids, so the
 * network stays; carried files are renamed to the file names of the new language.
 */
export function setLanguage(lang: Lang): void {
  if (state.profile.lang === lang) return;
  const before = new Map(pool.byId);
  setContentLanguage(lang);
  update((p) => ({
    ...withLang(p, lang),
    cache: relinkCacheFiles(p.cache, (id) => before.get(id), (id) => pool.byId.get(id)),
  }));
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Selectors must return stable references (parts of the state, not new objects). */
export function useGame<T>(select: (p: PlayerState) => T): T {
  return useSyncExternalStore(subscribe, () => select(state));
}

export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => hydrated);
}

export function today(): string {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
