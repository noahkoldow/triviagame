import { hashString, hexDistance, hexToWorld, seededRng, type Hex } from '@nexus/shared';

/**
 * Logic of the intro scene: a small hexagon network that MORPH corrupts and
 * finally destroys, until only a spark at the core is left. Pure, so it can be tested.
 */
export interface SceneCell {
  i: number;
  q: number;
  r: number;
  x: number;
  y: number;
  /** Rings from the core (0 = the core). */
  ring: number;
  /** The attack progress at which this cell starts to break (0..1). */
  thr: number;
}

/** Where MORPH appears (world units, above the network). */
export const SOURCE = { x: 0, y: -215 };

export function buildCells(radius = 3): SceneCell[] {
  const out: SceneCell[] = [];
  const core: Hex = { q: 0, r: 0 };
  for (let q = -radius; q <= radius; q++) {
    for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
      const w = hexToWorld({ q, r });
      out.push({ i: out.length, q, r, x: w.x, y: w.y, ring: hexDistance({ q, r }, core), thr: 0 });
    }
  }
  const dist = out.map((c) => Math.hypot(c.x - SOURCE.x, c.y - SOURCE.y));
  const lo = Math.min(...dist);
  const hi = Math.max(...dist);
  // the noise spreads from MORPH outward; a little chance keeps the front ragged
  out.forEach((c, k) => {
    const rnd = (hashString(`cell:${c.q},${c.r}`) % 1000) / 1000;
    c.thr = 0.03 + 0.68 * ((dist[k]! - lo) / (hi - lo)) + 0.2 * rnd;
  });
  return out;
}

/** Pairs of neighbouring cells (the links of the network). */
export function buildLinks(cells: SceneCell[]): [number, number][] {
  const out: [number, number][] = [];
  for (const a of cells) {
    for (const b of cells) {
      if (b.i > a.i && hexDistance({ q: a.q, r: a.r }, { q: b.q, r: b.r }) === 1) out.push([a.i, b.i]);
    }
  }
  return out;
}

export type CellState = 'healthy' | 'noisy' | 'dead' | 'relit';

/** `attack` and `repair` run from 0 to 1. A relit spark returns only around the core. */
export function cellState(cell: SceneCell, attack: number, repair: number): CellState {
  if (attack >= cell.thr + 0.12) {
    const rings = repair > 0 ? Math.min(1, Math.floor(repair * 2)) : -1;
    return cell.ring <= rings ? 'relit' : 'dead';
  }
  if (attack >= cell.thr - 0.06) return 'noisy';
  return 'healthy';
}

/** How much static there is: it swells while the network breaks and fades afterwards. */
export function noiseActivity(attack: number, repair: number): number {
  if (attack <= 0) return 0;
  const swell = Math.sin(Math.min(1, attack) * Math.PI);
  return Math.max(0, swell * (1 - repair * 0.8)) + (attack >= 1 ? 0.12 * (1 - repair) : 0);
}

/** Static specks for one tick, deterministic. */
export function speckles(
  tick: number,
  activity: number,
  box: { x0: number; y0: number; x1: number; y1: number },
  max = 70,
): { x: number; y: number; w: number; h: number; c: number }[] {
  const rng = seededRng(`speck:${tick}`);
  const n = Math.round(max * Math.min(1, activity));
  return Array.from({ length: n }, () => ({
    x: box.x0 + rng() * (box.x1 - box.x0),
    y: box.y0 + rng() * (box.y1 - box.y0),
    w: 2 + rng() * 9,
    h: 1 + rng() * 3,
    c: Math.floor(rng() * 4),
  }));
}
