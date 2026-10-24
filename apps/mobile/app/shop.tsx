import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AREAS,
  COSMETICS,
  DAILY_BONUS,
  ENERGY_PER_VIDEO,
  FREEZE_COST,
  FREEZE_MAX,
  PLUS_MONTHLY,
  SECTORS,
  areaCost,
  areasOfSector,
  buyCosmetic,
  buyFreeze,
  claimDailyBonus,
  claimPlusBonus,
  dailyBonusDue,
  isPlus,
  plusBonusDue,
  rewardedOffer,
  starterAvailable,
  unlockArea,
  type ProductId,
  type RewardedPlacement,
} from '@nexus/shared';
import { Icon } from '../src/components/Icon';
import { BackBar, Button, Card, Chip, P, tap } from '../src/components/ui';
import { track } from '../src/services/analytics';
import { pool } from '../src/services/content';
import { IS_PROTOTYPE } from '../src/config';
import { PRODUCT_TEXT } from '../src/services/purchases';
import { buy as buyProduct, restorePurchases, usePrices, watchRewarded } from '../src/state/monetize';
import { getState, today, update, useGame } from '../src/state/store';
import { de } from '../src/strings';
import { colors } from '../src/theme';

const GEM_PACKS: ProductId[] = ['gems_50', 'gems_150', 'gems_400'];

function dateText(ms: number): string {
  const d = new Date(ms);
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

export default function Shop() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const gems = useGame((p) => p.gems);
  const bits = useGame((p) => p.bits);
  const freezes = useGame((p) => p.streak.freezes);
  const unlocked = useGame((p) => p.unlockedAreas);
  const owned = useGame((p) => p.ownedCosmetics);
  const active = useGame((p) => p.activeCosmetic);
  const shop = useGame((p) => p.shop);
  // the offers below read the whole state; these keep them current
  useGame((p) => p.energy);
  useGame((p) => p.integrity);
  const prices = usePrices();
  const [busy, setBusy] = useState(false);

  useEffect(() => track({ name: 'shop_open', from: from ?? 'dock' }), [from]);

  const s = getState();
  const now = Date.now();
  const day = today();
  const plus = isPlus(s, now);
  const offer = (placement: RewardedPlacement) => rewardedOffer(s, placement, day, now);
  const gemVideo = offer('gems');
  const energyVideo = offer('energy');
  const dailyVideo = offer('daily');

  const buy = async (id: ProductId) => {
    setBusy(true);
    const ok = await buyProduct(id);
    setBusy(false);
    if (ok) tap('success');
  };

  const watch = async (placement: RewardedPlacement) => {
    setBusy(true);
    const ok = await watchRewarded(placement);
    setBusy(false);
    if (ok) tap('success');
  };

  const restore = async () => {
    setBusy(true);
    const ok = await restorePurchases();
    setBusy(false);
    const back = isPlus(getState(), Date.now());
    Alert.alert(
      'Käufe wiederherstellen',
      ok && back ? 'NEXUS Plus ist wieder aktiv.' : 'Es gab nichts wiederherzustellen.',
    );
  };

  const videoLabel = (instant: boolean, what: string) => (instant ? `${what} (Plus)` : `Video ansehen: ${what}`);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.body}>
        <BackBar title="Shop" onBack={() => router.back()} />
        <View style={styles.balance}>
          <Chip icon="gem" label={`${gems}`} color={colors.gem} />
          <Chip icon="bit" label={`${bits}`} color={colors.bit} />
          <Chip label={`${freezes}× Streak-Schutz`} color={colors.warn} />
        </View>

        <Text style={styles.section}>TAGESFUNK</Text>
        <Card style={{ gap: 8 }}>
          {dailyBonusDue(s, day) ? (
            <Button
              label={`Tagesbonus abholen: +${DAILY_BONUS.bits} Bits, +${DAILY_BONUS.gems} Gem`}
              icon="gem"
              disabled={busy}
              onPress={() => {
                if (update((p) => claimDailyBonus(p, day))) tap('success');
              }}
            />
          ) : dailyVideo.left > 0 ? (
            <Button
              variant="gem"
              label={videoLabel(dailyVideo.instant, 'Bonus verdoppeln')}
              sub={`Noch einmal +${DAILY_BONUS.bits} Bits und +${DAILY_BONUS.gems} Gem`}
              disabled={busy}
              onPress={() => watch('daily')}
            />
          ) : (
            <P>Heute abgeholt. Morgen gibt es den nächsten Tagesbonus.</P>
          )}
        </Card>

        <Text style={styles.section}>NEXUS PLUS</Text>
        <Card style={[{ gap: 8 }, !plus && { borderColor: colors.gem }]}>
          {plus ? (
            <>
              <P style={{ color: colors.text }}>
                {shop.plusLifetime
                  ? 'Plus ist für immer aktiv. Danke, dass du NEXUS unterstützt!'
                  : `Plus ist aktiv bis ${dateText(shop.plusUntil ?? now)}. Danke, dass du NEXUS unterstützt!`}
              </P>
              {plusBonusDue(s, day, now) ? (
                <Button
                  variant="gem"
                  icon="gem"
                  label={`Monatsbonus abholen: +${PLUS_MONTHLY.gems} Gems, +${PLUS_MONTHLY.freezes} Streak-Schutz`}
                  onPress={() => {
                    if (update((p) => claimPlusBonus(p, day, Date.now()))) tap('success');
                  }}
                />
              ) : (
                <P>Monatsbonus für diesen Monat abgeholt.</P>
              )}
            </>
          ) : (
            <>
              <P style={{ color: colors.text }}>
                Keine Werbung, jede Video-Belohnung ohne Video und jeden Monat {PLUS_MONTHLY.gems} Gems. Ab{' '}
                {prices.plus_year.price} im Jahr.
              </P>
              <Button
                variant="gem"
                label="Plus ansehen"
                onPress={() => router.push({ pathname: '/plus', params: { from: 'shop' } })}
              />
            </>
          )}
        </Card>

        {starterAvailable(s) ? (
          <>
            <Text style={styles.section}>STARTPAKET · EINMALIG</Text>
            <Card style={{ gap: 8, borderColor: colors.gem }}>
              <P style={{ color: colors.text }}>
                100 Gems und 3 Streak-Schutz zum Einstiegspreis. Gibt es nur einmal pro Spielstand.
              </P>
              <Button
                variant="gem"
                icon="gem"
                label={`Startpaket · ${prices.starter.price}`}
                disabled={busy}
                onPress={() => buy('starter')}
              />
            </Card>
          </>
        ) : null}

        <Text style={styles.section}>GEMS</Text>
        <Card style={{ gap: 8 }}>
          {gemVideo.left > 0 ? (
            <Button
              label={videoLabel(gemVideo.instant, '+1 Gem')}
              sub={`Heute noch ${gemVideo.left}`}
              icon="gem"
              variant="ghost"
              disabled={busy}
              onPress={() => watch('gems')}
            />
          ) : (
            <P>Für heute sind alle Gem-Videos geschaut.</P>
          )}
          {GEM_PACKS.map((id) => (
            <Button
              key={id}
              label={`${PRODUCT_TEXT[id].title} · ${prices[id].price}`}
              variant="gem"
              disabled={busy}
              onPress={() => buy(id)}
            />
          ))}
          {IS_PROTOTYPE ? <P>Testmodus: Käufe sind simuliert und kosten nichts.</P> : null}
        </Card>

        <Text style={styles.section}>STREAK-SCHUTZ</Text>
        <Card style={{ gap: 8 }}>
          <P>Ein Streak-Schutz rettet deine Serie, wenn du einen Tag nicht spielst. Du hast {freezes} von {FREEZE_MAX}.</P>
          <Button
            variant="gem"
            icon="gem"
            label={`1 Streak-Schutz · ${FREEZE_COST}`}
            disabled={busy || gems < FREEZE_COST || freezes >= FREEZE_MAX}
            onPress={() => {
              if (update(buyFreeze)) tap('success');
            }}
          />
        </Card>

        <Text style={styles.section}>ENERGIE</Text>
        <Card style={{ gap: 8 }}>
          {energyVideo.left > 0 ? (
            <Button
              label={videoLabel(energyVideo.instant, `+${ENERGY_PER_VIDEO} Energie`)}
              sub={`Heute noch ${energyVideo.left}`}
              variant="ghost"
              disabled={busy}
              onPress={() => watch('energy')}
            />
          ) : (
            <P>Energie ist voll oder für heute aufgefüllt. Sie lädt sich von selbst wieder auf.</P>
          )}
        </Card>

        <Text style={styles.section}>BEREICHE FREISCHALTEN</Text>
        <P>Gems öffnen neue Bereiche sofort. Sie öffnen sich auch, wenn dein Netz dorthin wächst.</P>
        {SECTORS.map((sector) => (
          <Card key={sector} style={{ gap: 8 }}>
            <Text style={[styles.sectorTitle, { color: colors.sector[sector] }]}>{de.sectors[sector]}</Text>
            {areasOfSector(sector).map((a) => {
              const isOpen = unlocked.includes(a.id);
              const cost = areaCost(a.id);
              return (
                <View key={a.id} style={styles.row}>
                  <Text style={styles.rowText}>{a.de}</Text>
                  {isOpen ? (
                    <View style={styles.openRow}>
                      <Icon name="check" size={16} />
                      <Text style={styles.open}>offen</Text>
                    </View>
                  ) : (
                    <Button
                      variant="gem"
                      label={`${cost}`}
                      icon="gem"
                      disabled={gems < cost}
                      onPress={() => update((p) => unlockArea(p, a.id, pool))}
                      style={styles.smallBtn}
                    />
                  )}
                </View>
              );
            })}
          </Card>
        ))}

        <Text style={styles.section}>FARBEN FÜR DEINEN LEUCHTPUNKT</Text>
        <Card style={{ gap: 8 }}>
          {COSMETICS.map((c) => {
            const has = owned.includes(c.id);
            return (
              <View key={c.id} style={styles.row}>
                <View style={[styles.dot, { backgroundColor: c.color }]} />
                <Text style={[styles.rowText, { flex: 1 }]}>{c.de}</Text>
                {has ? (
                  <Button
                    label={active === c.id ? 'Aktiv' : 'Nutzen'}
                    variant="ghost"
                    disabled={active === c.id}
                    onPress={() => update((p) => ({ ...p, activeCosmetic: c.id }))}
                    style={styles.smallBtn}
                  />
                ) : (
                  <Button
                    label={`${c.cost}`}
                    icon="bit"
                    disabled={bits < c.cost}
                    onPress={() => update((p) => buyCosmetic(p, c.id))}
                    style={styles.smallBtn}
                  />
                )}
              </View>
            );
          })}
        </Card>

        <P>Alles hier ist auch erspielbar, Gems sparen nur Zeit. Kein Vorteil bei Antworten oder in der Rangliste.</P>
        <Button label="Käufe wiederherstellen" variant="ghost" disabled={busy} onPress={restore} />
        <Text style={{ color: colors.dim, fontSize: 12 }}>{AREAS.length} Bereiche insgesamt.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16, gap: 12 },
  balance: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  section: {
    color: colors.dim,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 10,
  },
  sectorTitle: { fontSize: 16, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  rowText: { color: colors.text, fontSize: 16 },
  openRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  open: { color: colors.good, fontWeight: '900' },
  smallBtn: { minHeight: 40, paddingVertical: 4, paddingHorizontal: 14 },
  dot: { width: 22, height: 22, borderRadius: 11 },
});
