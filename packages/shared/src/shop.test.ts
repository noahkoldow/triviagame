import { describe, expect, it } from 'vitest';
import {
  AD_POLICY,
  DAILY_BONUS,
  ENERGY_PER_VIDEO,
  FREEZE_COST,
  FREEZE_MAX,
  MAX_ENERGY,
  MAX_INTEGRITY,
  MOCK_QUESTIONS,
  PLUS_MONTHLY,
  Pool,
  STARTER_AFTER_SOLVED,
  applyEntitlements,
  applyPurchase,
  buyFreeze,
  claimDailyBonus,
  claimPlusBonus,
  grantRewarded,
  hasAdFree,
  initialPlayer,
  isPlus,
  markStarterSeen,
  plusBonusDue,
  rewardedOffer,
  starterAvailable,
  starterToPresent,
  takeAppOpen,
  takeBreak,
  yearlySaving,
  type PlayerState,
} from './index';

const pool = new Pool(MOCK_QUESTIONS);
const NOW = Date.parse('2026-10-24T12:00:00Z');
const DAY = '2026-10-24';
const DAY_MS = 24 * 60 * 60 * 1000;

function player(over: Partial<PlayerState> = {}): PlayerState {
  const p = initialPlayer(pool);
  return {
    ...p,
    profile: { ...p.profile, ageGroup: 'adult', consent: true, onboarded: true },
    ...over,
  };
}

const solved = (p: PlayerState, n: number): PlayerState => ({ ...p, stats: { ...p.stats, solved: n } });
const plus = (p: PlayerState): PlayerState => applyPurchase(p, { productId: 'plus_month', transactionId: 'sub' }, NOW)!;

describe('purchases', () => {
  it('credits a transaction exactly once', () => {
    const p = player();
    const once = applyPurchase(p, { productId: 'gems_150', transactionId: 't1' }, NOW)!;
    expect(once.gems).toBe(p.gems + 150);
    expect(applyPurchase(once, { productId: 'gems_150', transactionId: 't1' }, NOW)).toBeNull();
    expect(applyPurchase(once, { productId: 'gems_150', transactionId: 't2' }, NOW)!.gems).toBe(p.gems + 300);
    expect(applyPurchase(p, { productId: 'nope', transactionId: 't3' }, NOW)).toBeNull();
    expect(applyPurchase(p, { productId: 'gems_50', transactionId: '' }, NOW)).toBeNull();
  });

  it('offers the starter pack once chapter 1 is done, once outside the shop', () => {
    const early = player();
    expect(starterAvailable(early)).toBe(false);
    const ready = solved(early, STARTER_AFTER_SOLVED);
    expect(starterAvailable(ready)).toBe(true);
    expect(starterToPresent(ready)).toBe(true);
    const seen = markStarterSeen(ready);
    expect(starterToPresent(seen)).toBe(false);
    expect(starterAvailable(seen)).toBe(true);
    const bought = applyPurchase(seen, { productId: 'starter', transactionId: 's1' }, NOW)!;
    expect(starterAvailable(bought)).toBe(false);
    expect(bought.gems).toBe(seen.gems + 100);
    expect(bought.streak.freezes).toBe(FREEZE_MAX); // 2 + 3, capped
  });

  it('runs Plus until the store says it ends; lifetime stays', () => {
    const p = plus(player());
    expect(isPlus(p, NOW)).toBe(true);
    expect(isPlus(p, NOW + 31 * DAY_MS)).toBe(false);
    const renewed = applyPurchase(p, { productId: 'plus_year', transactionId: 'y1', expiresAt: NOW + 400 * DAY_MS }, NOW)!;
    expect(isPlus(renewed, NOW + 399 * DAY_MS)).toBe(true);
    const cancelled = applyEntitlements(renewed, { plusUntil: NOW - 1, plusLifetime: false });
    expect(isPlus(cancelled, NOW)).toBe(false);
    const life = applyPurchase(player(), { productId: 'plus_life', transactionId: 'l1' }, NOW)!;
    expect(isPlus(life, NOW + 3650 * DAY_MS)).toBe(true);
  });

  it('counts the earlier one-time ad-free as ad-free, not as Plus', () => {
    const p = player();
    const adFree = { ...p, profile: { ...p.profile, adFree: true } };
    expect(hasAdFree(adFree, NOW)).toBe(true);
    expect(isPlus(adFree, NOW)).toBe(false);
  });

  it('gives the Plus bonus once per calendar month', () => {
    expect(plusBonusDue(player(), DAY, NOW)).toBe(false);
    const p = plus(player());
    const claimed = claimPlusBonus(p, DAY, NOW)!;
    expect(claimed.gems).toBe(p.gems + PLUS_MONTHLY.gems);
    expect(claimed.streak.freezes).toBe(p.streak.freezes + PLUS_MONTHLY.freezes);
    expect(claimPlusBonus(claimed, '2026-10-31', NOW)).toBeNull();
    expect(claimPlusBonus(claimed, '2026-11-01', NOW + 8 * DAY_MS)).not.toBeNull();
  });

  it('computes the yearly saving from the store prices', () => {
    expect(yearlySaving(4.99, 29.99)).toBe(49);
    expect(yearlySaving(4.99, 59.88)).toBeNull();
    expect(yearlySaving(0, 29.99)).toBeNull();
  });

  it('sells streak freezes for gems up to the cap', () => {
    const p = player({ gems: 100 });
    const one = buyFreeze(p)!;
    expect(one.gems).toBe(100 - FREEZE_COST);
    expect(one.streak.freezes).toBe(p.streak.freezes + 1);
    const full = { ...one, streak: { ...one.streak, freezes: FREEZE_MAX } };
    expect(buyFreeze(full)).toBeNull();
    expect(buyFreeze(player({ gems: FREEZE_COST - 1 }))).toBeNull();
  });
});

describe('rewarded videos', () => {
  it('grants the reward and stops at the daily limit', () => {
    let p = player();
    for (let i = 0; i < AD_POLICY.rewardedPerDay.gems; i++) p = grantRewarded(p, 'gems', DAY, NOW)!;
    expect(p.gems).toBe(5 + AD_POLICY.rewardedPerDay.gems);
    expect(rewardedOffer(p, 'gems', DAY, NOW).left).toBe(0);
    expect(grantRewarded(p, 'gems', DAY, NOW)).toBeNull();
    expect(rewardedOffer(p, 'gems', '2026-10-25', NOW).left).toBe(AD_POLICY.rewardedPerDay.gems);
  });

  it('does not offer to refill a full bar', () => {
    const p = player();
    expect(p.integrity).toBe(MAX_INTEGRITY);
    expect(rewardedOffer(p, 'integrity', DAY, NOW).left).toBe(0);
    expect(rewardedOffer(p, 'energy', DAY, NOW).left).toBe(0);
    const tired = grantRewarded({ ...p, energy: 1, energyAt: NOW }, 'energy', DAY, NOW)!;
    expect(tired.energy).toBe(1 + ENERGY_PER_VIDEO);
    const almost = grantRewarded({ ...p, energy: MAX_ENERGY - 1, energyAt: NOW }, 'energy', DAY, NOW)!;
    expect(almost.energy).toBe(MAX_ENERGY);
    expect(almost.energyAt).toBeNull();
  });

  it('gives Plus the reward without a video, with the same limits', () => {
    const p = plus(player());
    const offer = rewardedOffer(p, 'secondChance', DAY, NOW);
    expect(offer.instant).toBe(true);
    expect(offer.left).toBe(AD_POLICY.rewardedPerDay.secondChance);
    const hurt = { ...p, integrity: 2 };
    const r = grantRewarded(hurt, 'secondChance', DAY, NOW)!;
    expect(r.integrity).toBe(3);
    expect(r.ads.lastAdAt).toBeNull(); // no video was shown
    expect(grantRewarded({ ...player(), integrity: 2 }, 'secondChance', DAY, NOW)!.ads.lastAdAt).toBe(NOW);
  });

  it('pays the daily bonus once and doubles it once with a video', () => {
    const p = player();
    expect(rewardedOffer(p, 'daily', DAY, NOW).left).toBe(0);
    const claimed = claimDailyBonus(p, DAY)!;
    expect(claimed.bits).toBe(p.bits + DAILY_BONUS.bits);
    expect(claimDailyBonus(claimed, DAY)).toBeNull();
    const doubled = grantRewarded(claimed, 'daily', DAY, NOW)!;
    expect(doubled.gems).toBe(p.gems + 2 * DAILY_BONUS.gems);
    expect(grantRewarded(doubled, 'daily', DAY, NOW)).toBeNull();
    expect(claimDailyBonus(doubled, '2026-10-25')).not.toBeNull();
  });
});

describe('forced ads', () => {
  const veteran = solved(player(), AD_POLICY.forcedAfterSolved);

  it('shows an interstitial every n-th break and restarts the count', () => {
    let p = veteran;
    const shown: boolean[] = [];
    for (let i = 0; i < 2 * AD_POLICY.interstitialEveryBreaks; i++) {
      const b = takeBreak(p, NOW + i * AD_POLICY.interstitialMinGapMs);
      shown.push(b.show);
      p = b.player;
    }
    const every = AD_POLICY.interstitialEveryBreaks;
    expect(shown.filter(Boolean)).toHaveLength(2);
    expect(shown[every - 1]).toBe(true);
    expect(p.ads.breaksSinceInterstitial).toBe(0);
  });

  it('leaves the first session, Plus and minors alone', () => {
    const many = (p: PlayerState) => ({ ...p, ads: { ...p.ads, breaksSinceInterstitial: 99 } });
    expect(takeBreak(many(player()), NOW).show).toBe(false);
    expect(takeBreak(many(plus(veteran)), NOW).show).toBe(false);
    const minor = { ...veteran, profile: { ...veteran.profile, ageGroup: 'minor' as const } };
    expect(takeBreak(many(minor), NOW).show).toBe(false);
  });

  it('postpones the interstitial after a watched video', () => {
    const watched = grantRewarded({ ...veteran, integrity: 1 }, 'integrity', DAY, NOW)!;
    const ready = { ...watched, ads: { ...watched.ads, breaksSinceInterstitial: 99 } };
    expect(takeBreak(ready, NOW + 1000).show).toBe(false);
    expect(takeBreak(ready, NOW + AD_POLICY.interstitialMinGapMs).show).toBe(true);
  });

  it('shows an app-open ad on return, at most every few hours, never before onboarding', () => {
    const first = takeAppOpen(veteran, NOW, null);
    expect(first.show).toBe(true);
    expect(takeAppOpen(first.player, NOW + 60 * 60 * 1000, 5 * 60 * 1000).show).toBe(false);
    expect(takeAppOpen(first.player, NOW + AD_POLICY.appOpenMinGapMs, 5 * 60 * 1000).show).toBe(true);
    const fresh = { ...veteran, profile: { ...veteran.profile, onboarded: false } };
    expect(takeAppOpen(fresh, NOW, null).show).toBe(false);
  });
});
