import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { initialPlayer, type PlayerState } from '@nexus/shared';
import { pool } from '../services/content';

const KEY = 'nexus:v1';

let state: PlayerState = initialPlayer(pool);
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
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<PlayerState>;
      const base = initialPlayer(pool);
      state = {
        ...base,
        ...saved,
        profile: { ...base.profile, ...saved.profile },
        streak: { ...base.streak, ...saved.streak },
        ads: { ...base.ads, ...saved.ads },
        stats: { ...base.stats, ...saved.stats },
        network: saved.network?.nodes ? saved.network : base.network,
      };
    }
  } catch {
    // corrupt or unavailable storage: start fresh
  }
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
  state = initialPlayer(pool);
  persist();
  emit();
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
