import { describe, expect, it } from 'vitest';
import { WALL_RADIUS, hallsOf, zoneOf } from '@nexus/shared';
import { SQUASH, project } from './camera';
import { HALL_REACH, fitView, hallShapes } from './spotlight';

describe('spotlight on the halls', () => {
  it('outlines each hall of a sector between the firewall ring and the reach', () => {
    for (const sector of ['science', 'earth', 'humanities', 'society'] as const) {
      const halls = hallShapes(hallsOf(sector));
      expect(halls.map((h) => h.area)).toEqual(hallsOf(sector));
      for (const h of halls) {
        for (const p of h.points) {
          const r = Math.hypot(p.x, p.y / SQUASH);
          expect(r).toBeGreaterThan(WALL_RADIUS - 1);
          expect(r).toBeLessThan(HALL_REACH + 1);
        }
        // the name stands inside its own hall
        expect(zoneOf(h.label.x, h.label.y / SQUASH)).toBe(h.area);
      }
    }
  });

  it('fits the halls and the core into the band above the dialog', () => {
    const [w, h, top, bottom] = [390, 800, 60, 440];
    const halls = hallShapes(hallsOf('society'));
    const points = [...halls.flatMap((x) => x.points), { x: 0, y: 0 }];
    const cam = fitView(points, w, h, top, bottom);
    for (const p of points) {
      const sp = project(cam.cx, cam.cy, cam.s, w, h, p.x, p.y / SQUASH);
      expect(sp.x).toBeGreaterThanOrEqual(-0.5);
      expect(sp.x).toBeLessThanOrEqual(w + 0.5);
      expect(sp.y).toBeGreaterThanOrEqual(top - 0.5);
      expect(sp.y).toBeLessThanOrEqual(bottom + 0.5);
    }
  });
});
