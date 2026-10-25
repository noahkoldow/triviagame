/**
 * Tilted map camera, oblique projection. The world is a plane viewed from
 * above at an angle: y is squashed by `SQUASH`, heights lift things upward.
 * All map geometry is built once in this "view space" (x, y·SQUASH − height),
 * so panning and zooming is only a 2D translate + scale, which is cheap.
 * Everything is a worklet so it can run on the UI thread.
 */
export const SQUASH = 0.62;
/** Fraction of the screen height where the camera centre sits. */
export const ANCHOR_Y = 0.55;
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 2.2;
/** The camera centre never leaves this radius. */
export const WORLD_LIMIT = 3600;

export function cameraTransform(cx: number, cy: number, s: number, w: number, h: number) {
  'worklet';
  return [
    { translateX: w / 2 - cx * s },
    { translateY: h * ANCHOR_Y - cy * SQUASH * s },
    { scale: s },
  ];
}

/** Screen position of the point `up` world units above the ground point (x, y). */
export function project(
  cx: number,
  cy: number,
  s: number,
  w: number,
  h: number,
  x: number,
  y: number,
  up = 0,
): { x: number; y: number } {
  'worklet';
  return {
    x: w / 2 + (x - cx) * s,
    y: h * ANCHOR_Y + (y * SQUASH - up - cy * SQUASH) * s,
  };
}

/** Screen-space drag → world-space camera delta. */
export function dragToWorld(dx: number, dy: number, s: number): { x: number; y: number } {
  'worklet';
  return { x: dx / s, y: dy / (s * SQUASH) };
}

export function clampCenter(x: number, y: number): { x: number; y: number } {
  'worklet';
  const d = Math.hypot(x, y);
  if (d <= WORLD_LIMIT) return { x, y };
  return { x: (x / d) * WORLD_LIMIT, y: (y / d) * WORLD_LIMIT };
}
