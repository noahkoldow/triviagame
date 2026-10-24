import { Canvas, Rect } from '@shopify/react-native-skia';
import { useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import { seededRng } from '@nexus/shared';

const N = 12;
/** At most three changes per second (flash rule); the reformed MORPH is calmer still. */
const TICK_MS = 360;
const CALM_TICK_MS = 720;

export type MorphForm = 'smile' | 'glasses' | 'crown' | 'glitch' | 'reformed';

// 12×12 pixel faces: '#' lit, '.' noise
const FACE: Record<Exclude<MorphForm, 'glitch'>, readonly string[]> = {
  smile: [
    '............',
    '............',
    '............',
    '............',
    '...##..##...',
    '...##..##...',
    '............',
    '............',
    '...######...',
    '............',
    '............',
    '............',
  ],
  // pixel glasses, right brow raised, smug half-smile
  glasses: [
    '............',
    '.......####.',
    '............',
    '.####..####.',
    '.#..####..#.',
    '.#..#..#..#.',
    '.####..####.',
    '............',
    '........#...',
    '...#####....',
    '............',
    '............',
  ],
  // pixel crown, wide grin
  crown: [
    '.#...##...#.',
    '.##.####.##.',
    '.##########.',
    '............',
    '...##..##...',
    '...##..##...',
    '............',
    '.#........#.',
    '..########..',
    '............',
    '............',
    '............',
  ],
  // calm eyes, small honest smile
  reformed: [
    '............',
    '............',
    '............',
    '............',
    '...##..##...',
    '...##..##...',
    '............',
    '...#....#...',
    '....####....',
    '............',
    '............',
    '............',
  ],
};

const COLOR: Record<MorphForm, string> = {
  smile: '#FF86D0',
  glasses: '#FF86D0',
  crown: '#FF86D0',
  glitch: '#FF86D0',
  reformed: '#9B8CFF',
};

const LABEL: Record<MorphForm, string> = {
  smile: 'MORPH, die außer Kontrolle geratene KI',
  glasses: 'MORPH, die außer Kontrolle geratene KI, mit Pixelbrille und hochgezogener Braue',
  crown: 'MORPH, die außer Kontrolle geratene KI, mit Pixelkrone und breitem Grinsen',
  glitch: 'MORPH, die außer Kontrolle geratene KI, zerfällt in Störungen',
  reformed: 'MORPH, die geläuterte KI, mit ruhigem Lächeln',
};

type Cell = { x: number; y: number; dx: number; o: number };

const lit = (face: readonly string[], x: number, y: number) => face[y]?.[x] === '#';

/** One frame of noise for a form (pure: same form and tick give the same frame). */
function frame(form: MorphForm, tick: number): Cell[] {
  const out: Cell[] = [];
  if (form === 'glitch') {
    // the smile with rows torn sideways and some rows dropping out
    const rng = seededRng(`morph:glitch:${tick}`);
    for (let y = 0; y < N; y++) {
      const r = rng();
      const shift = r < 0.4 ? 0 : r < 0.65 ? -1 : r < 0.88 ? 1 : rng() < 0.5 ? -3 : 3;
      const fade = rng() < 0.18 ? 0.3 : 1;
      for (let x = 0; x < N; x++) {
        const base = (lit(FACE.smile, x - shift, y) ? 0.85 : 0.1) * fade;
        const o = Math.min(1, base * (0.5 + rng() * 0.7) + rng() * 0.4);
        out.push({ x, y, dx: shift * 0.35, o });
      }
    }
    return out;
  }
  const face = FACE[form];
  const calm = form === 'reformed';
  // the smile keeps its original seed and noise so today's look stays the same
  const rng = seededRng(form === 'smile' ? `morph:${tick}` : `morph:${form}:${tick}`);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const base = lit(face, x, y) ? 0.85 : 0.1;
      const o = calm
        ? Math.min(1, base * (0.88 + rng() * 0.12) + rng() * 0.06)
        : Math.min(1, base * (0.6 + rng() * 0.6) + rng() * 0.28);
      out.push({ x, y, dx: 0, o });
    }
  }
  return out;
}

/** MORPH: a face made of flickering noise that keeps re-forming. An explicit `color` overrides the form's colour. */
export function Morph({ size = 120, color, form = 'smile' }: { size?: number; color?: string; form?: MorphForm }) {
  const reduced = useReducedMotion();
  const [tick, setTick] = useState(0);
  const calm = form === 'reformed';
  useEffect(() => {
    if (reduced) return undefined;
    const id = setInterval(() => setTick((t) => t + 1), calm ? CALM_TICK_MS : TICK_MS);
    return () => clearInterval(id);
  }, [reduced, calm]);
  // with reduce motion the face stands still on its first frame
  const t = reduced ? 0 : tick;
  const cells = useMemo(() => frame(form, t), [form, t]);
  const cell = size / N;
  const fill = color ?? COLOR[form];
  return (
    <Canvas style={{ width: size, height: size }} accessible accessibilityRole="image" accessibilityLabel={LABEL[form]}>
      {cells.map((c, i) => (
        <Rect
          key={i}
          x={(c.x + c.dx) * cell + 1}
          y={c.y * cell + 1}
          width={cell - 2}
          height={cell - 2}
          color={fill}
          opacity={c.o}
        />
      ))}
    </Canvas>
  );
}
