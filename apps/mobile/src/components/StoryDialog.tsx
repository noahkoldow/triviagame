import { Modal, StyleSheet, Text, View } from 'react-native';
import type { MorphForm, Speaker, StoryBeat, StoryMood } from '@nexus/shared';
import { colors } from '../theme';
import { Bolt } from './Bolt';
import { Guardian } from './Guardian';
import { Icon } from './Icon';
import { Morph } from './Morph';
import { Button } from './ui';
import { Dialog, sunken } from './Win';

const NAMES: Record<Speaker, string> = {
  bolt: 'Bolt',
  morph: 'morph.ai',
  core: 'Kern',
  quantis: 'Quantis',
  rhizom: 'Rhizom',
  kodex: 'Kodex',
  muse: 'Muse',
};

/** The face of whoever speaks: Bolt, MORPH, a guardian, or the core itself. */
export function Portrait({
  speaker,
  mood,
  form,
  size = 64,
}: {
  speaker: Speaker;
  mood?: StoryMood;
  form?: MorphForm;
  size?: number;
}) {
  if (speaker === 'bolt') return <Bolt size={size} mood={mood ?? 'happy'} />;
  if (speaker === 'morph') return <Morph size={size} form={form} />;
  if (speaker === 'core') {
    return (
      <View style={[styles.core, sunken, { width: size, height: size }]} accessible accessibilityLabel="Der Kern">
        <Icon name="cache" size={size * 0.6} />
      </View>
    );
  }
  return <Guardian who={speaker} size={size} />;
}

/** One beat of the story as a dialog box; the log file it unlocks is named below the text. */
export function StoryDialog({ beat, onDone }: { beat: StoryBeat | undefined; onDone: () => void }) {
  return (
    <Modal transparent animationType="fade" visible={!!beat} onRequestClose={onDone}>
      <View style={styles.center}>
        {beat ? (
          <Dialog title={beat.title} icon={beat.speaker === 'morph' ? 'warn' : 'cache'} onClose={onDone}>
            <View style={styles.row}>
              <Portrait speaker={beat.speaker} mood={beat.mood} form={beat.form} />
              <View style={styles.words}>
                <Text style={styles.speaker} maxFontSizeMultiplier={1.3}>
                  {NAMES[beat.speaker]}
                </Text>
                <Text style={styles.text} maxFontSizeMultiplier={1.5}>
                  {beat.text}
                </Text>
              </View>
            </View>
            {beat.log ? (
              <View style={styles.logRow}>
                <Icon name="file" size={16} />
                <Text style={styles.log} maxFontSizeMultiplier={1.3}>
                  Neu im Logbuch: {beat.log.name}
                </Text>
              </View>
            ) : null}
            <Button label="Weiter" onPress={onDone} />
          </Dialog>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 20 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  words: { flex: 1, gap: 4 },
  speaker: { color: colors.accent, fontSize: 13, fontWeight: '900', letterSpacing: 0.6 },
  text: { color: colors.text, fontSize: 16, lineHeight: 23 },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  log: { color: colors.dim, fontSize: 12, fontWeight: '700' },
  core: { alignItems: 'center', justifyContent: 'center' },
});
