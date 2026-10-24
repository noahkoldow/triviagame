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
  areaById,
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
  firewallReached,
  firewallSteps,
  leagueIsNew,
  leagueUnlocked,
  LEAGUE_NOTICED_ID,
  rollWeek,
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
import { ads } from '../src/services/ads';
import { pool } from '../src/services/content';
import { getHint, takeDebrisReturn, takeRecentlySpawned } from '../src/state/session';
import { getState, today, update, useGame } from '../src/state/store';
import { de } from '../src/strings';
import { colors } from '../src/theme';

export default function Home() {
  const router = useRouter();
  const network = useGame((p) => p.network);
  const cache = useGame((p) => p.cache);
  const archive = useGame((p) => p.archive);
  const gems = useGame((p) => p.gems);
  const outposts = network.outposts ?? [];
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
  const [outpostId, setOutpostId] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [firewallId, setFirewallId] = useState<string | null>(null);

  const nodes = useMemo(() => Object.values(network.nodes), [network]);
  const due = dueReviews(getState(), today());
  const player = useGame((p) => p);
  const facts = useMemo(() => storyFacts(player, pool), [player]);
  const chapter = chapterOf(facts);
  const unstableNow = isUnstable(player, today());
  const maintain = maintenanceTargets(player, today());
  // story beats wait until the map is on screen and nothing else is open
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  useEffect(() => {
    const tick = () =>
      update((p) => {
        const now = Date.now();
        const r = rollWeek(regenEnergy(p, now), now);
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
  const structure = useMemo(() => structureView(getState()), [archive]);
  const manageStructure = {
    onSwap: (a: number, b: number) => update((p) => archiveSwap(p, structure.entries[a]!, structure.entries[b]!)),
    onSort: () =>
      update((p) =>
        archiveReorder(
          p,
          [...structure.entries.keys()]
            .sort((a, b) => structure.folders[a]!.name.localeCompare(structure.folders[b]!.name, 'de'))
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

  const outpost = outpostId ? outposts.find((o) => o.id === outpostId && !o.connected) : undefined;
  const outpostSteps = outpost
    ? Math.max(
        1,
        Math.round(
          Math.min(
            ...nodes
              .filter((n) => !n.locked)
              .map((n) => Math.hypot(n.pos.x - outpost.x, n.pos.y - outpost.y)),
          ) / 110,
        ),
      )
    : 0;
  const outpostCost = outpost ? areaCost(outpost.area) : 0;
  const firewall = firewallId ? firewalls.find((f) => f.id === firewallId) : undefined;

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

  const busy = !!(debrisId || shard || explorerOpen || cacheOpen || firewall || outpost || unstable || selected || listOpen);
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
        outposts={outposts}
        firewalls={firewalls}
        onFirewall={(id) => {
          tap();
          setFirewallId(id);
        }}
        onOutpost={(id) => {
          tap();
          setOutpostId(id);
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
                Netz instabil: neue Knoten warten. Tippe hier für eine Wartung.
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
                {due.length} beschädigte{due.length > 1 ? ' Knoten' : 'r Knoten'} zur Reparatur fällig
              </Text>
            </View>
          </Pressable>
        ) : null}
      </SafeAreaView>

      {tip && !debrisId ? (
        <Pressable style={[styles.tip, glass]} onPress={() => setTip(false)} accessibilityLabel="Tipp von Bolt schließen">
          <Bolt size={52} mood={openCount > 0 ? 'happy' : 'think'} />
          <Text style={styles.tipText}>
            {name ? `${name}, ` : ''}
            tippe einen leuchtenden Knoten an. Um ihn liegen lose Ordner: Lies sie, leg Nützliches in deine Ordner ab und nimm bis zu {CACHE_FILES_PER_AREA} Dateien pro Thema in den Cache. In der Frage ist der Cache gratis, deine Ordner kosten Blitze.
          </Text>
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
                <Pill label={areaById(debrisQ.area).de} color={debrisColor} />
                <Pill label={de.difficulty[debrisQ.difficulty]!} color={colors.warn} />
              </View>
              {debrisQ.intro ? <Text style={styles.debrisText}>{debrisQ.intro}</Text> : null}
              {hint ? <Text style={styles.debrisHint}>Bolt: {hint}</Text> : null}
              <View style={styles.row}>
                <Button label="Zurück" variant="ghost" style={{ flex: 1 }} onPress={() => setDebrisId(null)} />
                <Button
                  label={debrisNode.state === 'damaged' ? 'Reparieren' : 'Frage starten'}
                  sub="In der Frage: Cache gratis, Ordner kosten ⚡"
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
              debrisQ ? `${CACHE_FILES_PER_AREA - debrisFree}/${CACHE_FILES_PER_AREA} ${areaById(debrisQ.area).de}` : undefined
            }
          />
          {!debrisNode ? (
            <Dock
              items={[
                { label: 'Codex', icon: 'book', onPress: () => router.push('/codex') },
                { label: 'Shop', icon: 'gem', tint: colors.gem, onPress: () => router.push('/shop') },
                { label: 'Knoten', icon: 'shard', onPress: () => setListOpen(true) },
                // the league opens once morph.ai is beaten; right after the reveal its button glows
                ...(leagueUnlocked(player)
                  ? [
                      {
                        label: 'Liga',
                        icon: 'trophy' as const,
                        glow: leagueIsNew(player),
                        onPress: () => {
                          update((p) => markSeen(p, LEAGUE_NOTICED_ID));
                          router.push('/league');
                        },
                      },
                    ]
                  : []),
                { label: 'Profil', icon: 'user', onPress: () => router.push('/profile') },
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
                root="Trümmerfeld"
                single
                closeLabel="Schließen"
                onClose={() => setShardId(null)}
                fileAction={(_, i) =>
                  cacheActionFor(getState(), shardEntry, debrisQ.area, fragmentFiles(shard)[i]!.name, addFile, dropFile)
                }
                fileTag={(_, i) =>
                  cacheHasFile(getState(), { ...shardEntry, file: fragmentFiles(shard)[i]!.name }) ? 'im Cache' : undefined
                }
                actions={
                  <>
                    <Text style={styles.winNote}>
                      Öffne eine Datei, um sie in den Cache zu nehmen ({CACHE_FILES_PER_AREA} pro Thema, in der Frage gratis).
                      Den ganzen Ordner legst du in deinen Ordnern ab; die kosten in der Frage Blitze.
                    </Text>
                    {filed ? (
                      <Button
                        label="Aus meinen Ordnern nehmen"
                        variant="ghost"
                        onPress={() => update((p) => archiveDrop(p, shardEntry))}
                      />
                    ) : (
                      <Button
                        label="In meinen Ordnern ablegen"
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
                  structure.entries[f]!,
                  structure.areas[f]!,
                  structure.folders[f]!.files[i]!.name,
                  addFile,
                  dropFile,
                )
              }
              fileTag={(f, i) =>
                cacheHasFile(getState(), { ...structure.entries[f]!, file: structure.folders[f]!.files[i]!.name })
                  ? 'im Cache'
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
              note={`Bis zu ${CACHE_FILES_PER_AREA} Dateien pro Themengebiet. In einer Frage öffnest du die Dateien ihres Gebiets gratis; nach dem Versuch ist dieser Teil des Caches wieder leer.`}
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
          <Dialog title="Firewall" icon="warn" onClose={() => setFirewallId(null)}>
            {firewall ? (
              <>
                <Text style={styles.topic}>
                  {de.sectorsShort[firewall.a]} × {de.sectorsShort[firewall.b]}
                </Text>
                {firewall.broken ? (
                  <Text style={styles.fragText}>Diese Firewall ist gebrochen. Dahinter liegt die neue Zone.</Text>
                ) : !firewallReached(nodes, firewall) ? (
                  // the network has to grow there first
                  <Text style={styles.fragText}>
                    Noch außer Reichweite. morph.ai hat diese Firewall an der Grenze zwischen {de.sectorsShort[firewall.a]} und{' '}
                    {de.sectorsShort[firewall.b]} errichtet. Wachse bis hierher: Brücken in diesen Sektoren neigen sich zur
                    Firewall. Entfernung: etwa {firewallSteps(nodes, firewall)} Schritte.
                  </Text>
                ) : (
                  <>
                    <Text style={styles.fragText}>
                      morph.ai hat hier eine Firewall errichtet. Um sie zu brechen, beantwortest du {BOSS_QUESTIONS} Fragen, je
                      zur Hälfte aus beiden Sektoren. {BOSS_PASS} müssen stimmen. Es gibt keinen Cache, nur dein Wissen.
                    </Text>
                    <Text style={styles.cardSub}>
                      Belohnung: {BOSS_REWARD.gems} Gems, {BOSS_REWARD.bits} Bits, {BOSS_REWARD.xp} XP und je ein Außenposten dieser beiden
                      Sektoren wird verbunden.
                    </Text>
                    <Button
                      label={integrity === 0 ? 'Netz instabil' : 'Angreifen'}
                      disabled={integrity === 0}
                      onPress={() => {
                        const id = firewall.id;
                        setFirewallId(null);
                        router.push({ pathname: '/boss/[id]', params: { id } });
                      }}
                    />
                  </>
                )}
                <Button label="Schließen" variant="ghost" onPress={() => setFirewallId(null)} />
              </>
            ) : null}
          </Dialog>
        </Pressable>
      </Modal>

      {/* a disturbed outpost */}
      <Modal transparent animationType="fade" visible={!!outpost} onRequestClose={() => setOutpostId(null)}>
        <Pressable style={styles.center} onPress={() => setOutpostId(null)}>
          <Dialog title="Gestörter Bereich" icon="warn" onClose={() => setOutpostId(null)}>
            {outpost ? (
              <>
                <Text style={styles.topic}>{areaById(outpost.area).de}</Text>
                <Text style={styles.fragText}>
                  Dieser Bereich ist noch vom Rauschen verzerrt. Wachse in seine Richtung: Die Fragen auf dem Weg
                  nähern sich seinem Thema, und sobald dein Netz ihn erreicht, ist er verbunden. Entfernung: etwa{' '}
                  {outpostSteps} Schritte.
                </Text>
                <Button
                  variant="gem"
                  label={`Sofort verbinden · ${outpostCost}`}
                  icon="gem"
                  sub={`Du hast ${gems} Gems`}
                  disabled={gems < outpostCost}
                  onPress={() => {
                    const id = outpost.area;
                    update((p) => unlockArea(p, id, pool));
                    setOutpostId(null);
                  }}
                />
                <Button label="Schließen" onPress={() => setOutpostId(null)} />
              </>
            ) : null}
          </Dialog>
        </Pressable>
      </Modal>

      {/* integrity 0: the network is unstable */}
      <Modal transparent animationType="fade" visible={unstable} onRequestClose={() => setUnstable(false)}>
        <Pressable style={styles.center} onPress={() => setUnstable(false)}>
          <Dialog title="Netz instabil" icon="warn" onClose={() => setUnstable(false)}>
            <Text style={styles.fragText}>
              Zu viele Störungen: Neue Knoten warten. Mach eine Wartung: Beantworte eine schon gelöste Frage aus dem
              Gedächtnis, ohne Cache. Jede gelungene Wartung oder fällige Reparatur gibt 1 Integrität zurück.
            </Text>
            {maintain.length > 0 ? (
              <Button
                label="Wartung starten"
                sub={`Heute noch an ${maintain.length} Knoten möglich, je Knoten einmal am Tag`}
                onPress={startMaintenance}
              />
            ) : null}
            <Button
              label="Video ansehen: +1 Integrität"
              variant="ghost"
              onPress={async () => {
                const s = getState();
                const ok = await ads.showRewarded({ personalized: s.profile.ageGroup === 'adult' && s.profile.consent });
                if (ok) update((p) => ({ ...p, integrity: Math.min(5, p.integrity + 1) }));
              }}
            />
            <Button
              variant="gem"
              label={`Netz heilen · ${HEAL_COST}`}
              icon="gem"
              sub={`Du hast ${gems} Gems`}
              disabled={gems < HEAL_COST || integrity >= 5}
              onPress={() => {
                update((p) => healIntegrity(p));
                setUnstable(false);
              }}
            />
            <Button label="Schließen" onPress={() => setUnstable(false)} />
          </Dialog>
        </Pressable>
      </Modal>

      {/* the node list (dock → "Knoten"): the map's actions for screen readers and small screens */}
      <Modal transparent animationType="slide" visible={listOpen} onRequestClose={() => setListOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setListOpen(false)}>
          <Dialog title={`Knoten (${listed.length})`} icon="shard" onClose={() => setListOpen(false)}>
            <ScrollView style={{ maxHeight: size.height * 0.6 }} contentContainerStyle={{ gap: 6 }}>
              {chapter.finale ? (
                <Button
                  label="Finale: morph.ai im Kern stellen"
                  onPress={() => {
                    setListOpen(false);
                    router.push({ pathname: '/boss/[id]', params: { id: FINALE_ID } });
                  }}
                />
              ) : null}
              {listed.map(({ n, q, dueNow }) => {
                const status = n.state === 'open' ? 'offen' : dueNow ? 'Reparatur fällig' : 'beschädigt';
                return (
                  <Pressable
                    key={n.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${q.topic}, ${areaById(q.area).de}, ${status}`}
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
                        {areaById(q.area).de} · {status}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
              {firewalls
                .filter((f) => !f.broken)
                .map((f) => (
                  <Pressable
                    key={f.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Firewall ${de.sectors[f.a]} und ${de.sectors[f.b]}, ${
                      firewallReached(nodes, f) ? 'erreicht' : 'noch nicht erreicht'
                    }`}
                    onPress={() => {
                      setListOpen(false);
                      setFirewallId(f.id);
                    }}
                    style={({ pressed }) => [styles.listRow, pressed && { opacity: 0.6 }]}
                  >
                    <Icon name="warn" size={16} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listTopic}>Firewall</Text>
                      <Text style={styles.listSub}>
                        {de.sectorsShort[f.a]} × {de.sectorsShort[f.b]} ·{' '}
                        {firewallReached(nodes, f) ? 'erreicht' : `noch etwa ${firewallSteps(nodes, f)} Schritte`}
                      </Text>
                    </View>
                  </Pressable>
                ))}
            </ScrollView>
            <Button label="Schließen" variant="ghost" onPress={() => setListOpen(false)} />
          </Dialog>
        </Pressable>
      </Modal>

      <StoryDialog beat={beat} onDone={() => beat && update((p) => markSeen(p, beat.id))} />

      {/* locked debris field or an already restored node */}
      <Modal transparent animationType="slide" visible={!!selected} onRequestClose={() => setSel(null)}>
        <Pressable style={styles.backdrop} onPress={() => setSel(null)}>
          <Dialog title={selQ ? areaById(selQ.area).de : ''} icon="folder" onClose={() => setSel(null)}>
            {selected && selQ ? (
              <>
                <View style={styles.row}>
                  <Pill label={de.sectorsShort[sectorOfArea(selQ.area)]} color={colors.sector[sectorOfArea(selQ.area)]} />
                  <Pill label={de.kinds[selected.kind]} color={colors.dim} />
                </View>
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
