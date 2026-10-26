import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BOSS_REWARD,
  FIREWALL_HP,
  FIREWALL_ROUNDS,
  FINALE_AREA_NODES,
  FINALE_AREAS,
  FINALE_ID,
  FINALE_PHASE_PASS,
  FINALE_PHASE_QUESTIONS,
  FINALE_REWARD,
  GUARDIANS,
  areaName,
  bossQuestions,
  fightClock,
  fightFrom,
  finalePhaseLine,
  finalePhaseState,
  finalePhases,
  firewallReached,
  guardianFightLine,
  isCorrect,
  isSynapseId,
  networkBonus,
  pushedBack,
  recordBoss,
  recordFinale,
  recordSynapse,
  SYNAPSE_PASS,
  SYNAPSE_REWARD,
  synapsePair,
  synapseQuestions,
  synapseSpots,
  sectorOfArea,
  startWallFight,
  storyFacts,
  SECTORS,
  strikeWall,
  timeOutWall,
  wallQuota,
  wallQuotaLeft,
  answeredNodes,
  wallAlly,
  wallFightState,
  wallVoices,
  type Answer,
  type BossOutcome,
  type FinalePhase,
  type GuardianId,
  type WallFight,
  type WallHit,
} from '@nexus/shared';
import { Bolt, type Mood } from '../../src/components/Bolt';
import { CacheExplorer } from '../../src/components/CacheExplorer';
import { ClockBar, formatClock, useFightClock, useScreenReader } from '../../src/components/FightClock';
import { FirewallScene } from '../../src/components/FirewallScene';
import { Guardian } from '../../src/components/Guardian';
import { Morph, type MorphForm } from '../../src/components/Morph';
import { QuestionView } from '../../src/components/QuestionView';
import { Button, Card, Check, Chip, H1, P, Pill, tap } from '../../src/components/ui';
import { WIN, Window } from '../../src/components/Win';
import { pool } from '../../src/services/content';
import { structureView } from '../../src/state/folders';
import { setRecentlySpawned } from '../../src/state/session';
import { getState, today, update, useGame } from '../../src/state/store';
import { useStrings } from '../../src/strings';
import { colors } from '../../src/theme';

/**
 * A firewall (`fw-<area>`), a synapse probe (`syn-<a>-<b>`, questions already solved in two
 * related areas) or (id `core`) the final duel against morph.ai.
 */
export default function BossScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useStrings();
  const fw = useGame((p) => p.network.firewalls?.find((f) => f.id === id));
  const integrity = useGame((p) => p.integrity);
  const finaleOpen = useGame((p) => storyFacts(p, pool).finaleOpen);
  const isFinale = id === FINALE_ID;
  const isSynapse = isSynapseId(id);

  const closed = isSynapse
    ? synapseSpots(getState(), pool, today()).some((x) => x.id === id && !x.resting)
      ? null
      : t.boss.synapseClosed
    : isFinale
    ? !finaleOpen
      ? t.boss.finaleClosed
      : null
    : !fw
      ? t.boss.noFirewall
      : fw.broken
        ? t.boss.alreadyBroken
        : !firewallReached(Object.values(getState().network.nodes), fw)
          ? t.boss.notReached
          : wallQuotaLeft(Object.values(getState().network.nodes), getState().network.firewalls) > 0
            ? t.boss.wallQuota(answeredNodes(Object.values(getState().network.nodes)).length, wallQuota(getState().network.firewalls))
            : pushedBack(getState().network.nodes, fw).length > 0
              ? t.boss.pushedBack(pushedBack(getState().network.nodes, fw).length)
              : null;
  // decided once when the screen opens: winning breaks the firewall (or ends the finale) and
  // losing can drop integrity to 0, but the outcome of this fight must stay on screen
  const [reason] = useState(
    // a probe only asks what the player already knows; it needs no stable network
    closed ?? (integrity === 0 && !isSynapse ? t.boss.unstable : null),
  );

  if (reason) {
    return (
      <SafeAreaView style={styles.root}>
        <ScrollView contentContainerStyle={styles.body}>
          <Window title={isSynapse ? t.boss.synapse : isFinale ? t.boss.core : t.boss.firewall} icon="warn" onClose={() => router.back()}>
            <P>{reason}</P>
            {isFinale && reason === t.boss.finaleClosed ? <FinaleChecks /> : null}
            <Button label={t.common.back} onPress={() => router.back()} />
          </Window>
        </ScrollView>
      </SafeAreaView>
    );
  }
  if (isSynapse) return <Fight synId={id} />;
  if (!isFinale) return <WallFightView fwId={id} />;
  return <FinaleFight />;
}

/** Picks one of a few lines, so the same event does not always say the same thing. */
const pick = (lines: readonly string[], n: number) => lines[n % lines.length]!;

/**
 * A firewall as a boss fight: the wall has `FIREWALL_HP` layers, every right answer tears one
 * down, every wrong one lets morph.ai rebuild one. The fight ends with the wall down, when fewer
 * questions are left than layers stand (`wallFightState`), or when its one clock runs out (D71).
 * The guardian of the sector, once awake, fights beside Bolt and reacts to every answer.
 */
/** What the finale still needs, as counters: starting nodes, guardians, firewalls won in a fight, areas (D75, D76). */
function FinaleChecks() {
  const t = useStrings();
  const f = useGame((p) => storyFacts(p, pool));
  const all = SECTORS.length;
  const rows: [string, number, number][] = [
    [t.boss.finaleRoots, f.roots, all],
    [t.boss.finaleGuardians, f.awake.length, all],
    [t.boss.finaleWalls, f.broken, all],
    [t.boss.finaleAreas(FINALE_AREA_NODES), f.areasReady, FINALE_AREAS],
  ];
  return (
    <View style={{ gap: 6 }}>
      {rows.map(([label, n, need]) => (
        <Check key={label} label={label} done={n >= need} value={`${Math.min(n, need)} / ${need}`} />
      ))}
    </View>
  );
}

function WallFightView({ fwId }: { fwId: string }) {
  const router = useRouter();
  const t = useStrings();
  const { width } = useWindowDimensions();
  const fw = useGame((p) => p.network.firewalls!.find((f) => f.id === fwId))!;
  // the questions are fixed when the fight starts (a lost fight raises the attempt count)
  const attempt = useMemo(() => fw.attempts, [fwId]); // eslint-disable-line react-hooks/exhaustive-deps
  const questions = useMemo(
    () => bossQuestions(pool, { ...fw, attempts: attempt }, getState().skill, fightFrom(pool, Object.values(getState().network.nodes), fw)),
    [fwId, attempt], // eslint-disable-line react-hooks/exhaustive-deps
  );
  // before the first question morph.ai taunts and the guardian of the sector (or Bolt) answers
  const voices = useMemo(() => wallVoices(getState(), pool, fw.area), [fwId]); // eslint-disable-line react-hooks/exhaustive-deps
  const ally = useMemo(() => wallAlly(getState(), pool, fw.area), [fwId]); // eslint-disable-line react-hooks/exhaustive-deps
  const [fight, setFight] = useState<WallFight>(() => startWallFight(Math.min(FIREWALL_ROUNDS, questions.length)));
  const [hit, setHit] = useState<{ kind: WallHit; seq: number } | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [checked, setChecked] = useState(false);
  const [outcome, setOutcome] = useState<BossOutcome | null>(null);
  // one clock for the whole fight; it starts with the first question and pauses while an answer is shown
  const [started, setStarted] = useState(false);
  const screenReader = useScreenReader();
  const total = useMemo(() => fightClock(questions.slice(0, FIREWALL_ROUNDS), screenReader), [questions, screenReader]);

  // while an answer is shown, its question stays on screen
  const i = fight.log.length - (checked ? 1 : 0);
  const q = questions[i];
  const state = wallFightState(fight);
  const right = fight.log.filter((x) => x).length;
  const sceneW = Math.min(width - 24, 480) - 28;
  const left = useFightClock(total, started && !checked && state === 'on', () => {
    tap('error');
    setFight((f) => timeOutWall(f));
  });

  const check = () => {
    if (!q || !answer) return;
    const ok = isCorrect(q, answer);
    const r = strikeWall(fight, ok);
    tap(ok ? 'success' : 'error');
    setFight(r.fight);
    setHit({ kind: r.hit, seq: r.fight.log.length });
    setChecked(true);
  };

  const next = () => {
    if (state === 'on') {
      setAnswer(null);
      setChecked(false);
      return;
    }
    const r = recordBoss(getState(), pool, fwId, state === 'won', today(), fight.hp);
    update(() => r.player);
    // back on the map the camera shows the new nodes, or those morph.ai damaged
    if (r.passed) setRecentlySpawned(r.spawned);
    else if (r.damaged?.length) setRecentlySpawned(r.damaged);
    setOutcome(r);
  };

  if (questions.length < FIREWALL_HP) {
    return (
      <SafeAreaView style={styles.root}>
        <ScrollView contentContainerStyle={styles.body}>
          <Window title={t.boss.firewall} icon="warn" onClose={() => router.back()}>
            <P>{t.boss.tooFew}</P>
            <Button label={t.common.back} onPress={() => router.back()} />
          </Window>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (outcome) {
    return (
      <SafeAreaView style={styles.root}>
        <ScrollView contentContainerStyle={styles.body}>
          <Window
            title={outcome.passed ? t.boss.broken : t.boss.wallHolds}
            icon={outcome.passed ? 'check' : 'warn'}
            onClose={() => router.back()}
          >
            {outcome.passed ? (
              <>
                <H1>{t.boss.through}</H1>
                <P style={{ color: colors.text }}>{t.boss.wallWon(right, fight.log.length, areaName(fw.area, t.lang))}</P>
                <View style={styles.row}>
                  <Chip label={`+${BOSS_REWARD.xp} XP`} color={colors.accent} />
                  <Chip icon="bit" label={`+${BOSS_REWARD.bits}`} color={colors.bit} />
                  <Chip icon="gem" label={`+${BOSS_REWARD.gems}`} color={colors.gem} />
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
                <H1>{fight.timeUp ? t.boss.timeUp : t.boss.notEnough}</H1>
                <P style={{ color: colors.text }}>
                  {fight.timeUp ? t.boss.wallTimeUp(fight.hp, getState().integrity) : t.boss.wallLost(fight.hp, getState().integrity)}
                </P>
                {outcome.damaged?.length ? (
                  <Card style={{ borderColor: colors.bad }}>
                    <P style={{ color: colors.bad }}>{t.boss.pushBack(outcome.damaged.length)}</P>
                  </Card>
                ) : null}
              </>
            )}
            <Button label={t.boss.toMap} onPress={() => router.back()} />
          </Window>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // who speaks after an answer: on a hit the guardian (or Bolt while it sleeps), on a miss
  // morph.ai and then the guardian it struck; and how they look
  const seq = hit?.seq ?? 0;
  const lines: { who: 'morph' | 'bolt' | GuardianId; text: string }[] = [];
  if (fight.timeUp) {
    lines.push({ who: 'morph', text: t.boss.timeUpMorph });
  } else if (checked && (hit?.kind === 'crack' || hit?.kind === 'breach')) {
    const k = hit.kind;
    lines.push(
      ally
        ? { who: ally.who, text: guardianFightLine(t.lang, ally.who, k === 'breach' ? 'breach' : 'hit', seq) }
        : { who: 'bolt', text: k === 'breach' ? t.boss.breach : pick(t.boss.crack, seq) },
    );
    if (k === 'crack' && fight.hp === 1) lines.push({ who: 'morph', text: t.boss.morphLow });
  } else if (checked) {
    lines.push({ who: 'morph', text: hit?.kind === 'repair' ? pick(t.boss.repair, seq) : pick(t.boss.hold, seq) });
    if (ally) lines.push({ who: ally.who, text: guardianFightLine(t.lang, ally.who, 'hurt', seq) });
  }
  const sectorColor = colors.sector[sectorOfArea(fw.area)];
  const speaker = (who: (typeof lines)[number]['who']) =>
    who === 'morph'
      ? { name: t.speakers.morph, color: MORPH_PINK }
      : who === 'bolt'
        ? { name: t.speakers.bolt, color: colors.accent }
        : { name: ally!.name, color: sectorColor };
  const struck = checked && (hit?.kind === 'crack' || hit?.kind === 'breach');
  const morphForm: MorphForm = fight.hp <= 1 || struck ? 'glitch' : fight.hp === FIREWALL_HP ? 'crown' : 'glasses';
  const boltMood: Mood = fight.timeUp ? 'worried' : !checked ? 'think' : hit?.kind === 'breach' ? 'proud' : struck ? 'happy' : 'worried';
  const roundsLeft = fight.rounds - fight.log.length;
  const area = q?.area ?? fw.area;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Window title={t.boss.title(areaName(fw.area, t.lang))} icon="warn" onClose={() => router.back()}>
          {/* the boss's life: one block per layer */}
          <View style={styles.hpRow} accessible accessibilityLabel={t.boss.sceneA11y(fight.hp, FIREWALL_HP)}>
            <Text style={styles.hpLabel}>{t.boss.layers(fight.hp, FIREWALL_HP)}</Text>
            <View style={[styles.segments, { flex: 1 }]}>
              {Array.from({ length: FIREWALL_HP }, (_, k) => (
                <View key={k} style={[styles.segment, k < fight.hp && { backgroundColor: WALL_RED }]} />
              ))}
            </View>
          </View>
          <FirewallScene
            width={sceneW}
            hp={fight.hp}
            max={FIREWALL_HP}
            hit={hit}
            color={sectorColor}
            morphForm={morphForm}
            boltMood={boltMood}
            guardian={ally?.who}
            label={t.boss.sceneA11y(fight.hp, FIREWALL_HP)}
          />
          {!started ? (
            // before the clock starts: morph.ai taunts, the guardian (or Bolt) answers, the rules
            <>
              <View style={styles.intro}>
                <Text style={[styles.speaker, { color: MORPH_PINK }]}>{t.speakers.morph}</Text>
                <P style={{ color: colors.text, flex: 1 }}>{voices.morph}</P>
              </View>
              <View style={styles.intro}>
                {voices.ally.who === 'bolt' ? <Bolt size={44} mood="proud" /> : <Guardian who={voices.ally.who} size={44} />}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.speaker, { color: voices.ally.who === 'bolt' ? colors.accent : sectorColor }]}>
                    {voices.ally.name}
                  </Text>
                  <P style={{ color: colors.text }}>{voices.ally.text}</P>
                </View>
              </View>
              <P style={{ color: colors.dim }}>{t.boss.wallRules}</P>
              <P style={{ color: colors.warn }}>{t.boss.clockRules(formatClock(total))}</P>
              <Button label={t.boss.start} onPress={() => setStarted(true)} />
            </>
          ) : (
            <>
              <ClockBar left={left} total={total} />
              <View style={styles.row}>
                <Pill label={areaName(area, t.lang)} color={colors.sector[sectorOfArea(area)]} />
                <Pill label={t.boss.roundsLeft(roundsLeft)} color={roundsLeft <= fight.hp ? colors.bad : colors.dim} />
              </View>
            </>
          )}
          {lines.map((l, k) => (
            <View key={k} style={styles.intro}>
              <Text style={[styles.speaker, { color: speaker(l.who).color }]}>{speaker(l.who).name}</Text>
              <P style={{ color: colors.text, flex: 1 }}>{l.text}</P>
            </View>
          ))}

          {started && q ? (
            <>
              <Text style={styles.stem} maxFontSizeMultiplier={1.4}>
                {q.stem}
              </Text>
              <QuestionView key={`${i}-${attempt}`} q={q} variant={attempt} reveal={checked} onChange={setAnswer} />
              {checked ? (
                <Card>
                  <P style={{ color: colors.text }}>{q.explanation}</P>
                </Card>
              ) : null}
            </>
          ) : null}

          {!started ? null : !checked && state === 'on' ? (
            <Button label={t.boss.attack} disabled={answer === null} onPress={check} />
          ) : (
            <Button label={state === 'on' ? t.boss.nextQuestion : t.boss.result} onPress={next} />
          )}
        </Window>
      </ScrollView>
    </SafeAreaView>
  );
}

/** A synapse probe: questions already solved in two related areas, asked from memory without a clock. */
function Fight({ synId }: { synId: string }) {
  const router = useRouter();
  const t = useStrings();
  const pair = synapsePair(synId);
  // the questions are fixed when the probe starts (a lost probe raises the attempt count)
  const attempt = useMemo(() => getState().network.synapseTries?.[synId]?.attempts ?? 0, [synId]);
  const questions = useMemo(() => synapseQuestions(getState(), pool, synId), [synId]);
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [checked, setChecked] = useState(false);
  const [right, setRight] = useState(0);
  const [marks, setMarks] = useState<boolean[]>([]);
  const [outcome, setOutcome] = useState<BossOutcome | null>(null);

  const q = questions[i];
  const sector = q ? sectorOfArea(q.area) : 'science';
  const title = pair ? t.boss.synapseTitle(areaName(pair[0], t.lang), areaName(pair[1], t.lang)) : t.boss.synapse;

  const check = () => {
    if (!q || !answer) return;
    const ok = isCorrect(q, answer);
    tap(ok ? 'success' : 'error');
    setChecked(true);
    setMarks([...marks, ok]);
    if (ok) setRight(right + 1);
  };

  const finish = () => {
    const r: BossOutcome = { ...recordSynapse(getState(), pool, synId, right, today()), spawned: [], areas: [] };
    update(() => r.player);
    tap(r.passed ? 'success' : 'error');
    setOutcome(r);
  };

  const next = () => {
    if (i + 1 < questions.length) {
      setI(i + 1);
      setAnswer(null);
      setChecked(false);
      return;
    }
    finish();
  };

  if (outcome) {
    return (
      <SafeAreaView style={styles.root}>
        <ScrollView contentContainerStyle={styles.body}>
          <Window
            title={outcome.passed ? t.boss.synapseJoined : t.boss.synapseHolds}
            icon={outcome.passed ? 'check' : 'warn'}
            onClose={() => router.back()}
          >
            {outcome.passed ? (
              <>
                <H1>{t.boss.through}</H1>
                {pair ? (
                  <P style={{ color: colors.text }}>
                    {t.boss.synapseWon(
                      right,
                      questions.length,
                      areaName(pair[0], t.lang),
                      areaName(pair[1], t.lang),
                      Math.round(networkBonus(getState()) * 100),
                    )}
                  </P>
                ) : null}
                <Rewards reward={SYNAPSE_REWARD} />
              </>
            ) : (
              <>
                <View style={{ alignItems: 'center' }}>
                  <Bolt size={90} mood="think" />
                </View>
                <H1>{t.boss.notEnough}</H1>
                <P style={{ color: colors.text }}>{t.boss.synapseLost(right, questions.length, SYNAPSE_PASS)}</P>
              </>
            )}
            <Button label={t.boss.toMap} onPress={() => router.back()} />
          </Window>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!q) return <TooFew title={t.boss.synapse} />;

  const isLast = i + 1 === questions.length;
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Window title={title} icon="spark" onClose={() => router.back()}>
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
            <Pill label={t.boss.needed(right, SYNAPSE_PASS)} color={colors.warn} />
          </View>
          {i === 0 && !checked ? (
            <View style={styles.intro}>
              <Bolt size={56} mood="think" />
              <P style={{ color: colors.dim, flex: 1 }}>{t.boss.synapseIntro}</P>
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

function Rewards({ reward }: { reward: { xp: number; bits: number; gems: number } }) {
  return (
    <View style={styles.row}>
      <Chip label={`+${reward.xp} XP`} color={colors.accent} />
      <Chip icon="bit" label={`+${reward.bits}`} color={colors.bit} />
      <Chip icon="gem" label={`+${reward.gems}`} color={colors.gem} />
    </View>
  );
}

function TooFew({ title }: { title: string }) {
  const router = useRouter();
  const t = useStrings();
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.body}>
        <Window title={title} icon="warn" onClose={() => router.back()}>
          <P>{t.boss.tooFew}</P>
          <Button label={t.common.back} onPress={() => router.back()} />
        </Window>
      </ScrollView>
    </SafeAreaView>
  );
}

/** morph.ai changes its face from phase to phase of the final duel. */
const PHASE_FORMS: MorphForm[] = ['smile', 'glasses', 'crown', 'glitch'];

/**
 * The final duel against morph.ai (D76): four phases, one per sector, each with its own clock
 * and shield. A lost phase ends the duel; the next one brings new questions.
 */
function FinaleFight() {
  const router = useRouter();
  const t = useStrings();
  // the questions are fixed when the duel starts (a lost duel raises the attempt count)
  const attempt = useMemo(() => getState().story.finaleAttempts, []);
  const phases = useMemo(() => finalePhases(pool, attempt, getState().skill, getState().archive), [attempt]);
  const [n, setN] = useState(0);
  const [score, setScore] = useState({ right: 0, asked: 0 });
  const [outcome, setOutcome] = useState<{ passed: boolean; timeUp: boolean } | null>(null);

  const phaseDone = (log: boolean[], timeUp: boolean) => {
    setScore((x) => ({ right: x.right + log.filter((ok) => ok).length, asked: x.asked + log.length }));
    const won = finalePhaseState(log, timeUp) === 'won';
    if (won && n + 1 < phases.length) {
      setN(n + 1);
      return;
    }
    const r = recordFinale(getState(), pool, won ? phases.length : n);
    update(() => r.player);
    tap(r.passed ? 'success' : 'error');
    setOutcome({ passed: r.passed, timeUp });
  };

  if (phases.some((ph) => ph.questions.length < FINALE_PHASE_QUESTIONS)) return <TooFew title={t.boss.core} />;

  if (outcome) {
    const sector = t.sectorsShort[phases[n]!.sector];
    return (
      <SafeAreaView style={styles.root}>
        <ScrollView contentContainerStyle={styles.body}>
          <Window
            title={outcome.passed ? t.boss.beaten : t.boss.morphHolds}
            icon={outcome.passed ? 'check' : 'warn'}
            onClose={() => router.back()}
          >
            {outcome.passed ? (
              <>
                <H1>{t.boss.through}</H1>
                <P style={{ color: colors.text }}>{t.boss.finaleWon(score.right, score.asked)}</P>
                <Rewards reward={FINALE_REWARD} />
                {/* the network is about to show what it really is */}
                <Button label={t.common.next} onPress={() => router.replace('/brain')} />
              </>
            ) : (
              <>
                <View style={{ alignItems: 'center' }}>
                  <Morph size={90} form={PHASE_FORMS[n]} />
                </View>
                <H1>{outcome.timeUp ? t.boss.timeUp : t.boss.notEnough}</H1>
                <P style={{ color: colors.text }}>
                  {outcome.timeUp
                    ? t.boss.finaleTimeUp(n + 1, sector, getState().integrity)
                    : t.boss.finaleLost(n + 1, sector, getState().integrity)}
                </P>
                <Button label={t.boss.toMap} onPress={() => router.back()} />
              </>
            )}
          </Window>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return <FinalePhaseView key={n} phase={phases[n]!} n={n} count={phases.length} attempt={attempt} onDone={phaseDone} />;
}

/**
 * One phase of the final duel: morph.ai in its form for the phase, the sector's guardian beside
 * Bolt, a shield of `FINALE_PHASE_PASS` layers and a clock of its own. The folder structure
 * opens without energy, but the clock runs on while the player searches it.
 */
function FinalePhaseView({
  phase,
  n,
  count,
  attempt,
  onDone,
}: {
  phase: FinalePhase;
  n: number;
  count: number;
  attempt: number;
  onDone: (log: boolean[], timeUp: boolean) => void;
}) {
  const t = useStrings();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const screenReader = useScreenReader();
  const total = useMemo(() => fightClock(phase.questions, screenReader), [phase, screenReader]);
  const structure = useMemo(() => structureView(getState()), []);
  const ally = GUARDIANS[phase.sector];
  const [started, setStarted] = useState(false);
  const [log, setLog] = useState<boolean[]>([]);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [checked, setChecked] = useState(false);
  const [hit, setHit] = useState<{ kind: WallHit; seq: number } | null>(null);
  const [foldersOpen, setFoldersOpen] = useState(false);

  const state = finalePhaseState(log);
  // while an answer is shown, its question stays on screen
  const i = log.length - (checked ? 1 : 0);
  const q = phase.questions[i];
  const hp = Math.max(0, FINALE_PHASE_PASS - log.filter((ok) => ok).length);
  const sceneW = Math.min(width - 24, 480) - 28;
  // the clock keeps running while the folder structure is open
  const left = useFightClock(total, started && !checked && state === 'on', () => {
    tap('error');
    setFoldersOpen(false);
    onDone(log, true);
  });

  const check = () => {
    if (!q || !answer) return;
    const ok = isCorrect(q, answer);
    tap(ok ? 'success' : 'error');
    setLog([...log, ok]);
    setHit({ kind: ok ? (hp === 1 ? 'breach' : 'crack') : 'hold', seq: log.length + 1 });
    setChecked(true);
  };

  const next = () => {
    if (state === 'on') {
      setAnswer(null);
      setChecked(false);
      return;
    }
    onDone(log, false);
  };

  // after an answer: on a hit the guardian speaks, on a miss morph.ai and then the guardian it struck
  const seq = hit?.seq ?? 0;
  const struck = checked && (hit?.kind === 'crack' || hit?.kind === 'breach');
  const lines: { who: 'morph' | 'ally'; text: string }[] = [];
  if (struck) {
    const breach = hit?.kind === 'breach';
    lines.push({ who: 'ally', text: guardianFightLine(t.lang, ally.id, breach ? 'breach' : 'hit', seq) });
    lines.push({ who: 'morph', text: breach ? t.boss.phaseBroken : t.boss.morphLow });
  } else if (checked) {
    lines.push({ who: 'morph', text: pick(t.boss.hold, seq) });
    lines.push({ who: 'ally', text: guardianFightLine(t.lang, ally.id, 'hurt', seq) });
  }
  const sectorColor = colors.sector[phase.sector];
  const sector = t.sectorsShort[phase.sector];
  const speaker = (who: 'morph' | 'ally') =>
    who === 'morph' ? { name: t.speakers.morph, color: MORPH_PINK } : { name: ally.name, color: sectorColor };
  const morphForm: MorphForm = struck ? 'glitch' : PHASE_FORMS[n]!;
  const boltMood: Mood = !checked ? 'think' : hit?.kind === 'breach' ? 'proud' : struck ? 'happy' : 'worried';
  const filed = !!q && phase.filed.includes(q.id);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Window title={t.boss.coreTitle} icon="warn" onClose={() => router.back()}>
          {/* the phases as blocks, then the shield of this one */}
          <View style={styles.segments} accessible accessibilityLabel={t.boss.phase(n + 1, count, sector)}>
            {Array.from({ length: count }, (_, k) => (
              <View
                key={k}
                style={[styles.segment, k < n && { backgroundColor: colors.primary }, k === n && { backgroundColor: WIN.titleB }]}
              />
            ))}
          </View>
          <View style={styles.row}>
            <Pill label={t.boss.phase(n + 1, count, sector)} color={sectorColor} />
          </View>
          <View style={styles.hpRow} accessible accessibilityLabel={t.boss.shieldA11y(hp, FINALE_PHASE_PASS)}>
            <Text style={styles.hpLabel}>{t.boss.shield(hp, FINALE_PHASE_PASS)}</Text>
            <View style={[styles.segments, { flex: 1 }]}>
              {Array.from({ length: FINALE_PHASE_PASS }, (_, k) => (
                <View key={k} style={[styles.segment, k < hp && { backgroundColor: MORPH_PINK }]} />
              ))}
            </View>
          </View>
          <FirewallScene
            width={sceneW}
            hp={hp}
            max={FINALE_PHASE_PASS}
            hit={hit}
            color={sectorColor}
            morphForm={morphForm}
            boltMood={boltMood}
            guardian={ally.id}
            label={t.boss.shieldA11y(hp, FINALE_PHASE_PASS)}
          />
          {!started ? (
            // before the clock starts: morph.ai's words for this sector and the rules
            <>
              <View style={styles.intro}>
                <Text style={[styles.speaker, { color: MORPH_PINK }]}>{t.speakers.morph}</Text>
                <P style={{ color: colors.text, flex: 1 }}>{finalePhaseLine(t.lang, phase.sector)}</P>
              </View>
              {n === 0 ? (
                <>
                  <P style={{ color: colors.dim }}>{t.boss.finaleIntro(count, FINALE_PHASE_QUESTIONS, FINALE_PHASE_PASS)}</P>
                  <P style={{ color: colors.dim }}>{t.boss.finaleFolders}</P>
                </>
              ) : null}
              <P style={{ color: colors.warn }}>{t.boss.phaseClock(formatClock(total))}</P>
              <Button label={n === 0 ? t.boss.start : t.boss.startPhase} onPress={() => setStarted(true)} />
            </>
          ) : (
            <ClockBar left={left} total={total} />
          )}
          {lines.map((l, k) => (
            <View key={k} style={styles.intro}>
              <Text style={[styles.speaker, { color: speaker(l.who).color }]}>{speaker(l.who).name}</Text>
              <P style={{ color: colors.text, flex: 1 }}>{l.text}</P>
            </View>
          ))}

          {started && q ? (
            <>
              <View style={styles.row}>
                <Pill label={areaName(q.area, t.lang)} color={colors.dim} />
              </View>
              <Text style={styles.stem} maxFontSizeMultiplier={1.4}>
                {q.stem}
              </Text>
              <QuestionView key={`${n}-${i}-${attempt}`} q={q} variant={attempt} reveal={checked} onChange={setAnswer} />
              {checked ? (
                <Card>
                  <P style={{ color: colors.text }}>{q.explanation}</P>
                </Card>
              ) : null}
            </>
          ) : null}

          {!started ? null : !checked && state === 'on' ? (
            <>
              {filed ? <P style={{ color: colors.primary }}>{t.boss.filedHint}</P> : null}
              <Button label={t.boss.attack} disabled={answer === null} onPress={check} />
              <Button
                label={t.boss.folders}
                icon="cache"
                variant="ghost"
                sub={structure.folders.length === 0 ? t.node.noFolders : t.boss.foldersSub}
                disabled={structure.folders.length === 0}
                onPress={() => setFoldersOpen(true)}
              />
            </>
          ) : (
            <Button
              label={state === 'on' ? t.boss.nextQuestion : state === 'won' && n + 1 < count ? t.boss.nextPhase : t.boss.result}
              onPress={next}
            />
          )}
        </Window>
      </ScrollView>

      {/* the folder structure, free in the duel; the clock behind it keeps running */}
      <Modal transparent animationType="fade" visible={foldersOpen} onRequestClose={() => setFoldersOpen(false)}>
        <View style={styles.modalBack}>
          <CacheExplorer folders={structure.folders} onClose={() => setFoldersOpen(false)} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const WALL_RED = '#D93645';
const MORPH_PINK = '#FF86D0';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#008080' },
  body: { padding: 12 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  intro: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  segments: { flexDirection: 'row', gap: 3 },
  segment: { flex: 1, height: 12, backgroundColor: '#1A2430' },
  stem: { color: colors.text, fontSize: 20, fontWeight: '800', lineHeight: 28 },
  hpRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  hpLabel: { color: WALL_RED, fontSize: 13, fontWeight: '900', letterSpacing: 0.6 },
  speaker: { fontSize: 13, fontWeight: '900' },
  modalBack: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
});
