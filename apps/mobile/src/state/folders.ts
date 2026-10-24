import {
  AREAS,
  CACHE_FILES_PER_AREA,
  archiveFolders,
  areaById,
  cacheContents,
  cacheFreeSlots,
  cacheHasFile,
  fragmentFiles,
  type CacheEntry,
  type CacheFile,
  type PlayerState,
} from '@nexus/shared';
import type { ExplorerFolder, FileAction } from '../components/CacheExplorer';
import type { CachedItem } from '../components/CacheFiles';
import { pool } from '../services/content';

/** The folder structure as the explorer shows it: grouped by topic area, in the player's order. */
export function structureView(p: PlayerState): { folders: ExplorerFolder[]; entries: CacheEntry[]; areas: string[] } {
  const order = AREAS.map((a) => a.id);
  const items = archiveFolders(p, pool)
    .map((it, i) => ({ it, i }))
    .sort((a, b) => order.indexOf(a.it.area) - order.indexOf(b.it.area) || a.i - b.i)
    .map(({ it }) => it);
  return {
    folders: items.map((it) => ({ name: it.fragment.hint, group: areaById(it.area).de, files: fragmentFiles(it.fragment) })),
    entries: items.map((it) => it.entry),
    areas: items.map((it) => it.area),
  };
}

export const cacheKey = (f: CacheFile) => `${f.questionId}|${f.fragmentId}|${f.file}`;

/** The carried files for the cache window (all areas, or only the area of a question). */
export function cacheItems(p: PlayerState, area?: string): CachedItem[] {
  return cacheContents(p, pool, area).map((c) => ({
    key: cacheKey(c.entry),
    area: areaById(c.area).de,
    folder: c.folder,
    file: c.file,
  }));
}

/** "In den Cache" / "Aus dem Cache" for a file of a folder of the given area. */
export function cacheActionFor(
  p: PlayerState,
  entry: CacheEntry,
  area: string,
  file: string,
  add: (f: CacheFile) => void,
  drop: (f: CacheFile) => void,
): FileAction {
  const f: CacheFile = { ...entry, file };
  if (cacheHasFile(p, f)) return { label: 'Aus dem Cache nehmen', onPress: () => drop(f) };
  const free = cacheFreeSlots(p, pool, area);
  return {
    label: 'In den Cache',
    sub:
      free > 0
        ? `${areaById(area).de}: noch ${free} von ${CACHE_FILES_PER_AREA} Plätzen frei`
        : `${areaById(area).de}: alle ${CACHE_FILES_PER_AREA} Plätze belegt`,
    disabled: free === 0,
    onPress: () => add(f),
  };
}
