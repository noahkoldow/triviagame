import { seededRng } from '@nexus/shared';

/**
 * Geometry of the reveal after the finale: the player's network turns out to be a small part of
 * their own brain. Everything lives in a 1000×760 box with a brain seen from the side; the
 * player's network sits in the frontal lobe (`REGION`), the rest of the brain is filled with
 * procedural nerve pathways.
 */

export const BRAIN_W = 1000;
export const BRAIN_H = 760;
export const REGION = { x: 400, y: 290, r: 140 };
export const BRAIN_CENTER = { x: 505, y: 400 };

/** Outline of the cerebrum, the cerebellum and the brain stem (SVG path data). */
export const CEREBRUM =
  'M 140 420 C 110 300 170 170 300 120 C 400 80 520 70 620 95 C 740 120 850 190 880 300 C 905 380 880 450 830 490 C 800 515 760 520 720 515 C 690 545 640 560 590 555 C 540 590 470 600 420 580 C 360 600 290 590 240 555 C 180 530 150 480 140 420 Z';
export const CEREBELLUM = 'M 715 512 C 780 515 845 540 852 592 C 858 634 812 664 752 658 C 700 652 668 620 676 578 C 682 548 698 528 715 512 Z';
export const STEM = 'M 598 556 C 620 610 626 680 612 742 L 662 742 C 674 690 672 612 650 562 Z';
/** The furrows of the cortex: central and lateral sulcus, and a few smaller folds. */
export const SULCI = [
  'M 545 100 C 520 190 555 290 515 395',
  'M 240 470 C 340 430 470 432 610 468',
  'M 220 300 C 260 260 300 280 330 240',
  'M 650 150 C 690 200 660 250 720 290',
  'M 760 330 C 800 360 790 410 835 430',
  'M 330 520 C 380 500 420 530 470 510',
  'M 610 400 C 650 380 690 410 730 390',
  'M 300 380 C 330 350 370 370 395 340',
];

export interface Pt {
  x: number;
  y: number;
}

/** A pathway between two points, bent through a control point. */
export interface Curve {
  a: Pt;
  b: Pt;
  c: Pt;
}

export interface NetIn {
  id: string;
  parentId: string | null;
  pos: Pt;
  sector: string;
}

export interface NetOut {
  points: (Pt & { id: string; sector: string })[];
  edges: (Curve & { sector: string })[];
}

/** A control point to the side of the line a→b (nerves bend, circuit traces do not). */
function bend(a: Pt, b: Pt, amount: number): Pt {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return { x: mx - dy * amount, y: my + dx * amount };
}

/** Maps the player's network (with the core at 0,0) into the frontal lobe. */
export function mapNetwork(nodes: NetIn[], seed = 'brain'): NetOut {
  const rmax = Math.max(1, ...nodes.map((n) => Math.hypot(n.pos.x, n.pos.y)));
  const at = (p: Pt): Pt => ({ x: REGION.x + (p.x / rmax) * REGION.r, y: REGION.y + (p.y / rmax) * REGION.r });
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const rng = seededRng(`net:${seed}`);
  const core = at({ x: 0, y: 0 });
  const points = [{ id: 'core', sector: 'core', ...core }, ...nodes.map((n) => ({ id: n.id, sector: n.sector, ...at(n.pos) }))];
  const edges = nodes.map((n) => {
    const parent = n.parentId ? byId.get(n.parentId) : undefined;
    const a = parent ? at(parent.pos) : core;
    const b = at(n.pos);
    return { a, b, c: bend(a, b, (rng() - 0.5) * 0.6), sector: n.sector };
  });
  return { points, edges };
}

/** True inside the oval that stands in for the cerebrum when scattering nerve cells. */
export function inCortex(p: Pt): boolean {
  const ex = (p.x - 510) / 345;
  const ey = (p.y - 345) / 215;
  return ex * ex + ey * ey <= 1;
}

/**
 * Nerve pathways that fill the rest of the brain: scattered cells, each linked to its two
 * nearest neighbours by a bent line. The player's own region is left free so their network
 * stands out. Deterministic for a seed.
 */
export function pathways(seed = 'brain', count = 240): Curve[] {
  const rng = seededRng(`paths:${seed}`);
  const cells: Pt[] = [];
  for (let tries = 0; cells.length < count && tries < count * 20; tries++) {
    const p = { x: 160 + rng() * 700, y: 120 + rng() * 460 };
    if (!inCortex(p) || Math.hypot(p.x - REGION.x, p.y - REGION.y) < REGION.r * 1.05) continue;
    cells.push(p);
  }
  const seen = new Set<string>();
  const out: Curve[] = [];
  cells.forEach((a, i) => {
    const near = cells
      .map((b, j) => ({ j, d: Math.hypot(b.x - a.x, b.y - a.y) }))
      .filter((x) => x.j !== i)
      .sort((x, y) => x.d - y.d)
      .slice(0, 2);
    for (const { j } of near) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const b = cells[j]!;
      out.push({ a, b, c: bend(a, b, (rng() - 0.5) * 0.7) });
    }
  });
  return out;
}

/** Short branches at a nerve cell (dendrites), as curves. */
export function dendrites(p: Pt, seed: string, n = 3, len = 12): Curve[] {
  const rng = seededRng(`den:${seed}`);
  return Array.from({ length: n }, () => {
    const ang = rng() * Math.PI * 2;
    const l = len * (0.6 + rng() * 0.8);
    const b = { x: p.x + Math.cos(ang) * l, y: p.y + Math.sin(ang) * l };
    return { a: p, b, c: bend(p, b, (rng() - 0.5) * 0.8) };
  });
}
