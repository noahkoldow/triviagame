import { View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { colors } from '../theme';
import { labelPlace, polygonPoints, radarPoint, ringPoints } from './radar.logic';

export interface RadarAxis {
  label: string;
  color: string;
  /** Filled polygon, 0..1. */
  depth: number;
  /** Outline polygon, 0..1. */
  coverage: number;
}

const RINGS = [0.2, 0.4, 0.6, 0.8, 1];

/**
 * A net (radar) chart: one axis per topic area, in the colour of its sector. The filled
 * shape is how deep you got, the outline how much of the area you covered.
 */
export function Radar({
  axes,
  size,
  summary,
}: {
  axes: RadarAxis[];
  size: number;
  /** Spoken description for screen readers. */
  summary: string;
}) {
  const n = axes.length;
  const c = size / 2;
  const r = size / 2 - 46; // room for the labels
  const depth = axes.map((a) => a.depth);
  const coverage = axes.map((a) => a.coverage);
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={summary}>
      <Svg width={size} height={size}>
        {RINGS.map((l) => (
          <Polygon key={l} points={ringPoints(l, n, r, c, c)} fill="none" stroke={colors.line} strokeWidth={l === 1 ? 1.6 : 1} />
        ))}
        {axes.map((a, i) => {
          const end = radarPoint(i, n, 1, r, c, c);
          return <Line key={a.label} x1={c} y1={c} x2={end.x} y2={end.y} stroke={a.color} strokeWidth={1.4} opacity={0.55} />;
        })}

        <Polygon points={polygonPoints(coverage, r, c, c)} fill="none" stroke="#FFFFFF" strokeWidth={1.6} strokeDasharray="4 3" opacity={0.85} />
        <Polygon points={polygonPoints(depth, r, c, c)} fill={colors.accent} fillOpacity={0.35} stroke={colors.accent} strokeWidth={2} strokeLinejoin="round" />

        {axes.map((a, i) => {
          const p = radarPoint(i, n, Math.max(a.depth, 0.04), r, c, c);
          return <Circle key={`d-${a.label}`} cx={p.x} cy={p.y} r={3.4} fill={a.color} stroke="#FFFFFF" strokeWidth={1} />;
        })}

        {axes.map((a, i) => {
          const l = labelPlace(i, n, r, c, c);
          return (
            <SvgText key={`t-${a.label}`} x={l.x} y={l.y} fontSize={10} fontWeight="700" fill={a.color} textAnchor={l.anchor}>
              {a.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
