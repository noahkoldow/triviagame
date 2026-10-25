import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Polyline, Text as SvgText } from 'react-native-svg';
import { chartText, type ChartSpec } from '@nexus/shared';
import { useStrings } from '../strings';
import { barLayout, formatNumber, lineLayout, pieSlices, slicePath, timelineLayout } from './chart.logic';

const INK = '#101820';
const BAR = ['#1CB0F6', '#58CC02', '#FF9600', '#CE82FF', '#FF86D0', '#FFC800'];

/**
 * An image of a cache file, drawn by the game from its description: bars, a timeline, a table,
 * a line over the years, a pie of shares or the steps of a process.
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
      {chart.chart === 'line' ? <LineChart chart={chart} width={width - 24} /> : null}
      {chart.chart === 'pie' ? <Pie chart={chart} width={width - 24} /> : null}
      {chart.chart === 'flow' ? <Flow chart={chart} /> : null}
    </View>
  );
}

function LineChart({ chart, width }: { chart: Extract<ChartSpec, { chart: 'line' }>; width: number }) {
  const t = useStrings();
  const height = 140;
  const pts = lineLayout(chart.points, width, height, { left: 22, right: 22, top: 18, bottom: 20 });
  return (
    <View style={{ gap: 4 }}>
      <Svg width={width} height={height}>
        <Path d={`M 22 ${height - 20} H ${width - 8}`} stroke={INK} strokeWidth={1.5} />
        <Polyline points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={BAR[0]} strokeWidth={3} />
        {pts.map((p) => (
          <Fragment key={p.year}>
            <Circle cx={p.x} cy={p.y} r={4} fill={BAR[0]} stroke={INK} strokeWidth={1.5} />
            <SvgText x={p.x} y={p.y - 8} fontSize={11} fontWeight="bold" fill={INK} textAnchor="middle">
              {formatNumber(p.value, t.lang)}
            </SvgText>
            <SvgText x={p.x} y={height - 6} fontSize={11} fill={INK} textAnchor="middle">
              {String(p.year)}
            </SvgText>
          </Fragment>
        ))}
      </Svg>
      {chart.unit ? <Text style={styles.unit}>{t.explorer.chartUnit(chart.unit)}</Text> : null}
    </View>
  );
}

function Pie({ chart, width }: { chart: Extract<ChartSpec, { chart: 'pie' }>; width: number }) {
  const t = useStrings();
  const size = Math.min(120, width * 0.4);
  const r = size / 2 - 2;
  const slices = pieSlices(chart.items);
  return (
    <View style={styles.pieRow}>
      <Svg width={size} height={size}>
        {slices.map((s, i) => (
          <Path key={s.label} d={slicePath(size / 2, size / 2, r, s.from, s.to)} fill={BAR[i % BAR.length]} stroke="#FFFFFF" strokeWidth={1} />
        ))}
      </Svg>
      <View style={{ flex: 1, gap: 4 }}>
        {chart.items.map((it, i) => (
          <View key={it.label} style={styles.barRow}>
            <View style={[styles.swatch, { backgroundColor: BAR[i % BAR.length] }]} />
            <Text style={[styles.label, { flex: 1 }]} maxFontSizeMultiplier={1.2}>
              {it.label}
            </Text>
            <Text style={styles.value} maxFontSizeMultiplier={1.2}>
              {formatNumber(it.value, t.lang)} %
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** The steps of a process as boxes with arrows; a cycle leads back to the first step. */
function Flow({ chart }: { chart: Extract<ChartSpec, { chart: 'flow' }> }) {
  return (
    <View style={{ gap: 2 }}>
      {chart.steps.map((step, i) => (
        <Fragment key={step}>
          {i > 0 ? <Text style={styles.arrow}>↓</Text> : null}
          <View style={styles.step}>
            <Text style={styles.stepNo}>{i + 1}</Text>
            <Text style={[styles.label, { flex: 1 }]} maxFontSizeMultiplier={1.2}>
              {step}
            </Text>
          </View>
        </Fragment>
      ))}
      {chart.cycle ? <Text style={styles.arrow}>↺ 1</Text> : null}
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
  pieRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  swatch: { width: 12, height: 12, borderWidth: 1, borderColor: INK },
  step: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: INK, backgroundColor: '#EAF6FF', padding: 8 },
  stepNo: { color: '#FFFFFF', backgroundColor: INK, fontSize: 11, fontWeight: '900', width: 18, height: 18, textAlign: 'center', lineHeight: 18 },
  arrow: { color: INK, fontSize: 16, fontWeight: '900', textAlign: 'center' },
});
