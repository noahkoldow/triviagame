import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackBar, Button, Card, P } from '../src/components/ui';
import { useGame } from '../src/state/store';
import { colors } from '../src/theme';

/** Settings. For now: replay the reveal, privacy. Consent, sound and haptics follow (docs/CODEX_HANDOFF.md P2.3). */
export default function Settings() {
  const router = useRouter();
  const finale = useGame((p) => p.story.finale);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.body}>
        <BackBar title="Einstellungen" onBack={() => router.back()} />

        <Card style={{ gap: 8 }}>
          <Text style={styles.title}>Geschichte</Text>
          <P>
            {finale
              ? 'Die Enthüllung nach deinem Sieg über morph.ai: was das Netz in Wahrheit ist.'
              : 'Die Enthüllung nach dem Sieg über morph.ai. Achtung, sie verrät das Ende der Geschichte.'}
          </P>
          <Button label="Gehirn-Sequenz ansehen" onPress={() => router.push('/brain')} />
        </Card>

        <Card style={{ gap: 8 }}>
          <Text style={styles.title}>Daten</Text>
          <Button label="Datenschutz & Info" variant="ghost" onPress={() => router.push('/privacy')} />
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
