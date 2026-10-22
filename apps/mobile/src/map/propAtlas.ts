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
import { colors, mix } from '../theme';

/**
 * Small low-poly objects for the hexagons (trees, crystals, columns, notes …),
 * one set per topic area. Every object is built from a few flat facets that
 * are lit from the upper left, which gives the plastic look. They are drawn
 * once into an image and then placed by the hundred in a single `<Atlas>` call.
 */
export interface PropAtlas {
  image: SkImage;
  rects: SkRect[];
  anchorX: number;
  anchorY: number;
}

const PW = 44;
const PH = 56;
const AX = PW / 2;
const AY = 46; // the object's base point inside a sprite
const COLS = 8;

/** Three sizes per area; the middle one is mirrored so neighbours do not look alike. */
const VARIANTS = [
  { k: 1.1, mirror: false },
  { k: 0.8, mirror: true },
  { k: 0.62, mirror: false },
];
export const PROP_VARIANTS = VARIANTS.length;
const BASE_SIZE = 17;

/** Sprite index of an area's object in one of its sizes. */
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

/** One flat facet. */
function facet(p: Pen, color: string, pts: Pt[]) {
  p.fill.setColor(Skia.Color(color));
  p.c.drawPath(polyPath(pts), p.fill);
}

/** Lighter (k > 0) or darker (k < 0) version of a colour: the light comes from the upper left. */
const tone = (c: string, k: number) => (k >= 0 ? mix(c, '#FFFFFF', k) : mix(c, '#000000', -k));

/** Soft contact shadow on the ground. */
function shadow(p: Pen, r: number) {
  p.fill.setColor(Skia.Color('#02060C66'));
  const pts: Pt[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    pts.push([Math.cos(a) * r, Math.sin(a) * r * 0.32]);
  }
  p.c.drawPath(polyPath(pts), p.fill);
}

/** A faceted dome / bipyramid: the building block of crowns, bushes, orbs and stones. */
function gem(p: Pen, c: string, cx: number, cy: number, rw: number, rh: number) {
  const T: Pt = [cx, cy + rh];
  const L: Pt = [cx - rw, cy];
  const R: Pt = [cx + rw, cy];
  const B: Pt = [cx, cy - rh * 0.7];
  const C: Pt = [cx + rw * 0.08, cy + rh * 0.12];
  facet(p, tone(c, 0.3), [T, L, C]);
  facet(p, c, [T, C, R]);
  facet(p, tone(c, -0.2), [L, B, C]);
  facet(p, tone(c, -0.42), [C, B, R]);
}

/** An upright box seen from above-front: light top, base front-left, dark right. */
function box(p: Pen, c: string, cx: number, vb: number, w: number, h: number, d: number) {
  facet(p, tone(c, -0.12), [[cx - w, vb + h], [cx, vb + h - d], [cx, vb - d], [cx - w, vb]]);
  facet(p, tone(c, -0.4), [[cx + w, vb + h], [cx, vb + h - d], [cx, vb - d], [cx + w, vb]]);
  facet(p, tone(c, 0.34), [[cx, vb + h + d], [cx + w, vb + h], [cx, vb + h - d], [cx - w, vb + h]]);
}

/** A prism with a lit left, a plain middle and a dark right facet. */
function prism(p: Pen, c: string, cx: number, v0: number, v1: number, w: number) {
  facet(p, tone(c, 0.28), [[cx - w, v0], [cx - w * 0.3, v0], [cx - w * 0.3, v1], [cx - w, v1]]);
  facet(p, c, [[cx - w * 0.3, v0], [cx + w * 0.3, v0], [cx + w * 0.3, v1], [cx - w * 0.3, v1]]);
  facet(p, tone(c, -0.38), [[cx + w * 0.3, v0], [cx + w, v0], [cx + w, v1], [cx + w * 0.3, v1]]);
}

const WOOD = '#8B5A2B';

type Draw = (p: Pen, s: number, base: string) => void;

const KINDS: Record<string, Draw> = {
  tree(p, s, base) {
    shadow(p, s * 0.55);
    prism(p, WOOD, 0, 0, s * 0.5, s * 0.09);
    gem(p, base, 0, s * 0.6, s * 0.52, s * 0.5);
    gem(p, base, 0, s * 1.0, s * 0.36, s * 0.42);
  },
  pine(p, s, base) {
    shadow(p, s * 0.5);
    prism(p, WOOD, 0, 0, s * 0.25, s * 0.07);
    for (let i = 0; i < 3; i++) {
      const w = s * (0.5 - i * 0.12);
      const v = s * (0.2 + i * 0.32);
      const apex: Pt = [0, v + s * 0.6];
      facet(p, tone(base, 0.3), [[-w, v], [0, v], apex]);
      facet(p, tone(base, -0.3), [[0, v], [w, v], apex]);
    }
  },
  bush(p, s, base) {
    shadow(p, s * 0.55);
    gem(p, base, -s * 0.12, s * 0.3, s * 0.4, s * 0.36);
    gem(p, base, s * 0.22, s * 0.26, s * 0.32, s * 0.3);
    facet(p, '#FF6B6B', [[s * 0.1, s * 0.52], [s * 0.18, s * 0.5], [s * 0.15, s * 0.6]]);
    facet(p, '#FFD166', [[-s * 0.3, s * 0.4], [-s * 0.22, s * 0.38], [-s * 0.26, s * 0.48]]);
  },
  rock(p, s, base) {
    const stone = mix(base, '#8793A0', 0.6);
    shadow(p, s * 0.62);
    const P: Pt = [s * 0.05, s * 1.1];
    const L: Pt = [-s * 0.6, 0];
    const R: Pt = [s * 0.6, 0];
    const M: Pt = [-s * 0.05, s * 0.42];
    const B: Pt = [0, 0];
    facet(p, tone(stone, 0.3), [P, L, M]);
    facet(p, stone, [P, M, R]);
    facet(p, tone(stone, -0.25), [L, M, B]);
    facet(p, tone(stone, -0.45), [M, R, B]);
    facet(p, '#FFFFFF', [[-s * 0.12, s * 0.78], [s * 0.2, s * 0.8], P]);
  },
  crystal(p, s, base) {
    shadow(p, s * 0.5);
    const spire = (cx: number, k: number) => {
      const T: Pt = [cx, s * 1.3 * k];
      const L: Pt = [cx - s * 0.3 * k, s * 0.3 * k];
      const R: Pt = [cx + s * 0.3 * k, s * 0.3 * k];
      const M: Pt = [cx + s * 0.02, s * 0.4 * k];
      const B: Pt = [cx, 0];
      facet(p, tone(base, 0.4), [T, L, M]);
      facet(p, base, [T, M, R]);
      facet(p, tone(base, -0.25), [L, B, M]);
      facet(p, tone(base, -0.45), [M, B, R]);
    };
    spire(s * 0.38, 0.6);
    spire(-s * 0.05, 1);
  },
  flask(p, s, base) {
    shadow(p, s * 0.5);
    const glassL = '#E8F4FA';
    const glassR = '#B7CFDD';
    facet(p, glassL, [[-s * 0.12, s * 0.5], [0, s * 0.5], [0, s * 1.05], [-s * 0.12, s * 1.05]]);
    facet(p, glassR, [[0, s * 0.5], [s * 0.12, s * 0.5], [s * 0.12, s * 1.05], [0, s * 1.05]]);
    facet(p, glassL, [[-s * 0.46, 0], [0, 0], [0, s * 0.52], [-s * 0.12, s * 0.52]]);
    facet(p, glassR, [[0, 0], [s * 0.46, 0], [s * 0.12, s * 0.52], [0, s * 0.52]]);
    facet(p, tone(base, 0.2), [[-s * 0.4, s * 0.02], [0, s * 0.02], [0, s * 0.3], [-s * 0.24, s * 0.3]]);
    facet(p, tone(base, -0.3), [[0, s * 0.02], [s * 0.4, s * 0.02], [s * 0.24, s * 0.3], [0, s * 0.3]]);
  },
  cube(p, s, base) {
    shadow(p, s * 0.6);
    box(p, base, 0, 0, s * 0.46, s * 0.62, s * 0.22);
    box(p, tone(base, 0.12), s * 0.05, s * 0.62 + s * 0.22, s * 0.2, s * 0.26, s * 0.1);
  },
  cross(p, s, base) {
    shadow(p, s * 0.5);
    prism(p, WOOD, 0, 0, s * 0.4, s * 0.06);
    prism(p, base, 0, s * 0.4, s * 1.2, s * 0.15);
    prism(p, base, 0, s * 0.68, s * 0.92, s * 0.42);
  },
  note(p, s, base) {
    shadow(p, s * 0.45);
    prism(p, base, s * 0.18, s * 0.18, s * 1.25, s * 0.07);
    facet(p, tone(base, -0.25), [[s * 0.25, s * 1.25], [s * 0.72, s * 0.9], [s * 0.25, s * 0.96]]);
    gem(p, tone(base, 0.1), 0, s * 0.18, s * 0.3, s * 0.2);
  },
  books(p, s, base) {
    shadow(p, s * 0.6);
    box(p, tone(base, -0.1), 0, 0, s * 0.5, s * 0.24, s * 0.2);
    box(p, base, -s * 0.04, s * 0.24 + s * 0.2, s * 0.42, s * 0.22, s * 0.18);
    box(p, tone(base, 0.2), s * 0.03, s * 0.46 + s * 0.38, s * 0.36, s * 0.2, s * 0.16);
  },
  splat(p, s) {
    shadow(p, s * 0.55);
    const pal = ['#FF86D0', '#FFC800', '#1CB0F6', '#58CC02'];
    gem(p, pal[0]!, -s * 0.3, s * 0.22, s * 0.26, s * 0.24);
    gem(p, pal[2]!, s * 0.32, s * 0.2, s * 0.24, s * 0.22);
    gem(p, pal[1]!, 0, s * 0.42, s * 0.28, s * 0.26);
    gem(p, pal[3]!, -s * 0.02, s * 0.14, s * 0.2, s * 0.16);
  },
  bubble(p, s, base) {
    shadow(p, s * 0.45);
    prism(p, WOOD, 0, 0, s * 0.45, s * 0.06);
    box(p, base, 0, s * 0.42, s * 0.52, s * 0.52, s * 0.14);
    for (let i = -1; i <= 1; i++) {
      facet(p, '#FFFFFF', [[i * s * 0.2 - s * 0.06, s * 0.62], [i * s * 0.2 + s * 0.06, s * 0.62], [i * s * 0.2, s * 0.74]]);
    }
  },
  column(p, s, base) {
    shadow(p, s * 0.55);
    const stone = mix(base, '#E8DCC0', 0.7);
    box(p, tone(stone, -0.05), 0, 0, s * 0.36, s * 0.12, s * 0.14);
    prism(p, stone, 0, s * 0.12, s * 1.0, s * 0.22);
    box(p, tone(stone, 0.1), 0, s * 1.0, s * 0.34, s * 0.14, s * 0.13);
  },
  coins(p, s, base) {
    shadow(p, s * 0.6);
    [-0.4, 0, 0.4].forEach((o, i) => {
      const cx = o * s;
      const h = s * (0.26 + i * 0.14);
      const w = s * 0.17;
      prism(p, base, cx, 0, h, w);
      facet(p, tone(base, 0.4), [[cx - w, h], [cx - w * 0.5, h + s * 0.07], [cx + w * 0.5, h + s * 0.07], [cx + w, h], [cx + w * 0.5, h - s * 0.05], [cx - w * 0.5, h - s * 0.05]]);
    });
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
    VARIANTS.forEach((v, vi) => {
      const idx = propSprite(area.id, vi);
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const base = colors.sector[sectorOfArea(area.id)];
      canvas.save();
      canvas.translate(col * PW + AX, row * PH + AY);
      if (v.mirror) canvas.scale(-1, 1);
      KINDS[KIND_OF_AREA[area.id] ?? 'bush']!(pen, BASE_SIZE * v.k, base);
      canvas.restore();
      rects[idx] = Skia.XYWHRect(col * PW, row * PH, PW, PH);
    });
  });
  surface.flush();
  return { image: surface.makeImageSnapshot(), rects, anchorX: AX, anchorY: AY };
}

/** Draws one area's object with the given pen (exported so it can be tested without a GPU). */
export function drawAreaProp(areaId: string, pen: Pen, size: number, base: string): void {
  KINDS[KIND_OF_AREA[areaId] ?? 'bush']!(pen, size, base);
}
