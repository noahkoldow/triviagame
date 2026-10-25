import { langFromLocale, type Lang } from '@nexus/shared';

/** The language of the device, as a starting point for new players (English when it is none of ours). */
export function deviceLang(): Lang {
  try {
    return langFromLocale(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    return 'en';
  }
}
