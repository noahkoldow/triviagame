import { AREAS, areasOfSector } from './taxonomy';

export type AgeGroup = 'minor' | 'adult';

export function birthYearToAgeGroup(birthYear: number, currentYear: number): AgeGroup {
  return currentYear - birthYear >= 16 ? 'adult' : 'minor';
}

/** Personalised ads only for adults who consented (UMP); minors never. */
export function personalizedAds(ageGroup: AgeGroup, consent: boolean): boolean {
  return ageGroup === 'adult' && consent;
}

// --- Ads ----------------------------------------------------------------

/**
 * Where a rewarded video can be watched. Each placement has its own daily limit. `daily` doubles
 * the daily bonus after it was claimed.
 */
export type RewardedPlacement = 'secondChance' | 'integrity' | 'energy' | 'gems' | 'daily';

/**
 * How ads behave, in one place (D55). The game is mostly free, so ads carry it; an EAS update
 * can retune this without a store release.
 * - Rewarded videos are always voluntary and have a daily limit per placement.
 * - Interstitials come only at natural breaks (leaving a result screen for the map), never after
 *   a wrong answer as such, never in a question, a debris field or a boss fight.
 * - An app-open ad can greet a returning player, at most every few hours.
 * - Never for minors (only voluntary, non-personalised videos) and never with Plus or ad-free.
 * - The first session stays clean: nothing forced before `forcedAfterSolved` solved nodes.
 */
export const AD_POLICY = {
  interstitials: true,
  /** Every n-th break shows one. */
  interstitialEveryBreaks: 2,
  /** Since the last ad of any kind: a rewarded video just watched postpones the next interstitial. */
  interstitialMinGapMs: 3 * 60 * 1000,
  appOpen: true,
  appOpenMinGapMs: 4 * 60 * 60 * 1000,
  /** Back from the background after at least this long (a cold start always counts). */
  appOpenMinAwayMs: 60 * 1000,
  forcedAfterSolved: 8,
  /** Per placement and day. Plus and ad-free take the reward without a video, with the same limits. */
  rewardedPerDay: { secondChance: 5, integrity: 3, energy: 4, gems: 5, daily: 1 } as Record<
    RewardedPlacement,
    number
  >,
};

export type AdPolicy = typeof AD_POLICY;

/** What the player state remembers about ads. */
export interface AdMemory {
  /** Natural breaks since the last interstitial. */
  breaksSinceInterstitial: number;
  /** Last interstitial or watched rewarded video (epoch ms). */
  lastAdAt: number | null;
  lastAppOpenAt: number | null;
}

interface ForcedInput {
  ageGroup: AgeGroup;
  /** Plus or ad-free. */
  adFree: boolean;
  solved: number;
  now: number;
}

function forcedAllowed(s: ForcedInput, policy: AdPolicy): boolean {
  return !s.adFree && s.ageGroup === 'adult' && s.solved >= policy.forcedAfterSolved;
}

function gapSince(at: number | null, now: number, gap: number): boolean {
  return at === null || now - at >= gap;
}

export interface InterstitialInput extends ForcedInput, Pick<AdMemory, 'breaksSinceInterstitial' | 'lastAdAt'> {}

/** Whether this break (the counter already includes it) shows an interstitial. */
export function interstitialDue(s: InterstitialInput, policy: AdPolicy = AD_POLICY): boolean {
  if (!policy.interstitials || !forcedAllowed(s, policy)) return false;
  if (s.breaksSinceInterstitial < policy.interstitialEveryBreaks) return false;
  return gapSince(s.lastAdAt, s.now, policy.interstitialMinGapMs);
}

export interface AppOpenInput extends ForcedInput, Pick<AdMemory, 'lastAdAt' | 'lastAppOpenAt'> {
  /** How long the app was in the background; null for a cold start. */
  awayMs: number | null;
}

/** Whether coming back to the app shows an app-open ad. */
export function appOpenDue(s: AppOpenInput, policy: AdPolicy = AD_POLICY): boolean {
  if (!policy.appOpen || !forcedAllowed(s, policy)) return false;
  if (s.awayMs !== null && s.awayMs < policy.appOpenMinAwayMs) return false;
  return (
    gapSince(s.lastAppOpenAt, s.now, policy.appOpenMinGapMs) &&
    gapSince(s.lastAdAt, s.now, policy.interstitialMinGapMs)
  );
}

/** Rewarded videos watched today, per placement. */
export interface RewardedLog {
  day: string | null;
  counts: Partial<Record<RewardedPlacement, number>>;
}

export function rewardedLeft(
  log: RewardedLog,
  placement: RewardedPlacement,
  day: string,
  policy: AdPolicy = AD_POLICY,
): number {
  const used = log.day === day ? (log.counts[placement] ?? 0) : 0;
  return Math.max(0, policy.rewardedPerDay[placement] - used);
}

export function logRewarded(log: RewardedLog, placement: RewardedPlacement, day: string): RewardedLog {
  const counts = log.day === day ? log.counts : {};
  return { day, counts: { ...counts, [placement]: (counts[placement] ?? 0) + 1 } };
}

// --- Purchases and Plus ---------------------------------------------------

/** What the player state remembers about purchases; see `shop.ts`. */
export interface ShopState {
  /** Store transactions already credited: a purchase is never credited twice. */
  credited: string[];
  /** End of the paid NEXUS Plus period (epoch ms). The store is the source of truth. */
  plusUntil: number | null;
  plusLifetime: boolean;
  /** Calendar month (YYYY-MM) whose Plus bonus was claimed. */
  plusClaimed: string | null;
  starterBought: boolean;
  /** The starter offer was presented once outside the shop. */
  starterSeen: boolean;
  /** ISO day whose daily bonus was claimed. */
  dailyClaimed: string | null;
  rewarded: RewardedLog;
}

export function initialShop(): ShopState {
  return {
    credited: [],
    plusUntil: null,
    plusLifetime: false,
    plusClaimed: null,
    starterBought: false,
    starterSeen: false,
    dailyClaimed: null,
    rewarded: { day: null, counts: {} },
  };
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
