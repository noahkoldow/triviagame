import { describe, expect, it } from 'vitest';
import { WORLD, gridLines, gridStep, landPath, mapHeight, project, toleranceRadii, unproject } from './map.logic';

const NILE = { west: 20, south: 10, east: 45, north: 35 };

describe('drawn maps', () => {
  it('projects and back', () => {
    const p = project(NILE, 250, 250, 30, 31);
    expect(p.x).toBeCloseTo(110);
    expect(p.y).toBeCloseTo(50);
    const back = unproject(NILE, 250, 250, p.x, p.y);
    expect(back.lat).toBeCloseTo(30);
    expect(back.lon).toBeCloseTo(31);
  });

  it('keeps maps between half as high and as high as wide', () => {
    expect(mapHeight(WORLD, 300)).toBe(150);
    expect(mapHeight(NILE, 300)).toBe(300);
    expect(mapHeight({ west: 0, south: 0, east: 40, north: 30 }, 400)).toBe(300);
  });

  it('draws a grid of a few lines', () => {
    expect(gridStep(WORLD)).toBe(30);
    expect(gridStep(NILE)).toBe(5);
    const g = gridLines(NILE);
    expect(g.lats).toEqual([10, 15, 20, 25, 30, 35]);
    expect(g.lons[0]).toBe(20);
  });

  it('draws only the land near the region', () => {
    const africa = landPath(NILE, 250, 250);
    expect(africa.length).toBeGreaterThan(50);
    expect(landPath(WORLD, 300, 150).length).toBeGreaterThan(africa.length);
    // far from land only the big outlines whose box reaches there are left (the view clips them)
    expect(landPath({ west: -150, south: -50, east: -140, north: -40 }, 100, 100).length).toBeLessThan(africa.length);
  });

  it('widens the tolerance towards the poles', () => {
    const eq = toleranceRadii(WORLD, 360, 140, 0, 500);
    const north = toleranceRadii(WORLD, 360, 140, 60, 500);
    expect(north.rx).toBeGreaterThan(eq.rx * 1.9);
    expect(north.ry).toBeCloseTo(eq.ry);
  });
});
