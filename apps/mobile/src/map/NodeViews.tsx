import {
  Blur,
  Circle,
  DashPathEffect,
  Group,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  RoundedRect,
  Skia,
  Text as SkText,
  vec,
  type SkFont,
} from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { hashString, type NetNode } from '@nexus/shared';
import { colors } from '../theme';

export interface NodeInfo {
  node: NetNode;
  color: string; // main sector colour
  ring: string; // main colour bent toward the side sector (organic hint)
  label: string;
}

export const nodeRadius = (z: number) => 24 - z * 6;

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
      <Path path={path} style="stroke" strokeWidth={9} opacity={alpha * 0.22}>
        <Blur blur={6} />
        <LinearGradient start={vec(from.x, from.y)} end={vec(to.x, to.y)} colors={[c1, c2]} />
      </Path>
      <Path path={path} style="stroke" strokeWidth={3} strokeCap="round" opacity={alpha}>
        <LinearGradient start={vec(from.x, from.y)} end={vec(to.x, to.y)} colors={[c1, c2]} />
        {dashed ? <DashPathEffect intervals={[7, 7]} /> : null}
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

export function NodeView({
  info,
  font,
  boldFont,
  pulse,
  highlighted,
}: {
  info: NodeInfo;
  font: SkFont;
  boldFont: SkFont;
  pulse: SharedValue<number>;
  highlighted: boolean;
}) {
  const { node } = info;
  const R = nodeRadius(node.pos.z);
  const open = node.state === 'open' && !node.locked;
  const locked = !!node.locked;
  const ringR = useDerivedValue(() => R + 5 + pulse.value * (highlighted ? 9 : 5));
  const ringO = useDerivedValue(() => (open ? 0.65 - pulse.value * 0.45 : 0));

  const fill = locked
    ? '#1B2233'
    : node.state === 'solved'
      ? info.color
      : node.state === 'damaged'
        ? '#F59E0B'
        : '#0E1626';
  const stroke = locked ? colors.gem : node.state === 'damaged' ? '#FDE68A' : info.ring;
  const glyph = node.state === 'open' && !locked ? '?' : node.state === 'damaged' ? '!' : '';
  const gw = glyph ? boldFont.getTextWidth(glyph) : 0;
  const lw = font.getTextWidth(info.label);
  const { x, y } = node.pos;

  return (
    <Group>
      {/* depth: soft drop shadow, stronger for nodes "closer" to the viewer */}
      <Circle cx={x + 2} cy={y + 5 + (1 - node.pos.z) * 3} r={R} color="#000" opacity={0.5}>
        <Blur blur={5} />
      </Circle>
      {open ? (
        <Circle
          cx={x}
          cy={y}
          r={ringR}
          style="stroke"
          strokeWidth={2}
          color={info.ring}
          opacity={ringO}
        />
      ) : null}
      {highlighted ? (
        <Circle cx={x} cy={y} r={R + 12} color={info.color} opacity={0.18}>
          <Blur blur={8} />
        </Circle>
      ) : null}
      <Circle cx={x} cy={y} r={R} color={fill}>
        {node.state === 'solved' ? (
          <RadialGradient
            c={vec(x - R * 0.3, y - R * 0.4)}
            r={R * 1.6}
            colors={['#FFFFFF66', fill]}
          />
        ) : null}
      </Circle>
      <Circle cx={x} cy={y} r={R} style="stroke" strokeWidth={locked ? 2 : 3} color={stroke}>
        {locked ? <DashPathEffect intervals={[5, 4]} /> : null}
      </Circle>
      {node.state === 'solved' ? (
        <Group transform={[{ translateX: x }, { translateY: y }]}>
          <Path
            path={checkPath}
            style="stroke"
            strokeWidth={3.5}
            strokeCap="round"
            strokeJoin="round"
            color="#06101C"
          />
        </Group>
      ) : null}
      {locked ? (
        <Group transform={[{ translateX: x }, { translateY: y }]}>
          <Path path={gemPath} color={colors.gem} />
        </Group>
      ) : null}
      {glyph ? (
        <SkText
          x={x - gw / 2}
          y={y + 7}
          text={glyph}
          font={boldFont}
          color={node.state === 'damaged' ? '#1F1400' : info.ring}
        />
      ) : null}
      {node.state !== 'solved' ? (
        <SkText x={x - lw / 2} y={y + R + 16} text={info.label} font={font} color={colors.dim} />
      ) : null}
    </Group>
  );
}

export function CoreView() {
  const pins: React.ReactElement[] = [];
  for (let i = -2; i <= 2; i++) {
    const o = i * 10;
    pins.push(
      <Line
        key={`t${i}`}
        p1={vec(o, -32)}
        p2={vec(o, -42)}
        color="#67E8F9"
        style="stroke"
        strokeWidth={3}
      />,
    );
    pins.push(
      <Line
        key={`b${i}`}
        p1={vec(o, 32)}
        p2={vec(o, 42)}
        color="#67E8F9"
        style="stroke"
        strokeWidth={3}
      />,
    );
    pins.push(
      <Line
        key={`l${i}`}
        p1={vec(-32, o)}
        p2={vec(-42, o)}
        color="#67E8F9"
        style="stroke"
        strokeWidth={3}
      />,
    );
    pins.push(
      <Line
        key={`r${i}`}
        p1={vec(32, o)}
        p2={vec(42, o)}
        color="#67E8F9"
        style="stroke"
        strokeWidth={3}
      />,
    );
  }
  return (
    <Group>
      <Circle cx={0} cy={0} r={110} opacity={0.9}>
        <RadialGradient c={vec(0, 0)} r={110} colors={['#22D3EE55', '#22D3EE00']} />
      </Circle>
      <Group>
        {pins}
        <RoundedRect x={-32} y={-32} width={64} height={64} r={12} color="#0B1B2B" />
        <RoundedRect
          x={-32}
          y={-32}
          width={64}
          height={64}
          r={12}
          color="#22D3EE"
          style="stroke"
          strokeWidth={2.5}
        />
        <RoundedRect x={-15} y={-15} width={30} height={30} r={6} color="#22D3EE" opacity={0.9} />
        <RoundedRect x={-7} y={-7} width={14} height={14} r={3} color="#E0FBFF" />
      </Group>
    </Group>
  );
}
