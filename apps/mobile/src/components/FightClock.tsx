import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, StyleSheet, Text, View } from 'react-native';
import { useStrings } from '../strings';
import { colors } from '../theme';

/** Seconds as "2:40". */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Whether a screen reader is on; the boss clock doubles then (`fightClock`). */
export function useScreenReader(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setOn).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setOn);
    return () => sub.remove();
  }, []);
  return on;
}

/** Below this many seconds the clock turns red. */
const LOW = 20;
/** A screen reader hears how much time is left at these marks. */
const ANNOUNCE = [60, 30, 10];

/**
 * The clock of a boss fight (D71): `total` seconds for all questions, which only run while
 * `running` (a question is open) and the app is in front. `onTimeUp` fires once at zero.
 * Returns the seconds left.
 */
export function useFightClock(total: number, running: boolean, onTimeUp: () => void): number {
  const t = useStrings();
  const left = useRef(total * 1000);
  const [shown, setShown] = useState(total);
  const fired = useRef(false);
  const ran = useRef(false);
  const timeUp = useRef(onTimeUp);
  timeUp.current = onTimeUp;
  const [active, setActive] = useState(AppState.currentState === 'active');

  // the clock is set once the fight knows it (a screen reader doubles it); once it ran it stays
  useEffect(() => {
    if (ran.current) return;
    left.current = total * 1000;
    setShown(total);
  }, [total]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setActive(s === 'active'));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!running || !active || fired.current) return;
    ran.current = true;
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const before = Math.ceil(left.current / 1000);
      left.current = Math.max(0, left.current - (now - last));
      last = now;
      const s = Math.ceil(left.current / 1000);
      if (s !== before) {
        setShown(s);
        if (ANNOUNCE.includes(s)) AccessibilityInfo.announceForAccessibility(t.boss.clockA11y(s));
      }
      if (left.current <= 0 && !fired.current) {
        fired.current = true;
        clearInterval(id);
        timeUp.current();
      }
    }, 200);
    return () => clearInterval(id);
  }, [running, active]); // eslint-disable-line react-hooks/exhaustive-deps

  return shown;
}

/** The clock as a bar that runs down, with the time beside it. */
export function ClockBar({ left, total }: { left: number; total: number }) {
  const t = useStrings();
  const low = left <= LOW;
  const tint = low ? colors.bad : colors.accent;
  return (
    <View style={styles.row} accessible accessibilityRole="timer" accessibilityLabel={t.boss.clockA11y(left)}>
      <Text style={[styles.time, { color: tint }]} maxFontSizeMultiplier={1.3}>
        {formatClock(left)}
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${total > 0 ? (left / total) * 100 : 0}%`, backgroundColor: tint }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  time: { fontSize: 15, fontWeight: '900', fontVariant: ['tabular-nums'], minWidth: 44 },
  track: { flex: 1, height: 8, backgroundColor: '#1A2430' },
  fill: { height: 8 },
});
