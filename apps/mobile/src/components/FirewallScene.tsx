import { Canvas, Circle, Group, Line, Path, RadialGradient, Rect, Skia, vec, type SkPath } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type { GuardianId, WallHit } from '@nexus/shared';
import { Bolt, type Mood } from './Bolt';
import { Guardian } from './Guardian';
import { Morph, type MorphForm } from './Morph';
import { brickFall, hexPath, wallLayout, type Brick } from './firewall.logic';

const RED = '#D93645';
const RED_DARK = '#7A1622';
const RED_LIGHT = '#FF8A93';
/** morph.ai's noise, which flows into a rebuilt layer. */
const NOISE = '#FF4FD8';
const PARTICLES = 14;

const svg = (d: string): SkPath => Skia.Path.MakeFromSVGString(d) ?? Skia.PathBuilder.Make().detach();

/**
 * The firewall in a fight: a honeycomb wall with one layer per life, morph.ai on top, Bolt below
 * and, once awake, the guardian of the sector beside him. A right answer (`crack`, `breach`) sends
 * a beam from both into the top layer, which bursts into falling bricks; a wrong one (`repair`)
 * lets morph.ai's noise flow down and rebuild a layer, and the guardian flinches.
 * `hit.seq` changes with every answer, so the same kind of hit plays again.
 */
export function FirewallScene({
  width,
  hp,
  max,
  hit,
  color,
  morphForm,
  boltMood,
  guardian,
  label,
}: {
  width: number;
  hp: number;
  max: number;
  hit: { kind: WallHit; seq: number } | null;
  /** The colour of the area behind the wall; it shines through the gaps. */
  color: string;
  morphForm: MorphForm;
  boltMood: Mood;
  /** The guardian fighting beside Bolt; none while it still sleeps. */
  guardian?: GuardianId;
  label: string;
}) {
  const reduced = useReducedMotion();
  const wall = useMemo(() => wallLayout(width, max), [width, max]);
  const H = wall.height;

  const beam = useSharedValue(0);
  const shake = useSharedValue(0);
  const stream = useSharedValue(0);
  const light = useSharedValue(hp <= 0 ? 1 : 0);
  const pulse = useSharedValue(0);
  const flinch = useSharedValue(0);
  // where the last beam hit, or the layer the last repair came down to: a right answer took the
  // layer at index `hp`, a repair rebuilt the one at `hp - 1`
  const t = useMemo(() => {
    const row = hit?.kind === 'repair' ? hp - 1 : Math.min(hp, max - 1);
    const seq = hit?.seq ?? 0;
    return { x: width * (0.3 + ((seq * 37) % 40) / 100), y: wall.rowY[Math.max(0, row)] ?? 0 };
  }, [hit?.seq, hp, width, max, wall]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (reduced) return;
    pulse.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!hit) return;
    if (reduced) {
      light.value = hp <= 0 ? 1 : 0;
      return;
    }
    if (hit.kind === 'crack' || hit.kind === 'breach') {
      beam.value = withSequence(withTiming(1, { duration: 90 }), withTiming(0, { duration: 520 }));
      const s = hit.kind === 'breach' ? 10 : 6;
      shake.value = withSequence(
        withTiming(-s, { duration: 50 }),
        withTiming(s, { duration: 60 }),
        withTiming(-s / 2, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
      if (hit.kind === 'breach') light.value = withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) });
    } else if (hit.kind === 'repair') {
      stream.value = 0;
      stream.value = withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) });
      flinch.value = withSequence(
        withTiming(0, { duration: 500 }),
        withTiming(5, { duration: 60 }),
        withTiming(-5, { duration: 60 }),
        withTiming(3, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
    } else {
      // wrong while the wall is whole: it only flickers
      shake.value = withSequence(withTiming(2, { duration: 60 }), withTiming(-2, { duration: 60 }), withTiming(0, { duration: 60 }));
    }
  }, [hit?.seq]); // eslint-disable-line react-hooks/exhaustive-deps

  const paths = useMemo(
    () =>
      wall.bricks.map((b) => ({
        b,
        side: svg(hexPath(b.x, b.y + wall.r * 0.22, wall.r * 0.96)),
        face: svg(hexPath(b.x, b.y, wall.r * 0.92)),
        inner: svg(hexPath(b.x, b.y - wall.r * 0.06, wall.r * 0.56)),
      })),
    [wall],
  );

  const shakeT = useDerivedValue(() => [{ translateX: shake.value }]);
  const glow = useDerivedValue(() => 0.18 + light.value * 0.62);
  const beamOpacity = useDerivedValue(() => beam.value);
  const flashR = useDerivedValue(() => 8 + beam.value * 26);
  const flinchStyle = useAnimatedStyle(() => ({ transform: [{ translateX: flinch.value }] }));
  const g = wall.guardian;

  return (
    <View style={{ width, height: H }} accessible accessibilityRole="image" accessibilityLabel={label}>
      <Canvas style={{ width, height: H }}>
        <Rect x={0} y={0} width={width} height={H} color="#0B0610" />
        {/* the area behind the wall shines through wherever it falls */}
        <Rect x={0} y={0} width={width} height={H} opacity={glow}>
          <RadialGradient c={vec(width / 2, wall.rowY[Math.floor(max / 2)] ?? H / 2)} r={width * 0.7} colors={[color, '#0B0610']} />
        </Rect>
        <Group transform={shakeT}>
          {Array.from({ length: max }, (_, row) => (
            <Layer
              key={row}
              bricks={paths.filter((p) => p.b.row === row)}
              standing={row < hp}
              top={row === hp - 1}
              repaired={hit?.kind === 'repair' && row === hp - 1 ? hit.seq : -1}
              pulse={pulse}
              reduced={reduced}
            />
          ))}
        </Group>
        {/* the beam from Bolt into the wall */}
        <Group opacity={beamOpacity}>
          <Line p1={vec(wall.bolt.x + 14, wall.bolt.y - 10)} p2={vec(t.x, t.y)} color={color} strokeWidth={7} strokeCap="round" />
          <Line p1={vec(wall.bolt.x + 14, wall.bolt.y - 10)} p2={vec(t.x, t.y)} color="#FFFFFF" strokeWidth={2} strokeCap="round" />
          {guardian ? (
            <>
              <Line p1={vec(g.x - 14, g.y - 10)} p2={vec(t.x, t.y)} color={color} strokeWidth={7} strokeCap="round" />
              <Line p1={vec(g.x - 14, g.y - 10)} p2={vec(t.x, t.y)} color="#FFFFFF" strokeWidth={2} strokeCap="round" />
            </>
          ) : null}
          <Circle cx={t.x} cy={t.y} r={flashR} color="#FFFFFF" opacity={0.85} />
        </Group>
        {/* morph.ai's noise flowing down into a rebuilt layer */}
        {Array.from({ length: PARTICLES }, (_, i) => (
          <Particle key={i} i={i} stream={stream} from={wall.morph} to={t} />
        ))}
      </Canvas>
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: wall.morph.x - wall.morph.size / 2, top: wall.morph.y - wall.morph.size / 2 }}
      >
        <Morph size={wall.morph.size} form={morphForm} />
      </View>
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: wall.bolt.x - wall.bolt.size / 2, top: wall.bolt.y - wall.bolt.size / 2 }}
      >
        <Bolt size={wall.bolt.size} mood={boltMood} />
      </View>
      {guardian ? (
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: g.x - g.size / 2, top: g.y - g.size / 2 }, flinchStyle]}>
          <Guardian who={guardian} size={g.size} />
        </Animated.View>
      ) : null}
    </View>
  );
}

type BrickPaths = { b: Brick; side: SkPath; face: SkPath; inner: SkPath };

/** One layer of the wall: it bursts into falling bricks when it is lost and glitches back when rebuilt. */
function Layer({
  bricks,
  standing,
  top,
  repaired,
  pulse,
  reduced,
}: {
  bricks: BrickPaths[];
  standing: boolean;
  top: boolean;
  /** The `seq` of the repair that rebuilt this layer, else -1. */
  repaired: number;
  pulse: SharedValue<number>;
  reduced: boolean;
}) {
  const down = useSharedValue(standing ? 0 : 1);
  const noise = useSharedValue(0);
  useEffect(() => {
    if (reduced) {
      down.value = standing ? 0 : 1;
      return;
    }
    if (standing) {
      // rebuilt: the bricks come back while the noise still sits in them
      down.value = withTiming(0, { duration: 700, easing: Easing.out(Easing.back(1.4)) });
    } else {
      down.value = withTiming(1, { duration: 900, easing: Easing.in(Easing.quad) });
    }
  }, [standing]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (repaired < 0 || reduced) return;
    noise.value = withSequence(withTiming(1, { duration: 500 }), withTiming(0, { duration: 1100 }));
  }, [repaired]); // eslint-disable-line react-hooks/exhaustive-deps
  const edge = useDerivedValue(() => (top ? 0.35 + pulse.value * 0.65 : 0));
  return (
    <>
      {bricks.map((p, i) => (
        <BrickView key={i} p={p} down={down} noise={noise} edge={edge} />
      ))}
    </>
  );
}

function BrickView({
  p,
  down,
  noise,
  edge,
}: {
  p: BrickPaths;
  down: SharedValue<number>;
  noise: SharedValue<number>;
  edge: SharedValue<number>;
}) {
  const { b } = p;
  const transform = useDerivedValue(() => {
    const d = brickFall(down.value, b.delay);
    return [{ translateX: b.dx * 70 * d }, { translateY: d * d * 220 - d * 18 }, { rotate: b.spin * 2.2 * d }];
  });
  const opacity = useDerivedValue(() => 1 - brickFall(down.value, b.delay));
  return (
    <Group transform={transform} origin={vec(b.x, b.y)} opacity={opacity}>
      <Path path={p.side} color={RED_DARK} />
      <Path path={p.face} color={RED} />
      <Path path={p.inner} color={RED_LIGHT} opacity={0.35} />
      <Path path={p.face} color={NOISE} opacity={noise} />
      <Path path={p.face} style="stroke" strokeWidth={2} color="#FFD0D4" opacity={edge} />
    </Group>
  );
}

/** One pixel of noise on its way from morph.ai to the wall; they leave one after another. */
function Particle({
  i,
  stream,
  from,
  to,
}: {
  i: number;
  stream: SharedValue<number>;
  from: { x: number; y: number };
  to: { x: number; y: number };
}) {
  const lag = (i / PARTICLES) * 0.45;
  const wobble = ((i * 53) % 21) - 10;
  const x = useDerivedValue(() => {
    const k = Math.min(1, Math.max(0, (stream.value - lag) / (1 - lag)));
    return from.x + (to.x - from.x) * k + Math.sin(k * Math.PI) * wobble * 2 - 3;
  });
  const y = useDerivedValue(() => {
    const k = Math.min(1, Math.max(0, (stream.value - lag) / (1 - lag)));
    return from.y + (to.y - from.y) * k - 3;
  });
  const opacity = useDerivedValue(() => {
    const k = (stream.value - lag) / (1 - lag);
    return k <= 0 || k >= 1 ? 0 : 0.9;
  });
  return <Rect x={x} y={y} width={6} height={6} color={NOISE} opacity={opacity} />;
}
