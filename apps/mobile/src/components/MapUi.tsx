import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  CACHE_SLOTS,
  MAX_ENERGY,
  MAX_INTEGRITY,
  levelFromXp,
  msToNextEnergy,
  sectorOfArea,
  type CacheEntry,
} from '@nexus/shared';
import { pool } from '../services/content';
import { useGame } from '../state/store';
import { colors } from '../theme';
import { Icon, type IconName } from './Icon';
import { tap } from './ui';
import { WIN, pressedIn, raised, sunken } from './Win';

/** A sunken dark panel for floating hints on the map (text stays light). */
export const glass = { ...sunken } as const;

const SEGMENTS = 10;

export function MapHud() {
  const xp = useGame((p) => p.xp);
  const gems = useGame((p) => p.gems);
  const bits = useGame((p) => p.bits);
  const energy = useGame((p) => p.energy);
  const energyAt = useGame((p) => p.energyAt);
  const integrity = useGame((p) => p.integrity);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);
  const wait = msToNextEnergy({ energy, energyAt } as Parameters<typeof msToNextEnergy>[0], now);
  const streak = useGame((p) => p.streak.count);
  const lv = levelFromXp(xp);
  const filled = Math.round((lv.into / lv.next) * SEGMENTS);
  return (
    <View style={[styles.bar, raised]} accessibilityRole="summary">
      {/* level with a segmented progress bar, like a copy dialog */}
      <View style={[styles.pane, sunken, { flex: 1, minWidth: 70 }]} accessible accessibilityLabel={`Level ${lv.level}`}>
        <Text style={styles.level}>Lv {lv.level}</Text>
        <View style={styles.segments}>
          {Array.from({ length: SEGMENTS }).map((_, i) => (
            <View key={i} style={[styles.segment, i < filled && { backgroundColor: '#000080' }]} />
          ))}
        </View>
      </View>
      <Stat icon="flame" value={`${streak}`} color="#FF9600" />
      <Stat
        icon="bolt"
        value={wait === null ? `${energy}/${MAX_ENERGY}` : `${energy}/${MAX_ENERGY}`}
        color="#FFC800"
        label={`Energie ${energy} von ${MAX_ENERGY}`}
      />
      <Stat
        icon="heart"
        value={`${integrity}`}
        muted={integrity === 0}
        color={integrity === 0 ? colors.dim : colors.bad}
        label={`Integrität ${integrity} von ${MAX_INTEGRITY}`}
      />
      <Stat icon="bit" value={`${bits}`} color={colors.bit} />
      <Stat icon="gem" value={`${gems}`} color={colors.gem} />
    </View>
  );
}

function Stat({
  icon,
  value,
  color,
  label,
  muted,
}: {
  icon: IconName;
  value: string;
  color?: string;
  label?: string;
  muted?: boolean;
}) {
  return (
    <View style={[styles.pane, sunken]} accessible accessibilityLabel={label ?? value}>
      <Icon name={icon} size={16} muted={muted} />
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

/**
 * The cache on the map: a toolbar with folders. Limited to CACHE_SLOTS; the names
 * can be swapped or thrown away, what is inside is only readable in a question.
 */
export function CacheBar({ onSlot }: { onSlot: (entry: CacheEntry) => void }) {
  const cache = useGame((p) => p.cache);
  return (
    <View style={[styles.cache, raised]} accessibilityLabel={`Cache: ${cache.length} von ${CACHE_SLOTS} belegt`}>
      <Text style={styles.cacheTitle}>Cache</Text>
      {Array.from({ length: CACHE_SLOTS }).map((_, i) => {
        const e = cache[i];
        const q = e ? pool.byId.get(e.questionId) : undefined;
        const f = q?.fragments.find((x) => x.id === e?.fragmentId);
        const color = q ? colors.sector[sectorOfArea(q.area)] : colors.dim;
        return (
          <Pressable
            key={i}
            disabled={!e}
            onPress={() => {
              tap();
              if (e) onSlot(e);
            }}
            accessibilityRole="button"
            accessibilityLabel={f ? `Cache-Platz ${i + 1}: ${f.hint}` : `Cache-Platz ${i + 1} leer`}
            style={({ pressed }) => [styles.slot, sunken, pressed && { opacity: 0.8 }]}
          >
            <View style={styles.slotRow}>
              <Icon name={f ? 'folder' : 'folder-empty'} size={f ? 20 : 18} />
              {f ? (
                <Text style={[styles.slotText, { color }]} numberOfLines={1}>
                  {f.hint}
                </Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/** The taskbar: grey, with raised buttons. */
export function Dock({ items }: { items: { label: string; icon: IconName; onPress: () => void; tint?: string }[] }) {
  return (
    <View style={[styles.dock, raised]}>
      {items.map((it) => (
        <Pressable
          key={it.label}
          onPress={() => {
            tap();
            it.onPress();
          }}
          accessibilityRole="button"
          accessibilityLabel={it.label}
          style={({ pressed }) => [styles.dockItem, raised, pressed && pressedIn]}
        >
          <Icon name={it.icon} size={22} />
          <Text style={styles.dockLabel}>{it.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 3 },
  pane: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 3, borderWidth: 1 },
  level: { color: colors.text, fontWeight: '900', fontSize: 12 },
  segments: { flexDirection: 'row', gap: 1, flex: 1 },
  segment: { flex: 1, height: 9, backgroundColor: '#1A2430' },
  statValue: { color: colors.text, fontWeight: '900', fontSize: 13 },
  cache: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 3 },
  cacheTitle: { color: WIN.text, fontSize: 12, fontWeight: '800', marginHorizontal: 4 },
  slot: { flex: 1, height: 32, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 1 },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: 5, maxWidth: '100%' },
  slotText: { fontSize: 12, fontWeight: '800' },
  dock: { flexDirection: 'row', gap: 4, padding: 3 },
  dockItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 },
  dockLabel: { color: WIN.text, fontSize: 13, fontWeight: '700' },
});
