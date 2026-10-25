import { fragmentFiles } from './files';
import type { PlayerState } from './game';
import type { Pool } from './network';
import { seededRng } from './rng';
import type { Fragment, FragmentFile, Question } from './types';

/**
 * Two places for what the player gathers from the loose folders of a debris field (D49):
 *
 * - The folder structure (`archive`): folders the player files away, grouped by topic area.
 *   It has no limit and stays. On the map it is free to open; during a question opening it
 *   costs energy (⚡), once per question.
 * - The cache: single files, at most three per topic area. During a question the files of its
 *   area open for free. After an attempt the cache of that area is emptied.
 *
 * Searching, filing and choosing the few files worth carrying is the skill the game trains.
 */

/** A folder (one fragment of a question). */
export interface CacheEntry {
  questionId: string;
  fragmentId: string;
}

/** One file of a folder, carried in the cache. */
export interface CacheFile extends CacheEntry {
  /** File name inside the folder (unique there). */
  file: string;
}

export const CACHE_FILES_PER_AREA = 3;

const same = (a: CacheEntry, b: CacheEntry) => a.questionId === b.questionId && a.fragmentId === b.fragmentId;
const sameFile = (a: CacheFile, b: CacheFile) => same(a, b) && a.file === b.file;

function fragmentOf(pool: Pool, e: CacheEntry): Fragment | undefined {
  return pool.byId.get(e.questionId)?.fragments.find((x) => x.id === e.fragmentId);
}

// --- the folder structure -----------------------------------------------

export function archiveHas(p: PlayerState, e: CacheEntry): boolean {
  return p.archive.some((c) => same(c, e));
}

/** Files a loose folder away. Returns null when it is already there. */
export function archiveAdd(p: PlayerState, e: CacheEntry): PlayerState | null {
  if (archiveHas(p, e)) return null;
  return { ...p, archive: [...p.archive, { questionId: e.questionId, fragmentId: e.fragmentId }] };
}

/** Takes a folder out of the structure again. */
export function archiveDrop(p: PlayerState, e: CacheEntry): PlayerState {
  if (!archiveHas(p, e)) return p;
  return { ...p, archive: p.archive.filter((c) => !same(c, e)) };
}

/** Swaps two folders (moving one up or down among the folders of its area). */
export function archiveSwap(p: PlayerState, a: CacheEntry, b: CacheEntry): PlayerState {
  const i = p.archive.findIndex((c) => same(c, a));
  const j = p.archive.findIndex((c) => same(c, b));
  if (i < 0 || j < 0 || i === j) return p;
  const archive = [...p.archive];
  [archive[i], archive[j]] = [archive[j]!, archive[i]!];
  return { ...p, archive };
}

/** Puts the structure in the order of the given entries (entries not listed keep their place at the end). */
export function archiveReorder(p: PlayerState, order: CacheEntry[]): PlayerState {
  const first = order.filter((e) => archiveHas(p, e));
  const rest = p.archive.filter((c) => !first.some((e) => same(e, c)));
  return { ...p, archive: [...first, ...rest] };
}

export function archiveClear(p: PlayerState): PlayerState {
  return p.archive.length === 0 ? p : { ...p, archive: [] };
}

/** Energy it costs to open the structure during a question: 1, from 11 folders 2, from 21 folders 3. */
export function structureOpenCost(folders: number): number {
  if (folders <= 0) return 0;
  return Math.min(3, 1 + Math.floor((folders - 1) / 10));
}

/** The folders of the structure, resolved (unknown questions are skipped), in their stored order. */
export function archiveFolders(p: PlayerState, pool: Pool): { entry: CacheEntry; area: string; fragment: Fragment }[] {
  return p.archive.flatMap((entry) => {
    const q = pool.byId.get(entry.questionId);
    const fragment = q?.fragments.find((x) => x.id === entry.fragmentId);
    return q && fragment ? [{ entry, area: q.area, fragment }] : [];
  });
}

// --- the cache -------------------------------------------------------------

export function cacheHasFile(p: PlayerState, f: CacheFile): boolean {
  return p.cache.some((c) => sameFile(c, f));
}

/** True when at least one file of this folder is carried. */
export function cacheHasFolder(p: PlayerState, e: CacheEntry): boolean {
  return p.cache.some((c) => same(c, e));
}

function areaOf(pool: Pool, e: CacheEntry): string | undefined {
  return pool.byId.get(e.questionId)?.area;
}

export function cacheFilesIn(p: PlayerState, pool: Pool, area: string): CacheFile[] {
  return p.cache.filter((c) => areaOf(pool, c) === area);
}

export function cacheFreeSlots(p: PlayerState, pool: Pool, area: string): number {
  return Math.max(0, CACHE_FILES_PER_AREA - cacheFilesIn(p, pool, area).length);
}

/**
 * Carries one file. Returns null when it is already carried, does not exist, or the cache of
 * its area is full (three files).
 */
export function cacheAddFile(p: PlayerState, pool: Pool, f: CacheFile): PlayerState | null {
  if (cacheHasFile(p, f)) return null;
  const fragment = fragmentOf(pool, f);
  if (!fragment || !fragmentFiles(fragment).some((x) => x.name === f.file)) return null;
  if (cacheFreeSlots(p, pool, areaOf(pool, f)!) === 0) return null;
  return { ...p, cache: [...p.cache, { questionId: f.questionId, fragmentId: f.fragmentId, file: f.file }] };
}

export function cacheDropFile(p: PlayerState, f: CacheFile): PlayerState {
  if (!cacheHasFile(p, f)) return p;
  return { ...p, cache: p.cache.filter((c) => !sameFile(c, f)) };
}

/** The cache without the files of one area (after an attempt in that area). */
export function cacheWithoutArea(cache: CacheFile[], pool: Pool, area: string): CacheFile[] {
  return cache.filter((c) => areaOf(pool, c) !== area);
}

/** The carried files, resolved to their content (optionally only one area). */
export function cacheContents(
  p: PlayerState,
  pool: Pool,
  area?: string,
): { entry: CacheFile; area: string; folder: string; file: FragmentFile }[] {
  return p.cache.flatMap((entry) => {
    const q = pool.byId.get(entry.questionId);
    const fragment = q?.fragments.find((x) => x.id === entry.fragmentId);
    const file = fragment && fragmentFiles(fragment).find((x) => x.name === entry.file);
    if (!q || !fragment || !file || (area && q.area !== area)) return [];
    return [{ entry, area: q.area, folder: fragment.hint, file }];
  });
}

/**
 * After a change of language: file names are words of the language, so every carried file is
 * renamed to the file at the same place in its folder (`before` and `after` look questions up in
 * the old and the new language). Files that cannot be found are dropped.
 */
export function relinkCacheFiles(
  cache: CacheFile[],
  before: (questionId: string) => Question | undefined,
  after: (questionId: string) => Question | undefined,
): CacheFile[] {
  const filesOf = (q: Question | undefined, fragmentId: string) => {
    const fragment = q?.fragments.find((x) => x.id === fragmentId);
    return fragment ? fragmentFiles(fragment) : [];
  };
  return cache.flatMap((c) => {
    const at = filesOf(before(c.questionId), c.fragmentId).findIndex((x) => x.name === c.file);
    const file = at >= 0 ? filesOf(after(c.questionId), c.fragmentId)[at] : undefined;
    return file ? [{ ...c, file: file.name }] : [];
  });
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
