import type { RewardedPlacement } from '@nexus/shared';
import type { AdKind } from './ads';

/**
 * Analytics provider interface: the revenue funnel needs numbers (docs/MONETIZATION.md §5).
 * The mock logs in development and sends nothing. A real provider (e.g. Firebase Analytics in the
 * store build) must respect the ad consent and send no personal data.
 */
export type AnalyticsEvent =
  | { name: 'ad_offer'; placement: RewardedPlacement; instant: boolean }
  | { name: 'ad_shown'; kind: AdKind; placement?: RewardedPlacement }
  | { name: 'ad_reward'; placement: RewardedPlacement; instant: boolean }
  | { name: 'shop_open'; from: string }
  | { name: 'paywall_open'; from: string }
  | { name: 'offer_shown'; offer: 'starter' | 'plus' }
  | { name: 'purchase_start'; product: string }
  | { name: 'purchase_done'; product: string }
  | { name: 'purchase_cancel'; product: string };

export interface AnalyticsProvider {
  track(e: AnalyticsEvent): void;
}

export const mockAnalytics: AnalyticsProvider = {
  track(e) {
    if (__DEV__) console.log('[analytics]', e.name, e);
  },
};

let provider: AnalyticsProvider = mockAnalytics;
export function setAnalyticsProvider(p: AnalyticsProvider): void {
  provider = p;
}

export function track(e: AnalyticsEvent): void {
  try {
    provider.track(e);
  } catch {
    // analytics never breaks the game
  }
}
