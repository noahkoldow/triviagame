import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SECTORS, areaById, footprint, levelFromXp } from '@nexus/shared';
import { useWindowDimensions } from 'react-native';
import { Bolt } from '../src/components/Bolt';
import { Radar } from '../src/components/Radar';
import { BackBar, Button, Card, H1, P } from '../src/components/ui';
import { pool } from '../src/services/content';
import { resetGame, useGame } from '../src/state/store';
import { de } from '../src/strings';
import { colors } from '../src/theme';

/** Short axis labels, so sixteen of them fit around the chart. */
const SHORT: Record<string, string> = {
  computing: 'Info',
  geography: 'Geo',
  climate: 'Klima',
  literature: 'Literatur',
  antiquity: 'Antike',
  politics: 'Politik',
  economy: 'Wirtschaft',
};

export default function Profile() {
  const router = useRouter();
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
    label: SHORT[x.area] ?? areaById(x.area).de,
    color: colors.sector[x.sector],
    depth: x.depth,
    coverage: x.coverage,
  }));
  const summary = SECTORS.map((sec) => {
    const mine = areas.filter((x) => x.sector === sec);
    const solved = mine.reduce((t, x) => t + x.solved, 0);
    const deepest = mine.reduce((m, x) => Math.max(m, x.depth), 0);
    return `${de.sectors[sec]}: ${solved} Knoten gelöst, Tiefe ${Math.round(deepest * 5)} von 5`;
  });

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.body}>
        <BackBar title="Profil" onBack={() => router.back()} />
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Bolt size={90} mood="happy" />
          <H1>{profile.name}</H1>
          <P>
            Level {lv.level} · {xp} XP · Serie {streak.count} Tage · {streak.freezes} Streak-Schutz
          </P>
        </View>

        <Card style={{ gap: 10, alignItems: 'center' }}>
          <Text style={[styles.title, { alignSelf: 'flex-start' }]}>Dein Wissens-Fußabdruck</Text>
          <Radar axes={axes} size={chartSize} summary={`Wissens-Fußabdruck. ${summary.join('. ')}`} />
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.swatch, { backgroundColor: colors.accent, opacity: 0.6 }]} />
              <Text style={styles.legendText}>Tiefe: schwerster gelöster Knoten</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.swatch, { borderWidth: 1.5, borderColor: '#FFFFFF', borderStyle: 'dashed' }]} />
              <Text style={styles.legendText}>Abdeckung: Anteil gelöster Fragen</Text>
            </View>
          </View>
          {SECTORS.map((sec, i) => (
            <Text key={sec} style={[styles.sector, { color: colors.sector[sec], alignSelf: 'flex-start' }]}>
              {summary[i]}
            </Text>
          ))}
        </Card>

        <Card>
          <Text style={styles.title}>Statistik</Text>
          <P>
            Richtig: {stats.correct} · Daneben: {stats.wrong} · Knoten gelöst: {stats.solved}
          </P>
        </Card>

        <Card style={{ gap: 6 }}>
          <Text style={styles.title}>Werbung & Datenschutz</Text>
          <P>
            Alter: {profile.ageGroup === 'adult' ? '16 oder älter' : 'unter 16'} · Personalisierte
            Werbung: {profile.ageGroup === 'adult' && profile.consent ? 'an' : 'aus'}
          </P>
        </Card>

        <Button label="Datenschutz & Info" variant="ghost" onPress={() => router.push('/privacy')} />

        <Button
          label="Spielstand zurücksetzen"
          variant="danger"
          onPress={() =>
            Alert.alert(
              'Wirklich zurücksetzen?',
              'Dein Netz und alle Fortschritte werden gelöscht.',
              [
                { text: 'Abbrechen', style: 'cancel' },
                { text: 'Zurücksetzen', style: 'destructive', onPress: () => resetGame() },
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
