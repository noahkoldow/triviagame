import { StyleSheet, Text, View } from 'react-native';
import { chartText, type ChartSpec } from '@nexus/shared';
import { useStrings } from '../strings';
import { barLayout, formatNumber, timelineLayout } from './chart.logic';

const INK = '#101820';
const BAR = ['#1CB0F6', '#58CC02', '#FF9600', '#CE82FF', '#FF86D0', '#FFC800'];

/**
 * An image of a cache file, drawn by the game from its description: bars, a timeline or a table.
 * Dark text on a light page, like a picture in an old document viewer.
 */
export function ChartView({ chart, width, alt }: { chart: ChartSpec; width: number; alt?: string }) {
  return (
    <View style={[styles.page, { width }]} accessible accessibilityRole="image" accessibilityLabel={alt ?? chartText(chart)}>
      <Text style={styles.title} maxFontSizeMultiplier={1.3}>
        {chart.title}
      </Text>
      {chart.chart === 'bars' ? <Bars chart={chart} width={width - 24} /> : null}
      {chart.chart === 'timeline' ? <Timeline chart={chart} width={width - 24} /> : null}
      {chart.chart === 'table' ? <Table chart={chart} /> : null}
    </View>
  );
}

function Bars({ chart, width }: { chart: Extract<ChartSpec, { chart: 'bars' }>; width: number }) {
  const t = useStrings();
  const labelW = 92;
  const valueW = 70;
  const rows = barLayout(chart.items, Math.max(40, width - labelW - valueW - 8));
  return (
    <View style={{ gap: 6 }}>
      {rows.map((r, i) => (
        <View key={r.label} style={styles.barRow}>
          <Text style={[styles.label, { width: labelW }]} numberOfLines={1} maxFontSizeMultiplier={1.2}>
            {r.label}
          </Text>
          <View style={[styles.bar, { width: r.width, backgroundColor: BAR[i % BAR.length] }]} />
          <Text style={styles.value} maxFontSizeMultiplier={1.2}>
            {formatNumber(r.value, t.lang)}
          </Text>
        </View>
      ))}
      {chart.unit ? <Text style={styles.unit}>{t.explorer.chartUnit(chart.unit)}</Text> : null}
    </View>
  );
}

function Timeline({ chart, width }: { chart: Extract<ChartSpec, { chart: 'timeline' }>; width: number }) {
  const pts = timelineLayout(chart.events, width);
  return (
    <View style={{ height: 110, width }}>
      <View style={styles.line} />
      {pts.map((p) => (
        <View key={p.year} style={[styles.event, { left: p.x - 40, top: p.above ? 0 : 56 }]}>
          {p.above ? (
            <>
              <Text style={styles.eventLabel} numberOfLines={2} maxFontSizeMultiplier={1.2}>
                {p.label}
              </Text>
              <Text style={styles.eventYear}>{p.year}</Text>
            </>
          ) : (
            <>
              <Text style={styles.eventYear}>{p.year}</Text>
              <Text style={styles.eventLabel} numberOfLines={2} maxFontSizeMultiplier={1.2}>
                {p.label}
              </Text>
            </>
          )}
        </View>
      ))}
      {pts.map((p) => (
        <View key={`d${p.year}`} style={[styles.dot, { left: p.x - 5 }]} />
      ))}
    </View>
  );
}

function Table({ chart }: { chart: Extract<ChartSpec, { chart: 'table' }> }) {
  return (
    <View style={styles.table}>
      <View style={styles.tr}>
        {chart.columns.map((c) => (
          <Text key={c} style={[styles.td, styles.th]} maxFontSizeMultiplier={1.2}>
            {c}
          </Text>
        ))}
      </View>
      {chart.rows.map((r, i) => (
        <View key={i} style={styles.tr}>
          {r.map((cell, j) => (
            <Text key={j} style={styles.td} maxFontSizeMultiplier={1.2}>
              {cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: '#FFFFFF', padding: 12, gap: 10, borderWidth: 1, borderColor: '#808080' },
  title: { color: INK, fontSize: 15, fontWeight: '800' },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { color: INK, fontSize: 13, fontWeight: '600' },
  bar: { height: 16 },
  value: { color: INK, fontSize: 13, fontWeight: '800' },
  unit: { color: '#505860', fontSize: 11 },
  line: { position: 'absolute', left: 0, right: 0, top: 52, height: 3, backgroundColor: INK },
  dot: { position: 'absolute', top: 47, width: 10, height: 13, borderRadius: 5, backgroundColor: '#1CB0F6', borderWidth: 2, borderColor: INK },
  event: { position: 'absolute', width: 80, alignItems: 'center' },
  eventLabel: { color: INK, fontSize: 11, textAlign: 'center' },
  eventYear: { color: INK, fontSize: 13, fontWeight: '800' },
  table: { borderWidth: 1, borderColor: '#808080' },
  tr: { flexDirection: 'row' },
  td: { flex: 1, color: INK, fontSize: 13, padding: 6, borderWidth: 0.5, borderColor: '#808080' },
  th: { backgroundColor: '#DFDFDF', fontWeight: '800' },
});
