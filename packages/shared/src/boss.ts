import type { PlayerState } from './game';
import type { Pool } from './network';
import { seededRng } from './rng';
import { BASE_SKILL, targetDifficulty, type SkillMap } from './skill';
import { SECTORS, areasOfSector, sectorOfArea } from './taxonomy';
import type { NetNode, Question, QuestionType, Sector } from './types';
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
 * network stands right at one, the player can attack it like a boss: the wall has layers, every
 * right answer tears one down, every wrong one lets morph.ai rebuild one (`strikeWall`). The
 * questions come half from the area the network comes from and half from the area behind the
 * wall. Breaking it tears a gap into the wall at that spot and opens the area behind.
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
  /** The nodes morph.ai damaged after the last lost fight here (D72); the wall waits until they are repaired. */
  pushed?: string[];
}

/** Layers of a firewall: a right answer tears one down, a wrong one lets morph.ai rebuild one. */
export const FIREWALL_HP = 4;
/** Questions in the attack window (half from each side); the wall holds when too few are left to break it. */
export const FIREWALL_ROUNDS = 8;
/** What breaking a firewall pays. */
export const BOSS_REWARD = { xp: 60, bits: 40, gems: 3 };

/** One firewall around every outer area. */
export function createFirewalls(): Firewall[] {
  return OUTER_ZONES.map((z) => ({ id: `fw-${z.area}`, area: z.area, broken: false, attempts: 0 }));
}

type Placed = { pos: { x: number; y: number }; state?: NetNode['state'] };

/** Only answered nodes hold ground at a wall: the open node right in front of it has to be solved first (D73). */
export function answeredNodes<N extends Placed>(nodes: N[]): N[] {
  return nodes.filter((n) => n.state !== 'open');
}

/** A firewall can only be attacked once an answered node stands right at its wall (`WALL_REACH` cells). */
export function firewallReached(nodes: Placed[], fw: Firewall): boolean {
  const a = approachOf(answeredNodes(nodes), fw.area);
  return !!a && a.cells <= WALL_REACH;
}

/**
 * Answered nodes the network needs before morph.ai lets it at a wall (D73): 15 for the first,
 * 5 more for every wall already broken. Distance alone does not hold a player back who follows
 * one branch outward; this does.
 */
export const WALL_QUOTA = 15;
export const WALL_QUOTA_STEP = 5;

export function wallQuota(firewalls: Firewall[] | undefined): number {
  return WALL_QUOTA + WALL_QUOTA_STEP * (firewalls ?? []).filter((f) => f.broken).length;
}

/** How many more nodes have to be answered before a reached wall can be attacked (0 = it can). */
export function wallQuotaLeft(nodes: Placed[], firewalls: Firewall[] | undefined): number {
  return Math.max(0, wallQuota(firewalls) - answeredNodes(nodes).length);
}

/** A firewall can be attacked: an answered node stands at it and the network has answered enough nodes. */
export function firewallReady(nodes: Placed[], firewalls: Firewall[] | undefined, fw: Firewall): boolean {
  return !fw.broken && firewallReached(nodes, fw) && wallQuotaLeft(nodes, firewalls) === 0;
}

/**
 * morph.ai strikes back after a lost fight (D72): it damages the solved nodes nearest to the wall,
 * two when the wall still stood strong (3 or more layers), one when it nearly fell.
 */
export function pushBackCount(layersLeft: number): number {
  return layersLeft >= 3 ? 2 : 1;
}

/** The `count` solved nodes nearest to the wall around the firewall's area, closest first. */
export function pushBackTargets(nodes: NetNode[], fw: Firewall, count: number): string[] {
  const near: { id: string; d: number }[] = [];
  for (const n of nodes) {
    if (n.state !== 'solved') continue;
    const zone = zoneOf(n.pos.x, n.pos.y);
    if (zone === fw.area) continue;
    const h = worldToHex(n.pos.x, n.pos.y);
    let d = Infinity;
    for (const c of wallBetween(fw.area, zone)) d = Math.min(d, hexDistance(h, c.hex));
    if (d < Infinity) near.push({ id: n.id, d });
  }
  return near
    .sort((a, b) => a.d - b.d || a.id.localeCompare(b.id))
    .slice(0, count)
    .map((x) => x.id);
}

/** The nodes morph.ai damaged at this firewall that still wait for their repair; until then it cannot be attacked. */
export function pushedBack(nodes: Record<string, NetNode>, fw: Firewall): string[] {
  return (fw.pushed ?? []).filter((id) => nodes[id]?.state === 'damaged');
}

/** Roughly how many more nodes the network needs to reach a firewall (for the player). */
export function firewallSteps(nodes: Placed[], fw: Firewall): number {
  // before anything is answered, measure from the starting nodes
  const a = approachOf(answeredNodes(nodes), fw.area) ?? approachOf(nodes, fw.area);
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
  const a = approachOf(answeredNodes(nodes), fw.area);
  return a ? pool.get(a.node.questionId).area : areasOfSector(sectorOfArea(fw.area))[0]!.id;
}

/**
 * The final duel against morph.ai in the core (D76): four phases, one per sector. In each phase
 * morph.ai takes another form and the guardian of the sector fights beside the player; of three
 * questions two must be right to break its shield, and a lost phase ends the duel. Every phase
 * has its own clock. One question per phase comes, where the player has one, from a folder filed
 * in the folder structure: who sorted well finds the answer there (in the duel the structure
 * opens without energy, but the clock runs on).
 */
export const FINALE_ID = 'core';
export const FINALE_PHASE_QUESTIONS = 3;
export const FINALE_PHASE_PASS = 2;
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
 * The questions of one fight, alternating between the two sides of the wall: half of the area
 * the network comes from (`from`, see `fightFrom`) and half of the area behind the wall, near the
 * player's level. Deterministic for a firewall, attempt and side.
 */
export function bossQuestions(pool: Pool, fw: Firewall, skill: SkillMap, from: string): Question[] {
  const rng = seededRng(`boss:${fw.id}:${fw.attempts}`);
  const half = FIREWALL_ROUNDS / 2;
  const qa = nearArea(pool, from, half, skill, rng, new Set());
  const qb = nearArea(pool, fw.area, half, skill, rng, new Set(qa.map((q) => q.id)));
  return interleave([qa, qb]);
}

/** One phase of the final duel: a sector, its questions, and those whose folder the player has filed. */
export interface FinalePhase {
  sector: Sector;
  questions: Question[];
  filed: string[];
}

/**
 * The phases of the final duel, in sector order: three questions each, one step above the
 * player's level, the second one from a filed folder when there is one. New questions per attempt.
 */
export function finalePhases(pool: Pool, attempt: number, skill: SkillMap, archive: { questionId: string }[]): FinalePhase[] {
  const rng = seededRng(`finale:${attempt}`);
  const filed = new Set(archive.map((e) => e.questionId));
  return SECTORS.map((sector) => {
    const cands = pool.list.filter((q) => sectorOfArea(q.area) === sector);
    const own = nearLevel(cands.filter((q) => filed.has(q.id)), 1, skill, rng, 1);
    const rest = nearLevel(cands.filter((q) => !own.includes(q)), FINALE_PHASE_QUESTIONS - own.length, skill, rng, 1);
    return { sector, questions: [...rest.slice(0, 1), ...own, ...rest.slice(1)], filed: own.map((q) => q.id) };
  });
}

/** A phase is won with `FINALE_PHASE_PASS` right answers and lost once that can no longer happen or its clock ran out. */
export function finalePhaseState(log: boolean[], timeUp = false): 'on' | 'won' | 'lost' {
  const right = log.filter((x) => x).length;
  if (right >= FINALE_PHASE_PASS) return 'won';
  return timeUp || log.length - right > FINALE_PHASE_QUESTIONS - FINALE_PHASE_PASS ? 'lost' : 'on';
}

/**
 * Seconds a question adds to the clock of a boss fight (D71): a quick choice gives little, a
 * question with much to read or arrange more. The fight has one clock for all its questions.
 */
const CLOCK_SECONDS: Record<QuestionType, number> = {
  truefalse: 12,
  choice: 18,
  estimate: 20,
  cloze: 20,
  multi: 24,
  locate: 25,
  order: 28,
  match: 28,
  spot: 28,
  riddle: 30,
  source: 30,
  sort: 32,
};

/**
 * The clock of a boss fight in seconds, from the questions drawn for it, rounded up to ten.
 * `relaxed` (a screen reader is on) doubles it: reading aloud takes longer than reading.
 */
export function fightClock(questions: Pick<Question, 'type'>[], relaxed = false): number {
  const s = questions.reduce((sum, q) => sum + CLOCK_SECONDS[q.type], 0);
  return Math.ceil(s / 10) * 10 * (relaxed ? 2 : 1);
}

/** A fight against a firewall while it runs. */
export interface WallFight {
  /** Layers still standing (0 = broken). */
  hp: number;
  /** Questions in the attack window. */
  rounds: number;
  /** Every answer so far, right or wrong. */
  log: boolean[];
  /** The clock ran out before the wall fell. */
  timeUp?: boolean;
}

/**
 * What an answer did to the wall: `crack` tore a layer down, `breach` the last one, `repair` let
 * morph.ai rebuild one, `hold` was wrong while the wall was whole (nothing to rebuild).
 */
export type WallHit = 'crack' | 'breach' | 'repair' | 'hold';

export function startWallFight(rounds: number): WallFight {
  return { hp: FIREWALL_HP, rounds, log: [] };
}

/** `won` once the wall is down, `lost` once the clock ran out or fewer questions are left than layers stand. */
export function wallFightState(f: WallFight): 'on' | 'won' | 'lost' {
  if (f.hp <= 0) return 'won';
  return f.timeUp || f.rounds - f.log.length < f.hp ? 'lost' : 'on';
}

/** The clock ran out: the wall holds with the layers it has. A finished fight stays as it is. */
export function timeOutWall(f: WallFight): WallFight {
  return wallFightState(f) === 'on' ? { ...f, timeUp: true } : f;
}

/** One answer against the wall. A finished fight stays as it is. */
export function strikeWall(f: WallFight, ok: boolean): { fight: WallFight; hit: WallHit } {
  if (wallFightState(f) !== 'on') return { fight: f, hit: 'hold' };
  const log = [...f.log, ok];
  if (ok) return { fight: { ...f, hp: f.hp - 1, log }, hit: f.hp === 1 ? 'breach' : 'crack' };
  if (f.hp < FIREWALL_HP) return { fight: { ...f, hp: f.hp + 1, log }, hit: 'repair' };
  return { fight: { ...f, log }, hit: 'hold' };
}

export interface BossOutcome {
  player: PlayerState;
  passed: boolean;
  /** Nodes morph.ai damaged after a lost fight at a firewall (D72). */
  damaged?: string[];
  /** Node ids that appeared in the new zone. */
  spawned: string[];
  /** Areas that were opened. */
  areas: string[];
}

/**
 * How a wall cell looks: `active` stands in front of the network and can be attacked, `locked`
 * still waits for it (not reached, or too few answered nodes), `calm` no longer guards anything
 * (both sides are open), `gap` has fallen.
 */
export type WallLook = 'active' | 'locked' | 'calm' | 'gap';

export interface WallSight {
  /** The wall cells within `WALL_SIGHT` cells of a node; `away` is that distance. */
  cells: { key: string; x: number; y: number; look: WallLook; away: number; firewall?: string }[];
  /**
   * One sign per standing firewall in sight, where the network comes closest to it; `node` is the
   * node closest to it (once reached, a trace runs from there to the wall).
   */
  signs: { firewall: string; area: string; x: number; y: number; reached: boolean; node: string }[];
}

/**
 * What the map shows of the walls: only the parts the network has come close to (fog of war).
 * `gaps` are further gaps, those of synapses (`Synapse.gap`).
 */
export function wallsInSight(nodes: (Placed & { id: string })[], firewalls: Firewall[], gaps: { area: string; breach: Breach }[] = []): WallSight {
  const hexes = nodes.map((n) => worldToHex(n.pos.x, n.pos.y));
  const fallen = [...firewalls.flatMap((f) => (f.breach ? [{ area: f.area, breach: f.breach }] : [])), ...gaps];
  const gapKeys = new Set(fallen.flatMap((g) => breachCells(g.area, g.breach).map((c) => c.key)));
  const standing = new Map(firewalls.filter((f) => !f.broken).map((f) => [f.area, f]));
  const reached = new Map([...standing.values()].map((f) => [f.id, firewallReady(nodes, firewalls, f)]));
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
    const look: WallLook = gapKeys.has(c.key) ? 'gap' : fw ? (reached.get(fw.id) ? 'active' : 'locked') : 'calm';
    cells.push({ key: c.key, x: c.x, y: c.y, look, away, firewall: fw?.id });
    if (fw && look !== 'gap') seen.add(fw.id);
  }
  const signs: WallSight['signs'] = [];
  for (const f of standing.values()) {
    if (!seen.has(f.id)) continue;
    const a = approachOf(nodes, f.area);
    if (a) signs.push({ firewall: f.id, area: f.area, x: a.cell.x, y: a.cell.y, reached: !!reached.get(f.id), node: a.node.id });
  }
  return { cells, signs };
}
