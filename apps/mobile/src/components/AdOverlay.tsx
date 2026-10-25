import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { subscribeMockAds, type MockAdRequest } from '../services/ads';
import { colors, radius } from '../theme';
import { Button } from './ui';
import { IS_PROTOTYPE } from '../config';
import { useStrings } from '../strings';
import { Window } from './Win';

/** Stand-in for AdMob in Expo Go. */
export function AdOverlay() {
  const t = useStrings();
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
        <Window title={IS_PROTOTYPE ? t.ads.titleTest : t.ads.title} icon="warn">
          {IS_PROTOTYPE ? <Text style={styles.badge}>{t.ads.badge(rewarded)}</Text> : null}
          <Text style={styles.title}>
            {rewarded ? t.ads.rewardedTitle : req.kind === 'appOpen' ? t.ads.welcomeBack : t.ads.breakTitle}
          </Text>
          <Text style={styles.body}>{t.ads.body(rewarded, req.personalized)}</Text>
          {rewarded ? null : <Text style={styles.body}>{t.ads.keepsFree}</Text>}
          <Button
            label={left > 0 ? t.ads.wait(left) : rewarded ? t.ads.claim : t.common.next}
            disabled={left > 0}
            onPress={() => req.resolve(true)}
          />
          {rewarded ? (
            <Button
              label={t.common.cancel}
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
