import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LanguagePicker } from '../src/components/LanguagePicker';
import { BackBar, Button, Card, P } from '../src/components/ui';
import { ads } from '../src/services/ads';
import { setLanguage, update, useGame } from '../src/state/store';
import { useStrings } from '../src/strings';
import { colors } from '../src/theme';

/** Settings: language, replay the reveal, ad consent, privacy. Sound and haptics follow (docs/CODEX_HANDOFF.md P2.3). */
export default function Settings() {
  const router = useRouter();
  const t = useStrings();
  const finale = useGame((p) => p.story.finale);
  const adult = useGame((p) => p.profile.ageGroup === 'adult');
  const consent = useGame((p) => p.profile.consent);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.body}>
        <BackBar title={t.settings.title} onBack={() => router.back()} />

        <Card style={{ gap: 8 }}>
          <Text style={styles.title}>{t.settings.language}</Text>
          <LanguagePicker value={t.lang} onChange={setLanguage} />
          <P>{t.settings.languageText}</P>
        </Card>

        <Card style={{ gap: 8 }}>
          <Text style={styles.title}>{t.settings.story}</Text>
          <P>{finale ? t.settings.revealAfter : t.settings.revealBefore}</P>
          <Button label={t.settings.watchReveal} onPress={() => router.push('/brain')} />
        </Card>

        <Card style={{ gap: 8 }}>
          <Text style={styles.title}>{t.settings.ads}</Text>
          <P>
            {t.settings.adsFree}{' '}
            {adult ? (consent ? t.settings.adsPersonal : t.settings.adsGeneral) : t.settings.adsMinor}
          </P>
          {adult ? (
            <Button
              label={consent ? t.settings.consentOff : t.settings.consentOn}
              variant="ghost"
              onPress={() => update((p) => ({ ...p, profile: { ...p.profile, consent: !p.profile.consent } }))}
            />
          ) : null}
          {ads.privacyOptions ? (
            <Button label={t.settings.adPrivacy} variant="ghost" onPress={() => void ads.privacyOptions?.()} />
          ) : null}
          <Button
            label={t.settings.plus}
            variant="gem"
            onPress={() => router.push({ pathname: '/plus', params: { from: 'settings' } })}
          />
        </Card>

        <Card style={{ gap: 8 }}>
          <Text style={styles.title}>{t.settings.data}</Text>
          <Button label={t.settings.privacy} variant="ghost" onPress={() => router.push('/privacy')} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16, gap: 14 },
  title: { color: colors.text, fontSize: 18, fontWeight: '900' },
});
