import {
  Blur,
  Circle,
  DashPathEffect,
  Group,
  LinearGradient,
  Path,
  Rect,
  RoundedRect,
  Skia,
  Text as SkText,
  vec,
  type SkFont,
} from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { hashString, seededRng, type NetNode, type Sector } from '@nexus/shared';
import { colors, mix, shade } from '../theme';
import { TILT } from './camera';
import type { Site } from './scenery';

export interface NodeInfo {
  node: NetNode;
  color: string; // main sector colour
  ring: string; // main colour bent toward the side sector (organic hint)
  label: string;
  sector: Sector;
}

export const nodeRadius = (z: number) => 25 - z * 6;
/** Height of the button above the ground, in world units. */
export const orbHeight = (z: number) => 38 + nodeRadius(z) * 0.5;
/** Thickness of the button's bottom edge: this is what makes it look solid. */
const DEPTH = 11;

/** A path (trail) lying on the ground: dark border, bright surface, dotted centre line. */
export function EdgeView({
  from,
  to,
  c1,
  c2,
  alpha,
  dashed,
  id,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  c1: string;
  c2: string;
  alpha: number;
  dashed: boolean;
  id: string;
}) {
  const path = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const sign = hashString(id) % 2 === 0 ? 1 : -1;
    const bend = 0.16 * sign;
    p.moveTo(from.x, from.y);
    p.quadTo(mx - dy * bend, my + dx * bend, to.x, to.y);
    return p.detach();
  }, [from.x, from.y, to.x, to.y, id]);
  const a = mix(c1, '#FFFFFF', 0.25);
  const b = mix(c2, '#FFFFFF', 0.25);
  return (
    <Group opacity={alpha}>
      <Path path={path} style="stroke" strokeWidth={21} strokeCap="round" color="#0B1418" opacity={0.55} />
      <Path path={path} style="stroke" strokeWidth={14} strokeCap="round">
        <LinearGradient start={vec(from.x, from.y)} end={vec(to.x, to.y)} colors={[a, b]} />
      </Path>
      <Path path={path} style="stroke" strokeWidth={3} strokeCap="round" color="#FFFFFF" opacity={dashed ? 0.35 : 0.7}>
        <DashPathEffect intervals={[1, 12]} />
      </Path>
    </Group>
  );
}

// --- white icons, drawn in a unit box (-1..1) ------------------------------
function unitPath(draw: (p: ReturnType<typeof Skia.PathBuilder.Make>) => void) {
  const p = Skia.PathBuilder.Make();
  draw(p);
  return p.detach();
}
function ring(p: ReturnType<typeof Skia.PathBuilder.Make>, rx: number, ry: number, rot: number) {
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
const ICONS: Record<Sector, { path: ReturnType<typeof unitPath>; fill: boolean }> = {
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
  if (node.locked) return '#5B6F7A';
  if (node.state === 'damaged') return colors.warn;
  return info.color;
}

/** Everything of a node that lies flat on the ground: contact shadow, pulse ring. */
export function NodeGround({
  info,
  pulse,
  highlighted,
}: {
  info: NodeInfo;
  pulse: SharedValue<number>;
  highlighted: boolean;
}) {
  const { node } = info;
  const R = nodeRadius(node.pos.z);
  const open = node.state === 'open' && !node.locked;
  const ringR = useDerivedValue(() => R + 8 + pulse.value * (highlighted ? 18 : 10));
  const ringO = useDerivedValue(() => (open ? 0.85 - pulse.value * 0.6 : 0));
  const { x, y } = node.pos;
  return (
    <Group>
      <Circle cx={x} cy={y} r={R * 1.25} color="#06100F" opacity={0.4} />
      <Circle cx={x} cy={y} r={R * 0.8} color={shade(faceOf(info), 0.55)} />
      {open ? (
        <Circle cx={x} cy={y} r={ringR} style="stroke" strokeWidth={4} color="#FFFFFF" opacity={ringO} />
      ) : null}
      {highlighted ? (
        <Circle cx={x} cy={y} r={R + 34} color={info.color} opacity={0.3}>
          <Blur blur={10} />
        </Circle>
      ) : null}
    </Group>
  );
}

/** The chunky button standing on a post (billboard: the tilt of the map is undone). */
export function NodeBillboard({
  info,
  font,
  boldFont,
}: {
  info: NodeInfo;
  font: SkFont;
  boldFont: SkFont;
}) {
  const { node } = info;
  const R = nodeRadius(node.pos.z) * 1.05;
  const h = orbHeight(node.pos.z);
  const locked = !!node.locked;
  const face = faceOf(info);
  const edge = shade(face, 0.36);
  const open = node.state === 'open' && !locked;
  const lw = font.getTextWidth(info.label);
  const { x, y } = node.pos;
  const icon = ICONS[info.sector];

  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotateX: -TILT }]}>
      {/* post */}
      <Rect x={-6} y={-h + R} width={12} height={h - R} color={shade(face, 0.55)} />
      {/* thick bottom edge */}
      <Rect x={-R} y={-h} width={R * 2} height={DEPTH} color={edge} />
      <Circle cx={0} cy={-h + DEPTH} r={R} color={edge} />
      {/* face */}
      <Circle cx={0} cy={-h} r={R} color={face} />
      <Circle cx={0} cy={-h} r={R - 5} style="stroke" strokeWidth={2.5} color="#FFFFFF" opacity={0.22} />
      {/* shine */}
      <Circle cx={-R * 0.38} cy={-h - R * 0.42} r={R * 0.16} color="#FFFFFF" opacity={0.6} />
      {open ? <Circle cx={0} cy={-h} r={R + 5} style="stroke" strokeWidth={4} color="#FFFFFF" /> : null}

      <Group transform={[{ translateY: -h }, { scale: R * 0.5 }]}>
        {node.state === 'solved' ? (
          <Path path={checkPath} style="stroke" strokeWidth={0.34} strokeCap="round" strokeJoin="round" color="#FFFFFF" />
        ) : locked ? (
          <>
            <Path path={lockBody} color="#FFFFFF" />
            <Path path={lockShackle} style="stroke" strokeWidth={0.26} strokeCap="round" color="#FFFFFF" />
          </>
        ) : node.state === 'damaged' ? (
          <>
            <Rect x={-0.12} y={-0.8} width={0.24} height={1.05} color="#FFFFFF" />
            <Circle cx={0} cy={0.62} r={0.15} color="#FFFFFF" />
          </>
        ) : (
          <Path path={icon.path} style={icon.fill ? 'fill' : 'stroke'} strokeWidth={0.2} strokeJoin="round" color="#FFFFFF" />
        )}
      </Group>

      {node.state !== 'solved' ? (
        <>
          <SkText x={-lw / 2} y={22} text={info.label} font={font} color="#0B1418" style="stroke" strokeWidth={4} />
          <SkText x={-lw / 2} y={22} text={info.label} font={font} color="#FFFFFF" />
        </>
      ) : null}
    </Group>
  );
}

/** Button for the preview strand. */
export function SiteBillboard({ site, color, font }: { site: Site; color: string; font: SkFont }) {
  const R = 16;
  const h = 32;
  const edge = shade(color, 0.36);
  const lw = font.getTextWidth('Vorschau');
  return (
    <Group transform={[{ translateX: site.x }, { translateY: site.y }, { rotateX: -TILT }]} opacity={0.92}>
      <Rect x={-4} y={-h + R} width={8} height={h - R} color={shade(color, 0.55)} />
      <Rect x={-R} y={-h} width={R * 2} height={8} color={edge} />
      <Circle cx={0} cy={-h + 8} r={R} color={edge} />
      <Circle cx={0} cy={-h} r={R} color={color} />
      <Circle cx={-R * 0.36} cy={-h - R * 0.4} r={R * 0.16} color="#FFFFFF" opacity={0.55} />
      {site.id === 'strand0' || site.id === 'strand15' ? (
        <>
          <SkText x={-lw / 2} y={20} text="Vorschau" font={font} color="#0B1418" style="stroke" strokeWidth={4} />
          <SkText x={-lw / 2} y={20} text="Vorschau" font={font} color="#FFFFFF" />
        </>
      ) : null}
    </Group>
  );
}

/** The core chip, flat on the ground, with a thick edge below it. */
export function CoreView() {
  return (
    <Group>
      <Circle cx={0} cy={0} r={96} color="#0B1418" opacity={0.35} />
      <RoundedRect x={-40} y={-40} width={80} height={80} r={18} color={shade(colors.accent, 0.5)} />
      <Group transform={[{ translateZ: 14 }]}>
        <RoundedRect x={-40} y={-40} width={80} height={80} r={18} color={shade(colors.accent, 0.3)} />
      </Group>
      <Group transform={[{ translateZ: 24 }]}>
        <RoundedRect x={-40} y={-40} width={80} height={80} r={18} color={colors.accent} />
        <RoundedRect x={-22} y={-22} width={44} height={44} r={10} color="#FFFFFF" opacity={0.28} />
        <RoundedRect x={-11} y={-11} width={22} height={22} r={6} color="#FFFFFF" />
      </Group>
    </Group>
  );
}

/** Vertical beam rising out of the core, standing upright. */
export function CoreBeam() {
  return (
    <Group transform={[{ rotateX: -TILT }, { translateY: -30 }]}>
      <Rect x={-20} y={-300} width={40} height={300}>
        <LinearGradient start={vec(0, 0)} end={vec(0, -300)} colors={['#1CB0F666', '#1CB0F600']} />
      </Rect>
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

function shardPath(id: string) {
  const rng = seededRng(`shard:${id}`);
  const p = Skia.PathBuilder.Make();
  const n = 6;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rng() * 0.4;
    const r = 12 + rng() * 9;
    if (i === 0) p.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else p.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  p.close();
  return p.detach();
}

/** The broken piece lying on the ground, as a chunky gem with a thick edge. */
export function ShardGround({ shard, color }: { shard: Shard; color: string }) {
  const path = useMemo(() => shardPath(shard.id), [shard.id]);
  const face = shard.taken ? '#3B4C56' : color;
  return (
    <Group transform={[{ translateX: shard.x }, { translateY: shard.y }, { rotate: shard.rot }]}>
      <Circle cx={0} cy={0} r={24} color="#06100F" opacity={0.35} />
      <Group transform={[{ translateZ: 5 }]}>
        <Path path={path} color={shade(face, 0.4)} />
      </Group>
      <Group transform={[{ translateZ: 11 }]}>
        <Path path={path} color={face} />
        <Path path={path} style="stroke" strokeWidth={2} strokeJoin="round" color="#FFFFFF" opacity={0.45} />
      </Group>
    </Group>
  );
}

/** A floating tag above the piece so the player can choose what to keep. */
export function ShardBillboard({
  shard,
  color,
  font,
}: {
  shard: Shard;
  color: string;
  font: SkFont;
}) {
  const text = shard.taken ? `✓ ${shard.hint}` : shard.hint;
  const w = font.getTextWidth(text) + 20;
  const h = 26;
  const up = 40;
  const face = shard.taken ? '#2B3B44' : '#FFFFFF';
  const edge = shard.taken ? '#1F2C33' : mix(color, '#FFFFFF', 0.5);
  return (
    <Group transform={[{ translateX: shard.x }, { translateY: shard.y }, { rotateX: -TILT }]}>
      <Rect x={-1.5} y={-up + h / 2} width={3} height={up - h / 2} color={shade(color, 0.3)} />
      <RoundedRect x={-w / 2} y={-up - h / 2 + 4} width={w} height={h} r={13} color={edge} />
      <RoundedRect x={-w / 2} y={-up - h / 2} width={w} height={h} r={13} color={face} />
      <SkText x={-w / 2 + 10} y={-up + 5} text={text} font={font} color={shard.taken ? colors.dim : '#3C4A52'} />
    </Group>
  );
}
