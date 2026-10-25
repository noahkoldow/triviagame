import { OUTER_ZONES, WALL_RADIUS } from '@nexus/shared';
import { ANCHOR_Y, SQUASH } from './camera';

/**
 * The spotlight on a guardian's halls (D71): while a guardian wakes, the map zooms out to the
 * two areas of its sector behind the firewall and outlines them, even where the fog still hides
 * them. Geometry only; it is drawn in `NetMap`.
 */

/** How far out the halls are outlined (world units). They reach much further, but the camera has to fit them. */
export const HALL_REACH = 1500;

/** One hall as the map draws it, in view space (y squashed like everything on the map). */
export interface Hall {
  area: string;
  /** The outline: along the firewall ring, then back along the outer edge. */
  points: { x: number; y: number }[];
  /** Where its name stands. */
  label: { x: number; y: number };
}

const ARC_STEPS = 16;

export function hallShapes(areas: string[], reach = HALL_REACH): Hall[] {
  return areas.flatMap((area) => {
    const z = OUTER_ZONES.find((o) => o.area === area);
    if (!z) return [];
    const at = (k: number, r: number) => {
      const a = z.from + ((z.to - z.from) * k) / ARC_STEPS;
      return { x: Math.cos(a) * r, y: Math.sin(a) * r * SQUASH };
    };
    const points = [
      ...Array.from({ length: ARC_STEPS + 1 }, (_, k) => at(k, WALL_RADIUS)),
      ...Array.from({ length: ARC_STEPS + 1 }, (_, k) => at(ARC_STEPS - k, reach)),
    ];
    return [{ area, points, label: at(ARC_STEPS / 2, (WALL_RADIUS + reach) / 2) }];
  });
}

/** The outline as an SVG path. */
export function hallPath(h: Hall): string {
  return h.points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
}

/**
 * The camera (centre in world units, zoom) that fits view-space `points` between the screen
 * rows `top` and `bottom` of a `w`×`h` map, keeping `margin` pixels free around them.
 */
export function fitView(
  points: { x: number; y: number }[],
  w: number,
  h: number,
  top: number,
  bottom: number,
  margin = 24,
): { cx: number; cy: number; s: number } {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const s = Math.min((w - 2 * margin) / Math.max(1, x1 - x0), (bottom - top - 2 * margin) / Math.max(1, y1 - y0));
  // the middle of the points lands in the middle of the band (see `cameraTransform`)
  const vy = (y0 + y1) / 2;
  return { cx: (x0 + x1) / 2, cy: (vy - ((top + bottom) / 2 - h * ANCHOR_Y) / s) / SQUASH, s };
}
