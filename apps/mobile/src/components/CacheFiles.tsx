import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { CACHE_FILES_PER_AREA, type FragmentFile } from '@nexus/shared';
import { useStrings } from '../strings';
import { FileView, Row } from './CacheExplorer';
import { Button } from './ui';
import { WIN, Window } from './Win';

export interface CachedItem {
  key: string;
  /** Name of the topic area. */
  area: string;
  /** The folder the file came from. */
  folder: string;
  file: FragmentFile;
}

/**
 * The cache: a handful of single files, at most three per topic area. In a question the files of
 * its area open for free; on the map files can be taken out again.
 */
export function CacheFiles({
  items,
  onClose,
  onRemove,
  note,
}: {
  items: CachedItem[];
  onClose: () => void;
  /** On the map: take a file out of the cache. */
  onRemove?: (key: string) => void;
  /** A line above the list, e.g. what the cache is for. */
  note?: string;
}) {
  const t = useStrings();
  const { width, height } = useWindowDimensions();
  const [open, setOpen] = useState<string | null>(null);
  const current = items.find((it) => it.key === open);
  const areas = [...new Set(items.map((it) => it.area))];
  const viewW = Math.min(width, 480) - 24 - 6 - 20 - 4;

  return (
    <Window
      title={current ? current.file.name : t.cacheFiles.title}
      icon="cache"
      tone="light"
      onClose={onClose}
      style={{ maxWidth: 480, alignSelf: 'center', width: '100%' }}
    >
      {note && !current ? <Text style={styles.note}>{note}</Text> : null}
      <View style={[styles.content, { maxHeight: height * 0.5 }]}>
        <ScrollView contentContainerStyle={{ padding: 8, gap: 2 }}>
          {current ? (
            <View style={{ gap: 8 }}>
              <Text style={styles.path}>
                {`${t.cacheFiles.title}\\${current.area}\\${current.folder}`}
              </Text>
              <FileView file={current.file} width={viewW} />
            </View>
          ) : items.length === 0 ? (
            <Text style={styles.empty}>
              {t.cacheFiles.empty(CACHE_FILES_PER_AREA)}
            </Text>
          ) : (
            areas.map((a) => {
              const mine = items.filter((it) => it.area === a);
              return (
                <View key={a} style={{ gap: 2 }}>
                  <Text style={styles.area}>
                    {a} · {mine.length}/{CACHE_FILES_PER_AREA}
                  </Text>
                  {mine.map((it) => (
                    <Row key={it.key} icon="file" title={it.file.name} sub={it.folder} onPress={() => setOpen(it.key)} />
                  ))}
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
      {current ? (
        <>
          {onRemove ? (
            <Button
              label={t.cacheFiles.remove}
              variant="ghost"
              onPress={() => {
                onRemove(current.key);
                setOpen(null);
              }}
            />
          ) : null}
          <Button label={t.cacheFiles.backToList} variant="ghost" onPress={() => setOpen(null)} />
        </>
      ) : null}
      <Button label={t.common.close} onPress={onClose} />
    </Window>
  );
}

const styles = StyleSheet.create({
  note: { color: WIN.dark, fontSize: 13, lineHeight: 18 },
  content: {
    minHeight: 160,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderTopColor: WIN.shadow,
    borderLeftColor: WIN.shadow,
    borderRightColor: WIN.hi,
    borderBottomColor: WIN.hi,
  },
  area: { color: '#000080', fontSize: 12, fontWeight: '900', letterSpacing: 0.6, marginTop: 6, marginLeft: 6 },
  path: { color: '#505860', fontSize: 12 },
  empty: { color: '#505860', fontSize: 14, padding: 12 },
});
