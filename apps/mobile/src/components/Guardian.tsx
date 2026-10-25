import {
  Blur,
  Canvas,
  Circle,
  Group,
  Oval,
  Path,
  Rect,
  RoundedRect,
  Skia,
  vec,
  type SkPath,
} from '@shopify/react-native-skia';
import { useEffect, type ComponentType } from 'react';
import { View } from 'react-native';
import {
  Easing,
  cancelAnimation,
  interpolateColor,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { guardianTitle } from '@nexus/shared';
import { useStrings } from '../strings';

export type GuardianId = 'quantis' | 'rhizom' | 'kodex' | 'muse';

const NAME: Record<GuardianId, string> = { quantis: 'Quantis', rhizom: 'Rhizom', kodex: 'Kodex', muse: 'Muse' };

/** Portrait of a sector guardian, drawn on the same 100×100 grid as Bolt. */
export function Guardian({ who, size = 96 }: { who: GuardianId; size?: number }) {
  const t = useStrings();
  const Art = ART[who];
  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={t.a11y.guardian(NAME[who], guardianTitle(who, t.lang))}
    >
      <Canvas style={{ width: size, height: size }}>
        <Group transform={[{ scale: size / 100 }]}>
          <Art />
        </Group>
      </Canvas>
    </View>
  );
}

// ---------- shared helpers ----------

const path = (d: string): SkPath => Skia.Path.MakeFromSVGString(d) ?? Skia.PathBuilder.Make().detach();

type Pt = [number, number];

/** A tapered brush stroke along a cubic curve, as a filled outline. */
function brush(p0: Pt, p1: Pt, p2: Pt, p3: Pt, w0: number, w1: number, steps = 14): SkPath {
  const at = (t: number): Pt => {
    const u = 1 - t;
    const k = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t] as const;
    return [
      k[0] * p0[0] + k[1] * p1[0] + k[2] * p2[0] + k[3] * p3[0],
      k[0] * p0[1] + k[1] * p1[1] + k[2] * p2[1] + k[3] * p3[1],
    ];
  };
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = at(Math.max(0, t - 0.01));
    const b = at(Math.min(1, t + 0.01));
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / len;
    const ny = (b[0] - a[0]) / len;
    const w = (w0 + (w1 - w0) * t) / 2;
    const c = at(t);
    left.push([c[0] + nx * w, c[1] + ny * w]);
    right.push([c[0] - nx * w, c[1] - ny * w]);
  }
  const b = Skia.PathBuilder.Make();
  [...left, ...right.reverse()].forEach(([x, y], i) => (i === 0 ? b.moveTo(x, y) : b.lineTo(x, y)));
  b.close();
  return b.detach();
}

/** A 0→1 clock for idle motion; stands still at 0 when reduce motion is on. */
function useIdle(duration: number, mode: 'swing' | 'loop' = 'swing'): SharedValue<number> {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduced) {
      cancelAnimation(t);
      t.value = 0;
      return undefined;
    }
    const easing = mode === 'swing' ? Easing.inOut(Easing.sin) : Easing.linear;
    t.value = withRepeat(withTiming(1, { duration, easing }), -1, mode === 'swing');
    return () => cancelAnimation(t);
  }, [t, duration, mode, reduced]);
  return t;
}

function Glow({ color, cy = 50, opacity = 0.4 }: { color: string; cy?: number; opacity?: number }) {
  return (
    <Circle cx={50} cy={cy} r={31} color={color} opacity={opacity}>
      <Blur blur={9} />
    </Circle>
  );
}

// ---------- Quantis: hologram head of a wireframe icosahedron ----------

const Q_HEX = path('M50 17 L75.1 31.5 L75.1 60.5 L50 75 L24.9 60.5 L24.9 31.5 Z');
const Q_WIRE = path(
  'M50 33 L61.3 52.5 L38.7 52.5 Z M50 33 L24.9 31.5 M50 33 L50 17 M50 33 L75.1 31.5 ' +
    'M61.3 52.5 L75.1 31.5 M61.3 52.5 L75.1 60.5 M61.3 52.5 L50 75 ' +
    'M38.7 52.5 L50 75 M38.7 52.5 L24.9 60.5 M38.7 52.5 L24.9 31.5',
);
const Q_SCAN = path(Array.from({ length: 17 }, (_, i) => `M20 ${19 + i * 3.5} L80 ${19 + i * 3.5}`).join(' '));
const Q_BEAM = path('M44 89 L56 89 L74 62 L26 62 Z');
const Q_PI = path('M12 21 Q18 19.5 25 21 M16.5 21 L15.6 30 M21.6 21 Q21.4 28.5 24.2 29.6');
const Q_SIGMA = path('M88 13 L79 13 L84.5 18.5 L79 24 L88 24');
// monocle: an electron orbit around the right eye
const ORBIT = { cx: 62, cy: 41, rx: 9, ry: 5.6, tilt: (-20 * Math.PI) / 180 };

function Quantis() {
  const hover = useIdle(2600);
  const spin = useIdle(4200, 'loop');
  const head = useDerivedValue(() => [{ translateY: -1.6 * hover.value }]);
  const ex = useDerivedValue(() => {
    const a = spin.value * Math.PI * 2;
    return ORBIT.cx + ORBIT.rx * Math.cos(a) * Math.cos(ORBIT.tilt) - ORBIT.ry * Math.sin(a) * Math.sin(ORBIT.tilt);
  });
  const ey = useDerivedValue(() => {
    const a = spin.value * Math.PI * 2;
    return ORBIT.cy + ORBIT.rx * Math.cos(a) * Math.sin(ORBIT.tilt) + ORBIT.ry * Math.sin(a) * Math.cos(ORBIT.tilt);
  });
  return (
    <Group>
      <Glow color="#1CB0F6" cy={48} opacity={0.45} />
      {/* projector and beam */}
      <Path path={Q_BEAM} color="#1CB0F6" opacity={0.18} />
      <Oval x={39} y={86.6} width={22} height={6.8} color="#0E3A52" />
      <Oval x={43} y={87} width={14} height={4} color="#7FD6FF" />
      <Group transform={head}>
        <Path path={Q_HEX} color="#1CB0F6" opacity={0.24} />
        <Group clip={Q_HEX}>
          <Path path={Q_SCAN} style="stroke" strokeWidth={0.8} color="#BDEBFF" opacity={0.18} />
        </Group>
        <Path path={Q_WIRE} style="stroke" strokeWidth={1.3} strokeJoin="round" color="#7FD6FF" opacity={0.75} />
        <Path path={Q_HEX} style="stroke" strokeWidth={2.6} strokeJoin="round" color="#9FE1FF" />
        {/* eyes, monocle, flat mouth */}
        <RoundedRect x={34.5} y={39.2} width={7} height={3.6} r={1.8} color="#E6F8FF" />
        <RoundedRect x={58.5} y={39.2} width={7} height={3.6} r={1.8} color="#E6F8FF" />
        <Group transform={[{ rotate: ORBIT.tilt }]} origin={vec(ORBIT.cx, ORBIT.cy)}>
          <Oval
            x={ORBIT.cx - ORBIT.rx}
            y={ORBIT.cy - ORBIT.ry}
            width={ORBIT.rx * 2}
            height={ORBIT.ry * 2}
            style="stroke"
            strokeWidth={1.5}
            color="#E6F8FF"
          />
        </Group>
        <Circle cx={ex} cy={ey} r={1.9} color="#FFFFFF" />
        <RoundedRect x={45} y={60} width={10} height={2} r={1} color="#E6F8FF" />
      </Group>
      {/* floating signs */}
      <Path path={Q_PI} style="stroke" strokeWidth={2} strokeCap="round" color="#9FE1FF" opacity={0.9} />
      <Path
        path={Q_SIGMA}
        style="stroke"
        strokeWidth={2}
        strokeCap="round"
        strokeJoin="round"
        color="#9FE1FF"
        opacity={0.9}
      />
    </Group>
  );
}

// ---------- Rhizom: tree-stump spirit that breathes slowly ----------

const R_ROOTS = path(
  'M30 76 C28 84 22 86 18 92 M38 77 C38 86 34 90 32 95 M46 78 C46 87 45 91 46 96 ' +
    'M54 78 C54 87 55 91 54 96 M62 77 C62 86 66 90 68 95 M70 76 C72 84 78 86 82 92',
);
const R_TRUNK = path('M27 32 C27 50 25 66 22 78 L78 78 C75 66 73 50 73 32 Z');
const R_GRAIN = path('M32 40 C31 50 33 58 30 72 M68 40 C69 52 67 60 70 72 M50 67 C50 70 49 73 50 77');
const R_EYE_L = path('M36 51 Q40 47.6 44 51 Q40 53.6 36 51 Z');
const R_EYE_R = path('M56 51 Q60 47.6 64 51 Q60 53.6 56 51 Z');
const R_MOUTH = path('M45 62 Q50 65.5 55 62');
const R_LEAF_L = path('M48 30 C38 30 32 24 27 17 C36 15 44 20 48 30 Z');
const R_LEAF_R = path('M52 30 C62 30 68 24 73 17 C64 15 56 20 52 30 Z');
const R_LEAF_C = path('M50 31 C43 22 45 12 50 5 C55 12 57 22 50 31 Z');
const R_VEINS = path('M50 28 L50 11 M47 29 L33 19 M53 29 L67 19');

const BARK = '#8A5A33';
const BARK_DARK = '#6A4225';
const HOLE = '#3A2414';

function Rhizom() {
  const breath = useIdle(3800);
  const body = useDerivedValue(() => [{ scaleX: 1 + 0.012 * breath.value }, { scaleY: 1 + 0.03 * breath.value }]);
  const crown = useDerivedValue(() => [{ translateY: -1.4 * breath.value }, { rotate: (breath.value - 0.5) * 0.06 }]);
  const eyeGlow = useDerivedValue(() => 0.45 + 0.35 * breath.value);
  return (
    <Group>
      <Glow color="#58CC02" cy={52} opacity={0.38} />
      <Path path={R_ROOTS} style="stroke" strokeWidth={4.5} strokeCap="round" color={BARK_DARK} />
      <Group transform={body} origin={vec(50, 80)}>
        <Path path={R_TRUNK} color={BARK} />
        <Path path={R_GRAIN} style="stroke" strokeWidth={1.8} strokeCap="round" color={BARK_DARK} />
        {/* cut surface with rings */}
        <Oval x={27} y={25} width={46} height={14} color="#E2B47A" />
        <Oval x={35.5} y={27.7} width={29} height={8.6} style="stroke" strokeWidth={1.3} color="#B9864F" />
        <Oval x={43.5} y={30.1} width={13} height={3.8} style="stroke" strokeWidth={1.3} color="#B9864F" />
        {/* knot-hole eyes with a calm glow */}
        <Oval x={33.6} y={42.8} width={12.8} height={14.4} color={HOLE} />
        <Oval x={53.6} y={42.8} width={12.8} height={14.4} color={HOLE} />
        <Oval x={33.6} y={42.8} width={12.8} height={14.4} style="stroke" strokeWidth={1.6} color="#A06C40" />
        <Oval x={53.6} y={42.8} width={12.8} height={14.4} style="stroke" strokeWidth={1.6} color="#A06C40" />
        <Group opacity={eyeGlow}>
          <Circle cx={40} cy={51} r={4.5} color="#58CC02">
            <Blur blur={2.5} />
          </Circle>
          <Circle cx={60} cy={51} r={4.5} color="#58CC02">
            <Blur blur={2.5} />
          </Circle>
        </Group>
        <Path path={R_EYE_L} color="#D4FF8A" />
        <Path path={R_EYE_R} color="#D4FF8A" />
        <Path path={R_MOUTH} style="stroke" strokeWidth={1.9} strokeCap="round" color={HOLE} />
      </Group>
      {/* crown of three leaves */}
      <Group transform={crown} origin={vec(50, 30)}>
        <Path path={R_LEAF_L} color="#58CC02" />
        <Path path={R_LEAF_R} color="#58CC02" />
        <Path path={R_LEAF_C} color="#6FDB1A" />
        <Path path={R_VEINS} style="stroke" strokeWidth={1.3} strokeCap="round" color="#3D8F00" />
      </Group>
    </Group>
  );
}

// ---------- Kodex: archivist owl that blinks ----------

const K_QUILL = path('M70 31 C72 20 78 10 87 4 C86 14 80 24 70 31 Z');
const K_SHAFT = path('M70.5 30 L85 6.5');
const K_TUFT_L = path('M26 37 L27 17 L41 29 Z');
const K_TUFT_R = path('M74 37 L73 17 L59 29 Z');
const K_MARKS = path('M42 67 q2.5 2.4 5 0 M53 67 q2.5 2.4 5 0 M47.5 74 q2.5 2.4 5 0');
const K_INK = path('M53 77 C55 74 60 75 60 78 C63 79 61 83 58 83 C56 85 52 84 53 81 C51 80 51 78 53 77 Z');
const K_BRIDGE = path('M48 44 Q50 41.6 52 44');
const K_BEAK = path('M46.5 54 L53.5 54 L50 60.5 Z');
const K_WING_L = path('M23 50 C15 60 17 77 31 87 C33 74 31 61 23 50 Z');
const K_WING_R = path('M77 50 C85 60 83 77 69 87 C67 74 69 61 77 50 Z');

const OWL = '#9C6B3C';
const OWL_DARK = '#6E4524';
const GOLD = '#FFC800';

function Kodex() {
  const reduced = useReducedMotion();
  const blink = useSharedValue(0);
  useEffect(() => {
    if (reduced) {
      cancelAnimation(blink);
      blink.value = 0;
      return undefined;
    }
    blink.value = withRepeat(
      withSequence(withDelay(3400, withTiming(1, { duration: 90 })), withTiming(0, { duration: 120 })),
      -1,
    );
    return () => cancelAnimation(blink);
  }, [blink, reduced]);
  const lids = useDerivedValue(() => [{ scaleY: 1 - 0.9 * blink.value }]);
  return (
    <Group>
      <Glow color={GOLD} cy={52} opacity={0.32} />
      {/* quill tucked into the right ear tuft */}
      <Path path={K_QUILL} color="#F7F1E3" />
      <Path path={K_SHAFT} style="stroke" strokeWidth={1} color="#C9B48A" />
      <Path path={K_TUFT_L} color={OWL_DARK} />
      <Path path={K_TUFT_L} style="stroke" strokeWidth={3} strokeJoin="round" color={OWL_DARK} />
      <Path path={K_TUFT_R} color={OWL_DARK} />
      <Path path={K_TUFT_R} style="stroke" strokeWidth={3} strokeJoin="round" color={OWL_DARK} />
      {/* body, belly, ink blot */}
      <Oval x={21} y={25} width={58} height={64} color={OWL} />
      <Oval x={33} y={58.5} width={34} height={29} color="#EFD9AE" />
      <Path path={K_MARKS} style="stroke" strokeWidth={1.3} strokeCap="round" color="#C9A877" />
      <Path path={K_INK} color="#24304F" />
      <Circle cx={62.5} cy={85} r={1.3} color="#24304F" />
      {/* face disc and eyes */}
      <Circle cx={39} cy={45} r={13} color="#C99A62" />
      <Circle cx={61} cy={45} r={13} color="#C99A62" />
      <Group transform={lids} origin={vec(50, 45)}>
        <Circle cx={39} cy={45} r={9.2} color="#FFF8E6" />
        <Circle cx={61} cy={45} r={9.2} color="#FFF8E6" />
        <Circle cx={40} cy={46} r={4.2} color="#2A1C10" />
        <Circle cx={60} cy={46} r={4.2} color="#2A1C10" />
        <Circle cx={41.4} cy={44.4} r={1.3} color="#FFFFFF" />
        <Circle cx={61.4} cy={44.4} r={1.3} color="#FFFFFF" />
      </Group>
      {/* big round glasses */}
      <Circle cx={39} cy={45} r={10.6} style="stroke" strokeWidth={2.8} color={GOLD} />
      <Circle cx={61} cy={45} r={10.6} style="stroke" strokeWidth={2.8} color={GOLD} />
      <Path path={K_BRIDGE} style="stroke" strokeWidth={2.4} color={GOLD} />
      <Path path={K_BEAK} color="#FF9600" />
      <Path path={K_BEAK} style="stroke" strokeWidth={1.5} strokeJoin="round" color="#FF9600" />
      {/* parchment scroll under the left wing */}
      <Group transform={[{ translateX: 22 }, { translateY: 79 }, { rotate: (-24 * Math.PI) / 180 }]}>
        <RoundedRect x={-13} y={-4.5} width={26} height={9} r={4.5} color="#F3E4C0" />
        <Circle cx={-12} cy={0} r={4.5} color="#E3CC98" />
        <Circle cx={-12} cy={0} r={1.6} color="#B89A62" />
        <Rect x={-6} y={-4.5} width={2.6} height={9} color="#FF4B4B" />
      </Group>
      <Path path={K_WING_L} color={OWL_DARK} />
      <Path path={K_WING_R} color={OWL_DARK} />
      <Oval x={37.4} y={87.1} width={9.2} height={4.8} color="#FF9600" />
      <Oval x={53.4} y={87.1} width={9.2} height={4.8} color="#FF9600" />
    </Group>
  );
}

// ---------- Muse: a paint-splash mask whose colour drifts ----------

const M_MASK = path(
  'M50 22 C60 20 70 26 74 34 C80 36 82 44 77 49 C79 58 75 68 66 72 C64 78 66 84 62 85 ' +
    'C58 86 59 78 56 76 C52 78 46 78 42 75 C40 80 38 88 34 87 C30 86 33 78 32 72 ' +
    'C24 68 20 58 23 50 C18 46 20 36 27 34 C30 26 40 22 50 22 Z',
);
const M_HAIR = [
  brush([36, 27], [18, 22], [6, 40], [14, 66], 10, 1.5),
  brush([64, 27], [82, 22], [94, 40], [86, 66], 10, 1.5),
  brush([40, 24], [28, 10], [12, 14], [7, 28], 7, 1.2),
  brush([60, 24], [72, 10], [88, 14], [93, 28], 7, 1.2),
  brush([50, 24], [47, 10], [60, 3], [70, 9], 6, 1.2),
];
const M_BROWS = path('M31 38 Q38 30 46 36 M54 36 Q62 30 69 38');
const M_EYES = path('M33 48 Q39 39.5 45 48 Q39 44.5 33 48 Z M55 48 Q61 39.5 67 48 Q61 44.5 55 48 Z');
const M_MOUTH = path('M39 59 Q50 71 61 59 Q50 64 39 59 Z');
const M_CLEF = path(
  'M2.5 22.5 Q5.5 24 5.6 20.5 L4.6 3 C4.5 0 8.2 0.2 7.2 4 C6.4 7 1 9.5 1 14.5 ' +
    'C1 18.5 8.6 18.8 8.6 15 C8.6 12 3.6 11.8 3.8 15.2',
);
const M_FLAG = path('M2.9 -0.8 L2.9 -12 Q7.8 -9.5 6.8 -4.5');

const LILAC = '#F0D9FF';
const INK = '#2A1240';
// each hair stroke drifts between two paint tones
const HAIR_TONES: [string, string][] = [
  ['#8E44C9', '#6F4FD0'],
  ['#8E44C9', '#A33FB8'],
  ['#B86BFF', '#9B7BFF'],
  ['#9B7BFF', '#C77DF5'],
  ['#E58CE0', '#B98CFF'],
];

function EighthNote({ x, y, lift }: { x: number; y: number; lift: SharedValue<number> }) {
  const t = useDerivedValue(() => [{ translateX: x }, { translateY: y - 1.6 * lift.value }]);
  return (
    <Group transform={t}>
      <Group transform={[{ rotate: (-20 * Math.PI) / 180 }]}>
        <Oval x={-3.3} y={-2.4} width={6.6} height={4.8} color={LILAC} />
      </Group>
      <Path path={M_FLAG} style="stroke" strokeWidth={1.7} strokeCap="round" strokeJoin="round" color={LILAC} />
    </Group>
  );
}

function HairStroke({ p, tones, drift }: { p: SkPath; tones: [string, string]; drift: SharedValue<number> }) {
  const color = useDerivedValue(() => interpolateColor(drift.value, [0, 1], tones));
  return <Path path={p} color={color} />;
}

function Muse() {
  const drift = useIdle(5200);
  const mask = useDerivedValue(() => interpolateColor(drift.value, [0, 0.5, 1], ['#CE82FF', '#DC86F2', '#B48CFF']));
  const counter = useDerivedValue(() => 1 - drift.value);
  return (
    <Group>
      <Glow color="#CE82FF" opacity={0.42} />
      {M_HAIR.map((p, i) => (
        <HairStroke key={i} p={p} tones={HAIR_TONES[i]!} drift={drift} />
      ))}
      <Path path={M_MASK} color={mask} />
      <Oval x={35} y={28.6} width={16} height={6.8} color="#EBCBFF" opacity={0.8} />
      <Path path={M_BROWS} style="stroke" strokeWidth={2.4} strokeCap="round" color="#6A2FA0" />
      <Path path={M_EYES} color={INK} />
      <Circle cx={30} cy={57} r={3.2} color="#E58CE0" opacity={0.8} />
      <Circle cx={70} cy={57} r={3.2} color="#E58CE0" opacity={0.8} />
      <Path path={M_MOUTH} color={INK} />
      {/* treble-clef earring */}
      <Circle cx={21.5} cy={59} r={1.8} style="stroke" strokeWidth={1.3} color={LILAC} />
      <Group transform={[{ translateX: 16.5 }, { translateY: 61 }]}>
        <Path path={M_CLEF} style="stroke" strokeWidth={1.6} strokeCap="round" strokeJoin="round" color={LILAC} />
      </Group>
      <EighthNote x={82} y={80} lift={drift} />
      <EighthNote x={90} y={66} lift={counter} />
    </Group>
  );
}

const ART: Record<GuardianId, ComponentType> = { quantis: Quantis, rhizom: Rhizom, kodex: Kodex, muse: Muse };
