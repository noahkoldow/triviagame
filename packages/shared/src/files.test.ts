import { describe, expect, it } from 'vitest';
import {
  MOCK_QUESTIONS,
  chartText,
  fileText,
  fragmentFiles,
  matchRanges,
  normalizeText,
  searchFiles,
  validateChart,
  validateFiles,
  type FragmentFile,
} from './index';

const withFiles = MOCK_QUESTIONS.flatMap((q) => q.fragments.filter((f) => f.files && f.files.length > 0).map((f) => ({ q, f })));

describe('cache folders with files', () => {
  it('a fragment without files holds one note with its fact', () => {
    const f = MOCK_QUESTIONS[0]!.fragments.find((x) => !x.files)!;
    const files = fragmentFiles(f);
    expect(files).toHaveLength(1);
    expect(files[0]!.kind).toBe('note');
    expect(files[0]!.text).toBe(f.text);
  });

  it('several folders have files, of all three kinds', () => {
    expect(withFiles.length).toBeGreaterThanOrEqual(12);
    const kinds = new Set(withFiles.flatMap(({ f }) => f.files!.map((x) => x.kind)));
    expect([...kinds].sort()).toEqual(['article', 'image', 'note']);
    const charts = new Set(withFiles.flatMap(({ f }) => f.files!.filter((x) => x.chart).map((x) => x.chart!.chart)));
    expect([...charts].sort()).toEqual(['bars', 'table', 'timeline']);
  });

  it('every file passes the same rules as AI-written files', () => {
    for (const { q, f } of withFiles) {
      const v = validateFiles(f.files);
      expect(v.errors, `${q.id} / ${f.hint}`).toEqual([]);
    }
  });

  it('the numbers of a fragment are always findable in its folder', () => {
    const nums = (s: string) => (s.replace(/(\d)\.(\d{3})/g, '$1$2').match(/\d+/g) ?? []).filter((n) => n.length >= 2 || Number(n) > 1);
    for (const { q, f } of withFiles) {
      const all = f.files!.map(fileText).join('\n').replace(/(\d)\.(\d{3})/g, '$1$2');
      for (const n of nums(f.text)) expect(all, `${q.id} / ${f.hint}: ${n}`).toContain(n);
    }
  });

  it('articles are short and split into paragraphs', () => {
    for (const { f } of withFiles) {
      for (const file of f.files!.filter((x) => x.kind === 'article')) {
        expect(file.text!.length).toBeLessThanOrEqual(900);
        expect(file.text!.split('\n\n').length).toBeGreaterThanOrEqual(3);
        expect(file.source).toBeTruthy();
      }
    }
  });

  it('images have a text for screen readers', () => {
    for (const { f } of withFiles) {
      for (const file of f.files!.filter((x) => x.kind === 'image')) expect(file.alt!.length).toBeGreaterThanOrEqual(10);
    }
  });
});

describe('search', () => {
  const folders = [
    {
      name: 'Entfernung',
      files: [
        { name: 'Notiz.txt', kind: 'note', text: 'Die Römer bauten Straßen quer durch Europa.' },
        { name: 'Planeten.png', kind: 'image', alt: 'Balken.', chart: { chart: 'bars', title: 'Entfernung zur Sonne', unit: 'Mio. km', items: [{ label: 'Erde', value: 150 }, { label: 'Mars', value: 228 }] } },
      ] as FragmentFile[],
    },
    { name: 'Wetter', files: [{ name: 'Regen.txt', kind: 'note', text: 'Im April regnet es oft, die Sonne scheint dann nur kurz.' }] as FragmentFile[] },
  ];

  it('ignores case and accents', () => {
    expect(searchFiles(folders, 'ROMER')[0]!.folder).toBe(0);
    expect(searchFiles(folders, 'strasse')).toHaveLength(1);
  });

  it('looks into images: titles, labels and numbers', () => {
    const hits = searchFiles(folders, '228');
    expect(hits).toHaveLength(1);
    expect(folders[hits[0]!.folder]!.files[hits[0]!.file]!.name).toBe('Planeten.png');
    expect(searchFiles(folders, 'mars')).toHaveLength(1);
  });

  it('finds the folder name too', () => {
    expect(searchFiles(folders, 'wetter')[0]!.folder).toBe(1);
  });

  it('ranks files with more of the words first', () => {
    const hits = searchFiles(folders, 'sonne entfernung');
    expect(hits[0]!.file).toBe(1);
    expect(hits[0]!.folder).toBe(0);
    expect(hits.length).toBe(3);
    expect(hits[0]!.score).toBeGreaterThan(hits[hits.length - 1]!.score);
  });

  it('returns a snippet around the match', () => {
    const h = searchFiles(folders, 'april')[0]!;
    expect(h.snippet.toLowerCase()).toContain('april');
    expect(h.snippet.length).toBeLessThan(160);
  });

  it('answers nothing for empty or one-letter queries', () => {
    expect(searchFiles(folders, '')).toEqual([]);
    expect(searchFiles(folders, ' a ')).toEqual([]);
    expect(searchFiles(folders, 'xyzzy')).toEqual([]);
  });

  it('normalises accents and the sharp s', () => {
    expect(normalizeText('Römer')).toBe('romer');
    expect(normalizeText('Straße')).toBe('strasse');
    expect(normalizeText('Ärger über Öl')).toBe('arger uber ol');
  });

  it('keeps the snippet readable, with its accents', () => {
    const f = [{ name: 'Ordner', files: [{ name: 'A.txt', kind: 'note', text: 'Auf der Straße vor dem Haus steht ein Baum.' }] as FragmentFile[] }];
    expect(searchFiles(f, 'strasse')[0]!.snippet).toContain('Straße');
  });
});

describe('charts', () => {
  it('describes a chart in words', () => {
    const t = chartText({ chart: 'timeline', title: 'Berlin', events: [{ label: 'Einheit', year: 1990 }, { label: 'Mauerbau', year: 1961 }] });
    expect(t.indexOf('1961')).toBeLessThan(t.indexOf('1990'));
  });

  it('rejects broken chart specs', () => {
    const bad = (c: unknown) => validateChart(c).errors.length > 0;
    expect(bad(null)).toBe(true);
    expect(bad({ chart: 'pie', title: 'Kuchen' })).toBe(true);
    expect(bad({ chart: 'bars', title: 'Balken', items: [{ label: 'a', value: 1 }] })).toBe(true);
    expect(bad({ chart: 'bars', title: 'Balken', items: [{ label: 'a', value: 1 }, { label: 'b', value: 'viel' }] })).toBe(true);
    expect(bad({ chart: 'bars', title: 'Balken', items: [{ label: 'a', value: 1 }, { label: 'A', value: 2 }] })).toBe(true);
    expect(bad({ chart: 'timeline', title: 'Zeit', events: [{ label: 'a', year: 1900.5 }, { label: 'b', year: 1950 }] })).toBe(true);
    expect(bad({ chart: 'table', title: 'Tabelle', columns: ['a', 'b'], rows: [['1']] })).toBe(true);
    expect(bad({ chart: 'bars', title: 'Balken', items: [{ label: 'a', value: 1 }, { label: 'b', value: 2 }] })).toBe(false);
  });

  it('rejects broken files', () => {
    const bad = (f: unknown) => validateFiles(f).errors.length > 0;
    expect(bad('x')).toBe(true);
    expect(bad([])).toBe(true);
    expect(bad([{ name: 'A.txt', kind: 'note', text: 'Ein kurzer Text, der lang genug ist.' }, { name: 'a.txt', kind: 'note', text: 'Noch ein Text, der lang genug ist.' }])).toBe(true);
    expect(bad([{ name: 'Bild.png', kind: 'image', chart: { chart: 'bars', title: 'Balken', items: [{ label: 'a', value: 1 }, { label: 'b', value: 2 }] } }])).toBe(true); // no alt text
    expect(bad([{ name: 'Artikel.txt', kind: 'article', text: 'x'.repeat(300) }])).toBe(true); // no paragraphs
    expect(bad([{ name: 'Notiz.txt', kind: 'note', text: 'Ein kurzer Text, der lang genug ist.' }])).toBe(false);
  });
});

describe('highlighting', () => {
  it('finds the matches in the original text, ignoring case and accents', () => {
    const t = 'Die Römer bauten Straßen. Römer waren fleißig.';
    const r = matchRanges(t, 'romer strasse');
    expect(r.map(([a, b]) => t.slice(a, b))).toEqual(['Römer', 'Straße', 'Römer']);
  });

  it('merges words that touch and ignores empty queries', () => {
    expect(matchRanges('abcdef', 'abc cde').map(([a, b]) => 'abcdef'.slice(a, b))).toEqual(['abcde']);
    expect(matchRanges('abc', '')).toEqual([]);
    expect(matchRanges('abc', 'x')).toEqual([]);
  });
});
