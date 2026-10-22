import { useId } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme';
import { Icon, type IconName } from './Icon';

/**
 * The retro desktop look (Windows 95/98/XP): grey faces with raised and sunken
 * bevels, navy title bars with a gradient, square corners. Content areas stay
 * dark, like a console window, so all existing text colours keep working.
 */
export const WIN = {
  face: '#C0C0C0',
  hi: '#FFFFFF',
  mid: '#DFDFDF',
  shadow: '#808080',
  dark: '#404040',
  black: '#000000',
  titleA: '#000080',
  titleB: '#1084D0',
  text: '#000000',
};

/** A raised grey surface (buttons, panels, toolbars). */
export const raised = {
  backgroundColor: WIN.face,
  borderWidth: 2,
  borderTopColor: WIN.hi,
  borderLeftColor: WIN.hi,
  borderRightColor: WIN.dark,
  borderBottomColor: WIN.dark,
} as const;

/** The same surface pushed in (pressed buttons). */
export const pressedIn = {
  borderTopColor: WIN.dark,
  borderLeftColor: WIN.dark,
  borderRightColor: WIN.hi,
  borderBottomColor: WIN.hi,
} as const;

/** A sunken dark field: text boxes, status panes, console areas. */
export const sunken = {
  backgroundColor: colors.panel,
  borderWidth: 2,
  borderTopColor: WIN.shadow,
  borderLeftColor: WIN.shadow,
  borderRightColor: WIN.hi,
  borderBottomColor: WIN.hi,
} as const;

/** Title bar with the classic blue gradient, an optional icon and a close button. */
export function TitleBar({
  title,
  icon,
  onClose,
}: {
  title: string;
  icon?: IconName;
  onClose?: () => void;
}) {
  const id = useId().replace(/:/g, '');
  return (
    <View style={styles.title}>
      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 100 10">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={WIN.titleA} />
            <Stop offset="1" stopColor={WIN.titleB} />
          </LinearGradient>
        </Defs>
        <Rect width="100" height="10" fill={`url(#${id})`} />
      </Svg>
      {icon ? <Icon name={icon} size={16} /> : null}
      <Text style={styles.titleText} numberOfLines={1} maxFontSizeMultiplier={1.3} accessibilityRole="header">
        {title}
      </Text>
      {onClose ? (
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Schließen"
          hitSlop={{ top: 13, bottom: 13, left: 12, right: 12 }}
          style={({ pressed }) => [styles.closeBtn, raised, pressed && pressedIn]}
        >
          <Icon name="close" size={11} color={WIN.black} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** A window: raised frame, title bar, dark content area. */
export function Window({
  title,
  icon,
  onClose,
  children,
  style,
  bodyStyle,
  tone = 'dark',
}: {
  title: string;
  icon?: IconName;
  onClose?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  bodyStyle?: StyleProp<ViewStyle>;
  /** `light` is a classic grey form (black text); `dark` is a console area. */
  tone?: 'dark' | 'light';
}) {
  return (
    <View style={[styles.frame, raised, style]}>
      <TitleBar title={title} icon={icon} onClose={onClose} />
      <View style={[styles.body, tone === 'dark' ? sunken : styles.lightBody, bodyStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { padding: 3, gap: 3 },
  title: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 5,
    paddingRight: 3,
    overflow: 'hidden',
  },
  titleText: { flex: 1, color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  closeBtn: { width: 22, height: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  body: { padding: 12, gap: 10 },
  lightBody: { backgroundColor: WIN.face, padding: 10, gap: 10 },
  label: { color: WIN.text, fontSize: 14, fontWeight: '600' },
  field: {
    backgroundColor: '#FFFFFF',
    color: WIN.black,
    fontSize: 16,
    minHeight: 44,
    paddingHorizontal: 8,
    borderWidth: 2,
    borderTopColor: WIN.shadow,
    borderLeftColor: WIN.shadow,
    borderRightColor: WIN.hi,
    borderBottomColor: WIN.hi,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  checkBox: {
    width: 22,
    height: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderTopColor: WIN.shadow,
    borderLeftColor: WIN.shadow,
    borderRightColor: WIN.hi,
    borderBottomColor: WIN.hi,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/** A dialog box inside a modal: a window that swallows taps so the backdrop does not close it. */
export function Dialog({
  title,
  icon,
  onClose,
  children,
}: {
  title: string;
  icon?: IconName;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable onPress={() => undefined}>
      <Window title={title} icon={icon} onClose={onClose}>
        {children}
      </Window>
    </Pressable>
  );
}

/** A labelled text field of a classic form: white, sunken, black text. */
export function WinField({
  label,
  hint,
  ...input
}: { label: string; hint?: string } & TextInputProps) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.label} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
      <TextInput
        {...input}
        accessibilityLabel={input.accessibilityLabel ?? label}
        placeholderTextColor={WIN.shadow}
        style={styles.field}
      />
      {hint ? (
        <Text style={{ color: WIN.dark, fontSize: 12 }} maxFontSizeMultiplier={1.3}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

/** A check box with its label, as in the old dialogs. */
export function WinCheckbox({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      style={styles.checkRow}
    >
      <View style={styles.checkBox}>{value ? <Icon name="check" size={16} color={WIN.black} /> : null}</View>
      <Text style={[styles.label, { flex: 1 }]} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
    </Pressable>
  );
}
