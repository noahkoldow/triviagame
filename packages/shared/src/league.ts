import { footprint } from './footprint';
import type { PlayerState } from './game';
import type { Pool } from './network';
import { hashString, seededRng } from './rng';
import { AREAS } from './taxonomy';

/**
 * The ranking: every player is on it, under a generated alias and never with a name they typed.
 * One board for everybody by XP and one per topic area by the nodes solved there (as in the
 * knowledge footprint). The code keeps the name "league" from the weekly league it replaced (D57).
 */

/** How many places a board lists; the player's own place is reported besides. */
export const RANKING_TOP = 50;
/** The board over everything; every other board is named by its area id. */
export const OVERALL = 'all';

/**
 * More than this per hour is not plausible (a fast player makes about a thousand XP). The app
 * always reports totals, so whatever a sync cuts off arrives with a later one.
 */
export const MAX_XP_PER_HOUR = 6000;
export const MAX_SOLVED_PER_HOUR = 120;
/** What the first sync may bring along (a save from before the ranking). */
export const FIRST_XP = 100_000;
export const FIRST_SOLVED = 1000;

const HOUR = 3_600_000;

export interface Scores {
  xp: number;
  /** Solved nodes per area; every area is present (0 where nothing is solved). */
  areas: Record<string, number>;
}

export function isBoard(s: unknown): s is string {
  return s === OVERALL || AREAS.some((a) => a.id === s);
}

export function zeroScores(): Scores {
  return { xp: 0, areas: Object.fromEntries(AREAS.map((a) => [a.id, 0])) };
}

/** What the player stands on: XP overall, solved nodes per area. */
export function scoresOf(p: PlayerState, pool: Pool): Scores {
  return { xp: p.xp, areas: Object.fromEntries(footprint(p, pool).map((a) => [a.area, a.solved])) };
}

/** A player's score on one board. */
export function scoreOn(s: Scores, board: string): number {
  return board === OVERALL ? s.xp : (s.areas[board] ?? 0);
}

function accept(prev: number, reported: unknown, room: number): number {
  if (typeof reported !== 'number' || !Number.isFinite(reported)) return prev;
  return Math.max(prev, Math.floor(Math.min(reported, prev + room)));
}

/**
 * The scores the server takes from a sync: never lower than before and never faster than a
 * person can play since the last sync (`prev` undefined: the first sync). Unknown areas are dropped.
 */
export function acceptScores(prev: Scores | undefined, reported: unknown, elapsedMs: number): Scores {
  const base = prev ?? zeroScores();
  const r = (reported ?? {}) as { xp?: unknown; areas?: unknown };
  const areas = (r.areas && typeof r.areas === 'object' ? r.areas : {}) as Record<string, unknown>;
  const hours = Math.max(0, elapsedMs) / HOUR;
  const xpRoom = prev ? MAX_XP_PER_HOUR * hours : FIRST_XP;
  const solvedRoom = prev ? MAX_SOLVED_PER_HOUR * hours : FIRST_SOLVED;
  return {
    xp: accept(base.xp, r.xp, xpRoom),
    areas: Object.fromEntries(AREAS.map((a) => [a.id, accept(base.areas[a.id] ?? 0, areas[a.id], solvedRoom)])),
  };
}

/** Places on a board sorted best first: equal scores share a place (1, 2, 2, 4). */
export function rankEntries<T extends { score: number }>(sorted: T[]): (T & { rank: number })[] {
  const out: (T & { rank: number })[] = [];
  sorted.forEach((e, i) => {
    const before = out[i - 1];
    out.push({ ...e, rank: before && before.score === e.score ? before.rank : i + 1 });
  });
  return out;
}

// --- aliases -----------------------------------------------------------

const ADJECTIVES = [
  'Flinke', 'Kluge', 'Neugierige', 'Mutige', 'Stille', 'Helle', 'Wache', 'Findige',
  'Geduldige', 'Schnelle', 'Leuchtende', 'Kühne', 'Fröhliche', 'Listige', 'Sanfte', 'Wilde',
];
const NOUNS = [
  'Eule', 'Diode', 'Platine', 'Spule', 'Welle', 'Linse', 'Feder', 'Schleife',
  'Rakete', 'Wurzel', 'Note', 'Kerze', 'Antenne', 'Batterie', 'Kugel', 'Flamme',
];

/** A few generated aliases to choose from (deterministic for a seed). */
export function aliasOptions(seed: string, n = 3): string[] {
  const rng = seededRng(`alias:${seed}`);
  const out = new Set<string>();
  while (out.size < n) {
    const a = ADJECTIVES[Math.floor(rng() * ADJECTIVES.length)]!;
    const b = NOUNS[Math.floor(rng() * NOUNS.length)]!;
    out.add(`${a} ${b} ${String(10 + Math.floor(rng() * 90))}`);
  }
  return [...out];
}

/** Only generated aliases are allowed, so nobody can put free text on the board. */
export function isAlias(s: unknown): s is string {
  if (typeof s !== 'string') return false;
  const m = s.match(/^(\S+) (\S+) (\d{2})$/);
  return !!m && ADJECTIVES.includes(m[1]!) && NOUNS.includes(m[2]!);
}

// --- the player's side -------------------------------------------------

export interface LeagueState {
  /** Set once the server registered this save; the app does that by itself (D57). */
  playerId?: string;
  token?: string;
  alias?: string;
}

export function initialLeague(): LeagueState {
  return {};
}

/**
 * The ranking shows once morph.ai is beaten: first the player learns to think again, then they
 * compare (D51). They are on it from the start, so it holds everybody who plays.
 */
export function leagueUnlocked(p: PlayerState): boolean {
  return p.story.finale;
}

/** A stable seed for the alias of this device's save. */
export function aliasSeed(p: PlayerState): string {
  return String(hashString(`${p.profile.name}|${p.profile.birthYear}|${p.stats.solved}`));
}

/** The alias this save appears under on the ranking. */
export function aliasFor(p: PlayerState): string {
  return aliasOptions(aliasSeed(p), 1)[0]!;
}
