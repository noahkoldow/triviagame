import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SECTORS, areaById, sectorOfArea, storyLogs, type Fragment } from '@nexus/shared';
import { Bolt } from '../src/components/Bolt';
import { Icon } from '../src/components/Icon';
import { BackBar, Card, P } from '../src/components/ui';
import { pool } from '../src/services/content';
import { useGame } from '../src/state/store';
import { de } from '../src/strings';
import { colors } from '../src/theme';

export default function Codex() {
  const router = useRouter();
  const codex = useGame((p) => p.codex);
  const story = useGame((p) => p.story);
  // the log files of the story: what the core remembers, piece by piece
  const logs = useMemo(() => storyLogs({ story }), [story]);

  const bySector = useMemo(() => {
    const out: Record<string, { area: string; f: Fragment }[]> = {};
    for (const q of pool.list) {
      for (const f of q.fragments) {
        if (!codex[f.id]) continue;
        (out[sectorOfArea(q.area)] ??= []).push({ area: q.area, f });
      }
    }
    return out;
  }, [codex]);
  const total = Object.keys(codex).length;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.body}>
        <BackBar title="Codex" onBack={() => router.back()} />
        <P>Alle Fragmente, die du wiederhergestellt hast. {total} gesammelt.</P>
        {total === 0 ? (
          <Card style={{ alignItems: 'center', gap: 8 }}>
            <Bolt size={80} mood="think" />
            <P>Noch leer. Löse deinen ersten Knoten, dann landen die Fragmente hier.</P>
          </Card>
        ) : null}
        {logs.length > 0 ? (
          <View style={{ gap: 8 }}>
            <Text style={[styles.sector, { color: colors.accent }]}>LOGBUCH · SYSTEM/LOGS</Text>
            {logs.map((l) => (
              <Card key={l.id} style={{ padding: 12, gap: 4 }}>
                <View style={styles.logHead}>
                  <Icon name="file" size={14} />
                  <Text style={styles.area}>{l.name}</Text>
                </View>
                <Text style={styles.log}>{l.text}</Text>
              </Card>
            ))}
          </View>
        ) : null}
        {SECTORS.map((s) =>
          bySector[s]?.length ? (
            <View key={s} style={{ gap: 8 }}>
              <Text style={[styles.sector, { color: colors.sector[s] }]}>
                {de.sectors[s].toUpperCase()}
              </Text>
              {bySector[s]!.map(({ area, f }) => (
                <Card
                  key={f.id}
                  style={{
                    padding: 12,
                    gap: 4,
                    borderLeftWidth: 3,
                    borderLeftColor: colors.sector[s],
                  }}
                >
                  <Text style={styles.area}>
                    {areaById(area).de} · {f.hint}
                  </Text>
                  <Text style={styles.text}>{f.text}</Text>
                </Card>
              ))}
            </View>
          ) : null,
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16, gap: 12 },
  sector: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2, marginTop: 8 },
  area: { color: colors.dim, fontSize: 12, fontWeight: '700' },
  text: { color: colors.text, fontSize: 15, lineHeight: 22 },
  logHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  log: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
});
