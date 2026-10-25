import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LANGS, LANG_NAMES, type Lang } from '@nexus/shared';
import { colors } from '../theme';
import { tap } from './ui';
import { WIN } from './Win';

/**
 * The four languages as radio buttons, each named in its own language so everybody finds theirs.
 * `light` is for the grey windows of the onboarding, `dark` for cards.
 */
export function LanguagePicker({
  value,
  onChange,
  tone = 'dark',
}: {
  value: Lang;
  onChange: (lang: Lang) => void;
  tone?: 'dark' | 'light';
}) {
  const ink = tone === 'light' ? WIN.text : colors.text;
  return (
    <View accessibilityRole="radiogroup" style={{ gap: 2 }}>
      {LANGS.map((lang) => {
        const on = lang === value;
        return (
          <Pressable
            key={lang}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={LANG_NAMES[lang]}
            onPress={() => {
              if (on) return;
              tap();
              onChange(lang);
            }}
            style={({ pressed }) => [styles.option, pressed && { opacity: 0.6 }]}
          >
            <View style={[styles.radio, { borderColor: tone === 'light' ? WIN.dark : colors.dim }, on && styles.radioOn]} />
            <Text style={[styles.name, { color: ink }]} maxFontSizeMultiplier={1.4}>
              {LANG_NAMES[lang]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  radioOn: { borderColor: colors.accent, backgroundColor: colors.accent },
  name: { fontSize: 16, fontWeight: '700' },
});
