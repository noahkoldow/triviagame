import type { ChartSpec, FileKind, Fragment, FragmentFile } from './types';

/**
 * The files inside a cache folder. A fragment has a short fact (`text`); its folder can
 * hold several files: notes, short articles and images (charts the game draws itself).
 * The fact is in one of them, the others add context or are red herrings, so the player
 * has to look and search.
 */

/** The files of a fragment; a fragment without files has one plain note with its fact. */
export function fragmentFiles(f: Fragment): FragmentFile[] {
  if (f.files && f.files.length > 0) return f.files;
  return [{ name: 'Notiz.txt', kind: 'note', text: f.text }];
}

/** All readable words of a chart: what the search looks through and screen readers can speak. */
export function chartText(c: ChartSpec): string {
  switch (c.chart) {
    case 'bars':
      return [c.title, ...c.items.map((i) => `${i.label} ${i.value}${c.unit ? ' ' + c.unit : ''}`)].join('. ');
    case 'timeline':
      return [c.title, ...[...c.events].sort((a, b) => a.year - b.year).map((e) => `${e.year}: ${e.label}`)].join('. ');
    case 'table':
      return [c.title, c.columns.join(' | '), ...c.rows.map((r) => r.join(' | '))].join('. ');
  }
}

/** Everything searchable in a file. */
export function fileText(file: FragmentFile): string {
  const parts = [file.name];
  if (file.text) parts.push(file.text);
  if (file.alt) parts.push(file.alt);
  if (file.chart) parts.push(chartText(file.chart));
  return parts.join('\n');
}

/** A short label for the kind of a file, as an old file manager would show it. */
export const KIND_LABEL: Record<FileKind, string> = {
  note: 'Textdokument',
  article: 'Artikel',
  image: 'Bild',
};

/** A believable size for the file list (bytes of its text, at least 1 KB). */
export function fileSizeKb(file: FragmentFile): number {
  return Math.max(1, Math.round(fileText(file).length / 1024) || 1);
}

/** Lower case without accents and with ß written as "ss", so "Römer" is found by "romer" and "Straße" by "strasse". */
export function normalizeText(s: string): string {
  return foldWithMap(s).text;
}

/** Like `normalizeText`, and for every character of the result the index of the character it came from. */
function foldWithMap(s: string): { text: string; map: number[] } {
  let text = '';
  const map: number[] = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/ß/g, 'ss')
      .toLowerCase();
    text += c;
    for (let k = 0; k < c.length; k++) map.push(i);
  }
  return { text, map };
}

export interface SearchFolder {
  name: string;
  files: FragmentFile[];
}

export interface SearchHit {
  folder: number;
  file: number;
  /** More matched words and more mentions rank higher. */
  score: number;
  /** A piece of text around the first match. */
  snippet: string;
}

/**
 * Searches the files of all folders for the words of the query (accents and case ignored).
 * A file matches when it contains any of the words; files that contain more of them come first.
 */
export function searchFiles(folders: SearchFolder[], query: string): SearchHit[] {
  const tokens = [...new Set(normalizeText(query).split(/\s+/).filter((t) => t.length >= 2))];
  if (tokens.length === 0) return [];
  const hits: SearchHit[] = [];
  folders.forEach((folder, fi) => {
    folder.files.forEach((file, fj) => {
      const original = `${folder.name}\n${fileText(file)}`;
      const { text, map } = foldWithMap(original);
      let matched = 0;
      let mentions = 0;
      let first = -1;
      for (const t of tokens) {
        let at = text.indexOf(t);
        if (at < 0) continue;
        matched++;
        if (first < 0 || at < first) first = at;
        while (at >= 0) {
          mentions++;
          at = text.indexOf(t, at + t.length);
        }
      }
      if (matched === 0) return;
      const start = map[first] ?? 0;
      const from = Math.max(0, start - 40);
      const to = Math.min(original.length, start + 90);
      const snippet = (from > 0 ? '…' : '') + original.slice(from, to).replace(/\s+/g, ' ').trim() + (to < original.length ? '…' : '');
      hits.push({ folder: fi, file: fj, score: matched * 10 + Math.min(mentions, 9), snippet });
    });
  });
  return hits.sort((a, b) => b.score - a.score || a.folder - b.folder || a.file - b.file);
}

// ---------------------------------------------------------------------------
// Validation of files and charts (used for AI drafts)

const isStr = (x: unknown): x is string => typeof x === 'string';
const clean = (x: unknown) => (isStr(x) ? x.trim() : '');

export function validateChart(raw: unknown): { chart?: ChartSpec; errors: string[] } {
  const errors: string[] = [];
  if (!raw || typeof raw !== 'object') return { errors: ['chart must be an object'] };
  const c = raw as Record<string, unknown>;
  const title = clean(c['title']);
  if (title.length < 3 || title.length > 60) errors.push('chart title must be 3 to 60 characters');
  switch (c['chart']) {
    case 'bars': {
      const items = (Array.isArray(c['items']) ? (c['items'] as unknown[]) : []).map((i) => {
        const o = (i && typeof i === 'object' ? i : {}) as Record<string, unknown>;
        return { label: clean(o['label']), value: o['value'] as number };
      });
      if (items.length < 2 || items.length > 6) errors.push('a bar chart needs 2 to 6 bars');
      if (items.some((i) => !i.label || i.label.length > 24 || typeof i.value !== 'number' || !Number.isFinite(i.value) || i.value < 0)) {
        errors.push('bars need a label (max 24 characters) and a value of 0 or more');
      }
      if (new Set(items.map((i) => i.label.toLowerCase())).size !== items.length) errors.push('bar labels must be unique');
      const unit = clean(c['unit']);
      if (errors.length === 0) return { chart: { chart: 'bars', title, unit: unit || undefined, items }, errors };
      break;
    }
    case 'timeline': {
      const events = (Array.isArray(c['events']) ? (c['events'] as unknown[]) : []).map((e) => {
        const o = (e && typeof e === 'object' ? e : {}) as Record<string, unknown>;
        return { label: clean(o['label']), year: o['year'] as number };
      });
      if (events.length < 2 || events.length > 6) errors.push('a timeline needs 2 to 6 events');
      if (events.some((e) => !e.label || e.label.length > 30 || !Number.isInteger(e.year))) errors.push('events need a label (max 30 characters) and a whole year');
      if (new Set(events.map((e) => e.year)).size !== events.length) errors.push('event years must be unique');
      if (errors.length === 0) return { chart: { chart: 'timeline', title, events }, errors };
      break;
    }
    case 'table': {
      const columns = Array.isArray(c['columns']) ? (c['columns'] as unknown[]).map(clean) : [];
      const rows = (Array.isArray(c['rows']) ? (c['rows'] as unknown[]) : []).map((r) => (Array.isArray(r) ? r.map(clean) : []));
      if (columns.length < 2 || columns.length > 5) errors.push('a table needs 2 to 5 columns');
      if (rows.length < 1 || rows.length > 6) errors.push('a table needs 1 to 6 rows');
      if (rows.some((r) => r.length !== columns.length)) errors.push('every row must have as many cells as there are columns');
      if ([...columns, ...rows.flat()].some((x) => x === '' || x.length > 24)) errors.push('table cells must be 1 to 24 characters');
      if (errors.length === 0) return { chart: { chart: 'table', title, columns, rows }, errors };
      break;
    }
    default:
      errors.push('chart must be "bars", "timeline" or "table"');
  }
  return { errors };
}

/** Checks the files of one fragment. Returns the cleaned files and every problem found. */
export function validateFiles(raw: unknown): { files: FragmentFile[]; errors: string[] } {
  const errors: string[] = [];
  const out: FragmentFile[] = [];
  if (!Array.isArray(raw)) return { files: [], errors: ['files must be a list'] };
  if (raw.length < 1 || raw.length > 5) errors.push('a folder holds 1 to 5 files');
  const names = new Set<string>();
  raw.forEach((r, i) => {
    const o = (r && typeof r === 'object' ? r : {}) as Record<string, unknown>;
    const at = `file ${i + 1}`;
    const name = clean(o['name']);
    const kind = o['kind'] as FileKind;
    if (name.length < 3 || name.length > 40) errors.push(`${at}: name must be 3 to 40 characters`);
    if (names.has(name.toLowerCase())) errors.push(`${at}: duplicate name "${name}"`);
    names.add(name.toLowerCase());
    if (!['note', 'article', 'image'].includes(kind)) {
      errors.push(`${at}: unknown kind`);
      return;
    }
    if (kind === 'image') {
      const c = validateChart(o['chart']);
      const alt = clean(o['alt']);
      c.errors.forEach((e) => errors.push(`${at}: ${e}`));
      if (alt.length < 10 || alt.length > 200) errors.push(`${at}: an image needs an alt text of 10 to 200 characters`);
      if (c.chart) out.push({ name, kind, chart: c.chart, alt });
      return;
    }
    const text = clean(o['text']);
    const max = kind === 'article' ? 900 : 400;
    if (text.length < 10 || text.length > max) errors.push(`${at}: text must be 10 to ${max} characters`);
    if (kind === 'article' && !(text.includes('\n\n') || text.length < 200)) errors.push(`${at}: an article is split into paragraphs`);
    const source = clean(o['source']);
    if (source.length > 80) errors.push(`${at}: source is too long`);
    out.push({ name, kind, text, source: source || undefined });
  });
  return { files: out, errors };
}

/**
 * Where the words of a query occur in a text, as ranges in the original text (accents and case
 * ignored), merged where they touch. Used to highlight what the search found.
 */
export function matchRanges(text: string, query: string): [number, number][] {
  const tokens = [...new Set(normalizeText(query).split(/\s+/).filter((t) => t.length >= 2))];
  if (tokens.length === 0) return [];
  const { text: folded, map } = foldWithMap(text);
  const raw: [number, number][] = [];
  for (const t of tokens) {
    let at = folded.indexOf(t);
    while (at >= 0) {
      const from = map[at]!;
      const to = (map[at + t.length - 1] ?? from) + 1;
      raw.push([from, to]);
      at = folded.indexOf(t, at + t.length);
    }
  }
  raw.sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [];
  for (const r of raw) {
    const last = out[out.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else out.push([r[0], r[1]]);
  }
  return out;
}
