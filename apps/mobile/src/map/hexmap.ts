import { Skia, type SkPath } from '@shopify/react-native-skia';
import {
  HEX_R,
  hashString,
  hexDistance,
  hexKey,
  hexLine,
  hexNeighbors,
  hexToWorld,
  worldToHex,
  type Hex,
  type Sector,
} from '@nexus/shared';
import { colors, mix } from '../theme';
import { SQUASH } from './camera';
import { areaTint, type Site } from './scenery';

/** One small hexagon of land. `level` raises it a little (0..2). */
export interface Tile {
  x: number;
  y: number;
  level: number;
  color: string;
}

/** A hexagon outline in the fog beyond the land. `band` 1 is closest. */
export interface Ghost {
  x: number;
  y: number;
  band: number;
}

export interface Trace {
  color: string;
  path: SkPath;
}

export interface HexScene {
  tiles: Tile[];
  ghosts: Ghost[];
  traces: Trace[];
}

export interface TraceEdge {
  from: { x: number; y: number };
  to: { x: number; y: number };
  sector: Sector;
  lit: boolean;
}

/** Radius of the lit land around a place, in cells. */
export function siteCells(state: Site['state']): number {
  return state === 'solved' || state === 'damaged' ? 4 : state === 'open' ? 3 : state === 'preview' ? 2 : 1;
}
export const CORE_CELLS = 5;

const BAND_ALPHA = ['', '3A', '26', '16', '0B'];
const GHOST_BANDS = 4;

/** Land colour of a sector: a dark, slightly tinted chip surface. */
export function landColor(sector: Sector | 'core', area?: string): string {
  if (sector === 'core') return '#1B2A3C';
  const base = mix(colors.sector[sector], '#0A1220', 0.66);
  return area ? mix(base, '#FFFFFF', areaTint(area) * 0.08) : base;
}
const traceColor = (sector: Sector) => mix(colors.sector[sector], '#FFFFFF', 0.25);

interface Cell {
  hex: Hex;
  color: string;
  trace: boolean;
  flat: boolean;
}

export function buildHexScene(sites: Site[], edges: TraceEdge[]): HexScene {
  const cells = new Map<string, Cell>();
  const owner = new Map<string, number>();

  // 1. land around every place; where places overlap, the closer one decides the colour
  const places: { c: Hex; r: number; color: string; seed: string }[] = [
    { c: { q: 0, r: 0 }, r: CORE_CELLS, color: landColor('core'), seed: 'core' },
    ...sites.map((s) => ({
      c: worldToHex(s.x, s.y),
      r: siteCells(s.state),
      color: landColor(s.sector, s.area),
      seed: s.id,
    })),
  ];
  for (const p of places) {
    for (let dq = -p.r; dq <= p.r; dq++) {
      for (let dr = Math.max(-p.r, -dq - p.r); dr <= Math.min(p.r, -dq + p.r); dr++) {
        const hex = { q: p.c.q + dq, r: p.c.r + dr };
        const d = hexDistance(hex, p.c);
        // ragged edge: the outermost ring is only partly there
        if (d === p.r && p.r > 1 && hashString(`${p.seed}:${hexKey(hex)}`) % 100 < 38) continue;
        const k = hexKey(hex);
        const score = d / (p.r + 0.5);
        if ((owner.get(k) ?? Infinity) <= score) continue;
        owner.set(k, score);
        cells.set(k, { hex, color: p.color, trace: false, flat: false });
      }
    }
  }

  // 2. traces: a chain of lit cells between connected places
  const traceLines: { color: string; cells: Hex[] }[] = [];
  for (const e of edges) {
    const line = hexLine(worldToHex(e.from.x, e.from.y), worldToHex(e.to.x, e.to.y));
    const color = traceColor(e.sector);
    for (const h of line) {
      const k = hexKey(h);
      const base = cells.get(k)?.color ?? landColor(e.sector);
      cells.set(k, { hex: h, color: e.lit ? mix(base, color, 0.45) : mix(base, color, 0.2), trace: true, flat: true });
    }
    traceLines.push({ color, cells: line });
  }

  // 3. keep the ground around traces and places flat, so nothing hides them
  const flatten = (h: Hex) => {
    const c = cells.get(hexKey(h));
    if (c) c.flat = true;
  };
  for (const c of [...cells.values()]) {
    if (c.trace) hexNeighbors(c.hex).forEach(flatten);
  }
  for (const p of places) {
    flatten(p.c);
    hexNeighbors(p.c).forEach(flatten);
  }

  // 4. tiles, back to front
  const tiles: Tile[] = [];
  for (const c of cells.values()) {
    const w = hexToWorld(c.hex);
    const n = hashString(`lvl:${hexKey(c.hex)}`) % 100;
    const level = c.flat ? 0 : n < 62 ? 0 : n < 90 ? 1 : 2;
    const lit = c.trace ? c.color : mix(c.color, '#FFFFFF', 0.05 * level);
    tiles.push({ x: w.x, y: w.y, level, color: lit });
  }
  tiles.sort((a, b) => a.y - b.y || a.x - b.x);

  // 5. fog: faint outlines fading outward from the edge of the land
  const ghosts: Ghost[] = [];
  const seen = new Set(cells.keys());
  let frontier = [...cells.values()].map((c) => c.hex);
  for (let band = 1; band <= GHOST_BANDS; band++) {
    const next: Hex[] = [];
    for (const h of frontier) {
      for (const nb of hexNeighbors(h)) {
        const k = hexKey(nb);
        if (seen.has(k)) continue;
        seen.add(k);
        next.push(nb);
        const w = hexToWorld(nb);
        ghosts.push({ x: w.x, y: w.y, band });
      }
    }
    frontier = next;
  }
  ghosts.sort((a, b) => a.y - b.y);

  // 6. thin lines on top of the lit trace cells (view space, one path per colour)
  const byColor = new Map<string, ReturnType<typeof Skia.PathBuilder.Make>>();
  for (const t of traceLines) {
    let b = byColor.get(t.color);
    if (!b) {
      b = Skia.PathBuilder.Make();
      byColor.set(t.color, b);
    }
    t.cells.forEach((h, i) => {
      const w = hexToWorld(h);
      if (i === 0) b!.moveTo(w.x, w.y * SQUASH);
      else b!.lineTo(w.x, w.y * SQUASH);
    });
  }
  const traces = [...byColor.entries()].map(([color, b]) => ({ color, path: b.detach() }));

  return { tiles, ghosts, traces };
}

export const ghostColor = (band: number) => `#6F93B8${BAND_ALPHA[band] ?? '00'}`;
export { HEX_R };
