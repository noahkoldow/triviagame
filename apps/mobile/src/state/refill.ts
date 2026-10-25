import { growWaitingNodes } from '@nexus/shared';
import { pool, refillPool } from '../services/content';
import { addRecentlySpawned } from './session';
import { getState, update } from './store';

/**
 * Open end: fetches more questions for every area that runs low, then lets the branches that
 * waited for questions grow. `force` skips the backoff (the map is stuck waiting).
 */
export async function refill(force = false): Promise<number> {
  const p = getState();
  const added = await refillPool(
    { unlockedAreas: p.unlockedAreas, usedQuestions: p.network.usedQuestions, skill: p.skill },
    undefined,
    force,
  );
  if (added === 0) return 0;
  update((s) => {
    const r = growWaitingNodes(s, pool, String(s.network.usedQuestions.length));
    if (!r) return null;
    addRecentlySpawned(r.spawned);
    return r.player;
  });
  return added;
}
