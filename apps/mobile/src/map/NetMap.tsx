import {
  Canvas,
  Circle,
  DashPathEffect,
  Group,
  LinearGradient,
  matchFont,
  Path,
  RadialGradient,
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
import {
  SECTORS,
  SECTOR_ANGLE,
  areaById,
  seededRng,
  sectorOfArea,
  type NetNode,
  type Pool,
  type Sector,
} from '@nexus/shared';
import { colors, mix } from '../theme';
import {
  MAX_ZOOM,
  MIN_ZOOM,
  cameraMatrix,
  clampCenter,
  dragToWorld,
  projectBillboard,
} from './camera';
import { buildDecor } from './decor';
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
import { areaTint, buildScenery, buildStrand, type Site } from './scenery';

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
const FOG = '#05080F';
/** How far the cleared area reaches around a place. */
const REVEAL = { core: 320, solved: 240, open: 200, locked: 120, preview: 230 };

interface Reveal {
  x: number;
  y: number;
  r: number;
}

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
    pulse.value = withRepeat(withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }), -1, true);
    drift.value = withRepeat(withTiming(1, { duration: 45000, easing: Easing.linear }), -1, true);
  }, [pulse, drift]);

  const decor = useMemo(() => buildDecor(420), []);
  const strand = useMemo(() => (showStrand ? buildStrand() : []), [showStrand]);
  const family = Platform.select({ ios: 'Helvetica', default: 'sans-serif' }) as string;
  const font = useMemo(() => matchFont({ fontFamily: family, fontSize: 12, fontWeight: '600' }), [family]);
  const boldFont = useMemo(() => matchFont({ fontFamily: family, fontSize: 22, fontWeight: '800' }), [family]);

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
      out[n.id] = { node: n, color, ring, label: areaById(q.area).de };
    }
    return out;
  }, [nodes, pool]);

  const nodeList = useMemo(() => nodes.filter((n) => infos[n.id]), [nodes, infos]);

  // places that get scenery and clear the fog
  const sites = useMemo<Site[]>(() => {
    const real = nodeList.map<Site>((n) => ({
      id: n.id,
      x: n.pos.x,
      y: n.pos.y,
      area: pool.get(n.questionId).area,
      sector: sectorOfArea(pool.get(n.questionId).area),
      state: n.locked ? 'locked' : n.state,
    }));
    return [...real, ...strand];
  }, [nodeList, pool, strand]);
  const scenery = useMemo(() => buildScenery(sites), [sites]);

  const reveals = useMemo<Reveal[]>(
    () => [
      { x: 0, y: 0, r: REVEAL.core },
      ...sites.map((s) => ({
        x: s.x,
        y: s.y,
        r: s.state === 'preview' ? REVEAL.preview : s.state === 'locked' ? REVEAL.locked : s.state === 'open' ? REVEAL.open : REVEAL.solved,
      })),
    ],
    [sites],
  );

  // drifting mist outside the cleared area
  const wisps = useMemo(() => {
    const rng = seededRng('nexus-wisps');
    const out: { x: number; y: number; r: number; key: number }[] = [];
    for (let i = 0; i < 26; i++) {
      const a = rng() * Math.PI * 2;
      const r = 450 + rng() * 2000;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (reveals.some((v) => Math.hypot(v.x - x, v.y - y) < v.r + 120)) continue;
      out.push({ x, y, r: 180 + rng() * 200, key: i });
    }
    return out;
  }, [reveals]);

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
            const p = projectBillboard(x, y, s, w, h, sh.x, sh.y, 38);
            const d = Math.hypot(p.x - tx, p.y - ty);
            if (d < sd) {
              sd = d;
              sBest = sh;
            }
          }
          if (sBest && sd <= 40) {
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
          if (best && bd <= Math.max(34, nodeRadius(best.pos.z) * s + 14)) onSelectRef.current(best.id);
        },
      });
    })(),
  ).current;

  // --- layers: every layer is the same camera, lifted along the world's up axis,
  // so the parallax between them comes from the perspective, not from a trick.
  const ground = useDerivedValue(() => cameraMatrix(cx.value, cy.value, zoom.value, width, height));
  const far = useDerivedValue(() => cameraMatrix(cx.value, cy.value, zoom.value, width, height, -320));
  const mist = useDerivedValue(() =>
    cameraMatrix(cx.value + (drift.value - 0.5) * 500, cy.value, zoom.value, width, height, 110),
  );
  // the fog sheet follows the camera so it never reaches behind it
  const fogX = useDerivedValue(() => cx.value - 3200);
  const fogY = useDerivedValue(() => cy.value - 3400);
  const fogH = useDerivedValue(() => 3400 + 700 / zoom.value);

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
        {/* sky */}
        <Rect x={0} y={0} width={width} height={height}>
          <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={['#03050B', '#08101F', '#0B1428']} />
        </Rect>

        {/* deep layer: sector glows far below the ground */}
        <Group matrix={far}>
          {SECTORS.map((s) => {
            const x = Math.cos(SECTOR_ANGLE[s]) * 700;
            const y = Math.sin(SECTOR_ANGLE[s]) * 700;
            return (
              <Circle key={s} cx={x} cy={y} r={800}>
                <RadialGradient c={vec(x, y)} r={800} colors={[SECTOR_COLOR[s] + '40', SECTOR_COLOR[s] + '00']} />
              </Circle>
            );
          })}
        </Group>

        {/* ground plane */}
        <Group matrix={ground}>
          <Path path={decor.circuit} style="stroke" strokeWidth={1.4} color="#67E8F9" opacity={0.22} />
          <Path path={decor.pads} color="#67E8F9" opacity={0.32} />
          {SECTORS.map((s) => (
            <Group key={s}>
              <Path path={decor.motifs[s].stroke} style="stroke" strokeWidth={1.6} strokeCap="round" color={SECTOR_COLOR[s]} opacity={0.22} />
              <Path path={decor.motifs[s].fill} color={SECTOR_COLOR[s]} opacity={0.28} />
            </Group>
          ))}

          {/* biome under each place, tinted by the question's area */}
          {sites.map((s) =>
            s.state === 'locked' ? null : (
              <Circle key={`b-${s.id}`} cx={s.x} cy={s.y} r={250}>
                <RadialGradient
                  c={vec(s.x, s.y)}
                  r={250}
                  colors={[mix(SECTOR_COLOR[s.sector], '#FFFFFF', areaTint(s.area) * 0.25) + '40', SECTOR_COLOR[s.sector] + '00']}
                />
              </Circle>
            ),
          )}
          {/* generated scenery: one set per area that has questions on the map */}
          {scenery.map((a) => {
            const c = mix(SECTOR_COLOR[a.sector], '#FFFFFF', areaTint(a.area) * 0.3);
            return (
              <Group key={a.area}>
                <Path path={a.stroke} style="stroke" strokeWidth={1.8} strokeCap="round" strokeJoin="round" color={c} opacity={0.6} />
                <Path path={a.fill} color={c} opacity={0.7} />
              </Group>
            );
          })}

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
                alpha={n.state === 'open' ? (p.node.state !== 'open' ? 0.75 : 0.3) : 1}
                dashed={n.state === 'open' || !!n.locked}
              />
            );
          })}
          {nodeList
            .filter((n) => !n.parentId)
            .map((n) => (
              <EdgeView key={`core-${n.id}`} id={`core-${n.id}`} from={{ x: 0, y: 0 }} to={n.pos} c1={colors.accent} c2={infos[n.id]!.color} alpha={0.9} dashed={false} />
            ))}
          {strand.map((s, i) => (
            <EdgeView
              key={`se-${s.id}`}
              id={`se-${s.id}`}
              from={i === 0 ? { x: 0, y: 0 } : strand[i - 1]!}
              to={s}
              c1={i === 0 ? colors.accent : SECTOR_COLOR[strand[i - 1]!.sector]}
              c2={SECTOR_COLOR[s.sector]}
              alpha={0.5}
              dashed
            />
          ))}
          <CoreView />
          {debris ? (
            <Group>
              <Circle cx={debris.center.x} cy={debris.center.y} r={150} style="stroke" strokeWidth={2} color={debris.color} opacity={0.5}>
                <DashPathEffect intervals={[10, 9]} />
              </Circle>
              <Circle cx={debris.center.x} cy={debris.center.y} r={150} color={debris.color} opacity={0.06} />
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
              <ShardBillboard key={`sb-${b.shard.id}`} shard={b.shard} color={debris!.color} font={font} />
            ) : b.node ? (
              <NodeBillboard key={`o-${b.node.id}`} info={infos[b.node.id]!} font={font} boldFont={boldFont} />
            ) : (
              <SiteBillboard key={`o-${b.site!.id}`} site={b.site!} color={SECTOR_COLOR[b.site!.sector]} font={font} />
            ),
          )}

          {/* fog of the unexplored: opaque sheet with soft holes where the network reaches */}
          <Group layer>
            <Rect x={fogX} y={fogY} width={6400} height={fogH} color={FOG} opacity={0.97} />
            {reveals.map((v, i) => (
              <Circle key={i} cx={v.x} cy={v.y} r={v.r} blendMode="dstOut">
                <RadialGradient c={vec(v.x, v.y)} r={v.r} colors={['#000000FF', '#000000E6', '#00000000']} positions={[0, 0.55, 1]} />
              </Circle>
            ))}
          </Group>
        </Group>

        {/* mist drifting above the ground, only over unexplored land */}
        <Group matrix={mist}>
          {wisps.map((w) => (
            <Circle key={w.key} cx={w.x} cy={w.y} r={w.r}>
              <RadialGradient c={vec(w.x, w.y)} r={w.r} colors={['#9FB4D844', '#9FB4D800']} />
            </Circle>
          ))}
        </Group>

        {/* atmosphere in screen space: haze at the horizon, soft vignette below */}
        <Rect x={0} y={0} width={width} height={height * 0.4}>
          <LinearGradient start={vec(0, 0)} end={vec(0, height * 0.4)} colors={['#05080FF2', '#05080F00']} />
        </Rect>
        <Rect x={0} y={height * 0.78} width={width} height={height * 0.22}>
          <LinearGradient start={vec(0, height * 0.78)} end={vec(0, height)} colors={['#05080F00', '#05080FCC']} />
        </Rect>
      </Canvas>
    </View>
  );
}
