import type { Lang } from '@nexus/shared';
import { de, type Strings } from './i18n/de';
import { en } from './i18n/en';
import { es } from './i18n/es';
import { fr } from './i18n/fr';
import { useGame } from './state/store';

/**
 * UI texts in the player's language. German (`i18n/de.ts`) is the source and the shape; English,
 * French and Spanish fill the same keys. Story texts and built-in questions are translated in
 * `packages/shared` (`i18n/`), area names in the taxonomy (`areaName`).
 */
export { de, type Strings };

const ALL: Record<Lang, Strings> = { de, en, fr, es };

export function stringsFor(lang: Lang): Strings {
  return ALL[lang] ?? de;
}

/** The texts of the player's current language; screens re-render when it changes. */
export function useStrings(): Strings {
  return stringsFor(useGame((p) => p.profile.lang));
}

