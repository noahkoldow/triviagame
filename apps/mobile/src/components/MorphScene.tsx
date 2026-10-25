import {
  Canvas,
  Group,
  Line,
  LinearGradient,
  Path,
  Rect,
  RoundedRect,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import { HEX_R, hashString } from '@nexus/shared';
import { colors, mix } from '../theme';
import {
  SOURCE,
  buildCells,
  buildLinks,
  cellState,
  noiseActivity,
  speckles,
  type CellState,
} from './morphScene.logic';

/** The scene ticks slowly: at most three changes per second, which keeps it clear of flashing-content limits. */
const TICK_MS = 360;
const ATTACK_MS = 5200;
const REPAIR_MS = 2600;

const R = HEX_R - 2;
const DEPTH = 6;

function hexPath(offsetY = 0) {
  const b = Skia.PathBuilder.Make();
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 3;
    const x = Math.cos(a) * R;
    const y = Math.sin(a) * R + offsetY;
    if (i === 0) b.moveTo(x, y);
    else b.lineTo(x, y);
  }
  b.close();
  return b.detach();
}
const HEX_TOP = hexPath();
const HEX_WALL = hexPath(DEPTH);

const NOISE = ['#FF4B8B', '#1CB0F6', '#B46BFF', '#0A121C', '#2A1A3A'];
const SPECK = ['#FF4B8B', '#1CB0F6', '#FFFFFF', '#B46BFF'];

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** MORPH's emblem: six interlocking loops around a hexagon, an original mark for this game. */
function Emblem({ size, spin, jitter, opacity }: { size: number; spin: number; jitter: number; opacity: number }) {
  const loops = (color: string, dx: number, o: number, w: number) => (
    <Group transform={[{ translateX: dx }]} opacity={o}>
      {Array.from({ length: 6 }, (_, k) => (
        <Group key={k} transform={[{ rotate: spin + (k * Math.PI) / 3 }, { translateY: -size * 0.3 }]}>
          <RoundedRect
            x={-size * 0.19}
            y={-size * 0.3}
            width={size * 0.38}
            height={size * 0.6}
            r={size * 0.19}
            style="stroke"
            strokeWidth={w}
            color={color}
          />
        </Group>
      ))}
    </Group>
  );
  return (
    <Group opacity={opacity}>
      {loops('#1CB0F6', -jitter, 0.75, size * 0.07)}
      {loops('#FF4B8B', jitter, 0.75, size * 0.07)}
      {loops('#F5EEFF', 0, 1, size * 0.055)}
    </Group>
  );
}

/**
 * The opening scene: a hexagon network (the map) that MORPH corrupts with noise
 * and then destroys. `stage` 0 = intact, 1 = MORPH attacks, 2 = ruins with one spark left.
 */
export function MorphScene({
  stage,
  width,
  height,
  label,
}: {
  stage: 0 | 1 | 2;
  width: number;
  height: number;
  /** What the picture shows, for screen readers (in the player's language). */
  label: string;
}) {
  const reduced = useReducedMotion();
  const cells = useMemo(() => buildCells(), []);
  const links = useMemo(() => buildLinks(cells), [cells]);
  const [now, setNow] = useState(0);
  const t0 = useRef(Date.now());
  const attackAt = useRef<number | null>(null);
  const repairAt = useRef<number | null>(null);

  useEffect(() => {
    if (reduced) return undefined;
    const id = setInterval(() => setNow(Date.now() - t0.current), TICK_MS);
    return () => clearInterval(id);
  }, [reduced]);

  if (stage >= 1 && attackAt.current === null) attackAt.current = now;
  if (stage >= 2 && repairAt.current === null) repairAt.current = now;

  // people who reduce motion get the end state of each stage at once, without flicker
  const attack = reduced
    ? stage >= 1
      ? 1
      : 0
    : stage >= 2
      ? 1
      : attackAt.current === null
        ? 0
        : clamp01((now - attackAt.current) / ATTACK_MS);
  const repair = reduced ? (stage >= 2 ? 1 : 0) : repairAt.current === null ? 0 : clamp01((now - repairAt.current) / REPAIR_MS);
  const tick = reduced ? 0 : Math.floor(now / TICK_MS);

  const scale = Math.min(width / 330, height / 400);
  const activity = reduced ? 0 : noiseActivity(attack, repair);
  const specks = useMemo(
    () => speckles(tick, activity, { x0: -150, y0: -240, x1: 150, y1: 140 }),
    [tick, activity],
  );

  const state = (i: number): CellState => cellState(cells[i]!, attack, repair);
  const jitterOf = (i: number) => ((hashString(`j:${tick}:${i}`) % 5) - 2) * 1.2;

  const emblemScale = clamp01(attack * 6);
  const spin = reduced ? 0 : now / 2200;

  return (
    <Canvas style={{ width, height }} accessible accessibilityLabel={label}>
      <Rect x={0} y={0} width={width} height={height}>
        <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={['#050A14', '#0B1626']} />
      </Rect>
      <Group transform={[{ translateX: width / 2 }, { translateY: height * 0.6 }, { scale }]}>
        {/* links */}
        {links.map(([a, b]) => {
          const sa = state(a);
          const sb = state(b);
          if (sa === 'dead' || sb === 'dead') return null;
          const noisy = sa === 'noisy' || sb === 'noisy';
          const relit = sa === 'relit' && sb === 'relit';
          const ca = cells[a]!;
          const cb = cells[b]!;
          return (
            <Line
              key={`${a}-${b}`}
              p1={vec(ca.x, ca.y)}
              p2={vec(cb.x, cb.y)}
              strokeWidth={3}
              color={relit ? colors.accent : noisy ? NOISE[(a * 3 + tick) % 3]! : '#3DA0D0'}
              opacity={noisy ? 0.7 : 0.9}
            />
          );
        })}

        {/* tiles */}
        {cells.map((c) => {
          const s = state(c.i);
          const noisy = s === 'noisy';
          const dx = noisy ? jitterOf(c.i) : 0;
          const dy = noisy ? jitterOf(c.i + 99) * 0.6 : 0;
          const top =
            s === 'healthy'
              ? c.ring === 0
                ? colors.accent
                : mix('#1F5A7A', '#3DA0D0', ((c.q * 7 + c.r * 3) & 3) / 8)
              : s === 'relit'
                ? c.ring === 0
                  ? '#7CD4FF'
                  : '#1F5A7A'
                : s === 'noisy'
                  ? NOISE[(c.i * 7 + tick * 3) % NOISE.length]!
                  : '#0C1520';
          const wall = s === 'dead' ? '#070D15' : mix(top, '#000000', 0.5);
          return (
            <Group key={c.i} transform={[{ translateX: c.x + dx }, { translateY: c.y + dy }]}>
              <Path path={HEX_WALL} color={wall} />
              <Path path={HEX_TOP} color={top} />
              {s === 'dead' ? (
                <Path path={HEX_TOP} style="stroke" strokeWidth={1.4} color="#1B2A3C" />
              ) : (
                <Path path={HEX_TOP} style="stroke" strokeWidth={1.4} color="#FFFFFF" opacity={0.18} />
              )}
              {c.ring === 0 && s !== 'dead' ? (
                <RoundedRect x={-9} y={-9} width={18} height={18} r={3} color="#FFFFFF" opacity={0.9} />
              ) : null}
            </Group>
          );
        })}

        {/* static */}
        {specks.map((p, k) => (
          <Rect key={k} x={p.x} y={p.y} width={p.w} height={p.h} color={SPECK[p.c]!} opacity={0.55} />
        ))}

        {/* MORPH */}
        {attack > 0 ? (
          <Group transform={[{ translateX: SOURCE.x }, { translateY: SOURCE.y }, { scale: emblemScale }]}>
            <Emblem size={78} spin={spin} jitter={reduced ? 0 : (tick % 3) + 1} opacity={repair > 0 ? 1 - repair * 0.6 : 1} />
          </Group>
        ) : null}
      </Group>
    </Canvas>
  );
}
