import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AREA_LINKS, SECTORS, SYNAPSE_NEED, areaName, footprint, levelFromXp, networkBonus } from '@nexus/shared';
import { useWindowDimensions } from 'react-native';
import { Bolt } from '../src/components/Bolt';
import { Radar } from '../src/components/Radar';
import { BackBar, Button, Card, H1, P } from '../src/components/ui';
import { pool } from '../src/services/content';
import { leagueApi } from '../src/services/league';
import { getState, resetGame, useGame } from '../src/state/store';
import { useStrings } from '../src/strings';
import { colors } from '../src/theme';

export default function Profile() {
  const router = useRouter();
  const t = useStrings();
  const profile = useGame((p) => p.profile);
  const xp = useGame((p) => p.xp);
  const streak = useGame((p) => p.streak);
  const stats = useGame((p) => p.stats);
  const network = useGame((p) => p.network);
  const lv = levelFromXp(xp);

  const { width } = useWindowDimensions();
  const chartSize = Math.min(width - 24 - 28 - 6, 380);
  const state = useGame((p) => p);
  const areas = footprint(state, pool);
  const axes = areas.map((x) => ({
    // short axis labels, so all areas fit around the chart
    label: t.profile.short[x.area] ?? areaName(x.area, t.lang),
    color: colors.sector[x.sector],
    depth: x.depth,
    coverage: x.coverage,
  }));
  const summary = SECTORS.map((sec) => {
    const mine = areas.filter((x) => x.sector === sec);
    const solved = mine.reduce((t, x) => t + x.solved, 0);
    const deepest = mine.reduce((m, x) => Math.max(m, x.depth), 0);
    return t.profile.sectorLine(t.sectors[sec], solved, Math.round(deepest * 5));
  });

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.body}>
        <BackBar title={t.profile.title} onBack={() => router.back()} />
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Bolt size={90} mood="happy" />
          <H1>{profile.name}</H1>
          <P>{t.profile.stats(lv.level, xp, streak.count, streak.freezes)}</P>
        </View>

        <Card style={{ gap: 10, alignItems: 'center' }}>
          <Text style={[styles.title, { alignSelf: 'flex-start' }]}>{t.profile.footprint}</Text>
          <Radar axes={axes} size={chartSize} summary={t.profile.footprintA11y(summary.join('. '))} />
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.swatch, { backgroundColor: colors.accent, opacity: 0.6 }]} />
              <Text style={styles.legendText}>{t.profile.depthLegend}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.swatch, { borderWidth: 1.5, borderColor: '#FFFFFF', borderStyle: 'dashed' }]} />
              <Text style={styles.legendText}>{t.profile.coverageLegend}</Text>
            </View>
          </View>
          {SECTORS.map((sec, i) => (
            <Text key={sec} style={[styles.sector, { color: colors.sector[sec], alignSelf: 'flex-start' }]}>
              {summary[i]}
            </Text>
          ))}
        </Card>

        <Card style={{ gap: 6 }}>
          <Text style={styles.title}>{t.profile.network}</Text>
          {state.network.synapses?.length ? (
            <>
              <P>{t.profile.networkLine(state.network.synapses.length, AREA_LINKS.length, Math.round(networkBonus(state) * 100))}</P>
              {state.network.synapses.map((s) => (
                <Text key={s.id} style={styles.legendText}>
                  {areaName(s.a, t.lang)} + {areaName(s.b, t.lang)}
                </Text>
              ))}
            </>
          ) : (
            <P>{t.profile.networkEmpty(SYNAPSE_NEED)}</P>
          )}
        </Card>

        <Card>
          <Text style={styles.title}>{t.profile.statistics}</Text>
          <P>{t.profile.statsLine(stats.correct, stats.wrong, stats.solved)}</P>
        </Card>

        <Card style={{ gap: 6 }}>
          <Text style={styles.title}>{t.profile.adsPrivacy}</Text>
          <P>{t.profile.ageLine(profile.ageGroup === 'adult', profile.ageGroup === 'adult' && profile.consent)}</P>
        </Card>

        <Button label={t.profile.settings} variant="ghost" onPress={() => router.push('/settings')} />
        <Button label={t.profile.privacy} variant="ghost" onPress={() => router.push('/privacy')} />

        <Button
          label={t.profile.reset}
          variant="danger"
          onPress={() =>
            Alert.alert(
              t.profile.resetTitle,
              t.profile.resetText,
              [
                { text: t.common.cancel, style: 'cancel' },
                {
                  text: t.profile.resetConfirm,
                  style: 'destructive',
                  onPress: async () => {
                    // the ranking entry on the server goes too, so nothing of this save stays behind
                    const { playerId, token } = getState().league;
                    if (playerId && token) await leagueApi.leave({ playerId, token }).catch(() => undefined);
                    resetGame();
                  },
                },
              ],
            )
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  legend: { gap: 4, alignSelf: 'flex-start' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swatch: { width: 18, height: 10 },
  legendText: { color: colors.dim, fontSize: 12 },
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16, gap: 14 },
  title: { color: colors.text, fontSize: 18, fontWeight: '900' },
  sector: { fontSize: 13, fontWeight: '800' },
  meterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meterLabel: { color: colors.dim, width: 50, fontSize: 12 },
  meterTrack: {
    flex: 1,
    height: 12,
    backgroundColor: colors.line,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
