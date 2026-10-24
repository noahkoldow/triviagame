import type { Scores } from '@nexus/shared';
import { API_BASE } from '../config';
import type { Fetch } from './ai';

/**
 * The ranking on our backend (endpoint `league`). Every save registers by itself with a random
 * id, a token and a generated alias, then reports its scores and reads one board at a time.
 */

export interface BoardEntry {
  alias: string;
  score: number;
  /** Equal scores share a place. */
  rank: number;
  me: boolean;
}

export interface Standings {
  /** `OVERALL` or an area id. */
  board: string;
  /** Everybody on the ranking. */
  players: number;
  me: { alias: string; rank: number; score: number };
  /** The best places, best first. */
  top: BoardEntry[];
}

export interface Credentials {
  playerId: string;
  token: string;
}

export class LeagueError extends Error {
  constructor(readonly status: number) {
    super(`league answered ${status}`);
  }
}

export interface LeagueApi {
  live: boolean;
  join(alias: string): Promise<Credentials>;
  sync(c: Credentials, scores: Scores, board: string): Promise<Standings>;
  leave(c: Credentials): Promise<void>;
}

export function httpLeagueApi(base: string, doFetch: Fetch = fetch as unknown as Fetch): LeagueApi {
  const call = async (body: Record<string, unknown>): Promise<Record<string, unknown>> => {
    const res = await doFetch(`${base}/league`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new LeagueError(res.status);
    return (await res.json()) as Record<string, unknown>;
  };
  return {
    live: true,
    async join(alias) {
      const r = await call({ action: 'join', alias });
      if (typeof r.playerId !== 'string' || typeof r.token !== 'string') throw new LeagueError(502);
      return { playerId: r.playerId, token: r.token };
    },
    async sync(c, scores, board) {
      const r = await call({ action: 'sync', ...c, scores, board });
      if (!Array.isArray(r.top) || typeof r.me !== 'object' || typeof r.players !== 'number') throw new LeagueError(502);
      return r as unknown as Standings;
    },
    async leave(c) {
      await call({ action: 'leave', ...c });
    },
  };
}

const offline: LeagueApi = {
  live: false,
  join: () => Promise.reject(new LeagueError(0)),
  sync: () => Promise.reject(new LeagueError(0)),
  leave: async () => undefined,
};

export const leagueApi: LeagueApi = API_BASE ? httpLeagueApi(API_BASE) : offline;
