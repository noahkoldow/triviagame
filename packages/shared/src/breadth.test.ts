import { describe, expect, it } from 'vitest';
import {
  ALBUMS,
  ALBUM_REWARD,
  AREAS,
  AREA_LINKS,
  CORE_ZONE,
  MOCK_QUESTIONS,
  Pool,
  SYNAPSE_NEED,
  SYNAPSE_PASS,
  SYNAPSE_QUESTIONS,
  SYNAPSE_REWARD,
  VARIETY_BONUS,
  albumSolved,
  boosted,
  breachesOf,
  clampToZone,
  initialPlayer,
  networkBonus,
  recordCorrect,
  recordSynapse,
  storyFacts,
  synapseId,
  synapsePair,
  synapseQuestions,
  synapseSpots,
  varied,
  wallsInSight,
  zoneOf,
  zoneOfArea,
  type NetNode,
  type PlayerState,
} from './index';

const pool = new Pool(MOCK_QUESTIONS);
const DAY = '2026-10-01';
const NEXT = '2026-10-02';

/** Adds solved nodes for the given questions, spread inside the zones of their areas. */
function withSolved(p: PlayerState, ids: string[]): PlayerState {
  const nodes = { ...p.network.nodes };
  ids.forEach((qid, i) => {
    const area = pool.get(qid).area;
    const z = zoneOfArea(area);
    const a = Math.atan2(-1, 0.2) + i * 0.4;
    const r = z === CORE_ZONE ? 250 + (i % 3) * 40 : 800;
    let pos = clampToZone({ x: Math.cos(a) * r, y: Math.sin(a) * r }, z);
    if (z !== CORE_ZONE) {
      // somewhere inside the slice of that area
      const mid = { biomedicine: -1.96, technology: -1.18 }[area as 'biomedicine'] ?? 0;
      pos = clampToZone({ x: Math.cos(mid + (i % 3) * 0.05) * (700 + i * 30), y: Math.sin(mid + (i % 3) * 0.05) * (700 + i * 30) }, z);
    }
    const id = `x${i}`;
    nodes[id] = { id, questionId: qid, parentId: 'n0', kind: 'bridge', state: 'solved', pos: { ...pos, z: 0.5 }, attempts: 1, box: 0 } as NetNode;
  });
  return { ...p, network: { ...p.network, nodes, usedQuestions: [...p.network.usedQuestions, ...ids] } };
}

const PHYSICS = ['sci-light', 'sci-relativity', 'sci-water', 'sci-ph'];
const BIO = ['nat-photosynthesis', 'nat-chloroplast', 'nat-bee', 'nat-octopus'];

/** Physics and biology both open and solved enough to be joined. */
function readyPair(): PlayerState {
  const p = initialPlayer(pool);
  return withSolved({ ...p, unlockedAreas: [...p.unlockedAreas, 'biomedicine'] }, [...PHYSICS, ...BIO]);
}

describe('synapses', () => {
  it('join the related areas, one id per pair', () => {
    const ids = AREA_LINKS.map(([a, b]) => synapseId(a, b));
    expect(new Set(ids).size).toBe(AREA_LINKS.length);
    expect(synapsePair(synapseId('physics', 'biomedicine'))).toEqual(['physics', 'biomedicine']);
    expect(synapsePair('syn-nope')).toBeUndefined();
  });

  it('become possible once both areas are open and solved enough', () => {
    expect(synapseSpots(initialPlayer(pool), pool)).toEqual([]);
    const p = readyPair();
    const spots = synapseSpots(p, pool, DAY);
    expect(spots.map((s) => s.id)).toEqual([synapseId('physics', 'biomedicine')]);
    expect(spots[0]!.resting).toBe(false);
    // one solved node too few
    const fewer = withSolved({ ...initialPlayer(pool), unlockedAreas: p.unlockedAreas }, [...PHYSICS, ...BIO.slice(0, SYNAPSE_NEED - 1)]);
    expect(synapseSpots(fewer, pool)).toEqual([]);
    // an area that is not open does not count
    expect(synapseSpots(withSolved(initialPlayer(pool), [...PHYSICS, ...BIO]), pool)).toEqual([]);
    expect(storyFacts(p, pool).synapseReady).toBe(1);
  });

  it('probe with questions already solved in both areas, in turns, deterministic', () => {
    const p = readyPair();
    const id = synapseId('physics', 'biomedicine');
    const qs = synapseQuestions(p, pool, id);
    expect(qs).toHaveLength(SYNAPSE_QUESTIONS);
    expect(qs.map((q) => q.area)).toEqual(['physics', 'biomedicine', 'physics', 'biomedicine']);
    for (const q of qs) expect([...PHYSICS, ...BIO]).toContain(q.id);
    expect(synapseQuestions(p, pool, id).map((q) => q.id)).toEqual(qs.map((q) => q.id));
  });

  it('a failed probe costs nothing but rests the pair until tomorrow', () => {
    const p = readyPair();
    const id = synapseId('physics', 'biomedicine');
    const r = recordSynapse(p, pool, id, SYNAPSE_PASS - 1, DAY);
    expect(r.passed).toBe(false);
    expect(r.player.integrity).toBe(p.integrity);
    expect(synapseSpots(r.player, pool, DAY)[0]!.resting).toBe(true);
    expect(recordSynapse(r.player, pool, id, SYNAPSE_QUESTIONS, DAY).player).toBe(r.player);
    expect(synapseSpots(r.player, pool, NEXT)[0]!.resting).toBe(false);
    expect(recordSynapse(r.player, pool, id, SYNAPSE_QUESTIONS, NEXT).passed).toBe(true);
  });

  it('joining pays, raises every later reward and opens a gap where the areas share a wall', () => {
    const p = readyPair();
    const id = synapseId('physics', 'biomedicine');
    const r = recordSynapse(p, pool, id, SYNAPSE_PASS, DAY);
    expect(r.passed).toBe(true);
    expect(r.player.gems).toBe(p.gems + SYNAPSE_REWARD.gems);
    expect(r.player.network.synapses).toHaveLength(1);
    expect(networkBonus(r.player)).toBeCloseTo(0.05);
    expect(synapseSpots(r.player, pool, DAY)).toEqual([]);
    expect(storyFacts(r.player, pool).synapses).toBe(1);
    // the gap lies in the ring between the core and biology
    const gap = r.synapse!.gap!;
    expect([gap.area, gap.breach.from].sort()).toEqual(['biomedicine', CORE_ZONE].sort());
    expect(breachesOf(r.player.network.firewalls, r.player.network.synapses)).toContainEqual(gap);
    const sight = wallsInSight([{ id: 'n0', pos: gap.breach }], r.player.network.firewalls!, [gap]);
    expect(sight.cells.some((c) => c.look === 'gap')).toBe(true);
    // the next answer pays 5 % more XP
    const before = recordCorrect(p, pool, 'n0', DAY, 0);
    const after = recordCorrect(r.player, pool, 'n0', DAY, 0);
    expect(after.bonus.network).toBeCloseTo(0.05);
    expect(after.reward.xp).toBe(Math.round(before.reward.xp * 1.05));
  });

  it('two areas in the same zone need no gap', () => {
    const p = initialPlayer(pool);
    const both = withSolved(p, ['his-pyramid', 'his-rosetta', 'his-rome', 'his-wall', 'soc-eu', 'soc-un', 'soc-powers', 'his-states']);
    const id = synapseId('history', 'politics');
    const r = recordSynapse(both, pool, id, SYNAPSE_QUESTIONS, DAY);
    expect(r.passed).toBe(true);
    expect(r.synapse!.gap).toBeUndefined();
  });
});

describe('variety bonus', () => {
  it('needs five different areas among the last ten answers', () => {
    expect(varied(['physics', 'history', 'politics', 'geography'])).toBe(false);
    expect(varied(['physics', 'history', 'politics', 'geography', 'arts'])).toBe(true);
    // only the last ten count: arts has dropped out
    expect(varied(['arts', 'physics', 'physics', 'physics', 'physics', 'physics', 'physics', 'history', 'politics', 'geography', 'geography'])).toBe(false);
    expect(boosted({ xp: 100, bits: 100, gems: 1 }, 0.1, true)).toEqual({ xp: 110, bits: 130, gems: 1 });
  });

  it('raises the bits of an answer after varied answers', () => {
    const p = initialPlayer(pool);
    const plain = recordCorrect(p, pool, 'n0', DAY, 0);
    expect(plain.bonus.variety).toBe(false);
    const varied5 = recordCorrect({ ...p, recentAreas: ['history', 'politics', 'geography', 'arts'] }, pool, 'n0', DAY, 0);
    expect(varied5.bonus.variety).toBe(true);
    expect(varied5.reward.bits).toBe(Math.round(plain.reward.bits * (1 + VARIETY_BONUS)));
    expect(varied5.player.recentAreas).toEqual(['history', 'politics', 'geography', 'arts', 'physics']);
  });
});

describe('collection albums', () => {
  it('are made of built-in questions across at least two areas, and cover every area', () => {
    const covered = new Set<string>();
    for (const a of ALBUMS) {
      const areas = new Set(a.questions.map((q) => pool.get(q).area));
      expect(areas.size, a.id).toBeGreaterThanOrEqual(2);
      areas.forEach((x) => covered.add(x));
      expect(new Set(a.questions).size, a.id).toBe(a.questions.length);
    }
    expect([...covered].sort()).toEqual(AREAS.map((a) => a.id).sort());
  });

  it('pay once when the last question of an album is solved', () => {
    const album = ALBUMS.find((a) => a.id === 'europe')!;
    const [last, ...rest] = album.questions;
    let p = withSolved({ ...initialPlayer(pool), unlockedAreas: AREAS.map((a) => a.id) }, rest);
    expect(albumSolved(p.network, album)).toHaveLength(rest.length);
    // the last one as an open node that gets solved
    const open: NetNode = { ...p.network.nodes['x0']!, id: 'y0', questionId: last!, state: 'open', attempts: 0 };
    p = { ...p, network: { ...p.network, nodes: { ...p.network.nodes, y0: open } } };
    const r = recordCorrect(p, pool, 'y0', DAY, 0);
    expect(r.albums).toEqual(['europe']);
    expect(r.player.albums).toEqual(['europe']);
    expect(r.player.gems).toBe(p.gems + r.reward.gems + ALBUM_REWARD.gems);
    expect(zoneOf(open.pos.x, open.pos.y)).toBeTruthy();
    // a later answer does not pay it again
    expect(recordCorrect(r.player, pool, 'n0', DAY, 0).albums).toEqual([]);
  });
});
