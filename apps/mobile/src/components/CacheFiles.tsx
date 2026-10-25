import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CACHE_FILES_PER_AREA, type FragmentFile } from '@nexus/shared';
import { useStrings } from '../strings';
import { FileView, Row } from './CacheExplorer';
import { Button, tap } from './ui';
import { WIN, Window } from './Win';

export interface CachedItem {
  key: string;
  /** Name of the topic area. */
  area: string;
  /** The folder the file came from. */
  folder: string;
  file: FragmentFile;
}

/** How far each further window is shifted, so the stack looks like windows opened one after another. */
const CASCADE = 8;

/**
 * The cache: a handful of single files, at most three per topic area. Files open as small windows,
 * one under the other, each closable on its own or all together. In a question the files of its
 * area open right away (`openAll`); on the map a list comes first and files can be taken out again.
 */
export function CacheFiles({
  items,
  onClose,
  onRemove,
  note,
  openAll = false,
}: {
  items: CachedItem[];
  onClose: () => void;
  /** On the map: take a file out of the cache. */
  onRemove?: (key: string) => void;
  /** A line above the list, e.g. what the cache is for. */
  note?: string;
  /** Opens every file at once and closes the cache with the last window (in a question). */
  openAll?: boolean;
}) {
  const t = useStrings();
  const { width, height } = useWindowDimensions();
  const [opened, setOpened] = useState<string[]>(() => (openAll ? items.map((it) => it.key) : []));
  // files can leave the cache while their window is open
  const wins = opened.map((k) => items.find((it) => it.key === k)).filter((it): it is CachedItem => !!it);
  const areas = [...new Set(items.map((it) => it.area))];
  const viewW = Math.min(width - 40, 480) - 24 - 6 - 20 - 4 - Math.max(0, wins.length - 1) * CASCADE;

  const show = (keys: string[]) => setOpened((o) => [...o, ...keys.filter((k) => !o.includes(k))]);
  const closeAll = () => (openAll ? onClose() : setOpened([]));
  const closeOne = (key: string) => {
    if (openAll && wins.length <= 1) onClose();
    else setOpened((o) => o.filter((k) => k !== key));
  };

  if (wins.length > 0) {
    return (
      <View style={[styles.stack, { maxHeight: height * 0.88 }]}>
        <ScrollView contentContainerStyle={{ gap: 10 }} showsVerticalScrollIndicator={false}>
          {wins.map((it, i) => (
            <Animated.View key={it.key} entering={FadeInDown.delay(i * 90).duration(220)}>
              <Window
                title={it.file.name}
                icon="file"
                tone="light"
                onClose={() => closeOne(it.key)}
                style={{ marginLeft: i * CASCADE, marginRight: (wins.length - 1 - i) * CASCADE }}
              >
                <Text style={styles.path} numberOfLines={1}>
                  {`${t.cacheFiles.title}\\${it.area}\\${it.folder}`}
                </Text>
                <View style={styles.content}>
                  <View style={{ padding: 8 }}>
                    <FileView file={it.file} width={viewW} />
                  </View>
                </View>
                {onRemove ? (
                  <Button
                    label={t.cacheFiles.remove}
                    variant="ghost"
                    onPress={() => {
                      onRemove(it.key);
                      setOpened((o) => o.filter((k) => k !== it.key));
                    }}
                  />
                ) : null}
              </Window>
            </Animated.View>
          ))}
        </ScrollView>
        <Button label={wins.length > 1 ? t.cacheFiles.closeAll(wins.length) : t.common.close} onPress={closeAll} />
      </View>
    );
  }

  return (
    <Window title={t.cacheFiles.title} icon="cache" tone="light" onClose={onClose} style={styles.stack}>
      {note ? <Text style={styles.note}>{note}</Text> : null}
      <View style={[styles.content, { minHeight: 160, maxHeight: height * 0.5 }]}>
        <ScrollView contentContainerStyle={{ padding: 8, gap: 2 }}>
          {items.length === 0 ? (
            <Text style={styles.empty}>{t.cacheFiles.empty(CACHE_FILES_PER_AREA)}</Text>
          ) : (
            areas.map((a) => {
              const mine = items.filter((it) => it.area === a);
              return (
                <View key={a} style={{ gap: 2 }}>
                  <View style={styles.areaRow}>
                    <Text style={styles.area}>
                      {a} · {mine.length}/{CACHE_FILES_PER_AREA}
                    </Text>
                    <Pressable
                      onPress={() => {
                        tap();
                        show(mine.map((it) => it.key));
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={t.cacheFiles.openAllA11y(a)}
                      style={({ pressed }) => [styles.openAll, pressed && { backgroundColor: WIN.titleA }]}
                    >
                      {({ pressed }) => <Text style={[styles.openAllText, pressed && { color: '#FFFFFF' }]}>{t.cacheFiles.openAll}</Text>}
                    </Pressable>
                  </View>
                  {mine.map((it) => (
                    <Row key={it.key} icon="file" title={it.file.name} sub={it.folder} onPress={() => show([it.key])} />
                  ))}
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
      <Button label={t.common.close} onPress={onClose} />
    </Window>
  );
}

const styles = StyleSheet.create({
  stack: { maxWidth: 480, alignSelf: 'center', width: '100%', gap: 10 },
  note: { color: WIN.dark, fontSize: 13, lineHeight: 18 },
  content: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderTopColor: WIN.shadow,
    borderLeftColor: WIN.shadow,
    borderRightColor: WIN.hi,
    borderBottomColor: WIN.hi,
  },
  areaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  area: { color: '#000080', fontSize: 12, fontWeight: '900', letterSpacing: 0.6, marginLeft: 6, flexShrink: 1 },
  openAll: { minHeight: 44, paddingHorizontal: 10, justifyContent: 'center' },
  openAllText: { color: '#000080', fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
  path: { color: '#505860', fontSize: 12 },
  empty: { color: '#505860', fontSize: 14, padding: 12 },
});
