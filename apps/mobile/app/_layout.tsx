import { Stack, useRouter, useSegments, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AdOverlay } from '../src/components/AdOverlay';
import { Bolt } from '../src/components/Bolt';
import { Button, H1, P } from '../src/components/ui';
import { growWaitingNodes } from '@nexus/shared';
import { pool, refillPool } from '../src/services/content';
import { appOpened, startMonetization } from '../src/state/monetize';
import { addRecentlySpawned } from '../src/state/session';
import { getState, hydrate, update, useGame, useHydrated } from '../src/state/store';
import { useStrings } from '../src/strings';
import { colors } from '../src/theme';

/**
 * A render error anywhere (a Skia scene, an odd question) shows this instead of closing the app;
 * the save is untouched, because it is written on every change and not on render.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const t = useStrings();
  useEffect(() => console.error(error), [error]);
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: 24, gap: 12 }}>
      <H1>{t.common.crashTitle}</H1>
      <P>{t.common.crashText}</P>
      <Button label={t.common.crashRetry} onPress={() => void retry()} />
    </View>
  );
}

export default function RootLayout() {
  const hydrated = useHydrated();
  const onboarded = useGame((p) => p.profile.onboarded);
  const unlockedAreas = useGame((p) => p.unlockedAreas);
  const usedCount = useGame((p) => p.network.usedQuestions.length);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    void hydrate();
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

  // after the age gate: Plus, real ads with consent (store builds), an app-open ad on a cold start
  useEffect(() => {
    if (hydrated && onboarded) void startMonetization();
  }, [hydrated, onboarded]);

  // and an app-open ad when the player comes back after a while (D55)
  useEffect(() => {
    if (!hydrated) return;
    let leftAt: number | null = null;
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background') leftAt = Date.now();
      if (s === 'active' && leftAt !== null) {
        void appOpened(Date.now() - leftAt);
        leftAt = null;
      }
    });
    return () => sub.remove();
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const onOnboarding = segments[0] === 'onboarding';
    const onPrivacy = segments[0] === 'privacy';
    // clear the stack first: after a reset from the profile, the old map would otherwise stay underneath
    // and the new one could be swiped back into it
    const restart = (href: '/' | '/onboarding') => {
      if (router.canDismiss()) router.dismissAll();
      router.replace(href);
    };
    if (!onboarded && !onOnboarding && !onPrivacy) restart('/onboarding');
    if (onboarded && onOnboarding) restart('/');
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
