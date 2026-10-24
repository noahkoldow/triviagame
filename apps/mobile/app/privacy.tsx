import { useRouter } from 'expo-router';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackBar, Button, Card, H1, P } from '../src/components/ui';
import { PRIVACY_URL, SUPPORT_EMAIL } from '../src/config';
import { colors } from '../src/theme';

const SECTIONS: { title: string; text: string }[] = [
  {
    title: 'Was gespeichert wird',
    text: 'Dein Spielstand (Name, den du frei wählst, Geburtsjahr, Fortschritt und dein Netz) liegt nur auf deinem Gerät. Es gibt kein Konto. Name, Geburtsjahr und Spielstand werden nicht an uns übertragen.',
  },
  {
    title: 'Neue Fragen',
    text: 'Damit dir die Fragen nie ausgehen, fragt die App unseren Server nach neuen Fragen. Dabei sendet sie nur den Themenbereich, eine Schwierigkeitsstufe und die Kennungen der Fragen, die sie schon hat. Der Server sieht technisch bedingt deine IP-Adresse; wir speichern davon nur einen gekürzten Prüfwert für höchstens zwei Stunden, um Missbrauch zu begrenzen.',
  },
  {
    title: 'Wochenliga (Austreten jederzeit)',
    text: 'Nach dem Finale ordnet dich die App in die Liga ein. Dafür speichert der Server eine zufällige Kennung, einen erzeugten Rufnamen und deine XP der laufenden Woche. Andere sehen nur Rufname und Wochen-XP. Beim Austreten (im Liga-Bildschirm) oder Zurücksetzen des Spielstands wird dein Eintrag gelöscht.',
  },
  {
    title: 'Alter und Werbung',
    text: 'Das Geburtsjahr dient nur dazu, Werbung passend einzustellen. Unter 16 gibt es ausschließlich freiwillige, nicht personalisierte Belohnungs-Videos und keine Zwangswerbung. Personalisierte Werbung gibt es nur ab 16 und nur mit deiner ausdrücklichen Zustimmung. Du kannst sie jederzeit ausschalten, indem du den Spielstand zurücksetzt und neu startest.',
  },
  {
    title: 'Käufe',
    text: 'Gems und „Werbefrei“ kaufst du über Apple. Im Shop kannst du Käufe jederzeit wiederherstellen. Alles, was es für Gems gibt, kannst du auch erspielen.',
  },
  {
    title: 'Inhalte von KI',
    text: 'Neue Fragen schreibt unser Server mit Googles KI-Modell Gemini. Ein zweiter Durchgang prüft jede Frage, bevor sie in den gemeinsamen Fragenpool kommt. Dabei werden keine Daten von dir an Google gesendet. KI-Fehler können trotzdem vorkommen; eine Meldefunktion für falsche Inhalte ist vorgesehen.',
  },
  {
    title: 'Deine Rechte',
    text: 'Im Profil löscht „Spielstand zurücksetzen“ alle lokal gespeicherten Daten dieser App und deinen Liga-Eintrag auf dem Server. Weitere Daten von dir haben wir nicht.',
  },
];

export default function Privacy() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.body}>
        <BackBar title="Datenschutz & Info" onBack={() => router.back()} />
        <H1>Datenschutzhinweise</H1>
        {SECTIONS.map((s) => (
          <Card key={s.title} style={{ gap: 6 }}>
            <Text style={styles.title} accessibilityRole="header">
              {s.title}
            </Text>
            <P>{s.text}</P>
          </Card>
        ))}
        {PRIVACY_URL ? <Button label="Vollständige Datenschutzerklärung" variant="ghost" onPress={() => Linking.openURL(PRIVACY_URL)} /> : null}
        {SUPPORT_EMAIL ? (
          <Button label={`Kontakt: ${SUPPORT_EMAIL}`} variant="ghost" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} />
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
