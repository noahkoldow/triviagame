import { AREAS } from './taxonomy';

/** Areas that lead into each other: the questions of a branch drift along these links. */
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
