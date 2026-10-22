/**
 * Hexagon grid (pointy-top, axial coordinates). The map is built from small
 * hexagon tiles; node positions snap to the nearest cell.
 */
export const HEX_R = 24;
const SQ3 = Math.sqrt(3);

export interface Hex {
  q: number;
  r: number;
}

export const hexKey = (h: Hex) => `${h.q},${h.r}`;

export function hexToWorld(h: Hex): { x: number; y: number } {
  return { x: HEX_R * SQ3 * (h.q + h.r / 2), y: HEX_R * 1.5 * h.r };
}

function cubeRound(x: number, y: number, z: number): Hex {
  let rx = Math.round(x);
  let ry = Math.round(y);
  let rz = Math.round(z);
  const dx = Math.abs(rx - x);
  const dy = Math.abs(ry - y);
  const dz = Math.abs(rz - z);
  if (dx > dy && dx > dz) rx = -ry - rz;
  else if (dy > dz) ry = -rx - rz;
  else rz = -rx - ry;
  return { q: rx + 0, r: rz + 0 };
}

export function worldToHex(x: number, y: number): Hex {
  const q = ((SQ3 / 3) * x - y / 3) / HEX_R;
  const r = ((2 / 3) * y) / HEX_R;
  return cubeRound(q, -q - r, r);
}

export function hexDistance(a: Hex, b: Hex): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

const DIRS: Hex[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export function hexNeighbors(h: Hex): Hex[] {
  return DIRS.map((d) => ({ q: h.q + d.q, r: h.r + d.r }));
}

/** Cells on the straight line from a to b, both included. */
export function hexLine(a: Hex, b: Hex): Hex[] {
  const n = hexDistance(a, b);
  if (n === 0) return [a];
  const out: Hex[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    // nudge to avoid ties on cell borders
    const q = a.q + (b.q - a.q) * t + 1e-6;
    const r = a.r + (b.r - a.r) * t + 1e-6;
    out.push(cubeRound(q, -q - r, r));
  }
  return out;
}

export const snapToHex = (x: number, y: number) => hexToWorld(worldToHex(x, y));
