import { API_BASE } from '../config';
import type { Fetch } from './ai';

/**
 * The weekly league on our backend. Joining is voluntary and creates nothing but a random id, a
 * token and the chosen generated alias on the server; the app then reports its weekly XP.
 */

export interface Standings {
  week: string;
  tier: number;
  league: string;
  /** When the week ends (ms). */
  endsAt: number;
  promote: number;
  demote: number;
  /** Best first. */
  members: { alias: string; xp: number; me: boolean }[];
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
  sync(c: Credentials, weekXp: number): Promise<Standings>;
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
    async sync(c, weekXp) {
      const r = await call({ action: 'sync', ...c, weekXp });
      if (!Array.isArray(r.members) || typeof r.league !== 'string') throw new LeagueError(502);
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
