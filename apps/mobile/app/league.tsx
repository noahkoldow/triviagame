import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LEAGUES, LEAGUE_DEMOTE, LEAGUE_GROUP, LEAGUE_PROMOTE, aliasOptions, aliasSeed, weekXp } from '@nexus/shared';
import { Icon } from '../src/components/Icon';
import { BackBar, Button, Card, H1, P, tap } from '../src/components/ui';
import { LeagueError, leagueApi, type Standings } from '../src/services/league';
import { getState, update, useGame } from '../src/state/store';
import { colors } from '../src/theme';

/** Days and hours until the week ends, e.g. "3 T 4 Std". */
function remaining(endsAt: number): string {
  const h = Math.max(0, Math.floor((endsAt - Date.now()) / 3_600_000));
  return h >= 24 ? `${Math.floor(h / 24)} T ${h % 24} Std` : `${h} Std`;
}

export default function League() {
  const router = useRouter();
  const league = useGame((p) => p.league);
  const xp = useGame((p) => p.xp);
  const joined = !!league.playerId && !!league.token;
  const [standings, setStandings] = useState<Standings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [round, setRound] = useState(0);
  const options = useMemo(() => aliasOptions(`${aliasSeed(getState())}:${round}`), [round]);
  const [picked, setPicked] = useState(0);
  const mine = weekXp({ ...getState(), xp, league });

  const sync = useCallback(async () => {
    const p = getState();
    if (!p.league.playerId || !p.league.token) return;
    setBusy(true);
    setError(null);
    try {
      setStandings(await leagueApi.sync({ playerId: p.league.playerId, token: p.league.token }, weekXp(p)));
    } catch (e) {
      if (e instanceof LeagueError && e.status === 401) {
        // the server no longer knows this player: start over
        update((s) => ({ ...s, league: { week: s.league.week, startXp: s.league.startXp } }));
        setError('Dein Liga-Zugang ist nicht mehr gültig. Du kannst neu beitreten.');
      } else {
        setError('Die Liga ist gerade nicht erreichbar. Versuch es später noch einmal.');
      }
    } finally {
      setBusy(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void sync();
    }, [sync]),
  );

  const join = async () => {
    const alias = options[picked]!;
    setBusy(true);
    setError(null);
    try {
      const c = await leagueApi.join(alias);
      update((p) => ({ ...p, league: { ...p.league, ...c, alias } }));
      tap('success');
    } catch {
      setError('Beitreten hat nicht geklappt. Versuch es später noch einmal.');
    } finally {
      setBusy(false);
    }
    await sync();
  };

  const leave = () =>
    Alert.alert(
      'Aus der Liga austreten?',
      'Dein Rufname und deine Wochen-XP werden vom Server gelöscht. Dein Spielstand bleibt.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Austreten',
          style: 'destructive',
          onPress: async () => {
            const p = getState();
            if (p.league.playerId && p.league.token) {
              await leagueApi.leave({ playerId: p.league.playerId, token: p.league.token }).catch(() => undefined);
            }
            update((s) => ({ ...s, league: { week: s.league.week, startXp: s.league.startXp } }));
            setStandings(null);
          },
        },
      ],
    );

  const size = standings?.members.length ?? 0;
  const zone = (rank: number) =>
    standings && rank <= standings.promote ? 'up' : standings && rank > size - standings.demote ? 'down' : null;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.body}>
        <BackBar title="Wochenliga" onBack={() => router.back()} />

        {!leagueApi.live ? (
          <Card>
            <P>Ohne Verbindung zum Server gibt es keine Liga. Das Spiel selbst läuft weiter.</P>
          </Card>
        ) : !joined ? (
          <>
            <H1>Jede Woche ein neues Ziel</H1>
            <Card style={{ gap: 8 }}>
              <P style={{ color: colors.text }}>
                Du trittst mit bis zu {LEAGUE_GROUP - 1} anderen in einer Gruppe an. Es zählen die XP, die du diese Woche
                sammelst. Die besten {LEAGUE_PROMOTE} steigen in die nächste Liga auf, die letzten {LEAGUE_DEMOTE} ab.
              </P>
              <P>Ligen: {LEAGUES.join(' › ')}</P>
              <P>
                Sichtbar sind nur dein Rufname und deine Wochen-XP. Dein Name und dein Alter bleiben auf dem Gerät. Du kannst
                jederzeit austreten, dann wird alles gelöscht.
              </P>
            </Card>
            <Text style={styles.section}>DEIN RUFNAME</Text>
            <Card style={{ gap: 4 }}>
              {options.map((o, i) => (
                <Pressable
                  key={o}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: picked === i }}
                  accessibilityLabel={o}
                  onPress={() => setPicked(i)}
                  style={styles.option}
                >
                  <View style={[styles.radio, picked === i && styles.radioOn]} />
                  <Text style={styles.optionText}>{o}</Text>
                </Pressable>
              ))}
              <Button
                label="Andere Vorschläge"
                variant="ghost"
                onPress={() => {
                  setRound(round + 1);
                  setPicked(0);
                }}
              />
            </Card>
            <Button label={busy ? 'Einen Moment …' : 'Mitmachen'} disabled={busy} onPress={join} />
          </>
        ) : (
          <>
            <Card style={{ gap: 4 }}>
              <View style={styles.head}>
                <Icon name="trophy" size={28} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.league}>{standings?.league ?? LEAGUES[0]}</Text>
                  <Text style={styles.dim}>
                    {league.alias}
                    {standings ? ` · endet in ${remaining(standings.endsAt)}` : ''}
                  </Text>
                </View>
                <Text style={styles.myXp} accessibilityLabel={`${mine} XP diese Woche`}>
                  {mine} XP
                </Text>
              </View>
            </Card>

            {standings ? (
              <Card style={{ gap: 2 }}>
                {standings.members.map((m, i) => {
                  const rank = i + 1;
                  const z = zone(rank);
                  return (
                    <View
                      key={`${m.alias}-${i}`}
                      accessible
                      accessibilityLabel={`Platz ${rank}, ${m.alias}${m.me ? ' (du)' : ''}, ${m.xp} XP${
                        z === 'up' ? ', Aufstiegszone' : z === 'down' ? ', Abstiegszone' : ''
                      }`}
                      style={[
                        styles.row,
                        z === 'up' && { borderLeftColor: colors.primary },
                        z === 'down' && { borderLeftColor: colors.bad },
                        m.me && styles.meRow,
                      ]}
                    >
                      <Text style={styles.rank}>{rank}</Text>
                      <Text style={[styles.alias, m.me && styles.me]} numberOfLines={1}>
                        {m.alias}
                        {m.me ? ' (du)' : ''}
                      </Text>
                      <Text style={[styles.xp, m.me && styles.me]}>{m.xp}</Text>
                    </View>
                  );
                })}
                <Text style={styles.dim}>
                  Grün: Aufstieg (Plätze 1–{standings.promote}).
                  {standings.demote > 0 ? ` Rot: Abstieg (die letzten ${standings.demote}).` : ' Abstieg erst ab 10 Teilnehmenden.'}
                </Text>
              </Card>
            ) : null}

            <Button label={busy ? 'Lädt …' : 'Aktualisieren'} variant="ghost" disabled={busy} onPress={sync} />
            <Button label="Aus der Liga austreten" variant="danger" onPress={leave} />
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
  section: { color: colors.dim, fontSize: 12, fontWeight: '900', letterSpacing: 1.2, marginTop: 6 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.dim },
  radioOn: { borderColor: colors.accent, backgroundColor: colors.accent },
  optionText: { color: colors.text, fontSize: 16, fontWeight: '700' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  league: { color: colors.text, fontSize: 20, fontWeight: '900' },
  dim: { color: colors.dim, fontSize: 13 },
  myXp: { color: colors.accent, fontSize: 18, fontWeight: '900' },
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
  rank: { color: colors.dim, width: 24, fontSize: 15, fontWeight: '900' },
  alias: { flex: 1, color: colors.text, fontSize: 15 },
  xp: { color: colors.text, fontSize: 15, fontWeight: '800' },
  me: { color: colors.accent, fontWeight: '900' },
});
