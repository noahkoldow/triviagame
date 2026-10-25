import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ALBUMS,
  ALBUM_REWARD,
  SECTORS,
  albumSolved,
  areaName,
  sectorOfArea,
  storyLogs,
  type Fragment,
} from '@nexus/shared';
import { Bolt } from '../src/components/Bolt';
import { Icon } from '../src/components/Icon';
import { BackBar, Card, P } from '../src/components/ui';
import { pool } from '../src/services/content';
import { useGame } from '../src/state/store';
import { useStrings } from '../src/strings';
import { colors } from '../src/theme';

export default function Codex() {
  const router = useRouter();
  const t = useStrings();
  const codex = useGame((p) => p.codex);
  const story = useGame((p) => p.story);
  const network = useGame((p) => p.network);
  // the log files of the story: what the core remembers, piece by piece
  const logs = useMemo(() => storyLogs({ story }, t.lang), [story, t.lang]);

  const bySector = useMemo(() => {
    const out: Record<string, { area: string; f: Fragment }[]> = {};
    for (const q of pool.byId.values()) {
      for (const f of q.fragments) {
        if (!codex[f.id]) continue;
        (out[sectorOfArea(q.area)] ??= []).push({ area: q.area, f });
      }
    }
    return out;
  }, [codex, t.lang]);
  const total = Object.keys(codex).length;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.body}>
        <BackBar title={t.codex.title} onBack={() => router.back()} />
        <P>{t.codex.intro(total)}</P>
        {total === 0 ? (
          <Card style={{ alignItems: 'center', gap: 8 }}>
            <Bolt size={80} mood="think" />
            <P>{t.codex.empty}</P>
          </Card>
        ) : null}
        {logs.length > 0 ? (
          <View style={{ gap: 8 }}>
            <Text style={[styles.sector, { color: colors.accent }]}>{t.codex.logbook}</Text>
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
        {/* collection albums: themes across the areas, so exploring wide pays */}
        <View style={{ gap: 8 }}>
          <Text style={[styles.sector, { color: colors.gem }]}>{t.codex.albums}</Text>
          <P>{t.codex.albumsIntro(ALBUM_REWARD.gems, ALBUM_REWARD.bits)}</P>
          {ALBUMS.map((a) => {
            const solved = albumSolved(network, a);
            const full = solved.length === a.questions.length;
            return (
              <Card key={a.id} style={{ padding: 12, gap: 4, borderLeftWidth: 3, borderLeftColor: full ? colors.gem : colors.panelHi }}>
                <View style={styles.logHead}>
                  {full ? <Icon name="check" size={14} /> : <Icon name="book" size={14} />}
                  <Text style={[styles.text, { fontWeight: '800', flex: 1 }]}>
                    {t.codex.albumNames[a.id as keyof typeof t.codex.albumNames]}
                  </Text>
                  <Text style={styles.area}>
                    {solved.length} / {a.questions.length}
                  </Text>
                </View>
                {a.questions.map((id) => {
                  const q = pool.byId.get(id);
                  if (!q) return null;
                  return (
                    <Text key={id} style={styles.area}>
                      {solved.includes(id) ? `✓ ${q.topic} · ${areaName(q.area, t.lang)}` : t.codex.albumMissing(areaName(q.area, t.lang))}
                    </Text>
                  );
                })}
              </Card>
            );
          })}
        </View>
        {SECTORS.map((s) =>
          bySector[s]?.length ? (
            <View key={s} style={{ gap: 8 }}>
              <Text style={[styles.sector, { color: colors.sector[s] }]}>
                {t.sectors[s].toUpperCase()}
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
                    {areaName(area, t.lang)} · {f.hint}
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
