/** Geometry of the radar (net) chart; pure, so it can be tested. */

/** Angle of axis `i` of `n`; axis 0 points straight up, the rest go clockwise. */
export function axisAngle(i: number, n: number): number {
  return -Math.PI / 2 + (i / n) * Math.PI * 2;
}

export function radarPoint(
  i: number,
  n: number,
  value: number,
  radius: number,
  cx: number,
  cy: number,
): { x: number; y: number } {
  const a = axisAngle(i, n);
  const v = Math.max(0, Math.min(1, value));
  return { x: cx + Math.cos(a) * radius * v, y: cy + Math.sin(a) * radius * v };
}

/** The points of a polygon for an SVG `points` attribute. */
export function polygonPoints(values: number[], radius: number, cx: number, cy: number): string {
  return values
    .map((v, i) => radarPoint(i, values.length, v, radius, cx, cy))
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');
}

/** A ring of the grid at a level between 0 and 1. */
export function ringPoints(level: number, n: number, radius: number, cx: number, cy: number): string {
  return polygonPoints(Array.from({ length: n }, () => level), radius, cx, cy);
}

/** Where a label goes and how it is anchored, so labels never run into the chart. */
export function labelPlace(
  i: number,
  n: number,
  radius: number,
  cx: number,
  cy: number,
  gap = 10,
): { x: number; y: number; anchor: 'start' | 'middle' | 'end' } {
  const a = axisAngle(i, n);
  const x = cx + Math.cos(a) * (radius + gap);
  const y = cy + Math.sin(a) * (radius + gap) + 3;
  const c = Math.cos(a);
  return { x, y, anchor: Math.abs(c) < 0.25 ? 'middle' : c > 0 ? 'start' : 'end' };
}
