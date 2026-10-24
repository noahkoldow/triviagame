import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  answerText,
  areaById,
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
import { de } from '../../src/strings';
import { colors } from '../../src/theme';

type Phase = 'question' | 'result';

export default function NodeScreen() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: string }>();
  const router = useRouter();
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
          <P>Dieser Knoten ist nicht verfügbar.</P>
          <Button label="Zurück" onPress={() => router.back()} />
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
    reachedAreas?: string[];
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
      const r = recordCorrect(getState(), pool, nodeId, day, rewinds);
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
        reachedAreas: r.reachedAreas,
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
        accessibilityLabel="Zurück zum Netz"
        hitSlop={12}
        style={({ pressed }) => [styles.close, raised, pressed && pressedIn]}
      >
        <Icon name="close" size={14} color={WIN.black} />
      </Pressable>
      <View style={styles.headerPills}>
        <Pill label={areaById(q.area).de} color={color} />
        <Pill label={de.difficulty[q.difficulty]!} color={colors.warn} />
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
                  ? 'Wartung: aus dem Gedächtnis, ohne Cache und Ordner'
                  : `Cache: ${cached.length} von ${CACHE_FILES_PER_AREA} Dateien zu ${areaById(q.area).de}, gratis`}
              </Text>
            </View>
          </View>
          <Card>
            <Text style={styles.stem}>{q.stem}</Text>
          </Card>
          {hint ? (
            <Card style={{ borderColor: colors.accent }}>
              <P style={{ color: colors.text }}>Bolt-Hinweis: {hint}</P>
            </Card>
          ) : null}

          <QuestionView q={q} variant={variant} onChange={setAnswer} />

          <View style={{ gap: 8, marginTop: 4 }}>
            <Button label="Antwort prüfen" disabled={!canSubmit} onPress={submit} />
            {maintain ? null : (
              <>
                <Button
                  label="Cache öffnen"
                  icon="cache"
                  variant="ghost"
                  sub={cached.length ? 'Gratis: deine mitgenommenen Dateien zu diesem Thema.' : 'Leer: Du hast keine Datei zu diesem Thema mitgenommen.'}
                  disabled={cached.length === 0}
                  onPress={() => setCacheOpen(true)}
                />
                <Button
                  label={rewinds > 0 ? 'Ordner wieder öffnen' : 'Blitz: Ordner öffnen'}
                  icon="bolt"
                  variant="ghost"
                  sub={
                    structure.folders.length === 0
                      ? 'Du hast noch keine Ordner abgelegt.'
                      : rewinds > 0
                        ? 'Schon bezahlt: in dieser Frage frei zugänglich.'
                        : energy >= openCost
                          ? `Deine ganze Ordnerstruktur durchsuchen. Kostet ${openCost} Energie (du hast ${energy}).`
                          : `Zu wenig Energie: ${openCost} nötig, du hast ${energy}. Sie füllt sich mit der Zeit.`
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
            <CacheFiles items={cached} onClose={() => setCacheOpen(false)} />
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
          <H1 style={{ textAlign: 'center' }}>{r.correct ? 'Gewartet!' : 'Noch wackelig'}</H1>
          <Card>
            <P style={{ color: colors.text }}>
              {r.correct
                ? 'Sitzt noch. +1 Integrität, das Netz wird wieder stabiler.'
                : `Richtig wäre: ${answerText(q)}. Dieser Knoten ist für heute gewartet, probier einen anderen.`}
            </P>
          </Card>
          <Card>
            <P style={{ color: colors.text }}>{q.explanation}</P>
          </Card>
          <Button label="Zurück zum Netz" onPress={leave} />
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
            <H1 style={{ textAlign: 'center' }}>{review ? 'Repariert!' : 'Verbindung steht!'}</H1>
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
                  Noch nicht fällig: Die fehlenden Wege wachsen trotzdem. Integrität und Belohnung gibt es, wenn die
                  Reparatur dran ist, dann rückt der Knoten auch der Heilung näher.
                </P>
              </Card>
            ) : null}
            {r.reward && (r.reward.xp > 0 || r.reward.bits > 0) ? (
              <View style={styles.rewards}>
                <Chip label={`+${r.reward.xp} XP`} color={colors.accent} />
                <Chip icon="bit" label={`+${r.reward.bits}`} color={colors.bit} />
                {r.prepared ? <Chip icon="check" label="Gut vorbereitet" color={colors.primary} /> : null}
                {r.reward.gems > 0 ? <Chip icon="gem" label={`+${r.reward.gems}`} color={colors.gem} /> : null}
              </View>
            ) : null}
            {!review && r.attempts === 2 ? (
              <Card style={{ borderColor: colors.warn }}>
                <P style={{ color: colors.warn }}>
                  Erst im zweiten Anlauf: Nur die Vertiefung wächst. Der Knoten ist beschädigt. Repariere ihn, dann folgt die Brücke.
                </P>
              </Card>
            ) : null}
            {!review && r.attempts >= 3 ? (
              <Card style={{ borderColor: colors.bad }}>
                <P style={{ color: colors.bad }}>
                  Mehrere Fehlversuche: Der Knoten ist beschädigt und lässt nichts Neues wachsen, bis du ihn repariert hast.
                </P>
              </Card>
            ) : null}
            {(r.reachedAreas ?? []).map((a) => (
              <Card key={a} style={{ borderColor: colors.primary }}>
                <P style={{ color: colors.primary }}>
                  Neuer Bereich verbunden: {areaById(a).de}! Das Rauschen dort lichtet sich, ein neuer Knoten wartet.
                </P>
              </Card>
            ))}
            {r.starter ? (
              <Card style={{ borderColor: colors.gem, gap: 8 }}>
                <P style={{ color: colors.gem }}>
                  Startpaket freigeschaltet: 100 Gems und 3 Streak-Schutz zum Einstiegspreis. Einmalig, bleibt im Shop.
                </P>
                <Button
                  variant="gem"
                  icon="gem"
                  label="Ansehen"
                  onPress={() => router.push({ pathname: '/shop', params: { from: 'starter' } })}
                />
              </Card>
            ) : null}
            {r.closedCircle ? (
              <Card style={{ borderColor: colors.gem }}>
                <P style={{ color: colors.gem }}>
                  Kreis geschlossen! Dein Netz hat sich mit einem anderen Zweig verbunden. Bonus!
                </P>
              </Card>
            ) : null}
            {spawnedNodes.length > 0 ? (
              <Card style={{ gap: 6 }}>
                <Text style={styles.cacheLabel}>NEUE WEGE</Text>
                {spawnedNodes.map((n) => {
                  const nq = pool.get(n.questionId);
                  return (
                    <View key={n.id} style={styles.pathRow}>
                      <Icon name={n.kind === 'deepen' ? 'down' : n.kind === 'bridge' ? 'link' : 'shard'} size={18} color={colors.accent} />
                      <Text style={styles.pathLine}>
                        {n.kind === 'deepen' ? 'Vertiefung' : n.kind === 'bridge' ? 'Brücke' : 'Trümmerfeld'} · {areaById(nq.area).de}
                      </Text>
                    </View>
                  );
                })}
              </Card>
            ) : null}
            <Button label="Zurück zum Netz" onPress={leave} />
          </>
        ) : (
          <>
            <H1 style={{ textAlign: 'center' }}>{review ? 'Noch wackelig' : 'Glitch!'}</H1>
            <Card>
              <Text style={styles.speaker}>morph.ai funkt dazwischen</Text>
              <P style={{ color: colors.text }}>{r.morph}</P>
            </Card>
            {review ? (
              <Card>
                <P style={{ color: colors.text }}>
                  Richtig wäre: {answerText(q)}. {q.explanation}
                </P>
              </Card>
            ) : (
              <P style={{ textAlign: 'center' }}>
                Der Knoten flackert, aber er hält. Versuch {r.attempts} · Integrität sinkt. Jeder weitere Fehler bremst das Wachstum: ab dem zweiten Treffer wächst weniger.
              </P>
            )}
            {!review ? (
              <>
                {second.left > 0 ? (
                  <>
                    <Button
                      variant="gem"
                      label={second.instant ? 'Reparatur-Funk (Plus)' : 'Reparatur-Funk (Video ansehen)'}
                      sub={`Zweite Chance: +1 Integrität und ein Hinweis von Bolt · heute noch ${second.left}`}
                      disabled={adBusy}
                      onPress={watchForSecondChance}
                    />
                    {second.instant ? null : (
                      <Pressable
                        accessibilityRole="link"
                        hitSlop={8}
                        onPress={() => router.push({ pathname: '/plus', params: { from: 'secondChance' } })}
                      >
                        <Text style={styles.plusLink}>Ohne Video und ohne Werbung: NEXUS Plus</Text>
                      </Pressable>
                    )}
                  </>
                ) : null}
                <Button label="Zurück ins Trümmerfeld" onPress={retry} />
                {r.attempts >= 3 ? (
                  <Card style={{ gap: 8 }}>
                    <P>Du kannst den Knoten später noch einmal angehen. Richtig wäre gewesen:</P>
                    <Text style={styles.stem}>{answerText(q)}</Text>
                    <P>{q.explanation}</P>
                    <Button label="Später wiederkommen" variant="ghost" onPress={leave} />
                  </Card>
                ) : (
                  <Button label="Zurück zum Netz" variant="ghost" onPress={leave} />
                )}
              </>
            ) : (
              <Button label="Zurück zum Netz" onPress={leave} />
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
