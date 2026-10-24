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
import { PRODUCT_TEXT } from '../src/services/purchases';
import { buy, restorePurchases, usePrices } from '../src/state/monetize';
import { getState, useGame } from '../src/state/store';
import { colors } from '../src/theme';

const PLANS: ProductId[] = ['plus_year', 'plus_month', 'plus_life'];

const BENEFITS: { icon: IconName; text: string }[] = [
  { icon: 'check', text: 'Keine Werbung: keine Unterbrechungen zwischen den Knoten.' },
  { icon: 'bolt', text: 'Jede Video-Belohnung sofort und ohne Video: zweite Chance, Integrität, Energie, doppelter Tagesbonus.' },
  { icon: 'gem', text: `Jeden Monat ${PLUS_MONTHLY.gems} Gems und ${PLUS_MONTHLY.freezes} Streak-Schutz.` },
  { icon: 'shard', text: 'Du hältst ein Lernspiel ohne Bezahlschranke am Laufen.' },
];

/** NEXUS Plus: the subscription that replaces ads (D54). */
export default function PlusScreen() {
  const router = useRouter();
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
    Alert.alert(
      'Käufe wiederherstellen',
      ok && isPlus(getState(), Date.now()) ? 'NEXUS Plus ist wieder aktiv.' : 'Es gab nichts wiederherzustellen.',
    );
  };

  const open = (url: string) => {
    if (url) void Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.body}>
        <BackBar title="NEXUS Plus" onBack={() => router.back()} />
        <View style={{ alignItems: 'center' }}>
          <Bolt size={96} mood="wow" />
        </View>
        <H1 style={{ textAlign: 'center' }}>Spiel ohne Werbung</H1>
        <P style={{ textAlign: 'center' }}>
          NEXUS bleibt für alle kostenlos, die Werbung bezahlt es. Mit Plus bezahlst du es selbst.
        </P>

        <Card style={{ gap: 10 }}>
          {BENEFITS.map((b) => (
            <View key={b.text} style={styles.benefit}>
              <Icon name={b.icon} size={18} />
              <Text style={styles.benefitText}>{b.text}</Text>
            </View>
          ))}
          <P>Kein Vorteil bei Antworten oder in der Liga: Tageslimits und Regeln bleiben gleich.</P>
        </Card>

        {active ? (
          <Card>
            <P style={{ color: colors.text }}>
              {shop.plusLifetime ? 'Plus ist für immer aktiv.' : 'Plus ist aktiv.'} Danke für deine Unterstützung!
            </P>
          </Card>
        ) : (
          <>
            <View style={{ gap: 8 }} accessibilityRole="radiogroup">
              {PLANS.map((id) => {
                const selected = plan === id;
                const t = PRODUCT_TEXT[id];
                return (
                  <Pressable
                    key={id}
                    onPress={() => setPlan(id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${t.title}, ${prices[id].price} ${t.per ?? ''}`}
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
                        {t.title}
                        {id === 'plus_year' && saving ? `  · spart ${saving} %` : ''}
                      </Text>
                      {prices[id].intro ? <Text style={styles.planSub}>{prices[id].intro}</Text> : null}
                    </View>
                    <Text style={styles.planPrice}>
                      {prices[id].price}
                      {t.per ? `\n${t.per}` : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Button
              variant="gem"
              label={plan === 'plus_life' ? 'Plus für immer kaufen' : 'Plus abonnieren'}
              disabled={busy}
              onPress={subscribe}
            />
            {IS_PROTOTYPE ? <P>Testmodus: Käufe sind simuliert und kosten nichts.</P> : null}
          </>
        )}

        <Button label="Käufe wiederherstellen" variant="ghost" disabled={busy} onPress={restore} />

        <Text style={styles.legal}>
          Monatlich und jährlich sind Abos, die sich automatisch verlängern, wenn du sie nicht mindestens 24 Stunden vor
          Ende des Zeitraums kündigst. Die Zahlung wird bei Bestätigung über dein App-Store-Konto abgerechnet. Kündigen
          kannst du jederzeit in den Einstellungen deines App-Store-Kontos. „Für immer“ ist ein einmaliger Kauf.
        </Text>
        <View style={styles.links}>
          <Pressable accessibilityRole="link" hitSlop={8} onPress={() => open(TERMS_URL)}>
            <Text style={styles.link}>Nutzungsbedingungen</Text>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            hitSlop={8}
            onPress={() => (PRIVACY_URL ? open(PRIVACY_URL) : router.push('/privacy'))}
          >
            <Text style={styles.link}>Datenschutz</Text>
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
