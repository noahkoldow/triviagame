import { Canvas, Rect } from '@shopify/react-native-skia';
import { useEffect, useMemo, useState } from 'react';
import { seededRng } from '@nexus/shared';

const N = 12;

/** MORPH: a face made of flickering noise that keeps re-forming. */
export function Morph({ size = 120, color = '#F472B6' }: { size?: number; color?: string }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 160);
    return () => clearInterval(id);
  }, []);
  const cells = useMemo(() => {
    const rng = seededRng(`morph:${tick}`);
    const out: { x: number; y: number; o: number }[] = [];
    const cell = size / N;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const eye = (y === 4 || y === 5) && (x === 3 || x === 4 || x === 7 || x === 8);
        const mouth = y === 8 && x >= 3 && x <= 8;
        const base = eye || mouth ? 0.85 : 0.1;
        const o = Math.min(1, base * (0.6 + rng() * 0.6) + rng() * 0.28);
        out.push({ x: x * cell, y: y * cell, o });
      }
    }
    return out;
  }, [tick, size]);
  const cell = size / N;
  return (
    <Canvas
      style={{ width: size, height: size }}
      accessibilityLabel="MORPH, die außer Kontrolle geratene KI"
    >
      {cells.map((c, i) => (
        <Rect
          key={i}
          x={c.x + 1}
          y={c.y + 1}
          width={cell - 2}
          height={cell - 2}
          color={color}
          opacity={c.o}
        />
      ))}
    </Canvas>
  );
}
