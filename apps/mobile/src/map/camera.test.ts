import { describe, expect, it } from 'vitest';
import { ANCHOR_Y, SQUASH, WORLD_LIMIT, clampCenter, dragToWorld, project } from './camera';

const W = 400;
const H = 800;

describe('tilted camera', () => {
  it('puts the camera centre at the anchor point', () => {
    const p = project(0, 0, 1, W, H, 0, 0);
    expect(p.x).toBeCloseTo(W / 2, 6);
    expect(p.y).toBeCloseTo(H * ANCHOR_Y, 6);
  });

  it('draws places farther away (negative y) higher on the screen', () => {
    const far = project(0, 0, 1, W, H, 0, -400);
    const near = project(0, 0, 1, W, H, 0, 400);
    expect(far.y).toBeLessThan(H * ANCHOR_Y);
    expect(near.y).toBeGreaterThan(H * ANCHOR_Y);
  });

  it('squashes the depth axis but not the width', () => {
    const a = project(0, 0, 1, W, H, 100, 0);
    const b = project(0, 0, 1, W, H, 0, 100);
    expect(a.x - W / 2).toBeCloseTo(100, 6);
    expect(b.y - H * ANCHOR_Y).toBeCloseTo(100 * SQUASH, 6);
  });

  it('lifts raised things upward only', () => {
    const base = project(0, 0, 1, W, H, 50, 50, 0);
    const top = project(0, 0, 1, W, H, 50, 50, 30);
    expect(top.x).toBeCloseTo(base.x, 6);
    expect(base.y - top.y).toBeCloseTo(30, 6);
  });

  it('turns a drag into the opposite camera move', () => {
    const d = dragToWorld(60, 60, 2);
    expect(d.x).toBeCloseTo(30, 6);
    expect(d.y).toBeCloseTo(30 / SQUASH, 6);
  });

  it('keeps the camera centre inside the world limit', () => {
    const c = clampCenter(9000, 0);
    expect(Math.hypot(c.x, c.y)).toBeCloseTo(WORLD_LIMIT, 3);
    expect(clampCenter(10, 20)).toEqual({ x: 10, y: 20 });
  });
});
