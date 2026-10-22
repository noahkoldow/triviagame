import {
  Canvas,
  Circle,
  Group,
  LinearGradient,
  matchFont,
  Path,
  Rect,
  vec,
} from '@shopify/react-native-skia';
import { useEffect, useMemo, useRef } from 'react';
import { PanResponder, Platform, View } from 'react-native';
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { areaById, sectorOfArea, type NetNode, type Pool, type Sector } from '@nexus/shared';
import { colors, mix } from '../theme';
import {
  MAX_ZOOM,
  MIN_ZOOM,
  cameraMatrix,
  clampCenter,
  dragToWorld,
  projectBillboard,
} from './camera';
import {
  CoreBeam,
  CoreView,
  EdgeView,
  NodeBillboard,
  NodeGround,
  ShardBillboard,
  ShardGround,
  SiteBillboard,
  nodeRadius,
  orbHeight,
  type NodeInfo,
  type Shard,
} from './NodeViews';
import {
  buildClouds,
  buildLand,
  buildProps,
  buildStrand,
  siteRadius,
  type Disc,
  type Site,
} from './scenery';

interface Props {
  nodes: NetNode[];
  pool: Pool;
  width: number;
  height: number;
  highlight: string[];
  /** Change to move the camera to `focusId`. */
  focusKey: number;
  focusId?: string;
  focusZoom?: number;
  showStrand?: boolean;
  /** Debris field of the node the player is currently scavenging. */
  debris?: { center: { x: number; y: number }; color: string; shards: Shard[] };
  onShard?: (fragmentId: string) => void;
  onSelect: (id: string) => void;
}

const SECTOR_COLOR = colors.sector;
/** Number of stacked slices that make the cliff wall below the land. */
const WALL_SLICES = 9;
const SLICE = 4.5;

export function NetMap({
  nodes,
  pool,
  width,
  height,
  highlight,
  focusKey,
  focusId,
  focusZoom,
  showStrand = true,
  debris,
  onShard,
  onSelect,
}: Props) {
  const cx = useSharedValue(0);
  const cy = useSharedValue(0);
  const zoom = useSharedValue(0.7);
  const pulse = useSharedValue(0);
  const drift = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.quad) }), -1, true);
    drift.value = withRepeat(withTiming(1, { duration: 50000, easing: Easing.linear }), -1, true);
  }, [pulse, drift]);

  const strand = useMemo(() => (showStrand ? buildStrand() : []), [showStrand]);
  const family = Platform.select({ ios: 'Helvetica', default: 'sans-serif' }) as string;
  const font = useMemo(() => matchFont({ fontFamily: family, fontSize: 13, fontWeight: '800' }), [family]);
  const chipFont = useMemo(() => matchFont({ fontFamily: family, fontSize: 12, fontWeight: '800' }), [family]);

  const infos = useMemo(() => {
    const out: Record<string, NodeInfo> = {};
    for (const n of nodes) {
      const q = pool.get(n.questionId);
      const sector = sectorOfArea(q.area);
      const color = SECTOR_COLOR[sector];
      let ring = color;
      for (const [s, w] of Object.entries(q.side ?? {}) as [Sector, number][]) {
        if (w) ring = mix(ring, SECTOR_COLOR[s], Math.min(0.6, w * 1.6));
      }
      out[n.id] = { node: n, color, ring, label: areaById(q.area).de, sector };
    }
    return out;
  }, [nodes, pool]);

  const nodeList = useMemo(() => nodes.filter((n) => infos[n.id]), [nodes, infos]);

  // places that get land and scenery
  const sites = useMemo<Site[]>(() => {
    const real = nodeList.map<Site>((n) => {
      const area = pool.get(n.questionId).area;
      return {
        id: n.id,
        x: n.pos.x,
        y: n.pos.y,
        area,
        sector: sectorOfArea(area),
        state: n.locked ? 'locked' : n.state,
      };
    });
    return [...real, ...strand];
  }, [nodeList, pool, strand]);

  const land = useMemo(() => buildLand(sites), [sites]);
  const props = useMemo(() => buildProps(sites), [sites]);
  const discs = useMemo<Disc[]>(
    () => [{ x: 0, y: 0, r: 330 }, ...sites.map((s) => ({ x: s.x, y: s.y, r: siteRadius(s) }))],
    [sites],
  );
  // clouds far below the island, and mist drifting above the unexplored
  const deepClouds = useMemo(() => buildClouds(discs, 70, 'deep', 380, 3400), [discs]);
  const mist = useMemo(() => buildClouds(discs, 26, 'mist', 520, 2600), [discs]);

  // --- camera -------------------------------------------------------------
  const cam = useRef({ cx: 0, cy: 0, s: 0.7 });
  const sizeRef = useRef({ width, height });
  sizeRef.current = { width, height };
  const nodesRef = useRef(nodeList);
  nodesRef.current = nodeList;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onShardRef = useRef(onShard);
  onShardRef.current = onShard;
  const shardsRef = useRef<Shard[]>([]);
  shardsRef.current = debris?.shards ?? [];

  const setCam = (x: number, y: number, s: number) => {
    cam.current = { cx: x, cy: y, s };
    cx.value = x;
    cy.value = y;
    zoom.value = s;
  };

  useEffect(() => {
    if (!focusId) return;
    const n = nodesRef.current.find((x) => x.id === focusId);
    if (!n) return;
    const s = focusZoom ?? Math.max(cam.current.s, 0.9);
    cam.current = { cx: n.pos.x, cy: n.pos.y, s };
    cx.value = withTiming(n.pos.x, { duration: 500 });
    cy.value = withTiming(n.pos.y, { duration: 500 });
    zoom.value = withTiming(s, { duration: 500 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey]);

  const responder = useRef(
    (() => {
      let base = { cx: 0, cy: 0 };
      let gBase = { dx: 0, dy: 0 };
      let pinch: { d0: number; s0: number } | null = null;
      let moved = false;
      return PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          base = { cx: cam.current.cx, cy: cam.current.cy };
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
            const s = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, (pinch.s0 * d) / pinch.d0));
            setCam(cam.current.cx, cam.current.cy, s);
            base = { cx: cam.current.cx, cy: cam.current.cy };
            gBase = { dx: g.dx, dy: g.dy };
            moved = true;
          } else {
            pinch = null;
            const d = dragToWorld(g.dx - gBase.dx, g.dy - gBase.dy, cam.current.s);
            const c = clampCenter(base.cx - d.x, base.cy - d.y);
            setCam(c.x, c.y, cam.current.s);
          }
        },
        onPanResponderRelease: (e) => {
          if (moved) return;
          const { width: w, height: h } = sizeRef.current;
          const { cx: x, cy: y, s } = cam.current;
          const tx = e.nativeEvent.locationX;
          const ty = e.nativeEvent.locationY;
          let sBest: Shard | null = null;
          let sd = Infinity;
          for (const sh of shardsRef.current) {
            const p = projectBillboard(x, y, s, w, h, sh.x, sh.y, 40);
            const d = Math.hypot(p.x - tx, p.y - ty);
            if (d < sd) {
              sd = d;
              sBest = sh;
            }
          }
          if (sBest && sd <= 42) {
            onShardRef.current?.(sBest.id);
            return;
          }
          let best: NetNode | null = null;
          let bd = Infinity;
          for (const n of nodesRef.current) {
            const p = projectBillboard(x, y, s, w, h, n.pos.x, n.pos.y, orbHeight(n.pos.z));
            const d = Math.hypot(p.x - tx, p.y - ty);
            if (d < bd) {
              bd = d;
              best = n;
            }
          }
          if (best && bd <= Math.max(36, nodeRadius(best.pos.z) * s + 16)) onSelectRef.current(best.id);
        },
      });
    })(),
  ).current;

  // --- layers: every layer is the same camera, lifted along the world's up axis,
  // so the parallax between them comes from the perspective, not from a trick.
  const ground = useDerivedValue(() => cameraMatrix(cx.value, cy.value, zoom.value, width, height));
  const deep = useDerivedValue(() => cameraMatrix(cx.value, cy.value, zoom.value, width, height, -190));
  const mistM = useDerivedValue(() =>
    cameraMatrix(cx.value + (drift.value - 0.5) * 600, cy.value, zoom.value, width, height, 70),
  );

  const billboards = useMemo(() => {
    const list: { y: number; node?: NetNode; site?: Site; shard?: Shard }[] = [
      ...nodeList.map((n) => ({ y: n.pos.y, node: n })),
      ...strand.map((s) => ({ y: s.y, site: s })),
      ...(debris?.shards ?? []).map((sh) => ({ y: sh.y, shard: sh })),
    ];
    return list.sort((a, b) => a.y - b.y);
  }, [nodeList, strand, debris]);

  const edges = nodeList.filter((n) => n.parentId && infos[n.parentId]);

  return (
    <View
      style={{ width, height, backgroundColor: colors.bg }}
      {...responder.panHandlers}
      accessible
      accessibilityLabel="Netzkarte in 3D. Ziehen zum Verschieben, zwei Finger zum Zoomen, Knoten antippen."
    >
      <Canvas style={{ width, height }} pointerEvents="none">
        {/* sky: deep blue above, a bright glow at the horizon */}
        <Rect x={0} y={0} width={width} height={height}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, height)}
            colors={['#102A43', '#1D5A86', '#58B7E0', '#A9E3F5']}
            positions={[0, 0.3, 0.55, 1]}
          />
        </Rect>

        {/* far clouds, deep below the island */}
        <Group matrix={deep}>
          <Path path={deepClouds.shade} color="#7DB6D8" />
          <Path path={deepClouds.light} color="#E8F6FF" opacity={0.95} />
        </Group>

        <Group matrix={ground}>
          {/* cliff: stacked slices of the land, each a little lower and darker */}
          {Array.from({ length: WALL_SLICES }, (_, i) => WALL_SLICES - i).map((k) => (
            <Group key={`w${k}`} transform={[{ translateZ: -k * SLICE }]}>
              {land.walls.map((w) => (
                <Path key={w.color} path={w.path} color={w.color} />
              ))}
            </Group>
          ))}
          {/* surface with a light rim */}
          {land.rims.map((r) => (
            <Path key={`r${r.color}`} path={r.path} color={r.color} />
          ))}
          {land.tops.map((t) => (
            <Path key={`t${t.color}`} path={t.path} color={t.color} />
          ))}
          {/* the core's circuit rings */}
          {[130, 215, 290].map((r) => (
            <Circle key={r} cx={0} cy={0} r={r} style="stroke" strokeWidth={3} color="#4A606C" opacity={0.55} />
          ))}

          {edges.map((n) => {
            const p = infos[n.parentId!]!;
            const c = infos[n.id]!;
            return (
              <EdgeView
                key={`e-${n.id}`}
                id={n.id}
                from={p.node.pos}
                to={n.pos}
                c1={p.color}
                c2={c.color}
                alpha={n.state === 'open' ? (p.node.state !== 'open' ? 1 : 0.55) : 1}
                dashed={n.state === 'open' || !!n.locked}
              />
            );
          })}
          {nodeList
            .filter((n) => !n.parentId)
            .map((n) => (
              <EdgeView key={`core-${n.id}`} id={`core-${n.id}`} from={{ x: 0, y: 0 }} to={n.pos} c1={colors.accent} c2={infos[n.id]!.color} alpha={1} dashed={false} />
            ))}
          {strand.map((s, i) => (
            <EdgeView
              key={`se-${s.id}`}
              id={`se-${s.id}`}
              from={i === 0 ? { x: 0, y: 0 } : strand[i - 1]!}
              to={s}
              c1={i === 0 ? colors.accent : SECTOR_COLOR[strand[i - 1]!.sector]}
              c2={SECTOR_COLOR[s.sector]}
              alpha={0.8}
              dashed
            />
          ))}

          {/* scenery: little upright objects, merged into a few paths */}
          {props.map((p) => (
            <Path key={p.key} path={p.path} color={p.color} opacity={p.opacity} />
          ))}

          <CoreView />
          {debris ? (
            <Group>
              <Circle cx={debris.center.x} cy={debris.center.y} r={150} color={debris.color} opacity={0.14} />
              <Circle cx={debris.center.x} cy={debris.center.y} r={150} style="stroke" strokeWidth={4} color="#FFFFFF" opacity={0.55} />
              {debris.shards.map((sh) => (
                <ShardGround key={`sg-${sh.id}`} shard={sh} color={debris.color} />
              ))}
            </Group>
          ) : null}
          {nodeList.map((n) => (
            <NodeGround key={`g-${n.id}`} info={infos[n.id]!} pulse={pulse} highlighted={highlight.includes(n.id)} />
          ))}

          {/* upright things, far to near */}
          <CoreBeam />
          {billboards.map((b) =>
            b.shard ? (
              <ShardBillboard key={`sb-${b.shard.id}`} shard={b.shard} color={debris!.color} font={chipFont} />
            ) : b.node ? (
              <NodeBillboard key={`o-${b.node.id}`} info={infos[b.node.id]!} font={font} boldFont={font} />
            ) : (
              <SiteBillboard key={`o-${b.site!.id}`} site={b.site!} color={SECTOR_COLOR[b.site!.sector]} font={chipFont} />
            ),
          )}
        </Group>

        {/* mist drifting over the unexplored: the fog */}
        <Group matrix={mistM}>
          <Path path={mist.light} color="#FFFFFF" opacity={0.42} />
        </Group>

        {/* atmosphere in screen space */}
        <Rect x={0} y={0} width={width} height={height * 0.36}>
          <LinearGradient start={vec(0, 0)} end={vec(0, height * 0.36)} colors={['#102A43E6', '#102A4300']} />
        </Rect>
        <Rect x={0} y={height * 0.8} width={width} height={height * 0.2}>
          <LinearGradient start={vec(0, height * 0.8)} end={vec(0, height)} colors={['#13202400', '#132024DD']} />
        </Rect>
      </Canvas>
    </View>
  );
}
