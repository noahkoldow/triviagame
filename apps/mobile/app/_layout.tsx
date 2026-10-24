import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AdOverlay } from '../src/components/AdOverlay';
import { Bolt } from '../src/components/Bolt';
import { growWaitingNodes, rollWeek } from '@nexus/shared';
import { pool, refillPool } from '../src/services/content';
import { addRecentlySpawned } from '../src/state/session';
import { getState, hydrate, update, useGame, useHydrated } from '../src/state/store';
import { colors } from '../src/theme';

export default function RootLayout() {
  const hydrated = useHydrated();
  const onboarded = useGame((p) => p.profile.onboarded);
  const unlockedAreas = useGame((p) => p.unlockedAreas);
  const usedCount = useGame((p) => p.network.usedQuestions.length);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    void hydrate().then(() => update((p) => {
      const r = rollWeek(p, Date.now());
      return r === p ? null : r;
    }));
  }, []);

  // open end: whenever an area runs low, fetch more; branches that waited for questions grow
  useEffect(() => {
    if (!hydrated) return;
    const p = getState();
    void refillPool({ unlockedAreas: p.unlockedAreas, usedQuestions: p.network.usedQuestions, skill: p.skill }).then(
      (added) => {
        if (added === 0) return;
        update((s) => {
          const r = growWaitingNodes(s, pool, String(s.network.usedQuestions.length));
          if (!r) return null;
          addRecentlySpawned(r.spawned);
          return r.player;
        });
      },
    );
  }, [hydrated, unlockedAreas, usedCount]);

  useEffect(() => {
    if (!hydrated) return;
    const onOnboarding = segments[0] === 'onboarding';
    const onPrivacy = segments[0] === 'privacy';
    if (!onboarded && !onOnboarding && !onPrivacy) router.replace('/onboarding');
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
