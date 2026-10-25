import { HEX_R, hexDistance, hexKey, hexNeighbors, hexToWorld, worldToHex, type Hex } from './hex';

/**
 * Zones and walls (D58). The four starting areas share the core zone, a disc around the chip.
 * Around it morph.ai pulled up a firewall: a ring of raised hexagon cells. Behind it lie the
 * other eight areas, each in its own slice of the ring around the core, and walls run between
 * these slices too. A wall stays hidden in the fog until the network comes close; once a node
 * stands right at it, it can be attacked, and breaking it tears a gap of a few cells at that
 * spot through which the network grows into the area behind.
 *
 * Everything here is geometry on the hexagon grid; which walls are broken is stored on the
 * firewalls (`boss.ts`).
 */

/** The zone of the four starting areas. Every other zone is named after its area. */
export const CORE_ZONE = 'core';
/** Radius of the firewall ring around the core zone (world units). */
export const WALL_RADIUS = 470;
/** The walls between the outer areas run out this far (the camera stops at 2600). */
export const WALL_OUTER = 2500;
/** Nodes keep this far from a wall (world units), so a node tile never touches it. */
export const WALL_MARGIN = 80;
/** A wall is one cell thick; its cells lie outside the ring and on the far side of a slice. */
const THICK = Math.sqrt(3) * HEX_R;
/** A wall can be attacked once a node stands this many cells from it. */
export const WALL_REACH = 3;
/** The map shows a wall once a node is this many cells away; further walls hide in the fog. */
export const WALL_SIGHT = 5;
/** Cells on each side of the breach point that fall when a wall is broken. */
export const BREACH_CELLS = 2;

const Q = Math.PI / 4;

/**
 * The outer areas in ring order, each in a slice of 45° (angles in radians, clockwise on the
 * screen, science points up). Each sector keeps its two outer areas inside its own wedge; the
 * order puts areas that lead into each other side by side (biology next to climate, technology
 * next to economy, philosophy next to law).
 */
export const OUTER_ZONES: { area: string; from: number; to: number }[] = [
  { area: 'technology', from: -3 * Q, to: -2 * Q },
  { area: 'biomedicine', from: -2 * Q, to: -Q },
  { area: 'climate', from: -Q, to: 0 },
  { area: 'astronomy', from: 0, to: Q },
  { area: 'arts', from: Q, to: 2 * Q },
  { area: 'philosophy', from: 2 * Q, to: 3 * Q },
  { area: 'law', from: 3 * Q, to: 4 * Q },
  { area: 'economy', from: 4 * Q, to: 5 * Q },
];

const START = OUTER_ZONES[0]!.from;

/** The angle of a point, turned into the range the slices cover. */
function ringAngle(x: number, y: number): number {
  const a = Math.atan2(y, x);
  return a < START ? a + 2 * Math.PI : a;
}

function sliceIndex(x: number, y: number): number {
  return Math.min(OUTER_ZONES.length - 1, Math.floor((ringAngle(x, y) - START) / Q));
}

/** The zone a point lies in. */
export function zoneOf(x: number, y: number): string {
  if (Math.hypot(x, y) < WALL_RADIUS) return CORE_ZONE;
  return OUTER_ZONES[sliceIndex(x, y)]!.area;
}

/** The zone of a topic area: the starting areas live in the core zone, every other area in its own. */
export function zoneOfArea(area: string): string {
  return OUTER_ZONES.some((z) => z.area === area) ? area : CORE_ZONE;
}

/** The nearest point of a zone that keeps `WALL_MARGIN` from its walls. */
export function clampToZone(p: { x: number; y: number }, zone: string): { x: number; y: number } {
  const r = Math.hypot(p.x, p.y);
  if (zone === CORE_ZONE) {
    const max = WALL_RADIUS - WALL_MARGIN;
    if (r <= max) return { x: p.x, y: p.y };
    return { x: (p.x / r) * max, y: (p.y / r) * max };
  }
  const z = OUTER_ZONES.find((o) => o.area === zone);
  if (!z) return { x: p.x, y: p.y };
  const rr = Math.min(WALL_OUTER - WALL_MARGIN, Math.max(WALL_RADIUS + THICK + WALL_MARGIN, r));
  // the distance to a radial wall line is r·sin(angle to it); the wall toward the next slice
  // is made of this slice's own cells, so that side needs one cell more
  const m0 = Math.asin(Math.min(1, WALL_MARGIN / rr));
  const m1 = Math.asin(Math.min(1, (WALL_MARGIN + THICK) / rr));
  const mid = (z.from + z.to) / 2;
  let a = r > 0 ? ringAngle(p.x, p.y) : mid;
  // a point on the far side of the ring is closest to the slice edge nearer to it
  if (a < z.from - Math.PI) a += 2 * Math.PI;
  if (a > z.to + Math.PI) a -= 2 * Math.PI;
  a = Math.max(z.from + m0, Math.min(z.to - m1, a));
  return { x: Math.cos(a) * rr, y: Math.sin(a) * rr };
}

/** One raised cell of a wall. */
export interface WallCell {
  hex: Hex;
  key: string;
  x: number;
  y: number;
  /** The zones this cell separates: two, or three where walls meet. */
  zones: string[];
}

let ALL: WallCell[] | undefined;

/**
 * Every wall cell, built once. A wall is one cell thick and closed: the ring is made of the
 * outer cells next to the core zone, the wall between two slices of the cells of one slice next
 * to the following slice. So every way from one zone into another crosses a wall cell.
 */
export function wallCells(): WallCell[] {
  if (ALL) return ALL;
  const out: WallCell[] = [];
  const n = Math.ceil(WALL_OUTER / (HEX_R * 1.5)) + 1;
  const near = 2 * HEX_R;
  for (let q = -2 * n; q <= 2 * n; q++) {
    for (let r = -n; r <= n; r++) {
      const hex = { q, r };
      const w = hexToWorld(hex);
      const d = Math.hypot(w.x, w.y);
      if (d < WALL_RADIUS || d > WALL_OUTER) continue;
      // only cells close to the ring or to a slice border can be part of a wall
      const a = ringAngle(w.x, w.y);
      const off = (a - START) / Q - Math.round((a - START) / Q);
      if (d - WALL_RADIUS > near && Math.abs(Math.sin(off * Q)) * d > near) continue;
      const own = zoneOf(w.x, w.y);
      const next = OUTER_ZONES[(OUTER_ZONES.findIndex((z) => z.area === own) + 1) % OUTER_ZONES.length]!.area;
      const around = hexNeighbors(hex).map((h) => {
        const p = hexToWorld(h);
        return zoneOf(p.x, p.y);
      });
      if (!around.includes(CORE_ZONE) && !around.includes(next)) continue;
      out.push({ hex, key: hexKey(hex), x: w.x, y: w.y, zones: [...new Set([own, ...around])].sort() });
    }
  }
  ALL = out;
  return out;
}

const FACING = new Map<string, WallCell[]>();

/** The wall cells between zone `a` and zone `b` (empty if they do not touch). */
export function wallBetween(a: string, b: string): WallCell[] {
  const k = a < b ? `${a}|${b}` : `${b}|${a}`;
  let cells = FACING.get(k);
  if (!cells) {
    cells = wallCells().filter((c) => c.zones.includes(a) && c.zones.includes(b));
    FACING.set(k, cells);
  }
  return cells;
}

/** A gap in a wall: where it was broken and the zone on the other side. */
export interface Breach {
  x: number;
  y: number;
  /** The zone the network came from. */
  from: string;
}

/** The cells that fell when the wall around `area` was broken at `breach`. */
export function breachCells(area: string, breach: Breach): WallCell[] {
  const c = worldToHex(breach.x, breach.y);
  return wallBetween(area, breach.from).filter((w) => hexDistance(w.hex, c) <= BREACH_CELLS);
}

type Pos = { pos: { x: number; y: number } };

/** Where the network comes closest to the wall around `area`: the node, the wall cell and the distance in cells. */
export function approachOf<N extends Pos>(
  nodes: N[],
  area: string,
): { node: N; cell: WallCell; cells: number; from: string } | undefined {
  let best: { node: N; cell: WallCell; cells: number; from: string } | undefined;
  for (const n of nodes) {
    const from = zoneOf(n.pos.x, n.pos.y);
    if (from === area) continue;
    const h = worldToHex(n.pos.x, n.pos.y);
    for (const cell of wallBetween(area, from)) {
      const d = hexDistance(h, cell.hex);
      if (!best || d < best.cells) best = { node: n, cell, cells: d, from };
    }
  }
  return best;
}

/** The nearest wall cell around `area` to a point, seen from the zone the point is in. */
export function nearestWallCell(area: string, p: { x: number; y: number }): WallCell | undefined {
  const from = zoneOf(p.x, p.y);
  let best: WallCell | undefined;
  let bd = Infinity;
  for (const c of wallBetween(area, from)) {
    const d = Math.hypot(c.x - p.x, c.y - p.y);
    if (d < bd) {
      bd = d;
      best = c;
    }
  }
  return best;
}

/**
 * The breaches between zones, as a route: the gaps a trace from zone `from` to zone `to` passes
 * on the way (empty in the same zone, undefined if no gap leads there).
 */
export function zoneRoute(breaches: { area: string; breach: Breach }[], from: string, to: string): Breach[] | undefined {
  if (from === to) return [];
  const prev = new Map<string, { zone: string; gap: Breach }>();
  const seen = new Set([from]);
  let frontier = [from];
  while (frontier.length) {
    const next: string[] = [];
    for (const z of frontier) {
      for (const b of breaches) {
        const ends = [b.area, b.breach.from];
        if (!ends.includes(z)) continue;
        const other = ends[0] === z ? ends[1]! : ends[0]!;
        if (seen.has(other)) continue;
        seen.add(other);
        prev.set(other, { zone: z, gap: b.breach });
        next.push(other);
      }
    }
    frontier = next;
  }
  if (!seen.has(to)) return undefined;
  const route: Breach[] = [];
  for (let z = to; z !== from; ) {
    const step = prev.get(z)!;
    route.unshift(step.gap);
    z = step.zone;
  }
  return route;
}

/** The points a trace from `a` to `b` passes on its way: the gaps between their zones. */
export function traceVia(
  breaches: { area: string; breach: Breach }[],
  a: { x: number; y: number },
  b: { x: number; y: number },
): { x: number; y: number }[] {
  return zoneRoute(breaches, zoneOf(a.x, a.y), zoneOf(b.x, b.y)) ?? [];
}
