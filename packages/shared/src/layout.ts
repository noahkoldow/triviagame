import { seededRng } from './rng';
import { SECTOR_ANGLE } from './taxonomy';
import type { Sector, Vec3 } from './types';
import { clampToZone } from './walls';

export const ROOT_RADIUS = 150;
export const MIN_GAP = 64;
const WEDGE = 0.8; // half-width (rad) a node may stray from its main sector's axis
/**
 * The longest link between a node and the spot it grows from (its parent, or the gap in a wall
 * it passes): a new node always appears next to it and never jumps across the map (D60).
 */
export const MAX_LINK = 230;
/** How far one link can reach toward a topic in another sector or behind a gap (see `reachOf` in network.ts). */
export const LINK_REACH = 220;

type Point = { x: number; y: number };

/** A drawn piece of a trace (roots are linked to the core at 0,0). */
export interface Link {
  a: Point;
  b: Point;
}

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

/**
 * How far a point is from the wedge of a sector (0 inside it). The far side of the map lies behind
 * the core, where no trace may run: it is out of reach.
 */
export function sectorDistance(p: Point, sector: Sector): number {
  const { r, th } = polar(p);
  const out = Math.abs(angDiff(th, SECTOR_ANGLE[sector])) - WEDGE;
  if (out <= 0) return 0;
  return out < Math.PI / 2 ? r * Math.sin(out) : Infinity;
}

/** Whether two links cross (links that share an end do not). */
export function linksCross(s: Link, t: Link): boolean {
  const same = (p: Point, q: Point) => Math.abs(p.x - q.x) < 1e-6 && Math.abs(p.y - q.y) < 1e-6;
  if (same(s.a, t.a) || same(s.a, t.b) || same(s.b, t.a) || same(s.b, t.b)) return false;
  const side = (p: Point, q: Point, r: Point) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  return side(s.a, s.b, t.a) * side(s.a, s.b, t.b) < 0 && side(t.a, t.b, s.a) * side(t.a, t.b, s.b) < 0;
}

function distToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}

export interface PlaceOptions {
  parent: Vec3;
  kind: 'deepen' | 'bridge' | 'debris';
  mainSector: Sector;
  /** Secondary sector weights; they only bend the node's direction a little. */
  side?: Partial<Record<Sector, number>>;
  existing: Vec3[];
  /** The traces already drawn; a new link avoids crossing them. */
  links?: Link[];
  seed: string;
  /** Lean the direction toward this point (a wall to reach); `pull` 0..1 is how strongly. */
  target?: { x: number; y: number; pull: number };
  /** The zone of the node's area (see `walls.ts`): it never ends up behind a wall. */
  zone?: string;
}

/**
 * Keeps a point inside its zone, away from the walls, and pushes it out of the way of the
 * nodes that are already there. In the core zone the walls are the ring only.
 */
export function settle(p: { x: number; y: number }, zone: string | undefined, existing: { x: number; y: number }[]) {
  const inZone = (q: { x: number; y: number }) => (zone ? clampToZone(q, zone) : q);
  const free = (q: { x: number; y: number }) => existing.every((e) => Math.hypot(q.x - e.x, q.y - e.y) >= MIN_GAP - 1);
  let at = inZone(p);
  for (let iter = 0; iter < 12; iter++) {
    let moved = false;
    for (const e of existing) {
      let dx = at.x - e.x;
      let dy = at.y - e.y;
      // two points clamped onto the same spot at a wall: step aside in some direction
      if (Math.hypot(dx, dy) < 0.5) {
        dx = Math.cos(iter * 2.4);
        dy = Math.sin(iter * 2.4);
      }
      const d = Math.hypot(dx, dy);
      if (d < MIN_GAP) {
        const push = (MIN_GAP - d) / d;
        at = inZone({ x: at.x + dx * push, y: at.y + dy * push });
        moved = true;
      }
    }
    if (!moved) break;
  }
  if (free(at)) return at;
  // pushed against a wall with no room left: look for the nearest free spot around it
  for (let ring = 1; ring <= 8; ring++) {
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2 + ring;
      const q = inZone({ x: at.x + Math.cos(a) * ring * MIN_GAP * 0.6, y: at.y + Math.sin(a) * ring * MIN_GAP * 0.6 });
      if (free(q)) return q;
    }
  }
  return at;
}

/** Turns of the wished direction that are tried, nearest first, and the spacings with them. */
const TURNS = [0, ...Array.from({ length: 11 }, (_, i) => (i + 1) * 0.27).flatMap((t) => [t, -t]), Math.PI];
const SPACING = [1, 0.8, 1.25, 1.6, 2];
/** What a spot costs when its link crosses a trace, and when it runs through another node. */
const CROSS_COST = 600;
const THROUGH_COST = 150;

/**
 * The nearest free spots around `from` in a zone that is full right next to it, ring by ring;
 * of the first ring with room the spot whose link crosses the fewest traces.
 */
function freeSpot(from: Point, zone: string | undefined, existing: Point[], links: Link[]): Point | undefined {
  const inZone = (q: Point) => (zone ? clampToZone(q, zone) : q);
  for (let ring = MAX_LINK; ring <= 2600; ring += MIN_GAP * 0.6) {
    let best: Point | undefined;
    let fewest = Infinity;
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2 + ring / 100;
      const q = inZone({ x: from.x + Math.cos(a) * ring, y: from.y + Math.sin(a) * ring });
      if (polar(q).r < ROOT_RADIUS + 20 || existing.some((e) => Math.hypot(q.x - e.x, q.y - e.y) < MIN_GAP - 1)) continue;
      const crossings = links.filter((l) => linksCross({ a: from, b: q }, l)).length;
      if (crossings < fewest) {
        fewest = crossings;
        best = q;
      }
    }
    if (best) return best;
  }
  return undefined;
}

/**
 * Organic but local placement (D60): the wished direction follows the parent outward, spacing
 * varies per kind (deepen close, bridge farther) plus noise, and a node outside its main
 * sector's wedge heads for it. From there the spot next to the parent is chosen that stays in
 * the zone (never behind a wall) and the wedge (side weights bend it a little toward a
 * neighbour), keeps its distance to other nodes and crosses no trace. It lands at most
 * `MAX_LINK` from the parent; only when the zone is full there it moves on to the nearest room.
 */
export function placeNode(o: PlaceOptions): Vec3 {
  const rng = seededRng(o.seed);
  const { th: parentTh } = polar(o.parent);
  let axis = SECTOR_ANGLE[o.mainSector];
  for (const [s, w] of Object.entries(o.side ?? {}) as [Sector, number][]) {
    const d = angDiff(SECTOR_ANGLE[s], SECTOR_ANGLE[o.mainSector]);
    // only a neighbour has a direction; the opposite sector lies behind the core
    if (w && Math.abs(d) < Math.PI * 0.6) axis += d * w * 0.5;
  }
  const toward = angDiff(axis, parentTh);
  const random = rng() < 0.5 ? -1 : 1;
  const sign = Math.abs(toward) > WEDGE / 2 ? Math.sign(toward) : random;
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

  // only what lies around the parent can get in the way (a spot clamped into the zone may move a bit)
  const around = MAX_LINK + 150;
  const near = o.existing.filter((e) => Math.hypot(e.x - o.parent.x, e.y - o.parent.y) < around + MIN_GAP);
  const nearLinks = (o.links ?? []).filter((l) => distToSegment(o.parent, l.a, l.b) < around);
  let best: Point | undefined;
  let bestScore = Infinity;
  for (const turn of TURNS) {
    for (const f of SPACING) {
      let score = Math.abs(turn) * 50 + Math.abs(f - 1) * 40;
      if (score >= bestScore) continue;
      const d = Math.min(MAX_LINK, dist * f);
      const raw = { x: o.parent.x + Math.cos(angle + turn) * d, y: o.parent.y + Math.sin(angle + turn) * d };
      const c = o.zone ? clampToZone(raw, o.zone) : raw;
      const { r, th } = polar(c);
      const reach = Math.hypot(c.x - o.parent.x, c.y - o.parent.y);
      score += Math.hypot(c.x - raw.x, c.y - raw.y) * 2;
      if (reach > MAX_LINK) score += (reach - MAX_LINK) * 10;
      const out = Math.abs(angDiff(th, axis)) - WEDGE;
      if (out > 0) score += out * 600;
      if (r < ROOT_RADIUS + 20) score += 1000;
      // a spot on top of another node is no spot at all
      let free = true;
      for (const e of near) {
        if (score >= bestScore) break;
        if (Math.hypot(c.x - e.x, c.y - e.y) < MIN_GAP - 1) {
          free = false;
          break;
        }
        // the link must not run through another node
        if (Math.hypot(e.x - o.parent.x, e.y - o.parent.y) > 1 && distToSegment(e, o.parent, c) < 28) score += THROUGH_COST;
      }
      if (!free) continue;
      for (const l of nearLinks) {
        if (score >= bestScore) break;
        if (linksCross({ a: o.parent, b: c }, l)) score += CROSS_COST;
      }
      if (score < bestScore) {
        bestScore = score;
        best = c;
      }
    }
  }
  const p = best ?? freeSpot(o.parent, o.zone, o.existing, o.links ?? []) ?? settle(o.parent, o.zone, o.existing);
  return { x: p.x, y: p.y, z: depthOf(polar(p).r, (rng() - 0.5) * 0.16) };
}
