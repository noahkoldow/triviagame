import { describe, expect, it } from 'vitest';
import {
  AREAS,
  CORE_ZONE,
  MOCK_QUESTIONS,
  Pool,
  ROOT_QUESTIONS,
  SECTORS,
  areasOfSector,
  growWaitingNodes,
  initialPlayer,
  initialUnlockedAreas,
  migrateArea,
  migrateSave,
  recordCorrect,
  sectorOfArea,
  zoneOf,
  type PlayerState,
} from './index';

const pool = new Pool(MOCK_QUESTIONS);

describe('taxonomy', () => {
  it('has four sectors with three areas each, every area with questions and a scope', () => {
    expect(AREAS).toHaveLength(12);
    for (const s of SECTORS) expect(areasOfSector(s)).toHaveLength(3);
    for (const a of AREAS) {
      expect(a.scope.length, a.id).toBeGreaterThan(20);
      expect(MOCK_QUESTIONS.filter((q) => q.area === a.id).length, a.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('starts every sector in its free first area', () => {
    for (const s of SECTORS) {
      const root = pool.get(ROOT_QUESTIONS[s]);
      expect(sectorOfArea(root.area)).toBe(s);
      expect(initialUnlockedAreas()).toContain(root.area);
    }
  });
});

describe('migrating old saves', () => {
  it('moves old areas, sectors and story beats to the new names', () => {
    const fresh = initialPlayer(pool);
    const old = {
      ...fresh,
      unlockedAreas: ['physics', 'biology', 'music', 'antiquity', 'chemistry', 'unknown'],
      skill: { chemistry: 1100, physics: 1000, music: 900 },
      interest: { animals: { a: 3, b: 1 } },
      network: {
        ...fresh.network,
        outposts: [{ id: 'o-literature', area: 'literature', x: 0, y: 900, connected: false }],
        firewalls: [{ id: 'fw-science-nature', a: 'science', b: 'nature', x: 1, y: -1, broken: true, attempts: 2 }],
      },
      story: { ...fresh.story, seen: ['first-link', 'wake-nature'] },
    } as unknown as PlayerState;
    const m = migrateSave(old);
    expect(m.unlockedAreas.sort()).toEqual([...new Set([...initialUnlockedAreas(), 'biomedicine', 'arts'])].sort());
    expect(m.skill).toEqual({ physics: 1100, arts: 900 });
    expect(Object.keys(m.interest)).toEqual(['biomedicine']);
    // the walls replace outposts and the old firewalls on the sector borders: open areas are open behind a gap
    expect('outposts' in m.network).toBe(false);
    expect(m.network.firewalls).toHaveLength(8);
    for (const f of m.network.firewalls!) {
      const open = ['biomedicine', 'arts'].includes(f.area);
      expect(f.broken, f.area).toBe(open);
      if (open) expect(f.breach!.from).toBe(CORE_ZONE);
    }
    expect(m.story.seen).toEqual(['first-link', 'wake-earth']);
    expect(migrateArea('computing')).toBe('technology');
    expect(migrateArea('nope')).toBeUndefined();
  });

  it('moves the nodes of an old map into the zones of their areas', () => {
    const fresh = initialPlayer(pool);
    const far = { ...fresh.network.nodes['n0']!, id: 'n4', kind: 'deepen' as const, questionId: 'sci-light', pos: { x: 30, y: -900, z: 0.5 } };
    const old = {
      ...fresh,
      network: {
        ...fresh.network,
        nodes: { ...fresh.network.nodes, n4: far },
        firewalls: [{ id: 'fw-science-earth', a: 'science', b: 'earth', x: 300, y: -300, broken: true, attempts: 1 }],
      },
    } as unknown as PlayerState;
    const m = migrateSave(old, pool);
    const n4 = m.network.nodes['n4']!;
    expect(zoneOf(n4.pos.x, n4.pos.y)).toBe(CORE_ZONE);
    expect(m.network.nodes['n0']!.pos).toEqual(fresh.network.nodes['n0']!.pos);
    // without a pool the nodes stay where they are
    expect(migrateSave(old).network.nodes['n4']!.pos).toEqual(far.pos);
  });

  it('moves the folders of the old cache into the folder structure', () => {
    const p = initialPlayer(pool);
    const old = {
      ...p,
      archive: [{ questionId: 'sci-light', fragmentId: 'sci-light-f1' }],
      cache: [
        { questionId: 'sci-light', fragmentId: 'sci-light-f1' },
        { questionId: 'sci-light', fragmentId: 'sci-light-f2' },
        { questionId: 'nat-everest', fragmentId: 'nat-everest-f1', file: 'Notiz.txt' },
      ],
    } as unknown as PlayerState;
    const m = migrateSave(old);
    expect(m.archive.map((a) => a.fragmentId)).toEqual(['sci-light-f1', 'sci-light-f2']);
    expect(m.cache).toEqual([{ questionId: 'nat-everest', fragmentId: 'nat-everest-f1', file: 'Notiz.txt' }]);
  });

  it('leaves a current save as it is', () => {
    const p = recordCorrect(initialPlayer(pool), pool, 'n0', '2026-10-01', 0).player;
    const m = migrateSave(p);
    expect(m.unlockedAreas).toEqual(p.unlockedAreas);
    expect(m.network).toBe(p.network);
    expect(migrateSave(p, pool).network).toBe(p.network);
    expect(m.story).toEqual(p.story);
  });
});

describe('open end', () => {
  it('a branch without questions waits and grows once new questions arrive', () => {
    // a pool with nothing but the four starting questions: solving one finds no children
    const roots = Object.values(ROOT_QUESTIONS);
    const small = new Pool(MOCK_QUESTIONS.filter((q) => roots.includes(q.id)));
    const r = recordCorrect(initialPlayer(small), small, 'n0', '2026-10-01', 0);
    expect(r.spawned).toEqual([]);
    expect(r.player.network.nodes['n0']!.waiting).toEqual(['deepen', 'bridge']);
    expect(growWaitingNodes(r.player, small, 'a')).toBeNull();

    // new questions arrive (in the app: from the shared pool on the server)
    const grown = growWaitingNodes(r.player, pool, 'a')!;
    expect(grown.spawned.length).toBe(2);
    expect(grown.player.network.nodes['n0']!.waiting).toBeUndefined();
    const kinds = grown.spawned.map((id) => grown.player.network.nodes[id]!.kind).sort();
    expect(kinds).toEqual(['bridge', 'deepen']);
  });

  it('a deepening at the top of an area still goes on with any new question of that area', () => {
    const top = MOCK_QUESTIONS.filter((q) => q.area === 'physics').sort((a, b) => b.difficulty - a.difficulty)[0]!;
    const easier = MOCK_QUESTIONS.filter((q) => q.area === 'physics' && q.difficulty < top.difficulty);
    const p = initialPlayer(new Pool(MOCK_QUESTIONS), { ...ROOT_QUESTIONS, science: top.id });
    const r = recordCorrect(p, new Pool(MOCK_QUESTIONS), 'n0', '2026-10-01', 0);
    const deep = r.spawned.map((id) => r.player.network.nodes[id]!).find((n) => n.kind === 'deepen');
    expect(deep).toBeDefined();
    expect(easier.length).toBeGreaterThan(0);
  });
});
