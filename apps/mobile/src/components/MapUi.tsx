import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  MAX_ENERGY,
  MAX_INTEGRITY,
  levelFromXp,
  msToNextEnergy,
  type Chapter,
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

/** The chapter goal under the HUD: where the story goes next. In chapter 4 it starts the final duel. */
export function GoalBar({ chapter, onFinale }: { chapter: Chapter; onFinale: () => void }) {
  const label = `Kapitel ${chapter.n}: ${chapter.title}. ${chapter.goal}${chapter.finale ? '' : `, ${chapter.done} von ${chapter.total}`}`;
  // dark text on the pink finale button, light text on the dark pane
  const ink = chapter.finale ? { color: WIN.black } : null;
  const body = (
    <>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.goalChapter, ink]} maxFontSizeMultiplier={1.3}>
          KAPITEL {chapter.n} · {chapter.title.toUpperCase()}
        </Text>
        <Text style={[styles.goalText, ink]} maxFontSizeMultiplier={1.3} numberOfLines={2}>
          {chapter.goal}
        </Text>
      </View>
      {chapter.finale ? (
        <Text style={styles.goalGo}>Antreten ›</Text>
      ) : (
        <Text style={styles.goalCount}>
          {Math.min(chapter.done, chapter.total)}/{chapter.total}
        </Text>
      )}
    </>
  );
  if (!chapter.finale) {
    return (
      <View style={[styles.goal, sunken]} accessible accessibilityLabel={label}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      onPress={() => {
        tap();
        onFinale();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${label}. Finale starten`}
      style={({ pressed }) => [styles.goal, raised, styles.goalFinale, pressed && pressedIn]}
    >
      {body}
    </Pressable>
  );
}

/**
 * Folder structure and cache on the map, both free to open here. In a question the cache (a few
 * files per topic) stays free, while the folder structure costs energy.
 */
export function CacheBar({
  onFolders,
  onCache,
  cacheLabel,
}: {
  onFolders: () => void;
  onCache: () => void;
  /** E.g. "2/3 Physik & Chemie" while a debris field is open, else the number of files. */
  cacheLabel?: string;
}) {
  const folders = useGame((p) => p.archive.length);
  const files = useGame((p) => p.cache.length);
  const cache = cacheLabel ?? (files === 0 ? 'leer' : `${files} Datei${files === 1 ? '' : 'en'}`);
  return (
    <View style={styles.cacheRow}>
      <Pressable
        onPress={() => {
          tap();
          onFolders();
        }}
        accessibilityRole="button"
        accessibilityLabel={folders === 0 ? 'Ordner öffnen, leer' : `Ordner öffnen, ${folders} Ordner`}
        style={({ pressed }) => [styles.cache, raised, pressed && pressedIn]}
      >
        <Icon name={folders > 0 ? 'folder' : 'folder-empty'} size={22} />
        <Text style={styles.cacheTitle}>Ordner</Text>
        <View style={[styles.cacheCount, sunken]}>
          <Text style={styles.cacheCountText} maxFontSizeMultiplier={1.3}>
            {folders === 0 ? 'leer' : folders}
          </Text>
        </View>
      </Pressable>
      <Pressable
        onPress={() => {
          tap();
          onCache();
        }}
        accessibilityRole="button"
        accessibilityLabel={`Cache öffnen, ${cache}`}
        style={({ pressed }) => [styles.cache, raised, pressed && pressedIn]}
      >
        <Icon name="cache" size={22} />
        <Text style={styles.cacheTitle}>Cache</Text>
        <View style={[styles.cacheCount, sunken]}>
          <Text style={styles.cacheCountText} numberOfLines={1} maxFontSizeMultiplier={1.3}>
            {cache}
          </Text>
        </View>
      </Pressable>
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
  cacheRow: { flexDirection: 'row', gap: 6 },
  cache: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, padding: 6, minHeight: 44 },
  cacheTitle: { color: WIN.text, fontSize: 13, fontWeight: '800' },
  cacheCount: { flex: 1, paddingHorizontal: 6, paddingVertical: 4, borderWidth: 1 },
  cacheCountText: { color: colors.text, fontSize: 12, fontWeight: '800' },
  goal: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 6, minHeight: 44 },
  goalFinale: { backgroundColor: '#FF86D0' },
  goalChapter: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  goalText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  goalCount: { color: colors.text, fontSize: 15, fontWeight: '900' },
  goalGo: { color: WIN.black, fontSize: 14, fontWeight: '900' },
  dock: { flexDirection: 'row', gap: 4, padding: 3 },
  // icon above the label, so five buttons fit on small phones
  dockItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 5, minHeight: 48 },
  dockLabel: { color: WIN.text, fontSize: 12, fontWeight: '700' },
});
