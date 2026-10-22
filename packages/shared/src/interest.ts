import { betaSample, type Rng } from './rng';

export interface Beta {
  a: number;
  b: number;
}
export type InterestMap = Record<string, Beta>;

const PRIOR: Beta = { a: 1, b: 1 };

export function betaOf(map: InterestMap, area: string): Beta {
  return map[area] ?? PRIOR;
}

/** The player picked a node of this area (strong signal of interest). */
export function recordChoice(map: InterestMap, area: string): InterestMap {
  const cur = betaOf(map, area);
  return { ...map, [area]: { a: cur.a + 1, b: cur.b } };
}

/** Result of a question: right answers mildly raise, wrong ones mildly lower interest. */
export function recordResult(map: InterestMap, area: string, correct: boolean): InterestMap {
  const cur = betaOf(map, area);
  return {
    ...map,
    [area]: correct ? { a: cur.a + 0.4, b: cur.b } : { a: cur.a, b: cur.b + 0.3 },
  };
}

/** Passed-over alternatives: tiny negative signal. */
export function recordSkip(map: InterestMap, area: string): InterestMap {
  const cur = betaOf(map, area);
  return { ...map, [area]: { a: cur.a, b: cur.b + 0.2 } };
}

/** Thompson sample of the player's interest in an area. */
export function sampleInterest(map: InterestMap, area: string, rng: Rng): number {
  const { a, b } = betaOf(map, area);
  return betaSample(a, b, rng);
}

export const WIDE_VIEW_SHARE = 0.2;

/**
 * Picks one of the candidate areas. Mostly by Thompson sampling, with a fixed
 * share (“Weitblick”) deliberately going to the least explored area.
 */
export function pickArea(
  candidates: string[],
  map: InterestMap,
  exposure: Record<string, number>,
  rng: Rng,
  wideView = WIDE_VIEW_SHARE,
): string {
  if (candidates.length === 0) throw new Error('No candidate areas');
  if (rng() < wideView) {
    let best = candidates[0]!;
    for (const c of candidates) if ((exposure[c] ?? 0) < (exposure[best] ?? 0)) best = c;
    return best;
  }
  let best = candidates[0]!;
  let bestScore = -1;
  for (const c of candidates) {
    const s = sampleInterest(map, c, rng);
    if (s > bestScore) {
      bestScore = s;
      best = c;
    }
  }
  return best;
}
