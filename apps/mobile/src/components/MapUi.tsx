import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  MAX_ENERGY,
  MAX_INTEGRITY,
  levelFromXp,
  msToNextEnergy,
} from '@nexus/shared';
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
 * The cache on the map: one bar that opens it. On the map it is free to open and to search;
 * inside a question the same cache costs energy, more the bigger it is.
 */
export function CacheBar({ onOpen }: { onOpen: () => void }) {
  const count = useGame((p) => p.cache.length);
  return (
    <Pressable
      onPress={() => {
        tap();
        onOpen();
      }}
      accessibilityRole="button"
      accessibilityLabel={count === 0 ? 'Cache öffnen, leer' : `Cache öffnen, ${count} Ordner`}
      style={({ pressed }) => [styles.cache, raised, pressed && pressedIn]}
    >
      <Icon name={count > 0 ? 'folder' : 'folder-empty'} size={22} />
      <Text style={styles.cacheTitle}>Cache</Text>
      <View style={[styles.cacheCount, sunken]}>
        <Text style={styles.cacheCountText} maxFontSizeMultiplier={1.3}>
          {count === 0 ? 'leer' : `${count} Ordner`}
        </Text>
      </View>
      <Text style={styles.cacheOpen}>Öffnen</Text>
    </Pressable>
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
  cache: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, minHeight: 44 },
  cacheTitle: { color: WIN.text, fontSize: 13, fontWeight: '800' },
  cacheCount: { flex: 1, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  cacheCountText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  cacheOpen: { color: WIN.text, fontSize: 13, fontWeight: '700' },
  dock: { flexDirection: 'row', gap: 4, padding: 3 },
  dockItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, minHeight: 44 },
  dockLabel: { color: WIN.text, fontSize: 13, fontWeight: '700' },
});
