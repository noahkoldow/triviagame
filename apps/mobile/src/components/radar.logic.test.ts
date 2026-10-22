import { describe, expect, it } from 'vitest';
import { axisAngle, labelPlace, polygonPoints, radarPoint, ringPoints } from './radar.logic';

describe('radar geometry', () => {
  it('puts the first axis straight up and walks clockwise', () => {
    const top = radarPoint(0, 4, 1, 100, 0, 0);
    expect(top.x).toBeCloseTo(0, 6);
    expect(top.y).toBeCloseTo(-100, 6);
    const right = radarPoint(1, 4, 1, 100, 0, 0);
    expect(right.x).toBeCloseTo(100, 6);
    expect(right.y).toBeCloseTo(0, 6);
    expect(axisAngle(2, 4)).toBeCloseTo(Math.PI / 2, 6);
  });

  it('scales with the value and clamps it', () => {
    expect(radarPoint(0, 4, 0.5, 100, 0, 0).y).toBeCloseTo(-50, 6);
    expect(radarPoint(0, 4, 3, 100, 0, 0).y).toBeCloseTo(-100, 6);
    expect(radarPoint(0, 4, -1, 100, 0, 0).y).toBeCloseTo(0, 6);
  });

  it('makes a polygon with one point per value', () => {
    expect(polygonPoints([1, 1, 1, 1], 10, 0, 0).split(' ')).toHaveLength(4);
    expect(ringPoints(0.5, 16, 100, 0, 0).split(' ')).toHaveLength(16);
  });

  it('anchors labels away from the chart', () => {
    expect(labelPlace(1, 4, 100, 0, 0).anchor).toBe('start'); // right
    expect(labelPlace(3, 4, 100, 0, 0).anchor).toBe('end'); // left
    expect(labelPlace(0, 4, 100, 0, 0).anchor).toBe('middle'); // top
    expect(labelPlace(0, 4, 100, 0, 0).y).toBeLessThan(-100);
  });
});
