import type { PlayerState } from './game';
import type { Pool } from './network';
import { seededRng } from './rng';
import { BASE_SKILL, targetDifficulty, type SkillMap } from './skill';
import { SECTORS, areasOfSector, sectorOfArea } from './taxonomy';
import type { NetNode, Question, Sector } from './types';
import { hexDistance, worldToHex } from './hex';
import {
  CORE_ZONE,
  OUTER_ZONES,
  WALL_REACH,
  WALL_SIGHT,
  approachOf,
  breachCells,
  wallBetween,
  wallCells,
  zoneOf,
  type Breach,
} from './walls';

/**
 * Firewalls (bosses) are the walls around the eight outer areas (see `walls.ts`). Once the
 * network stands right at one, the player can attack it: a short series of questions, half from
 * the area the network comes from and half from the area behind the wall. Breaking it tears a
 * gap into the wall at that spot and opens the area behind.
 */
export interface Firewall {
  /** `fw-<area>` */
  id: string;
  /** The area behind this wall. */
  area: string;
  broken: boolean;
  /** Failed fights so far; a new fight draws a new set of questions. */
  attempts: number;
  /** The gap in the wall, where the network broke (or bought, see `bought`) its way in. */
  breach?: Breach;
  /** Opened with gems instead of a fight; the story only counts fights. */
  bought?: boolean;
}

/** Questions in a fight (half from each side) and how many must be right. */
export const BOSS_QUESTIONS = 4;
export const BOSS_PASS = 3;
/** What breaking a firewall pays. */
export const BOSS_REWARD = { xp: 60, bits: 40, gems: 3 };

/** One firewall around every outer area. */
export function createFirewalls(): Firewall[] {
  return OUTER_ZONES.map((z) => ({ id: `fw-${z.area}`, area: z.area, broken: false, attempts: 0 }));
}

type Placed = { pos: { x: number; y: number } };

/** A firewall can only be attacked once a node stands right at its wall (`WALL_REACH` cells). */
export function firewallReached(nodes: Placed[], fw: Firewall): boolean {
  const a = approachOf(nodes, fw.area);
  return !!a && a.cells <= WALL_REACH;
}

/** Roughly how many more nodes the network needs to reach a firewall (for the player). */
export function firewallSteps(nodes: Placed[], fw: Firewall): number {
  const a = approachOf(nodes, fw.area);
  if (!a) return 1;
  // a cell is about 40 world units, a step about 110
  return Math.max(1, Math.ceil(((a.cells - WALL_REACH) * 40) / 110));
}

/**
 * Where a branch growing from `from` should lean: the nearest wall cell of a firewall that still
 * stands and that the network has not reached yet. From the core zone a branch only leans toward
 * the outer areas of its own sector, so it stays in its wedge.
 */
export function wallTarget(
  firewalls: Firewall[] | undefined,
  nodes: Placed[],
  from: { x: number; y: number },
  sector: Sector,
): { firewall: Firewall; x: number; y: number } | undefined {
  const zone = zoneOf(from.x, from.y);
  let best: { firewall: Firewall; x: number; y: number } | undefined;
  let bd = Infinity;
  for (const f of firewalls ?? []) {
    if (f.broken || (zone === CORE_ZONE && sectorOfArea(f.area) !== sector)) continue;
    const cells = wallBetween(f.area, zone);
    if (cells.length === 0 || firewallReached(nodes, f)) continue;
    for (const c of cells) {
      const d = Math.hypot(c.x - from.x, c.y - from.y);
      if (d < bd) {
        bd = d;
        best = { firewall: f, x: c.x, y: c.y };
      }
    }
  }
  return best;
}

/** The area a fight against a firewall comes from: that of the node nearest to its wall. */
export function fightFrom(pool: Pool, nodes: NetNode[], fw: Firewall): string {
  const a = approachOf(nodes, fw.area);
  return a ? pool.get(a.node.questionId).area : areasOfSector(sectorOfArea(fw.area))[0]!.id;
}

/** The final duel against MORPH in the core: two questions from every sector, six must be right. */
export const FINALE_ID = 'core';
export const FINALE_QUESTIONS = 8;
export const FINALE_PASS = 6;
export const FINALE_REWARD = { xp: 200, bits: 150, gems: 10 };

/** Questions near the player's level (plus `bias`) among `cands`, with some randomness. */
function nearLevel(cands: Question[], count: number, skill: SkillMap, rng: () => number, bias = 0): Question[] {
  const scored = cands.map((q) => ({
    q,
    d: Math.abs(q.difficulty - targetDifficulty(skill[q.area] ?? BASE_SKILL) - bias) + rng() * 1.5,
  }));
  return scored.sort((x, y) => x.d - y.d).slice(0, count).map((x) => x.q);
}

/** Questions of an area near the player's level; its sector fills up when the area has too few. */
function nearArea(pool: Pool, area: string, count: number, skill: SkillMap, rng: () => number, skip: Set<string>): Question[] {
  const own = nearLevel(pool.list.filter((q) => q.area === area && !skip.has(q.id)), count, skill, rng);
  if (own.length >= count) return own;
  const taken = new Set([...skip, ...own.map((q) => q.id)]);
  const sector = sectorOfArea(area);
  const more = pool.list.filter((q) => sectorOfArea(q.area) === sector && !taken.has(q.id));
  return [...own, ...nearLevel(more, count - own.length, skill, rng)];
}

/** Takes one question from each list in turn. */
function interleave(lists: Question[][]): Question[] {
  const out: Question[] = [];
  const longest = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < longest; i++) {
    for (const l of lists) if (l[i]) out.push(l[i]!);
  }
  return out;
}

/**
 * The questions of one fight, alternating between the two sides of the wall: two of the area
 * the network comes from (`from`, see `fightFrom`) and two of the area behind the wall, near the
 * player's level. Deterministic for a firewall, attempt and side.
 */
export function bossQuestions(pool: Pool, fw: Firewall, skill: SkillMap, from: string): Question[] {
  const rng = seededRng(`boss:${fw.id}:${fw.attempts}`);
  const half = BOSS_QUESTIONS / 2;
  const qa = nearArea(pool, from, half, skill, rng, new Set());
  const qb = nearArea(pool, fw.area, half, skill, rng, new Set(qa.map((q) => q.id)));
  return interleave([qa, qb]);
}

/** The final duel: two questions per sector, one step above the player's level, in sector turns. */
export function finaleQuestions(pool: Pool, attempt: number, skill: SkillMap): Question[] {
  const rng = seededRng(`finale:${attempt}`);
  const per = FINALE_QUESTIONS / SECTORS.length;
  return interleave(
    SECTORS.map((s) => nearLevel(pool.list.filter((q) => sectorOfArea(q.area) === s), per, skill, rng, 1)),
  );
}

export interface BossOutcome {
  player: PlayerState;
  passed: boolean;
  /** Node ids that appeared in the new zone. */
  spawned: string[];
  /** Areas that were opened. */
  areas: string[];
}

/**
 * How a wall cell looks: `active` stands in front of the network and can be attacked, `locked`
 * still waits for it, `calm` no longer guards anything (both sides are open), `gap` has fallen.
 */
export type WallLook = 'active' | 'locked' | 'calm' | 'gap';

export interface WallSight {
  /** The wall cells within `WALL_SIGHT` cells of a node; `away` is that distance. */
  cells: { key: string; x: number; y: number; look: WallLook; away: number; firewall?: string }[];
  /** One sign per standing firewall in sight, where the network comes closest to it. */
  signs: { firewall: string; area: string; x: number; y: number; reached: boolean }[];
}

/** What the map shows of the walls: only the parts the network has come close to (fog of war). */
export function wallsInSight(nodes: Placed[], firewalls: Firewall[]): WallSight {
  const hexes = nodes.map((n) => worldToHex(n.pos.x, n.pos.y));
  const gaps = new Set(firewalls.flatMap((f) => (f.breach ? breachCells(f.area, f.breach).map((c) => c.key) : [])));
  const standing = new Map(firewalls.filter((f) => !f.broken).map((f) => [f.area, f]));
  const reached = new Map([...standing.values()].map((f) => [f.id, firewallReached(nodes, f)]));
  const cells: WallSight['cells'] = [];
  const seen = new Set<string>();
  for (const c of wallCells()) {
    let away = Infinity;
    for (const h of hexes) {
      away = Math.min(away, hexDistance(h, c.hex));
      if (away === 0) break;
    }
    if (away > WALL_SIGHT) continue;
    const fw = c.zones.map((z) => standing.get(z)).find((f) => f);
    const look: WallLook = gaps.has(c.key) ? 'gap' : fw ? (reached.get(fw.id) ? 'active' : 'locked') : 'calm';
    cells.push({ key: c.key, x: c.x, y: c.y, look, away, firewall: fw?.id });
    if (fw && look !== 'gap') seen.add(fw.id);
  }
  const signs: WallSight['signs'] = [];
  for (const f of standing.values()) {
    if (!seen.has(f.id)) continue;
    const a = approachOf(nodes, f.area);
    if (a) signs.push({ firewall: f.id, area: f.area, x: a.cell.x, y: a.cell.y, reached: !!reached.get(f.id) });
  }
  return { cells, signs };
}
