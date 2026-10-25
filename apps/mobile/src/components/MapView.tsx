import { Fragment, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import type { GeoBox, Lang } from '@nexus/shared';
import { useStrings } from '../strings';
import { WORLD, gridLines, landPath, mapHeight, project, toleranceRadii, unproject } from './map.logic';

const SEA = '#CFE8F7';
const LAND_FILL = '#F3EBD2';
const COAST = '#8A7A55';
const GRID = '#9DBBD0';
const INK = '#101820';

type Pin = { lat: number; lon: number };

/** East and west as each language abbreviates them (Ost, ouest, oeste). */
const EAST_WEST: Record<Lang, [string, string]> = { de: ['O', 'W'], en: ['E', 'W'], fr: ['E', 'O'], es: ['E', 'O'] };

/**
 * A drawn map: land outlines (Natural Earth), a grid of degrees with labels, and places. With
 * `onTap` the player can mark a spot (`marked`); `target` shows the right spot with its tolerance.
 */
export function MapView({
  width,
  region = WORLD,
  places = [],
  marked,
  target,
  onTap,
  label,
}: {
  width: number;
  region?: GeoBox;
  places?: { label: string; lat: number; lon: number }[];
  marked?: Pin | null;
  target?: Pin & { km: number; right: boolean };
  onTap?: (p: Pin) => void;
  label: string;
}) {
  const [east, west] = EAST_WEST[useStrings().lang];
  const h = mapHeight(region, width);
  const art = useMemo(() => ({ land: landPath(region, width, h), grid: gridLines(region) }), [region, width, h]);
  const at = (p: Pin) => project(region, width, h, p.lat, p.lon);

  const svg = (
    <Svg width={width} height={h}>
      <Rect x={0} y={0} width={width} height={h} fill={SEA} />
      <Path d={art.land} fill={LAND_FILL} stroke={COAST} strokeWidth={1} />
      {art.grid.lats.map((lat) => {
        const y = at({ lat, lon: region.west }).y;
        return (
          <Fragment key={`la${lat}`}>
            <Line x1={0} y1={y} x2={width} y2={y} stroke={GRID} strokeWidth={lat === 0 ? 1.4 : 0.7} strokeDasharray={lat === 0 ? undefined : '3 3'} />
            <SvgText x={3} y={y - 2} fontSize={9} fill={INK} opacity={0.7}>
              {`${Math.abs(lat)}°${lat > 0 ? 'N' : lat < 0 ? 'S' : ''}`}
            </SvgText>
          </Fragment>
        );
      })}
      {art.grid.lons.map((lon) => {
        const x = at({ lat: region.north, lon }).x;
        return (
          <Fragment key={`lo${lon}`}>
            <Line x1={x} y1={0} x2={x} y2={h} stroke={GRID} strokeWidth={0.7} strokeDasharray="3 3" />
            <SvgText x={x + 2} y={h - 3} fontSize={9} fill={INK} opacity={0.7}>
              {`${Math.abs(lon)}°${lon > 0 ? east : lon < 0 ? west : ''}`}
            </SvgText>
          </Fragment>
        );
      })}
      {places.map((p) => {
        const q = at(p);
        return (
          <Fragment key={p.label}>
            <Circle cx={q.x} cy={q.y} r={4} fill="#CC2F3D" stroke="#FFFFFF" strokeWidth={1.5} />
            <SvgText x={q.x + 6} y={q.y + 4} fontSize={11} fontWeight="bold" fill={INK}>
              {p.label}
            </SvgText>
          </Fragment>
        );
      })}
      {target
        ? (() => {
            const q = at(target);
            const { rx, ry } = toleranceRadii(region, width, h, target.lat, target.km);
            return (
              <>
                <Ellipse cx={q.x} cy={q.y} rx={rx} ry={ry} fill="#58CC02" opacity={0.25} stroke="#2E7D00" strokeWidth={1.5} />
                <Circle cx={q.x} cy={q.y} r={5} fill="#2E7D00" stroke="#FFFFFF" strokeWidth={1.5} />
              </>
            );
          })()
        : null}
      {marked
        ? (() => {
            const q = at(marked);
            const color = target ? (target.right ? '#2E7D00' : '#CC2F3D') : '#1C3FAA';
            return (
              <>
                <Line x1={q.x - 9} y1={q.y} x2={q.x + 9} y2={q.y} stroke={color} strokeWidth={3} />
                <Line x1={q.x} y1={q.y - 9} x2={q.x} y2={q.y + 9} stroke={color} strokeWidth={3} />
                {target ? <Line x1={q.x} y1={q.y} x2={at(target).x} y2={at(target).y} stroke={color} strokeWidth={1.5} strokeDasharray="4 3" /> : null}
              </>
            );
          })()
        : null}
    </Svg>
  );

  if (!onTap) {
    return (
      <View accessible accessibilityRole="image" accessibilityLabel={label} style={{ width, height: h }}>
        {svg}
      </View>
    );
  }
  return (
    <Pressable
      onPress={(e) => onTap(unproject(region, width, h, e.nativeEvent.locationX, e.nativeEvent.locationY))}
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      style={{ width, height: h }}
    >
      {svg}
    </Pressable>
  );
}
