import { Skia, type SkPath, type SkPathBuilder } from '@shopify/react-native-skia';
import {
  SECTORS,
  SECTOR_ANGLE,
  areasOfSector,
  gaussian,
  hashString,
  seededRng,
  sectorOfArea,
  type Rng,
  type Sector,
} from '@nexus/shared';
import { colors, mix, shade } from '../theme';
import { TILT } from './camera';

/**
 * A place on the map that gets land and scenery: every question node, plus the
 * preview strand. What grows there comes from the area of the question that
 * populates the place: physics grows crystals, music grows notes, antiquity
 * grows columns.
 */
export interface Site {
  id: string;
  x: number;
  y: number;
  area: string;
  sector: Sector;
  state: 'open' | 'solved' | 'damaged' | 'locked' | 'preview';
}

/** Tints within a sector so neighbouring areas still look different. */
export function areaTint(area: string): number {
  const list = areasOfSector(sectorOfArea(area));
  return list.findIndex((a) => a.id === area) / Math.max(1, list.length - 1);
}

// ---------------------------------------------------------------------------
// Land: solid islands with a cliff edge. Circles of the same colour are merged
// into one path, so overlapping places grow into one landmass.

export interface Disc {
  x: number;
  y: number;
  r: number;
}

export interface LandPaths {
  /** One cliff colour per sector (stacked as slices below the surface). */
  walls: { color: string; path: SkPath }[];
  /** Lighter rim, slightly larger than the surface. */
  rims: { color: string; path: SkPath }[];
  /** Surface, tinted per area. */
  tops: { color: string; path: SkPath }[];
}

export const LAND_BASE = '#2B3B44';

export function landTop(sector: Sector | 'core', area?: string): string {
  if (sector === 'core') return LAND_BASE;
  const base = mix(colors.sector[sector], colors.bg, 0.46);
  return area ? mix(base, '#FFFFFF', areaTint(area) * 0.1) : base;
}
export const landWall = (sector: Sector | 'core') =>
  sector === 'core' ? '#182228' : mix(colors.sector[sector], '#0B1418', 0.78);
const landRim = (sector: Sector | 'core') =>
  sector === 'core' ? '#4A606C' : mix(colors.sector[sector], '#FFFFFF', 0.18);

export function siteRadius(s: Site): number {
  return s.state === 'preview' ? 175 : s.state === 'locked' ? 105 : s.state === 'open' ? 205 : 235;
}

export function buildLand(sites: Site[]): LandPaths {
  type B = { color: string; b: SkPathBuilder };
  const walls = new Map<string, B>();
  const rims = new Map<string, B>();
  const tops = new Map<string, B>();
  const get = (m: Map<string, B>, color: string) => {
    let e = m.get(color);
    if (!e) {
      e = { color, b: Skia.PathBuilder.Make() };
      m.set(color, e);
    }
    return e.b;
  };
  const discs: { d: Disc; sector: Sector | 'core'; area?: string }[] = [
    { d: { x: 0, y: 0, r: 330 }, sector: 'core' },
    ...sites.map((s) => ({ d: { x: s.x, y: s.y, r: siteRadius(s) }, sector: s.sector, area: s.area })),
  ];
  for (const { d, sector, area } of discs) {
    get(walls, landWall(sector)).addCircle(d.x, d.y, d.r);
    get(rims, landRim(sector)).addCircle(d.x, d.y, d.r + 6);
    get(tops, landTop(sector, area)).addCircle(d.x, d.y, d.r);
  }
  const done = (m: Map<string, B>) => [...m.values()].map((e) => ({ color: e.color, path: e.b.detach() }));
  return { walls: done(walls), rims: done(rims), tops: done(tops) };
}

// ---------------------------------------------------------------------------
// Props: little upright cartoon objects. They are drawn into the ground plane
// stretched by 1/cos(tilt), which makes them stand upright on the tilted map,
// and merged by colour into a few paths (cheap even with hundreds of props).

export interface PropLayer {
  key: string;
  color: string;
  opacity: number;
  path: SkPath;
}

const K = 1 / Math.cos(TILT);

type Pt = [number, number];

class Painter {
  private m = new Map<string, { layer: number; color: string; b: SkPathBuilder }>();
  path(layer: number, color: string): SkPathBuilder {
    const key = `${layer}|${color}`;
    let e = this.m.get(key);
    if (!e) {
      e = { layer, color, b: Skia.PathBuilder.Make() };
      this.m.set(key, e);
    }
    return e.b;
  }
  build(): PropLayer[] {
    return [...this.m.entries()]
      .sort((a, b) => a[1].layer - b[1].layer)
      .map(([key, e]) => ({ key, color: e.color, opacity: e.layer === 0 ? 0.32 : 1, path: e.b.detach() }));
  }
}

/** Polygon in upright coordinates: u to the right, v up from the base point. */
function poly(b: SkPathBuilder, x: number, y: number, pts: Pt[]) {
  pts.forEach(([u, v], i) => {
    const px = x + u;
    const py = y - v * K;
    if (i === 0) b.moveTo(px, py);
    else b.lineTo(px, py);
  });
  b.close();
}

function ell(b: SkPathBuilder, x: number, y: number, cu: number, cv: number, ru: number, rv: number, n = 14) {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push([cu + Math.cos(a) * ru, cv + Math.sin(a) * rv]);
  }
  poly(b, x, y, pts);
}

const rect = (b: SkPathBuilder, x: number, y: number, u0: number, v0: number, u1: number, v1: number) =>
  poly(b, x, y, [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);

/** Flat shadow on the ground (not stretched). */
function shadow(p: Painter, x: number, y: number, r: number) {
  const b = p.path(0, '#06100F');
  const pts: Pt[] = [];
  for (let i = 0; i < 12; i++) pts.push([x + Math.cos((i / 12) * Math.PI * 2) * r, y + Math.sin((i / 12) * Math.PI * 2) * r * 0.55]);
  pts.forEach(([px, py], i) => (i === 0 ? b.moveTo(px, py) : b.lineTo(px, py)));
  b.close();
}

type Draw = (p: Painter, rng: Rng, x: number, y: number, s: number, base: string) => void;

const lightOf = (c: string) => mix(c, '#FFFFFF', 0.38);
const darkOf = (c: string) => shade(c, 0.32);

const KINDS: Record<string, Draw> = {
  tree(p, _r, x, y, s, base) {
    shadow(p, x, y, s * 0.5);
    rect(p.path(1, '#8B5A2B'), x, y, -s * 0.07, 0, s * 0.07, s * 0.5);
    ell(p.path(2, darkOf(base)), x, y, 0, s * 0.78, s * 0.42, s * 0.4);
    ell(p.path(3, lightOf(base)), x, y, -s * 0.08, s * 0.86, s * 0.32, s * 0.3);
  },
  pine(p, _r, x, y, s, base) {
    shadow(p, x, y, s * 0.4);
    rect(p.path(1, '#8B5A2B'), x, y, -s * 0.05, 0, s * 0.05, s * 0.25);
    for (let i = 0; i < 3; i++) {
      const w = s * (0.42 - i * 0.1);
      const v = s * (0.2 + i * 0.28);
      poly(p.path(2, darkOf(base)), x, y, [[-w, v], [w, v], [0, v + s * 0.5]]);
      poly(p.path(3, lightOf(base)), x, y, [[-w, v], [0, v], [0, v + s * 0.5]]);
    }
  },
  bush(p, _r, x, y, s, base) {
    shadow(p, x, y, s * 0.45);
    ell(p.path(2, darkOf(base)), x, y, 0, s * 0.22, s * 0.42, s * 0.26);
    ell(p.path(3, lightOf(base)), x, y, -s * 0.1, s * 0.3, s * 0.25, s * 0.18);
    ell(p.path(4, '#FF6B6B'), x, y, s * 0.18, s * 0.34, s * 0.06, s * 0.05, 8);
  },
  rock(p, _r, x, y, s, base) {
    shadow(p, x, y, s * 0.6);
    poly(p.path(2, darkOf(mix(base, '#7C8A93', 0.6))), x, y, [[-s * 0.55, 0], [s * 0.55, 0], [0, s * 1.05]]);
    poly(p.path(3, mix(base, '#B8C4CB', 0.6)), x, y, [[-s * 0.55, 0], [0, 0], [0, s * 1.05]]);
    poly(p.path(4, '#FFFFFF'), x, y, [[-s * 0.16, s * 0.78], [s * 0.16, s * 0.78], [0, s * 1.05]]);
  },
  crystal(p, _r, x, y, s, base) {
    shadow(p, x, y, s * 0.4);
    const w = s * 0.32;
    poly(p.path(2, darkOf(base)), x, y, [[-w, s * 0.25], [0, 0], [0, s * 1.25]]);
    poly(p.path(3, lightOf(base)), x, y, [[0, 0], [w, s * 0.25], [0, s * 1.25]]);
    poly(p.path(4, '#FFFFFF'), x, y, [[-w * 0.5, s * 0.55], [-w * 0.25, s * 0.5], [-w * 0.3, s * 0.85]]);
  },
  flask(p, _r, x, y, s, base) {
    shadow(p, x, y, s * 0.4);
    rect(p.path(1, '#DDEBF2'), x, y, -s * 0.1, s * 0.5, s * 0.1, s * 1.0);
    poly(p.path(1, '#DDEBF2'), x, y, [[-s * 0.4, 0], [s * 0.4, 0], [s * 0.1, s * 0.55], [-s * 0.1, s * 0.55]]);
    poly(p.path(3, lightOf(base)), x, y, [[-s * 0.34, s * 0.02], [s * 0.34, s * 0.02], [s * 0.22, s * 0.3], [-s * 0.22, s * 0.3]]);
  },
  cube(p, _r, x, y, s, base) {
    shadow(p, x, y, s * 0.5);
    const w = s * 0.4;
    const d = s * 0.18;
    const h = s * 0.7;
    poly(p.path(2, darkOf(base)), x, y, [[-w, h], [0, h - d], [0, -d], [-w, 0]]);
    poly(p.path(3, base), x, y, [[w, h], [0, h - d], [0, -d], [w, 0]]);
    poly(p.path(4, lightOf(base)), x, y, [[0, h + d], [w, h], [0, h - d], [-w, h]]);
  },
  cross(p, _r, x, y, s, base) {
    shadow(p, x, y, s * 0.4);
    rect(p.path(1, '#8B5A2B'), x, y, -s * 0.05, 0, s * 0.05, s * 0.4);
    rect(p.path(2, darkOf(base)), x, y, -s * 0.12, s * 0.4, s * 0.12, s * 1.1);
    rect(p.path(2, darkOf(base)), x, y, -s * 0.38, s * 0.66, s * 0.38, s * 0.86);
    rect(p.path(3, lightOf(base)), x, y, -s * 0.1, s * 0.44, s * 0.1, s * 1.06);
    rect(p.path(3, lightOf(base)), x, y, -s * 0.34, s * 0.68, s * 0.34, s * 0.84);
  },
  note(p, _r, x, y, s, base) {
    shadow(p, x, y, s * 0.4);
    rect(p.path(2, darkOf(base)), x, y, s * 0.12, s * 0.15, s * 0.22, s * 1.15);
    poly(p.path(2, darkOf(base)), x, y, [[s * 0.22, s * 1.15], [s * 0.62, s * 0.85], [s * 0.22, s * 0.9]]);
    ell(p.path(3, lightOf(base)), x, y, 0, s * 0.18, s * 0.26, s * 0.17);
  },
  books(p, _r, x, y, s, base) {
    shadow(p, x, y, s * 0.5);
    rect(p.path(2, darkOf(base)), x, y, -s * 0.45, 0, s * 0.45, s * 0.26);
    rect(p.path(3, base), x, y, -s * 0.38, s * 0.26, s * 0.4, s * 0.5);
    rect(p.path(4, lightOf(base)), x, y, -s * 0.42, s * 0.5, s * 0.34, s * 0.72);
    rect(p.path(4, '#FFFFFF'), x, y, -s * 0.45, s * 0.1, -s * 0.38, s * 0.16);
  },
  splat(p, rng, x, y, s) {
    shadow(p, x, y, s * 0.4);
    const pal = ['#FF86D0', '#FFC800', '#1CB0F6', '#58CC02'];
    for (let i = 0; i < 4; i++) {
      const a = rng() * Math.PI * 2;
      ell(p.path(3, pal[i]!), x, y, Math.cos(a) * s * 0.25, s * 0.3 + Math.sin(a) * s * 0.2, s * 0.2, s * 0.17, 9);
    }
    rect(p.path(1, '#8B5A2B'), x, y, -s * 0.03, 0, s * 0.03, s * 0.2);
  },
  bubble(p, _r, x, y, s, base) {
    shadow(p, x, y, s * 0.35);
    rect(p.path(1, '#8B5A2B'), x, y, -s * 0.04, 0, s * 0.04, s * 0.45);
    rect(p.path(2, darkOf(base)), x, y, -s * 0.5, s * 0.4, s * 0.5, s * 1.05);
    rect(p.path(3, lightOf(base)), x, y, -s * 0.46, s * 0.46, s * 0.46, s * 1.05);
    for (let i = -1; i <= 1; i++) ell(p.path(4, '#FFFFFF'), x, y, i * s * 0.24, s * 0.76, s * 0.06, s * 0.05, 7);
  },
  column(p, _r, x, y, s, base) {
    shadow(p, x, y, s * 0.45);
    const stone = mix(base, '#E8DCC0', 0.7);
    rect(p.path(2, darkOf(stone)), x, y, -s * 0.34, 0, s * 0.34, s * 0.12);
    rect(p.path(3, stone), x, y, -s * 0.2, s * 0.12, s * 0.2, s * 0.98);
    rect(p.path(2, darkOf(stone)), x, y, 0, s * 0.12, s * 0.2, s * 0.98);
    rect(p.path(3, lightOf(stone)), x, y, -s * 0.32, s * 0.98, s * 0.32, s * 1.14);
  },
  coins(p, _r, x, y, s, base) {
    shadow(p, x, y, s * 0.5);
    for (let i = 0; i < 3; i++) {
      const u = (i - 1) * s * 0.34;
      const h = s * (0.25 + i * 0.12);
      rect(p.path(2, darkOf(base)), x, y, u - s * 0.15, 0, u + s * 0.15, h);
      ell(p.path(3, lightOf(base)), x, y, u, h, s * 0.15, s * 0.07, 10);
    }
  },
};

const KIND_OF_AREA: Record<string, keyof typeof KINDS> = {
  physics: 'crystal',
  chemistry: 'flask',
  computing: 'cube',
  medicine: 'cross',
  biology: 'tree',
  geography: 'rock',
  climate: 'pine',
  animals: 'bush',
  music: 'note',
  literature: 'books',
  art: 'splat',
  language: 'bubble',
  antiquity: 'column',
  modern: 'cube',
  politics: 'column',
  economy: 'coins',
};

/** Merges all props of all places into a handful of paths, drawn back to front by layer. */
export function buildProps(sites: Site[]): PropLayer[] {
  const painter = new Painter();
  const placed: { x: number; y: number }[] = [];
  const ordered = [...sites].filter((s) => s.state !== 'locked');
  for (const site of ordered) {
    const rng = seededRng(`props:${site.id}:${hashString(site.area)}`);
    const draw = KINDS[KIND_OF_AREA[site.area] ?? 'bush']!;
    const base = colors.sector[site.sector];
    const reach = siteRadius(site) - 40;
    const want = site.state === 'open' ? 6 : 10;
    for (let tries = 0, made = 0; tries < want * 6 && made < want; tries++) {
      const a = rng() * Math.PI * 2;
      const r = 62 + Math.sqrt(rng()) * (reach - 62);
      const x = site.x + Math.cos(a) * r;
      const y = site.y + Math.sin(a) * r;
      if (placed.some((q) => Math.hypot(q.x - x, q.y - y) < 44)) continue;
      placed.push({ x, y });
      draw(painter, rng, x, y, 24 + rng() * 22, base);
      made++;
    }
  }
  return painter.build();
}

// ---------------------------------------------------------------------------
// Clouds: soft puffs beyond the cleared land. They are the fog of the unexplored.

export interface CloudPaths {
  shade: SkPath;
  light: SkPath;
}

export function buildClouds(discs: Disc[], count: number, seed: string, rMin: number, rMax: number): CloudPaths {
  const rng = seededRng(seed);
  const shadeB = Skia.PathBuilder.Make();
  const lightB = Skia.PathBuilder.Make();
  for (let i = 0; i < count; i++) {
    const a = rng() * Math.PI * 2;
    const r = rMin + rng() * (rMax - rMin);
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (discs.some((d) => Math.hypot(d.x - x, d.y - y) < d.r + 70)) continue;
    const s = 70 + rng() * 90;
    for (const [dx, dy, k] of [[0, 0, 1], [-0.9, 0.2, 0.7], [0.95, 0.18, 0.75], [0.35, -0.35, 0.65]] as const) {
      const rr = s * k;
      shadeB.addCircle(x + dx * s, y + dy * s * 0.5 + 12, rr);
      lightB.addCircle(x + dx * s, y + dy * s * 0.5, rr);
    }
  }
  return { shade: shadeB.detach(), light: lightB.detach() };
}

// ---------------------------------------------------------------------------
// Preview strand: a long chain far out from the core so the change of the
// land (slate → forest → violet meadows) can be seen on one path.

function nearestSector(angle: number): Sector {
  let best: Sector = 'nature';
  let bd = Infinity;
  for (const s of SECTORS) {
    let d = angle - SECTOR_ANGLE[s];
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    if (Math.abs(d) < bd) {
      bd = Math.abs(d);
      best = s;
    }
  }
  return best;
}

export function buildStrand(count = 16, seed = 'nexus-strand'): Site[] {
  const rng = seededRng(seed);
  const sites: Site[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const angle = 0.62 + t * 0.9 + gaussian(rng) * 0.04; // nature → culture
    const r = 360 + t * 1900 + gaussian(rng) * 18;
    const sector = nearestSector(angle);
    const areas = areasOfSector(sector);
    const area = areas[(i + Math.floor(rng() * 2)) % areas.length]!.id;
    sites.push({
      id: `strand${i}`,
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
      area,
      sector,
      state: 'preview',
    });
  }
  return sites;
}
