import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AREAS, OVERALL, SECTOR_COLOR, leagueUnlocked } from '@nexus/shared';
import { Icon } from '../src/components/Icon';
import { BackBar, Button, Card, H1, P } from '../src/components/ui';
import { leagueApi, type BoardEntry, type Standings } from '../src/services/league';
import { syncRanking } from '../src/state/ranking';
import { useGame } from '../src/state/store';
import { colors } from '../src/theme';

/** Overall by XP, then every area by solved nodes. */
const BOARDS = [
  { id: OVERALL, label: 'Gesamt', color: colors.accent },
  ...AREAS.map((a) => ({ id: a.id, label: a.de, color: SECTOR_COLOR[a.sector] })),
];
const MEDALS = ['#FFD23F', '#C0C0C0', '#CD7F32'];

const unit = (board: string, n: number) => (board === OVERALL ? `${n} XP` : `${n} gelöst`);

function Row({ e, board }: { e: BoardEntry; board: string }) {
  return (
    <View
      accessible
      accessibilityLabel={`Platz ${e.rank}, ${e.alias}${e.me ? ' (du)' : ''}, ${unit(board, e.score)}`}
      style={[styles.row, e.rank <= MEDALS.length && { borderLeftColor: MEDALS[e.rank - 1] }, e.me && styles.meRow]}
    >
      <Text style={styles.rank}>{e.rank}</Text>
      <Text style={[styles.alias, e.me && styles.me]} numberOfLines={1}>
        {e.alias}
        {e.me ? ' (du)' : ''}
      </Text>
      <Text style={[styles.score, e.me && styles.me]}>{e.score}</Text>
    </View>
  );
}

/** The ranking of everybody who plays (D57): overall and per area. */
export default function League() {
  const router = useRouter();
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
      setError('Die Rangliste ist gerade nicht erreichbar. Versuch es später noch einmal.');
    } finally {
      setBusy(false);
    }
  }, []);

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
        <BackBar title="Rangliste" onBack={back} />

        {!unlocked ? (
          <Card style={{ gap: 8, alignItems: 'center' }}>
            <Icon name="trophy" size={40} muted />
            <P style={{ color: colors.text, textAlign: 'center' }}>
              Die Rangliste öffnet sich, sobald du morph.ai im Kern besiegt hast. Bis dahin zählt nur eins: selbst denken.
            </P>
          </Card>
        ) : !leagueApi.live ? (
          <Card>
            <P>Ohne Verbindung zum Server gibt es keine Rangliste. Das Spiel selbst läuft weiter.</P>
          </Card>
        ) : (
          <>
            {welcome ? (
              <>
                <H1>Willkommen in der Rangliste</H1>
                <Card style={{ gap: 8 }}>
                  <P style={{ color: colors.text }}>
                    Hier steht jeder, der NEXUS spielt. Ihr messt euch insgesamt nach XP und in jedem Bereich nach gelösten
                    Knoten.
                  </P>
                  <P>Andere sehen nur deinen Rufnamen und deine Punkte. Dein Name und dein Alter bleiben auf dem Gerät.</P>
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
                        Platz {shown.me.rank} von {shown.players}
                      </Text>
                      <Text style={styles.dim}>
                        {shown.me.alias} · {label}
                      </Text>
                    </View>
                    <Text style={styles.myScore}>{unit(board, shown.me.score)}</Text>
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
                <P>{welcome && !standings ? 'Du wirst eingeordnet …' : 'Lädt …'}</P>
              </Card>
            ) : null}

            {welcome ? <Button label="Zur Karte" onPress={back} /> : null}
            <Button label={busy ? 'Lädt …' : 'Aktualisieren'} variant="ghost" disabled={busy} onPress={() => load(board)} />
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
