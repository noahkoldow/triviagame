import { seededRng } from './rng';
import { SECTOR_ANGLE } from './taxonomy';
import type { Sector, Vec3 } from './types';

export const ROOT_RADIUS = 150;
const MIN_GAP = 64;
const WEDGE = 0.8; // half-width (rad) a node may stray from its main sector's axis

function angDiff(a: number, b: number): number {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

export function polar(p: { x: number; y: number }): { r: number; th: number } {
  return { r: Math.hypot(p.x, p.y), th: Math.atan2(p.y, p.x) };
}

function depthOf(r: number, jitter: number): number {
  return Math.min(1, Math.max(0, r / 700 + jitter));
}

export function rootPosition(sector: Sector): Vec3 {
  const th = SECTOR_ANGLE[sector];
  return { x: Math.cos(th) * ROOT_RADIUS, y: Math.sin(th) * ROOT_RADIUS, z: 0.1 };
}

export interface PlaceOptions {
  parent: Vec3;
  kind: 'deepen' | 'bridge' | 'debris';
  mainSector: Sector;
  /** Secondary sector weights; they only bend the node's direction a little. */
  side?: Partial<Record<Sector, number>>;
  existing: Vec3[];
  seed: string;
  /** Lean the direction toward this point (an outpost); `pull` 0..1 is how strongly. */
  target?: { x: number; y: number; pull: number };
}

/**
 * Organic placement: direction follows the parent outward, spacing varies per
 * kind (deepen close, bridge farther) plus noise, the main sector keeps the
 * node inside its wedge, side weights bend it slightly toward the neighbour.
 */
export function placeNode(o: PlaceOptions): Vec3 {
  const rng = seededRng(o.seed);
  const { th: parentTh } = polar(o.parent);
  const sign = rng() < 0.5 ? -1 : 1;
  let angle: number;
  let dist: number;
  if (o.kind === 'deepen') {
    angle = parentTh + (rng() - 0.5) * 0.7;
    dist = 70 + rng() * 45;
  } else if (o.kind === 'bridge') {
    angle = parentTh + sign * (0.5 + rng() * 0.6);
    dist = 120 + rng() * 70;
  } else {
    angle = parentTh + sign * (0.9 + rng() * 0.5);
    dist = 80 + rng() * 30;
  }
  if (o.target) {
    const ta = Math.atan2(o.target.y - o.parent.y, o.target.x - o.parent.x);
    angle += angDiff(ta, angle) * o.target.pull;
  }
  const cand = {
    x: o.parent.x + Math.cos(angle) * dist,
    y: o.parent.y + Math.sin(angle) * dist,
  };
  let { r, th } = polar(cand);

  // keep the node within its main sector's wedge
  const axis = SECTOR_ANGLE[o.mainSector];
  th = axis + Math.max(-WEDGE, Math.min(WEDGE, angDiff(th, axis)));
  // bend toward side sectors (small deviation, never a jump to the middle)
  for (const [s, w] of Object.entries(o.side ?? {}) as [Sector, number][]) {
    if (!w) continue;
    th += angDiff(SECTOR_ANGLE[s], th) * w * 0.5;
  }
  r = Math.max(r, ROOT_RADIUS + 20);

  let p = { x: Math.cos(th) * r, y: Math.sin(th) * r };
  for (let iter = 0; iter < 12; iter++) {
    let moved = false;
    for (const e of o.existing) {
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const d = Math.hypot(dx, dy) || 0.001;
      if (d < MIN_GAP) {
        const push = (MIN_GAP - d) / d;
        p = { x: p.x + dx * push, y: p.y + dy * push };
        moved = true;
      }
    }
    if (!moved) break;
  }
  const pr = polar(p).r;
  return { x: p.x, y: p.y, z: depthOf(pr, (rng() - 0.5) * 0.16) };
}
