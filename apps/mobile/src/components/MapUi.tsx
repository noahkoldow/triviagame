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

/** Solid surface with a thick bottom edge: the look of all floating map UI. */
export const glass = {
  backgroundColor: colors.panel,
  borderWidth: 2,
  borderBottomWidth: 5,
  borderColor: colors.line,
} as const;

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
  return (
    <View style={[styles.hud, glass]} accessibilityRole="summary">
      <View style={styles.level}>
        <Text style={styles.levelNum}>{lv.level}</Text>
        <View style={styles.levelBar}>
          <View style={[styles.levelFill, { width: `${Math.round((lv.into / lv.next) * 100)}%` }]} />
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
    <View style={styles.stat} accessible accessibilityLabel={label ?? value}>
      <Icon name={icon} size={17} muted={muted} />
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

export function Dock({ items }: { items: { label: string; icon: IconName; onPress: () => void; tint?: string }[] }) {
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
          <Icon name={it.icon} size={26} />
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
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
  },
  level: { flex: 1, minWidth: 52, gap: 4 },
  levelNum: { color: colors.primary, fontWeight: '900', fontSize: 14, letterSpacing: 0.4 },
  levelBar: { height: 8, borderRadius: 4, backgroundColor: colors.line, overflow: 'hidden' },
  levelFill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statIcon: { fontSize: 12 },
  statValue: { color: colors.text, fontWeight: '900', fontSize: 14 },
  cache: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 18,
  },
  cacheTitle: { color: colors.dim, fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginRight: 2 },
  slot: {
    flex: 1,
    height: 36,
    borderRadius: 12,
    borderWidth: 2,
    borderBottomWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  slotEmpty: { borderColor: colors.line, borderStyle: 'dashed', borderBottomWidth: 2 },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: 5, maxWidth: '100%' },
  slotText: { color: colors.dim, fontSize: 12, fontWeight: '800' },
  dock: { flexDirection: 'row', borderRadius: 24, padding: 5, gap: 4 },
  dockItem: { flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 18, gap: 1 },
  dockIcon: { fontSize: 20 },
  dockLabel: { color: colors.text, fontSize: 11, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
});
