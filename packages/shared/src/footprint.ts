import type { PlayerState } from './game';
import type { Pool } from './network';
import { AREAS } from './taxonomy';
import type { Sector } from './types';

/** How far the player has come in one topic area (the data of the knowledge footprint). */
export interface AreaFootprint {
  area: string;
  sector: Sector;
  /** Nodes of this area that are solved (or damaged, but solved once). */
  solved: number;
  /** Questions that exist for this area. */
  available: number;
  /** Hardest solved question, 0..1 (difficulty / 5). */
  depth: number;
  /** Share of this area's questions that are solved, 0..1. */
  coverage: number;
}

/** One entry per topic area, in the order of the taxonomy (grouped by sector). */
export function footprint(p: PlayerState, pool: Pool): AreaFootprint[] {
  return AREAS.map((a) => {
    const available = pool.list.filter((q) => q.area === a.id).length;
    const solvedQs = Object.values(p.network.nodes)
      .filter((n) => n.state !== 'open')
      .map((n) => pool.get(n.questionId))
      .filter((q) => q.area === a.id);
    const hardest = solvedQs.reduce((m, q) => Math.max(m, q.difficulty), 0);
    return {
      area: a.id,
      sector: a.sector,
      solved: solvedQs.length,
      available,
      depth: hardest / 5,
      coverage: available === 0 ? 0 : Math.min(1, solvedQs.length / available),
    };
  });
}
