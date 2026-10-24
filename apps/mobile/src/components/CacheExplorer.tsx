import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  KIND_LABEL,
  fileSizeKb,
  matchRanges,
  searchFiles,
  type FragmentFile,
  type SearchFolder,
} from '@nexus/shared';
import { ChartView } from './ChartView';
import { Icon, type IconName } from './Icon';
import { Button, tap } from './ui';
import { WIN, Window, pressedIn, raised } from './Win';

const INK = '#101820';

const ICON_OF: Record<FragmentFile['kind'], IconName> = { note: 'file', article: 'file', image: 'image' };

/** Text with the words of the query marked, like a viewer that highlights search hits. */
function Highlighted({ text, query, style }: { text: string; query: string; style?: object }) {
  const ranges = matchRanges(text, query);
  if (ranges.length === 0) return <Text style={style}>{text}</Text>;
  const parts: React.ReactNode[] = [];
  let at = 0;
  ranges.forEach(([a, b], i) => {
    if (a > at) parts.push(text.slice(at, a));
    parts.push(
      <Text key={i} style={styles.mark}>
        {text.slice(a, b)}
      </Text>,
    );
    at = b;
  });
  if (at < text.length) parts.push(text.slice(at));
  return <Text style={style}>{parts}</Text>;
}

function MiniBtn({ label, hint, disabled, onPress }: { label: string; hint: string; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        tap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={hint}
      style={({ pressed }) => [styles.mini, raised, pressed && pressedIn, disabled && { opacity: 0.35 }]}
    >
      <Text style={styles.upText}>{label}</Text>
    </Pressable>
  );
}

function Row({
  icon,
  title,
  sub,
  right,
  query,
  onPress,
}: {
  icon: IconName;
  title: string;
  sub?: string;
  right?: string;
  query?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${title}${right ? ', ' + right : ''}`}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: WIN.titleA }]}
    >
      {({ pressed }) => (
        <>
          <Icon name={icon} size={26} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, pressed && { color: '#FFFFFF' }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
              {title}
            </Text>
            {sub ? (
              query ? (
                <Highlighted text={sub} query={query} style={[styles.rowSub, pressed && { color: '#FFFFFF' }]} />
              ) : (
                <Text style={[styles.rowSub, pressed && { color: '#FFFFFF' }]} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                  {sub}
                </Text>
              )
            ) : null}
          </View>
          {right ? <Text style={[styles.rowRight, pressed && { color: '#FFFFFF' }]}>{right}</Text> : null}
        </>
      )}
    </Pressable>
  );
}

/**
 * The cache as a file manager, opened inside a question: folders, the files in them, a viewer,
 * and a search that looks through everything. Searching is free; finding the right file is the task.
 */
export interface CacheManage {
  onMove: (index: number, dir: -1 | 1) => void;
  onSort: () => void;
  onDelete: (index: number) => void;
  onClear: () => void;
}

export function CacheExplorer({
  folders,
  onClose,
  manage,
}: {
  folders: SearchFolder[];
  onClose: () => void;
  /** When given, folders can be ordered and deleted (on the map). */
  manage?: CacheManage;
}) {
  const [organizing, setOrganizing] = useState(false);
  const { width, height } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [folder, setFolder] = useState<number | null>(null);
  const [file, setFile] = useState<number | null>(null);
  const searching = query.trim().length >= 2;
  const hits = useMemo(() => searchFiles(folders, query), [folders, query]);

  const open = folder !== null ? folders[folder] : undefined;
  const current = open && file !== null ? open.files[file] : undefined;
  const viewW = Math.min(width, 480) - 24 - 6 - 20 - 4;

  const up = () => {
    if (file !== null) setFile(null);
    else setFolder(null);
  };
  const path = ['Cache', open?.name, current?.name].filter(Boolean).join('\\');
  const title = current ? current.name : open ? open.name : 'Cache';

  const openHit = (f: number, g: number) => {
    setFolder(f);
    setFile(g);
  };

  return (
    <Window title={title} icon="folder" tone="light" onClose={onClose} style={{ maxWidth: 480, alignSelf: 'center', width: '100%' }}>
      <View style={styles.toolbar}>
        <Pressable
          disabled={folder === null && !searching}
          onPress={() => {
            tap();
            if (searching && folder === null) setQuery('');
            else up();
          }}
          accessibilityRole="button"
          accessibilityLabel="Eine Ebene nach oben"
          style={({ pressed }) => [styles.upBtn, raised, pressed && pressedIn, folder === null && !searching && { opacity: 0.4 }]}
        >
          <Text style={styles.upText}>↑ Hoch</Text>
        </Pressable>
        <View style={styles.search}>
          <Icon name="search" size={18} />
          <TextInput
            value={query}
            onChangeText={(t) => {
              setQuery(t);
              if (t.trim().length >= 2) setFile(null);
            }}
            placeholder="Suchen in Cache …"
            placeholderTextColor={WIN.shadow}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel="Im Cache suchen"
            style={styles.searchInput}
          />
        </View>
      </View>

      <View style={styles.address} accessibilityLabel={`Pfad ${path}`}>
        <Text style={styles.addressText} numberOfLines={1}>
          {path}
        </Text>
      </View>

      <View style={[styles.content, { maxHeight: height * 0.55 }]}>
        <ScrollView contentContainerStyle={{ padding: 8, gap: 2 }} keyboardShouldPersistTaps="handled">
          {current ? (
            <View style={{ gap: 10 }}>
              {current.kind === 'image' && current.chart ? (
                <ChartView chart={current.chart} width={viewW} alt={current.alt} />
              ) : (
                <>
                  {current.kind === 'article' ? (
                    <Text style={styles.articleTitle} maxFontSizeMultiplier={1.3}>
                      {current.name.replace(/\.[^.]+$/, '')}
                    </Text>
                  ) : null}
                  {(current.text ?? '').split('\n\n').map((p, i) => (
                    <Highlighted key={i} text={p} query={query} style={styles.body} />
                  ))}
                  {current.source ? <Text style={styles.source}>Quelle: {current.source}</Text> : null}
                </>
              )}
            </View>
          ) : searching ? (
            hits.length === 0 ? (
              <Text style={styles.empty}>Keine Treffer für „{query.trim()}“.</Text>
            ) : (
              hits.map((h) => {
                const f = folders[h.folder]!;
                const x = f.files[h.file]!;
                return (
                  <Row
                    key={`${h.folder}-${h.file}`}
                    icon={ICON_OF[x.kind]}
                    title={`${f.name} › ${x.name}`}
                    sub={h.snippet}
                    query={query}
                    onPress={() => openHit(h.folder, h.file)}
                  />
                );
              })
            )
          ) : open ? (
            open.files.map((x, i) => (
              <Row key={x.name} icon={ICON_OF[x.kind]} title={x.name} sub={KIND_LABEL[x.kind]} right={`${fileSizeKb(x)} KB`} onPress={() => setFile(i)} />
            ))
          ) : folders.length === 0 ? (
            <Text style={styles.empty}>Der Cache ist leer.</Text>
          ) : organizing && manage ? (
            folders.map((f, i) => (
              <View key={f.name + i} style={styles.manageRow}>
                <Icon name="folder" size={26} />
                <Text style={[styles.rowTitle, { flex: 1 }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                  {f.name}
                </Text>
                <MiniBtn label="▲" hint="Nach oben" disabled={i === 0} onPress={() => manage.onMove(i, -1)} />
                <MiniBtn label="▼" hint="Nach unten" disabled={i === folders.length - 1} onPress={() => manage.onMove(i, 1)} />
                <MiniBtn
                  label="✕"
                  hint={`Ordner ${f.name} löschen`}
                  onPress={() =>
                    Alert.alert('Ordner löschen?', `„${f.name}“ wird aus dem Cache entfernt. Du kannst ihn später erneut aufsammeln.`, [
                      { text: 'Abbrechen', style: 'cancel' },
                      { text: 'Löschen', style: 'destructive', onPress: () => manage.onDelete(i) },
                    ])
                  }
                />
              </View>
            ))
          ) : (
            folders.map((f, i) => (
              <Row
                key={f.name + i}
                icon="folder"
                title={f.name}
                sub={`${f.files.length} Objekt${f.files.length === 1 ? '' : 'e'}`}
                onPress={() => setFolder(i)}
              />
            ))
          )}
        </ScrollView>
      </View>

      {manage && folder === null && !searching && folders.length > 0 ? (
        <View style={styles.manageBar}>
          <View style={{ flex: 1 }}>
            <Button label={organizing ? 'Fertig' : 'Ordnen'} variant="ghost" onPress={() => setOrganizing((o) => !o)} />
          </View>
          {organizing ? (
            <>
              <View style={{ flex: 1 }}>
                <Button label="A–Z" variant="ghost" onPress={manage.onSort} />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label="Leeren"
                  variant="ghost"
                  onPress={() =>
                    Alert.alert('Cache leeren?', 'Alle Ordner werden entfernt.', [
                      { text: 'Abbrechen', style: 'cancel' },
                      { text: 'Leeren', style: 'destructive', onPress: manage.onClear },
                    ])
                  }
                />
              </View>
            </>
          ) : null}
        </View>
      ) : null}
      <Text style={styles.status} maxFontSizeMultiplier={1.2}>
        {searching ? `${hits.length} Treffer` : open ? `${open.files.length} Objekt${open.files.length === 1 ? '' : 'e'}` : `${folders.length} Ordner`}
      </Text>
      <Button label="Schließen" onPress={onClose} />
    </Window>
  );
}

const styles = StyleSheet.create({
  manageRow: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 48, paddingHorizontal: 6, paddingVertical: 2 },
  manageBar: { flexDirection: 'row', gap: 6 },
  mini: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  toolbar: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  upBtn: { minHeight: 44, paddingHorizontal: 10, justifyContent: 'center' },
  upText: { color: WIN.text, fontSize: 13, fontWeight: '700' },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderTopColor: WIN.shadow,
    borderLeftColor: WIN.shadow,
    borderRightColor: WIN.hi,
    borderBottomColor: WIN.hi,
  },
  searchInput: { flex: 1, color: INK, fontSize: 15, paddingVertical: 6 },
  address: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 2,
    borderTopColor: WIN.shadow,
    borderLeftColor: WIN.shadow,
    borderRightColor: WIN.hi,
    borderBottomColor: WIN.hi,
  },
  addressText: { color: INK, fontSize: 13 },
  content: {
    minHeight: 220,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderTopColor: WIN.shadow,
    borderLeftColor: WIN.shadow,
    borderRightColor: WIN.hi,
    borderBottomColor: WIN.hi,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 6, paddingVertical: 4 },
  rowTitle: { color: INK, fontSize: 15, fontWeight: '700' },
  rowSub: { color: '#505860', fontSize: 12 },
  rowRight: { color: '#505860', fontSize: 12 },
  articleTitle: { color: INK, fontSize: 18, fontWeight: '900' },
  body: { color: INK, fontSize: 15, lineHeight: 22 },
  source: { color: '#505860', fontSize: 12, fontStyle: 'italic' },
  empty: { color: '#505860', fontSize: 14, padding: 12 },
  mark: { backgroundColor: '#FFE680', color: INK, fontWeight: '800' },
  status: { color: WIN.dark, fontSize: 12 },
});
