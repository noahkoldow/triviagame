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

/**
 * A place on the map that gets scenery: every question node, plus the preview
 * strand. Scenery is generated from the area of the question that populates the
 * place, so physics grows orbits, music grows notes, antiquity grows columns.
 */
export interface Site {
  id: string;
  x: number;
  y: number;
  area: string;
  sector: Sector;
  state: 'open' | 'solved' | 'damaged' | 'locked' | 'preview';
}

export interface AreaScenery {
  area: string;
  sector: Sector;
  stroke: SkPath;
  fill: SkPath;
}

type B = SkPathBuilder;

function ellipse(p: B, x: number, y: number, rx: number, ry: number, rot = 0, n = 16) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const ex = Math.cos(a) * rx;
    const ey = Math.sin(a) * ry;
    const px = x + ex * c - ey * s;
    const py = y + ex * s + ey * c;
    if (i === 0) p.moveTo(px, py);
    else p.lineTo(px, py);
  }
}

function poly(p: B, pts: [number, number][], close = true) {
  pts.forEach(([x, y], i) => (i === 0 ? p.moveTo(x, y) : p.lineTo(x, y)));
  if (close) p.close();
}

function rect(p: B, x: number, y: number, w: number, h: number) {
  poly(p, [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ]);
}

/** One generated asset. `s` is its size in world units. */
function drawProp(area: string, rng: Rng, x: number, y: number, s: number, st: B, fi: B) {
  const a = rng() * Math.PI * 2;
  switch (area) {
    case 'physics':
      ellipse(st, x, y, s, s * 0.42, a);
      ellipse(st, x, y, s, s * 0.42, a + Math.PI / 3);
      fi.addCircle(x, y, 3);
      fi.addCircle(x + Math.cos(a) * s, y + Math.sin(a) * s * 0.42, 2.2);
      break;
    case 'chemistry': {
      const pts: [number, number][] = [];
      for (let i = 0; i < 6; i++)
        pts.push([x + Math.cos(a + (i * Math.PI) / 3) * s * 0.7, y + Math.sin(a + (i * Math.PI) / 3) * s * 0.7]);
      poly(st, pts);
      pts.forEach(([px, py], i) => i % 2 === 0 && fi.addCircle(px, py, 2.4));
      st.moveTo(pts[0]![0], pts[0]![1]);
      st.lineTo(pts[0]![0] + Math.cos(a) * s * 0.6, pts[0]![1] + Math.sin(a) * s * 0.6);
      break;
    }
    case 'computing':
      poly(st, [[x - s * 0.4, y - s * 0.5], [x - s * 0.7, y - s * 0.5], [x - s * 0.7, y + s * 0.5], [x - s * 0.4, y + s * 0.5]], false);
      poly(st, [[x + s * 0.4, y - s * 0.5], [x + s * 0.7, y - s * 0.5], [x + s * 0.7, y + s * 0.5], [x + s * 0.4, y + s * 0.5]], false);
      rect(fi, x - s * 0.15, y - s * 0.15, s * 0.3, s * 0.3);
      break;
    case 'medicine':
      st.moveTo(x - s * 0.5, y);
      st.lineTo(x + s * 0.5, y);
      st.moveTo(x, y - s * 0.5);
      st.lineTo(x, y + s * 0.5);
      poly(st, [[x - s, y + s * 0.8], [x - s * 0.5, y + s * 0.8], [x - s * 0.3, y + s * 0.4], [x, y + s * 1.2], [x + s * 0.3, y + s * 0.6], [x + s, y + s * 0.8]], false);
      break;
    case 'biology':
      ellipse(st, x, y, s * 0.8, s * 0.6, a);
      fi.addCircle(x + Math.cos(a) * s * 0.15, y + Math.sin(a) * s * 0.15, s * 0.2);
      break;
    case 'geography':
      for (let k = 1; k <= 3; k++) ellipse(st, x, y, s * 0.35 * k, s * 0.24 * k, a, 12);
      break;
    case 'climate': {
      let px = x;
      let py = y;
      st.moveTo(px, py);
      for (let k = 1; k <= 14; k++) {
        px = x + Math.cos(a + k * 0.55) * (k / 14) * s;
        py = y + Math.sin(a + k * 0.55) * (k / 14) * s;
        st.lineTo(px, py);
      }
      fi.addCircle(px, py, 2);
      break;
    }
    case 'animals':
      fi.addCircle(x, y + s * 0.15, s * 0.3);
      for (let k = 0; k < 4; k++) {
        const ka = Math.PI + (k - 1.5) * 0.6;
        fi.addCircle(x + Math.cos(ka) * s * 0.55, y + s * 0.15 + Math.sin(ka) * s * 0.55, s * 0.13);
      }
      break;
    case 'music':
      fi.addCircle(x, y, 3.6);
      st.moveTo(x + 3.4, y);
      st.lineTo(x + 3.4, y - s);
      st.quadTo(x + 3.4 + s * 0.45, y - s * 0.8, x + 3.4 + s * 0.3, y - s * 0.5);
      if (rng() < 0.4) for (let k = 0; k < 3; k++) {
        st.moveTo(x - s, y + k * 5);
        st.lineTo(x + s, y + k * 5);
      }
      break;
    case 'literature':
      poly(st, [[x, y - s * 0.3], [x - s * 0.8, y - s * 0.5], [x - s * 0.8, y + s * 0.4], [x, y + s * 0.6]], false);
      poly(st, [[x, y - s * 0.3], [x + s * 0.8, y - s * 0.5], [x + s * 0.8, y + s * 0.4], [x, y + s * 0.6]], false);
      st.moveTo(x, y - s * 0.3);
      st.lineTo(x, y + s * 0.6);
      break;
    case 'art':
      for (let k = 0; k < 4; k++) fi.addCircle(x + gaussian(rng) * s * 0.5, y + gaussian(rng) * s * 0.5, 1.8 + rng() * 3.4);
      st.moveTo(x - s, y);
      st.quadTo(x, y - s * 0.9, x + s, y + s * 0.2);
      break;
    case 'language':
      poly(st, [[x - s * 0.7, y - s * 0.4], [x + s * 0.7, y - s * 0.4], [x + s * 0.7, y + s * 0.3], [x - s * 0.1, y + s * 0.3], [x - s * 0.4, y + s * 0.7], [x - s * 0.4, y + s * 0.3], [x - s * 0.7, y + s * 0.3]]);
      fi.addCircle(x - s * 0.3, y - s * 0.05, 1.6);
      fi.addCircle(x, y - s * 0.05, 1.6);
      fi.addCircle(x + s * 0.3, y - s * 0.05, 1.6);
      break;
    case 'antiquity':
      rect(st, x - s * 0.35, y - s * 0.7, s * 0.7, s * 0.14);
      rect(st, x - s * 0.25, y - s * 0.56, s * 0.5, s * 1.1);
      rect(fi, x - s * 0.4, y + s * 0.54, s * 0.8, s * 0.12);
      break;
    case 'modern': {
      const pts: [number, number][] = [];
      for (let i = 0; i < 16; i++) {
        const r = i % 2 === 0 ? s * 0.7 : s * 0.5;
        pts.push([x + Math.cos(a + (i * Math.PI) / 8) * r, y + Math.sin(a + (i * Math.PI) / 8) * r]);
      }
      poly(st, pts);
      fi.addCircle(x, y, s * 0.16);
      break;
    }
    case 'politics':
      poly(st, [[x - s * 0.8, y - s * 0.3], [x, y - s * 0.8], [x + s * 0.8, y - s * 0.3]]);
      for (let k = -1; k <= 1; k++) rect(st, x + k * s * 0.5 - 2, y - s * 0.2, 4, s * 0.8);
      break;
    case 'economy':
      for (let k = 0; k < 3; k++) rect(fi, x - s * 0.6 + k * s * 0.45, y + s * 0.4 - s * (0.3 + 0.3 * k), s * 0.3, s * (0.3 + 0.3 * k));
      ellipse(st, x + s * 0.7, y - s * 0.4, s * 0.25, s * 0.25, 0, 10);
      break;
    default:
      fi.addCircle(x, y, 2);
  }
}

/** Tints within a sector so neighbouring areas still look different. */
export function areaTint(area: string): number {
  const list = areasOfSector(sectorOfArea(area));
  return list.findIndex((a) => a.id === area) / Math.max(1, list.length - 1);
}

/**
 * Builds one stroke and one fill path per area. Sites that are not unlocked
 * stay empty: scenery only grows where the player's questions populate the map.
 */
export function buildScenery(sites: Site[]): AreaScenery[] {
  const buckets = new Map<string, { stroke: B; fill: B }>();
  for (const site of sites) {
    if (site.state === 'locked') continue;
    let b = buckets.get(site.area);
    if (!b) {
      b = { stroke: Skia.PathBuilder.Make(), fill: Skia.PathBuilder.Make() };
      buckets.set(site.area, b);
    }
    const rng = seededRng(`scenery:${site.id}:${hashString(site.area)}`);
    const count = site.state === 'open' ? 7 : 12;
    for (let i = 0; i < count; i++) {
      const a = rng() * Math.PI * 2;
      const r = 50 + Math.sqrt(rng()) * 190;
      drawProp(site.area, rng, site.x + Math.cos(a) * r, site.y + Math.sin(a) * r, 12 + rng() * 22, b.stroke, b.fill);
    }
  }
  return [...buckets.entries()].map(([area, b]) => ({
    area,
    sector: sectorOfArea(area),
    stroke: b.stroke.detach(),
    fill: b.fill.detach(),
  }));
}

// ---------------------------------------------------------------------------
// Preview strand: a long chain far out from the core so the change of the
// background (circuit board → nature → culture) can be seen on one path.

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
