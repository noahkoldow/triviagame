/**
 * The languages of the game. The player picks one in the onboarding or the settings; the UI,
 * the story, the built-in questions and the questions the server writes follow it.
 */
export type Lang = 'de' | 'en' | 'fr' | 'es';

/** In the order of the language picker. */
export const LANGS: Lang[] = ['de', 'en', 'fr', 'es'];

/** German came first; old saves without a language are German. */
export const DEFAULT_LANG: Lang = 'de';

/** Each language in its own words, for the picker. */
export const LANG_NAMES: Record<Lang, string> = {
  de: 'Deutsch',
  en: 'English',
  fr: 'Français',
  es: 'Español',
};

/** The language as named in the (English) model prompts. */
export const LANG_IN_ENGLISH: Record<Lang, string> = {
  de: 'German',
  en: 'English',
  fr: 'French',
  es: 'Spanish',
};

export function isLang(x: unknown): x is Lang {
  return typeof x === 'string' && (LANGS as string[]).includes(x);
}

/** The game language for a device locale such as "fr-CA" or "es_419"; anything else plays in English. */
export function langFromLocale(locale: string | undefined | null): Lang {
  const code = (locale ?? '').toLowerCase().split(/[-_]/)[0];
  return isLang(code) ? code : 'en';
}
