import { StyleSheet, Text, View } from 'react-native';
import { MAX_ENERGY, MAX_INTEGRITY, levelFromXp } from '@nexus/shared';
import { useGame } from '../state/store';
import { colors } from '../theme';

export function Hud() {
  const xp = useGame((p) => p.xp);
  const gems = useGame((p) => p.gems);
  const bits = useGame((p) => p.bits);
  const energy = useGame((p) => p.energy);
  const integrity = useGame((p) => p.integrity);
  const streak = useGame((p) => p.streak.count);
  const lv = levelFromXp(xp);
  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <View style={styles.row}>
        <Text style={styles.lv}>Lv {lv.level}</Text>
        <View style={styles.bar}>
          <View style={[styles.fill, { width: `${Math.round((lv.into / lv.next) * 100)}%` }]} />
        </View>
        <Text style={styles.stat}>🔥 {streak}</Text>
      </View>
      <View style={styles.row}>
        <Text style={[styles.stat, { color: colors.gem }]}>💎 {gems}</Text>
        <Text style={[styles.stat, { color: colors.bit }]}>◈ {bits}</Text>
        <Text style={styles.stat} accessibilityLabel={`Energie ${energy} von ${MAX_ENERGY}`}>
          ⚡ {energy}/{MAX_ENERGY}
        </Text>
        <Text
          style={[styles.stat, { color: integrity === 0 ? colors.bad : colors.good }]}
          accessibilityLabel={`Integrität ${integrity} von ${MAX_INTEGRITY}`}
        >
          ▣ {integrity}/{MAX_INTEGRITY}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lv: { color: colors.text, fontWeight: '800', fontSize: 14 },
  bar: { flex: 1, height: 6, backgroundColor: colors.line, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: colors.accent },
  stat: { color: colors.text, fontWeight: '700', fontSize: 14 },
});
