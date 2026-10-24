import { seededRng } from './rng';
import { AREAS, SECTOR_ANGLE, sectorOfArea } from './taxonomy';
import type { Sector } from './types';

/**
 * Outposts are topic areas that already exist on the map as scattered, disturbed
 * dots. The player has to connect them: grow the network toward one and its area
 * opens up. The questions on the way drift toward its topic.
 */
export interface Outpost {
  id: string;
  area: string;
  x: number;
  y: number;
  connected: boolean;
}

/** A node placed this close to an outpost connects it. */
export const OUTPOST_REACH = 150;

/** Areas that lead into each other: steering follows these links. */
const LINKS: [string, string][] = [
  ['physics', 'biomedicine'],
  ['physics', 'technology'],
  ['physics', 'astronomy'],
  ['biomedicine', 'climate'],
  ['biomedicine', 'philosophy'],
  ['technology', 'economy'],
  ['astronomy', 'climate'],
  ['climate', 'geography'],
  ['geography', 'history'],
  ['geography', 'politics'],
  ['history', 'arts'],
  ['history', 'philosophy'],
  ['history', 'politics'],
  ['arts', 'philosophy'],
  ['philosophy', 'law'],
  ['politics', 'law'],
  ['politics', 'economy'],
  ['economy', 'law'],
];

const NEIGHBOURS = new Map<string, string[]>();
for (const [a, b] of LINKS) {
  NEIGHBOURS.set(a, [...(NEIGHBOURS.get(a) ?? []), b]);
  NEIGHBOURS.set(b, [...(NEIGHBOURS.get(b) ?? []), a]);
}

/** Steps between two areas along the links (0 = same area). */
export function areaDistance(a: string, b: string): number {
  if (a === b) return 0;
  const seen = new Set([a]);
  let frontier = [a];
  for (let d = 1; d <= AREAS.length; d++) {
    const next: string[] = [];
    for (const x of frontier) {
      for (const y of NEIGHBOURS.get(x) ?? []) {
        if (y === b) return d;
        if (!seen.has(y)) {
          seen.add(y);
          next.push(y);
        }
      }
    }
    if (next.length === 0) break;
    frontier = next;
  }
  return AREAS.length;
}

/** One outpost per area that is not open yet, scattered inside the wedge of its sector. */
export function createOutposts(unlocked: string[], seed = 'nexus-outposts'): Outpost[] {
  const rng = seededRng(seed);
  const out: Outpost[] = [];
  for (const area of AREAS) {
    if (unlocked.includes(area.id)) continue;
    let best: { x: number; y: number } | null = null;
    for (let i = 0; i < 30; i++) {
      const th = SECTOR_ANGLE[area.sector] + (rng() - 0.5) * 1.5;
      const r = 760 + rng() * 700;
      const p = { x: Math.cos(th) * r, y: Math.sin(th) * r };
      best = p;
      if (out.every((o) => Math.hypot(o.x - p.x, o.y - p.y) > 260)) break;
    }
    out.push({ id: `o-${area.id}`, area: area.id, x: best!.x, y: best!.y, connected: false });
  }
  return out;
}

/** The outpost a branch of the given sector should grow toward: the nearest one still disturbed. */
export function steerTarget(
  outposts: Outpost[] | undefined,
  from: { x: number; y: number },
  sector: Sector,
): Outpost | undefined {
  let best: Outpost | undefined;
  let bd = Infinity;
  for (const o of outposts ?? []) {
    if (o.connected || sectorOfArea(o.area) !== sector) continue;
    const d = Math.hypot(o.x - from.x, o.y - from.y);
    if (d < bd) {
      bd = d;
      best = o;
    }
  }
  return best;
}
