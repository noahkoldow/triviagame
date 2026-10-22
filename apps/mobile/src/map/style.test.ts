import { describe, expect, it } from 'vitest';
import { COMPUTER_RADIUS, computerness } from './style';

describe('computer look', () => {
  it('is full at the core and gone at the edge', () => {
    expect(computerness(0, 0)).toBe(1);
    expect(computerness(COMPUTER_RADIUS, 0)).toBe(0);
    expect(computerness(0, COMPUTER_RADIUS * 3)).toBe(0);
  });

  it('only ever thins out with distance', () => {
    let last = 1;
    for (let r = 0; r <= COMPUTER_RADIUS; r += 40) {
      const k = computerness(r, 0);
      expect(k).toBeLessThanOrEqual(last);
      last = k;
    }
  });

  it('does not depend on direction', () => {
    expect(computerness(300, 0)).toBeCloseTo(computerness(0, -300), 10);
  });
});
