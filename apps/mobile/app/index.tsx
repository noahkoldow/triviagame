import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CACHE_SLOTS,
  DEBRIS_COST,
  areaById,
  buildField,
  cacheAdd,
  cacheDrop,
  cacheFragments,
  cacheSwap,
  chooseNode,
  debrisOffsets,
  dueReviews,
  openDebris,
  snapToHex,
  sectorOfArea,
  type CacheEntry,
} from '@nexus/shared';
import { Bolt } from '../src/components/Bolt';
import { CacheBar, Dock, MapHud, glass } from '../src/components/MapUi';
import { Button, Pill, tap } from '../src/components/ui';
import { NetMap } from '../src/map/NetMap';
import type { Shard } from '../src/map/NodeViews';
import { pool } from '../src/services/content';
import { getHint, takeDebrisReturn, takeRecentlySpawned } from '../src/state/session';
import { getState, today, update, useGame } from '../src/state/store';
import { de } from '../src/strings';
import { colors } from '../src/theme';

export default function Home() {
  const router = useRouter();
  const network = useGame((p) => p.network);
  const cache = useGame((p) => p.cache);
  const gems = useGame((p) => p.gems);
  const name = useGame((p) => p.profile.name);
  const [size, setSize] = useState({ width: 360, height: 640 });
  const [highlight, setHighlight] = useState<string[]>([]);
  const [focusKey, setFocusKey] = useState(0);
  const [focusId, setFocusId] = useState<string | undefined>();
  const [sel, setSel] = useState<string | null>(null);
  const [debrisId, setDebrisId] = useState<string | null>(null);
  const [shardId, setShardId] = useState<string | null>(null);
  const [cacheView, setCacheView] = useState<CacheEntry | null>(null);
  const [tip, setTip] = useState(true);

  const nodes = useMemo(() => Object.values(network.nodes), [network]);
  const due = dueReviews(getState(), today());

  const focus = (id: string) => {
    setFocusId(id);
    setFocusKey((k) => k + 1);
  };

  useFocusEffect(
    useCallback(() => {
      const back = takeDebrisReturn();
      if (back) {
        setDebrisId(back);
        focus(back);
        return undefined;
      }
      setDebrisId(null);
      const spawned = takeRecentlySpawned();
      if (spawned.length) {
        setHighlight(spawned);
        focus(spawned[0]!);
        const t = setTimeout(() => setHighlight([]), 6000);
        return () => clearTimeout(t);
      }
      return undefined;
    }, []),
  );

  const debrisNode = debrisId ? network.nodes[debrisId] : undefined;
  const debrisQ = debrisNode ? pool.get(debrisNode.questionId) : undefined;
  const debrisColor = debrisQ ? colors.sector[sectorOfArea(debrisQ.area)] : colors.accent;

  // the pieces lying around the node: key fragments are always among them
  const field = useMemo(
    () => (debrisQ && debrisNode ? buildField(debrisQ, debrisNode.attempts) : []),
    [debrisQ, debrisNode],
  );
  const shards = useMemo<Shard[]>(() => {
    if (!debrisQ || !debrisNode) return [];
    const offs = debrisOffsets(`${debrisNode.id}:${debrisNode.attempts}`, field.length);
    const at = snapToHex(debrisNode.pos.x, debrisNode.pos.y);
    return field.map((f, i) => ({
      id: f.id,
      ...snapToHex(at.x + offs[i]!.x, at.y + offs[i]!.y),
      rot: offs[i]!.rot,
      hint: f.hint,
      taken: cache.some((c) => c.questionId === debrisQ.id && c.fragmentId === f.id),
    }));
  }, [field, debrisQ, debrisNode, cache]);

  const shard = shardId ? field.find((f) => f.id === shardId) : undefined;
  const shardEntry: CacheEntry | null =
    shard && debrisQ ? { questionId: debrisQ.id, fragmentId: shard.id } : null;
  const inCache = !!shardEntry && cache.some((c) => c.questionId === shardEntry.questionId && c.fragmentId === shardEntry.fragmentId);
  const cached = useMemo(() => cacheFragments(getState(), pool), [cache]);

  const selected = sel ? network.nodes[sel] : undefined;
  const selQ = selected ? pool.get(selected.questionId) : undefined;
  const openCount = nodes.filter((n) => n.state === 'open' && !n.locked).length;
  const hint = debrisId ? getHint(debrisId) : null;

  const onSelect = (id: string) => {
    tap();
    const n = network.nodes[id];
    if (!n) return;
    if (!n.locked && (n.state === 'open' || n.state === 'damaged')) {
      if (n.state === 'open' && debrisId !== id) update((p) => chooseNode(p, pool, id));
      setDebrisId(id);
      focus(id);
      setTip(false);
      return;
    }
    setSel(id);
  };

  const startQuestion = () => {
    if (!debrisId) return;
    router.push({ pathname: '/node/[id]', params: { id: debrisId } });
  };

  return (
    <View style={styles.root} onLayout={(e) => setSize(e.nativeEvent.layout)}>
      <NetMap
        nodes={nodes}
        pool={pool}
        width={size.width}
        height={size.height}
        highlight={highlight}
        focusKey={focusKey}
        focusId={focusId}
        focusZoom={debrisId ? 1.15 : undefined}
        debris={
          debrisNode
            ? { center: snapToHex(debrisNode.pos.x, debrisNode.pos.y), color: debrisColor, shards }
            : undefined
        }
        onShard={(id) => {
          tap();
          setShardId(id);
        }}
        onSelect={onSelect}
      />

      <SafeAreaView edges={['top']} style={styles.top} pointerEvents="box-none">
        <MapHud />
        {due.length > 0 ? (
          <Pressable
            style={styles.banner}
            onPress={() => onSelect(due[0]!)}
            accessibilityRole="button"
          >
            <Text style={styles.bannerText}>
              ⚠ {due.length} beschädigte{due.length > 1 ? ' Knoten' : 'r Knoten'} zur Reparatur fällig
            </Text>
          </Pressable>
        ) : null}
      </SafeAreaView>

      {tip && !debrisId ? (
        <Pressable style={[styles.tip, glass]} onPress={() => setTip(false)} accessibilityLabel="Tipp von Bolt schließen">
          <Bolt size={52} mood={openCount > 0 ? 'happy' : 'think'} />
          <Text style={styles.tipText}>
            {name ? `${name}, ` : ''}
            tippe einen leuchtenden Knoten an. Dann siehst du sein Trümmerfeld. Ziehen = Karte drehen und schieben, zwei Finger = zoomen. Hinter dem Nebel liegt Unbekanntes.
          </Text>
        </Pressable>
      ) : null}

      <SafeAreaView edges={['bottom']} style={styles.bottom} pointerEvents="box-none">
        <View style={styles.stack} pointerEvents="box-none">
          {debrisNode && debrisQ ? (
            <View style={[styles.debris, glass, { borderColor: debrisColor + '88' }]}>
              <View style={styles.row}>
                <Pill label={areaById(debrisQ.area).de} color={debrisColor} />
                <Pill label={de.difficulty[debrisQ.difficulty]!} color={colors.warn} />
              </View>
              <Text style={styles.debrisText}>
                {hint
                  ? `Bolt: ${hint}`
                  : `Tippe die Trümmerteile an, lies sie und nimm mit, was wichtig sein könnte. Der Cache fasst nur ${CACHE_SLOTS}.`}
              </Text>
              <View style={styles.row}>
                <Button label="Zurück" variant="ghost" style={{ flex: 1 }} onPress={() => setDebrisId(null)} />
                <Button
                  label={debrisNode.state === 'damaged' ? 'Reparieren' : 'Frage starten'}
                  sub="Cache wird versiegelt"
                  style={{ flex: 2 }}
                  onPress={startQuestion}
                />
              </View>
            </View>
          ) : null}
          <CacheBar onSlot={setCacheView} />
          {!debrisNode ? (
            <Dock
              items={[
                { label: 'Codex', icon: '📖', onPress: () => router.push('/codex') },
                { label: 'Shop', icon: '💎', tint: colors.gem, onPress: () => router.push('/shop') },
                { label: 'Profil', icon: '🧭', onPress: () => router.push('/profile') },
              ]}
            />
          ) : null}
        </View>
      </SafeAreaView>

      {/* a piece of debris */}
      <Modal transparent animationType="fade" visible={!!shard} onRequestClose={() => setShardId(null)}>
        <Pressable style={styles.center} onPress={() => setShardId(null)}>
          <Pressable style={[styles.card, { borderColor: debrisColor + '99' }]} onPress={() => undefined}>
            {shard && shardEntry && debrisQ ? (
              <>
                <Text style={[styles.cardLabel, { color: debrisColor }]}>{shard.hint.toUpperCase()}</Text>
                <Text style={styles.fragText}>{shard.text}</Text>
                {inCache ? (
                  <Button
                    label="Aus dem Cache nehmen"
                    variant="ghost"
                    onPress={() => {
                      update((p) => cacheDrop(p, shardEntry));
                      setShardId(null);
                    }}
                  />
                ) : cache.length < CACHE_SLOTS ? (
                  <Button
                    label="Merken (in den Cache)"
                    onPress={() => {
                      update((p) => cacheAdd(p, shardEntry));
                      setShardId(null);
                    }}
                  />
                ) : (
                  <>
                    <Text style={styles.cardSub}>Cache voll. Tausche gegen:</Text>
                    {cached.map((c) => (
                      <Button
                        key={`${c.questionId}:${c.id}`}
                        label={c.hint}
                        variant="ghost"
                        onPress={() => {
                          update((p) => cacheSwap(p, { questionId: c.questionId, fragmentId: c.id }, shardEntry));
                          setShardId(null);
                        }}
                      />
                    ))}
                  </>
                )}
                <Button label="Liegen lassen" variant="ghost" onPress={() => setShardId(null)} />
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      {/* a fragment already in the cache: read or drop it */}
      <Modal transparent animationType="fade" visible={!!cacheView} onRequestClose={() => setCacheView(null)}>
        <Pressable style={styles.center} onPress={() => setCacheView(null)}>
          <Pressable style={styles.card} onPress={() => undefined}>
            {cacheView
              ? (() => {
                  const f = pool.byId.get(cacheView.questionId)?.fragments.find((x) => x.id === cacheView.fragmentId);
                  return (
                    <>
                      <Text style={styles.cardLabel}>{(f?.hint ?? '').toUpperCase()} · IM CACHE</Text>
                      <Text style={styles.fragText}>{f?.text}</Text>
                      <Button
                        label="Verwerfen"
                        variant="ghost"
                        onPress={() => {
                          update((p) => cacheDrop(p, cacheView));
                          setCacheView(null);
                        }}
                      />
                      <Button label="Schließen" onPress={() => setCacheView(null)} />
                    </>
                  );
                })()
              : null}
          </Pressable>
        </Pressable>
      </Modal>

      {/* locked debris field or an already restored node */}
      <Modal transparent animationType="slide" visible={!!selected} onRequestClose={() => setSel(null)}>
        <Pressable style={styles.backdrop} onPress={() => setSel(null)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            {selected && selQ ? (
              <>
                <View style={styles.row}>
                  <Pill label={de.sectors[sectorOfArea(selQ.area)]} color={colors.sector[sectorOfArea(selQ.area)]} />
                  <Pill label={de.kinds[selected.kind]} color={colors.dim} />
                </View>
                <Text style={styles.sheetTitle}>{areaById(selQ.area).de}</Text>
                {selected.locked ? (
                  <>
                    <Text style={styles.sheetText}>
                      Ein verschlüsseltes Trümmerfeld mit seltenen Fragmenten und dreifachen Bits. Öffne es mit Gems.
                    </Text>
                    <Button
                      variant="gem"
                      label={`Öffnen für ${DEBRIS_COST} Gems`}
                      sub={`Du hast ${gems} Gems`}
                      disabled={gems < DEBRIS_COST}
                      onPress={() => update((p) => openDebris(p, selected.id))}
                    />
                    {gems < DEBRIS_COST ? (
                      <Button
                        label="Zum Shop"
                        variant="ghost"
                        onPress={() => {
                          setSel(null);
                          router.push('/shop');
                        }}
                      />
                    ) : null}
                  </>
                ) : (
                  <Text style={styles.sheetText}>
                    Wiederhergestellt. Die gesammelten Fragmente findest du im Codex.
                  </Text>
                )}
                <Button label="Schließen" variant="ghost" onPress={() => setSel(null)} />
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 12, paddingTop: 6, gap: 8 },
  banner: {
    padding: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(59,42,7,0.92)',
    borderWidth: 1,
    borderColor: colors.warn,
  },
  bannerText: { color: colors.warn, fontWeight: '700' },
  tip: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 176,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    borderRadius: 22,
    padding: 10,
  },
  tipText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 19 },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  stack: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  debris: { borderRadius: 22, padding: 12, gap: 10 },
  debrisText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  center: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 20 },
  card: {
    backgroundColor: colors.panel,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    gap: 12,
  },
  cardLabel: { color: colors.dim, fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  cardSub: { color: colors.dim, fontSize: 14 },
  fragText: { color: colors.text, fontSize: 18, lineHeight: 26 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.panel,
    padding: 20,
    gap: 12,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: colors.line,
  },
  sheetTitle: { color: colors.text, fontSize: 24, fontWeight: '800' },
  sheetText: { color: colors.dim, fontSize: 15, lineHeight: 22 },
});
