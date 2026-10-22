import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { subscribeMockAds, type MockAdRequest } from '../services/ads';
import { colors, radius } from '../theme';
import { Button } from './ui';
import { IS_PROTOTYPE } from '../config';
import { Window } from './Win';

/** Stand-in for AdMob in Expo Go. */
export function AdOverlay() {
  const [req, setReq] = useState<MockAdRequest | null>(null);
  const [left, setLeft] = useState(0);

  useEffect(() => subscribeMockAds(setReq), []);
  useEffect(() => {
    if (!req) return;
    setLeft(req.kind === 'rewarded' ? 3 : 2);
    const id = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(id);
  }, [req]);

  if (!req) return null;
  const rewarded = req.kind === 'rewarded';
  return (
    <Modal transparent animationType="fade" visible onRequestClose={() => req.resolve(false)}>
      <View style={styles.backdrop}>
        <Window title={IS_PROTOTYPE ? 'Werbung (Test)' : 'Werbung'} icon="warn">
          {IS_PROTOTYPE ? <Text style={styles.badge}>TESTWERBUNG · {rewarded ? 'Belohnung' : 'Anzeige'}</Text> : null}
          <Text style={styles.title}>{rewarded ? 'Reparatur-Funk' : 'Kurze Unterbrechung'}</Text>
          <Text style={styles.body}>
            Hier würde AdMob eine {rewarded ? 'Video-Anzeige' : 'Anzeige'} zeigen.
            {req.personalized ? ' (personalisiert)' : ' (nicht personalisiert)'}
          </Text>
          <Button
            label={left > 0 ? `Noch ${left} s …` : rewarded ? 'Belohnung abholen' : 'Weiter'}
            disabled={left > 0}
            onPress={() => req.resolve(true)}
          />
          {rewarded ? (
            <Button
              label="Abbrechen"
              variant="ghost"
              onPress={() => req.resolve(false)}
              style={{ marginTop: 8 }}
            />
          ) : null}
        </Window>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: colors.panel,
    borderRadius: radius.lg,
    padding: 20,
    gap: 10,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: colors.line,
  },
  badge: { color: colors.warn, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  title: { color: colors.text, fontSize: 22, fontWeight: '900' },
  body: { color: colors.dim, fontSize: 15, marginBottom: 8 },
});
