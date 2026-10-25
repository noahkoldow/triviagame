import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * app.json plus the AdMob plugin. Its app ids come from EAS environment variables (public, not
 * secret); until they are set, Google's sample app ids keep builds working with test ads only.
 * Expo Go ignores the native part and plays with the mock (D1).
 */
const ADMOB_IOS_APP_ID = process.env.ADMOB_IOS_APP_ID || 'ca-app-pub-3940256099942544~1458002511';
const ADMOB_ANDROID_APP_ID = process.env.ADMOB_ANDROID_APP_ID || 'ca-app-pub-3940256099942544~3347511713';

/**
 * A store build must never ship Google's sample ids (test ads, no revenue) or come without
 * purchases: the production profile stops here until every id is set in EAS (environment
 * `production`, docs/MONETIZATION.md §6).
 */
const STORE_IDS = [
  'ADMOB_IOS_APP_ID',
  'ADMOB_ANDROID_APP_ID',
  'EXPO_PUBLIC_ADMOB_IOS_REWARDED',
  'EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL',
  'EXPO_PUBLIC_ADMOB_IOS_APP_OPEN',
  'EXPO_PUBLIC_ADMOB_ANDROID_REWARDED',
  'EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL',
  'EXPO_PUBLIC_ADMOB_ANDROID_APP_OPEN',
  'EXPO_PUBLIC_REVENUECAT_IOS_KEY',
  'EXPO_PUBLIC_REVENUECAT_ANDROID_KEY',
];
if (process.env.EAS_BUILD_PROFILE === 'production') {
  const missing = STORE_IDS.filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Store build without ${missing.join(', ')} (EAS environment "production")`);
}

/**
 * The tracking question (ATT) in the system dialog, per device language (D59). The consent dialog
 * (UMP) asks for tracking on iOS only with this text; minors are never asked.
 */
const TRACKING: Record<'de' | 'en' | 'fr' | 'es', string> = {
  de: 'Damit NEXUS kostenlos bleibt, zeigen wir Werbung. Mit deiner Erlaubnis passt sie besser zu dir.',
  en: 'Ads keep NEXUS free. With your permission they fit you better.',
  fr: 'La publicité rend NEXUS gratuit. Avec ton accord, elle te correspond mieux.',
  es: 'La publicidad mantiene NEXUS gratis. Con tu permiso, se ajusta mejor a ti.',
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'Nexus',
  slug: config.slug ?? 'nexus',
  locales: Object.fromEntries(
    Object.entries(TRACKING).map(([lang, text]) => [lang, { ios: { NSUserTrackingUsageDescription: text } }]),
  ),
  plugins: [
    ...(config.plugins ?? []),
    [
      'react-native-google-mobile-ads',
      {
        iosAppId: ADMOB_IOS_APP_ID,
        androidAppId: ADMOB_ANDROID_APP_ID,
        userTrackingUsageDescription: TRACKING.de,
        // Google; add the ids of every mediation partner when mediation is switched on
        skAdNetworkItems: ['cstr6suwn9.skadnetwork'],
      },
    ],
  ],
});
