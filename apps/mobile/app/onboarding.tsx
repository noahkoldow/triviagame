import { birthYearToAgeGroup } from '@nexus/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bolt, type Mood } from '../src/components/Bolt';
import { type IconName } from '../src/components/Icon';
import { LanguagePicker } from '../src/components/LanguagePicker';
import { MorphScene } from '../src/components/MorphScene';
import { Button } from '../src/components/ui';
import { WIN, Window, WinCheckbox, WinField, sunken } from '../src/components/Win';
import { setLanguage, update } from '../src/state/store';
import { useStrings, type Strings } from '../src/strings';

/** The slides of the story before the profile; their texts are `onboarding.slides` in the UI strings. */
const STORY: {
  stage: 0 | 1 | 2;
  speaker: 'bolt' | 'morph';
  mood?: Mood;
  title: (t: Strings) => string;
  icon: IconName;
  next: (t: Strings) => string;
}[] = [
  { stage: 0, speaker: 'bolt', mood: 'happy', title: (t) => t.onboarding.setup, icon: 'cache', next: (t) => t.onboarding.next },
  { stage: 1, speaker: 'morph', title: (t) => t.onboarding.morphTitle, icon: 'warn', next: (t) => t.onboarding.ok },
  { stage: 2, speaker: 'bolt', mood: 'sad', title: (t) => t.onboarding.setup, icon: 'cache', next: (t) => t.onboarding.next },
  { stage: 2, speaker: 'bolt', mood: 'think', title: (t) => t.onboarding.howTo, icon: 'folder', next: (t) => t.onboarding.next },
];

/** First the language, then the story, then the profile. */
const STEPS = 1 + STORY.length + 1;

export default function Onboarding() {
  const router = useRouter();
  const t = useStrings();
  const { width } = useWindowDimensions();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [consent, setConsent] = useState(false);
  const yearNum = parseInt(year, 10);
  const currentYear = new Date().getFullYear();
  const validYear = yearNum >= 1900 && yearNum <= currentYear;
  const ageGroup = validYear ? birthYearToAgeGroup(yearNum, currentYear) : 'minor';

  const finish = () => {
    update((p) => ({
      ...p,
      profile: {
        ...p.profile,
        name: name.trim() || t.profile.defaultName,
        birthYear: yearNum,
        ageGroup,
        consent: ageGroup === 'adult' && consent,
        onboarded: true,
      },
    }));
  };

  const choosing = step === 0;
  const slide = step >= 1 && step <= STORY.length ? step - 1 : undefined;
  const story = slide !== undefined ? STORY[slide]! : undefined;
  const sceneW = Math.max(240, width - 12 * 2 - 3 * 2 - 10 * 2);
  const stage = story ? story.stage : choosing ? 0 : 2;
  const title = choosing ? t.onboarding.languageTitle : story ? story.title(t) : t.onboarding.profileTitle;

  return (
    <SafeAreaView style={styles.desktop}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Window tone="light" title={title} icon={choosing ? 'cache' : story ? story.icon : 'user'}>
            {/* the picture on the left of the old wizards: here it is the map itself */}
            <View style={[styles.picture, sunken, { borderWidth: 2 }]}>
              <MorphScene stage={stage} width={sceneW - 4} height={story ? 300 : 170} label={t.a11y.scene[stage]!} />
            </View>

            {choosing ? (
              <View style={{ gap: 8 }}>
                <Text style={styles.text} maxFontSizeMultiplier={1.4}>
                  {t.onboarding.languageText}
                </Text>
                <LanguagePicker tone="light" value={t.lang} onChange={setLanguage} />
              </View>
            ) : story && slide !== undefined ? (
              <View style={styles.speakerRow}>
                {story.mood ? <Bolt size={52} mood={story.mood} /> : null}
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.speaker} maxFontSizeMultiplier={1.3}>
                    {t.speakers[story.speaker]}
                  </Text>
                  <Text style={styles.text} maxFontSizeMultiplier={1.4}>
                    {t.onboarding.slides[slide]}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                <Text style={styles.text} maxFontSizeMultiplier={1.4}>
                  {t.onboarding.profileIntro}
                </Text>
                <WinField
                  label={t.onboarding.name}
                  value={name}
                  onChangeText={setName}
                  placeholder={t.onboarding.namePlaceholder}
                  maxLength={20}
                  autoCapitalize="words"
                  textContentType="nickname"
                />
                <WinField
                  label={t.onboarding.birthYear}
                  value={year}
                  onChangeText={setYear}
                  placeholder={t.onboarding.birthYearPlaceholder}
                  keyboardType="number-pad"
                  maxLength={4}
                  hint={t.onboarding.birthYearHint}
                />
                {validYear && ageGroup === 'adult' ? (
                  <WinCheckbox label={t.onboarding.consent} value={consent} onChange={setConsent} />
                ) : null}
                {validYear && ageGroup === 'minor' ? (
                  <Text style={styles.small} maxFontSizeMultiplier={1.4}>
                    {t.onboarding.minor}
                  </Text>
                ) : null}
                <Button label={t.onboarding.readPrivacy} variant="ghost" onPress={() => router.push('/privacy')} />
              </View>
            )}

            <View style={styles.etched} />

            <View style={styles.buttons}>
              <Button
                label={t.onboarding.back}
                variant="ghost"
                disabled={step === 0}
                style={{ flex: 1 }}
                onPress={() => setStep(Math.max(0, step - 1))}
              />
              {step < STEPS - 1 ? (
                <Button
                  label={story ? story.next(t) : t.onboarding.next}
                  style={{ flex: 1 }}
                  onPress={() => setStep(step + 1)}
                />
              ) : (
                <Button label={t.onboarding.finish} style={{ flex: 1 }} disabled={!validYear} onPress={finish} />
              )}
            </View>
            <Text style={styles.small} maxFontSizeMultiplier={1.3}>
              {t.onboarding.step(step + 1, STEPS)}
            </Text>
          </Window>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // the teal desktop of the old systems
  desktop: { flex: 1, backgroundColor: '#008080' },
  scroll: { padding: 12, flexGrow: 1, justifyContent: 'center' },
  picture: { alignItems: 'center', overflow: 'hidden', backgroundColor: '#050A14' },
  speakerRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  speaker: { color: WIN.text, fontSize: 14, fontWeight: '900' },
  text: { color: WIN.text, fontSize: 15, lineHeight: 21 },
  small: { color: WIN.dark, fontSize: 12 },
  etched: { height: 2, borderTopWidth: 1, borderTopColor: WIN.shadow, borderBottomWidth: 1, borderBottomColor: WIN.hi },
  buttons: { flexDirection: 'row', gap: 8 },
});
