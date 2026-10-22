import * as Haptics from 'expo-haptics';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, radius, shade } from '../theme';

export function tap(kind: 'light' | 'success' | 'error' = 'light') {
  if (kind === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  else
    Haptics.notificationAsync(
      kind === 'success'
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error,
    ).catch(() => {});
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
  sub,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger' | 'gem';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  sub?: string;
}) {
  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.bad
        : variant === 'gem'
          ? colors.gem
          : colors.panel;
  const edge = variant === 'ghost' ? colors.line : shade(bg, 0.32);
  const fg = variant === 'ghost' ? colors.accent : '#FFFFFF';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: disabled ? colors.line : bg,
          borderBottomColor: disabled ? shade(colors.line) : edge,
          borderColor: variant === 'ghost' ? colors.line : bg,
        },
        // pressed: the thick edge shrinks, so the button looks pushed in
        pressed && { borderBottomWidth: 2, transform: [{ translateY: 2 }] },
        disabled && { opacity: 0.7 },
        style,
      ]}
    >
      <Text style={[styles.btnLabel, { color: disabled ? colors.dim : fg }]}>{label.toUpperCase()}</Text>
      {sub ? <Text style={[styles.btnSub, { color: disabled ? colors.dim : fg }]}>{sub}</Text> : null}
    </Pressable>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function H1({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.h1, style]}>{children}</Text>;
}

export function P({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.p, style]}>{children}</Text>;
}

/** Top bar of the secondary screens: round back button and a title. */
export function BackBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.bar}>
      <Pressable
        onPress={() => {
          tap();
          onBack();
        }}
        accessibilityRole="button"
        accessibilityLabel="Zurück"
        hitSlop={10}
        style={({ pressed }) => [styles.backBtn, pressed && { transform: [{ translateY: 2 }], borderBottomWidth: 2 }]}
      >
        <Text style={styles.backGlyph}>✕</Text>
      </Pressable>
      <Text style={styles.barTitle} accessibilityRole="header">
        {title}
      </Text>
    </View>
  );
}

/** Rounded stat chip, e.g. for balances and rewards. */
export function Chip({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.chip, { borderColor: color }]}>
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}

export function Pill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 2,
    borderBottomWidth: 5,
    paddingHorizontal: 18,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLabel: { fontSize: 15, fontWeight: '900', letterSpacing: 0.9 },
  btnSub: { fontSize: 11, fontWeight: '700', opacity: 0.85, marginTop: 1 },
  card: {
    backgroundColor: colors.panel,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: colors.line,
  },
  h1: { color: colors.text, fontSize: 26, fontWeight: '900' },
  p: { color: colors.dim, fontSize: 15, lineHeight: 22 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backGlyph: { color: colors.dim, fontSize: 18, fontWeight: '900' },
  barTitle: { color: colors.text, fontSize: 24, fontWeight: '900', flex: 1 },
  chip: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: colors.panel,
  },
  chipText: { fontSize: 16, fontWeight: '900' },
  pill: { borderWidth: 2, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 3 },
  pillText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
});
