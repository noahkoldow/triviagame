import type { GeoBox } from '@nexus/shared';
import { LAND } from './land.data';

/** Drawn maps: a plain longitude/latitude grid (equirectangular), pure so it can be tested. */

export const WORLD: GeoBox = { west: -180, south: -60, east: 180, north: 80 };

/** Height of a map `width` wide: true to the degrees, but never flatter than half or taller than wide. */
export function mapHeight(r: GeoBox, width: number): number {
  const ratio = (r.north - r.south) / (r.east - r.west);
  return Math.round(width * Math.min(1, Math.max(0.5, ratio)));
}

export function project(r: GeoBox, w: number, h: number, lat: number, lon: number): { x: number; y: number } {
  return { x: ((lon - r.west) / (r.east - r.west)) * w, y: ((r.north - lat) / (r.north - r.south)) * h };
}

/** The point under a tap. */
export function unproject(r: GeoBox, w: number, h: number, x: number, y: number): { lat: number; lon: number } {
  return { lon: r.west + (x / w) * (r.east - r.west), lat: r.north - (y / h) * (r.north - r.south) };
}

/** Degrees between grid lines: about four to eight lines across. */
export function gridStep(r: GeoBox): number {
  const span = Math.max(r.east - r.west, r.north - r.south);
  return span > 120 ? 30 : span > 60 ? 15 : span > 25 ? 10 : 5;
}

/** Grid lines inside the region, on whole multiples of the step. */
export function gridLines(r: GeoBox): { lats: number[]; lons: number[] } {
  const step = gridStep(r);
  const range = (a: number, b: number) => {
    const out: number[] = [];
    for (let v = Math.ceil(a / step) * step; v <= b; v += step) out.push(v);
    return out;
  };
  return { lats: range(r.south, r.north), lons: range(r.west, r.east) };
}

/** The land outlines touching the region as one SVG path (whatever lies outside is clipped by the view). */
export function landPath(r: GeoBox, w: number, h: number): string {
  const parts: string[] = [];
  for (const ring of LAND) {
    let minLon = 180;
    let maxLon = -180;
    let minLat = 90;
    let maxLat = -90;
    for (let i = 0; i < ring.length; i += 2) {
      minLon = Math.min(minLon, ring[i]!);
      maxLon = Math.max(maxLon, ring[i]!);
      minLat = Math.min(minLat, ring[i + 1]!);
      maxLat = Math.max(maxLat, ring[i + 1]!);
    }
    if (maxLon < r.west || minLon > r.east || maxLat < r.south || minLat > r.north) continue;
    const pts: string[] = [];
    for (let i = 0; i < ring.length; i += 2) {
      const p = project(r, w, h, ring[i + 1]!, ring[i]!);
      pts.push(`${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
    }
    parts.push(`M ${pts.join(' L ')} Z`);
  }
  return parts.join(' ');
}

/** The tolerance of a locate question as an ellipse on the map (a degree of longitude shrinks towards the poles). */
export function toleranceRadii(r: GeoBox, w: number, h: number, lat: number, km: number): { rx: number; ry: number } {
  const dLat = km / 111.2;
  const dLon = km / (111.2 * Math.max(0.1, Math.cos((lat * Math.PI) / 180)));
  return { rx: (dLon / (r.east - r.west)) * w, ry: (dLat / (r.north - r.south)) * h };
}
