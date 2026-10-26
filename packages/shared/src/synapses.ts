import type { PlayerState } from './game';
import { AREA_LINKS } from './links';
import type { Pool } from './network';
import { seededRng } from './rng';
import type { NetNode, NetworkState, Question } from './types';
import { wallBetween, zoneOf, type Breach } from './walls';

/**
 * Synapses (D61). Knowledge is worth more when it is connected. Two related areas (`AREA_LINKS`)
 * in which the player has solved enough can be joined by a probe: questions the player already
 * solved in both, answered from memory. A synapse shows as a glowing arc between the two areas,
 * tears a gap where they share a wall (a shortcut for the network), and raises the network's
 * connectedness for good: every synapse adds to the XP and bits of every answer.
 */

/** Solved nodes needed in each of the two areas. */
export const SYNAPSE_NEED = 4;
/** Questions in a probe (half from each area) and how many must be right. */
export const SYNAPSE_QUESTIONS = 4;
export const SYNAPSE_PASS = 3;
/** What every synapse adds to the XP and bits of an answer. */
export const SYNAPSE_BONUS = 0.05;
/** What joining two areas pays once. */
export const SYNAPSE_REWARD = { xp: 40, bits: 20, gems: 2 };

export interface Synapse {
  /** `syn-<a>-<b>`, in the order of `AREA_LINKS`. */
  id: string;
  a: string;
  b: string;
  /** The two solved nodes it joins, one of each area. */
  from: string;
  to: string;
  /** The gap in the wall between the two areas, when they share one. */
  gap?: { area: string; breach: Breach };
}

export const synapseId = (a: string, b: string) => `syn-${a}-${b}`;

export const isSynapseId = (id: string) => id.startsWith('syn-');

/** The two areas of a synapse id. */
export function synapsePair(id: string): [string, string] | undefined {
  return AREA_LINKS.find(([a, b]) => synapseId(a, b) === id);
}

function solvedIn(network: NetworkState, pool: Pool, area: string): NetNode[] {
  return Object.values(network.nodes).filter((n) => n.state !== 'open' && pool.byId.get(n.questionId)?.area === area);
}

/** A pair that can be joined, with the two closest solved nodes and the spot between them. */
export interface SynapseSpot {
  id: string;
  a: string;
  b: string;
  from: NetNode;
  to: NetNode;
  x: number;
  y: number;
  /** A probe failed today: the pair can be tried again tomorrow. */
  resting: boolean;
}

/** The pairs that can be joined now: both areas open, enough solved in each, not joined yet. */
export function synapseSpots(p: PlayerState, pool: Pool, today = ''): SynapseSpot[] {
  const joined = new Set((p.network.synapses ?? []).map((s) => s.id));
  const out: SynapseSpot[] = [];
  for (const [a, b] of AREA_LINKS) {
    const id = synapseId(a, b);
    if (joined.has(id) || !p.unlockedAreas.includes(a) || !p.unlockedAreas.includes(b)) continue;
    const na = solvedIn(p.network, pool, a);
    const nb = solvedIn(p.network, pool, b);
    if (na.length < SYNAPSE_NEED || nb.length < SYNAPSE_NEED) continue;
    let from = na[0]!;
    let to = nb[0]!;
    let bd = Infinity;
    for (const x of na) {
      for (const y of nb) {
        const d = Math.hypot(x.pos.x - y.pos.x, x.pos.y - y.pos.y);
        if (d < bd) {
          bd = d;
          from = x;
          to = y;
        }
      }
    }
    const resting = !!today && p.network.synapseTries?.[id]?.day === today;
    out.push({ id, a, b, from, to, x: (from.pos.x + to.pos.x) / 2, y: (from.pos.y + to.pos.y) / 2, resting });
  }
  return out;
}

/**
 * The open pair nearest to a synapse, for a counter ("Physik 3 / 4 · Bio 2 / 4"): both areas open,
 * not joined yet, the most solved nodes towards `SYNAPSE_NEED` (each capped there). None open: undefined.
 */
export function synapseProgress(p: PlayerState, pool: Pool): { a: string; b: string; na: number; nb: number } | undefined {
  const joined = new Set((p.network.synapses ?? []).map((s) => s.id));
  let best: { a: string; b: string; na: number; nb: number } | undefined;
  for (const [a, b] of AREA_LINKS) {
    if (joined.has(synapseId(a, b)) || !p.unlockedAreas.includes(a) || !p.unlockedAreas.includes(b)) continue;
    const na = Math.min(SYNAPSE_NEED, solvedIn(p.network, pool, a).length);
    const nb = Math.min(SYNAPSE_NEED, solvedIn(p.network, pool, b).length);
    if (!best || na + nb > best.na + best.nb) best = { a, b, na, nb };
  }
  return best;
}

/** How much more every answer pays for the synapses (0.05 each). */
export function networkBonus(p: PlayerState): number {
  return SYNAPSE_BONUS * (p.network.synapses?.length ?? 0);
}

/**
 * The questions of a probe: questions the player already solved, two of each area, in turns.
 * Deterministic for a pair and attempt; a new attempt draws others where there are.
 */
export function synapseQuestions(p: PlayerState, pool: Pool, id: string): Question[] {
  const pair = synapsePair(id);
  if (!pair) return [];
  const rng = seededRng(`${id}:${p.network.synapseTries?.[id]?.attempts ?? 0}`);
  const pick = (area: string) => {
    const qs = solvedIn(p.network, pool, area)
      .map((n) => pool.get(n.questionId))
      .sort((x, y) => (x.id < y.id ? -1 : 1));
    for (let i = qs.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [qs[i], qs[j]] = [qs[j]!, qs[i]!];
    }
    return qs.slice(0, SYNAPSE_QUESTIONS / 2);
  };
  const [qa, qb] = [pick(pair[0]), pick(pair[1])];
  return qa.flatMap((q, i) => (qb[i] ? [q, qb[i]!] : [q]));
}

/** The gap a synapse tears where its two areas share a wall: at the wall cell nearest to the spot between them. */
function gapFor(spot: SynapseSpot): Synapse['gap'] {
  const za = zoneOf(spot.from.pos.x, spot.from.pos.y);
  const zb = zoneOf(spot.to.pos.x, spot.to.pos.y);
  if (za === zb) return undefined;
  const cells = wallBetween(za, zb);
  if (cells.length === 0) return undefined;
  const near = cells.reduce((best, c) =>
    Math.hypot(c.x - spot.x, c.y - spot.y) < Math.hypot(best.x - spot.x, best.y - spot.y) ? c : best,
  );
  return { area: zb, breach: { x: near.x, y: near.y, from: za } };
}

export interface SynapseOutcome {
  player: PlayerState;
  passed: boolean;
  synapse?: Synapse;
}

/**
 * The result of a probe. Enough right answers join the two areas: a reward, the synapse and its
 * gap. Otherwise nothing is lost, but the pair rests until tomorrow (spacing helps remembering).
 */
export function recordSynapse(p: PlayerState, pool: Pool, id: string, correct: number, today: string): SynapseOutcome {
  const spot = synapseSpots(p, pool, today).find((s) => s.id === id && !s.resting);
  if (!spot) return { player: p, passed: false };
  if (correct < SYNAPSE_PASS) {
    const attempts = (p.network.synapseTries?.[id]?.attempts ?? 0) + 1;
    const synapseTries = { ...p.network.synapseTries, [id]: { day: today, attempts } };
    return { player: { ...p, network: { ...p.network, synapseTries } }, passed: false };
  }
  const gap = gapFor(spot);
  const synapse: Synapse = { id, a: spot.a, b: spot.b, from: spot.from.id, to: spot.to.id, ...(gap ? { gap } : {}) };
  return {
    player: {
      ...p,
      xp: p.xp + SYNAPSE_REWARD.xp,
      bits: p.bits + SYNAPSE_REWARD.bits,
      gems: p.gems + SYNAPSE_REWARD.gems,
      network: { ...p.network, synapses: [...(p.network.synapses ?? []), synapse] },
    },
    passed: true,
    synapse,
  };
}
