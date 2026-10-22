import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEBRIS_COST, areaById, dueReviews, openDebris, sectorOfArea } from '@nexus/shared';
import { Bolt } from '../src/components/Bolt';
import { Hud } from '../src/components/Hud';
import { Button, Pill, tap } from '../src/components/ui';
import { NetMap } from '../src/map/NetMap';
import { pool } from '../src/services/content';
import { takeRecentlySpawned } from '../src/state/session';
import { getState, today, update, useGame } from '../src/state/store';
import { de } from '../src/strings';
import { colors } from '../src/theme';

export default function Home() {
  const router = useRouter();
  const network = useGame((p) => p.network);
  const gems = useGame((p) => p.gems);
  const name = useGame((p) => p.profile.name);
  const [size, setSize] = useState({ width: 360, height: 640 });
  const [highlight, setHighlight] = useState<string[]>([]);
  const [focusKey, setFocusKey] = useState(0);
  const [focusId, setFocusId] = useState<string | undefined>();
  const [sel, setSel] = useState<string | null>(null);
  const [tip, setTip] = useState(true);

  const nodes = useMemo(() => Object.values(network.nodes), [network]);
  const due = dueReviews(getState(), today());

  useFocusEffect(
    useCallback(() => {
      const spawned = takeRecentlySpawned();
      if (spawned.length) {
        setHighlight(spawned);
        setFocusId(spawned[0]);
        setFocusKey((k) => k + 1);
        const t = setTimeout(() => setHighlight([]), 6000);
        return () => clearTimeout(t);
      }
      return undefined;
    }, []),
  );

  const selected = sel ? network.nodes[sel] : undefined;
  const selQ = selected ? pool.get(selected.questionId) : undefined;
  const openCount = nodes.filter((n) => n.state === 'open' && !n.locked).length;

  const onSelect = (id: string) => {
    tap();
    setSel(id);
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
        onSelect={onSelect}
      />

      <SafeAreaView edges={['top']} style={styles.top} pointerEvents="box-none">
        <View style={styles.hud}>
          <Hud />
        </View>
        {due.length > 0 ? (
          <Pressable
            style={styles.banner}
            onPress={() => router.push({ pathname: '/node/[id]', params: { id: due[0]! } })}
            accessibilityRole="button"
          >
            <Text style={styles.bannerText}>
              ⚠ {due.length} beschädigte{due.length > 1 ? ' Knoten' : 'r Knoten'} zur Reparatur
              fällig
            </Text>
          </Pressable>
        ) : null}
      </SafeAreaView>

      {tip ? (
        <Pressable
          style={styles.tip}
          onPress={() => setTip(false)}
          accessibilityLabel="Tipp von Bolt schließen"
        >
          <Bolt size={54} mood={openCount > 0 ? 'happy' : 'think'} />
          <View style={{ flex: 1 }}>
            <Text style={styles.tipText}>
              {name ? `${name}, ` : ''}
              tippe einen leuchtenden Knoten an. Ziehen = verschieben, zwei Finger = zoomen.
            </Text>
          </View>
        </Pressable>
      ) : null}

      <SafeAreaView edges={['bottom']} style={styles.bottom} pointerEvents="box-none">
        <View style={styles.nav}>
          <Button
            label="Codex"
            variant="ghost"
            style={styles.navBtn}
            onPress={() => router.push('/codex')}
          />
          <Button
            label="Shop"
            variant="gem"
            style={styles.navBtn}
            onPress={() => router.push('/shop')}
          />
          <Button
            label="Profil"
            variant="ghost"
            style={styles.navBtn}
            onPress={() => router.push('/profile')}
          />
        </View>
      </SafeAreaView>

      <Modal
        transparent
        animationType="slide"
        visible={!!selected}
        onRequestClose={() => setSel(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setSel(null)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            {selected && selQ ? (
              <>
                <View style={styles.sheetRow}>
                  <Pill
                    label={de.sectors[sectorOfArea(selQ.area)]}
                    color={colors.sector[sectorOfArea(selQ.area)]}
                  />
                  <Pill label={de.kinds[selected.kind]} color={colors.dim} />
                  <Pill label={de.difficulty[selQ.difficulty]!} color={colors.warn} />
                </View>
                <Text style={styles.sheetTitle}>{areaById(selQ.area).de}</Text>
                {selected.locked ? (
                  <>
                    <Text style={styles.sheetText}>
                      Ein verschlüsseltes Trümmerfeld mit seltenen Fragmenten und dreifachen Bits.
                      Öffne es mit Gems.
                    </Text>
                    <Button
                      variant="gem"
                      label={`Öffnen für ${DEBRIS_COST} Gems`}
                      sub={`Du hast ${gems} Gems`}
                      disabled={gems < DEBRIS_COST}
                      onPress={() => {
                        update((p) => openDebris(p, selected.id));
                      }}
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
                ) : selected.state === 'open' ? (
                  <>
                    <Text style={styles.sheetText}>
                      Sammle Fragmente aus den Trümmern, merke sie dir und beantworte danach die
                      Frage.
                    </Text>
                    <Button
                      label="Knoten betreten"
                      onPress={() => {
                        setSel(null);
                        router.push({ pathname: '/node/[id]', params: { id: selected.id } });
                      }}
                    />
                  </>
                ) : selected.state === 'damaged' ? (
                  <>
                    <Text style={styles.sheetText}>
                      Dieser Knoten war wackelig. Eine Reparatur-Frage festigt dein Wissen.
                    </Text>
                    <Button
                      label="Reparieren"
                      onPress={() => {
                        setSel(null);
                        router.push({ pathname: '/node/[id]', params: { id: selected.id } });
                      }}
                    />
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
  top: { position: 'absolute', top: 0, left: 0, right: 0 },
  hud: {
    marginHorizontal: 12,
    marginTop: 6,
    padding: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(7,11,22,0.78)',
    borderWidth: 1,
    borderColor: colors.line,
  },
  banner: {
    marginHorizontal: 12,
    marginTop: 8,
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#3B2A07',
    borderWidth: 1,
    borderColor: colors.warn,
  },
  bannerText: { color: colors.warn, fontWeight: '700' },
  tip: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 96,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(16,24,39,0.94)',
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tipText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  nav: { flexDirection: 'row', gap: 10, paddingHorizontal: 12, paddingBottom: 8 },
  navBtn: { flex: 1, backgroundColor: undefined },
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
  sheetRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  sheetTitle: { color: colors.text, fontSize: 24, fontWeight: '800' },
  sheetText: { color: colors.dim, fontSize: 15, lineHeight: 22 },
});
