import {
  Blur,
  Circle,
  DashPathEffect,
  Group,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  RoundedRect,
  Skia,
  Text as SkText,
  vec,
  type SkFont,
} from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { hashString, seededRng, type NetNode } from '@nexus/shared';
import { colors, mix } from '../theme';
import { TILT } from './camera';
import type { Site } from './scenery';

export interface NodeInfo {
  node: NetNode;
  color: string; // main sector colour
  ring: string; // main colour bent toward the side sector (organic hint)
  label: string;
}

export const nodeRadius = (z: number) => 24 - z * 6;
/** Height of the orb above the ground, in world units. */
export const orbHeight = (z: number) => 34 + nodeRadius(z) * 0.5;

/** Edge lying flat on the ground plane. */
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
  return (
    <Group>
      <Path path={path} style="stroke" strokeWidth={14} opacity={alpha * 0.2}>
        <Blur blur={7} />
        <LinearGradient start={vec(from.x, from.y)} end={vec(to.x, to.y)} colors={[c1, c2]} />
      </Path>
      <Path path={path} style="stroke" strokeWidth={4} strokeCap="round" opacity={alpha}>
        <LinearGradient start={vec(from.x, from.y)} end={vec(to.x, to.y)} colors={[c1, c2]} />
        {dashed ? <DashPathEffect intervals={[8, 8]} /> : null}
      </Path>
    </Group>
  );
}

const checkPath = (() => {
  const p = Skia.PathBuilder.Make();
  p.moveTo(-8, 0);
  p.lineTo(-2.5, 6);
  p.lineTo(8, -6.5);
  return p.detach();
})();

const gemPath = (() => {
  const p = Skia.PathBuilder.Make();
  p.moveTo(0, -9);
  p.lineTo(8, -2);
  p.lineTo(0, 9);
  p.lineTo(-8, -2);
  p.close();
  return p.detach();
})();

function fillOf(info: NodeInfo): string {
  const { node } = info;
  if (node.locked) return '#1B2233';
  if (node.state === 'solved') return info.color;
  if (node.state === 'damaged') return '#F59E0B';
  return '#101A30';
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
  const ringR = useDerivedValue(() => R + 6 + pulse.value * (highlighted ? 16 : 9));
  const ringO = useDerivedValue(() => (open ? 0.7 - pulse.value * 0.5 : 0));
  const { x, y } = node.pos;
  return (
    <Group>
      <Circle cx={x} cy={y} r={R * 1.15} color="#000" opacity={0.55}>
        <Blur blur={7} />
      </Circle>
      <Circle cx={x} cy={y} r={R * 0.55} color={info.color} opacity={0.35}>
        <Blur blur={5} />
      </Circle>
      {open ? (
        <Circle
          cx={x}
          cy={y}
          r={ringR}
          style="stroke"
          strokeWidth={2.4}
          color={info.ring}
          opacity={ringO}
        />
      ) : null}
      {highlighted ? (
        <Circle cx={x} cy={y} r={R + 26} color={info.color} opacity={0.22}>
          <Blur blur={12} />
        </Circle>
      ) : null}
    </Group>
  );
}

/** The orb that stands upright on a stem (billboard: the tilt of the map is undone). */
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
  const R = nodeRadius(node.pos.z);
  const h = orbHeight(node.pos.z);
  const locked = !!node.locked;
  const fill = fillOf(info);
  const stroke = locked ? colors.gem : node.state === 'damaged' ? '#FDE68A' : info.ring;
  const glyph = node.state === 'open' && !locked ? '?' : node.state === 'damaged' ? '!' : '';
  const gw = glyph ? boldFont.getTextWidth(glyph) : 0;
  const lw = font.getTextWidth(info.label);
  const hi = mix(fill, '#FFFFFF', node.state === 'solved' ? 0.55 : 0.18);
  const lo = mix(fill, '#000000', 0.45);
  const { x, y } = node.pos;

  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotateX: -TILT }]}>
      <Line p1={vec(0, 0)} p2={vec(0, -h + R)} color={info.ring} opacity={0.55} strokeWidth={2.5} />
      <Circle cx={0} cy={-h} r={R * 1.7} color={info.color} opacity={node.state === 'solved' ? 0.32 : 0.14}>
        <Blur blur={9} />
      </Circle>
      <Circle cx={0} cy={-h} r={R}>
        <RadialGradient c={vec(-R * 0.35, -h - R * 0.4)} r={R * 1.7} colors={[hi, fill, lo]} positions={[0, 0.5, 1]} />
      </Circle>
      <Circle cx={0} cy={-h} r={R} style="stroke" strokeWidth={locked ? 2 : 3} color={stroke}>
        {locked ? <DashPathEffect intervals={[5, 4]} /> : null}
      </Circle>
      {/* specular glint */}
      <Circle cx={-R * 0.32} cy={-h - R * 0.4} r={R * 0.16} color="#FFFFFF" opacity={0.55} />
      {node.state === 'solved' ? (
        <Group transform={[{ translateY: -h }]}>
          <Path path={checkPath} style="stroke" strokeWidth={3.5} strokeCap="round" strokeJoin="round" color="#06101C" />
        </Group>
      ) : null}
      {locked ? (
        <Group transform={[{ translateY: -h }]}>
          <Path path={gemPath} color={colors.gem} />
        </Group>
      ) : null}
      {glyph ? (
        <SkText
          x={-gw / 2}
          y={-h + 7}
          text={glyph}
          font={boldFont}
          color={node.state === 'damaged' ? '#1F1400' : info.ring}
        />
      ) : null}
      {node.state !== 'solved' ? (
        <SkText x={-lw / 2} y={20} text={info.label} font={font} color={colors.dim} />
      ) : null}
    </Group>
  );
}

/** Ghost orb for the preview strand. */
export function SiteBillboard({ site, color, font }: { site: Site; color: string; font: SkFont }) {
  const R = 15;
  const h = 30;
  const lw = font.getTextWidth('Vorschau');
  return (
    <Group transform={[{ translateX: site.x }, { translateY: site.y }, { rotateX: -TILT }]}>
      <Line p1={vec(0, 0)} p2={vec(0, -h + R)} color={color} opacity={0.35} strokeWidth={2} />
      <Circle cx={0} cy={-h} r={R * 1.6} color={color} opacity={0.14}>
        <Blur blur={8} />
      </Circle>
      <Circle cx={0} cy={-h} r={R} opacity={0.75}>
        <RadialGradient c={vec(-R * 0.3, -h - R * 0.4)} r={R * 1.7} colors={[mix(color, '#FFFFFF', 0.4), color, mix(color, '#000000', 0.5)]} />
      </Circle>
      <Circle cx={0} cy={-h} r={R} style="stroke" strokeWidth={2} color={color} opacity={0.9}>
        <DashPathEffect intervals={[4, 3]} />
      </Circle>
      <Circle cx={-R * 0.3} cy={-h - R * 0.38} r={R * 0.14} color="#FFFFFF" opacity={0.5} />
      {site.id === 'strand0' || site.id === 'strand15' ? (
        <SkText x={-lw / 2} y={18} text="Vorschau" font={font} color={colors.dim} />
      ) : null}
    </Group>
  );
}

export function CoreView() {
  const pins: React.ReactElement[] = [];
  for (let i = -2; i <= 2; i++) {
    const o = i * 10;
    for (const [k, p1, p2] of [
      ['t', vec(o, -32), vec(o, -42)],
      ['b', vec(o, 32), vec(o, 42)],
      ['l', vec(-32, o), vec(-42, o)],
      ['r', vec(32, o), vec(42, o)],
    ] as const) {
      pins.push(<Line key={`${k}${i}`} p1={p1} p2={p2} color="#67E8F9" style="stroke" strokeWidth={3} />);
    }
  }
  return (
    <Group>
      <Circle cx={0} cy={0} r={130} opacity={0.9}>
        <RadialGradient c={vec(0, 0)} r={130} colors={['#22D3EE66', '#22D3EE00']} />
      </Circle>
      {pins}
      <RoundedRect x={-32} y={-32} width={64} height={64} r={12} color="#0B1B2B" />
      <RoundedRect x={-32} y={-32} width={64} height={64} r={12} color="#22D3EE" style="stroke" strokeWidth={2.5} />
      <RoundedRect x={-15} y={-15} width={30} height={30} r={6} color="#22D3EE" opacity={0.9} />
      <RoundedRect x={-7} y={-7} width={14} height={14} r={3} color="#E0FBFF" />
    </Group>
  );
}

/** Vertical beam rising out of the core, standing upright. */
export function CoreBeam() {
  return (
    <Group transform={[{ rotateX: -TILT }]}>
      <Rect x={-16} y={-260} width={32} height={260}>
        <LinearGradient start={vec(0, 0)} end={vec(0, -260)} colors={['#22D3EE55', '#22D3EE00']} />
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
    const r = 11 + rng() * 9;
    if (i === 0) p.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else p.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  p.close();
  return p.detach();
}

/** The broken piece lying on the ground. */
export function ShardGround({ shard, color }: { shard: Shard; color: string }) {
  const path = useMemo(() => shardPath(shard.id), [shard.id]);
  return (
    <Group transform={[{ translateX: shard.x }, { translateY: shard.y }, { rotate: shard.rot }]}>
      <Circle cx={0} cy={0} r={22} color={color} opacity={shard.taken ? 0.08 : 0.3}>
        <Blur blur={9} />
      </Circle>
      <Path path={path} color={shard.taken ? '#1B2740' : mix(color, '#0B1220', 0.55)} />
      <Path path={path} style="stroke" strokeWidth={2.2} strokeJoin="round" color={color} opacity={shard.taken ? 0.35 : 0.95} />
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
  const w = font.getTextWidth(text) + 18;
  const h = 24;
  const up = 38;
  return (
    <Group transform={[{ translateX: shard.x }, { translateY: shard.y }, { rotateX: -TILT }]}>
      <Line p1={vec(0, 0)} p2={vec(0, -up + h / 2)} color={color} opacity={0.5} strokeWidth={1.5} />
      <RoundedRect x={-w / 2} y={-up - h / 2} width={w} height={h} r={12} color={shard.taken ? mix(color, '#0B1220', 0.7) : '#0E1626'} opacity={0.94} />
      <RoundedRect x={-w / 2} y={-up - h / 2} width={w} height={h} r={12} style="stroke" strokeWidth={1.6} color={color} opacity={shard.taken ? 0.5 : 1} />
      <SkText x={-w / 2 + 9} y={-up + 4} text={text} font={font} color={shard.taken ? colors.dim : colors.text} />
    </Group>
  );
}
