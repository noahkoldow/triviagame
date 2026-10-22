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
import { MorphScene } from '../src/components/MorphScene';
import { Button } from '../src/components/ui';
import { WIN, Window, WinCheckbox, WinField, sunken } from '../src/components/Win';
import { update } from '../src/state/store';

const STORY: {
  stage: 0 | 1 | 2;
  speaker: string;
  mood?: Mood;
  title: string;
  icon: IconName;
  text: string;
  next: string;
}[] = [
  {
    stage: 0,
    speaker: 'Bolt',
    mood: 'happy',
    title: 'Nexus Setup',
    icon: 'cache',
    text: 'Pling! Willkommen im Nexus. Hier laufen alle Fäden des Wissens zusammen: ein riesiges Netz aus Sechsecken, mit einem Chip im Kern. Ich bin Bolt, dein Begleiter.',
    next: 'Weiter >',
  },
  {
    stage: 1,
    speaker: 'MORPH.EXE',
    title: 'MORPH.EXE hat einen Fehler verursacht',
    icon: 'warn',
    text: 'Ich habe das Netz optimiert. Wissen? Viel zu viel Rauschen. Ich habe alles für dich bereinigt. Gern geschehen.',
    next: 'OK',
  },
  {
    stage: 2,
    speaker: 'Bolt',
    mood: 'sad',
    title: 'Nexus Setup',
    icon: 'cache',
    text: 'Aua! Das Netz ist zerrissen, doch im Kern glimmt noch ein Funke. Sammle Fragmente, beantworte Fragen und knüpfe das Netz neu. Jede richtige Antwort öffnet zwei neue Wege.',
    next: 'Weiter >',
  },
];

const STEPS = STORY.length + 1;

export default function Onboarding() {
  const router = useRouter();
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
        name: name.trim() || 'Rekonstrukteur',
        birthYear: yearNum,
        ageGroup,
        consent: ageGroup === 'adult' && consent,
        onboarded: true,
      },
    }));
  };

  const story = step < STORY.length ? STORY[step]! : undefined;
  const sceneW = Math.max(240, width - 12 * 2 - 3 * 2 - 10 * 2);
  const stage = story ? story.stage : 2;

  return (
    <SafeAreaView style={styles.desktop}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Window
            tone="light"
            title={story ? `${story.title}` : 'Nexus Setup: Profil'}
            icon={story ? story.icon : 'user'}
          >
            {/* the picture on the left of the old wizards: here it is the map itself */}
            <View style={[styles.picture, sunken, { borderWidth: 2 }]}>
              <MorphScene stage={stage} width={sceneW - 4} height={story ? 300 : 170} />
            </View>

            {story ? (
              <>
                <View style={styles.speakerRow}>
                  {story.mood ? <Bolt size={52} mood={story.mood} /> : null}
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.speaker} maxFontSizeMultiplier={1.3}>
                      {story.speaker}
                    </Text>
                    <Text style={styles.text} maxFontSizeMultiplier={1.4}>
                      {story.text}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <View style={{ gap: 12 }}>
                <Text style={styles.text} maxFontSizeMultiplier={1.4}>
                  Zum Schluss ein paar Angaben, damit Nexus zu dir passt. Alles bleibt auf deinem Gerät.
                </Text>
                <WinField
                  label="Name:"
                  value={name}
                  onChangeText={setName}
                  placeholder="Dein Name"
                  maxLength={20}
                  autoCapitalize="words"
                  textContentType="nickname"
                />
                <WinField
                  label="Geburtsjahr:"
                  value={year}
                  onChangeText={setYear}
                  placeholder="z. B. 1998"
                  keyboardType="number-pad"
                  maxLength={4}
                  hint="Damit Werbung und Datenschutz passend eingestellt werden. Das Alter verlässt dein Gerät nicht."
                />
                {validYear && ageGroup === 'adult' ? (
                  <WinCheckbox
                    label="Personalisierte Werbung erlauben (optional)"
                    value={consent}
                    onChange={setConsent}
                  />
                ) : null}
                {validYear && ageGroup === 'minor' ? (
                  <Text style={styles.small} maxFontSizeMultiplier={1.4}>
                    Für dich gibt es nur nicht-personalisierte, freiwillige Belohnungs-Videos, keine Zwangswerbung.
                  </Text>
                ) : null}
                <Button label="Datenschutzhinweise lesen…" variant="ghost" onPress={() => router.push('/privacy')} />
              </View>
            )}

            <View style={styles.etched} />

            <View style={styles.buttons}>
              <Button
                label="< Zurück"
                variant="ghost"
                disabled={step === 0}
                style={{ flex: 1 }}
                onPress={() => setStep(Math.max(0, step - 1))}
              />
              {story ? (
                <Button label={story.next} style={{ flex: 1 }} onPress={() => setStep(step + 1)} />
              ) : (
                <Button label="Fertig" style={{ flex: 1 }} disabled={!validYear} onPress={finish} />
              )}
            </View>
            <Text style={styles.small} maxFontSizeMultiplier={1.3} accessibilityLabel={`Schritt ${step + 1} von ${STEPS}`}>
              Schritt {step + 1} von {STEPS}
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
