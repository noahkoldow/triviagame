import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PLUS_MONTHLY, isPlus, yearlySaving, type ProductId } from '@nexus/shared';
import { Bolt } from '../src/components/Bolt';
import { Icon, type IconName } from '../src/components/Icon';
import { BackBar, Button, Card, H1, P, tap } from '../src/components/ui';
import { pressedIn, raised, sunken } from '../src/components/Win';
import { IS_PROTOTYPE, PRIVACY_URL, TERMS_URL } from '../src/config';
import { track } from '../src/services/analytics';
import { buy, restorePurchases, usePrices } from '../src/state/monetize';
import { getState, useGame } from '../src/state/store';
import { useStrings } from '../src/strings';
import { colors } from '../src/theme';

const PLANS: ProductId[] = ['plus_year', 'plus_month', 'plus_life'];

/** One icon per benefit; the texts are `plus.benefits` in the UI strings. */
const BENEFIT_ICONS: IconName[] = ['check', 'bolt', 'gem', 'shard'];

/** NEXUS Plus: the subscription that replaces ads (D54). */
export default function PlusScreen() {
  const router = useRouter();
  const t = useStrings();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const prices = usePrices();
  const [plan, setPlan] = useState<ProductId>('plus_year');
  const [busy, setBusy] = useState(false);
  const shop = useGame((p) => p.shop);
  const active = isPlus(getState(), Date.now());

  useEffect(() => {
    track({ name: 'paywall_open', from: from ?? 'unknown' });
    track({ name: 'offer_shown', offer: 'plus' });
  }, [from]);

  const saving = yearlySaving(prices.plus_month.amount, prices.plus_year.amount);

  const subscribe = async () => {
    setBusy(true);
    const ok = await buy(plan);
    setBusy(false);
    if (!ok) return;
    tap('success');
    router.back();
  };

  const restore = async () => {
    setBusy(true);
    const ok = await restorePurchases();
    setBusy(false);
    Alert.alert(t.shop.restore, ok && isPlus(getState(), Date.now()) ? t.shop.plusBack : t.shop.nothingToRestore);
  };

  const open = (url: string) => {
    if (url) void Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.body}>
        <BackBar title={t.plus.title} onBack={() => router.back()} />
        <View style={{ alignItems: 'center' }}>
          <Bolt size={96} mood="wow" />
        </View>
        <H1 style={{ textAlign: 'center' }}>{t.plus.headline}</H1>
        <P style={{ textAlign: 'center' }}>{t.plus.intro}</P>

        <Card style={{ gap: 10 }}>
          {t.plus.benefits(PLUS_MONTHLY.gems, PLUS_MONTHLY.freezes).map((text, i) => (
            <View key={text} style={styles.benefit}>
              <Icon name={BENEFIT_ICONS[i] ?? 'check'} size={18} />
              <Text style={styles.benefitText}>{text}</Text>
            </View>
          ))}
          <P>{t.plus.fair}</P>
        </Card>

        {active ? (
          <Card>
            <P style={{ color: colors.text }}>
              {shop.plusLifetime ? t.plus.activeForever : t.plus.active} {t.plus.thanks}
            </P>
          </Card>
        ) : (
          <>
            <View style={{ gap: 8 }} accessibilityRole="radiogroup">
              {PLANS.map((id) => {
                const selected = plan === id;
                const text = t.shop.products[id];
                return (
                  <Pressable
                    key={id}
                    onPress={() => setPlan(id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${text.title}, ${prices[id].price} ${text.per ?? ''}`}
                    style={({ pressed }) => [
                      styles.plan,
                      selected ? sunken : raised,
                      selected && { borderColor: colors.gem },
                      pressed && pressedIn,
                    ]}
                  >
                    <View style={[styles.radio, selected && styles.radioOn]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.planTitle}>
                        {text.title}
                        {id === 'plus_year' && saving ? t.plus.saves(saving) : ''}
                      </Text>
                      {prices[id].intro ? <Text style={styles.planSub}>{prices[id].intro}</Text> : null}
                    </View>
                    <Text style={styles.planPrice}>
                      {prices[id].price}
                      {text.per ? `\n${text.per}` : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Button
              variant="gem"
              label={plan === 'plus_life' ? t.plus.buyForever : t.plus.subscribe}
              disabled={busy}
              onPress={subscribe}
            />
            {IS_PROTOTYPE ? <P>{t.shop.testMode}</P> : null}
          </>
        )}

        <Button label={t.shop.restore} variant="ghost" disabled={busy} onPress={restore} />

        <Text style={styles.legal}>{t.plus.legal}</Text>
        <View style={styles.links}>
          <Pressable accessibilityRole="link" hitSlop={8} onPress={() => open(TERMS_URL)}>
            <Text style={styles.link}>{t.plus.terms}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            hitSlop={8}
            onPress={() => (PRIVACY_URL ? open(PRIVACY_URL) : router.push('/privacy'))}
          >
            <Text style={styles.link}>{t.plus.privacy}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16, gap: 12 },
  benefit: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  benefitText: { color: colors.text, fontSize: 15, flex: 1 },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, minHeight: 56, borderWidth: 2, borderColor: 'transparent' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.dim },
  radioOn: { borderColor: colors.gem, backgroundColor: colors.gem },
  planTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  planSub: { color: colors.gem, fontSize: 13, fontWeight: '700' },
  planPrice: { color: colors.text, fontSize: 15, fontWeight: '800', textAlign: 'right' },
  legal: { color: colors.dim, fontSize: 12, lineHeight: 17 },
  links: { flexDirection: 'row', gap: 20, justifyContent: 'center' },
  link: { color: colors.accent, fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
});
