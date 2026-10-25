import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ALBUM_REWARD,
  VARIETY_BONUS,
  answerText,
  areaName,
  CACHE_FILES_PER_AREA,
  structureOpenCost,
  fragmentFiles,
  guardianLine,
  isCorrect,
  markStarterSeen,
  morphLine,
  recordCorrect,
  recordMaintenance,
  recordReviewResult,
  recordWrong,
  rewardedOffer,
  sectorOfArea,
  spendRewind,
  starterToPresent,
  type Answer,
  type GuardianId,
  type Reward,
} from '@nexus/shared';
import { Bolt } from '../../src/components/Bolt';
import { CacheExplorer } from '../../src/components/CacheExplorer';
import { CacheFiles } from '../../src/components/CacheFiles';
import { cacheItems, structureView } from '../../src/state/folders';
import { adBreak, watchRewarded } from '../../src/state/monetize';
import { Guardian } from '../../src/components/Guardian';
import { Icon } from '../../src/components/Icon';
import { WIN, pressedIn, raised, sunken } from '../../src/components/Win';
import { Morph } from '../../src/components/Morph';
import { QuestionView } from '../../src/components/QuestionView';
import { Button, Card, Chip, H1, P, Pill, tap } from '../../src/components/ui';
import { track } from '../../src/services/analytics';
import { pool } from '../../src/services/content';
import { clearHint, getHint, setDebrisReturn, setHint, setRecentlySpawned } from '../../src/state/session';
import { getState, today, update, useGame } from '../../src/state/store';
import { useStrings } from '../../src/strings';
import { colors } from '../../src/theme';

type Phase = 'question' | 'result';

export default function NodeScreen() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: string }>();
  const router = useRouter();
  const t = useStrings();
  const node = useGame((p) => p.network.nodes[id ?? '']);
  const energy = useGame((p) => p.energy);
  // the node's state when the screen opened: answering changes it (open → solved or damaged),
  // but the result must still be told as the kind of run it was
  const [startState] = useState(node?.state);
  // maintenance: a solved node answered again from memory, to win back integrity
  const maintain = mode === 'maintain' && startState === 'solved';

  if (!node || node.locked || (startState === 'solved' && !maintain)) {
    return (
      <SafeAreaView style={styles.root}>
        <Card>
          <P>{t.node.unavailable}</P>
          <Button label={t.common.back} onPress={() => router.back()} />
        </Card>
      </SafeAreaView>
    );
  }
  return <NodeGame nodeId={node.id} review={startState === 'damaged'} maintain={maintain} energy={energy} />;
}

function NodeGame({
  nodeId,
  review,
  maintain,
  energy,
}: {
  nodeId: string;
  review: boolean;
  maintain: boolean;
  energy: number;
}) {
  const router = useRouter();
  const t = useStrings();
  const area = (id: string) => areaName(id, t.lang);
  const node = useGame((p) => p.network.nodes[nodeId])!;
  const q = pool.get(node.questionId);
  const sector = sectorOfArea(q.area);
  const color = colors.sector[sector];

  const [phase, setPhase] = useState<Phase>('question');
  const [variant, setVariant] = useState(node.attempts);
  const cache = useGame((p) => p.cache);
  const archive = useGame((p) => p.archive);
  const [cacheOpen, setCacheOpen] = useState(false);
  const [rewindOpen, setRewindOpen] = useState(false);
  const [rewinds, setRewinds] = useState(0);
  const hint = getHint(nodeId);
  // what the player has entered so far (null until the answer is complete)
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [result, setResult] = useState<{
    correct: boolean;
    reward?: Reward;
    spawned?: string[];
    closedCircle?: boolean;
    prepared?: boolean;
    reachedWalls?: string[];
    /** What breadth added to the reward: synapses and varied answers. */
    bonus?: { network: number; variety: boolean };
    /** Collection albums this answer filled. */
    albums?: string[];
    gaveUp?: boolean;
    /** A repair before its day: children regrow, but no box, reward or integrity. */
    early?: boolean;
    guardian?: { who: GuardianId; name: string; text: string } | null;
    morph?: string;
    attempts: number;
    /** The starter pack became available with this answer (shown once outside the shop). */
    starter?: boolean;
  } | null>(null);
  const [adBusy, setAdBusy] = useState(false);

  // the cache files of this question's topic open for free; the whole folder structure costs energy
  const cached = useMemo(() => cacheItems(getState(), q.area), [cache, q.area]); // eslint-disable-line react-hooks/exhaustive-deps
  const structure = useMemo(() => structureView(getState()), [archive]); // eslint-disable-line react-hooks/exhaustive-deps
  const openCost = structureOpenCost(structure.folders.length);

  const check = (): boolean => (answer ? isCorrect(q, answer) : false);
  const canSubmit = answer !== null;

  const submit = async () => {
    const ok = check();
    const day = today();
    const seed = `${nodeId}:${node.attempts}:${getState().stats.correct + getState().stats.wrong}`;
    // a guardian comments only if they were awake before this answer (waking is its own moment)
    const guardian = ok ? guardianLine(getState(), pool, sector, seed) : null;
    const morph = ok ? undefined : morphLine(getState(), seed);
    if (maintain) {
      update((p) => recordMaintenance(p, pool, nodeId, ok, day));
      tap(ok ? 'success' : 'error');
      setResult({ correct: ok, attempts: 1, guardian, morph });
      setPhase('result');
      return;
    }
    if (review) {
      const r = recordReviewResult(getState(), pool, nodeId, ok, day);
      update(() => r.player);
      setRecentlySpawned(r.spawned);
      tap(ok ? 'success' : 'error');
      setResult({ correct: ok, reward: r.reward, spawned: r.spawned, early: !r.due, attempts: 1, guardian, morph });
      setPhase('result');
      return;
    }
    if (ok) {
      const r = recordCorrect(getState(), pool, nodeId, day, rewinds, answer ?? undefined);
      update(() => r.player);
      setRecentlySpawned(r.spawned);
      clearHint(nodeId);
      tap('success');
      const starter = starterToPresent(getState());
      if (starter) {
        update(markStarterSeen);
        track({ name: 'offer_shown', offer: 'starter' });
      }
      setResult({
        starter,
        correct: true,
        reward: r.reward,
        spawned: r.spawned,
        closedCircle: r.closedCircle,
        prepared: r.prepared,
        reachedWalls: r.reachedWalls,
        bonus: r.bonus,
        albums: r.albums,
        guardian,
        attempts: node.attempts + 1,
      });
      setPhase('result');
      return;
    }
    update((p) => recordWrong(p, pool, nodeId));
    tap('error');
    setResult({ correct: false, morph, attempts: getState().network.nodes[nodeId]!.attempts });
    setPhase('result');
    // no ad here: a wrong answer is part of learning; ads wait for the break (D55)
  };

  // the second chance after a wrong answer: a video, or at once with Plus; limited per day
  const second = rewardedOffer(getState(), 'secondChance', today(), Date.now());

  const watchForSecondChance = async () => {
    setAdBusy(true);
    const ok = await watchRewarded('secondChance');
    setAdBusy(false);
    if (!ok) return;
    const key = q.fragments.find((f) => f.kind === 'key');
    if (key) setHint(nodeId, key.text);
    tap('success');
    retry();
  };

  /** Back to the debris field on the map; a new attempt brings a new mix of fragments. */
  const retry = () => {
    setDebrisReturn(nodeId);
    router.back();
  };

  const rewind = () => {
    // paid once per question: reopening after closing is free
    if (rewinds > 0) {
      setRewindOpen(true);
      return;
    }
    if (!update((p) => spendRewind(p, Date.now(), openCost))) return;
    setRewinds(rewinds + 1);
    setRewindOpen(true);
  };

  /** Back to the map. Leaving a result is a natural break, where an interstitial may come (D55). */
  const leave = () => {
    router.back();
    if (phase === 'result') void adBreak();
  };

  // ------------------------------------------------------------------ UI
  const header = (
    <View style={styles.header}>
      <Pressable
        onPress={leave}
        accessibilityRole="button"
        accessibilityLabel={t.node.backA11y}
        hitSlop={12}
        style={({ pressed }) => [styles.close, raised, pressed && pressedIn]}
      >
        <Icon name="close" size={14} color={WIN.black} />
      </Pressable>
      <View style={styles.headerPills}>
        <Pill label={area(q.area)} color={color} />
        <Pill label={t.difficulty[q.difficulty]!} color={colors.warn} />
      </View>
    </View>
  );

  if (phase === 'question') {
    return (
      <SafeAreaView style={styles.root}>
        {header}
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.qTop}>
            <Bolt size={64} mood="think" />
            <View style={styles.lockRow}>
              <Icon name={maintain ? 'lock' : 'cache'} size={20} />
              <Text style={styles.lock}>
                {maintain
                  ? t.node.maintainLock
                  : t.node.cacheLock(cached.length, CACHE_FILES_PER_AREA, area(q.area))}
              </Text>
            </View>
          </View>
          <Card>
            <Text style={styles.stem}>{q.stem}</Text>
          </Card>
          {hint ? (
            <Card style={{ borderColor: colors.accent }}>
              <P style={{ color: colors.text }}>{t.node.boltHint(hint)}</P>
            </Card>
          ) : null}

          <QuestionView q={q} variant={variant} onChange={setAnswer} />

          <View style={{ gap: 8, marginTop: 4 }}>
            <Button label={t.node.check} disabled={!canSubmit} onPress={submit} />
            {maintain ? null : (
              <>
                <Button
                  label={t.node.openCache}
                  icon="cache"
                  variant="ghost"
                  sub={cached.length ? t.node.cacheFree : t.node.cacheEmpty}
                  disabled={cached.length === 0}
                  onPress={() => setCacheOpen(true)}
                />
                <Button
                  label={rewinds > 0 ? t.node.reopenFolders : t.node.openFolders}
                  icon="bolt"
                  variant="ghost"
                  sub={
                    structure.folders.length === 0
                      ? t.node.noFolders
                      : rewinds > 0
                        ? t.node.paid
                        : energy >= openCost
                          ? t.node.canPay(openCost, energy)
                          : t.node.cannotPay(openCost, energy)
                  }
                  disabled={structure.folders.length === 0 || (rewinds === 0 && energy < openCost)}
                  onPress={rewind}
                />
              </>
            )}
          </View>
        </ScrollView>

        <Modal transparent animationType="fade" visible={cacheOpen} onRequestClose={() => setCacheOpen(false)}>
          <View style={styles.modalBack}>
            <CacheFiles items={cached} openAll onClose={() => setCacheOpen(false)} />
          </View>
        </Modal>

        <Modal
          transparent
          animationType="fade"
          visible={rewindOpen}
          onRequestClose={() => setRewindOpen(false)}
        >
          <View style={styles.modalBack}>
            <CacheExplorer folders={structure.folders} onClose={() => setRewindOpen(false)} />
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // result
  const r = result!;
  const spawnedNodes = (r.spawned ?? [])
    .map((sid) => getState().network.nodes[sid]!)
    .filter(Boolean);

  if (maintain) {
    return (
      <SafeAreaView style={styles.root}>
        {header}
        <ScrollView contentContainerStyle={styles.body}>
          <View style={{ alignItems: 'center' }}>
            <Bolt size={100} mood={r.correct ? 'wow' : 'sad'} color={color} />
          </View>
          <H1 style={{ textAlign: 'center' }}>{r.correct ? t.node.maintained : t.node.shaky}</H1>
          <Card>
            <P style={{ color: colors.text }}>
              {r.correct
                ? t.node.maintainedText
                : t.node.maintainFailed(answerText(q, t.lang))}
            </P>
          </Card>
          <Card>
            <P style={{ color: colors.text }}>{q.explanation}</P>
          </Card>
          <Button label={t.common.backToMap} onPress={leave} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      {header}
      <ScrollView contentContainerStyle={styles.body}>
        <View style={{ alignItems: 'center' }}>
          {r.correct ? (
            <Bolt size={110} mood="wow" color={color} />
          ) : (
            <Morph size={96} form={getState().story.finale ? 'reformed' : 'glasses'} />
          )}
        </View>

        {r.correct ? (
          <>
            <H1 style={{ textAlign: 'center' }}>{review ? t.node.repaired : t.node.connected}</H1>
            <Card>
              <P style={{ color: colors.text }}>{q.explanation}</P>
            </Card>
            {r.guardian ? (
              <Card style={styles.voice}>
                <Guardian who={r.guardian.who} size={52} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.speaker, { color: color }]}>{r.guardian.name}</Text>
                  <P style={{ color: colors.text }}>{r.guardian.text}</P>
                </View>
              </Card>
            ) : null}
            {review && r.early ? (
              <Card style={{ borderColor: colors.warn }}>
                <P style={{ color: colors.warn }}>
                  {t.node.early}
                </P>
              </Card>
            ) : null}
            {r.reward && (r.reward.xp > 0 || r.reward.bits > 0) ? (
              <View style={styles.rewards}>
                <Chip label={`+${r.reward.xp} XP`} color={colors.accent} />
                <Chip icon="bit" label={`+${r.reward.bits}`} color={colors.bit} />
                {r.prepared ? <Chip icon="check" label={t.node.prepared} color={colors.primary} /> : null}
                {r.reward.gems > 0 ? <Chip icon="gem" label={`+${r.reward.gems}`} color={colors.gem} /> : null}
                {r.bonus && r.bonus.network > 0 ? (
                  <Chip icon="spark" label={t.node.networkBonus(Math.round(r.bonus.network * 100))} color="#B46BFF" />
                ) : null}
                {r.bonus?.variety ? (
                  <Chip icon="bit" label={t.node.varietyBonus(Math.round(VARIETY_BONUS * 100))} color={colors.bit} />
                ) : null}
              </View>
            ) : null}
            {(r.albums ?? []).map((id) => (
              <Card key={id} style={{ borderColor: colors.gem }}>
                <P style={{ color: colors.gem }}>
                  {t.node.albumFull(t.codex.albumNames[id as keyof typeof t.codex.albumNames], ALBUM_REWARD.gems, ALBUM_REWARD.bits)}
                </P>
              </Card>
            ))}
            {!review && r.attempts === 2 ? (
              <Card style={{ borderColor: colors.warn }}>
                <P style={{ color: colors.warn }}>
                  {t.node.secondTry}
                </P>
              </Card>
            ) : null}
            {!review && r.attempts >= 3 ? (
              <Card style={{ borderColor: colors.bad }}>
                <P style={{ color: colors.bad }}>
                  {t.node.manyTries}
                </P>
              </Card>
            ) : null}
            {(r.reachedWalls ?? []).map((a) => (
              <Card key={a} style={{ borderColor: colors.bad }}>
                <P style={{ color: colors.bad }}>
                  {t.node.wallReached(area(a))}
                </P>
              </Card>
            ))}
            {r.starter ? (
              <Card style={{ borderColor: colors.gem, gap: 8 }}>
                <P style={{ color: colors.gem }}>
                  {t.node.starter}
                </P>
                <Button
                  variant="gem"
                  icon="gem"
                  label={t.node.view}
                  onPress={() => router.push({ pathname: '/shop', params: { from: 'starter' } })}
                />
              </Card>
            ) : null}
            {r.closedCircle ? (
              <Card style={{ borderColor: colors.gem }}>
                <P style={{ color: colors.gem }}>
                  {t.node.circle}
                </P>
              </Card>
            ) : null}
            {spawnedNodes.length > 0 ? (
              <Card style={{ gap: 6 }}>
                <Text style={styles.cacheLabel}>{t.node.newPaths}</Text>
                {spawnedNodes.map((n) => {
                  const nq = pool.get(n.questionId);
                  return (
                    <View key={n.id} style={styles.pathRow}>
                      <Icon name={n.kind === 'deepen' ? 'down' : n.kind === 'bridge' ? 'link' : 'shard'} size={18} color={colors.accent} />
                      <Text style={styles.pathLine}>
                        {t.kinds[n.kind]} · {area(nq.area)}
                      </Text>
                    </View>
                  );
                })}
              </Card>
            ) : null}
            <Button label={t.common.backToMap} onPress={leave} />
          </>
        ) : (
          <>
            <H1 style={{ textAlign: 'center' }}>{review ? t.node.shaky : t.node.glitch}</H1>
            <Card>
              <Text style={styles.speaker}>{t.node.morphRadios}</Text>
              <P style={{ color: colors.text }}>{r.morph}</P>
            </Card>
            {review ? (
              <Card>
                <P style={{ color: colors.text }}>
                  {t.common.rightWouldBe(answerText(q, t.lang))} {q.explanation}
                </P>
              </Card>
            ) : (
              <P style={{ textAlign: 'center' }}>
                {t.node.flicker(r.attempts)}
              </P>
            )}
            {!review ? (
              <>
                {second.left > 0 ? (
                  <>
                    <Button
                      variant="gem"
                      label={second.instant ? t.node.adRepairPlus : t.node.adRepair}
                      sub={t.node.adRepairSub(second.left)}
                      disabled={adBusy}
                      onPress={watchForSecondChance}
                    />
                    {second.instant ? null : (
                      <Pressable
                        accessibilityRole="link"
                        hitSlop={8}
                        onPress={() => router.push({ pathname: '/plus', params: { from: 'secondChance' } })}
                      >
                        <Text style={styles.plusLink}>{t.node.plusLink}</Text>
                      </Pressable>
                    )}
                  </>
                ) : null}
                <Button label={t.node.backToDebris} onPress={retry} />
                {r.attempts >= 3 ? (
                  <Card style={{ gap: 8 }}>
                    <P>{t.node.laterText}</P>
                    <Text style={styles.stem}>{answerText(q, t.lang)}</Text>
                    <P>{q.explanation}</P>
                    <Button label={t.node.later} variant="ghost" onPress={leave} />
                  </Card>
                ) : (
                  <Button label={t.common.backToMap} variant="ghost" onPress={leave} />
                )}
              </>
            ) : (
              <Button label={t.common.backToMap} onPress={leave} />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  plusLink: { color: colors.gem, fontSize: 14, fontWeight: '700', textAlign: 'center', paddingVertical: 6 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerPills: { flexDirection: 'row', gap: 6 },
  close: { width: 34, height: 30, alignItems: 'center', justifyContent: 'center' },
  closeGlyph: { color: colors.dim, fontSize: 18, fontWeight: '900' },
  body: { padding: 16, gap: 14 },
  cacheRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  cacheLabel: { color: colors.dim, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  slot: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  slotText: { color: colors.dim, fontSize: 12, fontWeight: '700' },
  arena: {
    height: 330,
    backgroundColor: colors.panel,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  shard: {
    position: 'absolute',
    width: '30%',
    minHeight: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.panelHi,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  shardText: { color: colors.text, fontWeight: '700', fontSize: 12, textAlign: 'center' },
  modalBack: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  fragText: { color: colors.text, fontSize: 18, lineHeight: 26 },
  qTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lockRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  pathRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lock: { color: colors.dim, fontWeight: '700' },
  stem: { color: colors.text, fontSize: 21, fontWeight: '800', lineHeight: 29 },
  option: {
    ...sunken,
    padding: 14,
    minHeight: 56,
    justifyContent: 'center',
  },
  optionText: { color: colors.text, fontSize: 16, fontWeight: '700' },
  input: {
    ...sunken,
    color: colors.text,
    padding: 14,
    fontSize: 18,
  },
  rewards: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  rewardChip: {
    color: colors.accent,
    fontWeight: '900',
    fontSize: 16,
    backgroundColor: colors.panel,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  pathLine: { color: colors.text, fontSize: 15 },
  speaker: { color: colors.sector.humanities, fontWeight: '800', marginBottom: 6, letterSpacing: 0.5 },
  voice: { flexDirection: 'row', gap: 10, alignItems: 'center' },
});
