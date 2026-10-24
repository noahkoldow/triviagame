import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * app.json plus the AdMob plugin. Its app ids come from EAS environment variables (public, not
 * secret); until they are set, Google's sample app ids keep builds working with test ads only.
 * Expo Go ignores the native part and plays with the mock (D1).
 */
const ADMOB_IOS_APP_ID = process.env.ADMOB_IOS_APP_ID || 'ca-app-pub-3940256099942544~1458002511';
const ADMOB_ANDROID_APP_ID = process.env.ADMOB_ANDROID_APP_ID || 'ca-app-pub-3940256099942544~3347511713';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'Nexus',
  slug: config.slug ?? 'nexus',
  plugins: [
    ...(config.plugins ?? []),
    [
      'react-native-google-mobile-ads',
      {
        iosAppId: ADMOB_IOS_APP_ID,
        androidAppId: ADMOB_ANDROID_APP_ID,
        // the consent dialog (UMP) asks for tracking on iOS only with this text; minors are never asked
        userTrackingUsageDescription:
          'Damit NEXUS kostenlos bleibt, zeigen wir Werbung. Mit deiner Erlaubnis passt sie besser zu dir.',
        // Google; add the ids of every mediation partner when mediation is switched on
        skAdNetworkItems: ['cstr6suwn9.skadnetwork'],
      },
    ],
  ],
});
