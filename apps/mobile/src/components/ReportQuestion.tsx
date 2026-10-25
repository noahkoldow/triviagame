import { REPORT_REASONS, type ReportReason } from '@nexus/shared';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { reportQuestion } from '../services/content';
import { useStrings } from '../strings';
import { colors } from '../theme';
import { Button, P } from './ui';
import { Dialog } from './Win';

/**
 * "Report question" under a result (Apple 1.2): wrong, unclear, offensive or other. One report per
 * question and visit; a generated question disappears from this device at once.
 */
export function ReportQuestion({ questionId }: { questionId: string }) {
  const t = useStrings();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  const send = (reason: ReportReason) => {
    setSent(true);
    void reportQuestion(questionId, reason);
  };

  return (
    <>
      <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setOpen(true)} disabled={sent}>
        <Text style={styles.link}>{sent ? t.report.thanks : t.report.link}</Text>
      </Pressable>
      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.back} onPress={() => setOpen(false)}>
          <Dialog title={t.report.title} icon="warn" onClose={() => setOpen(false)}>
            {sent ? (
              <View style={{ gap: 10 }}>
                <P style={{ color: colors.text }}>{t.report.thanksText}</P>
                <Button label={t.common.close} onPress={() => setOpen(false)} />
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                <P>{t.report.intro}</P>
                {REPORT_REASONS.map((reason) => (
                  <Button key={reason} label={t.report.reasons[reason]} variant="ghost" onPress={() => send(reason)} />
                ))}
              </View>
            )}
          </Dialog>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  link: { color: colors.dim, fontSize: 13, fontWeight: '700', textAlign: 'center', textDecorationLine: 'underline', paddingVertical: 6 },
  back: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
});
