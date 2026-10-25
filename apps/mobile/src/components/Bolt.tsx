import {
  Canvas,
  Circle,
  Group,
  Line,
  LinearGradient,
  Path,
  RoundedRect,
  Skia,
  vec,
  Blur,
} from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useStrings } from '../strings';

export type Mood = 'happy' | 'think' | 'sad' | 'wow' | 'wink' | 'proud' | 'worried' | 'sleepy';

/** Bolt, the companion robot: a floating round body with a display face. */
export function Bolt({
  size = 96,
  mood = 'happy',
  color = '#1CB0F6',
}: {
  size?: number;
  mood?: Mood;
  color?: string;
}) {
  const t = useStrings();
  const reduced = useReducedMotion();
  const bob = useSharedValue(0);
  useEffect(() => {
    if (reduced) {
      cancelAnimation(bob);
      bob.value = 0;
      return undefined;
    }
    bob.value = withRepeat(
      withSequence(withTiming(-4, { duration: 900 }), withTiming(0, { duration: 900 })),
      -1,
    );
    return () => cancelAnimation(bob);
  }, [bob, reduced]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));

  const mouth = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    if (mood === 'happy' || mood === 'wink' || mood === 'proud') {
      p.moveTo(40, 55);
      p.quadTo(50, 64, 60, 55);
    } else if (mood === 'sad') {
      p.moveTo(41, 61);
      p.quadTo(50, 53, 59, 61);
    } else if (mood === 'think') {
      p.moveTo(42, 58);
      p.lineTo(58, 56);
    } else if (mood === 'worried') {
      // a nervous wave
      p.moveTo(39, 59);
      p.quadTo(42.7, 55, 46.3, 59);
      p.quadTo(50, 63, 53.7, 59);
      p.quadTo(57.3, 55, 61, 59);
    } else if (mood === 'sleepy') {
      p.moveTo(46, 58);
      p.lineTo(54, 58);
    } else {
      p.addCircle(50, 58, 4);
    }
    return p.detach();
  }, [mood]);

  // proud: happy arcs (^ ^)
  const arcs = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    p.moveTo(31, 46);
    p.quadTo(36.5, 37, 42, 46);
    p.moveTo(58, 46);
    p.quadTo(63.5, 37, 69, 46);
    return p.detach();
  }, []);

  const flatEye = (x1: number, x2: number, y: number) => (
    <Line p1={vec(x1, y)} p2={vec(x2, y)} color={color} style="stroke" strokeWidth={3} strokeCap="round" />
  );
  // worried: eyes tilted with their inner corners up
  const tiltedEye = (x: number, angle: number) => (
    <Group transform={[{ rotate: angle }]} origin={vec(x + 4.5, 45)}>
      <RoundedRect x={x} y={40} width={9} height={10} r={4} color={color} />
    </Group>
  );

  let eyes;
  if (mood === 'proud') {
    eyes = <Path path={arcs} color={color} style="stroke" strokeWidth={3} strokeCap="round" />;
  } else if (mood === 'sleepy') {
    eyes = (
      <>
        {flatEye(32, 41, 45)}
        {flatEye(59, 68, 45)}
      </>
    );
  } else if (mood === 'worried') {
    eyes = (
      <>
        {tiltedEye(32, -0.35)}
        {tiltedEye(59, 0.35)}
      </>
    );
  } else {
    const leftEye =
      mood === 'wink' ? (
        flatEye(31, 41, 44)
      ) : (
        <RoundedRect x={32} y={38} width={9} height={mood === 'wow' ? 14 : 12} r={4} color={color} />
      );
    const rightEye = (
      <RoundedRect
        x={59}
        y={mood === 'think' ? 40 : 38}
        width={9}
        height={mood === 'think' ? 8 : mood === 'wow' ? 14 : 12}
        r={4}
        color={color}
      />
    );
    eyes = (
      <>
        {leftEye}
        {rightEye}
      </>
    );
  }

  return (
    <Animated.View
      style={[{ width: size, height: size }, style]}
      accessible
      accessibilityLabel={t.a11y.bolt}
    >
      <Canvas style={{ width: size, height: size }}>
        <Group transform={[{ scale: size / 100 }]}>
          {/* ground glow */}
          <Circle cx={50} cy={92} r={12} color={color} opacity={0.35}>
            <Blur blur={6} />
          </Circle>
          {/* antenna */}
          <Line p1={vec(50, 24)} p2={vec(50, 11)} color="#9FB0C9" style="stroke" strokeWidth={3} />
          {mood === 'proud' ? (
            <Circle cx={50} cy={9} r={8} color={color} opacity={0.75}>
              <Blur blur={4} />
            </Circle>
          ) : null}
          <Circle cx={50} cy={9} r={4.5} color={color} opacity={mood === 'sleepy' ? 0.45 : 1} />
          {mood === 'proud' ? <Circle cx={50} cy={9} r={2} color="#FFFFFF" opacity={0.85} /> : null}
          {/* sleepy: a small z beside the antenna tip */}
          {mood === 'sleepy' ? (
            <Path
              path="M58 2 L65 2 L58 8.5 L65 8.5"
              color={color}
              style="stroke"
              strokeWidth={2}
              strokeCap="round"
              strokeJoin="round"
            />
          ) : null}
          {/* arms */}
          <Circle cx={11} cy={58} r={7} color="#8EA0BD" />
          <Circle cx={89} cy={58} r={7} color="#8EA0BD" />
          {/* body */}
          <RoundedRect x={14} y={24} width={72} height={62} r={28}>
            <LinearGradient start={vec(14, 24)} end={vec(86, 86)} colors={['#F1F6FD', '#9FB0C9']} />
          </RoundedRect>
          {/* screen */}
          <RoundedRect x={22} y={32} width={56} height={40} r={17} color="#0B1220" />
          {eyes}
          <Path
            path={mouth}
            color={color}
            style={mood === 'wow' ? 'fill' : 'stroke'}
            strokeWidth={3}
            strokeCap="round"
          />
          {/* belly light */}
          <Circle cx={50} cy={79} r={3} color={color} />
        </Group>
      </Canvas>
    </Animated.View>
  );
}
