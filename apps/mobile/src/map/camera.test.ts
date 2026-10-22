import { describe, expect, it, vi } from 'vitest';

// Matrix helpers are pure; load them without the native Skia module.
vi.mock('@shopify/react-native-skia', async () => {
  return await import('../../../../node_modules/@shopify/react-native-skia/src/skia/types/Matrix4');
});

import { ANCHOR_Y, clampCenter, projectBillboard, WORLD_LIMIT } from './camera';

const W = 400;
const H = 800;

describe('tilted camera', () => {
  it('puts the camera centre at the anchor point', () => {
    const p = projectBillboard(0, 0, 1, W, H, 0, 0, 0);
    expect(p.x).toBeCloseTo(W / 2, 3);
    expect(p.y).toBeCloseTo(H * ANCHOR_Y, 3);
  });

  it('draws far (negative y) places higher up and smaller steps than near ones', () => {
    const far = projectBillboard(0, 0, 1, W, H, 0, -400, 0);
    const near = projectBillboard(0, 0, 1, W, H, 0, 400, 0);
    expect(far.y).toBeLessThan(H * ANCHOR_Y);
    expect(near.y).toBeGreaterThan(H * ANCHOR_Y);
    // perspective: the same world distance covers fewer pixels in the distance
    expect(H * ANCHOR_Y - far.y).toBeLessThan(near.y - H * ANCHOR_Y);
  });

  it('lifts an upright orb above its base', () => {
    const base = projectBillboard(0, 0, 1, W, H, 0, 0, 0);
    const orb = projectBillboard(0, 0, 1, W, H, 0, 0, 40);
    expect(orb.y).toBeLessThan(base.y);
    expect(orb.x).toBeCloseTo(base.x, 3);
  });

  it('keeps the camera centre inside the world limit', () => {
    const c = clampCenter(9000, 0);
    expect(Math.hypot(c.x, c.y)).toBeCloseTo(WORLD_LIMIT, 3);
    expect(clampCenter(10, 20)).toEqual({ x: 10, y: 20 });
  });
});
