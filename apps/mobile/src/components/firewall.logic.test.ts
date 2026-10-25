import { describe, expect, it } from 'vitest';
import { brickFall, hexPath, wallLayout } from './firewall.logic';

describe('firewall layout', () => {
  it('fills the width with layers of bricks, bottom layer lowest', () => {
    const w = wallLayout(340, 4);
    expect(w.bricks).toHaveLength(4 * 8);
    expect(w.rowY).toHaveLength(4);
    for (let k = 1; k < 4; k++) expect(w.rowY[k]!).toBeLessThan(w.rowY[k - 1]!);
    // no brick sticks out further than half a brick
    const half = (Math.sqrt(3) * w.r) / 2;
    for (const b of w.bricks) {
      expect(b.x - half).toBeGreaterThanOrEqual(-0.01);
      expect(b.x + half).toBeLessThanOrEqual(340.01);
    }
    // morph.ai stands above the top layer, Bolt below the bottom one
    expect(w.morph.y + w.morph.size / 2).toBeLessThan(w.rowY[3]! - w.r);
    expect(w.bolt.y).toBeGreaterThan(w.rowY[0]! + w.r);
    expect(w.bolt.y + w.bolt.size / 2).toBeLessThanOrEqual(w.height + 1);
    // the guardian stands beside Bolt, on the other side, inside the scene
    expect(w.guardian.y).toBe(w.bolt.y);
    expect(w.guardian.x - w.guardian.size / 2).toBeGreaterThan(w.bolt.x + w.bolt.size / 2);
    expect(w.guardian.x + w.guardian.size / 2).toBeLessThanOrEqual(340);
  });

  it('falls the same way for the same seed', () => {
    expect(wallLayout(300, 4, 8, 'a')).toEqual(wallLayout(300, 4, 8, 'a'));
    expect(wallLayout(300, 4, 8, 'a').bricks[0]).not.toEqual(wallLayout(300, 4, 8, 'b').bricks[0]);
  });

  it('starts late bricks later and ends them all together', () => {
    expect(brickFall(0, 0.3)).toBe(0);
    expect(brickFall(0.2, 0.3)).toBe(0);
    expect(brickFall(0.65, 0.3)).toBeCloseTo(0.5);
    expect(brickFall(1, 0.3)).toBe(1);
  });

  it('draws a closed hexagon', () => {
    const d = hexPath(10, 10, 5);
    expect(d.startsWith('M 10.0 5.0')).toBe(true);
    expect(d.match(/L/g)).toHaveLength(5);
    expect(d.endsWith('Z')).toBe(true);
  });
});
