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
import { LIFT } from './hexAtlas';
import { areaTint, type Site } from './scenery';
import { computerness } from './style';

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

/** Circuit-board drawing: strong near the core, thinning out toward the edge. */
export interface Circuit {
  color: string;
  opacity: number;
  width: number;
  path: SkPath;
}

export interface HexScene {
  tiles: Tile[];
  ghosts: Ghost[];
  traces: Trace[];
  circuit: Circuit[];
  /** Cells that flicker around disturbed places, in three groups that blink independently. */
  noise: SkPath[];
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
const PCB = '#0A2A33';

/** Land colour of a sector: a dark, slightly tinted chip surface. */
export function landColor(sector: Sector | 'core', area?: string): string {
  if (sector === 'core') return '#102C3A';
  const base = mix(colors.sector[sector], '#0A1220', 0.66);
  return area ? mix(base, '#FFFFFF', areaTint(area) * 0.08) : base;
}
const traceColor = (sector: Sector) => mix(colors.sector[sector], '#FFFFFF', 0.25);

interface Cell {
  hex: Hex;
  color: string;
  sector: Sector | 'core';
  trace: boolean;
  flat: boolean;
}

type PB = ReturnType<typeof Skia.PathBuilder.Make>;

function hexPoly(b: PB, x: number, y: number, lift: number, R: number) {
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 3;
    const px = x + Math.cos(a) * R;
    const py = y * SQUASH - lift + Math.sin(a) * R * SQUASH;
    if (i === 0) b.moveTo(px, py);
    else b.lineTo(px, py);
  }
  b.close();
}

export function buildHexScene(sites: Site[], edges: TraceEdge[]): HexScene {
  const cells = new Map<string, Cell>();
  const owner = new Map<string, number>();

  // 1. land around every place; where places overlap, the closer one decides the colour
  const places: { c: Hex; r: number; color: string; sector: Sector | 'core'; seed: string }[] = [
    { c: { q: 0, r: 0 }, r: CORE_CELLS, color: landColor('core'), sector: 'core', seed: 'core' },
    ...sites.map((s) => ({
      c: worldToHex(s.x, s.y),
      r: siteCells(s.state),
      color: landColor(s.sector, s.area),
      sector: s.sector as Sector | 'core',
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
        cells.set(k, { hex, color: p.color, sector: p.sector, trace: false, flat: false });
      }
    }
  }

  // 1b. the computer look: near the core the ground turns into a circuit board whose
  // colour still carries the topic of that region; the further out, the less of it
  for (const c of cells.values()) {
    const w = hexToWorld(c.hex);
    const k = computerness(w.x, w.y);
    if (k <= 0) continue;
    const tint = c.sector === 'core' ? colors.accent : colors.sector[c.sector];
    c.color = mix(c.color, mix(PCB, tint, 0.16), k * 0.85);
  }

  // 2. traces: a chain of lit cells between connected places
  const traceLines: { color: string; cells: Hex[] }[] = [];
  for (const e of edges) {
    const line = hexLine(worldToHex(e.from.x, e.from.y), worldToHex(e.to.x, e.to.y));
    const color = traceColor(e.sector);
    for (const h of line) {
      const k = hexKey(h);
      const base = cells.get(k)?.color ?? landColor(e.sector);
      cells.set(k, {
        hex: h,
        color: e.lit ? mix(base, color, 0.45) : mix(base, color, 0.2),
        sector: e.sector,
        trace: true,
        flat: true,
      });
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

  // 4. tiles, back to front. A circuit board is flat; the terrain only gets bumpy outward.
  const tiles: Tile[] = [];
  const levelOf = new Map<string, number>();
  for (const c of cells.values()) {
    const w = hexToWorld(c.hex);
    const k = computerness(w.x, w.y);
    const n = hashString(`lvl:${hexKey(c.hex)}`) % 100;
    let level = c.flat ? 0 : n < 62 ? 0 : n < 90 ? 1 : 2;
    if (k > 0.55) level = 0;
    else if (k > 0.3) level = Math.min(level, 1);
    levelOf.set(hexKey(c.hex), level);
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
  const byColor = new Map<string, PB>();
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

  // 7. circuit-board drawing, in the colour of the topic, dense near the core
  const lines = new Map<string, { color: string; band: number; b: PB }>();
  const line = (color: string, band: number) => {
    const key = `${color}|${band}`;
    let e = lines.get(key);
    if (!e) {
      e = { color, band, b: Skia.PathBuilder.Make() };
      lines.set(key, e);
    }
    return e.b;
  };
  for (const c of cells.values()) {
    if (c.trace) continue;
    const w = hexToWorld(c.hex);
    const k = computerness(w.x, w.y);
    if (k < 0.08) continue;
    const h = hashString(`circ:${hexKey(c.hex)}`);
    if (h % 100 >= Math.round(30 + k * 60)) continue;
    const tint = c.sector === 'core' ? '#5BD5FF' : mix(colors.sector[c.sector], '#FFFFFF', 0.3);
    const band = k > 0.62 ? 2 : k > 0.32 ? 1 : 0;
    const b = line(tint, band);
    const x0 = w.x;
    const y0 = w.y * SQUASH;
    // a run to a neighbouring cell that is also land (60° bends, like routed traces)
    const dir = hexNeighbors(c.hex)[(h >>> 3) % 6]!;
    if (cells.has(hexKey(dir))) {
      const n = hexToWorld(dir);
      b.moveTo(x0, y0);
      b.lineTo(n.x, n.y * SQUASH);
    }
    b.addCircle(x0, y0, 2.4); // pad
    // now and then a small chip package
    if (h % 11 === 0 && k > 0.35) {
      const cw = 11;
      const ch = 6;
      b.moveTo(x0 - cw, y0 - ch);
      b.lineTo(x0 + cw, y0 - ch);
      b.lineTo(x0 + cw, y0 + ch);
      b.lineTo(x0 - cw, y0 + ch);
      b.close();
    }
  }
  // the die around the core: hexagonal rings and spokes
  const core = line('#5BD5FF', 2);
  const ring = (k: number) => {
    const r = k * HEX_R * Math.sqrt(3);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r * SQUASH;
      if (i === 0) core.moveTo(x, y);
      else core.lineTo(x, y);
    }
    core.close();
  };
  ring(2);
  ring(3.5);
  ring(5);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const r0 = 2 * HEX_R * Math.sqrt(3);
    const r1 = 5 * HEX_R * Math.sqrt(3);
    core.moveTo(Math.cos(a) * r0, Math.sin(a) * r0 * SQUASH);
    core.lineTo(Math.cos(a) * r1, Math.sin(a) * r1 * SQUASH);
    core.addCircle(Math.cos(a) * r1, Math.sin(a) * r1 * SQUASH, 3.4);
  }
  const OPACITY = [0.26, 0.5, 0.85];
  const circuit = [...lines.values()].map((e) => ({
    color: e.color,
    opacity: OPACITY[e.band]!,
    width: 1.5 + e.band * 0.5,
    path: e.b.detach(),
  }));

  // 8. noise: the cells around disturbed places, in three independently blinking groups
  const noiseB = [Skia.PathBuilder.Make(), Skia.PathBuilder.Make(), Skia.PathBuilder.Make()];
  for (const site of sites) {
    if (!site.noise) continue;
    const c0 = worldToHex(site.x, site.y);
    for (const cell of cells.values()) {
      if (cell.trace || hexDistance(cell.hex, c0) > 2) continue;
      const w = hexToWorld(cell.hex);
      const g = hashString(`noise:${hexKey(cell.hex)}`) % 3;
      hexPoly(noiseB[g]!, w.x, w.y, LIFT[levelOf.get(hexKey(cell.hex)) ?? 0]!, HEX_R * 0.9);
    }
  }

  return { tiles, ghosts, traces, circuit, noise: noiseB.map((b) => b.detach()) };
}

export const ghostColor = (band: number) => `#6F93B8${BAND_ALPHA[band] ?? '00'}`;
