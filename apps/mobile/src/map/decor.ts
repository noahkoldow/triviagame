import { Skia, type SkPath, type SkPathBuilder } from '@shopify/react-native-skia';
import { SECTORS, SECTOR_ANGLE, gaussian, seededRng, type Sector } from '@nexus/shared';

export interface Decor {
  /** Circuit traces and pads: dominant near the core. */
  circuit: SkPath;
  pads: SkPath;
  /** Per-sector motifs: molecules, leaves, stones, notes. They take over further out. */
  motifs: Record<Sector, { stroke: SkPath; fill: SkPath }>;
}

function angDiff(a: number, b: number): number {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return Math.abs(d);
}

function sectorAt(th: number, noise: number): Sector {
  const t = th + noise;
  let best: Sector = 'science';
  let bd = Infinity;
  for (const s of SECTORS) {
    const d = angDiff(t, SECTOR_ANGLE[s]);
    if (d < bd) {
      bd = d;
      best = s;
    }
  }
  return best;
}

/**
 * Procedural scenery. The further from the core, the less it looks like a
 * circuit board; the sector decides what grows there. Borders are fuzzy
 * because the sector choice is perturbed with noise.
 */
export function buildDecor(count = 650, seed = 'nexus-decor'): Decor {
  const rng = seededRng(seed);
  const circuit = Skia.PathBuilder.Make();
  const pads = Skia.PathBuilder.Make();
  const motifs = Object.fromEntries(
    SECTORS.map((s) => [s, { stroke: Skia.PathBuilder.Make(), fill: Skia.PathBuilder.Make() }]),
  ) as Record<Sector, { stroke: SkPathBuilder; fill: SkPathBuilder }>;

  for (let i = 0; i < count; i++) {
    const th = rng() * Math.PI * 2 - Math.PI;
    const r = 120 + Math.sqrt(rng()) * 1250;
    const x = Math.cos(th) * r;
    const y = Math.sin(th) * r;
    const e = Math.min(1, Math.max(0, (r - 160) / 800));

    if (rng() > Math.pow(e, 0.9)) {
      if (r > 950) continue;
      const gx = Math.round(x / 16) * 16;
      const gy = Math.round(y / 16) * 16;
      const l1 = 16 * (1 + Math.floor(rng() * 4));
      const l2 = 16 * (1 + Math.floor(rng() * 3));
      const dirX = rng() < 0.5 ? -1 : 1;
      const dirY = rng() < 0.5 ? -1 : 1;
      circuit.moveTo(gx, gy);
      circuit.lineTo(gx + dirX * l1, gy);
      circuit.lineTo(gx + dirX * l1, gy + dirY * l2);
      pads.addCircle(gx + dirX * l1, gy + dirY * l2, 2.6);
      continue;
    }

    const sector = sectorAt(th, gaussian(rng) * 0.3);
    const m = motifs[sector];
    const s = 10 + rng() * 26;
    const a = rng() * Math.PI * 2;
    switch (sector) {
      case 'science': {
        m.fill.addCircle(x, y, 3.5);
        const arms = 2 + Math.floor(rng() * 2);
        for (let k = 0; k < arms; k++) {
          const ka = a + (k * 2 * Math.PI) / arms + rng() * 0.5;
          const px = x + Math.cos(ka) * s;
          const py = y + Math.sin(ka) * s;
          m.stroke.moveTo(x, y);
          m.stroke.lineTo(px, py);
          m.fill.addCircle(px, py, 2.4 + rng() * 1.6);
        }
        break;
      }
      case 'nature': {
        const tx = x + Math.cos(a) * s;
        const ty = y + Math.sin(a) * s;
        const nx = -Math.sin(a) * s * 0.36;
        const ny = Math.cos(a) * s * 0.36;
        const mx = (x + tx) / 2;
        const my = (y + ty) / 2;
        m.stroke.moveTo(x, y);
        m.stroke.quadTo(mx + nx, my + ny, tx, ty);
        m.stroke.quadTo(mx - nx, my - ny, x, y);
        m.stroke.moveTo(x, y);
        m.stroke.lineTo(tx, ty);
        break;
      }
      case 'history': {
        const w = s * 0.7;
        const h = s * 0.4;
        const c = Math.cos(a);
        const sn = Math.sin(a);
        const pts: [number, number][] = [
          [-w, -h],
          [w, -h],
          [w, h],
          [-w, h],
        ];
        pts.forEach(([px, py], k) => {
          const rx = x + px * c - py * sn;
          const ry = y + px * sn + py * c;
          if (k === 0) m.stroke.moveTo(rx, ry);
          else m.stroke.lineTo(rx, ry);
        });
        m.stroke.close();
        m.fill.addCircle(x + rng() * s, y + rng() * s, 1.3);
        break;
      }
      case 'culture': {
        if (rng() < 0.55) {
          m.fill.addCircle(x, y, 3.4);
          m.stroke.moveTo(x + 3.2, y);
          m.stroke.lineTo(x + 3.2, y - s);
          m.stroke.quadTo(x + 3.2 + s * 0.4, y - s * 0.8, x + 3.2 + s * 0.3, y - s * 0.5);
        } else {
          let px = x;
          let py = y;
          m.stroke.moveTo(px, py);
          for (let k = 1; k <= 12; k++) {
            const ang = a + k * 0.6;
            const rr = (k / 12) * s;
            px = x + Math.cos(ang) * rr;
            py = y + Math.sin(ang) * rr;
            m.stroke.lineTo(px, py);
          }
        }
        break;
      }
    }
  }
  return {
    circuit: circuit.detach(),
    pads: pads.detach(),
    motifs: Object.fromEntries(
      SECTORS.map((s) => [s, { stroke: motifs[s].stroke.detach(), fill: motifs[s].fill.detach() }]),
    ) as Decor['motifs'],
  };
}
