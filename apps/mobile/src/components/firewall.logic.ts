import { seededRng } from '@nexus/shared';

/** Layout of the firewall in a fight; pure, so it can be tested. */

export interface Brick {
  /** Layer, 0 at the bottom. A layer is one life of the wall. */
  row: number;
  x: number;
  y: number;
  /** Where the brick flies when its layer falls: sideways (-1..1), spin (-1..1), and how late it starts (0..0.35). */
  dx: number;
  spin: number;
  delay: number;
}

export interface WallLayout {
  bricks: Brick[];
  /** Radius of a (pointy-top) hexagon brick. */
  r: number;
  /** Centre line of every layer, bottom first. */
  rowY: number[];
  height: number;
  /** Where morph.ai stands on top of the wall, and where Bolt fires from. */
  morph: { x: number; y: number; size: number };
  bolt: { x: number; y: number; size: number };
}

const SQRT3 = Math.sqrt(3);
/** Room above the wall for morph.ai and below it for Bolt. */
const TOP = 74;
const BOTTOM = 62;

/**
 * A honeycomb wall of `rows` layers across `width`: every other layer is shifted by half a
 * brick, like the walls on the map. Deterministic for a seed, so a wall falls the same way twice.
 */
export function wallLayout(width: number, rows: number, cols = 8, seed = 'wall'): WallLayout {
  const r = width / ((cols + 0.5) * SQRT3);
  const w = SQRT3 * r;
  const wallH = (rows - 1) * 1.5 * r + 2 * r;
  const height = Math.round(TOP + wallH + BOTTOM);
  const base = TOP + wallH - r;
  const rowY = Array.from({ length: rows }, (_, k) => base - k * 1.5 * r);
  const rng = seededRng(seed);
  const bricks: Brick[] = [];
  for (let row = 0; row < rows; row++) {
    const shift = row % 2 === 1 ? w / 2 : 0;
    for (let c = 0; c < cols; c++) {
      bricks.push({
        row,
        x: w / 2 + c * w + shift,
        y: rowY[row]!,
        dx: rng() * 2 - 1,
        spin: rng() * 2 - 1,
        delay: rng() * 0.35,
      });
    }
  }
  const size = 64;
  return {
    bricks,
    r,
    rowY,
    height,
    morph: { x: width / 2, y: TOP - size / 2 - 6, size },
    bolt: { x: 34, y: height - BOTTOM / 2, size: 48 },
  };
}

/** The corners of a pointy-top hexagon as an SVG path. */
export function hexPath(x: number, y: number, r: number): string {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${(x + Math.cos(a) * r).toFixed(1)} ${(y + Math.sin(a) * r).toFixed(1)}`;
  });
  return `M ${pts.join(' L ')} Z`;
}

/** How far a brick has fallen (0..1) when its layer is `down` (0..1) fallen: late bricks start later. */
export function brickFall(down: number, delay: number): number {
  'worklet';
  return Math.min(1, Math.max(0, (down - delay) / (1 - delay)));
}
