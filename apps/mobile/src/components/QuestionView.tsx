import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  TRUE_FALSE,
  answerText,
  parseNumber,
  variantBank,
  variantMatch,
  variantMulti,
  variantOptions,
  variantOrder,
  variantSort,
  type Answer,
  type ClozeQuestion,
  type MatchQuestion,
  type MultiQuestion,
  type Question,
  type SortQuestion,
  type SpotQuestion,
} from '@nexus/shared';
import { useStrings } from '../strings';
import { colors } from '../theme';
import { Icon } from './Icon';
import { tap } from './ui';
import { WIN, sunken } from './Win';

/**
 * All kinds of questions in one place. The view keeps the player's input itself and tells the
 * parent through `onChange` what the answer is (null while it is not complete yet).
 * With `reveal` the input is locked and the right answer is shown.
 */
export function QuestionView({
  q,
  variant,
  reveal = false,
  onChange,
}: {
  q: Question;
  variant: number;
  reveal?: boolean;
  onChange: (a: Answer | null) => void;
}) {
  const t = useStrings();
  return (
    <View style={{ gap: 8 }}>
      {q.type === 'choice' ? <ChoiceView q={q} variant={variant} reveal={reveal} onChange={onChange} /> : null}
      {q.type === 'estimate' ? <EstimateView q={q} reveal={reveal} onChange={onChange} /> : null}
      {q.type === 'order' ? <OrderView q={q} variant={variant} reveal={reveal} onChange={onChange} /> : null}
      {q.type === 'truefalse' ? <TrueFalseView q={q} reveal={reveal} onChange={onChange} /> : null}
      {q.type === 'match' ? <MatchView q={q} variant={variant} reveal={reveal} onChange={onChange} /> : null}
      {q.type === 'cloze' ? <ClozeView q={q} variant={variant} reveal={reveal} onChange={onChange} /> : null}
      {q.type === 'multi' ? <MultiView q={q} variant={variant} reveal={reveal} onChange={onChange} /> : null}
      {q.type === 'sort' ? <SortView q={q} variant={variant} reveal={reveal} onChange={onChange} /> : null}
      {q.type === 'spot' ? <SpotView q={q} reveal={reveal} onChange={onChange} /> : null}
      {reveal && q.type !== 'choice' && q.type !== 'multi' && q.type !== 'spot' ? (
        <Text style={styles.rightLine} maxFontSizeMultiplier={1.4}>
          {t.question.right(answerText(q, t.lang))}
        </Text>
      ) : null}
    </View>
  );
}

type Props<T extends Question> = { q: T; reveal: boolean; onChange: (a: Answer | null) => void };

const PAIR_COLORS = ['#1CB0F6', '#FF9600', '#CE82FF', '#58CC02', '#FF86D0', '#FFC800'];

// -------------------------------------------------------------------- multiple choice
function ChoiceView({ q, variant, reveal, onChange }: Props<Extract<Question, { type: 'choice' }>> & { variant: number }) {
  const opts = useMemo(() => variantOptions(q, variant), [q, variant]);
  const [sel, setSel] = useState<number | null>(null);
  useEffect(() => {
    // the answer is the index in the original list of options, not in the shuffled one
    onChange(sel === null ? null : { type: 'choice', index: q.options.indexOf(opts.options[sel]!) });
  }, [sel]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      {opts.options.map((o, i) => {
        const state = reveal ? (i === opts.answer ? 'right' : i === sel ? 'wrong' : 'plain') : i === sel ? 'selected' : 'plain';
        return (
          <Pressable
            key={`${variant}-${i}`}
            disabled={reveal}
            onPress={() => {
              tap();
              setSel(i);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: sel === i }}
            style={[styles.option, sunken, stateStyle(state)]}
          >
            <Text style={styles.optionText} maxFontSizeMultiplier={1.4}>
              {o}
            </Text>
          </Pressable>
        );
      })}
    </>
  );
}

// -------------------------------------------------------------------- estimate
function EstimateView({ q, reveal, onChange }: Props<Extract<Question, { type: 'estimate' }>>) {
  const t = useStrings();
  const [text, setText] = useState('');
  useEffect(() => {
    // read the way the player's language writes numbers ("1.500" is 1500 in German, "1,500" in English)
    const v = parseNumber(text, t.lang);
    onChange(v === null ? null : { type: 'estimate', value: v });
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <TextInput
      value={text}
      onChangeText={setText}
      editable={!reveal}
      keyboardType="numbers-and-punctuation"
      placeholder={q.unit ? t.question.estimate(q.unit) : t.question.answer}
      placeholderTextColor={colors.dim}
      style={[styles.input, sunken]}
      accessibilityLabel={t.question.enter}
    />
  );
}

// -------------------------------------------------------------------- order
function OrderView({ q, variant, reveal, onChange }: Props<Extract<Question, { type: 'order' }>> & { variant: number }) {
  const t = useStrings();
  const items = useMemo(() => variantOrder(q, variant), [q, variant]);
  const [picked, setPicked] = useState<string[]>([]);
  useEffect(() => {
    onChange(picked.length === q.items.length ? { type: 'order', items: picked } : null);
  }, [picked]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <Text style={styles.hint} maxFontSizeMultiplier={1.4}>
        {t.question.orderHint}
      </Text>
      {items.map((it) => {
        const idx = picked.indexOf(it);
        return (
          <Pressable
            key={it}
            disabled={reveal}
            onPress={() => {
              tap();
              setPicked(idx >= 0 ? picked.filter((x) => x !== it) : [...picked, it]);
            }}
            accessibilityRole="button"
            accessibilityLabel={idx >= 0 ? t.question.place(it, idx + 1) : it}
            style={[styles.option, sunken, idx >= 0 && { backgroundColor: WIN.titleA }]}
          >
            <Text style={styles.optionText} maxFontSizeMultiplier={1.4}>
              {idx >= 0 ? `${idx + 1}. ` : ''}
              {it}
            </Text>
          </Pressable>
        );
      })}
    </>
  );
}

// -------------------------------------------------------------------- true / false
function TrueFalseView({ q, reveal, onChange }: Props<Extract<Question, { type: 'truefalse' }>>) {
  const t = useStrings();
  const [sel, setSel] = useState<boolean | null>(null);
  useEffect(() => {
    onChange(sel === null ? null : { type: 'truefalse', value: sel });
  }, [sel]); // eslint-disable-line react-hooks/exhaustive-deps
  const choose = (v: boolean, label: string) => {
    const state = reveal ? (v === q.answer ? 'right' : v === sel ? 'wrong' : 'plain') : v === sel ? 'selected' : 'plain';
    return (
      <Pressable
        disabled={reveal}
        onPress={() => {
          tap();
          setSel(v);
        }}
        accessibilityRole="radio"
        accessibilityState={{ selected: sel === v }}
        style={[styles.option, sunken, { flex: 1, alignItems: 'center' }, stateStyle(state)]}
      >
        <Text style={[styles.optionText, { fontSize: 18 }]} maxFontSizeMultiplier={1.3}>
          {label}
        </Text>
      </Pressable>
    );
  };
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {choose(true, TRUE_FALSE[t.lang].yes)}
      {choose(false, TRUE_FALSE[t.lang].no)}
    </View>
  );
}

// -------------------------------------------------------------------- matching pairs
function MatchView({ q, variant, reveal, onChange }: Props<MatchQuestion> & { variant: number }) {
  const t = useStrings();
  const lefts = q.pairs.map((p) => p[0]);
  const rights = useMemo(() => variantMatch(q, variant), [q, variant]);
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    onChange(Object.keys(pairs).length === lefts.length ? { type: 'match', pairs } : null);
  }, [pairs]); // eslint-disable-line react-hooks/exhaustive-deps

  const colorOfLeft = (l: string) => PAIR_COLORS[lefts.indexOf(l) % PAIR_COLORS.length]!;
  const leftOfRight = (r: string) => Object.keys(pairs).find((l) => pairs[l] === r);

  const tapLeft = (l: string) => {
    tap();
    if (pairs[l] !== undefined) {
      const next = { ...pairs };
      delete next[l];
      setPairs(next);
      setActive(l);
    } else {
      setActive(active === l ? null : l);
    }
  };
  const tapRight = (r: string) => {
    tap();
    const owner = leftOfRight(r);
    if (owner) {
      const next = { ...pairs };
      delete next[owner];
      setPairs(next);
      setActive(owner);
      return;
    }
    if (active) {
      setPairs({ ...pairs, [active]: r });
      setActive(null);
    }
  };

  return (
    <>
      <Text style={styles.hint} maxFontSizeMultiplier={1.4}>
        {t.question.matchHint}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1, gap: 8 }}>
          {lefts.map((l) => {
            const paired = pairs[l] !== undefined;
            const right = reveal && q.pairs.find((p) => p[0] === l)![1] === pairs[l];
            return (
              <Pressable
                key={l}
                disabled={reveal}
                onPress={() => tapLeft(l)}
                accessibilityRole="button"
                accessibilityLabel={paired ? t.question.pairedWith(l, pairs[l]!) : l}
                style={[
                  styles.option,
                  sunken,
                  { borderLeftWidth: 6, borderLeftColor: colorOfLeft(l) },
                  active === l && { backgroundColor: WIN.titleA },
                  reveal && (right ? { backgroundColor: '#1F5A12' } : { backgroundColor: '#6A1B1B' }),
                ]}
              >
                <Text style={styles.optionText} maxFontSizeMultiplier={1.3}>
                  {l}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={{ flex: 1, gap: 8 }}>
          {rights.map((r) => {
            const owner = leftOfRight(r);
            return (
              <Pressable
                key={r}
                disabled={reveal}
                onPress={() => tapRight(r)}
                accessibilityRole="button"
                accessibilityLabel={owner ? t.question.pairedWith(r, owner) : r}
                style={[
                  styles.option,
                  sunken,
                  owner ? { borderLeftWidth: 6, borderLeftColor: colorOfLeft(owner) } : null,
                ]}
              >
                <Text style={styles.optionText} maxFontSizeMultiplier={1.3}>
                  {r}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </>
  );
}

// -------------------------------------------------------------------- gap text
function ClozeView({ q, variant, reveal, onChange }: Props<ClozeQuestion> & { variant: number }) {
  const t = useStrings();
  const bank = useMemo(() => variantBank(q, variant), [q, variant]);
  // for every gap the index of the word in the bank (or null)
  const [slots, setSlots] = useState<(number | null)[]>(() => q.answers.map(() => null));
  useEffect(() => {
    onChange(slots.every((s) => s !== null) ? { type: 'cloze', words: slots.map((s) => bank[s!]!) } : null);
  }, [slots]); // eslint-disable-line react-hooks/exhaustive-deps

  const used = new Set(slots.filter((s): s is number => s !== null));
  const fill = (bankIndex: number) => {
    const at = slots.indexOf(null);
    if (at < 0) return;
    tap();
    setSlots(slots.map((s, k) => (k === at ? bankIndex : s)));
  };
  const clear = (gap: number) => {
    tap();
    setSlots(slots.map((s, k) => (k === gap ? null : s)));
  };

  // the sentence as words and gaps; words wrap nicely
  const parts = q.text.split(/\{(\d+)\}/);
  return (
    <>
      <View style={[styles.sentence, sunken]}>
        {parts.map((part, k) => {
          if (k % 2 === 1) {
            const gap = Number(part);
            const word = slots[gap] !== null && slots[gap] !== undefined ? bank[slots[gap]!] : null;
            return (
              <Pressable
                key={`g${k}`}
                disabled={reveal || word === null}
                onPress={() => clear(gap)}
                accessibilityRole="button"
                accessibilityLabel={word ? t.question.gapFilled(gap + 1, word) : t.question.gapEmpty(gap + 1)}
                style={[styles.gap, word ? { backgroundColor: WIN.titleA } : null]}
              >
                <Text style={styles.optionText}>{word ?? ' '}</Text>
              </Pressable>
            );
          }
          return part
            .split(' ')
            .filter((w) => w.length > 0)
            .map((w, j) => (
              <Text key={`t${k}-${j}`} style={styles.word} maxFontSizeMultiplier={1.4}>
                {w}
              </Text>
            ));
        })}
      </View>
      <View style={styles.bank}>
        {bank.map((w, i) => (
          <Pressable
            key={`${w}-${i}`}
            disabled={reveal || used.has(i)}
            onPress={() => fill(i)}
            accessibilityRole="button"
            accessibilityLabel={w}
            style={[styles.chip, used.has(i) && { opacity: 0.25 }]}
          >
            <Text style={styles.chipText} maxFontSizeMultiplier={1.3}>
              {w}
            </Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}

// -------------------------------------------------------------------- several right answers
function MultiView({ q, variant, reveal, onChange }: Props<MultiQuestion> & { variant: number }) {
  const t = useStrings();
  const order = useMemo(() => variantMulti(q, variant), [q, variant]);
  // indices into the question's own options
  const [sel, setSel] = useState<number[]>([]);
  useEffect(() => {
    onChange(sel.length === 0 ? null : { type: 'multi', indices: sel });
  }, [sel]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <Text style={styles.hint} maxFontSizeMultiplier={1.4}>
        {t.question.multiHint}
      </Text>
      {order.map((k) => {
        const on = sel.includes(k);
        const right = q.answers.includes(k);
        // after answering: right ones green, wrongly picked red, a missed right one framed
        const state = reveal ? (right ? 'right' : on ? 'wrong' : 'plain') : on ? 'selected' : 'plain';
        return (
          <Pressable
            key={`${variant}-${k}`}
            disabled={reveal}
            onPress={() => {
              tap();
              setSel(on ? sel.filter((x) => x !== k) : [...sel, k]);
            }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            style={[styles.option, sunken, styles.checkRow, stateStyle(state), reveal && right && !on && styles.missed]}
          >
            <View style={[styles.box, on && styles.boxOn]}>{on ? <Text style={styles.tick}>✓</Text> : null}</View>
            <Text style={[styles.optionText, { flex: 1 }]} maxFontSizeMultiplier={1.4}>
              {q.options[k]}
            </Text>
          </Pressable>
        );
      })}
    </>
  );
}

// -------------------------------------------------------------------- sort into folders
function SortView({ q, variant, reveal, onChange }: Props<SortQuestion> & { variant: number }) {
  const t = useStrings();
  const items = useMemo(() => variantSort(q, variant), [q, variant]);
  const [filed, setFiled] = useState<Record<string, number>>({});
  useEffect(() => {
    onChange(Object.keys(filed).length === q.items.length ? { type: 'sort', groups: filed } : null);
  }, [filed]); // eslint-disable-line react-hooks/exhaustive-deps
  const groupOf = (item: string) => q.items.find((it) => it[0] === item)![1];
  return (
    <>
      <Text style={styles.hint} maxFontSizeMultiplier={1.4}>
        {t.question.sortHint}
      </Text>
      {items.map((item) => {
        const at = filed[item];
        const right = reveal && at === groupOf(item);
        return (
          <View
            key={item}
            style={[styles.option, sunken, { gap: 8 }, reveal && (right ? { backgroundColor: '#1F5A12' } : { backgroundColor: '#6A1B1B' })]}
          >
            <Text style={styles.optionText} maxFontSizeMultiplier={1.4}>
              {item}
            </Text>
            <View style={styles.bank}>
              {q.groups.map((g, k) => (
                <Pressable
                  key={g}
                  disabled={reveal}
                  onPress={() => {
                    tap();
                    setFiled({ ...filed, [item]: k });
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: at === k }}
                  accessibilityLabel={t.question.fileInto(item, g)}
                  style={[styles.chip, styles.folder, at === k && styles.folderOn, reveal && groupOf(item) === k && at !== k && styles.missed]}
                >
                  <Icon name="folder" size={18} />
                  <Text style={[styles.chipText, at === k && { color: '#FFFFFF' }]} maxFontSizeMultiplier={1.3}>
                    {g}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        );
      })}
    </>
  );
}

// -------------------------------------------------------------------- find the wrong statement
function SpotView({ q, reveal, onChange }: Props<SpotQuestion>) {
  const t = useStrings();
  const [sel, setSel] = useState<number | null>(null);
  useEffect(() => {
    onChange(sel === null ? null : { type: 'spot', index: sel });
  }, [sel]); // eslint-disable-line react-hooks/exhaustive-deps
  // the statements as one document, every sentence its own line to tap
  return (
    <>
      <Text style={styles.hint} maxFontSizeMultiplier={1.4}>
        {t.question.spotHint}
      </Text>
      <View style={[styles.doc, sunken]}>
        {q.lines.map((line, i) => {
          const state = reveal ? (i === q.wrong ? 'right' : i === sel ? 'wrong' : 'plain') : i === sel ? 'selected' : 'plain';
          return (
            <Pressable
              key={i}
              disabled={reveal}
              onPress={() => {
                tap();
                setSel(i);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: sel === i }}
              accessibilityLabel={t.question.statement(i + 1, line)}
              style={[styles.docLine, stateStyle(state)]}
            >
              <Text style={styles.lineNo}>{i + 1}</Text>
              <Text style={[styles.docText, reveal && i === q.wrong && styles.struck]} maxFontSizeMultiplier={1.4}>
                {line}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {reveal ? (
        <Text style={[styles.rightLine, sel !== q.wrong && { color: colors.bad }]} maxFontSizeMultiplier={1.4}>
          {sel === q.wrong ? t.question.spotFound : t.question.spotMissed(q.wrong + 1)}
        </Text>
      ) : null}
    </>
  );
}

function stateStyle(state: 'plain' | 'selected' | 'right' | 'wrong') {
  if (state === 'selected') return { backgroundColor: WIN.titleA };
  if (state === 'right') return { backgroundColor: '#1F5A12' };
  if (state === 'wrong') return { backgroundColor: '#6A1B1B' };
  return null;
}

const styles = StyleSheet.create({
  option: { padding: 14, minHeight: 52, justifyContent: 'center' },
  optionText: { color: colors.text, fontSize: 16, fontWeight: '700' },
  input: { color: colors.text, padding: 14, fontSize: 18 },
  hint: { color: colors.dim, fontSize: 13, lineHeight: 18 },
  rightLine: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  sentence: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, padding: 12 },
  word: { color: colors.text, fontSize: 18, lineHeight: 28 },
  gap: {
    minWidth: 84,
    minHeight: 40,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: colors.text,
    backgroundColor: '#0B1220',
  },
  bank: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    justifyContent: 'center',
    backgroundColor: WIN.face,
    borderWidth: 2,
    borderTopColor: WIN.hi,
    borderLeftColor: WIN.hi,
    borderRightColor: WIN.dark,
    borderBottomColor: WIN.dark,
  },
  chipText: { color: WIN.text, fontSize: 15, fontWeight: '700' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  box: { width: 22, height: 22, borderWidth: 2, borderColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.text },
  tick: { color: '#0B1220', fontSize: 15, fontWeight: '900', lineHeight: 18 },
  missed: { borderWidth: 2, borderColor: colors.primary },
  folder: { minHeight: 40, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  folderOn: { backgroundColor: WIN.titleA },
  doc: { padding: 6, gap: 2 },
  docLine: { flexDirection: 'row', gap: 10, padding: 10, minHeight: 44, alignItems: 'flex-start' },
  lineNo: { color: colors.dim, fontSize: 13, fontWeight: '800', width: 16, marginTop: 2 },
  docText: { color: colors.text, fontSize: 16, lineHeight: 22, flex: 1 },
  struck: { textDecorationLine: 'line-through' },
});
