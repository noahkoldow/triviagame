import type { PlayerState } from './game';
import type { Pool } from './network';
import { seededRng } from './rng';
import type { Fragment } from './types';

/**
 * The cache is the player's folder of collected fragments. It has no size limit: you can pick up
 * as much as you like. You pay for it in energy (⚡) whenever you open it, and the price grows
 * with its size (`cacheOpenCost`). It can be opened at any time, on the map and inside a question;
 * the search inside it is free.
 */
export interface CacheEntry {
  questionId: string;
  fragmentId: string;
}

const same = (a: CacheEntry, b: CacheEntry) =>
  a.questionId === b.questionId && a.fragmentId === b.fragmentId;

export function cacheHas(p: PlayerState, e: CacheEntry): boolean {
  return p.cache.some((c) => same(c, e));
}

/** Adds a fragment. Returns null when it is already in the cache. */
export function cacheAdd(p: PlayerState, e: CacheEntry): PlayerState | null {
  if (cacheHas(p, e)) return null;
  return { ...p, cache: [...p.cache, e] };
}

/** Takes a fragment out again (it still lies on the ground and can be picked up again). */
export function cacheDrop(p: PlayerState, e: CacheEntry): PlayerState {
  if (!cacheHas(p, e)) return p;
  return { ...p, cache: p.cache.filter((c) => !same(c, e)) };
}

/** Moves a fragment one place up (-1) or down (+1) in the cache order. */
export function cacheMove(p: PlayerState, e: CacheEntry, dir: -1 | 1): PlayerState {
  const i = p.cache.findIndex((c) => same(c, e));
  const j = i + dir;
  if (i < 0 || j < 0 || j >= p.cache.length) return p;
  const cache = [...p.cache];
  [cache[i], cache[j]] = [cache[j]!, cache[i]!];
  return { ...p, cache };
}

/** Puts the cache in the order of the given entries (entries not listed keep their place at the end). */
export function cacheReorder(p: PlayerState, order: CacheEntry[]): PlayerState {
  const first = order.filter((e) => cacheHas(p, e));
  const rest = p.cache.filter((c) => !first.some((e) => same(e, c)));
  return { ...p, cache: [...first, ...rest] };
}

/** Empties the cache. */
export function cacheClear(p: PlayerState): PlayerState {
  return p.cache.length === 0 ? p : { ...p, cache: [] };
}

/** Energy it costs to open a cache with this many folders: one per three folders, at most 5. */
export function cacheOpenCost(folders: number): number {
  return Math.min(5, Math.max(1, Math.ceil(folders / 3)));
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
