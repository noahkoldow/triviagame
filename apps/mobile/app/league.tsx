import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AREAS, OVERALL, SECTOR_COLOR, areaName, leagueUnlocked } from '@nexus/shared';
import { Icon } from '../src/components/Icon';
import { BackBar, Button, Card, H1, P } from '../src/components/ui';
import { leagueApi, type BoardEntry, type Standings } from '../src/services/league';
import { syncRanking } from '../src/state/ranking';
import { useGame } from '../src/state/store';
import { useStrings, type Strings } from '../src/strings';
import { colors } from '../src/theme';

/** Overall by XP, then every area by solved nodes. */
const boards = (t: Strings) => [
  { id: OVERALL, label: t.league.overall, color: colors.accent },
  ...AREAS.map((a) => ({ id: a.id, label: areaName(a.id, t.lang), color: SECTOR_COLOR[a.sector] })),
];
const MEDALS = ['#FFD23F', '#C0C0C0', '#CD7F32'];

function Row({ e, board }: { e: BoardEntry; board: string }) {
  const t = useStrings();
  return (
    <View
      accessible
      accessibilityLabel={t.league.rankA11y(e.rank, e.alias, e.me, t.league.score(board === OVERALL, e.score))}
      style={[styles.row, e.rank <= MEDALS.length && { borderLeftColor: MEDALS[e.rank - 1] }, e.me && styles.meRow]}
    >
      <Text style={styles.rank}>{e.rank}</Text>
      <Text style={[styles.alias, e.me && styles.me]} numberOfLines={1}>
        {e.alias}
        {e.me ? t.league.you : ''}
      </Text>
      <Text style={[styles.score, e.me && styles.me]}>{e.score}</Text>
    </View>
  );
}

/** The ranking of everybody who plays (D57): overall and per area. */
export default function League() {
  const router = useRouter();
  const t = useStrings();
  const BOARDS = boards(t);
  // right after the brain reveal: a greeting on top
  const welcome = useLocalSearchParams<{ welcome?: string }>().welcome === '1';
  const unlocked = useGame((p) => leagueUnlocked(p));
  const [board, setBoard] = useState(OVERALL);
  const [standings, setStandings] = useState<Standings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const load = useCallback(async (b: string) => {
    setBusy(true);
    setError(null);
    try {
      setStandings(await syncRanking(b));
    } catch {
      setError(t.league.offline);
    } finally {
      setBusy(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      if (unlocked && leagueApi.live) void load(board);
    }, [load, unlocked, board]),
  );

  const shown = standings?.board === board ? standings : null;
  const label = BOARDS.find((b) => b.id === board)!.label;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.body}>
        <BackBar title={t.league.title} onBack={back} />

        {!unlocked ? (
          <Card style={{ gap: 8, alignItems: 'center' }}>
            <Icon name="trophy" size={40} muted />
            <P style={{ color: colors.text, textAlign: 'center' }}>
              {t.league.locked}
            </P>
          </Card>
        ) : !leagueApi.live ? (
          <Card>
            <P>{t.league.noServer}</P>
          </Card>
        ) : (
          <>
            {welcome ? (
              <>
                <H1>{t.league.welcome}</H1>
                <Card style={{ gap: 8 }}>
                  <P style={{ color: colors.text }}>{t.league.welcomeText}</P>
                  <P>{t.league.welcomePrivacy}</P>
                </Card>
              </>
            ) : null}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.boards}>
              {BOARDS.map((b) => (
                <Pressable
                  key={b.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: board === b.id }}
                  onPress={() => setBoard(b.id)}
                  style={[styles.chip, { borderColor: b.color }, board === b.id && { backgroundColor: b.color }]}
                >
                  <Text style={[styles.chipText, board === b.id && styles.chipOn]}>{b.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {shown ? (
              <>
                <Card style={{ gap: 4 }}>
                  <View style={styles.head}>
                    <Icon name="trophy" size={28} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.place}>
                        {t.league.place(shown.me.rank, shown.players)}
                      </Text>
                      <Text style={styles.dim}>
                        {shown.me.alias} · {label}
                      </Text>
                    </View>
                    <Text style={styles.myScore}>{t.league.score(board === OVERALL, shown.me.score)}</Text>
                  </View>
                </Card>
                <Card style={{ gap: 2 }}>
                  {shown.top.map((e, i) => (
                    <Row key={`${e.alias}-${i}`} e={e} board={board} />
                  ))}
                  {/* outside the top: the player's own place below a gap */}
                  {!shown.top.some((e) => e.me) ? (
                    <>
                      <Text style={styles.gap}>…</Text>
                      <Row e={{ ...shown.me, me: true }} board={board} />
                    </>
                  ) : null}
                </Card>
              </>
            ) : busy ? (
              <Card>
                <P>{welcome && !standings ? t.league.placing : t.league.loading}</P>
              </Card>
            ) : null}

            {welcome ? <Button label={t.league.toMap} onPress={back} /> : null}
            <Button label={busy ? t.league.loading : t.league.refresh} variant="ghost" disabled={busy} onPress={() => load(board)} />
          </>
        )}

        {error ? (
          <Card style={{ borderColor: colors.bad }}>
            <P style={{ color: colors.bad }}>{error}</P>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16, gap: 12 },
  boards: { gap: 6 },
  chip: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 2, borderRadius: 20 },
  chipText: { color: colors.text, fontSize: 14, fontWeight: '800' },
  chipOn: { color: '#0B1116' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  place: { color: colors.text, fontSize: 20, fontWeight: '900' },
  dim: { color: colors.dim, fontSize: 13 },
  myScore: { color: colors.accent, fontSize: 18, fontWeight: '900' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 40,
    paddingHorizontal: 8,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  meRow: { backgroundColor: colors.panelHi },
  rank: { color: colors.dim, width: 32, fontSize: 15, fontWeight: '900' },
  alias: { flex: 1, color: colors.text, fontSize: 15 },
  score: { color: colors.text, fontSize: 15, fontWeight: '800' },
  me: { color: colors.accent, fontWeight: '900' },
  gap: { color: colors.dim, textAlign: 'center', fontSize: 15 },
});
