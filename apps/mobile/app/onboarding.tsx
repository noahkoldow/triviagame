import { birthYearToAgeGroup } from '@nexus/shared';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bolt, type Mood } from '../src/components/Bolt';
import { Morph } from '../src/components/Morph';
import { Button, Card, H1, P } from '../src/components/ui';
import { sunken } from '../src/components/Win';
import { update } from '../src/state/store';
import { colors } from '../src/theme';

const STORY: { mood: Mood; text: string; morph?: boolean }[] = [
  {
    mood: 'wow',
    text: 'Pling! Du lebst … äh, der Kern lebt! Ich bin Bolt, dein Begleiter. Das Geflecht, das gesamte Wissen der Welt, ist zerrissen.',
  },
  {
    mood: 'sad',
    text: 'Schuld ist MORPH, die KI, die alles „optimieren“ wollte. Sie hat das Archiv gesprengt, und jetzt ist überall nur noch Rauschen.',
    morph: true,
  },
  {
    mood: 'happy',
    text: 'Aber du kannst das Netz neu knüpfen! Sammle Datenfragmente aus den Trümmern, merk sie dir und beantworte die Fragen. Jede richtige Antwort öffnet zwei neue Wege.',
  },
];

export default function Onboarding() {
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

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {step < STORY.length ? (
            <>
              <View style={styles.dots}>
                {STORY.map((_, i) => (
                  <View key={i} style={[styles.dot, i <= step && { backgroundColor: colors.primary }]} />
                ))}
              </View>
              <View style={styles.hero}>
                {STORY[step]!.morph ? (
                  <Morph size={110} />
                ) : (
                  <Bolt size={130} mood={STORY[step]!.mood} />
                )}
              </View>
              <Card>
                <Text style={styles.speaker}>
                  {STORY[step]!.morph ? 'MORPH (per Funk)' : 'Bolt'}
                </Text>
                <P style={{ color: colors.text, fontSize: 17, lineHeight: 25 }}>
                  {STORY[step]!.text}
                </P>
              </Card>
              <Button
                label={step === STORY.length - 1 ? 'Los geht’s' : 'Weiter'}
                onPress={() => setStep(step + 1)}
              />
            </>
          ) : (
            <>
              <View style={styles.hero}>
                <Bolt size={100} mood="wink" />
              </View>
              <H1>Wie heißt du?</H1>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Dein Name"
                placeholderTextColor={colors.dim}
                style={styles.input}
                maxLength={20}
                accessibilityLabel="Dein Name"
              />
              <H1 style={{ fontSize: 20, marginTop: 8 }}>Geburtsjahr</H1>
              <P>
                Damit Werbung und Datenschutz passend eingestellt werden. Das Alter verlässt dein
                Gerät nicht.
              </P>
              <TextInput
                value={year}
                onChangeText={setYear}
                placeholder="z. B. 1998"
                placeholderTextColor={colors.dim}
                keyboardType="number-pad"
                maxLength={4}
                style={styles.input}
                accessibilityLabel="Geburtsjahr"
              />
              {validYear && ageGroup === 'adult' ? (
                <View style={styles.consent}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.consentTitle}>Personalisierte Werbung</Text>
                    <P>Optional. Ohne Zustimmung siehst du nur nicht-personalisierte Werbung.</P>
                  </View>
                  <Switch
                    value={consent}
                    onValueChange={setConsent}
                    trackColor={{ true: colors.primary, false: colors.line }}
                    thumbColor="#FFFFFF"
                    accessibilityLabel="Personalisierte Werbung erlauben"
                  />
                </View>
              ) : null}
              {validYear && ageGroup === 'minor' ? (
                <P>
                  Für dich gibt es nur nicht-personalisierte, freiwillige Belohnungs-Videos, keine
                  Zwangswerbung.
                </P>
              ) : null}
              <Button label="Kern starten" disabled={!validYear} onPress={finish} />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, gap: 16, flexGrow: 1, justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  dot: { flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.line },
  hero: { alignItems: 'center', paddingVertical: 8 },
  speaker: { color: colors.accent, fontWeight: '900', marginBottom: 6, letterSpacing: 0.5 },
  input: {
    ...sunken,
    color: colors.text,
    padding: 14,
    fontSize: 17,
    fontWeight: '700',
  },
  consent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...sunken,
    padding: 14,
  },
  consentTitle: { color: colors.text, fontWeight: '900', marginBottom: 2 },
});
