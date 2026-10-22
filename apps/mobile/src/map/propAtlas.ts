import {
  PaintStyle,
  Skia,
  type SkCanvas,
  type SkImage,
  type SkPaint,
  type SkPath,
  type SkRect,
} from '@shopify/react-native-skia';
import { AREAS, sectorOfArea } from '@nexus/shared';
import { colors, mix, shade } from '../theme';

/**
 * Small standing objects for the hexagons (trees, crystals, columns, notes …),
 * one set per topic area. They are drawn once into an image, with their own
 * light and shade, and then placed by the thousand in a single `<Atlas>` call.
 */
export interface PropAtlas {
  image: SkImage;
  rects: SkRect[];
  anchorX: number;
  anchorY: number;
}

const PW = 64;
const PH = 84;
const AX = PW / 2;
const AY = 70; // the object's base point inside a sprite
const COLS = 8;
export const PROP_VARIANTS = 2;

/** Sprite index of an area's object; variant 0 or 1 is a bit smaller and mirrored. */
export function propSprite(areaId: string, variant: number): number {
  const i = AREAS.findIndex((a) => a.id === areaId);
  return (i < 0 ? 0 : i) * PROP_VARIANTS + (variant % PROP_VARIANTS);
}

export interface Pen {
  c: SkCanvas;
  fill: SkPaint;
}

type Pt = [number, number];

/** Upright polygon: u to the right, v up from the base point. */
function polyPath(pts: Pt[]): SkPath {
  const b = Skia.PathBuilder.Make();
  pts.forEach(([u, v], i) => (i === 0 ? b.moveTo(u, -v) : b.lineTo(u, -v)));
  b.close();
  return b.detach();
}

function poly(p: Pen, color: string, pts: Pt[]) {
  p.fill.setColor(Skia.Color(color));
  p.c.drawPath(polyPath(pts), p.fill);
}

function ell(p: Pen, color: string, cu: number, cv: number, ru: number, rv: number) {
  const pts: Pt[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    pts.push([cu + Math.cos(a) * ru, cv + Math.sin(a) * rv]);
  }
  poly(p, color, pts);
}

const rect = (p: Pen, color: string, u0: number, v0: number, u1: number, v1: number) =>
  poly(p, color, [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);

/** Soft contact shadow on the ground (flat, so squashed). */
function shadow(p: Pen, r: number) {
  p.fill.setColor(Skia.Color('#02060C66'));
  const pts: Pt[] = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    pts.push([Math.cos(a) * r, Math.sin(a) * r * 0.5 * 0.62 * 1.6]);
  }
  p.c.drawPath(polyPath(pts), p.fill);
}

const light = (c: string) => mix(c, '#FFFFFF', 0.4);
const dark = (c: string) => shade(c, 0.34);
const WOOD = '#8B5A2B';

type Draw = (p: Pen, s: number, base: string) => void;

const KINDS: Record<string, Draw> = {
  tree(p, s, base) {
    shadow(p, s * 0.5);
    rect(p, WOOD, -s * 0.08, 0, s * 0.08, s * 0.5);
    ell(p, dark(base), 0, s * 0.8, s * 0.46, s * 0.42);
    ell(p, base, -s * 0.05, s * 0.86, s * 0.38, s * 0.35);
    ell(p, light(base), -s * 0.14, s * 0.95, s * 0.2, s * 0.17);
  },
  pine(p, s, base) {
    shadow(p, s * 0.42);
    rect(p, WOOD, -s * 0.06, 0, s * 0.06, s * 0.25);
    for (let i = 0; i < 3; i++) {
      const w = s * (0.46 - i * 0.1);
      const v = s * (0.2 + i * 0.3);
      poly(p, dark(base), [[-w, v], [w, v], [0, v + s * 0.55]]);
      poly(p, base, [[-w, v], [0, v], [0, v + s * 0.55]]);
    }
  },
  bush(p, s, base) {
    shadow(p, s * 0.5);
    ell(p, dark(base), 0, s * 0.25, s * 0.5, s * 0.3);
    ell(p, base, -s * 0.08, s * 0.34, s * 0.34, s * 0.24);
    ell(p, '#FF6B6B', s * 0.2, s * 0.4, s * 0.07, s * 0.06);
    ell(p, '#FFD166', -s * 0.2, s * 0.3, s * 0.06, s * 0.05);
  },
  rock(p, s, base) {
    const stone = mix(base, '#8793A0', 0.6);
    shadow(p, s * 0.6);
    poly(p, dark(stone), [[-s * 0.6, 0], [s * 0.6, 0], [0, s * 1.1]]);
    poly(p, light(stone), [[-s * 0.6, 0], [0, 0], [0, s * 1.1]]);
    poly(p, '#FFFFFF', [[-s * 0.18, s * 0.8], [s * 0.18, s * 0.8], [0, s * 1.1]]);
  },
  crystal(p, s, base) {
    shadow(p, s * 0.45);
    const w = s * 0.34;
    poly(p, dark(base), [[-w, s * 0.28], [0, 0], [0, s * 1.3]]);
    poly(p, light(base), [[0, 0], [w, s * 0.28], [0, s * 1.3]]);
    poly(p, '#FFFFFF', [[-w * 0.55, s * 0.6], [-w * 0.2, s * 0.52], [-w * 0.32, s * 0.95]]);
    // a smaller one beside it
    poly(p, base, [[w * 1.1, 0], [w * 1.9, s * 0.2], [w * 1.3, s * 0.75], [w * 0.9, s * 0.22]]);
  },
  flask(p, s, base) {
    shadow(p, s * 0.42);
    rect(p, '#DDEBF2', -s * 0.11, s * 0.5, s * 0.11, s * 1.05);
    poly(p, '#DDEBF2', [[-s * 0.42, 0], [s * 0.42, 0], [s * 0.11, s * 0.55], [-s * 0.11, s * 0.55]]);
    poly(p, light(base), [[-s * 0.36, s * 0.03], [s * 0.36, s * 0.03], [s * 0.23, s * 0.32], [-s * 0.23, s * 0.32]]);
    ell(p, '#FFFFFF', -s * 0.05, s * 0.2, s * 0.05, s * 0.04);
  },
  cube(p, s, base) {
    shadow(p, s * 0.55);
    const w = s * 0.44;
    const d = s * 0.2;
    const h = s * 0.7;
    poly(p, dark(base), [[-w, h], [0, h - d], [0, -d], [-w, 0]]);
    poly(p, base, [[w, h], [0, h - d], [0, -d], [w, 0]]);
    poly(p, light(base), [[0, h + d], [w, h], [0, h - d], [-w, h]]);
  },
  cross(p, s, base) {
    shadow(p, s * 0.42);
    rect(p, WOOD, -s * 0.05, 0, s * 0.05, s * 0.4);
    rect(p, dark(base), -s * 0.14, s * 0.4, s * 0.14, s * 1.15);
    rect(p, dark(base), -s * 0.4, s * 0.68, s * 0.4, s * 0.9);
    rect(p, light(base), -s * 0.11, s * 0.44, s * 0.11, s * 1.11);
    rect(p, light(base), -s * 0.36, s * 0.71, s * 0.36, s * 0.87);
  },
  note(p, s, base) {
    shadow(p, s * 0.42);
    rect(p, dark(base), s * 0.12, s * 0.15, s * 0.24, s * 1.2);
    poly(p, dark(base), [[s * 0.24, s * 1.2], [s * 0.68, s * 0.88], [s * 0.24, s * 0.94]]);
    ell(p, light(base), 0, s * 0.18, s * 0.28, s * 0.18);
    ell(p, '#FFFFFF', -s * 0.1, s * 0.22, s * 0.07, s * 0.05);
  },
  books(p, s, base) {
    shadow(p, s * 0.55);
    rect(p, dark(base), -s * 0.5, 0, s * 0.5, s * 0.28);
    rect(p, base, -s * 0.42, s * 0.28, s * 0.44, s * 0.54);
    rect(p, light(base), -s * 0.46, s * 0.54, s * 0.38, s * 0.78);
    rect(p, '#FFFFFF', -s * 0.5, s * 0.1, -s * 0.42, s * 0.18);
  },
  splat(p, s) {
    shadow(p, s * 0.42);
    rect(p, WOOD, -s * 0.04, 0, s * 0.04, s * 0.22);
    const pal = ['#FF86D0', '#FFC800', '#1CB0F6', '#58CC02'];
    pal.forEach((c, i) => {
      const a = (i / 4) * Math.PI * 2 + 0.6;
      ell(p, c, Math.cos(a) * s * 0.3, s * 0.45 + Math.sin(a) * s * 0.22, s * 0.22, s * 0.19);
    });
  },
  bubble(p, s, base) {
    shadow(p, s * 0.38);
    rect(p, WOOD, -s * 0.05, 0, s * 0.05, s * 0.45);
    rect(p, dark(base), -s * 0.55, s * 0.4, s * 0.55, s * 1.1);
    rect(p, light(base), -s * 0.5, s * 0.46, s * 0.5, s * 1.1);
    for (let i = -1; i <= 1; i++) ell(p, '#FFFFFF', i * s * 0.26, s * 0.78, s * 0.07, s * 0.06);
  },
  column(p, s, base) {
    shadow(p, s * 0.5);
    const stone = mix(base, '#E8DCC0', 0.7);
    rect(p, dark(stone), -s * 0.36, 0, s * 0.36, s * 0.13);
    rect(p, stone, -s * 0.22, s * 0.13, s * 0.22, s * 1.0);
    rect(p, dark(stone), 0, s * 0.13, s * 0.22, s * 1.0);
    rect(p, light(stone), -s * 0.34, s * 1.0, s * 0.34, s * 1.17);
  },
  coins(p, s, base) {
    shadow(p, s * 0.55);
    for (let i = 0; i < 3; i++) {
      const u = (i - 1) * s * 0.36;
      const h = s * (0.26 + i * 0.14);
      rect(p, dark(base), u - s * 0.16, 0, u + s * 0.16, h);
      ell(p, light(base), u, h, s * 0.16, s * 0.08);
    }
  },
};

const KIND_OF_AREA: Record<string, keyof typeof KINDS> = {
  physics: 'crystal',
  chemistry: 'flask',
  computing: 'cube',
  medicine: 'cross',
  biology: 'tree',
  geography: 'rock',
  climate: 'pine',
  animals: 'bush',
  music: 'note',
  literature: 'books',
  art: 'splat',
  language: 'bubble',
  antiquity: 'column',
  modern: 'cube',
  politics: 'column',
  economy: 'coins',
};

export function makePropAtlas(): PropAtlas | null {
  const count = AREAS.length * PROP_VARIANTS;
  const rows = Math.ceil(count / COLS);
  const surface = Skia.Surface.Make(COLS * PW, rows * PH);
  if (!surface) return null;
  const canvas = surface.getCanvas();
  const fill = Skia.Paint();
  fill.setAntiAlias(true);
  fill.setStyle(PaintStyle.Fill);
  const pen: Pen = { c: canvas, fill };

  const rects: SkRect[] = [];
  AREAS.forEach((area) => {
    for (let v = 0; v < PROP_VARIANTS; v++) {
      const idx = propSprite(area.id, v);
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const base = colors.sector[sectorOfArea(area.id)];
      canvas.save();
      canvas.translate(col * PW + AX, row * PH + AY);
      if (v === 1) canvas.scale(-0.82, 0.82); // a smaller, mirrored variant
      KINDS[KIND_OF_AREA[area.id] ?? 'bush']!(pen, 28, base);
      canvas.restore();
      rects[idx] = Skia.XYWHRect(col * PW, row * PH, PW, PH);
    }
  });
  surface.flush();
  return { image: surface.makeImageSnapshot(), rects, anchorX: AX, anchorY: AY };
}

/** Draws one area's object with the given pen (exported so it can be tested without a GPU). */
export function drawAreaProp(areaId: string, pen: Pen, size: number, base: string): void {
  KINDS[KIND_OF_AREA[areaId] ?? 'bush']!(pen, size, base);
}
