import { Platform } from 'react-native';
import type * as GMA from 'react-native-google-mobile-ads';
import type { AdAudience } from '@nexus/shared';
import type { AdProvider } from './ads';

/**
 * The real ad provider (Google AdMob), only for development and store builds: Expo Go cannot load
 * the native module, so it is required lazily and Expo Go keeps the mock (D1). Consent (UMP, with
 * Google's IDFA explainer for App Tracking Transparency on iOS) is gathered before the SDK starts;
 * minors are tagged as under the age of consent (children also as child-directed, `adAudience`)
 * and never asked. When an ad may show is decided in shared (`AD_POLICY`); this file only loads
 * and shows.
 */

type Unit = 'rewarded' | 'interstitial' | 'appOpen';

/**
 * Ad unit ids per platform from EAS environment variables (public, not secret). Google's test units
 * in development and until the real ones are set (see docs/MONETIZATION.md §6).
 */
function unitId(m: typeof GMA, unit: Unit): string {
  const ios = {
    rewarded: process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED,
    interstitial: process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL,
    appOpen: process.env.EXPO_PUBLIC_ADMOB_IOS_APP_OPEN,
  };
  const android = {
    rewarded: process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED,
    interstitial: process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL,
    appOpen: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_OPEN,
  };
  const test = { rewarded: m.TestIds.REWARDED, interstitial: m.TestIds.INTERSTITIAL, appOpen: m.TestIds.APP_OPEN };
  const real = Platform.OS === 'ios' ? ios[unit] : android[unit];
  return __DEV__ || !real ? test[unit] : real;
}

interface Format {
  ad: { readonly loaded: boolean; load(): void; show(): Promise<void> };
  onLoaded(cb: () => void): () => void;
  onError(cb: () => void): () => void;
  onClosed(cb: () => void): () => void;
  onEarned?(cb: () => void): () => void;
}

/** One ad unit: keeps an ad loaded, reloads after it closed, and waits for one in flight. */
class Placement {
  private f: Format | null = null;
  private nonPersonalized = true;
  private state: 'idle' | 'loading' | 'loaded' = 'idle';
  private waiters = new Set<(ok: boolean) => void>();

  constructor(private make: (nonPersonalized: boolean) => Format) {}

  private format(nonPersonalized: boolean): Format {
    if (this.f && this.nonPersonalized === nonPersonalized) return this.f;
    const f = this.make(nonPersonalized);
    const mine = () => this.f === f;
    f.onLoaded(() => mine() && this.settle('loaded'));
    f.onError(() => mine() && this.settle('idle'));
    f.onClosed(() => {
      if (!mine()) return;
      this.state = 'idle';
      this.load();
    });
    this.f = f;
    this.nonPersonalized = nonPersonalized;
    this.state = 'idle';
    return f;
  }

  private settle(state: 'idle' | 'loaded') {
    this.state = state;
    this.waiters.forEach((w) => w(state === 'loaded'));
    this.waiters.clear();
  }

  private load() {
    if (!this.f || this.state !== 'idle') return;
    this.state = 'loading';
    this.f.ad.load();
  }

  preload(nonPersonalized: boolean) {
    this.format(nonPersonalized);
    this.load();
  }

  /** The loaded ad, waiting up to `ms` for one; null if none is ready (a load is then started). */
  async take(nonPersonalized: boolean, ms: number): Promise<Format | null> {
    const f = this.format(nonPersonalized);
    if (this.state === 'loaded' && f.ad.loaded) return f;
    this.load();
    if (ms <= 0) return null;
    const ok = await new Promise<boolean>((resolve) => {
      const done = (v: boolean) => {
        clearTimeout(timer);
        resolve(v);
      };
      const timer = setTimeout(() => {
        this.waiters.delete(done);
        resolve(false);
      }, ms);
      this.waiters.add(done);
    });
    return ok && this.f === f && f.ad.loaded ? f : null;
  }
}

/** Shows a loaded ad and resolves when it closed; `earned` for rewarded ads. */
function present(f: Format): Promise<boolean> {
  return new Promise((resolve) => {
    let earned = false;
    const offs: (() => void)[] = [];
    const finish = (v: boolean) => {
      offs.forEach((off) => off());
      resolve(v);
    };
    if (f.onEarned) offs.push(f.onEarned(() => (earned = true)));
    offs.push(f.onClosed(() => finish(earned)));
    f.ad.show().catch(() => finish(false));
  });
}

export async function createAdMobProvider(opts: { audience: AdAudience; personalized: boolean }): Promise<AdProvider | null> {
  let m: typeof GMA;
  try {
    m = require('react-native-google-mobile-ads') as typeof GMA;
  } catch {
    return null;
  }
  const { AdsConsent, AdsConsentPrivacyOptionsRequirementStatus, AdEventType, RewardedAdEventType } = m;

  let privacyRequired = false;
  try {
    const info = await AdsConsent.gatherConsent({ tagForUnderAgeOfConsent: opts.audience.underAgeOfConsent });
    privacyRequired = info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED;
  } catch {
    // offline or outside the consent regions: requests decide per region
  }
  try {
    await m.default().setRequestConfiguration({
      maxAdContentRating: m.MaxAdContentRating[opts.audience.maxRating],
      tagForChildDirectedTreatment: opts.audience.childDirected,
      tagForUnderAgeOfConsent: opts.audience.underAgeOfConsent,
    });
    await m.default().initialize();
  } catch {
    return null;
  }

  const rewarded = new Placement((npa) => {
    const ad = m.RewardedAd.createForAdRequest(unitId(m, 'rewarded'), { requestNonPersonalizedAdsOnly: npa });
    return {
      ad,
      onLoaded: (cb) => ad.addAdEventListener(RewardedAdEventType.LOADED, cb),
      onError: (cb) => ad.addAdEventListener(AdEventType.ERROR, cb),
      onClosed: (cb) => ad.addAdEventListener(AdEventType.CLOSED, cb),
      onEarned: (cb) => ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, cb),
    };
  });
  const interstitial = new Placement((npa) => {
    const ad = m.InterstitialAd.createForAdRequest(unitId(m, 'interstitial'), { requestNonPersonalizedAdsOnly: npa });
    return {
      ad,
      onLoaded: (cb) => ad.addAdEventListener(AdEventType.LOADED, cb),
      onError: (cb) => ad.addAdEventListener(AdEventType.ERROR, cb),
      onClosed: (cb) => ad.addAdEventListener(AdEventType.CLOSED, cb),
    };
  });
  const appOpen = new Placement((npa) => {
    const ad = m.AppOpenAd.createForAdRequest(unitId(m, 'appOpen'), { requestNonPersonalizedAdsOnly: npa });
    return {
      ad,
      onLoaded: (cb) => ad.addAdEventListener(AdEventType.LOADED, cb),
      onError: (cb) => ad.addAdEventListener(AdEventType.ERROR, cb),
      onClosed: (cb) => ad.addAdEventListener(AdEventType.CLOSED, cb),
    };
  });

  // warm the inventory, so breaks and returns rarely wait
  const npa = !opts.personalized;
  rewarded.preload(npa);
  if (!opts.audience.underAgeOfConsent) {
    interstitial.preload(npa);
    appOpen.preload(npa);
  }

  return {
    async showRewarded({ personalized }) {
      // the player asked for it: worth a short wait
      const f = await rewarded.take(!personalized, 8000);
      return f ? present(f) : false;
    },
    async showInterstitial({ personalized }) {
      // never hold up the way back to the map
      const f = await interstitial.take(!personalized, 0);
      if (f) await present(f);
    },
    async showAppOpen({ personalized }) {
      const f = await appOpen.take(!personalized, 2500);
      if (f) await present(f);
    },
    privacyOptions: privacyRequired
      ? async () => {
          await AdsConsent.showPrivacyOptionsForm().catch(() => {});
        }
      : null,
  };
}
