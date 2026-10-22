import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AdOverlay } from '../src/components/AdOverlay';
import { Bolt } from '../src/components/Bolt';
import { hydrate, useGame, useHydrated } from '../src/state/store';
import { colors } from '../src/theme';

export default function RootLayout() {
  const hydrated = useHydrated();
  const onboarded = useGame((p) => p.profile.onboarded);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const onOnboarding = segments[0] === 'onboarding';
    if (!onboarded && !onOnboarding) router.replace('/onboarding');
    if (onboarded && onOnboarding) router.replace('/');
  }, [hydrated, onboarded, segments, router]);

  if (!hydrated) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Bolt size={110} mood="think" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'fade',
        }}
      />
      <AdOverlay />
    </SafeAreaProvider>
  );
}
