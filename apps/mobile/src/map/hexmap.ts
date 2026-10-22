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
import { propSprite } from './propAtlas';
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

/** A small standing object on a hexagon, fitting the area around it. */
export interface Prop {
  x: number;
  y: number;
  level: number;
  sprite: number;
}

export interface HexScene {
  tiles: Tile[];
  /** Trees, crystals, columns … on single tiles, back to front. */
  props: Prop[];
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

const BAND_ALPHA = ['', '26', '10'];
const GHOST_BANDS = 2;
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
  /** Every topic area that reaches this cell, with its weight (closer = more). None for the core and trace chains. */
  areas?: { area: string; w: number }[];
  /** Disturbed ground (outposts, MORPH noise): no scenery grows there. */
  noisy?: boolean;
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

  // 1. land around every place. Where places overlap, they blend: colour and scenery come from
  // all of them, closer places counting more, so topics flow into each other instead of ending at a line
  const places: {
    c: Hex;
    r: number;
    color: string;
    sector: Sector | 'core';
    seed: string;
    area?: string;
    noisy?: boolean;
  }[] = [
    { c: { q: 0, r: 0 }, r: CORE_CELLS, color: landColor('core'), sector: 'core', seed: 'core' },
    ...sites.map((s) => ({
      c: worldToHex(s.x, s.y),
      r: siteCells(s.state),
      color: landColor(s.sector, s.area),
      sector: s.sector as Sector | 'core',
      seed: s.id,
      area: s.area,
      noisy: !!s.noise,
    })),
  ];
  const cover = new Map<string, { hex: Hex; parts: { p: number; w: number }[] }>();
  places.forEach((p, pi) => {
    for (let dq = -p.r; dq <= p.r; dq++) {
      for (let dr = Math.max(-p.r, -dq - p.r); dr <= Math.min(p.r, -dq + p.r); dr++) {
        const hex = { q: p.c.q + dq, r: p.c.r + dr };
        const d = hexDistance(hex, p.c);
        // ragged edge: the outermost ring is only partly there
        if (d === p.r && p.r > 1 && hashString(`${p.seed}:${hexKey(hex)}`) % 100 < 38) continue;
        const k = hexKey(hex);
        const w = (1 - d / (p.r + 0.5)) ** 2 + 0.04;
        const e = cover.get(k) ?? { hex, parts: [] };
        e.parts.push({ p: pi, w });
        cover.set(k, e);
      }
    }
  });
  for (const [k, e] of cover) {
    e.parts.sort((x, y) => y.w - x.w);
    const lead = places[e.parts[0]!.p]!;
    let color = lead.color;
    let acc = e.parts[0]!.w;
    for (const part of e.parts.slice(1)) {
      acc += part.w;
      color = mix(color, places[part.p]!.color, part.w / acc);
    }
    const areas = e.parts.filter((x) => places[x.p]!.area).map((x) => ({ area: places[x.p]!.area!, w: x.w }));
    cells.set(k, {
      hex: e.hex,
      color,
      sector: lead.sector,
      areas,
      noisy: e.parts.some((x) => places[x.p]!.noisy),
      trace: false,
      flat: false,
    });
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
    let level = c.flat ? 0 : n < 80 ? 0 : n < 96 ? 1 : 2;
    if (k > 0.55) level = 0;
    else if (k > 0.3) level = Math.min(level, 1);
    levelOf.set(hexKey(c.hex), level);
    const lit = c.trace ? c.color : mix(c.color, '#FFFFFF', 0.05 * level);
    tiles.push({ x: w.x, y: w.y, level, color: lit });
  }
  tiles.sort((a, b) => a.y - b.y || a.x - b.x);

  // 4b. scenery: single tiles get a little 3D object that fits their topic. The circuit
  // board near the core stays bare; the further out, the more nature, stone and instruments.
  const props: Prop[] = [];
  for (const c of cells.values()) {
    if (c.trace || c.flat || c.noisy || !c.areas?.length) continue;
    const w = hexToWorld(c.hex);
    const chance = 0.22 * (1 - 0.8 * computerness(w.x, w.y));
    const h = hashString(`prop:${hexKey(c.hex)}`);
    if (h % 1000 >= chance * 1000) continue;
    const total = c.areas.reduce((t, x) => t + x.w, 0);
    let pick = (((h >>> 8) % 1000) / 1000) * total;
    let area = c.areas[0]!.area;
    for (const x of c.areas) {
      area = x.area;
      if ((pick -= x.w) <= 0) break;
    }
    props.push({ x: w.x, y: w.y, level: levelOf.get(hexKey(c.hex)) ?? 0, sprite: propSprite(area, (h >>> 5) % 2) });
  }
  props.sort((a, b) => a.y - b.y || a.x - b.x);

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

  // 7. the board around the chip: a few clean buses, one toward each topic, fading out
  const circuit: Circuit[] = [];
  const DIRS: { sector: Sector; dx: number; dy: number }[] = [
    { sector: 'science', dx: 0, dy: -1 },
    { sector: 'nature', dx: 1, dy: 0 },
    { sector: 'culture', dx: 0, dy: 1 },
    { sector: 'history', dx: -1, dy: 0 },
  ];
  for (const d of DIRS) {
    const px = -d.dy; // perpendicular
    const py = d.dx;
    const col = mix(colors.sector[d.sector], '#FFFFFF', 0.25);
    // pin offsets across the chip side, and a bend that spreads the lines apart
    const lanes = [-16, 0, 16];
    const at = (along: number, across: number): [number, number] => [
      d.dx * along + px * across,
      (d.dy * along + py * across) * SQUASH,
    ];
    const segs: [number, number][][] = [[], [], []];
    const ends: [number, number][] = [];
    for (const lane of lanes) {
      const pts: [number, number][] = [at(66, lane), at(125, lane), at(160, lane * 2), at(235, lane * 2)];
      for (let i = 0; i < 3; i++) segs[i]!.push(pts[i]!, pts[i + 1]!);
      ends.push(pts[3]!);
    }
    const opac = [0.8, 0.5, 0.25];
    for (let i = 0; i < 3; i++) {
      const bld = Skia.PathBuilder.Make();
      for (let j = 0; j < segs[i]!.length; j += 2) {
        bld.moveTo(segs[i]![j]![0], segs[i]![j]![1]);
        bld.lineTo(segs[i]![j + 1]![0], segs[i]![j + 1]![1]);
      }
      if (i === 2) for (const e of ends) bld.addCircle(e[0], e[1], 3);
      circuit.push({ color: col, opacity: opac[i]!, width: 2, path: bld.detach() });
    }
  }

  // 8. noise: the cells around disturbed places, in three independently blinking groups
  const noiseB = [Skia.PathBuilder.Make(), Skia.PathBuilder.Make(), Skia.PathBuilder.Make()];
  for (const site of sites) {
    if (!site.noise) continue;
    const c0 = worldToHex(site.x, site.y);
    for (const cell of cells.values()) {
      if (cell.trace || hexDistance(cell.hex, c0) > 1) continue;
      const w = hexToWorld(cell.hex);
      const g = hashString(`noise:${hexKey(cell.hex)}`) % 3;
      hexPoly(noiseB[g]!, w.x, w.y, LIFT[levelOf.get(hexKey(cell.hex)) ?? 0]!, HEX_R * 0.9);
    }
  }

  return { tiles, props, ghosts, traces, circuit, noise: noiseB.map((b) => b.detach()) };
}

export const ghostColor = (band: number) => `#6F93B8${BAND_ALPHA[band] ?? '00'}`;
