import { regenEnergy, type PlayerState } from './game';
import {
  AD_POLICY,
  appOpenDue,
  interstitialDue,
  logRewarded,
  personalizedAds,
  rewardedLeft,
  trySpend,
  type AdPolicy,
  type RewardedPlacement,
} from './monetization';
import { MAX_ENERGY, MAX_INTEGRITY } from './rewards';

/**
 * The shop as pure rules (D54): what each product grants, NEXUS Plus, the starter pack, rewarded
 * videos with daily limits, interstitials at natural breaks and the gem sinks. Prices are not
 * here: they come localised from the store, the app only shows fallbacks.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export type ProductId =
  | 'gems_50'
  | 'gems_150'
  | 'gems_400'
  | 'starter'
  | 'plus_month'
  | 'plus_year'
  | 'plus_life';

export interface ProductDef {
  id: ProductId;
  kind: 'consumable' | 'lifetime' | 'subscription';
  gems?: number;
  freezes?: number;
  /** A subscription's period, used when the store sends no expiry (mock). */
  plusDays?: number;
}

export const PRODUCTS: ProductDef[] = [
  { id: 'gems_50', kind: 'consumable', gems: 50 },
  { id: 'gems_150', kind: 'consumable', gems: 150 },
  { id: 'gems_400', kind: 'consumable', gems: 400 },
  { id: 'starter', kind: 'consumable', gems: 100, freezes: 3 },
  { id: 'plus_month', kind: 'subscription', plusDays: 30 },
  { id: 'plus_year', kind: 'subscription', plusDays: 365 },
  { id: 'plus_life', kind: 'lifetime' },
];

export function productDef(id: string): ProductDef | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

/** Percent saved by the yearly plan against twelve months (prices in the same currency), or null. */
export function yearlySaving(monthly: number, yearly: number): number | null {
  if (!(monthly > 0) || !(yearly > 0)) return null;
  const saving = Math.floor((1 - yearly / (12 * monthly)) * 100);
  return saving > 0 ? saving : null;
}

/** A confirmed store transaction. */
export interface Receipt {
  productId: string;
  transactionId: string;
  /** End of a subscription period, from the store (epoch ms). */
  expiresAt?: number | null;
}

/** How many credited transaction ids are kept; stores only redeliver recent, unfinished ones. */
export const CREDITED_KEEP = 200;

/** Streak freezes can be stocked up to this many (the monthly refill tops up to 2, see rewards.ts). */
export const FREEZE_MAX = 5;
export const FREEZE_COST = 10;

/** The starter pack appears once chapter 1 is done (the four start nodes). */
export const STARTER_AFTER_SOLVED = 4;

/** What Plus adds every calendar month, besides no interstitials and rewards without videos. */
export const PLUS_MONTHLY = { gems: 50, freezes: 1 };

/** Energy a rewarded video brings back. */
export const ENERGY_PER_VIDEO = 2;

/** Once a day for opening the app; a video (placement `daily`) doubles it. */
export const DAILY_BONUS = { bits: 15, gems: 1 };

function addFreezes(p: PlayerState, n: number): PlayerState {
  // never lowers a stock that is already above the cap
  const freezes = Math.max(p.streak.freezes, Math.min(FREEZE_MAX, p.streak.freezes + n));
  return { ...p, streak: { ...p.streak, freezes } };
}

/**
 * Credits a confirmed purchase exactly once. Returns null for an unknown product or a transaction
 * that was already credited. A paid product is always credited, even if the offer was hidden.
 */
export function applyPurchase(p: PlayerState, r: Receipt, now: number): PlayerState | null {
  const def = productDef(r.productId);
  if (!def || !r.transactionId || p.shop.credited.includes(r.transactionId)) return null;
  let next: PlayerState = {
    ...p,
    shop: { ...p.shop, credited: [...p.shop.credited, r.transactionId].slice(-CREDITED_KEEP) },
  };
  if (def.gems) next = { ...next, gems: next.gems + def.gems };
  if (def.freezes) next = addFreezes(next, def.freezes);
  if (def.id === 'starter') next = { ...next, shop: { ...next.shop, starterBought: true } };
  if (def.kind === 'lifetime') next = { ...next, shop: { ...next.shop, plusLifetime: true } };
  if (def.kind === 'subscription') {
    const until = r.expiresAt ?? Math.max(now, next.shop.plusUntil ?? 0) + (def.plusDays ?? 30) * DAY_MS;
    next = { ...next, shop: { ...next.shop, plusUntil: Math.max(next.shop.plusUntil ?? 0, until) } };
  }
  return next;
}

/** What the store reports after a restore or at start: it wins over the local copy. */
export interface Entitlements {
  plusUntil: number | null;
  plusLifetime: boolean;
}

export function applyEntitlements(p: PlayerState, e: Entitlements): PlayerState {
  return { ...p, shop: { ...p.shop, plusUntil: e.plusUntil, plusLifetime: e.plusLifetime } };
}

export function isPlus(p: PlayerState, now: number): boolean {
  return p.shop.plusLifetime || (p.shop.plusUntil ?? 0) > now;
}

/** No interstitials, and rewards without a video: Plus, or the earlier one-time "ad-free". */
export function hasAdFree(p: PlayerState, now: number): boolean {
  return isPlus(p, now) || p.profile.adFree;
}

// --- Plus bonus -----------------------------------------------------------

/** Calendar month of an ISO day ("2026-10-24" → "2026-10"). */
export function monthOf(day: string): string {
  return day.slice(0, 7);
}

export function plusBonusDue(p: PlayerState, day: string, now: number): boolean {
  return isPlus(p, now) && p.shop.plusClaimed !== monthOf(day);
}

export function claimPlusBonus(p: PlayerState, day: string, now: number): PlayerState | null {
  if (!plusBonusDue(p, day, now)) return null;
  const next = addFreezes({ ...p, gems: p.gems + PLUS_MONTHLY.gems }, PLUS_MONTHLY.freezes);
  return { ...next, shop: { ...next.shop, plusClaimed: monthOf(day) } };
}

// --- Starter pack ---------------------------------------------------------

export function starterAvailable(p: PlayerState): boolean {
  return !p.shop.starterBought && p.stats.solved >= STARTER_AFTER_SOLVED;
}

/** The starter offer is shown once outside the shop (after a correct answer); then only in the shop. */
export function starterToPresent(p: PlayerState): boolean {
  return starterAvailable(p) && !p.shop.starterSeen;
}

export function markStarterSeen(p: PlayerState): PlayerState {
  return p.shop.starterSeen ? p : { ...p, shop: { ...p.shop, starterSeen: true } };
}

// --- Daily bonus ------------------------------------------------------------

export function dailyBonusDue(p: PlayerState, day: string): boolean {
  return p.shop.dailyClaimed !== day;
}

export function claimDailyBonus(p: PlayerState, day: string): PlayerState | null {
  if (!dailyBonusDue(p, day)) return null;
  return {
    ...p,
    bits: p.bits + DAILY_BONUS.bits,
    gems: p.gems + DAILY_BONUS.gems,
    shop: { ...p.shop, dailyClaimed: day },
  };
}

// --- Rewarded videos -------------------------------------------------------

export interface RewardedOffer {
  /** Rewards left today for this placement; 0 = not offered. */
  left: number;
  /** Plus or ad-free: the reward comes without a video. */
  instant: boolean;
  personalized: boolean;
}

/** A full bar is not offered for refilling; the daily bonus doubles only once it was claimed. */
function rewardUseful(p: PlayerState, placement: RewardedPlacement, day: string, now: number): boolean {
  if (placement === 'integrity') return p.integrity < MAX_INTEGRITY;
  if (placement === 'energy') return regenEnergy(p, now).energy < MAX_ENERGY;
  if (placement === 'daily') return p.shop.dailyClaimed === day;
  return true;
}

export function rewardedOffer(
  p: PlayerState,
  placement: RewardedPlacement,
  day: string,
  now: number,
  policy: AdPolicy = AD_POLICY,
): RewardedOffer {
  return {
    left: rewardUseful(p, placement, day, now) ? rewardedLeft(p.shop.rewarded, placement, day, policy) : 0,
    instant: hasAdFree(p, now),
    personalized: personalizedAds(p.profile.ageGroup, p.profile.consent),
  };
}

/**
 * Grants a rewarded video's reward (after the video, or at once with Plus) and counts it for the
 * day. A watched video postpones the next interstitial. The second chance gives +1 integrity
 * here; Bolt's hint is session state in the app.
 */
export function grantRewarded(
  p: PlayerState,
  placement: RewardedPlacement,
  day: string,
  now: number,
  policy: AdPolicy = AD_POLICY,
): PlayerState | null {
  const offer = rewardedOffer(p, placement, day, now, policy);
  if (offer.left <= 0) return null;
  let next: PlayerState = {
    ...p,
    ads: offer.instant ? p.ads : { ...p.ads, lastAdAt: now },
    shop: { ...p.shop, rewarded: logRewarded(p.shop.rewarded, placement, day) },
  };
  if (placement === 'secondChance' || placement === 'integrity') {
    next = { ...next, integrity: Math.min(MAX_INTEGRITY, next.integrity + 1) };
  } else if (placement === 'energy') {
    const r = regenEnergy(next, now);
    const energy = Math.min(MAX_ENERGY, r.energy + ENERGY_PER_VIDEO);
    next = { ...r, energy, energyAt: energy >= MAX_ENERGY ? null : r.energyAt ?? now };
  } else if (placement === 'daily') {
    next = { ...next, bits: next.bits + DAILY_BONUS.bits, gems: next.gems + DAILY_BONUS.gems };
  } else {
    next = { ...next, gems: next.gems + 1 };
  }
  return next;
}

// --- Interstitials and app-open ads ----------------------------------------------

export interface ForcedAd {
  player: PlayerState;
  /** Show the ad now. The state already counts it as shown (also if none loads). */
  show: boolean;
  personalized: boolean;
}

function forcedInput(p: PlayerState, now: number) {
  return { ageGroup: p.profile.ageGroup, adFree: hasAdFree(p, now), solved: p.stats.solved, now };
}

/** A natural break: the player leaves a node's result for the map. Counts it; maybe an interstitial. */
export function takeBreak(p: PlayerState, now: number, policy: AdPolicy = AD_POLICY): ForcedAd {
  const ads = { ...p.ads, breaksSinceInterstitial: p.ads.breaksSinceInterstitial + 1 };
  const show = interstitialDue({ ...ads, ...forcedInput(p, now) }, policy);
  return {
    player: { ...p, ads: show ? { ...ads, breaksSinceInterstitial: 0, lastAdAt: now } : ads },
    show,
    personalized: personalizedAds(p.profile.ageGroup, p.profile.consent),
  };
}

/** The app comes to the foreground (`awayMs` null = cold start). Maybe an app-open ad. */
export function takeAppOpen(
  p: PlayerState,
  now: number,
  awayMs: number | null,
  policy: AdPolicy = AD_POLICY,
): ForcedAd {
  const show = p.profile.onboarded && appOpenDue({ ...p.ads, ...forcedInput(p, now), awayMs }, policy);
  return {
    player: show ? { ...p, ads: { ...p.ads, lastAppOpenAt: now, lastAdAt: now } } : p,
    show,
    personalized: personalizedAds(p.profile.ageGroup, p.profile.consent),
  };
}

// --- Gem sinks ---------------------------------------------------------------

/** One more streak freeze for gems, up to `FREEZE_MAX`. */
export function buyFreeze(p: PlayerState): PlayerState | null {
  if (p.streak.freezes >= FREEZE_MAX) return null;
  const r = trySpend(p.gems, FREEZE_COST);
  if (!r.ok) return null;
  return addFreezes({ ...p, gems: r.balance }, 1);
}
