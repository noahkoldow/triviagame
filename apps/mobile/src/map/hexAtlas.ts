import {
  PaintStyle,
  Skia,
  type SkImage,
  type SkPath,
  type SkRect,
  type SkSurface,
} from '@shopify/react-native-skia';
import { HEX_R } from '@nexus/shared';
import { SQUASH } from './camera';

/**
 * One small image holding the hexagon sprites; the map draws all tiles from it
 * in a single call (`<Atlas>`). The sprites are white and grey, so tinting them
 * with a tile colour (modulate) gives the top face, the lit side and the dark
 * side automatically.
 */
export const LEVELS = 3;
/** How far a tile of each level is raised above the flat ones (world units). */
export const LIFT = [0, 7, 14];
const WALL = [8, 15, 22];

const CELL_W = 48;
const CELL_H = 64;
const AX = CELL_W / 2; // anchor: centre of the top face inside a sprite
const AY = 2 + HEX_R * SQUASH;
const W = (Math.sqrt(3) / 2) * HEX_R;

export interface HexAtlas {
  image: SkImage;
  /** One rect per level, then the outline sprite. */
  rects: SkRect[];
  anchorX: number;
  anchorY: number;
}

/** Corner i of a pointy-top hexagon in view space, relative to its centre. */
const corner = (i: number): [number, number] => {
  const a = -Math.PI / 2 + (i * Math.PI) / 3;
  return [Math.cos(a) * HEX_R, Math.sin(a) * HEX_R * SQUASH];
};

function poly(pts: [number, number][]): SkPath {
  const b = Skia.PathBuilder.Make();
  pts.forEach(([x, y], i) => (i === 0 ? b.moveTo(x, y) : b.lineTo(x, y)));
  b.close();
  return b.detach();
}

export function makeHexAtlas(): HexAtlas | null {
  const surface: SkSurface | null = Skia.Surface.Make(CELL_W * (LEVELS + 1), CELL_H);
  if (!surface) return null;
  const canvas = surface.getCanvas();
  const fill = Skia.Paint();
  fill.setAntiAlias(true);
  const stroke = Skia.Paint();
  stroke.setAntiAlias(true);
  stroke.setStyle(PaintStyle.Stroke);

  const c = Array.from({ length: 6 }, (_, i) => corner(i));
  for (let k = 0; k < LEVELS; k++) {
    canvas.save();
    canvas.translate(k * CELL_W + AX, AY);
    const wall = WALL[k]!;
    // lit left wall, dark right wall (the two faces turned toward the viewer)
    fill.setColor(Skia.Color('#B4B4B4'));
    canvas.drawPath(poly([c[4]!, c[3]!, [c[3]![0], c[3]![1] + wall], [c[4]![0], c[4]![1] + wall]]), fill);
    fill.setColor(Skia.Color('#838383'));
    canvas.drawPath(poly([c[3]!, c[2]!, [c[2]![0], c[2]![1] + wall], [c[3]![0], c[3]![1] + wall]]), fill);
    // top face with a faint grid line
    const top = poly(c);
    fill.setColor(Skia.Color('#FFFFFF'));
    canvas.drawPath(top, fill);
    stroke.setStrokeWidth(1.4);
    stroke.setColor(Skia.Color('#C9CED3'));
    canvas.drawPath(top, stroke);
    canvas.restore();
  }
  // outline sprite for the fog
  canvas.save();
  canvas.translate(LEVELS * CELL_W + AX, AY);
  stroke.setStrokeWidth(2);
  stroke.setColor(Skia.Color('#FFFFFF'));
  canvas.drawPath(poly(c), stroke);
  canvas.restore();

  surface.flush();
  const image = surface.makeImageSnapshot();
  const rects = Array.from({ length: LEVELS + 1 }, (_, i) => Skia.XYWHRect(i * CELL_W, 0, CELL_W, CELL_H));
  return { image, rects, anchorX: AX, anchorY: AY };
}

export const HEX_WALL_W = W;
