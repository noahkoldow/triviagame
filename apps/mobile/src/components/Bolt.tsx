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
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export type Mood = 'happy' | 'think' | 'sad' | 'wow' | 'wink';

/** Bolt, the companion robot: a floating round body with a display face. */
export function Bolt({
  size = 96,
  mood = 'happy',
  color = '#22D3EE',
}: {
  size?: number;
  mood?: Mood;
  color?: string;
}) {
  const bob = useSharedValue(0);
  useEffect(() => {
    bob.value = withRepeat(
      withSequence(withTiming(-4, { duration: 900 }), withTiming(0, { duration: 900 })),
      -1,
    );
  }, [bob]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));

  const mouth = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    if (mood === 'happy' || mood === 'wink') {
      p.moveTo(40, 55);
      p.quadTo(50, 64, 60, 55);
    } else if (mood === 'sad') {
      p.moveTo(41, 61);
      p.quadTo(50, 53, 59, 61);
    } else if (mood === 'think') {
      p.moveTo(42, 58);
      p.lineTo(58, 56);
    } else {
      p.addCircle(50, 58, 4);
    }
    return p.detach();
  }, [mood]);

  const leftEye =
    mood === 'wink' ? (
      <Line
        p1={vec(31, 44)}
        p2={vec(41, 44)}
        color={color}
        style="stroke"
        strokeWidth={3}
        strokeCap="round"
      />
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

  return (
    <Animated.View
      style={[{ width: size, height: size }, style]}
      accessible
      accessibilityLabel="Bolt, dein Begleiter-Roboter"
    >
      <Canvas style={{ width: size, height: size }}>
        <Group transform={[{ scale: size / 100 }]}>
          {/* ground glow */}
          <Circle cx={50} cy={92} r={12} color={color} opacity={0.35}>
            <Blur blur={6} />
          </Circle>
          {/* antenna */}
          <Line p1={vec(50, 24)} p2={vec(50, 11)} color="#9FB0C9" style="stroke" strokeWidth={3} />
          <Circle cx={50} cy={9} r={4.5} color={color} />
          {/* arms */}
          <Circle cx={11} cy={58} r={7} color="#8EA0BD" />
          <Circle cx={89} cy={58} r={7} color="#8EA0BD" />
          {/* body */}
          <RoundedRect x={14} y={24} width={72} height={62} r={28}>
            <LinearGradient start={vec(14, 24)} end={vec(86, 86)} colors={['#F1F6FD', '#9FB0C9']} />
          </RoundedRect>
          {/* screen */}
          <RoundedRect x={22} y={32} width={56} height={40} r={17} color="#0B1220" />
          {leftEye}
          {rightEye}
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
