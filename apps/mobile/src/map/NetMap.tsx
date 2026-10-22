import {
  Canvas,
  Circle,
  Group,
  matchFont,
  Path,
  RadialGradient,
  Rect,
  vec,
} from '@shopify/react-native-skia';
import { useEffect, useMemo, useRef } from 'react';
import { PanResponder, Platform, View } from 'react-native';
import {
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  SECTORS,
  SECTOR_ANGLE,
  areaById,
  sectorOfArea,
  type NetNode,
  type Pool,
  type Sector,
} from '@nexus/shared';
import { colors, mix } from '../theme';
import { buildDecor } from './decor';
import { CoreView, EdgeView, NodeView, nodeRadius, type NodeInfo } from './NodeViews';

interface Props {
  nodes: NetNode[];
  pool: Pool;
  width: number;
  height: number;
  highlight: string[];
  /** Change to re-centre the camera on `focusId`. */
  focusKey: number;
  focusId?: string;
  onSelect: (id: string) => void;
}

const SECTOR_COLOR = colors.sector;
const MIN_S = 0.35;
const MAX_S = 2.2;

export function NetMap({
  nodes,
  pool,
  width,
  height,
  highlight,
  focusKey,
  focusId,
  onSelect,
}: Props) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const scale = useSharedValue(0.85);
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse]);

  const decor = useMemo(() => buildDecor(), []);
  const family = Platform.select({ ios: 'Helvetica', default: 'sans-serif' }) as string;
  const font = useMemo(
    () => matchFont({ fontFamily: family, fontSize: 11, fontWeight: '600' }),
    [family],
  );
  const boldFont = useMemo(
    () => matchFont({ fontFamily: family, fontSize: 22, fontWeight: '800' }),
    [family],
  );

  const infos = useMemo(() => {
    const out: Record<string, NodeInfo> = {};
    for (const n of nodes) {
      const q = pool.get(n.questionId);
      const sector = sectorOfArea(q.area);
      const color = SECTOR_COLOR[sector];
      let ring = color;
      // small colour bend toward the side sector, proportional to its weight
      for (const [s, w] of Object.entries(q.side ?? {}) as [Sector, number][]) {
        if (w) ring = mix(ring, SECTOR_COLOR[s], Math.min(0.6, w * 1.6));
      }
      out[n.id] = { node: n, color, ring, label: areaById(q.area).de };
    }
    return out;
  }, [nodes, pool]);

  // --- camera -------------------------------------------------------------
  const cam = useRef({ tx: 0, ty: 0, s: 0.85 });
  const sizeRef = useRef({ width, height });
  sizeRef.current = { width, height };
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const setCam = (x: number, y: number, s: number) => {
    cam.current = { tx: x, ty: y, s };
    tx.value = x;
    ty.value = y;
    scale.value = s;
  };

  useEffect(() => {
    if (!focusId) return;
    const n = nodesRef.current.find((x) => x.id === focusId);
    if (!n) return;
    const s = Math.max(cam.current.s, 0.9);
    cam.current = { tx: -n.pos.x * s, ty: -n.pos.y * s, s };
    tx.value = withTiming(-n.pos.x * s, { duration: 450 });
    ty.value = withTiming(-n.pos.y * s, { duration: 450 });
    scale.value = withTiming(s, { duration: 450 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey]);

  const responder = useRef(
    (() => {
      let base = { tx: 0, ty: 0 };
      let gBase = { dx: 0, dy: 0 };
      let pinch: { d0: number; s0: number } | null = null;
      let moved = false;
      return PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          base = { tx: cam.current.tx, ty: cam.current.ty };
          gBase = { dx: 0, dy: 0 };
          pinch = null;
          moved = false;
        },
        onPanResponderMove: (e, g) => {
          if (Math.abs(g.dx) + Math.abs(g.dy) > 8) moved = true;
          const t = e.nativeEvent.touches;
          if (t.length >= 2) {
            const a = t[0]!;
            const b = t[1]!;
            const d = Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
            if (!pinch) pinch = { d0: d, s0: cam.current.s };
            const s = Math.min(MAX_S, Math.max(MIN_S, (pinch.s0 * d) / pinch.d0));
            setCam(cam.current.tx, cam.current.ty, s);
            base = { tx: cam.current.tx, ty: cam.current.ty };
            gBase = { dx: g.dx, dy: g.dy };
            moved = true;
          } else {
            pinch = null;
            setCam(base.tx + (g.dx - gBase.dx), base.ty + (g.dy - gBase.dy), cam.current.s);
          }
        },
        onPanResponderRelease: (e) => {
          if (moved) return;
          const { width: w, height: h } = sizeRef.current;
          const { tx: cx, ty: cy, s } = cam.current;
          const wx = (e.nativeEvent.locationX - w / 2 - cx) / s;
          const wy = (e.nativeEvent.locationY - h / 2 - cy) / s;
          let best: NetNode | null = null;
          let bd = Infinity;
          for (const n of nodesRef.current) {
            const d = Math.hypot(n.pos.x - wx, n.pos.y - wy);
            if (d < bd) {
              bd = d;
              best = n;
            }
          }
          // generous touch target (min ~ 28 px on screen)
          if (best && bd <= Math.max(nodeRadius(best.pos.z) + 8, 28 / s))
            onSelectRef.current(best.id);
        },
      });
    })(),
  ).current;

  // --- layers (parallax: far layers move less, which gives the 2.5D feel) ---
  const layer = (k: number) =>
    useDerivedValue(() => [
      { translateX: width / 2 + tx.value * k },
      { translateY: height / 2 + ty.value * k },
      { scale: 1 + (scale.value - 1) * k },
    ]);
  const far = layer(0.45);
  const mid = layer(0.8);
  const main = layer(1);

  const nodeList = nodes.filter((n) => infos[n.id]);
  const edges = nodeList.filter((n) => n.parentId && infos[n.parentId]);

  return (
    <View
      style={{ width, height, backgroundColor: colors.bg }}
      {...responder.panHandlers}
      accessible
      accessibilityLabel="Netzkarte. Ziehen zum Verschieben, zwei Finger zum Zoomen, Knoten antippen."
    >
      <Canvas style={{ width, height }} pointerEvents="none">
        <Rect x={0} y={0} width={width} height={height} color={colors.bg} />

        {/* far layer: sector glows */}
        <Group transform={far}>
          {SECTORS.map((s) => {
            const cx = Math.cos(SECTOR_ANGLE[s]) * 650;
            const cy = Math.sin(SECTOR_ANGLE[s]) * 650;
            return (
              <Circle key={s} cx={cx} cy={cy} r={720}>
                <RadialGradient
                  c={vec(cx, cy)}
                  r={720}
                  colors={[SECTOR_COLOR[s] + '3A', SECTOR_COLOR[s] + '00']}
                />
              </Circle>
            );
          })}
        </Group>

        {/* mid layer: circuit traces near the core, sector scenery further out */}
        <Group transform={mid}>
          <Path
            path={decor.circuit}
            style="stroke"
            strokeWidth={1.4}
            color="#67E8F9"
            opacity={0.2}
          />
          <Path path={decor.pads} color="#67E8F9" opacity={0.3} />
          {SECTORS.map((s) => (
            <Group key={s}>
              <Path
                path={decor.motifs[s].stroke}
                style="stroke"
                strokeWidth={1.6}
                strokeCap="round"
                color={SECTOR_COLOR[s]}
                opacity={0.34}
              />
              <Path path={decor.motifs[s].fill} color={SECTOR_COLOR[s]} opacity={0.42} />
            </Group>
          ))}
        </Group>

        {/* main layer */}
        <Group transform={main}>
          {edges.map((n) => {
            const p = infos[n.parentId!]!;
            const c = infos[n.id]!;
            const parentSolved = p.node.state !== 'open';
            return (
              <EdgeView
                key={`e-${n.id}`}
                id={n.id}
                from={p.node.pos}
                to={n.pos}
                c1={p.color}
                c2={c.color}
                alpha={n.state === 'open' ? (parentSolved ? 0.75 : 0.3) : 1}
                dashed={n.state === 'open' || !!n.locked}
              />
            );
          })}
          {nodeList
            .filter((n) => !n.parentId)
            .map((n) => (
              <EdgeView
                key={`core-${n.id}`}
                id={`core-${n.id}`}
                from={{ x: 0, y: 0 }}
                to={n.pos}
                c1={colors.accent}
                c2={infos[n.id]!.color}
                alpha={0.9}
                dashed={false}
              />
            ))}
          <CoreView />
          {nodeList.map((n) => (
            <NodeView
              key={n.id}
              info={infos[n.id]!}
              font={font}
              boldFont={boldFont}
              pulse={pulse}
              highlighted={highlight.includes(n.id)}
            />
          ))}
        </Group>
      </Canvas>
    </View>
  );
}
