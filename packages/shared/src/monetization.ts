import { AREAS, areasOfSector } from './taxonomy';

export type AgeGroup = 'minor' | 'adult';

export interface AdState {
  ageGroup: AgeGroup;
  /** Consent for personalised ads (UMP). Always false for minors. */
  consent: boolean;
  adFree: boolean;
  wrongSinceInterstitial: number;
  lastInterstitialAt: number | null; // epoch ms
}

export interface AdContext {
  now: number;
  /** Phase of the game: ads are never shown while collecting, answering or in boss fights. */
  phase: 'afterWrong' | 'other';
  boss: boolean;
}

export interface AdDecision {
  offerRewarded: boolean;
  showInterstitial: boolean;
  personalized: boolean;
}

export const INTERSTITIAL_EVERY_WRONG = 3;
export const INTERSTITIAL_MIN_GAP_MS = 3 * 60 * 1000;

export function birthYearToAgeGroup(birthYear: number, currentYear: number): AgeGroup {
  return currentYear - birthYear >= 16 ? 'adult' : 'minor';
}

export function decideAds(s: AdState, c: AdContext): AdDecision {
  const personalized = s.ageGroup === 'adult' && s.consent;
  if (s.adFree || c.phase !== 'afterWrong' || c.boss) {
    return { offerRewarded: false, showInterstitial: false, personalized };
  }
  const gapOk =
    s.lastInterstitialAt === null || c.now - s.lastInterstitialAt >= INTERSTITIAL_MIN_GAP_MS;
  const showInterstitial =
    s.ageGroup === 'adult' && s.wrongSinceInterstitial >= INTERSTITIAL_EVERY_WRONG && gapOk;
  return { offerRewarded: !showInterstitial, showInterstitial, personalized };
}

// --- Gems ---------------------------------------------------------------

export const DEBRIS_COST = 10;

/** First area of each sector is free; further areas cost more. */
export function areaCost(areaId: string): number {
  const area = AREAS.find((a) => a.id === areaId);
  if (!area) throw new Error(`Unknown area ${areaId}`);
  const idx = areasOfSector(area.sector).findIndex((a) => a.id === areaId);
  return idx === 0 ? 0 : 15 + 10 * (idx - 1);
}

export function initialUnlockedAreas(): string[] {
  return AREAS.filter((a) => areaCost(a.id) === 0).map((a) => a.id);
}

export function trySpend(
  balance: number,
  cost: number,
): { ok: true; balance: number } | { ok: false; balance: number } {
  return balance >= cost ? { ok: true, balance: balance - cost } : { ok: false, balance };
}
