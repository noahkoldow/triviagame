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
  fileSizeKb,
  matchRanges,
  redactedParts,
  searchFiles,
  type FragmentFile,
  type SearchFolder,
} from '@nexus/shared';
import { useStrings } from '../strings';
import { ChartView } from './ChartView';
import { Icon, type IconName } from './Icon';
import { Button, tap } from './ui';
import { WIN, Window, pressedIn, raised } from './Win';

const INK = '#101820';

const ICON_OF: Record<FragmentFile['kind'], IconName> = {
  note: 'file',
  article: 'file',
  image: 'image',
  profile: 'user',
  quote: 'book',
  mail: 'file',
  redacted: 'warn',
};

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

/** The content of one file: a drawn chart, a fact sheet, a quote, a mail, or the text of a note or article. */
export function FileView({ file, width, query = '' }: { file: FragmentFile; width: number; query?: string }) {
  const t = useStrings();
  if (file.kind === 'profile' && file.fields) {
    // like the properties dialog of an old desktop: label left, value right
    return (
      <View style={styles.sheet}>
        <Text style={styles.articleTitle} maxFontSizeMultiplier={1.3}>
          {file.name.replace(/\.[^.]+$/, '').replace(/_/g, ' ')}
        </Text>
        {file.fields.map(([k, v]) => (
          <View key={k} style={styles.field}>
            <Highlighted text={`${k}:`} query={query} style={[styles.body, styles.fieldKey]} />
            <Highlighted text={v} query={query} style={[styles.body, { flex: 1 }]} />
          </View>
        ))}
      </View>
    );
  }
  if (file.kind === 'quote') {
    return (
      <View style={styles.quote}>
        <Highlighted text={t.explorer.quoted(file.text ?? '')} query={query} style={[styles.body, styles.quoteText]} />
        {file.source ? <Highlighted text={`— ${file.source}`} query={query} style={styles.source} /> : null}
      </View>
    );
  }
  if (file.kind === 'redacted') {
    // what morph.ai blacked out stays black; the rest reads and highlights like a note
    return (
      <View style={{ gap: 8 }}>
        <Text style={styles.source}>{t.explorer.redactedNote}</Text>
        <Text style={styles.body} accessibilityLabel={redactedParts(file.text ?? '').map((p) => (p.hidden ? t.explorer.blackedOut : p.text)).join('')}>
          {redactedParts(file.text ?? '').map((p, i) =>
            p.hidden ? (
              <Text key={i} style={styles.bar}>
                {'\u2007'.repeat(Math.max(3, p.text.length))}
              </Text>
            ) : (
              <Highlighted key={i} text={p.text} query={query} style={styles.body} />
            ),
          )}
        </Text>
      </View>
    );
  }
  if (file.kind === 'mail') {
    return (
      <View style={{ gap: 8 }}>
        <View style={styles.mailHead}>
          <Highlighted text={t.explorer.mailFrom(file.from ?? '')} query={query} style={styles.mailLine} />
          <Highlighted text={t.explorer.mailSubject(file.subject ?? '')} query={query} style={[styles.mailLine, { fontWeight: '800' }]} />
        </View>
        <Highlighted text={file.text ?? ''} query={query} style={styles.body} />
      </View>
    );
  }
  return (
    <View style={{ gap: 10 }}>
      {file.kind === 'image' && file.chart ? (
        <ChartView chart={file.chart} width={width} alt={file.alt} />
      ) : (
        <>
          {file.kind === 'article' ? (
            <Text style={styles.articleTitle} maxFontSizeMultiplier={1.3}>
              {file.name.replace(/\.[^.]+$/, '')}
            </Text>
          ) : null}
          {(file.text ?? '').split('\n\n').map((p, i) => (
            <Highlighted key={i} text={p} query={query} style={styles.body} />
          ))}
          {file.source ? <Text style={styles.source}>{t.explorer.source(file.source)}</Text> : null}
        </>
      )}
    </View>
  );
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

export function Row({
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

/** A folder of the explorer; with `group` the folders sit one level deeper, inside their group (topic area). */
export type ExplorerFolder = SearchFolder & { group?: string };

/** Ordering and deleting folders (the folder structure on the map). Indices point into `folders`. */
export interface CacheManage {
  onSwap: (a: number, b: number) => void;
  onSort: () => void;
  onDelete: (index: number) => void;
  onClear: () => void;
}

/** What can be done with an open file, e.g. putting it into the cache. */
export type FileAction = { label: string; onPress: () => void; disabled?: boolean; sub?: string };

/**
 * A file manager in the look of the old systems: folders (optionally grouped by topic area), the
 * files in them, a viewer, and a search that looks through everything. On the map it shows the
 * folder structure and single debris folders; in a question the structure, once paid for.
 */
export function CacheExplorer({
  folders,
  onClose,
  manage,
  root: rootName,
  single = false,
  actions,
  closeLabel: closeName,
  fileAction,
  fileTag,
}: {
  folders: ExplorerFolder[];
  onClose: () => void;
  /** When given, folders can be ordered and deleted (on the map). */
  manage?: CacheManage;
  /** Name of the top level in the address bar, e.g. "Trümmerfeld". */
  root?: string;
  /** Opens the first folder and stays in it: a single debris folder before it is filed. */
  single?: boolean;
  /** Buttons above the close button, e.g. "Ablegen"; the close button then turns secondary. */
  actions?: React.ReactNode;
  closeLabel?: string;
  /** An action under an open file, e.g. "In den Cache". */
  fileAction?: (folder: number, file: number) => FileAction | null;
  /** A short mark in the file list, e.g. "im Cache". */
  fileTag?: (folder: number, file: number) => string | undefined;
}) {
  const t = useStrings();
  const root = rootName ?? t.explorer.folders;
  const closeLabel = closeName ?? t.common.close;
  const [organizing, setOrganizing] = useState(false);
  const { width, height } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<string | null>(null);
  const [folder, setFolder] = useState<number | null>(single ? 0 : null);
  const [file, setFile] = useState<number | null>(null);
  const searching = query.trim().length >= 2;
  const hits = useMemo(() => searchFiles(folders, query), [folders, query]);

  const grouped = !single && folders.some((f) => f.group);
  const groups = useMemo(() => [...new Set(folders.map((f) => f.group ?? ''))], [folders]);
  // the folders on the current level, with their index in `folders`
  const visible = folders.map((f, i) => ({ f, i })).filter(({ f }) => !grouped || (f.group ?? '') === group);

  const open = folder !== null ? folders[folder] : undefined;
  const current = open && file !== null ? open.files[file] : undefined;
  const viewW = Math.min(width, 480) - 24 - 6 - 20 - 4;
  // the top a player can go up to: the folder itself in single mode, else the list of groups or folders
  const atTop = single ? file === null : folder === null && (!grouped || group === null);

  const up = () => {
    if (file !== null) setFile(null);
    else if (single) return;
    else if (folder !== null) setFolder(null);
    else setGroup(null);
  };
  const path = [root, grouped ? group : undefined, open?.name, current?.name].filter(Boolean).join('\\');
  const title = current ? current.name : open ? open.name : group ?? root;

  const openHit = (f: number, g: number) => {
    setGroup(folders[f]!.group ?? null);
    setFolder(f);
    setFile(g);
  };
  const action = current && folder !== null && file !== null && fileAction ? fileAction(folder, file) : null;

  return (
    <Window title={title} icon="folder" tone="light" onClose={onClose} style={{ maxWidth: 480, alignSelf: 'center', width: '100%' }}>
      <View style={styles.toolbar}>
        <Pressable
          disabled={atTop && !searching}
          onPress={() => {
            tap();
            if (searching && file === null && (folder === null || single)) setQuery('');
            else up();
          }}
          accessibilityRole="button"
          accessibilityLabel={t.explorer.upA11y}
          style={({ pressed }) => [styles.upBtn, raised, pressed && pressedIn, atTop && !searching && { opacity: 0.4 }]}
        >
          <Text style={styles.upText}>{t.explorer.up}</Text>
        </Pressable>
        <View style={styles.search}>
          <Icon name="search" size={18} />
          <TextInput
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              if (text.trim().length >= 2) setFile(null);
            }}
            placeholder={single ? t.explorer.searchHere : t.explorer.searchIn(root)}
            placeholderTextColor={WIN.shadow}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel={single ? t.explorer.searchHereA11y : t.explorer.searchInA11y(root)}
            style={styles.searchInput}
          />
        </View>
      </View>

      <View style={styles.address} accessibilityLabel={t.explorer.path(path)}>
        <Text style={styles.addressText} numberOfLines={1}>
          {path}
        </Text>
      </View>

      <View style={[styles.content, { maxHeight: height * 0.5 }]}>
        <ScrollView contentContainerStyle={{ padding: 8, gap: 2 }} keyboardShouldPersistTaps="handled">
          {current ? (
            <FileView file={current} width={viewW} query={query} />
          ) : searching ? (
            hits.length === 0 ? (
              <Text style={styles.empty}>{t.explorer.noHits(query.trim())}</Text>
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
                    right={fileTag?.(h.folder, h.file)}
                    onPress={() => openHit(h.folder, h.file)}
                  />
                );
              })
            )
          ) : open ? (
            open.files.map((x, i) => (
              <Row
                key={x.name}
                icon={ICON_OF[x.kind]}
                title={x.name}
                sub={t.explorer.kinds[x.kind]}
                right={fileTag?.(folder!, i) ?? `${fileSizeKb(x)} KB`}
                onPress={() => setFile(i)}
              />
            ))
          ) : folders.length === 0 ? (
            <Text style={styles.empty}>{t.explorer.empty}</Text>
          ) : grouped && group === null ? (
            groups.map((g) => {
              const n = folders.filter((f) => (f.group ?? '') === g).length;
              return <Row key={g} icon="folder" title={g} sub={t.explorer.folderCount(n)} onPress={() => setGroup(g)} />;
            })
          ) : organizing && manage ? (
            visible.map(({ f, i }, k) => (
              <View key={f.name + i} style={styles.manageRow}>
                <Icon name="folder" size={26} />
                <Text style={[styles.rowTitle, { flex: 1 }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                  {f.name}
                </Text>
                <MiniBtn label="▲" hint={t.explorer.moveUp} disabled={k === 0} onPress={() => manage.onSwap(i, visible[k - 1]!.i)} />
                <MiniBtn
                  label="▼"
                  hint={t.explorer.moveDown}
                  disabled={k === visible.length - 1}
                  onPress={() => manage.onSwap(i, visible[k + 1]!.i)}
                />
                <MiniBtn
                  label="✕"
                  hint={t.explorer.deleteFolder(f.name)}
                  onPress={() =>
                    Alert.alert(t.explorer.deleteTitle, t.explorer.deleteText(f.name), [
                      { text: t.common.cancel, style: 'cancel' },
                      { text: t.common.delete, style: 'destructive', onPress: () => manage.onDelete(i) },
                    ])
                  }
                />
              </View>
            ))
          ) : (
            visible.map(({ f, i }) => (
              <Row
                key={f.name + i}
                icon="folder"
                title={f.name}
                sub={t.explorer.objects(f.files.length)}
                onPress={() => setFolder(i)}
              />
            ))
          )}
        </ScrollView>
      </View>

      {action ? <Button label={action.label} sub={action.sub} variant="ghost" disabled={action.disabled} onPress={action.onPress} /> : null}

      {manage && folder === null && !searching && folders.length > 0 && (!grouped || group !== null) ? (
        <View style={styles.manageBar}>
          <View style={{ flex: 1 }}>
            <Button label={organizing ? t.explorer.done : t.explorer.organize} variant="ghost" onPress={() => setOrganizing((o) => !o)} />
          </View>
          {organizing ? (
            <>
              <View style={{ flex: 1 }}>
                <Button label={t.explorer.sort} variant="ghost" onPress={manage.onSort} />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label={t.explorer.deleteAll}
                  variant="ghost"
                  onPress={() =>
                    Alert.alert(t.explorer.deleteAllTitle, t.explorer.deleteAllText, [
                      { text: t.common.cancel, style: 'cancel' },
                      { text: t.common.delete, style: 'destructive', onPress: manage.onClear },
                    ])
                  }
                />
              </View>
            </>
          ) : null}
        </View>
      ) : null}
      <Text style={styles.status} maxFontSizeMultiplier={1.2}>
        {searching
          ? t.explorer.hits(hits.length)
          : open
            ? t.explorer.objects(open.files.length)
            : grouped && group === null
              ? t.explorer.areas(groups.length, folders.length)
              : t.explorer.folderCount(visible.length)}
      </Text>
      {actions}
      <Button label={closeLabel} variant={actions ? 'ghost' : 'primary'} onPress={onClose} />
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
    minHeight: 200,
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
  sheet: { gap: 6 },
  field: { flexDirection: 'row', gap: 8, borderBottomWidth: 1, borderBottomColor: '#DFDFDF', paddingVertical: 4 },
  fieldKey: { width: 110, fontWeight: '800' },
  quote: { gap: 8, borderLeftWidth: 4, borderLeftColor: '#000080', paddingLeft: 10 },
  quoteText: { fontStyle: 'italic', fontSize: 16 },
  mailHead: { gap: 2, backgroundColor: '#ECECEC', padding: 8, borderWidth: 1, borderColor: '#C0C0C0' },
  mailLine: { color: INK, fontSize: 13 },
  bar: { backgroundColor: '#000000', color: '#000000' },
  empty: { color: '#505860', fontSize: 14, padding: 12 },
  mark: { backgroundColor: '#FFE680', color: INK, fontWeight: '800' },
  status: { color: WIN.dark, fontSize: 12 },
});
