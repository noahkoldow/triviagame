import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BOSS_PASS,
  BOSS_REWARD,
  FINALE_ID,
  FINALE_PASS,
  FINALE_REWARD,
  areaName,
  bossQuestions,
  fightFrom,
  finaleQuestions,
  firewallReached,
  isCorrect,
  recordBoss,
  recordFinale,
  sectorOfArea,
  storyFacts,
  type Answer,
  type BossOutcome,
} from '@nexus/shared';
import { Morph } from '../../src/components/Morph';
import { QuestionView } from '../../src/components/QuestionView';
import { Button, Card, Chip, H1, P, Pill, tap } from '../../src/components/ui';
import { WIN, Window } from '../../src/components/Win';
import { pool } from '../../src/services/content';
import { setRecentlySpawned } from '../../src/state/session';
import { getState, update, useGame } from '../../src/state/store';
import { useStrings } from '../../src/strings';
import { colors } from '../../src/theme';

/** A firewall on a sector border, or (id `core`) the final duel against MORPH. */
export default function BossScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useStrings();
  const fw = useGame((p) => p.network.firewalls?.find((f) => f.id === id));
  const integrity = useGame((p) => p.integrity);
  const finaleOpen = useGame((p) => storyFacts(p, pool).finaleOpen);
  const isFinale = id === FINALE_ID;

  const closed = isFinale
    ? !finaleOpen
      ? t.boss.finaleClosed
      : null
    : !fw
      ? t.boss.noFirewall
      : fw.broken
        ? t.boss.alreadyBroken
        : !firewallReached(Object.values(getState().network.nodes), fw)
          ? t.boss.notReached
          : null;
  // decided once when the screen opens: winning breaks the firewall (or ends the finale) and
  // losing can drop integrity to 0, but the outcome of this fight must stay on screen
  const [reason] = useState(
    closed ?? (integrity === 0 ? t.boss.unstable : null),
  );

  if (reason) {
    return (
      <SafeAreaView style={styles.root}>
        <ScrollView contentContainerStyle={styles.body}>
          <Window title={isFinale ? t.boss.core : t.boss.firewall} icon="warn" onClose={() => router.back()}>
            <P>{reason}</P>
            <Button label={t.common.back} onPress={() => router.back()} />
          </Window>
        </ScrollView>
      </SafeAreaView>
    );
  }
  return <Fight fwId={isFinale ? undefined : id} />;
}

function Fight({ fwId }: { fwId?: string }) {
  const router = useRouter();
  const t = useStrings();
  const fw = useGame((p) => (fwId ? p.network.firewalls!.find((f) => f.id === fwId) : undefined));
  const finaleAttempts = useGame((p) => p.story.finaleAttempts);
  const finale = !fwId;
  // the questions are fixed when the fight starts (a lost fight raises the attempt count)
  const attempt = useMemo(() => (fw ? fw.attempts : finaleAttempts), [fwId]); // eslint-disable-line react-hooks/exhaustive-deps
  const questions = useMemo(
    () =>
      fw
        ? bossQuestions(
            pool,
            { ...fw, attempts: attempt },
            getState().skill,
            fightFrom(pool, Object.values(getState().network.nodes), fw),
          )
        : finaleQuestions(pool, attempt, getState().skill),
    [fwId, attempt], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const pass = finale ? FINALE_PASS : BOSS_PASS;
  const reward = finale ? FINALE_REWARD : BOSS_REWARD;
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [checked, setChecked] = useState(false);
  const [right, setRight] = useState(0);
  const [marks, setMarks] = useState<boolean[]>([]);
  const [outcome, setOutcome] = useState<BossOutcome | null>(null);

  const q = questions[i];
  const sector = q ? sectorOfArea(q.area) : fw ? sectorOfArea(fw.area) : 'science';
  const title = fw ? t.boss.title(areaName(fw.area, t.lang)) : t.boss.coreTitle;

  const check = () => {
    if (!q || !answer) return;
    const ok = isCorrect(q, answer);
    tap(ok ? 'success' : 'error');
    setChecked(true);
    setMarks([...marks, ok]);
    if (ok) setRight(right + 1);
  };

  const next = () => {
    if (i + 1 < questions.length) {
      setI(i + 1);
      setAnswer(null);
      setChecked(false);
      return;
    }
    const r: BossOutcome = fwId
      ? recordBoss(getState(), pool, fwId, right)
      : { ...recordFinale(getState(), pool, right), spawned: [], areas: [] };
    update(() => r.player);
    if (r.passed) setRecentlySpawned(r.spawned);
    tap(r.passed ? 'success' : 'error');
    setOutcome(r);
  };

  if (outcome) {
    const g = getState();
    return (
      <SafeAreaView style={styles.root}>
        <ScrollView contentContainerStyle={styles.body}>
          <Window
            title={outcome.passed ? (finale ? t.boss.beaten : t.boss.broken) : finale ? t.boss.morphHolds : t.boss.wallHolds}
            icon={outcome.passed ? 'check' : 'warn'}
            onClose={() => router.back()}
          >
            {outcome.passed ? (
              <>
                <H1>{t.boss.through}</H1>
                <P style={{ color: colors.text }}>
                  {finale
                    ? t.boss.finaleWon(right, questions.length)
                    : t.boss.wallWon(right, questions.length, areaName(fw!.area, t.lang))}
                </P>
                <View style={styles.row}>
                  <Chip label={`+${reward.xp} XP`} color={colors.accent} />
                  <Chip icon="bit" label={`+${reward.bits}`} color={colors.bit} />
                  <Chip icon="gem" label={`+${reward.gems}`} color={colors.gem} />
                </View>
                {outcome.areas.map((a) => (
                  <Card key={a} style={{ borderColor: colors.primary }}>
                    <P style={{ color: colors.primary }}>{t.common.newArea(areaName(a, t.lang))}</P>
                  </Card>
                ))}
              </>
            ) : (
              <>
                <View style={{ alignItems: 'center' }}>
                  <Morph size={90} form="crown" />
                </View>
                <H1>{t.boss.notEnough}</H1>
                <P style={{ color: colors.text }}>
                  {t.boss.lost(right, questions.length, pass, finale, g.integrity)}
                </P>
              </>
            )}
            {finale && outcome.passed ? (
              // the network is about to show what it really is
              <Button label={t.common.next} onPress={() => router.replace('/brain')} />
            ) : (
              <Button label={t.boss.toMap} onPress={() => router.back()} />
            )}
          </Window>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!q) {
    return (
      <SafeAreaView style={styles.root}>
        <ScrollView contentContainerStyle={styles.body}>
          <Window title={finale ? t.boss.core : t.boss.firewall} icon="warn" onClose={() => router.back()}>
            <P>{t.boss.tooFew}</P>
            <Button label={t.common.back} onPress={() => router.back()} />
          </Window>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const isLast = i + 1 === questions.length;
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Window title={title} icon="warn" onClose={() => router.back()}>
          {/* progress as blocks, like an old copy dialog */}
          <View style={styles.segments} accessible accessibilityLabel={t.boss.progressA11y(i + 1, questions.length)}>
            {questions.map((_, k) => (
              <View
                key={k}
                style={[
                  styles.segment,
                  k < marks.length && { backgroundColor: marks[k] ? colors.primary : colors.bad },
                  k === i && marks.length === i && { backgroundColor: WIN.titleB },
                ]}
              />
            ))}
          </View>
          <View style={styles.row}>
            <Pill label={t.sectorsShort[sector]} color={colors.sector[sector]} />
            <Pill label={areaName(q.area, t.lang)} color={colors.dim} />
            <Pill label={t.boss.needed(right, pass)} color={colors.warn} />
          </View>
          {i === 0 && !checked ? (
            <View style={styles.intro}>
              {finale ? <Morph size={56} form="crown" /> : null}
              <P style={{ color: colors.dim, flex: 1 }}>
                {finale
                  ? t.boss.finaleIntro(pass)
                  : t.boss.wallIntro}
              </P>
            </View>
          ) : null}

          <Text style={styles.stem} maxFontSizeMultiplier={1.4}>
            {q.stem}
          </Text>

          <QuestionView key={`${i}-${attempt}`} q={q} variant={attempt} reveal={checked} onChange={setAnswer} />

          {checked ? (
            <Card>
              <P style={{ color: colors.text }}>{q.explanation}</P>
            </Card>
          ) : null}

          {!checked ? (
            <Button label={t.boss.answer} disabled={answer === null} onPress={check} />
          ) : (
            <Button label={isLast ? t.boss.result : t.boss.nextQuestion} onPress={next} />
          )}
        </Window>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#008080' },
  body: { padding: 12 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  intro: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  segments: { flexDirection: 'row', gap: 3 },
  segment: { flex: 1, height: 12, backgroundColor: '#1A2430' },
  stem: { color: colors.text, fontSize: 20, fontWeight: '800', lineHeight: 28 },
});
