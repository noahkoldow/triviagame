import { useRouter } from 'expo-router';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackBar, Button, Card, H1, P } from '../src/components/ui';
import { PRIVACY_URL, SUPPORT_EMAIL } from '../src/config';
import { useStrings } from '../src/strings';
import { colors } from '../src/theme';

/** The privacy notice; its sections are `privacy.sections` in the UI strings. */
export default function Privacy() {
  const router = useRouter();
  const t = useStrings();
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.body}>
        <BackBar title={t.privacy.title} onBack={() => router.back()} />
        <H1>{t.privacy.heading}</H1>
        {t.privacy.sections.map((s) => (
          <Card key={s.title} style={{ gap: 6 }}>
            <Text style={styles.title} accessibilityRole="header">
              {s.title}
            </Text>
            <P>{s.text}</P>
          </Card>
        ))}
        {PRIVACY_URL ? <Button label={t.privacy.fullPolicy} variant="ghost" onPress={() => Linking.openURL(PRIVACY_URL)} /> : null}
        {SUPPORT_EMAIL ? (
          <Button label={t.privacy.contact(SUPPORT_EMAIL)} variant="ghost" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} />
        ) : null}
        <View style={{ height: 8 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#008080' },
  body: { padding: 12, gap: 12 },
  title: { color: colors.text, fontSize: 16, fontWeight: '900' },
});
