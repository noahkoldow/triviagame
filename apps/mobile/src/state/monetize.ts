import {
  applyEntitlements,
  applyPurchase,
  claimPlusBonus,
  grantRewarded,
  productDef,
  rewardedOffer,
  takeAppOpen,
  takeBreak,
  type ProductId,
  type RewardedPlacement,
} from '@nexus/shared';
import { useEffect, useState } from 'react';
import { ads } from '../services/ads';
import { track } from '../services/analytics';
import { PRODUCT_TEXT, purchases, type StoreProduct } from '../services/purchases';
import { getState, today, update } from './store';

/**
 * Glue between the shop rules (shared `shop.ts`), the ad and purchase providers and the game
 * state. Screens call these and hold no rules.
 */

let busy = false;

/**
 * A rewarded reward: with Plus or ad-free at once, otherwise after a watched video. False if
 * nothing is left today, the video was cancelled, or another ad is running.
 */
export async function watchRewarded(placement: RewardedPlacement): Promise<boolean> {
  if (busy) return false;
  const offer = rewardedOffer(getState(), placement, today(), Date.now());
  if (offer.left <= 0) return false;
  if (!offer.instant) {
    busy = true;
    track({ name: 'ad_shown', kind: 'rewarded', placement });
    const watched = await ads.showRewarded({ personalized: offer.personalized }).catch(() => false);
    busy = false;
    if (!watched) return false;
  }
  const ok = update((p) => grantRewarded(p, placement, today(), Date.now()));
  if (ok) track({ name: 'ad_reward', placement, instant: offer.instant });
  return ok;
}

/** A natural break (a node's result → the map): maybe an interstitial. */
export async function adBreak(): Promise<void> {
  if (busy) return;
  const b = takeBreak(getState(), Date.now());
  update(() => b.player);
  if (!b.show) return;
  busy = true;
  track({ name: 'ad_shown', kind: 'interstitial' });
  await ads.showInterstitial({ personalized: b.personalized }).catch(() => {});
  busy = false;
}

/** The app came to the foreground (`awayMs` null = cold start): maybe an app-open ad. */
export async function appOpened(awayMs: number | null): Promise<void> {
  if (busy) return;
  const a = takeAppOpen(getState(), Date.now(), awayMs);
  if (!a.show) return;
  update(() => a.player);
  busy = true;
  track({ name: 'ad_shown', kind: 'appOpen' });
  await ads.showAppOpen({ personalized: a.personalized }).catch(() => {});
  busy = false;
}

/** Buys a product and credits it once; Plus pays this month's bonus right away. */
export async function buy(productId: ProductId): Promise<boolean> {
  track({ name: 'purchase_start', product: productId });
  const receipt = await purchases.purchase(productId).catch(() => null);
  if (!receipt) {
    track({ name: 'purchase_cancel', product: productId });
    return false;
  }
  update((p) => applyPurchase(p, receipt, Date.now()));
  if (productDef(productId)?.kind !== 'consumable') update((p) => claimPlusBonus(p, today(), Date.now()));
  track({ name: 'purchase_done', product: productId });
  return true;
}

/** At start: the store's view of Plus wins over the local copy (cancelled, refunded, renewed). */
export async function syncEntitlements(): Promise<void> {
  const e = await purchases.entitlements().catch(() => null);
  if (e) update((p) => applyEntitlements(p, e));
}

/** Restores Plus from the store. True if the store knew something. */
export async function restorePurchases(): Promise<boolean> {
  const e = await purchases.restore().catch(() => null);
  if (!e) return false;
  update((p) => applyEntitlements(p, e));
  return true;
}

const FALLBACK = Object.fromEntries(
  (Object.keys(PRODUCT_TEXT) as ProductId[]).map((id) => [
    id,
    { id, price: PRODUCT_TEXT[id].price, amount: PRODUCT_TEXT[id].amount },
  ]),
) as Record<ProductId, StoreProduct>;

/** Localised store prices, with the fallback texts until the store answers. */
export function usePrices(): Record<ProductId, StoreProduct> {
  const [prices, setPrices] = useState(FALLBACK);
  useEffect(() => {
    let alive = true;
    purchases
      .products()
      .then((list) => {
        if (alive) setPrices({ ...FALLBACK, ...Object.fromEntries(list.map((x) => [x.id, x])) });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return prices;
}
