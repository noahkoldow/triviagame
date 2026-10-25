import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BOSS_PASS,
  BOSS_QUESTIONS,
  BOSS_REWARD,
  DEBRIS_COST,
  HEAL_COST,
  dailyBonusDue,
  rewardedOffer,
  areaName,
  buildField,
  canStartNode,
  CACHE_FILES_PER_AREA,
  archiveAdd,
  archiveClear,
  archiveDrop,
  archiveHas,
  archiveReorder,
  archiveSwap,
  cacheAddFile,
  cacheDropFile,
  cacheFreeSlots,
  cacheHasFile,
  cacheHasFolder,
  fragmentFiles,
  chooseNode,
  debrisOffsets,
  dueReviews,
  healIntegrity,
  openDebris,
  unlockArea,
  areaCost,
  regenEnergy,
  snapToHex,
  sectorOfArea,
  FINALE_ID,
  chapterOf,
  isUnstable,
  maintenanceTargets,
  markSeen,
  pendingBeats,
  REVEAL_ID,
  fightFrom,
  firewallReached,
  firewallSteps,
  wallsInSight,
  SYNAPSE_BONUS,
  SYNAPSE_PASS,
  SYNAPSE_QUESTIONS,
  SYNAPSE_REWARD,
  synapseSpots,
  leagueIsNew,
  leagueUnlocked,
  LEAGUE_NOTICED_ID,
  seededRng,
  storyFacts,
  type CacheEntry,
} from '@nexus/shared';
import { Bolt } from '../src/components/Bolt';
import { Icon } from '../src/components/Icon';
import { CacheBar, Dock, GoalBar, MapHud, glass } from '../src/components/MapUi';
import { CacheExplorer } from '../src/components/CacheExplorer';
import { CacheFiles } from '../src/components/CacheFiles';
import { StoryDialog } from '../src/components/StoryDialog';
import { cacheActionFor, cacheItems, cacheKey, structureView } from '../src/state/folders';
import { Dialog, Window } from '../src/components/Win';
import { Button, Pill, tap } from '../src/components/ui';
import { NetMap } from '../src/map/NetMap';
import type { Shard } from '../src/map/NodeViews';
import { pool } from '../src/services/content';
import { watchRewarded } from '../src/state/monetize';
import { getHint, takeDebrisReturn, takeRecentlySpawned } from '../src/state/session';
import { syncRankingQuietly } from '../src/state/ranking';
import { getState, today, update, useGame } from '../src/state/store';
import { useStrings } from '../src/strings';
import { colors } from '../src/theme';

export default function Home() {
  const router = useRouter();
  const t = useStrings();
  const area = (id: string) => areaName(id, t.lang);
  const network = useGame((p) => p.network);
  const cache = useGame((p) => p.cache);
  const archive = useGame((p) => p.archive);
  const gems = useGame((p) => p.gems);
  const firewalls = network.firewalls ?? [];
  const integrity = useGame((p) => p.integrity);
  const name = useGame((p) => p.profile.name);
  const [size, setSize] = useState({ width: 360, height: 640 });
  const [highlight, setHighlight] = useState<string[]>([]);
  const [focusKey, setFocusKey] = useState(0);
  const [focusId, setFocusId] = useState<string | undefined>();
  const [sel, setSel] = useState<string | null>(null);
  const [debrisId, setDebrisId] = useState<string | null>(null);
  const [shardId, setShardId] = useState<string | null>(null);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [cacheOpen, setCacheOpen] = useState(false);
  const [tip, setTip] = useState(true);
  const [unstable, setUnstable] = useState(false);
  const integrityVideo = rewardedOffer(getState(), 'integrity', today(), Date.now());
  // the shop shows a dot while today's bonus waits
  const dailyDue = useGame((p) => dailyBonusDue(p, today()));
  const [listOpen, setListOpen] = useState(false);
  const [firewallId, setFirewallId] = useState<string | null>(null);
  const [synapseId, setSynapseId] = useState<string | null>(null);
  const unlocked = useGame((p) => p.unlockedAreas);

  const nodes = useMemo(() => Object.values(network.nodes), [network]);
  // the walls the network has come close to (the others still hide in the fog)
  const synapses = network.synapses;
  const sight = useMemo(
    () => wallsInSight(nodes, network.firewalls ?? [], (synapses ?? []).flatMap((x) => (x.gap ? [x.gap] : []))),
    [nodes, network.firewalls, synapses],
  );
  // pairs of related areas that can be joined by a synapse (breadth pays)
  const spots = useMemo(() => synapseSpots(getState(), pool, today()), [network, unlocked]); // eslint-disable-line react-hooks/exhaustive-deps
  const due = dueReviews(getState(), today());
  const player = useGame((p) => p);
  const facts = useMemo(() => storyFacts(player, pool), [player]);
  const chapter = chapterOf(facts, t.lang);
  const unstableNow = isUnstable(player, today());
  const maintain = maintenanceTargets(player, today());
  // story beats wait until the map is on screen and nothing else is open
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      // everybody is on the ranking: register and report scores in the background (D57)
      syncRankingQuietly();
      return () => setFocused(false);
    }, []),
  );

  useEffect(() => {
    const tick = () =>
      update((p) => {
        const now = Date.now();
        const r = regenEnergy(p, now);
        return r === p ? null : r;
      });
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  // free band between the HUD on top and the panel below: a selected node is centred in it
  const [topEdge, setTopEdge] = useState(0);
  const [panelTop, setPanelTop] = useState<number | null>(null);
  const focusMidY = debrisId && panelTop !== null ? (topEdge + panelTop) / 2 : undefined;

  const focus = (id: string) => {
    setFocusId(id);
    setFocusKey((k) => k + 1);
  };

  // the panel appears after the tap and changes the free band: centre the node again
  useEffect(() => {
    if (debrisId && panelTop !== null) focus(debrisId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelTop, topEdge]);

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
        const timer = setTimeout(() => setHighlight([]), 6000);
        return () => clearTimeout(timer);
      }
      return undefined;
    }, []),
  );

  const debrisNode = debrisId ? network.nodes[debrisId] : undefined;
  const debrisQ = debrisNode ? pool.get(debrisNode.questionId) : undefined;
  const debrisColor = debrisQ ? colors.sector[sectorOfArea(debrisQ.area)] : colors.accent;

  // the pieces lying around the node: key fragments are always among them
  const field = useMemo(
    () =>
      debrisQ && debrisNode
        ? buildField(debrisQ, debrisNode.attempts)
        : [],
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
      // a piece counts as taken once it is filed or a file of it is carried
      taken: archiveHas(getState(), { questionId: debrisQ.id, fragmentId: f.id }) || cacheHasFolder(getState(), { questionId: debrisQ.id, fragmentId: f.id }),
    }));
  }, [field, debrisQ, debrisNode, cache, archive]);

  const shard = shardId ? field.find((f) => f.id === shardId) : undefined;
  const shardEntry: CacheEntry | null =
    shard && debrisQ ? { questionId: debrisQ.id, fragmentId: shard.id } : null;
  const filed = !!shardEntry && archiveHas(getState(), shardEntry);

  // the folder structure, grouped by topic area; free to read, order and delete on the map
  const structure = useMemo(() => structureView(getState()), [archive, t.lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const manageStructure = {
    onSwap: (a: number, b: number) => update((p) => archiveSwap(p, structure.entries[a]!, structure.entries[b]!)),
    onSort: () =>
      update((p) =>
        archiveReorder(
          p,
          [...structure.entries.keys()]
            .sort((a, b) => structure.folders[a]!.name.localeCompare(structure.folders[b]!.name, t.lang))
            .map((i) => structure.entries[i]!),
        ),
      ),
    onDelete: (i: number) => update((p) => archiveDrop(p, structure.entries[i]!)),
    onClear: () => update((p) => archiveClear(p)),
  };
  const addFile = (f: CacheEntry & { file: string }) => {
    tap('success');
    update((p) => cacheAddFile(p, pool, f));
  };
  const dropFile = (f: CacheEntry & { file: string }) => update((p) => cacheDropFile(p, f));
  const debrisFree = debrisQ ? cacheFreeSlots(getState(), pool, debrisQ.area) : 0;

  const firewall = firewallId ? firewalls.find((f) => f.id === firewallId) : undefined;
  const spot = synapseId ? spots.find((x) => x.id === synapseId) : undefined;
  const wallArea = firewall ? area(firewall.area) : '';
  const wallCost = firewall ? areaCost(firewall.area) : 0;

  const debrisProp = useMemo(
    () =>
      debrisNode
        ? { nodeId: debrisNode.id, center: snapToHex(debrisNode.pos.x, debrisNode.pos.y), color: debrisColor, shards }
        : undefined,
    [debrisNode, debrisColor, shards],
  );

  const selected = sel ? network.nodes[sel] : undefined;
  const selQ = selected ? pool.get(selected.questionId) : undefined;
  const openCount = nodes.filter((n) => n.state === 'open' && !n.locked).length;
  const hint = debrisId ? getHint(debrisId) : null;

  const busy = !!(debrisId || shard || explorerOpen || cacheOpen || firewall || spot || unstable || selected || listOpen);
  const beat = focused && !busy ? pendingBeats(player, pool)[0] : undefined;

  // after the finale the network shows what it really is (once; it can be replayed in the settings)
  const revealDue = focused && !busy && !beat && player.story.finale && !player.story.seen.includes(REVEAL_ID);
  useEffect(() => {
    if (revealDue) router.push('/brain');
  }, [revealDue]); // eslint-disable-line react-hooks/exhaustive-deps

  // the nodes as a list: the same actions as the map, readable by screen readers
  const listed = nodes
    .filter((n) => !n.locked && (n.state === 'open' || n.state === 'damaged'))
    .map((n) => ({ n, q: pool.get(n.questionId), dueNow: due.includes(n.id) }))
    .sort((a, b) => Number(b.dueNow) - Number(a.dueNow) || Number(a.n.state === 'damaged') - Number(b.n.state === 'damaged'));

  const startMaintenance = () => {
    if (maintain.length === 0) return;
    const id = maintain[Math.floor(seededRng(`maintain:${today()}:${maintain.length}`)() * maintain.length)]!;
    setUnstable(false);
    router.push({ pathname: '/node/[id]', params: { id, mode: 'maintain' } });
  };

  const onSelect = (id: string) => {
    tap();
    const n = network.nodes[id];
    if (!n) return;
    if (!n.locked && (n.state === 'open' || n.state === 'damaged')) {
      if (!canStartNode(getState(), id, today())) {
        setUnstable(true);
        return;
      }
      if (n.state === 'open' && debrisId !== id) update((p) => chooseNode(p, pool, id));
      setDebrisId(id);
      focus(id);
      setTip(false);
      return;
    }
    setSel(id);
  };

  const startQuestion = () => {
    if (!debrisId || !canStartNode(getState(), debrisId, today())) return;
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
        focusLift={debrisId ? 0.25 : 0}
        focusMidY={focusMidY}
        firewalls={firewalls}
        onFirewall={(id) => {
          tap();
          setFirewallId(id);
        }}
        synapses={synapses}
        spots={spots}
        onSynapse={(id) => {
          tap();
          setSynapseId(id);
        }}
        debris={debrisProp}
        onShard={(id) => {
          tap();
          setShardId(id);
        }}
        onDismiss={() => setDebrisId(null)}
        onSelect={onSelect}
      />

      <SafeAreaView
        edges={['top']}
        style={styles.top}
        pointerEvents="box-none"
        onLayout={(e) => setTopEdge(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}
      >
        <MapHud />
        {!debrisId ? (
          <GoalBar chapter={chapter} onFinale={() => router.push({ pathname: '/boss/[id]', params: { id: FINALE_ID } })} />
        ) : null}
        {unstableNow ? (
          <Pressable style={[styles.banner, styles.bannerBad]} onPress={() => setUnstable(true)} accessibilityRole="button">
            <View style={styles.bannerRow}>
              <Icon name="heart" size={18} />
              <Text style={[styles.bannerText, { color: colors.bad, flex: 1 }]}>
                {t.map.unstableBanner}
              </Text>
            </View>
          </Pressable>
        ) : null}
        {due.length > 0 ? (
          <Pressable
            style={styles.banner}
            onPress={() => onSelect(due[0]!)}
            accessibilityRole="button"
          >
            <View style={styles.bannerRow}>
              <Icon name="warn" size={18} />
              <Text style={[styles.bannerText, { flex: 1 }]}>
                {t.map.dueBanner(due.length)}
              </Text>
            </View>
          </Pressable>
        ) : null}
      </SafeAreaView>

      {tip && !debrisId ? (
        <Pressable style={[styles.tip, glass]} onPress={() => setTip(false)} accessibilityLabel={t.map.closeTip}>
          <Bolt size={52} mood={openCount > 0 ? 'happy' : 'think'} />
          <Text style={styles.tipText}>{t.map.tip(name, CACHE_FILES_PER_AREA)}</Text>
        </Pressable>
      ) : null}

      <SafeAreaView
        edges={['bottom']}
        style={styles.bottom}
        pointerEvents="box-none"
        onLayout={(e) => setPanelTop(e.nativeEvent.layout.y)}
      >
        <View style={styles.stack} pointerEvents="box-none">
          {debrisNode && debrisQ ? (
            <Window title={debrisQ.topic} icon="folder" onClose={() => setDebrisId(null)}>
              <View style={styles.row}>
                <Pill label={area(debrisQ.area)} color={debrisColor} />
                <Pill label={t.difficulty[debrisQ.difficulty]!} color={colors.warn} />
              </View>
              {debrisQ.intro ? <Text style={styles.debrisText}>{debrisQ.intro}</Text> : null}
              {hint ? <Text style={styles.debrisHint}>{t.map.boltHint(hint)}</Text> : null}
              <View style={styles.row}>
                <Button label={t.common.back} variant="ghost" style={{ flex: 1 }} onPress={() => setDebrisId(null)} />
                <Button
                  label={debrisNode.state === 'damaged' ? t.map.repair : t.map.startQuestion}
                  sub={t.map.startSub}
                  style={{ flex: 2 }}
                  onPress={startQuestion}
                />
              </View>
            </Window>
          ) : null}
          <CacheBar
            onFolders={() => setExplorerOpen(true)}
            onCache={() => setCacheOpen(true)}
            cacheLabel={
              debrisQ ? `${CACHE_FILES_PER_AREA - debrisFree}/${CACHE_FILES_PER_AREA} ${area(debrisQ.area)}` : undefined
            }
          />
          {!debrisNode ? (
            <Dock
              items={[
                { label: t.dock.codex, icon: 'book', onPress: () => router.push('/codex') },
                { label: t.dock.shop, icon: 'gem', tint: colors.gem, badge: dailyDue, onPress: () => router.push('/shop') },
                { label: t.dock.nodes, icon: 'shard', onPress: () => setListOpen(true) },
                // the ranking shows once morph.ai is beaten; right after the reveal its button glows
                ...(leagueUnlocked(player)
                  ? [
                      {
                        label: t.dock.league,
                        icon: 'trophy' as const,
                        glow: leagueIsNew(player),
                        onPress: () => {
                          update((p) => markSeen(p, LEAGUE_NOTICED_ID));
                          router.push('/league');
                        },
                      },
                    ]
                  : []),
                { label: t.dock.profile, icon: 'user', onPress: () => router.push('/profile') },
              ]}
            />
          ) : null}
        </View>
      </SafeAreaView>

      {/* a piece of debris: its folder opens right away, so the player reads before deciding (D48) */}
      <Modal transparent animationType="fade" visible={!!shard} onRequestClose={() => setShardId(null)}>
        <Pressable style={styles.center} onPress={() => setShardId(null)}>
          <Pressable onPress={() => undefined}>
            {shard && shardEntry && debrisQ ? (
              <CacheExplorer
                key={shard.id}
                folders={[{ name: shard.hint, files: fragmentFiles(shard) }]}
                root={t.map.debrisRoot}
                single
                onClose={() => setShardId(null)}
                fileAction={(_, i) =>
                  cacheActionFor(getState(), t, shardEntry, debrisQ.area, fragmentFiles(shard)[i]!.name, addFile, dropFile)
                }
                fileTag={(_, i) =>
                  cacheHasFile(getState(), { ...shardEntry, file: fragmentFiles(shard)[i]!.name }) ? t.map.inCache : undefined
                }
                actions={
                  <>
                    <Text style={styles.winNote}>{t.map.shardNote(CACHE_FILES_PER_AREA)}</Text>
                    {filed ? (
                      <Button
                        label={t.map.unfile}
                        variant="ghost"
                        onPress={() => update((p) => archiveDrop(p, shardEntry))}
                      />
                    ) : (
                      <Button
                        label={t.map.file}
                        onPress={() => {
                          tap('success');
                          update((p) => archiveAdd(p, shardEntry));
                        }}
                      />
                    )}
                  </>
                }
              />
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      {/* the folder structure: free to open, order and search on the map */}
      <Modal transparent animationType="fade" visible={explorerOpen} onRequestClose={() => setExplorerOpen(false)}>
        <Pressable style={styles.center} onPress={() => setExplorerOpen(false)}>
          <Pressable onPress={() => undefined}>
            <CacheExplorer
              folders={structure.folders}
              manage={manageStructure}
              onClose={() => setExplorerOpen(false)}
              fileAction={(f, i) =>
                cacheActionFor(
                  getState(),
                  t,
                  structure.entries[f]!,
                  structure.areas[f]!,
                  structure.folders[f]!.files[i]!.name,
                  addFile,
                  dropFile,
                )
              }
              fileTag={(f, i) =>
                cacheHasFile(getState(), { ...structure.entries[f]!, file: structure.folders[f]!.files[i]!.name })
                  ? t.map.inCache
                  : undefined
              }
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* the cache: a few files per topic */}
      <Modal transparent animationType="fade" visible={cacheOpen} onRequestClose={() => setCacheOpen(false)}>
        <Pressable style={styles.center} onPress={() => setCacheOpen(false)}>
          <Pressable onPress={() => undefined}>
            <CacheFiles
              items={cacheItems(getState())}
              note={t.map.cacheNote(CACHE_FILES_PER_AREA)}
              onRemove={(key) => {
                const hit = getState().cache.find((c) => cacheKey(c) === key);
                if (hit) dropFile(hit);
              }}
              onClose={() => setCacheOpen(false)}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* a firewall (boss) */}
      <Modal transparent animationType="fade" visible={!!firewall} onRequestClose={() => setFirewallId(null)}>
        <Pressable style={styles.center} onPress={() => setFirewallId(null)}>
          <Dialog title={t.map.firewall} icon="warn" onClose={() => setFirewallId(null)}>
            {firewall ? (
              <>
                <Text style={styles.topic}>{wallArea}</Text>
                {firewall.broken ? (
                  <Text style={styles.fragText}>{t.map.wallBroken(wallArea)}</Text>
                ) : !firewallReached(nodes, firewall) ? (
                  // the network has to grow right up to the wall first
                  <Text style={styles.fragText}>{t.map.wallFar(wallArea, firewallSteps(nodes, firewall))}</Text>
                ) : (
                  <>
                    <Text style={styles.fragText}>
                      {t.map.wallText(BOSS_QUESTIONS, area(fightFrom(pool, nodes, firewall)), wallArea, BOSS_PASS)}
                    </Text>
                    <Text style={styles.cardSub}>
                      {t.map.wallReward(BOSS_REWARD.gems, BOSS_REWARD.bits, BOSS_REWARD.xp, wallArea)}
                    </Text>
                    <Button
                      label={integrity === 0 ? t.map.unstable : t.map.attack}
                      disabled={integrity === 0}
                      onPress={() => {
                        const id = firewall.id;
                        setFirewallId(null);
                        router.push({ pathname: '/boss/[id]', params: { id } });
                      }}
                    />
                  </>
                )}
                {!firewall.broken ? (
                  // as with every area, gems open it at once (the story only counts fights)
                  <Button
                    variant="gem"
                    label={t.map.openNow(wallCost)}
                    icon="gem"
                    sub={t.common.youHaveGems(gems)}
                    disabled={gems < wallCost}
                    onPress={() => {
                      const area = firewall.area;
                      update((p) => unlockArea(p, area, pool));
                      setFirewallId(null);
                    }}
                  />
                ) : null}
                <Button label={t.common.close} variant="ghost" onPress={() => setFirewallId(null)} />
              </>
            ) : null}
          </Dialog>
        </Pressable>
      </Modal>

      {/* a synapse that can be joined */}
      <Modal transparent animationType="fade" visible={!!spot} onRequestClose={() => setSynapseId(null)}>
        <Pressable style={styles.center} onPress={() => setSynapseId(null)}>
          <Dialog title={t.map.synapse} icon="spark" onClose={() => setSynapseId(null)}>
            {spot ? (
              <>
                <Text style={styles.topic}>
                  {area(spot.a)} + {area(spot.b)}
                </Text>
                <Text style={styles.fragText}>{t.map.synapseText(area(spot.a), area(spot.b), SYNAPSE_QUESTIONS, SYNAPSE_PASS)}</Text>
                <Text style={styles.cardSub}>
                  {t.map.synapseReward(SYNAPSE_REWARD.xp, SYNAPSE_REWARD.bits, SYNAPSE_REWARD.gems, Math.round(SYNAPSE_BONUS * 100))}
                </Text>
                {spot.resting ? (
                  <Text style={styles.fragText}>{t.map.synapseResting}</Text>
                ) : (
                  <Button
                    label={t.map.connect}
                    onPress={() => {
                      const id = spot.id;
                      setSynapseId(null);
                      router.push({ pathname: '/boss/[id]', params: { id } });
                    }}
                  />
                )}
                <Button label={t.common.close} variant="ghost" onPress={() => setSynapseId(null)} />
              </>
            ) : null}
          </Dialog>
        </Pressable>
      </Modal>

      {/* integrity 0: the network is unstable */}
      <Modal transparent animationType="fade" visible={unstable} onRequestClose={() => setUnstable(false)}>
        <Pressable style={styles.center} onPress={() => setUnstable(false)}>
          <Dialog title={t.map.unstable} icon="warn" onClose={() => setUnstable(false)}>
            <Text style={styles.fragText}>{t.map.unstableText}</Text>
            {maintain.length > 0 ? (
              <Button
                label={t.map.startMaintenance}
                sub={t.map.maintenanceSub(maintain.length)}
                onPress={startMaintenance}
              />
            ) : null}
            {integrityVideo.left > 0 ? (
              <Button
                label={integrityVideo.instant ? t.map.integrityPlus : t.map.watchVideo}
                sub={t.map.leftToday(integrityVideo.left)}
                variant="ghost"
                onPress={() => void watchRewarded('integrity')}
              />
            ) : null}
            <Button
              variant="gem"
              label={t.map.heal(HEAL_COST)}
              icon="gem"
              sub={t.common.youHaveGems(gems)}
              disabled={gems < HEAL_COST || integrity >= 5}
              onPress={() => {
                update((p) => healIntegrity(p));
                setUnstable(false);
              }}
            />
            <Button label={t.common.close} onPress={() => setUnstable(false)} />
          </Dialog>
        </Pressable>
      </Modal>

      {/* the node list (dock → "Knoten"): the map's actions for screen readers and small screens */}
      <Modal transparent animationType="slide" visible={listOpen} onRequestClose={() => setListOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setListOpen(false)}>
          <Dialog title={t.map.listTitle(listed.length)} icon="shard" onClose={() => setListOpen(false)}>
            <ScrollView style={{ maxHeight: size.height * 0.6 }} contentContainerStyle={{ gap: 6 }}>
              {chapter.finale ? (
                <Button
                  label={t.map.finaleButton}
                  onPress={() => {
                    setListOpen(false);
                    router.push({ pathname: '/boss/[id]', params: { id: FINALE_ID } });
                  }}
                />
              ) : null}
              {listed.map(({ n, q, dueNow }) => {
                const status = n.state === 'open' ? t.map.statusOpen : dueNow ? t.map.statusDue : t.map.statusDamaged;
                return (
                  <Pressable
                    key={n.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${q.topic}, ${area(q.area)}, ${status}`}
                    onPress={() => {
                      setListOpen(false);
                      onSelect(n.id);
                    }}
                    style={({ pressed }) => [styles.listRow, pressed && { opacity: 0.6 }]}
                  >
                    <View style={[styles.listDot, { backgroundColor: colors.sector[sectorOfArea(q.area)] }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listTopic}>{q.topic}</Text>
                      <Text style={styles.listSub}>
                        {area(q.area)} · {status}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
              {/* synapses that can be joined, like on the map */}
              {spots.map((x) => (
                <Pressable
                  key={x.id}
                  accessibilityRole="button"
                  accessibilityLabel={t.map.synapseA11y(area(x.a), area(x.b), x.resting)}
                  onPress={() => {
                    setListOpen(false);
                    setSynapseId(x.id);
                  }}
                  style={({ pressed }) => [styles.listRow, pressed && { opacity: 0.6 }]}
                >
                  <Icon name="spark" size={16} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTopic}>{t.map.synapse}</Text>
                    <Text style={styles.listSub}>
                      {area(x.a)} + {area(x.b)} · {t.map.synapseState(x.resting)}
                    </Text>
                  </View>
                </Pressable>
              ))}
              {/* the firewalls in sight, like on the map */}
              {sight.signs.map((sign) => (
                <Pressable
                  key={sign.firewall}
                  accessibilityRole="button"
                  accessibilityLabel={t.map.wallA11y(area(sign.area), sign.reached ? t.map.reached : t.map.notReached)}
                  onPress={() => {
                    setListOpen(false);
                    setFirewallId(sign.firewall);
                  }}
                  style={({ pressed }) => [styles.listRow, pressed && { opacity: 0.6 }]}
                >
                  <Icon name="warn" size={16} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTopic}>{t.map.firewall}</Text>
                    <Text style={styles.listSub}>
                      {area(sign.area)} ·{' '}
                      {sign.reached ? t.map.reached : t.map.stepsLeft(firewallSteps(nodes, firewalls.find((f) => f.id === sign.firewall)!))}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
            <Button label={t.common.close} variant="ghost" onPress={() => setListOpen(false)} />
          </Dialog>
        </Pressable>
      </Modal>

      <StoryDialog beat={beat} onDone={() => beat && update((p) => markSeen(p, beat.id))} />

      {/* locked debris field or an already restored node */}
      <Modal transparent animationType="slide" visible={!!selected} onRequestClose={() => setSel(null)}>
        <Pressable style={styles.backdrop} onPress={() => setSel(null)}>
          <Dialog title={selQ ? area(selQ.area) : ''} icon="folder" onClose={() => setSel(null)}>
            {selected && selQ ? (
              <>
                <View style={styles.row}>
                  <Pill label={t.sectorsShort[sectorOfArea(selQ.area)]} color={colors.sector[sectorOfArea(selQ.area)]} />
                  <Pill label={t.kinds[selected.kind]} color={colors.dim} />
                </View>
                {selected.locked ? (
                  <>
                    <Text style={styles.sheetText}>{t.map.lockedDebris}</Text>
                    <Button
                      variant="gem"
                      label={t.map.openFor(DEBRIS_COST)}
                      sub={t.common.youHaveGems(gems)}
                      disabled={gems < DEBRIS_COST}
                      onPress={() => update((p) => openDebris(p, selected.id))}
                    />
                    {gems < DEBRIS_COST ? (
                      <Button
                        label={t.map.toShop}
                        variant="ghost"
                        onPress={() => {
                          setSel(null);
                          router.push('/shop');
                        }}
                      />
                    ) : null}
                  </>
                ) : (
                  <Text style={styles.sheetText}>{t.map.restored}</Text>
                )}
                <Button label={t.common.close} variant="ghost" onPress={() => setSel(null)} />
              </>
            ) : null}
          </Dialog>
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
  bannerBad: { backgroundColor: 'rgba(58,16,16,0.92)', borderColor: colors.bad },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bannerText: { color: colors.warn, fontWeight: '700' },
  topicLabel: { color: colors.dim, fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginTop: 2 },
  topic: { color: colors.text, fontSize: 22, fontWeight: '900' },
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
  debrisHint: { color: colors.dim, fontSize: 12, lineHeight: 17 },
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
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end', padding: 12 },
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
  // dark text on the grey face of a light window
  winNote: { color: '#404040', fontSize: 13, lineHeight: 18 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, paddingVertical: 4 },
  listDot: { width: 12, height: 12 },
  listTopic: { color: colors.text, fontSize: 15, fontWeight: '800' },
  listSub: { color: colors.dim, fontSize: 12 },
});
