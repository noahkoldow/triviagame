import {
  AREAS,
  CACHE_FILES_PER_AREA,
  archiveFolders,
  areaName,
  cacheContents,
  cacheFreeSlots,
  cacheHasFile,
  fragmentFiles,
  type CacheEntry,
  type CacheFile,
  type PlayerState,
} from '@nexus/shared';
import type { Strings } from '../i18n/de';
import type { ExplorerFolder, FileAction } from '../components/CacheExplorer';
import type { CachedItem } from '../components/CacheFiles';
import { pool } from '../services/content';

/** The folder structure as the explorer shows it: grouped by topic area, in the player's order. */
export function structureView(p: PlayerState): { folders: ExplorerFolder[]; entries: CacheEntry[]; areas: string[] } {
  const lang = p.profile.lang;
  const order = AREAS.map((a) => a.id);
  const items = archiveFolders(p, pool)
    .map((it, i) => ({ it, i }))
    .sort((a, b) => order.indexOf(a.it.area) - order.indexOf(b.it.area) || a.i - b.i)
    .map(({ it }) => it);
  return {
    folders: items.map((it) => ({ name: it.fragment.hint, group: areaName(it.area, lang), files: fragmentFiles(it.fragment) })),
    entries: items.map((it) => it.entry),
    areas: items.map((it) => it.area),
  };
}

export const cacheKey = (f: CacheFile) => `${f.questionId}|${f.fragmentId}|${f.file}`;

/** The carried files for the cache window (all areas, or only the area of a question). */
export function cacheItems(p: PlayerState, area?: string): CachedItem[] {
  return cacheContents(p, pool, area).map((c) => ({
    key: cacheKey(c.entry),
    area: areaName(c.area, p.profile.lang),
    folder: c.folder,
    file: c.file,
  }));
}

/** Taking a file of a folder of the given area into the cache, or out of it again. */
export function cacheActionFor(
  p: PlayerState,
  t: Strings,
  entry: CacheEntry,
  area: string,
  file: string,
  add: (f: CacheFile) => void,
  drop: (f: CacheFile) => void,
): FileAction {
  const f: CacheFile = { ...entry, file };
  if (cacheHasFile(p, f)) return { label: t.folders.remove, onPress: () => drop(f) };
  const free = cacheFreeSlots(p, pool, area);
  return {
    label: t.folders.add,
    sub:
      free > 0
        ? t.folders.free(areaName(area, t.lang), free, CACHE_FILES_PER_AREA)
        : t.folders.full(areaName(area, t.lang), CACHE_FILES_PER_AREA),
    disabled: free === 0,
    onPress: () => add(f),
  };
}
