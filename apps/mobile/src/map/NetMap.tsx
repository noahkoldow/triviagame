import {
  Atlas,
  Canvas,
  Circle,
  DashPathEffect,
  Group,
  LinearGradient,
  matchFont,
  Path,
  Rect,
  Skia,
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
  areaById,
  type Outpost,
  sectorOfArea,
  snapToHex,
  type NetNode,
  type Pool,
  type Sector,
} from '@nexus/shared';
import { colors, mix } from '../theme';
import {
  MAX_ZOOM,
  MIN_ZOOM,
  SQUASH,
  cameraTransform,
  clampCenter,
  dragToWorld,
  project,
} from './camera';
import { LIFT, makeHexAtlas } from './hexAtlas';
import { buildHexScene, ghostColor, type TraceEdge } from './hexmap';
import {
  CoreTile,
  NODE_DEPTH,
  NODE_R,
  NodeTile,
  OutpostTile,
  ShardTile,
  SiteTile,
  type NodeInfo,
  type Shard,
} from './NodeViews';
import { buildStrand, type Site } from './scenery';

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
  /** Disturbed areas still to be connected. */
  outposts?: Outpost[];
  onOutpost?: (id: string) => void;
  /** Debris field of the node the player is currently scavenging. */
  debris?: { center: { x: number; y: number }; color: string; shards: Shard[] };
  onShard?: (fragmentId: string) => void;
  onSelect: (id: string) => void;
}

const SECTOR_COLOR = colors.sector;

export function NetMap({
  nodes,
  pool,
  width,
  height,
  highlight,
  focusKey,
  focusId,
  focusZoom,
  showStrand = false,
  outposts = [],
  onOutpost,
  debris,
  onShard,
  onSelect,
}: Props) {
  const cx = useSharedValue(0);
  const cy = useSharedValue(0);
  const zoom = useSharedValue(0.9);
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [pulse]);

  const strand = useMemo(() => (showStrand ? buildStrand() : []), [showStrand]);
  const family = Platform.select({ ios: 'Helvetica', default: 'sans-serif' }) as string;
  const font = useMemo(() => matchFont({ fontFamily: family, fontSize: 13, fontWeight: '800' }), [family]);
  const atlas = useMemo(() => makeHexAtlas(), []);

  // every node sits on a hexagon cell
  const placed = useMemo(
    () => nodes.map((n) => ({ ...n, pos: { ...n.pos, ...snapToHex(n.pos.x, n.pos.y) } })),
    [nodes],
  );
  const byId = useMemo(() => Object.fromEntries(placed.map((n) => [n.id, n])), [placed]);

  const infos = useMemo(() => {
    const out: Record<string, NodeInfo> = {};
    for (const n of placed) {
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
  }, [placed, pool]);

  const sites = useMemo<Site[]>(() => {
    const real = placed.map<Site>((n) => {
      const area = pool.get(n.questionId).area;
      return {
        id: n.id,
        x: n.pos.x,
        y: n.pos.y,
        area,
        sector: sectorOfArea(area),
        state: n.locked ? 'locked' : n.state,
        noise: n.state === 'damaged' || (n.state === 'open' && n.attempts > 0),
      };
    });
    const far = outposts
      .filter((o) => !o.connected)
      .map<Site>((o) => ({
        id: o.id,
        ...snapToHex(o.x, o.y),
        area: o.area,
        sector: sectorOfArea(o.area),
        state: 'locked',
        noise: true,
      }));
    return [...real, ...far, ...strand];
  }, [placed, pool, strand, outposts]);

  const edges = useMemo<TraceEdge[]>(() => {
    const out: TraceEdge[] = [];
    for (const n of placed) {
      const info = infos[n.id]!;
      const lit = !n.locked && n.state !== 'open';
      const from = n.parentId ? byId[n.parentId]?.pos : { x: 0, y: 0 };
      if (from) out.push({ from, to: n.pos, sector: info.sector, lit });
    }
    strand.forEach((s, i) => {
      const from = i === 0 ? { x: 0, y: 0 } : strand[i - 1]!;
      out.push({ from, to: s, sector: s.sector, lit: false });
    });
    return out;
  }, [placed, infos, byId, strand]);

  const scene = useMemo(() => buildHexScene(sites, edges), [sites, edges]);

  // --- atlas instances (built once per scene; drawing them is one GPU call) ---
  const tileDraw = useMemo(() => {
    if (!atlas) return null;
    return {
      sprites: scene.tiles.map((t) => atlas.rects[t.level]!),
      transforms: scene.tiles.map((t) =>
        Skia.RSXform(1, 0, t.x - atlas.anchorX, t.y * SQUASH - LIFT[t.level]! - atlas.anchorY),
      ),
      colors: scene.tiles.map((t) => Skia.Color(t.color)),
    };
  }, [atlas, scene.tiles]);
  const ghostDraw = useMemo(() => {
    if (!atlas) return null;
    const outline = atlas.rects[atlas.rects.length - 1]!;
    return {
      sprites: scene.ghosts.map(() => outline),
      transforms: scene.ghosts.map((g) => Skia.RSXform(1, 0, g.x - atlas.anchorX, g.y * SQUASH - atlas.anchorY)),
      colors: scene.ghosts.map((g) => Skia.Color(ghostColor(g.band))),
    };
  }, [atlas, scene.ghosts]);

  // --- camera -------------------------------------------------------------
  const cam = useRef({ cx: 0, cy: 0, s: 0.9 });
  const sizeRef = useRef({ width, height });
  sizeRef.current = { width, height };
  const nodesRef = useRef(placed);
  nodesRef.current = placed;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onShardRef = useRef(onShard);
  onShardRef.current = onShard;
  const onOutpostRef = useRef(onOutpost);
  onOutpostRef.current = onOutpost;
  const openOutposts = useMemo(
    () => outposts.filter((o) => !o.connected).map((o) => ({ id: o.id, ...snapToHex(o.x, o.y) })),
    [outposts],
  );
  const outpostsRef = useRef(openOutposts);
  outpostsRef.current = openOutposts;
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
    const s = focusZoom ?? Math.max(cam.current.s, 1.1);
    cam.current = { cx: n.pos.x, cy: n.pos.y, s };
    cx.value = withTiming(n.pos.x, { duration: 450 });
    cy.value = withTiming(n.pos.y, { duration: 450 });
    zoom.value = withTiming(s, { duration: 450 });
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
            const p = project(x, y, s, w, h, sh.x, sh.y, 40);
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
          for (const o of outpostsRef.current) {
            const p = project(x, y, s, w, h, o.x, o.y, NODE_DEPTH);
            if (Math.hypot(p.x - tx, p.y - ty) <= Math.max(36, NODE_R * s + 8)) {
              onOutpostRef.current?.(o.id);
              return;
            }
          }
          let best: NetNode | null = null;
          let bd = Infinity;
          for (const n of nodesRef.current) {
            const p = project(x, y, s, w, h, n.pos.x, n.pos.y, NODE_DEPTH);
            const d = Math.hypot(p.x - tx, p.y - ty);
            if (d < bd) {
              bd = d;
              best = n;
            }
          }
          if (best && bd <= Math.max(36, NODE_R * s + 8)) onSelectRef.current(best.id);
        },
      });
    })(),
  ).current;

  const transform = useDerivedValue(() => cameraTransform(cx.value, cy.value, zoom.value, width, height));

  // things standing on the map, back to front
  const stack = useMemo(() => {
    const list: { y: number; node?: NetNode; shard?: Shard; site?: Site; outpost?: { id: string; x: number; y: number; area: string } }[] = [
      ...outposts
        .filter((o) => !o.connected)
        .map((o) => ({ ...o, ...snapToHex(o.x, o.y) }))
        .map((o) => ({ y: o.y, outpost: o })),
      ...placed.map((n) => ({ y: n.pos.y, node: n })),
      ...strand.map((s) => ({ y: s.y, site: s })),
      ...(debris?.shards ?? []).map((sh) => ({ y: sh.y, shard: sh })),
    ];
    return list.sort((a, b) => a.y - b.y);
  }, [placed, strand, debris, outposts]);

  return (
    <View
      style={{ width, height, backgroundColor: colors.bg }}
      {...responder.panHandlers}
      accessible
      accessibilityLabel="Netzkarte. Ziehen zum Verschieben, zwei Finger zum Zoomen, Knoten antippen."
    >
      <Canvas style={{ width, height }} pointerEvents="none">
        <Rect x={0} y={0} width={width} height={height}>
          <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={['#050A14', '#0A1424', '#0C182B']} />
        </Rect>

        <Group transform={transform}>
          {/* fog: faint outlines fading outward */}
          {atlas && ghostDraw ? (
            <Atlas image={atlas.image} sprites={ghostDraw.sprites} transforms={ghostDraw.transforms} colors={ghostDraw.colors} colorBlendMode="modulate" />
          ) : null}
          {/* land: all hexagon tiles in one call */}
          {atlas && tileDraw ? (
            <Atlas image={atlas.image} sprites={tileDraw.sprites} transforms={tileDraw.transforms} colors={tileDraw.colors} colorBlendMode="modulate" />
          ) : null}

          {/* circuit traces on top of the lit trace tiles */}
          {scene.traces.map((t) => (
            <Group key={t.color}>
              <Path path={t.path} style="stroke" strokeWidth={6} strokeCap="round" strokeJoin="round" color={t.color} opacity={0.9} />
              <Path path={t.path} style="stroke" strokeWidth={2} strokeCap="round" color="#FFFFFF" opacity={0.75}>
                <DashPathEffect intervals={[2, 12]} />
              </Path>
            </Group>
          ))}

          {debris ? (
            <Circle cx={debris.center.x} cy={debris.center.y * SQUASH} r={120} style="stroke" strokeWidth={3} color={debris.color} opacity={0.6}>
              <DashPathEffect intervals={[10, 9]} />
            </Circle>
          ) : null}

          <CoreTile />
          {stack.map((b) =>
            b.outpost ? (
              <OutpostTile
                key={`o-${b.outpost.id}`}
                x={b.outpost.x}
                y={b.outpost.y}
                color={SECTOR_COLOR[sectorOfArea(b.outpost.area)]}
                label={areaById(b.outpost.area).de}
                font={font}
                pulse={pulse}
              />
            ) : b.shard ? (
              <ShardTile key={`s-${b.shard.id}`} shard={b.shard} color={debris!.color} font={font} />
            ) : b.node ? (
              <NodeTile
                key={`n-${b.node.id}`}
                info={infos[b.node.id]!}
                pulse={pulse}
                highlighted={highlight.includes(b.node.id)}
                font={font}
              />
            ) : (
              <SiteTile key={`p-${b.site!.id}`} x={b.site!.x} y={b.site!.y} color={SECTOR_COLOR[b.site!.sector]} />
            ),
          )}
        </Group>

        {/* soft edges of the screen */}
        <Rect x={0} y={0} width={width} height={height * 0.3}>
          <LinearGradient start={vec(0, 0)} end={vec(0, height * 0.3)} colors={['#050A14E6', '#050A1400']} />
        </Rect>
        <Rect x={0} y={height * 0.82} width={width} height={height * 0.18}>
          <LinearGradient start={vec(0, height * 0.82)} end={vec(0, height)} colors={['#0C182B00', '#0C182BDD']} />
        </Rect>
      </Canvas>
    </View>
  );
}
