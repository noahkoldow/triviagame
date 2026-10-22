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
import { colors } from '../theme';
import { Icon, type IconName } from './Icon';
import { WIN, pressedIn, raised, sunken, TitleBar } from './Win';

export function tap(kind: 'light' | 'success' | 'error' = 'light') {
  if (kind === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  else
    Haptics.notificationAsync(
      kind === 'success'
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error,
    ).catch(() => {});
}

/**
 * A grey button with a raised bevel that is pushed in while pressed. The main
 * action is the "default button": bold, with a black frame around it.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
  sub,
  icon,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger' | 'gem';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  sub?: string;
  /** Small icon after the label, e.g. the price currency. */
  icon?: IconName;
}) {
  const fg = disabled
    ? WIN.shadow
    : variant === 'danger'
      ? '#B00020'
      : variant === 'gem'
        ? '#5B1E96'
        : variant === 'primary'
          ? '#0B2A00'
          : WIN.text;
  const button = (
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
        raised,
        variant === 'primary' && !disabled && styles.btnGreen,
        pressed && !disabled && pressedIn,
      ]}
    >
      {({ pressed }) => (
        <View style={pressed && !disabled ? { transform: [{ translateX: 1 }, { translateY: 1 }] } : null}>
          <View style={styles.btnRow}>
            <Text maxFontSizeMultiplier={1.3} style={[styles.btnLabel, { color: fg }, variant === 'primary' && styles.btnDefault]}>
              {label}
            </Text>
            {icon ? <Icon name={icon} size={16} muted={disabled} /> : null}
          </View>
          {sub ? <Text style={[styles.btnSub, { color: disabled ? WIN.shadow : WIN.dark }]}>{sub}</Text> : null}
        </View>
      )}
    </Pressable>
  );
  // the default button gets a black frame, like in the old dialogs
  return variant === 'primary' && !disabled ? (
    <View style={[styles.defaultFrame, style]}>{button}</View>
  ) : (
    <View style={style}>{button}</View>
  );
}

/** A sunken dark panel, like a console area inside a window. */
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, sunken, style]}>{children}</View>;
}

export function H1({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text maxFontSizeMultiplier={1.4} style={[styles.h1, style]}>{children}</Text>;
}

export function P({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text maxFontSizeMultiplier={1.5} style={[styles.p, style]}>{children}</Text>;
}

/** Top bar of the secondary screens: a window title bar with a close button. */
export function BackBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={[styles.bar, raised]}>
      <TitleBar
        title={title}
        onClose={() => {
          tap();
          onBack();
        }}
      />
    </View>
  );
}

/** A status pane, e.g. for balances and rewards: sunken, with the value in colour. */
export function Chip({ label, color, icon }: { label: string; color: string; icon?: IconName }) {
  return (
    <View style={[styles.chip, sunken]}>
      {icon ? <Icon name={icon} size={18} /> : null}
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}

export function Pill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.pill, sunken, { borderWidth: 1 }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGreen: { backgroundColor: '#58CC02', borderTopColor: '#B8F27A', borderLeftColor: '#B8F27A', borderRightColor: '#2C6A00', borderBottomColor: '#2C6A00' },
  defaultFrame: { borderWidth: 1, borderColor: WIN.black, padding: 0 },
  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  btnLabel: { fontSize: 14, fontWeight: '600' },
  btnDefault: { fontWeight: '900' },
  btnSub: { fontSize: 11, textAlign: 'center', marginTop: 1 },
  card: { padding: 14 },
  h1: { color: colors.text, fontSize: 24, fontWeight: '900' },
  p: { color: colors.dim, fontSize: 15, lineHeight: 22 },
  bar: { padding: 3 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipText: { fontSize: 16, fontWeight: '900' },
  pill: { paddingHorizontal: 8, paddingVertical: 2 },
  pillText: { fontSize: 12, fontWeight: '800' },
});
