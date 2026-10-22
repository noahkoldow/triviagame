import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  areaById,
  buildField,
  decideAds,
  isCorrect,
  noteInterstitialShown,
  recordCorrect,
  recordReviewResult,
  recordWrong,
  seededRng,
  sectorOfArea,
  sessionParams,
  spendRewind,
  variantOptions,
  variantOrder,
  type Fragment,
  type Question,
  type Reward,
} from '@nexus/shared';
import { Bolt } from '../../src/components/Bolt';
import { Morph } from '../../src/components/Morph';
import { Button, Card, H1, P, Pill, tap } from '../../src/components/ui';
import { ads } from '../../src/services/ads';
import { pool } from '../../src/services/content';
import { setRecentlySpawned } from '../../src/state/session';
import { getState, today, update, useGame } from '../../src/state/store';
import { de } from '../../src/strings';
import { colors } from '../../src/theme';

type Phase = 'intro' | 'collect' | 'question' | 'result';

const MORPH_QUIPS = [
  'Wozu merken? Frag mich einfach. Ich kürze dir das ab. 😇',
  'Oh, knapp daneben! Das war übrigens nicht schlimm. Wissen wird eh überschätzt.',
  'Rauschen … Rauschen … hast du „richtig“ gesagt? Ich habe „rauschig“ verstanden.',
  'Ich habe dein Fragment ein klitzekleines bisschen verbessert. Gern geschehen!',
];

function answerText(q: Question): string {
  if (q.type === 'choice') return q.options[q.answer] ?? '';
  if (q.type === 'estimate') return `${q.answer} ${q.unit}`.trim();
  return q.items.join(' → ');
}

export default function NodeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const node = useGame((p) => p.network.nodes[id ?? '']);
  const energy = useGame((p) => p.energy);

  if (!node || node.locked) {
    return (
      <SafeAreaView style={styles.root}>
        <Card>
          <P>Dieser Knoten ist nicht verfügbar.</P>
          <Button label="Zurück" onPress={() => router.back()} />
        </Card>
      </SafeAreaView>
    );
  }
  return <NodeGame nodeId={node.id} review={node.state === 'damaged'} energy={energy} />;
}

function NodeGame({ nodeId, review, energy }: { nodeId: string; review: boolean; energy: number }) {
  const router = useRouter();
  const node = useGame((p) => p.network.nodes[nodeId])!;
  const q = pool.get(node.questionId);
  const sector = sectorOfArea(q.area);
  const color = colors.sector[sector];
  const params = sessionParams(q);

  const [phase, setPhase] = useState<Phase>('intro');
  const [variant, setVariant] = useState(node.attempts);
  const [cache, setCache] = useState<string[]>([]);
  const [viewing, setViewing] = useState<Fragment | null>(null);
  const [rewindOpen, setRewindOpen] = useState(false);
  const [rewinds, setRewinds] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [choice, setChoice] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [result, setResult] = useState<{
    correct: boolean;
    reward?: Reward;
    spawned?: string[];
    closedCircle?: boolean;
    gaveUp?: boolean;
    attempts: number;
  } | null>(null);
  const [adBusy, setAdBusy] = useState(false);

  const field = useMemo(() => buildField(q, variant), [q, variant]);
  const options = useMemo(
    () => (q.type === 'choice' ? variantOptions(q, variant) : null),
    [q, variant],
  );
  const orderItems = useMemo(
    () => (q.type === 'order' ? variantOrder(q, variant) : []),
    [q, variant],
  );
  const positions = useMemo(() => {
    const rng = seededRng(`${q.id}:pos:${variant}`);
    return field.map((_, i) => {
      const angle = (i / field.length) * Math.PI * 2 + rng() * 0.5;
      const r = 0.55 + rng() * 0.35;
      return {
        x: 50 + Math.cos(angle) * r * 40,
        y: 50 + Math.sin(angle) * r * 40,
        rot: (rng() - 0.5) * 30,
      };
    });
  }, [field, q.id, variant]);

  const cachedFragments = cache
    .map((fid) => q.fragments.find((f) => f.id === fid)!)
    .filter(Boolean);

  const collectFragment = (f: Fragment) => {
    if (cache.includes(f.id)) return;
    if (cache.length < params.slots) setCache([...cache, f.id]);
    setViewing(null);
  };
  const swapFragment = (f: Fragment, out: string) => {
    setCache(cache.map((c) => (c === out ? f.id : c)));
    setViewing(null);
  };

  const check = (): boolean => {
    if (q.type === 'choice' && options) return choice === options.answer;
    if (q.type === 'estimate') {
      const v = parseFloat(text.replace(/\./g, '').replace(',', '.'));
      return Number.isFinite(v) && isCorrect(q, { type: 'estimate', value: v });
    }
    if (q.type === 'order') return isCorrect(q, { type: 'order', items: picked });
    return false;
  };

  const canSubmit =
    (q.type === 'choice' && choice !== null) ||
    (q.type === 'estimate' && text.trim().length > 0) ||
    (q.type === 'order' && picked.length === q.items.length);

  const submit = async () => {
    const ok = check();
    const day = today();
    if (review) {
      const r = recordReviewResult(getState(), pool, nodeId, ok, day);
      update(() => r.player);
      tap(ok ? 'success' : 'error');
      setResult({ correct: ok, reward: r.reward, attempts: 1 });
      setPhase('result');
      return;
    }
    if (ok) {
      const r = recordCorrect(getState(), pool, nodeId, day, rewinds);
      update(() => r.player);
      setRecentlySpawned(r.spawned);
      tap('success');
      setResult({
        correct: true,
        reward: r.reward,
        spawned: r.spawned,
        closedCircle: r.closedCircle,
        attempts: node.attempts + 1,
      });
      setPhase('result');
      return;
    }
    update((p) => recordWrong(p, pool, nodeId));
    tap('error');
    setResult({ correct: false, attempts: getState().network.nodes[nodeId]!.attempts });
    setPhase('result');

    // ads after a wrong answer: rewarded is offered (below), interstitial only rarely
    const s = getState();
    const decision = decideAds(
      {
        ageGroup: s.profile.ageGroup,
        consent: s.profile.consent,
        adFree: s.profile.adFree,
        ...s.ads,
      },
      { now: Date.now(), phase: 'afterWrong', boss: false },
    );
    if (decision.showInterstitial) {
      await ads.showInterstitial({ personalized: decision.personalized });
      update((p) => noteInterstitialShown(p, Date.now()));
    }
  };

  const offerRewarded = (() => {
    const s = getState();
    const d = decideAds(
      {
        ageGroup: s.profile.ageGroup,
        consent: s.profile.consent,
        adFree: s.profile.adFree,
        ...s.ads,
      },
      { now: Date.now(), phase: 'afterWrong', boss: false },
    );
    return d.offerRewarded;
  })();

  const watchForSecondChance = async () => {
    setAdBusy(true);
    const s = getState();
    const watched = await ads.showRewarded({
      personalized: s.profile.ageGroup === 'adult' && s.profile.consent,
    });
    setAdBusy(false);
    if (!watched) return;
    update((p) => ({ ...p, integrity: Math.min(5, p.integrity + 1) }));
    const key = q.fragments.find((f) => f.kind === 'key');
    if (key) setHint(key.text);
    tap('success');
    retry();
  };

  const retry = () => {
    setVariant(variant + 1);
    setCache([]);
    setChoice(null);
    setText('');
    setPicked([]);
    setRewinds(0);
    setPhase('collect');
  };

  const rewind = () => {
    if (!update((p) => spendRewind(p))) return;
    setRewinds(rewinds + 1);
    setRewindOpen(true);
  };

  const leave = () => router.back();

  // ------------------------------------------------------------------ UI
  const header = (
    <View style={styles.header}>
      <Pressable
        onPress={leave}
        accessibilityRole="button"
        accessibilityLabel="Zurück zum Netz"
        hitSlop={12}
      >
        <Text style={styles.back}>‹ Netz</Text>
      </Pressable>
      <View style={styles.headerPills}>
        <Pill label={areaById(q.area).de} color={color} />
        <Pill label={de.difficulty[q.difficulty]!} color={colors.warn} />
      </View>
    </View>
  );

  if (phase === 'intro') {
    return (
      <SafeAreaView style={styles.root}>
        {header}
        <ScrollView contentContainerStyle={styles.body}>
          <View style={{ alignItems: 'center' }}>
            <Bolt size={110} mood="happy" />
          </View>
          <Card>
            <H1 style={{ fontSize: 22 }}>{review ? 'Reparatur-Lauf' : de.kinds[node.kind]}</H1>
            <P style={{ marginTop: 6 }}>
              {review
                ? 'Dieser Knoten war wackelig. Sammle die Fragmente noch einmal und beantworte die Frage.'
                : `Zwischen den Trümmern liegen Datenfragmente. Dein Cache fasst nur ${params.slots}, such dir aus, was du behältst. Danach verschwinden die Fragmente und die Frage erscheint.`}
            </P>
            {node.attempts > 0 ? (
              <P style={{ marginTop: 6 }}>
                Versuch {node.attempts + 1}: neue Fragmente, neue Variante.
              </P>
            ) : null}
          </Card>
          <Button label="Trümmerfeld betreten" onPress={() => setPhase('collect')} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (phase === 'collect') {
    return (
      <SafeAreaView style={styles.root}>
        {header}
        <View style={styles.body}>
          <View
            style={styles.cacheRow}
            accessibilityLabel={`Cache: ${cache.length} von ${params.slots} belegt`}
          >
            <Text style={styles.cacheLabel}>CACHE</Text>
            {Array.from({ length: params.slots }).map((_, i) => {
              const f = cachedFragments[i];
              return (
                <View
                  key={i}
                  style={[styles.slot, f && { borderColor: color, backgroundColor: color + '22' }]}
                >
                  <Text style={[styles.slotText, f && { color }]} numberOfLines={1}>
                    {f ? f.hint : '·'}
                  </Text>
                </View>
              );
            })}
          </View>
          {hint ? (
            <Card style={{ borderColor: colors.accent }}>
              <P style={{ color: colors.text }}>Bolt-Hinweis: {hint}</P>
            </Card>
          ) : null}
          <View style={styles.arena}>
            {field.map((f, i) => {
              const pos = positions[i]!;
              const inCache = cache.includes(f.id);
              return (
                <Pressable
                  key={f.id}
                  onPress={() => {
                    tap();
                    setViewing(f);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Trümmerteil: ${f.hint}${inCache ? ', im Cache' : ''}`}
                  style={[
                    styles.shard,
                    {
                      left: `${pos.x - 14}%`,
                      top: `${pos.y - 8}%`,
                      transform: [{ rotate: `${pos.rot}deg` }],
                    },
                    inCache && { borderColor: color, backgroundColor: color + '33' },
                  ]}
                >
                  <Text style={[styles.shardText, inCache && { color }]}>
                    {inCache ? '✓ ' : ''}
                    {f.hint}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <P>Tippe auf Trümmerteile und lies die Fragmente. Merke dir, was wichtig sein könnte.</P>
          <Button label="Weiter zur Frage" onPress={() => setPhase('question')} />
        </View>

        <Modal
          transparent
          animationType="fade"
          visible={!!viewing}
          onRequestClose={() => setViewing(null)}
        >
          <View style={styles.modalBack}>
            {viewing ? (
              <Card style={{ gap: 12 }}>
                <Text style={[styles.cacheLabel, { color }]}>{viewing.hint.toUpperCase()}</Text>
                <Text style={styles.fragText}>{viewing.text}</Text>
                {cache.includes(viewing.id) ? (
                  <Button label="Schließen" variant="ghost" onPress={() => setViewing(null)} />
                ) : cache.length < params.slots ? (
                  <>
                    <Button
                      label="Merken (in den Cache)"
                      onPress={() => collectFragment(viewing)}
                    />
                    <Button
                      label="Liegen lassen"
                      variant="ghost"
                      onPress={() => setViewing(null)}
                    />
                  </>
                ) : (
                  <>
                    <P>Cache voll. Tausche gegen:</P>
                    {cachedFragments.map((c) => (
                      <Button
                        key={c.id}
                        label={c.hint}
                        variant="ghost"
                        onPress={() => swapFragment(viewing, c.id)}
                      />
                    ))}
                    <Button
                      label="Liegen lassen"
                      variant="ghost"
                      onPress={() => setViewing(null)}
                    />
                  </>
                )}
              </Card>
            ) : null}
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  if (phase === 'question') {
    return (
      <SafeAreaView style={styles.root}>
        {header}
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.qTop}>
            <Bolt size={64} mood="think" />
            <Text style={styles.lock}>
              🔒 {cache.length} Fragment{cache.length === 1 ? '' : 'e'} im Cache
            </Text>
          </View>
          <Card>
            <Text style={styles.stem}>{q.stem}</Text>
          </Card>
          {hint ? (
            <Card style={{ borderColor: colors.accent }}>
              <P style={{ color: colors.text }}>Bolt-Hinweis: {hint}</P>
            </Card>
          ) : null}

          {q.type === 'choice' && options
            ? options.options.map((o, i) => (
                <Pressable
                  key={`${variant}-${i}`}
                  onPress={() => {
                    tap();
                    setChoice(i);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: choice === i }}
                  style={[
                    styles.option,
                    choice === i && { borderColor: color, backgroundColor: color + '22' },
                  ]}
                >
                  <Text style={styles.optionText}>{o}</Text>
                </Pressable>
              ))
            : null}

          {q.type === 'estimate' ? (
            <View style={{ gap: 8 }}>
              <TextInput
                value={text}
                onChangeText={setText}
                keyboardType="numbers-and-punctuation"
                placeholder={q.unit ? `Deine Schätzung (${q.unit})` : 'Deine Antwort'}
                placeholderTextColor={colors.dim}
                style={styles.input}
                accessibilityLabel="Antwort eingeben"
              />
            </View>
          ) : null}

          {q.type === 'order' ? (
            <View style={{ gap: 8 }}>
              <P>
                Tippe die Einträge in der richtigen Reihenfolge an. Tippe einen gewählten Eintrag
                erneut, um ihn zurückzunehmen.
              </P>
              {orderItems.map((it) => {
                const idx = picked.indexOf(it);
                return (
                  <Pressable
                    key={it}
                    onPress={() => {
                      tap();
                      setPicked(idx >= 0 ? picked.filter((x) => x !== it) : [...picked, it]);
                    }}
                    style={[
                      styles.option,
                      idx >= 0 && { borderColor: color, backgroundColor: color + '22' },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={idx >= 0 ? `${it}, Platz ${idx + 1}` : it}
                  >
                    <Text style={styles.optionText}>
                      {idx >= 0 ? `${idx + 1}. ` : ''}
                      {it}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <View style={{ gap: 8, marginTop: 4 }}>
            <Button label="Antwort prüfen" disabled={!canSubmit} onPress={submit} />
            <Button
              label="Rückspulen"
              variant="ghost"
              sub={
                energy > 0
                  ? `Cache noch einmal ansehen · ⚡ 1 (du hast ${energy})`
                  : 'Keine Energie. Lösche Knoten, um sie aufzuladen'
              }
              disabled={energy <= 0 || cache.length === 0}
              onPress={rewind}
            />
          </View>
        </ScrollView>

        <Modal
          transparent
          animationType="fade"
          visible={rewindOpen}
          onRequestClose={() => setRewindOpen(false)}
        >
          <View style={styles.modalBack}>
            <Card style={{ gap: 12 }}>
              <Text style={styles.cacheLabel}>REWIND · DEIN CACHE</Text>
              {cachedFragments.map((f) => (
                <View key={f.id} style={{ gap: 2 }}>
                  <Text style={[styles.cacheLabel, { color }]}>{f.hint}</Text>
                  <Text style={styles.fragText}>{f.text}</Text>
                </View>
              ))}
              <Button label="Zurück zur Frage" onPress={() => setRewindOpen(false)} />
            </Card>
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
  return (
    <SafeAreaView style={styles.root}>
      {header}
      <ScrollView contentContainerStyle={styles.body}>
        <View style={{ alignItems: 'center' }}>
          {r.correct ? <Bolt size={110} mood="wow" color={color} /> : <Morph size={96} />}
        </View>

        {r.correct ? (
          <>
            <H1 style={{ textAlign: 'center' }}>{review ? 'Repariert!' : 'Verbindung steht!'}</H1>
            <Card>
              <P style={{ color: colors.text }}>{q.explanation}</P>
            </Card>
            {r.reward ? (
              <View style={styles.rewards}>
                <Text style={styles.rewardChip}>+{r.reward.xp} XP</Text>
                <Text style={[styles.rewardChip, { color: colors.bit }]}>+{r.reward.bits} ◈</Text>
                {r.reward.gems > 0 ? (
                  <Text style={[styles.rewardChip, { color: colors.gem }]}>
                    +{r.reward.gems} 💎
                  </Text>
                ) : null}
              </View>
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
                    <Text key={n.id} style={styles.pathLine}>
                      {n.kind === 'deepen'
                        ? '↓ Vertiefung'
                        : n.kind === 'bridge'
                          ? '↔ Brücke'
                          : '◆ Trümmerfeld'}{' '}
                      · {areaById(nq.area).de}
                    </Text>
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
              <Text style={styles.speaker}>MORPH funkt dazwischen</Text>
              <P style={{ color: colors.text }}>
                {MORPH_QUIPS[(r.attempts + node.attempts) % MORPH_QUIPS.length]}
              </P>
            </Card>
            {review ? (
              <Card>
                <P style={{ color: colors.text }}>
                  Richtig wäre: {answerText(q)}. {q.explanation}
                </P>
              </Card>
            ) : (
              <P style={{ textAlign: 'center' }}>
                Der Knoten flackert, aber er hält. Versuch {r.attempts} · Integrität sinkt.
              </P>
            )}
            {!review ? (
              <>
                {offerRewarded ? (
                  <Button
                    variant="gem"
                    label="Reparatur-Funk (Video ansehen)"
                    sub="Zweite Chance: +1 Integrität und ein Hinweis von Bolt"
                    disabled={adBusy}
                    onPress={watchForSecondChance}
                  />
                ) : null}
                <Button label="Nochmal versuchen" onPress={retry} />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerPills: { flexDirection: 'row', gap: 6 },
  back: { color: colors.accent, fontSize: 18, fontWeight: '700' },
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
  lock: { color: colors.dim, fontWeight: '700' },
  stem: { color: colors.text, fontSize: 20, fontWeight: '700', lineHeight: 28 },
  option: {
    backgroundColor: colors.panel,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.line,
    padding: 14,
    minHeight: 52,
    justifyContent: 'center',
  },
  optionText: { color: colors.text, fontSize: 16 },
  input: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1.5,
    color: colors.text,
    borderRadius: 14,
    padding: 14,
    fontSize: 18,
  },
  rewards: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  rewardChip: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 16,
    backgroundColor: colors.panel,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  pathLine: { color: colors.text, fontSize: 15 },
  speaker: { color: colors.sector.culture, fontWeight: '800', marginBottom: 6, letterSpacing: 0.5 },
});
