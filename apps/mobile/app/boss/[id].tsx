import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BOSS_PASS,
  BOSS_QUESTIONS,
  areaById,
  bossQuestions,
  isCorrect,
  recordBoss,
  sectorOfArea,
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
import { de } from '../../src/strings';
import { colors } from '../../src/theme';

export default function BossScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const fw = useGame((p) => p.network.firewalls?.find((f) => f.id === id));
  const integrity = useGame((p) => p.integrity);

  if (!fw || fw.broken || integrity === 0) {
    return (
      <SafeAreaView style={styles.root}>
        <ScrollView contentContainerStyle={styles.body}>
          <Window title="Firewall" icon="warn" onClose={() => router.back()}>
            <P>
              {!fw
                ? 'Diese Firewall gibt es nicht.'
                : fw.broken
                  ? 'Diese Firewall ist bereits gebrochen.'
                  : 'Das Netz ist instabil. Repariere zuerst beschädigte Knoten.'}
            </P>
            <Button label="Zurück" onPress={() => router.back()} />
          </Window>
        </ScrollView>
      </SafeAreaView>
    );
  }
  return <Fight fwId={fw.id} />;
}

function Fight({ fwId }: { fwId: string }) {
  const router = useRouter();
  const fw = useGame((p) => p.network.firewalls!.find((f) => f.id === fwId)!);
  // the questions are fixed when the fight starts (a failed fight changes `attempts`)
  const attempt = useMemo(() => fw.attempts, [fwId]); // eslint-disable-line react-hooks/exhaustive-deps
  const questions = useMemo(
    () => bossQuestions(pool, { ...fw, attempts: attempt }, getState().skill),
    [fwId, attempt], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [checked, setChecked] = useState(false);
  const [right, setRight] = useState(0);
  const [marks, setMarks] = useState<boolean[]>([]);
  const [outcome, setOutcome] = useState<BossOutcome | null>(null);

  const q = questions[i];
  const sector = q ? sectorOfArea(q.area) : fw.a;

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
    const r = recordBoss(getState(), pool, fwId, right);
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
          <Window title={outcome.passed ? 'Firewall gebrochen' : 'Die Firewall hält'} icon={outcome.passed ? 'check' : 'warn'} onClose={() => router.back()}>
            {outcome.passed ? (
              <>
                <H1>Durch!</H1>
                <P style={{ color: colors.text }}>
                  {right} von {BOSS_QUESTIONS} richtig. Das Wissen aus beiden Sektoren hat gereicht. Dahinter öffnet sich eine neue Zone.
                </P>
                <View style={styles.row}>
                  <Chip label="+60 XP" color={colors.accent} />
                  <Chip icon="bit" label="+40" color={colors.bit} />
                  <Chip icon="gem" label="+3" color={colors.gem} />
                </View>
                {outcome.areas.map((a) => (
                  <Card key={a} style={{ borderColor: colors.primary }}>
                    <P style={{ color: colors.primary }}>Neuer Bereich verbunden: {areaById(a).de}</P>
                  </Card>
                ))}
              </>
            ) : (
              <>
                <View style={{ alignItems: 'center' }}>
                  <Morph size={90} />
                </View>
                <H1>Nicht genug.</H1>
                <P style={{ color: colors.text }}>
                  {right} von {BOSS_QUESTIONS} richtig, nötig waren {BOSS_PASS}. MORPH: „Hübsch versucht.“ Die Integrität sinkt um 1 (jetzt {g.integrity}). Beim nächsten Versuch kommen andere Fragen.
                </P>
              </>
            )}
            <Button label="Zurück zur Karte" onPress={() => router.back()} />
          </Window>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!q) {
    return (
      <SafeAreaView style={styles.root}>
        <ScrollView contentContainerStyle={styles.body}>
          <Window title="Firewall" icon="warn" onClose={() => router.back()}>
            <P>Für diese Firewall gibt es noch nicht genug Fragen.</P>
            <Button label="Zurück" onPress={() => router.back()} />
          </Window>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const isLast = i + 1 === questions.length;
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Window title={`Firewall: ${de.sectors[fw.a]} × ${de.sectors[fw.b]}`} icon="warn" onClose={() => router.back()}>
          {/* progress as blocks, like an old copy dialog */}
          <View style={styles.segments} accessible accessibilityLabel={`Frage ${i + 1} von ${questions.length}`}>
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
            <Pill label={de.sectors[sector]} color={colors.sector[sector]} />
            <Pill label={areaById(q.area).de} color={colors.dim} />
            <Pill label={`${right} / ${BOSS_PASS} nötig`} color={colors.warn} />
          </View>
          {i === 0 && !checked ? (
            <P style={{ color: colors.dim }}>MORPH: „Hier kommst du nicht durch. Es sei denn, du weißt wirklich etwas.“ Kein Cache, nur dein Wissen.</P>
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
            <Button label="Antworten" disabled={answer === null} onPress={check} />
          ) : (
            <Button label={isLast ? 'Ergebnis' : 'Weiter >'} onPress={next} />
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
  segments: { flexDirection: 'row', gap: 3 },
  segment: { flex: 1, height: 12, backgroundColor: '#1A2430' },
  stem: { color: colors.text, fontSize: 20, fontWeight: '800', lineHeight: 28 },
});
