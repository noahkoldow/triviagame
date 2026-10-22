/** How far the computer look reaches from the core (world units). */
export const COMPUTER_RADIUS = 820;

/** 1 at the core, fading smoothly to 0 at COMPUTER_RADIUS and beyond. */
export function computerness(x: number, y: number): number {
  const t = Math.max(0, 1 - Math.hypot(x, y) / COMPUTER_RADIUS);
  return t * t * (3 - 2 * t);
}
