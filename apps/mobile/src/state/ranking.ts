import { OVERALL, aliasFor, scoresOf } from '@nexus/shared';
import { pool } from '../services/content';
import { LeagueError, leagueApi, type Credentials, type Standings } from '../services/league';
import { getState, update } from './store';

/**
 * Everybody is on the ranking (D57): the first sync registers this save under its generated
 * alias, every sync reports the current scores and reads one board.
 */

/** Background syncs from the map, at most this often. */
const QUIET_EVERY = 5 * 60_000;
let lastQuiet = 0;
let joining: Promise<Credentials> | null = null;

function credentials(): Promise<Credentials> {
  const { playerId, token } = getState().league;
  if (playerId && token) return Promise.resolve({ playerId, token });
  // one registration at a time, or two syncs at once would leave an orphan entry
  joining ??= (async () => {
    const alias = aliasFor(getState());
    const c = await leagueApi.join(alias);
    update((p) => ({ ...p, league: { ...c, alias } }));
    return c;
  })().finally(() => {
    joining = null;
  });
  return joining;
}

/** Reports the scores and reads a board; registers again if the server no longer knows this save. */
export async function syncRanking(board: string = OVERALL, retry = true): Promise<Standings> {
  const c = await credentials();
  try {
    return await leagueApi.sync(c, scoresOf(getState(), pool), board);
  } catch (e) {
    if (!retry || !(e instanceof LeagueError) || e.status !== 401) throw e;
    update((p) => ({ ...p, league: {} }));
    return syncRanking(board, false);
  }
}

/** From the map: now and then, and failures simply wait for the next time. */
export function syncRankingQuietly(): void {
  // not before the onboarding is through (the map can mount for a moment before the redirect)
  if (!leagueApi.live || !getState().profile.onboarded || Date.now() - lastQuiet < QUIET_EVERY) return;
  lastQuiet = Date.now();
  syncRanking().catch(() => undefined);
}
