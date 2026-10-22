import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  CACHE_SLOTS,
  MAX_ENERGY,
  MAX_INTEGRITY,
  levelFromXp,
  sectorOfArea,
  type CacheEntry,
} from '@nexus/shared';
import { pool } from '../services/content';
import { useGame } from '../state/store';
import { colors } from '../theme';
import { tap } from './ui';

/** Translucent surface used by all floating map UI. */
export const glass = {
  backgroundColor: 'rgba(10,16,32,0.74)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.09)',
  shadowColor: '#000',
  shadowOpacity: 0.35,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 6,
} as const;

export function MapHud() {
  const xp = useGame((p) => p.xp);
  const gems = useGame((p) => p.gems);
  const bits = useGame((p) => p.bits);
  const energy = useGame((p) => p.energy);
  const integrity = useGame((p) => p.integrity);
  const streak = useGame((p) => p.streak.count);
  const lv = levelFromXp(xp);
  return (
    <View style={[styles.hud, glass]} accessibilityRole="summary">
      <View style={styles.level}>
        <Text style={styles.levelNum}>{lv.level}</Text>
        <View style={styles.levelBar}>
          <View style={[styles.levelFill, { width: `${Math.round((lv.into / lv.next) * 100)}%` }]} />
        </View>
      </View>
      <Stat icon="🔥" value={`${streak}`} />
      <Stat icon="⚡" value={`${energy}/${MAX_ENERGY}`} label={`Energie ${energy} von ${MAX_ENERGY}`} />
      <Stat icon="▣" value={`${integrity}/${MAX_INTEGRITY}`} color={integrity === 0 ? colors.bad : colors.good} label={`Integrität ${integrity} von ${MAX_INTEGRITY}`} />
      <Stat icon="◈" value={`${bits}`} color={colors.bit} />
      <Stat icon="💎" value={`${gems}`} color={colors.gem} />
    </View>
  );
}

function Stat({ icon, value, color, label }: { icon: string; value: string; color?: string; label?: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={label ?? value}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

/**
 * The cache on the map: always reachable, limited to CACHE_SLOTS, and its
 * contents can be swapped or dropped. (Inside a question it is sealed.)
 */
export function CacheBar({ onSlot }: { onSlot: (entry: CacheEntry) => void }) {
  const cache = useGame((p) => p.cache);
  return (
    <View style={[styles.cache, glass]} accessibilityLabel={`Cache: ${cache.length} von ${CACHE_SLOTS} belegt`}>
      <Text style={styles.cacheTitle}>CACHE</Text>
      {Array.from({ length: CACHE_SLOTS }).map((_, i) => {
        const e = cache[i];
        const q = e ? pool.byId.get(e.questionId) : undefined;
        const f = q?.fragments.find((x) => x.id === e?.fragmentId);
        const color = q ? colors.sector[sectorOfArea(q.area)] : colors.line;
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
            style={[styles.slot, f ? { borderColor: color, backgroundColor: color + '22' } : styles.slotEmpty]}
          >
            <Text style={[styles.slotText, f ? { color } : null]} numberOfLines={1}>
              {f ? f.hint : '·'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Dock({ items }: { items: { label: string; icon: string; onPress: () => void; tint?: string }[] }) {
  return (
    <View style={[styles.dock, glass]}>
      {items.map((it) => (
        <Pressable
          key={it.label}
          onPress={() => {
            tap();
            it.onPress();
          }}
          accessibilityRole="button"
          accessibilityLabel={it.label}
          style={({ pressed }) => [styles.dockItem, pressed && { backgroundColor: 'rgba(255,255,255,0.08)' }]}
        >
          <Text style={styles.dockIcon}>{it.icon}</Text>
          <Text style={[styles.dockLabel, it.tint ? { color: it.tint } : null]}>{it.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  hud: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
  },
  level: { flex: 1, minWidth: 52, gap: 4 },
  levelNum: { color: colors.text, fontWeight: '800', fontSize: 13, letterSpacing: 0.4 },
  levelBar: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  levelFill: { height: 4, backgroundColor: colors.accent },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statIcon: { fontSize: 12 },
  statValue: { color: colors.text, fontWeight: '700', fontSize: 13 },
  cache: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 18,
  },
  cacheTitle: { color: colors.dim, fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginRight: 2 },
  slot: {
    flex: 1,
    height: 34,
    borderRadius: 11,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  slotEmpty: { borderColor: 'rgba(255,255,255,0.12)', borderStyle: 'dashed' },
  slotText: { color: colors.dim, fontSize: 12, fontWeight: '700' },
  dock: { flexDirection: 'row', borderRadius: 26, padding: 6, gap: 4 },
  dockItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 20, gap: 2 },
  dockIcon: { fontSize: 20 },
  dockLabel: { color: colors.text, fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
});
