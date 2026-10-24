import type { PlayerState } from './game';
import { hashString, seededRng } from './rng';

/**
 * The weekly league: every week players are grouped (up to 20) by their league tier and
 * compete with the XP of that week. The best five move up a tier, the last five down.
 * Players appear only under a generated alias, never with a name they typed themselves.
 */

export const LEAGUE_GROUP = 20;
export const LEAGUE_PROMOTE = 5;
export const LEAGUE_DEMOTE = 5;
/** Tiers from bottom to top; the circuit theme runs from copper to the nexus itself. */
export const LEAGUES = ['Kupferliga', 'Siliziumliga', 'Glasfaserliga', 'Quantenliga', 'Nexusliga'];
/** More XP than this in one week is not plausible and is capped. */
export const MAX_WEEK_XP = 20_000;

const DAY = 86_400_000;

/** ISO week of a moment, in UTC: "2026-W43". Weeks start on Monday. */
export function weekOf(ms: number): string {
  const d = new Date(ms);
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  const thursday = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day + 3);
  const year = new Date(thursday).getUTCFullYear();
  const week = 1 + Math.floor((thursday - Date.UTC(year, 0, 1)) / (7 * DAY));
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/** When the week of `ms` ends (next Monday 00:00 UTC). */
export function weekEndsAt(ms: number): number {
  const d = new Date(ms);
  const day = (d.getUTCDay() + 6) % 7;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day + 7);
}

/** The tier for next week from this week's rank (1 = best) in a group of `size`. */
export function tierAfter(tier: number, rank: number, size: number, xp: number): number {
  if (rank <= LEAGUE_PROMOTE && xp > 0) return Math.min(LEAGUES.length - 1, tier + 1);
  // small groups only demote once they are big enough that the zones do not overlap
  const demote = size >= LEAGUE_PROMOTE + LEAGUE_DEMOTE && rank > size - LEAGUE_DEMOTE;
  if (demote || xp === 0) return Math.max(0, tier - 1);
  return tier;
}

/** The weekly XP the server accepts: never less than before, never more than plausible. */
export function acceptXp(previous: number, reported: number): number {
  if (!Number.isFinite(reported)) return previous;
  return Math.max(previous, Math.min(MAX_WEEK_XP, Math.floor(reported)));
}

export interface Ranked {
  alias: string;
  xp: number;
}

/** Best first; equal XP by alias, so the order is stable. */
export function rankMembers<T extends Ranked>(members: T[]): T[] {
  return [...members].sort((a, b) => b.xp - a.xp || a.alias.localeCompare(b.alias));
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
  /** The week the start XP belongs to ("" until the first week starts). */
  week: string;
  /** XP at the start of that week; weekly XP = xp − startXp. */
  startXp: number;
  /** Set once the player joined the league (optional, see the league screen). */
  playerId?: string;
  token?: string;
  alias?: string;
}

export function initialLeague(): LeagueState {
  return { week: '', startXp: 0 };
}

/**
 * The league opens after morph.ai is beaten: first the player learns to think again, then they
 * compete. Players who joined earlier keep their place.
 */
export function leagueUnlocked(p: PlayerState): boolean {
  return p.story.finale || !!p.league.playerId;
}

/** Starts a new league week when the calendar moved on (returns the same state otherwise). */
export function rollWeek(p: PlayerState, now: number): PlayerState {
  const week = weekOf(now);
  if (p.league.week === week) return p;
  return { ...p, league: { ...p.league, week, startXp: p.xp } };
}

export function weekXp(p: PlayerState): number {
  return Math.max(0, p.xp - p.league.startXp);
}

/** A stable seed for alias suggestions of this device's save. */
export function aliasSeed(p: PlayerState): string {
  return String(hashString(`${p.profile.name}|${p.profile.birthYear}|${p.stats.solved}`));
}
