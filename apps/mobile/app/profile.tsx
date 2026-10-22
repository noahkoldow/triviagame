import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SECTORS, areasOfSector, levelFromXp, sectorOfArea } from '@nexus/shared';
import { Bolt } from '../src/components/Bolt';
import { Button, Card, H1, P } from '../src/components/ui';
import { pool } from '../src/services/content';
import { resetGame, useGame } from '../src/state/store';
import { de } from '../src/strings';
import { colors } from '../src/theme';

export default function Profile() {
  const router = useRouter();
  const profile = useGame((p) => p.profile);
  const xp = useGame((p) => p.xp);
  const streak = useGame((p) => p.streak);
  const stats = useGame((p) => p.stats);
  const network = useGame((p) => p.network);
  const lv = levelFromXp(xp);

  // breadth = share of areas touched, depth = best difficulty solved
  const footprint = SECTORS.map((s) => {
    const areas = areasOfSector(s).map((a) => a.id);
    const solved = Object.values(network.nodes).filter(
      (n) => n.state !== 'open' && sectorOfArea(pool.get(n.questionId).area) === s,
    );
    const touched = new Set(solved.map((n) => pool.get(n.questionId).area));
    const depth = solved.reduce((m, n) => Math.max(m, pool.get(n.questionId).difficulty), 0);
    return { s, breadth: touched.size / areas.length, depth: depth / 5, count: solved.length };
  });

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.body}>
        <Button
          label="‹ Zurück"
          variant="ghost"
          onPress={() => router.back()}
          style={{ alignSelf: 'flex-start' }}
        />
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Bolt size={90} mood="happy" />
          <H1>{profile.name}</H1>
          <P>
            Level {lv.level} · {xp} XP · 🔥 {streak.count} Tage · {streak.freezes} Streak-Schutz
          </P>
        </View>

        <Card style={{ gap: 12 }}>
          <Text style={styles.title}>Dein Wissens-Fußabdruck</Text>
          <P>
            Breite zeigt, wie viele Bereiche du angefasst hast, Tiefe den schwersten gelösten
            Knoten.
          </P>
          {footprint.map(({ s, breadth, depth, count }) => (
            <View key={s} style={{ gap: 4 }}>
              <Text style={[styles.sector, { color: colors.sector[s] }]}>
                {de.sectors[s]} · {count} Knoten
              </Text>
              <Meter label="Breite" value={breadth} color={colors.sector[s]} />
              <Meter label="Tiefe" value={depth} color={colors.sector[s]} />
            </View>
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

function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View
      style={styles.meterRow}
      accessibilityLabel={`${label} ${Math.round(value * 100)} Prozent`}
    >
      <Text style={styles.meterLabel}>{label}</Text>
      <View style={styles.meterTrack}>
        <View
          style={{
            width: `${Math.round(value * 100)}%`,
            height: 8,
            backgroundColor: color,
            borderRadius: 4,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16, gap: 14 },
  title: { color: colors.text, fontSize: 18, fontWeight: '800' },
  sector: { fontSize: 13, fontWeight: '800' },
  meterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meterLabel: { color: colors.dim, width: 50, fontSize: 12 },
  meterTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.line,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
