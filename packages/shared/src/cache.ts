import type { PlayerState } from './game';
import type { Pool } from './network';
import { seededRng } from './rng';
import type { Fragment } from './types';

/**
 * The cache is the player's small working memory: it holds fragments picked up
 * from debris fields on the map. It is limited to three. On the map only the labels
 * of the fragments are shown (so they can be swapped or thrown away); what they
 * say can only be read inside a question, by spending energy (⚡, see `spendRewind`).
 */
export const CACHE_SLOTS = 3;

export interface CacheEntry {
  questionId: string;
  fragmentId: string;
}

const same = (a: CacheEntry, b: CacheEntry) =>
  a.questionId === b.questionId && a.fragmentId === b.fragmentId;

export function cacheHas(p: PlayerState, e: CacheEntry): boolean {
  return p.cache.some((c) => same(c, e));
}

export function isSpent(p: PlayerState, e: CacheEntry): boolean {
  return p.spent.some((c) => same(c, e));
}

/** Adds a fragment. Returns null when the cache is full, the fragment is already in it or was thrown away. */
export function cacheAdd(p: PlayerState, e: CacheEntry): PlayerState | null {
  if (cacheHas(p, e) || isSpent(p, e) || p.cache.length >= CACHE_SLOTS) return null;
  return { ...p, cache: [...p.cache, e] };
}

/** Replaces `out` with `incoming`. The fragment that goes out is lost for this attempt. */
export function cacheSwap(p: PlayerState, out: CacheEntry, incoming: CacheEntry): PlayerState | null {
  if (!cacheHas(p, out) || cacheHas(p, incoming) || isSpent(p, incoming)) return null;
  return { ...p, cache: p.cache.map((c) => (same(c, out) ? incoming : c)), spent: [...p.spent, out] };
}

/** Throws a fragment away. It does not come back during this attempt. */
export function cacheDrop(p: PlayerState, e: CacheEntry): PlayerState {
  if (!cacheHas(p, e)) return p;
  return { ...p, cache: p.cache.filter((c) => !same(c, e)), spent: [...p.spent, e] };
}

/** Resolves the cache entries to fragments (entries of unknown questions are skipped). */
export function cacheFragments(p: PlayerState, pool: Pool): (Fragment & { questionId: string })[] {
  const out: (Fragment & { questionId: string })[] = [];
  for (const e of p.cache) {
    const f = pool.byId.get(e.questionId)?.fragments.find((x) => x.id === e.fragmentId);
    if (f) out.push({ ...f, questionId: e.questionId });
  }
  return out;
}

/**
 * Where the debris pieces lie around their node on the map (offsets in world
 * units). Deterministic per node and attempt, spread so pieces never overlap.
 */
export function debrisOffsets(
  seed: string,
  count: number,
): { x: number; y: number; rot: number }[] {
  const rng = seededRng(seed);
  const start = rng() * Math.PI * 2;
  return Array.from({ length: count }, (_, i) => {
    const a = start + (i / count) * Math.PI * 2 + (rng() - 0.5) * 0.45;
    const r = 78 + rng() * 38;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r, rot: (rng() - 0.5) * 0.9 };
  });
}
