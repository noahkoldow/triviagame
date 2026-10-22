import {
  SECTORS,
  SECTOR_ANGLE,
  areasOfSector,
  gaussian,
  seededRng,
  sectorOfArea,
  type Sector,
} from '@nexus/shared';

/**
 * A place on the map that gets land: every question node, plus the preview
 * strand. The area of its question decides the colour of the land around it.
 */
export interface Site {
  id: string;
  x: number;
  y: number;
  area: string;
  sector: Sector;
  state: 'open' | 'solved' | 'damaged' | 'locked' | 'preview';
}

/** Tints within a sector so neighbouring areas still look different. */
export function areaTint(area: string): number {
  const list = areasOfSector(sectorOfArea(area));
  return list.findIndex((a) => a.id === area) / Math.max(1, list.length - 1);
}

// ---------------------------------------------------------------------------
// Preview strand: a long chain far out from the core so the change of the
// land colour (nature → culture) can be seen on one path.

function nearestSector(angle: number): Sector {
  let best: Sector = 'nature';
  let bd = Infinity;
  for (const s of SECTORS) {
    let d = angle - SECTOR_ANGLE[s];
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    if (Math.abs(d) < bd) {
      bd = Math.abs(d);
      best = s;
    }
  }
  return best;
}

export function buildStrand(count = 16, seed = 'nexus-strand'): Site[] {
  const rng = seededRng(seed);
  const sites: Site[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const angle = 0.62 + t * 0.9 + gaussian(rng) * 0.04; // nature → culture
    const r = 360 + t * 1900 + gaussian(rng) * 18;
    const sector = nearestSector(angle);
    const areas = areasOfSector(sector);
    const area = areas[(i + Math.floor(rng() * 2)) % areas.length]!.id;
    sites.push({
      id: `strand${i}`,
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
      area,
      sector,
      state: 'preview',
    });
  }
  return sites;
}
