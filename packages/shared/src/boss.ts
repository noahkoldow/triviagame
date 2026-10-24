import type { PlayerState } from './game';
import type { Pool } from './network';
import { seededRng } from './rng';
import { BASE_SKILL, targetDifficulty, type SkillMap } from './skill';
import { SECTORS, SECTOR_ANGLE, sectorOfArea } from './taxonomy';
import type { Question, Sector } from './types';

/**
 * Firewalls (bosses) stand on the borders between two sectors. To break one the
 * player answers a short series of questions that needs knowledge from both sectors.
 * Breaking it opens a new zone: one disturbed outpost of each sector is connected.
 */
export interface Firewall {
  id: string;
  a: Sector;
  b: Sector;
  x: number;
  y: number;
  broken: boolean;
  /** Failed fights so far; a new fight draws a new set of questions. */
  attempts: number;
}

/** Questions in a fight (half from each sector) and how many must be right. */
export const BOSS_QUESTIONS = 4;
export const BOSS_PASS = 3;
/** Distance of a firewall from the core (world units). */
export const BOSS_RADIUS = 640;
/** What breaking a firewall pays. */
export const BOSS_REWARD = { xp: 60, bits: 40, gems: 3 };

/** One firewall on each border of neighbouring sectors. */
export function createFirewalls(): Firewall[] {
  return SECTORS.map((a, i) => {
    const b = SECTORS[(i + 1) % SECTORS.length]!;
    const a0 = SECTOR_ANGLE[a];
    let a1 = SECTOR_ANGLE[b];
    if (a1 < a0) a1 += Math.PI * 2;
    const mid = (a0 + a1) / 2;
    return {
      id: `fw-${a}-${b}`,
      a,
      b,
      x: Math.cos(mid) * BOSS_RADIUS,
      y: Math.sin(mid) * BOSS_RADIUS,
      broken: false,
      attempts: 0,
    };
  });
}

/** The final duel against MORPH in the core: two questions from every sector, six must be right. */
export const FINALE_ID = 'core';
export const FINALE_QUESTIONS = 8;
export const FINALE_PASS = 6;
export const FINALE_REWARD = { xp: 200, bits: 150, gems: 10 };

/** Questions of a sector near the player's level (plus `bias`), with some randomness. */
function nearLevel(pool: Pool, sector: Sector, count: number, skill: SkillMap, rng: () => number, bias = 0): Question[] {
  const cands = pool.list.filter((q) => sectorOfArea(q.area) === sector);
  const scored = cands.map((q) => ({
    q,
    d: Math.abs(q.difficulty - targetDifficulty(skill[q.area] ?? BASE_SKILL) - bias) + rng() * 1.5,
  }));
  return scored.sort((x, y) => x.d - y.d).slice(0, count).map((x) => x.q);
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
 * The questions of one fight, alternating between the two sectors: two questions of each
 * (of any type), near the player's level. Deterministic for a firewall and attempt.
 */
export function bossQuestions(pool: Pool, fw: Firewall, skill: SkillMap): Question[] {
  const rng = seededRng(`boss:${fw.id}:${fw.attempts}`);
  const half = BOSS_QUESTIONS / 2;
  const qa = nearLevel(pool, fw.a, half, skill, rng);
  const qb = nearLevel(pool, fw.b, half, skill, rng);
  return interleave([qa, qb]);
}

/** The final duel: two questions per sector, one step above the player's level, in sector turns. */
export function finaleQuestions(pool: Pool, attempt: number, skill: SkillMap): Question[] {
  const rng = seededRng(`finale:${attempt}`);
  const per = FINALE_QUESTIONS / SECTORS.length;
  return interleave(SECTORS.map((s) => nearLevel(pool, s, per, skill, rng, 1)));
}

export interface BossOutcome {
  player: PlayerState;
  passed: boolean;
  /** Node ids that appeared in the new zone. */
  spawned: string[];
  /** Areas that were opened. */
  areas: string[];
}
