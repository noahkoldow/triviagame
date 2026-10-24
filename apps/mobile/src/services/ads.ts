/**
 * Ad provider interface. Expo Go cannot load the native AdMob module, so the
 * default is a mock that shows an overlay. The real implementation
 * (react-native-google-mobile-ads) is plugged in for development builds.
 * When an ad may show is decided in shared (`AD_POLICY`, `takeBreak`, `rewardedOffer`).
 */
export interface AdProvider {
  /** Resolves true when the user watched the ad to the end (reward granted). */
  showRewarded(opts: { personalized: boolean }): Promise<boolean>;
  showInterstitial(opts: { personalized: boolean }): Promise<void>;
  /** Full-screen ad when the app comes back to the foreground. */
  showAppOpen(opts: { personalized: boolean }): Promise<void>;
}

export type AdKind = 'rewarded' | 'interstitial' | 'appOpen';

export interface MockAdRequest {
  kind: AdKind;
  personalized: boolean;
  resolve: (watched: boolean) => void;
}

type Listener = (r: MockAdRequest | null) => void;
const listeners = new Set<Listener>();

export function subscribeMockAds(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

function present(kind: AdKind, personalized: boolean): Promise<boolean> {
  return new Promise((resolve) => {
    if (listeners.size === 0) {
      resolve(kind === 'rewarded');
      return;
    }
    const req: MockAdRequest = {
      kind,
      personalized,
      resolve: (watched) => {
        listeners.forEach((l) => l(null));
        resolve(watched);
      },
    };
    listeners.forEach((l) => l(req));
  });
}

export const mockAds: AdProvider = {
  showRewarded: ({ personalized }) => present('rewarded', personalized),
  async showInterstitial({ personalized }) {
    await present('interstitial', personalized);
  },
  async showAppOpen({ personalized }) {
    await present('appOpen', personalized);
  },
};

export let ads: AdProvider = mockAds;
export function setAdProvider(p: AdProvider): void {
  ads = p;
}
