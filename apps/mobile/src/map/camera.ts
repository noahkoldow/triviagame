import {
  mapPoint3d,
  multiply4,
  processTransform3d,
  scale as scale4,
  type Matrix4,
} from '@shopify/react-native-skia';

/**
 * Tilted map camera. The world is a plane; it is scaled, tilted back by TILT
 * and viewed with perspective, so far regions shrink toward the horizon.
 * Everything is a worklet so it can run on the UI thread and in gesture code.
 */
export const TILT = 0.88; // rad, ~50°
export const PERSPECTIVE = 3000;
/** Fraction of the screen height where the camera centre sits. */
export const ANCHOR_Y = 0.64;
export const MIN_ZOOM = 0.45;
export const MAX_ZOOM = 1.5;
/** The camera centre never leaves this radius (keeps all geometry in front of the camera). */
export const WORLD_LIMIT = 2500;

export function cameraMatrix(
  cx: number,
  cy: number,
  s: number,
  w: number,
  h: number,
  lift = 0,
): Matrix4 {
  'worklet';
  return processTransform3d([
    { translateX: w / 2 },
    { translateY: h * ANCHOR_Y },
    { perspective: PERSPECTIVE },
    { rotateX: TILT },
    { matrix: scale4(s, s, s) },
    { translateX: -cx },
    { translateY: -cy },
    { translateZ: lift },
  ]);
}

/** Screen position of a billboard standing `up` world units above ground point (x, y). */
export function projectBillboard(
  cx: number,
  cy: number,
  s: number,
  w: number,
  h: number,
  x: number,
  y: number,
  up: number,
): { x: number; y: number } {
  'worklet';
  const m = multiply4(
    cameraMatrix(cx, cy, s, w, h),
    processTransform3d([{ translateX: x }, { translateY: y }, { rotateX: -TILT }, { translateY: -up }]),
  );
  const p = mapPoint3d(m, [0, 0, 0]);
  return { x: p[0], y: p[1] };
}

/** Screen-space drag → world-space camera delta (approximation at the screen centre). */
export function dragToWorld(dx: number, dy: number, s: number): { x: number; y: number } {
  'worklet';
  return { x: dx / s, y: dy / (s * Math.cos(TILT)) };
}

export function clampCenter(x: number, y: number): { x: number; y: number } {
  'worklet';
  const d = Math.hypot(x, y);
  if (d <= WORLD_LIMIT) return { x, y };
  return { x: (x / d) * WORLD_LIMIT, y: (y / d) * WORLD_LIMIT };
}
