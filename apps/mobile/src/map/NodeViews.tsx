import {
  Group,
  Path,
  Rect,
  RoundedRect,
  Skia,
  Text as SkText,
  type SkFont,
  type SkPath,
} from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { type NetNode, type Sector } from '@nexus/shared';
import { colors, mix, shade } from '../theme';
import { SQUASH } from './camera';

export interface NodeInfo {
  node: NetNode;
  color: string; // main sector colour
  ring: string; // main colour bent toward the side sector (organic hint)
  label: string;
  sector: Sector;
}

/** Circumradius of a node tile and the height of its side wall (world units). */
export const NODE_R = 31;
export const NODE_DEPTH = 13;

type Builder = ReturnType<typeof Skia.PathBuilder.Make>;

/** Pointy-top hexagon in view space, centred on the origin. */
function hexPts(R: number): [number, number][] {
  return Array.from({ length: 6 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 3;
    return [Math.cos(a) * R, Math.sin(a) * R * SQUASH] as [number, number];
  });
}
function poly(pts: [number, number][]): SkPath {
  const b: Builder = Skia.PathBuilder.Make();
  pts.forEach(([x, y], i) => (i === 0 ? b.moveTo(x, y) : b.lineTo(x, y)));
  b.close();
  return b.detach();
}
interface HexParts {
  top: SkPath;
  left: SkPath;
  right: SkPath;
}
function hexParts(R: number, depth: number): HexParts {
  const c = hexPts(R);
  const down = (p: [number, number]): [number, number] => [p[0], p[1] + depth];
  return {
    top: poly(c),
    left: poly([c[4]!, c[3]!, down(c[3]!), down(c[4]!)]),
    right: poly([c[3]!, c[2]!, down(c[2]!), down(c[3]!)]),
  };
}

const NODE = hexParts(NODE_R, NODE_DEPTH);
const NODE_RING = poly(hexPts(NODE_R + 7));
const NODE_INNER = poly(hexPts(NODE_R - 8));
const SHARD_R = 13;
const SHARD_DEPTH = 6;
const SHARD = hexParts(SHARD_R, SHARD_DEPTH);
const CORE_R = 46;
const CORE_DEPTH = 20;
const CORE = hexParts(CORE_R, CORE_DEPTH);
const CORE_MID = poly(hexPts(CORE_R - 12));
const CORE_IN = poly(hexPts(CORE_R - 26));

// --- white icons, drawn in a unit box (-1..1) ------------------------------
function unitPath(draw: (p: Builder) => void) {
  const p = Skia.PathBuilder.Make();
  draw(p);
  return p.detach();
}
function ring(p: Builder, rx: number, ry: number, rot: number) {
  for (let i = 0; i <= 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    const x = Math.cos(a) * rx;
    const y = Math.sin(a) * ry;
    const px = x * Math.cos(rot) - y * Math.sin(rot);
    const py = x * Math.sin(rot) + y * Math.cos(rot);
    if (i === 0) p.moveTo(px, py);
    else p.lineTo(px, py);
  }
}
const ICONS: Record<Sector, { path: SkPath; fill: boolean }> = {
  // atom
  science: {
    fill: false,
    path: unitPath((p) => {
      ring(p, 1, 0.4, 0);
      ring(p, 1, 0.4, Math.PI / 3);
      ring(p, 1, 0.4, -Math.PI / 3);
    }),
  },
  // leaf
  nature: {
    fill: true,
    path: unitPath((p) => {
      p.moveTo(-0.9, 0.9);
      p.quadTo(-1, -0.7, 0.9, -0.9);
      p.quadTo(1, 0.7, -0.9, 0.9);
      p.close();
    }),
  },
  // note
  culture: {
    fill: true,
    path: unitPath((p) => {
      p.addCircle(-0.35, 0.65, 0.4);
      p.moveTo(-0.02, 0.65);
      p.lineTo(-0.02, -0.9);
      p.lineTo(0.2, -0.9);
      p.lineTo(0.2, 0.65);
      p.close();
      p.moveTo(0.2, -0.9);
      p.lineTo(0.85, -0.5);
      p.lineTo(0.2, -0.45);
      p.close();
    }),
  },
  // column
  history: {
    fill: true,
    path: unitPath((p) => {
      p.moveTo(-0.8, -0.9);
      p.lineTo(0.8, -0.9);
      p.lineTo(0.8, -0.6);
      p.lineTo(-0.8, -0.6);
      p.close();
      p.moveTo(-0.5, -0.5);
      p.lineTo(0.5, -0.5);
      p.lineTo(0.5, 0.6);
      p.lineTo(-0.5, 0.6);
      p.close();
      p.moveTo(-0.8, 0.7);
      p.lineTo(0.8, 0.7);
      p.lineTo(0.8, 0.95);
      p.lineTo(-0.8, 0.95);
      p.close();
    }),
  },
};

const checkPath = unitPath((p) => {
  p.moveTo(-0.7, 0.05);
  p.lineTo(-0.2, 0.55);
  p.lineTo(0.75, -0.55);
});
const lockBody = unitPath((p) => {
  p.moveTo(-0.62, -0.05);
  p.lineTo(0.62, -0.05);
  p.lineTo(0.62, 0.8);
  p.lineTo(-0.62, 0.8);
  p.close();
});
const lockShackle = unitPath((p) => {
  p.moveTo(-0.38, -0.05);
  p.lineTo(-0.38, -0.4);
  p.quadTo(-0.38, -0.85, 0, -0.85);
  p.quadTo(0.38, -0.85, 0.38, -0.4);
  p.lineTo(0.38, -0.05);
});

function faceOf(info: NodeInfo): string {
  const { node } = info;
  if (node.locked) return '#4D6173';
  if (node.state === 'damaged') return colors.warn;
  return info.color;
}

function Solid({ parts, face, edge }: { parts: HexParts; face: string; edge: string }) {
  return (
    <>
      <Path path={parts.left} color={mix(edge, '#FFFFFF', 0.08)} />
      <Path path={parts.right} color={shade(edge, 0.25)} />
      <Path path={parts.top} color={face} />
      <Path path={parts.top} style="stroke" strokeWidth={2} strokeJoin="round" color="#FFFFFF" opacity={0.28} />
    </>
  );
}

/** A node: a larger hexagon tile with a solid wall, a symbol and (when open) a pulsing ring. */
export function NodeTile({
  info,
  pulse,
  highlighted,
  font,
}: {
  info: NodeInfo;
  pulse: SharedValue<number>;
  highlighted: boolean;
  font: SkFont;
}) {
  const { node } = info;
  const locked = !!node.locked;
  const open = node.state === 'open' && !locked;
  const face = faceOf(info);
  const edge = shade(face, 0.4);
  const icon = ICONS[info.sector];
  const lw = font.getTextWidth(info.label);
  const ringT = useDerivedValue(() => [{ scale: 1 + pulse.value * (highlighted ? 0.3 : 0.2) }]);
  const ringO = useDerivedValue(() => (open ? 0.9 - pulse.value * 0.7 : 0));

  return (
    <Group transform={[{ translateX: node.pos.x }, { translateY: node.pos.y * SQUASH }]}>
      {/* contact shadow */}
      <Group transform={[{ translateY: 3 }]} opacity={0.5}>
        <Path path={NODE.top} color="#02060C" />
      </Group>
      <Group transform={[{ translateY: -NODE_DEPTH }]}>
        <Solid parts={NODE} face={face} edge={edge} />
        <Path path={NODE_INNER} style="stroke" strokeWidth={2} strokeJoin="round" color="#FFFFFF" opacity={0.18} />
        {open ? <Path path={NODE_RING} style="stroke" strokeWidth={3.5} strokeJoin="round" color="#FFFFFF" /> : null}
        {highlighted || open ? (
          <Group transform={ringT} opacity={ringO}>
            <Path path={NODE_RING} style="stroke" strokeWidth={3} strokeJoin="round" color={highlighted ? info.color : '#FFFFFF'} />
          </Group>
        ) : null}

        <Group transform={[{ translateY: -2 }, { scale: NODE_R * 0.36 }]}>
          {node.state === 'solved' ? (
            <Path path={checkPath} style="stroke" strokeWidth={0.36} strokeCap="round" strokeJoin="round" color="#FFFFFF" />
          ) : locked ? (
            <>
              <Path path={lockBody} color="#FFFFFF" />
              <Path path={lockShackle} style="stroke" strokeWidth={0.26} strokeCap="round" color="#FFFFFF" />
            </>
          ) : node.state === 'damaged' ? (
            <>
              <Rect x={-0.12} y={-0.8} width={0.24} height={1.05} color="#FFFFFF" />
              <Path path={unitPath((p) => p.addCircle(0, 0.62, 0.15))} color="#FFFFFF" />
            </>
          ) : (
            <Path path={icon.path} style={icon.fill ? 'fill' : 'stroke'} strokeWidth={0.2} strokeJoin="round" color="#FFFFFF" />
          )}
        </Group>
      </Group>
      {node.state !== 'solved' ? (
        <>
          <SkText x={-lw / 2} y={NODE_R * SQUASH + 17} text={info.label} font={font} color="#04080F" style="stroke" strokeWidth={4} />
          <SkText x={-lw / 2} y={NODE_R * SQUASH + 17} text={info.label} font={font} color="#FFFFFF" />
        </>
      ) : null}
    </Group>
  );
}

/** Marker for the preview strand: a small tile in the colour of the land it sits on. */
export function SiteTile({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <Group transform={[{ translateX: x }, { translateY: y * SQUASH - 9 }, { scale: 0.62 }]} opacity={0.95}>
      <Solid parts={NODE} face={color} edge={shade(color, 0.4)} />
    </Group>
  );
}

/** The core: a big chip with concentric hexagons. */
export function CoreTile() {
  return (
    <Group>
      <Group transform={[{ translateY: 4 }]} opacity={0.5}>
        <Path path={CORE.top} color="#02060C" />
      </Group>
      <Group transform={[{ translateY: -CORE_DEPTH }]}>
        <Solid parts={CORE} face={colors.accent} edge={shade(colors.accent, 0.45)} />
        <Path path={CORE_MID} color="#FFFFFF" opacity={0.2} />
        <Path path={CORE_IN} color="#FFFFFF" />
      </Group>
    </Group>
  );
}

export interface Shard {
  id: string;
  x: number;
  y: number;
  rot: number;
  hint: string;
  taken: boolean;
}

/** A piece of debris: a small hexagon gem on the ground with a floating tag. */
export function ShardTile({
  shard,
  color,
  font,
}: {
  shard: Shard;
  color: string;
  font: SkFont;
}) {
  const face = shard.taken ? '#34475A' : color;
  const text = shard.taken ? `✓ ${shard.hint}` : shard.hint;
  const w = font.getTextWidth(text) + 20;
  const h = 26;
  const up = SHARD_DEPTH + 36;
  const chip = shard.taken ? '#25354A' : '#FFFFFF';
  return (
    <Group transform={[{ translateX: shard.x }, { translateY: shard.y * SQUASH }]}>
      <Group transform={[{ translateY: 2 }]} opacity={0.5}>
        <Path path={SHARD.top} color="#02060C" />
      </Group>
      <Group transform={[{ translateY: -SHARD_DEPTH }]}>
        <Solid parts={SHARD} face={face} edge={shade(face, 0.4)} />
      </Group>
      <Rect x={-1.5} y={-up + h / 2} width={3} height={up - h / 2 - SHARD_DEPTH} color={shade(color, 0.2)} opacity={0.7} />
      <RoundedRect x={-w / 2} y={-up - h / 2 + 4} width={w} height={h} r={13} color={mix(shard.taken ? '#1B2A3C' : color, '#000000', 0.2)} />
      <RoundedRect x={-w / 2} y={-up - h / 2} width={w} height={h} r={13} color={chip} />
      <SkText x={-w / 2 + 10} y={-up + 5} text={text} font={font} color={shard.taken ? colors.dim : '#2B3A47'} />
    </Group>
  );
}
