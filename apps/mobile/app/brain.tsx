import { Canvas, Circle, Group, Path, Skia, type SkPath } from '@shopify/react-native-skia';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Easing, useDerivedValue, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { REVEAL_ID, SECTOR_COLOR, brainReveal, markSeen, sectorOfArea, type Sector } from '@nexus/shared';
import {
  BRAIN_CENTER,
  CEREBELLUM,
  CEREBRUM,
  REGION,
  STEM,
  SULCI,
  dendrites,
  mapNetwork,
  pathways,
  type Curve,
} from '../src/components/brain.logic';
import { Portrait, speakerName } from '../src/components/StoryDialog';
import { Button } from '../src/components/ui';
import { pool } from '../src/services/content';
import { getState, update } from '../src/state/store';
import { useStrings } from '../src/strings';
import { colors } from '../src/theme';

const SECTORS_OF_NET: Sector[] = ['science', 'earth', 'humanities', 'society'];

const svg = (d: string): SkPath => Skia.Path.MakeFromSVGString(d) ?? Skia.PathBuilder.Make().detach();

function curvesPath(curves: Curve[]): SkPath {
  const b = Skia.PathBuilder.Make();
  for (const c of curves) {
    b.moveTo(c.a.x, c.a.y);
    b.quadTo(c.c.x, c.c.y, c.b.x, c.b.y);
  }
  return b.detach();
}

/** Circuit traces: horizontal, then vertical, like on a board. */
function tracesPath(curves: Curve[]): SkPath {
  const b = Skia.PathBuilder.Make();
  for (const c of curves) {
    b.moveTo(c.a.x, c.a.y);
    b.lineTo(c.b.x, c.a.y);
    b.lineTo(c.b.x, c.b.y);
  }
  return b.detach();
}

/**
 * The reveal after beating morph.ai: the network's circuit traces turn into nerve pathways and
 * the camera pulls back until the player sees a brain, their own. Also reachable from the settings.
 */
export default function BrainReveal() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const t = useStrings();
  const steps = useMemo(() => brainReveal(t.lang), [t.lang]);
  const s = steps[step]!;
  const last = step === steps.length - 1;

  // the first time after the finale the league follows; a replay from the settings just goes back
  const [first] = useState(() => {
    const p = getState();
    return p.story.finale && !p.story.seen.includes(REVEAL_ID);
  });
  // seen once the story got here (a replay from the settings before the finale changes nothing)
  useEffect(() => {
    update((p) => (p.story.finale ? markSeen(p, REVEAL_ID) : null));
  }, []);

  const art = useMemo(() => {
    const p = getState();
    const net = mapNetwork(
      Object.values(p.network.nodes).map((n) => ({
        id: n.id,
        parentId: n.parentId,
        pos: n.pos,
        sector: sectorOfArea(pool.get(n.questionId).area),
      })),
    );
    const bySector = (sec: Sector) => net.edges.filter((e) => e.sector === sec);
    const dots = Skia.PathBuilder.Make();
    for (const pt of net.points) dots.addCircle(pt.x, pt.y, pt.id === 'core' ? 6 : 3.4);
    return {
      outline: [svg(CEREBRUM), svg(CEREBELLUM), svg(STEM)],
      sulci: SULCI.map(svg),
      paths: curvesPath(pathways('nexus')),
      dendrites: curvesPath(net.points.flatMap((pt) => dendrites(pt, pt.id, 3, 10))),
      traces: SECTORS_OF_NET.map((sec) => ({ sec, path: tracesPath(bySector(sec)) })),
      nerves: SECTORS_OF_NET.map((sec) => ({ sec, path: curvesPath(bySector(sec)) })),
      dots: dots.detach(),
    };
  }, []);

  // camera and fades follow the step
  const zoom = useSharedValue(reduced ? s.zoom : 0);
  const nerve = useSharedValue(reduced ? s.nerve : 0);
  const brain = useSharedValue(reduced ? s.brain : 0);
  useEffect(() => {
    const go = (v: typeof zoom, to: number, ms: number) => {
      v.value = reduced ? to : withTiming(to, { duration: ms, easing: Easing.inOut(Easing.cubic) });
    };
    go(zoom, s.zoom, s.zoom === 1 && step === 2 ? 6000 : 2800);
    go(nerve, s.nerve, 2400);
    go(brain, s.brain, 4000);
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const viewH = height * 0.62;
  const s0 = (Math.min(width, viewH) * 0.85) / (2 * REGION.r);
  const s1 = Math.min(width / 1000, viewH / 760) * 0.95;
  const scaleAt = (z: number) => {
    'worklet';
    return s0 * Math.pow(s1 / s0, z);
  };
  const transform = useDerivedValue(() => {
    const z = zoom.value;
    const k = Math.min(1, z * 1.15);
    const cx = REGION.x + (BRAIN_CENTER.x - REGION.x) * k;
    const cy = REGION.y + (BRAIN_CENTER.y - REGION.y) * k;
    return [{ translateX: width / 2 }, { translateY: viewH / 2 + 24 }, { scale: scaleAt(z) }, { translateX: -cx }, { translateY: -cy }];
  });
  // lines keep their width on screen while the camera pulls back
  const thin = useDerivedValue(() => 1.4 / scaleAt(zoom.value));
  const wide = useDerivedValue(() => 5 / scaleAt(zoom.value));
  const trace = useDerivedValue(() => 1 - nerve.value);
  const glow = useDerivedValue(() => nerve.value * 0.35);
  const brainLines = useDerivedValue(() => brain.value * 0.5);
  const brainFill = useDerivedValue(() => brain.value * 0.25);

  const done = () => {
    // in place of the reveal, so going back from the league lands on the map
    if (first) router.replace({ pathname: '/league', params: { welcome: '1' } });
    else if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <SafeAreaView style={styles.root}>
      <Canvas
        style={{ width, height: viewH + 48 }}
        accessible
        accessibilityLabel={t.brain.a11y}
      >
        <Group transform={transform}>
          {/* the brain around the network */}
          {art.outline.map((p, i) => (
            <Path key={`f${i}`} path={p} color="#2A1640" opacity={brainFill} />
          ))}
          <Path path={art.paths} style="stroke" strokeWidth={thin} color="#D6B8FF" opacity={brainLines} />
          {art.sulci.map((p, i) => (
            <Path key={`s${i}`} path={p} style="stroke" strokeWidth={wide} strokeCap="round" color="#B48CE6" opacity={brainLines} />
          ))}
          {art.outline.map((p, i) => (
            <Path key={`o${i}`} path={p} style="stroke" strokeWidth={wide} color="#F3E9FF" opacity={brain} />
          ))}
          {/* the player's own network: circuit traces that become nerves */}
          {art.traces.map(({ sec, path }) => (
            <Path key={`t${sec}`} path={path} style="stroke" strokeWidth={thin} color={SECTOR_COLOR[sec]} opacity={trace} />
          ))}
          {art.nerves.map(({ sec, path }) => (
            <Group key={`n${sec}`}>
              <Path path={path} style="stroke" strokeWidth={wide} strokeCap="round" color={SECTOR_COLOR[sec]} opacity={glow} />
              <Path path={path} style="stroke" strokeWidth={thin} strokeCap="round" color="#FFFFFF" opacity={nerve} />
            </Group>
          ))}
          <Path path={art.dendrites} style="stroke" strokeWidth={thin} strokeCap="round" color="#FFE6F4" opacity={nerve} />
          <Path path={art.dots} color="#FFFFFF" />
          <Circle cx={REGION.x} cy={REGION.y} r={REGION.r * 1.15} color={colors.accent} opacity={glow} style="stroke" strokeWidth={thin} />
        </Group>
      </Canvas>

      <View style={styles.panel}>
        {s.quote ? (
          <Text style={styles.quote} accessibilityRole="header">
            {s.text}
          </Text>
        ) : (
          <View style={styles.row}>
            {s.speaker ? <Portrait speaker={s.speaker} mood={s.mood} form={s.form} size={56} /> : null}
            <View style={{ flex: 1, gap: 4 }}>
              {s.speaker ? <Text style={styles.speaker}>{speakerName(s.speaker, t)}</Text> : null}
              <Text style={styles.text}>{s.text}</Text>
            </View>
          </View>
        )}
        <Button label={last ? t.brain.keepGrowing : t.common.next} onPress={() => (last ? done() : setStep(step + 1))} />
        {!last ? <Button label={t.brain.skip} variant="ghost" onPress={done} /> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#05070D' },
  panel: { flex: 1, paddingHorizontal: 16, paddingBottom: 8, gap: 10, justifyContent: 'flex-end' },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  speaker: { color: colors.accent, fontSize: 13, fontWeight: '900', letterSpacing: 0.6 },
  text: { color: colors.text, fontSize: 17, lineHeight: 24 },
  quote: { color: colors.text, fontSize: 24, lineHeight: 32, fontStyle: 'italic', textAlign: 'center', fontWeight: '700' },
});
