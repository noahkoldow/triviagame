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
  areaName,
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
import { buy as buyProduct, restorePurchases, usePrices, watchRewarded } from '../src/state/monetize';
import { getState, today, update, useGame } from '../src/state/store';
import { useStrings } from '../src/strings';
import { colors } from '../src/theme';

const GEM_PACKS: ProductId[] = ['gems_50', 'gems_150', 'gems_400'];
const PLUS_PLANS: ProductId[] = ['plus_month', 'plus_year', 'plus_life'];

export default function Shop() {
  const router = useRouter();
  const t = useStrings();
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
  const { prices, sold } = usePrices();
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
    Alert.alert(t.shop.restore, ok && back ? t.shop.plusBack : t.shop.nothingToRestore);
  };

  const videoLabel = (instant: boolean, what: string) => (instant ? t.shop.instant(what) : t.shop.video(what));

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.body}>
        <BackBar title={t.shop.title} onBack={() => router.back()} />
        <View style={styles.balance}>
          <Chip icon="gem" label={`${gems}`} color={colors.gem} />
          <Chip icon="bit" label={`${bits}`} color={colors.bit} />
          <Chip label={t.shop.freezes(freezes)} color={colors.warn} />
        </View>

        <Text style={styles.section}>{t.shop.dailyHeading}</Text>
        <Card style={{ gap: 8 }}>
          {dailyBonusDue(s, day) ? (
            <Button
              label={t.shop.claimDaily(DAILY_BONUS.bits, DAILY_BONUS.gems)}
              icon="gem"
              disabled={busy}
              onPress={() => {
                if (update((p) => claimDailyBonus(p, day))) tap('success');
              }}
            />
          ) : dailyVideo.left > 0 ? (
            <Button
              variant="gem"
              label={videoLabel(dailyVideo.instant, t.shop.doubleBonus)}
              sub={t.shop.doubleBonusSub(DAILY_BONUS.bits, DAILY_BONUS.gems)}
              disabled={busy}
              onPress={() => watch('daily')}
            />
          ) : (
            <P>{t.shop.dailyDone}</P>
          )}
        </Card>

        <Text style={styles.section}>{t.shop.plusHeading}</Text>
        <Card style={[{ gap: 8 }, !plus && { borderColor: colors.gem }]}>
          {plus ? (
            <>
              <P style={{ color: colors.text }}>
                {shop.plusLifetime
                  ? t.shop.plusForever
                  : t.shop.plusUntil(t.shop.date(new Date(shop.plusUntil ?? now)))}
              </P>
              {plusBonusDue(s, day, now) ? (
                <Button
                  variant="gem"
                  icon="gem"
                  label={t.shop.claimMonthly(PLUS_MONTHLY.gems, PLUS_MONTHLY.freezes)}
                  onPress={() => {
                    if (update((p) => claimPlusBonus(p, day, Date.now()))) tap('success');
                  }}
                />
              ) : (
                <P>{t.shop.monthlyDone}</P>
              )}
            </>
          ) : !PLUS_PLANS.some(sold) ? (
            <P>{t.shop.unavailable}</P>
          ) : (
            <>
              <P style={{ color: colors.text }}>{t.shop.plusPitch(PLUS_MONTHLY.gems, prices.plus_year.price)}</P>
              <Button
                variant="gem"
                label={t.shop.seePlus}
                onPress={() => router.push({ pathname: '/plus', params: { from: 'shop' } })}
              />
            </>
          )}
        </Card>

        {starterAvailable(s) && sold('starter') ? (
          <>
            <Text style={styles.section}>{t.shop.starterHeading}</Text>
            <Card style={{ gap: 8, borderColor: colors.gem }}>
              <P style={{ color: colors.text }}>{t.shop.starterText}</P>
              <Button
                variant="gem"
                icon="gem"
                label={t.shop.starterBuy(prices.starter.price)}
                disabled={busy}
                onPress={() => buy('starter')}
              />
            </Card>
          </>
        ) : null}

        <Text style={styles.section}>{t.shop.gemsHeading}</Text>
        <Card style={{ gap: 8 }}>
          {gemVideo.left > 0 ? (
            <Button
              label={videoLabel(gemVideo.instant, t.shop.oneGem)}
              sub={t.shop.leftToday(gemVideo.left)}
              icon="gem"
              variant="ghost"
              disabled={busy}
              onPress={() => watch('gems')}
            />
          ) : (
            <P>{t.shop.gemVideosDone}</P>
          )}
          {GEM_PACKS.filter(sold).map((id) => (
            <Button
              key={id}
              label={`${t.shop.products[id].title} · ${prices[id].price}`}
              variant="gem"
              disabled={busy}
              onPress={() => buy(id)}
            />
          ))}
          {IS_PROTOTYPE ? <P>{t.shop.testMode}</P> : null}
          {GEM_PACKS.some(sold) ? null : <P>{t.shop.unavailable}</P>}
        </Card>

        <Text style={styles.section}>{t.shop.freezeHeading}</Text>
        <Card style={{ gap: 8 }}>
          <P>{t.shop.freezeText(freezes, FREEZE_MAX)}</P>
          <Button
            variant="gem"
            icon="gem"
            label={t.shop.freezeBuy(FREEZE_COST)}
            disabled={busy || gems < FREEZE_COST || freezes >= FREEZE_MAX}
            onPress={() => {
              if (update(buyFreeze)) tap('success');
            }}
          />
        </Card>

        <Text style={styles.section}>{t.shop.energyHeading}</Text>
        <Card style={{ gap: 8 }}>
          {energyVideo.left > 0 ? (
            <Button
              label={videoLabel(energyVideo.instant, t.shop.energyVideo(ENERGY_PER_VIDEO))}
              sub={t.shop.leftToday(energyVideo.left)}
              variant="ghost"
              disabled={busy}
              onPress={() => watch('energy')}
            />
          ) : (
            <P>{t.shop.energyDone}</P>
          )}
        </Card>

        <Text style={styles.section}>{t.shop.unlockAreas}</Text>
        <P>{t.shop.unlockText}</P>
        {SECTORS.map((sector) => (
          <Card key={sector} style={{ gap: 8 }}>
            <Text style={[styles.sectorTitle, { color: colors.sector[sector] }]}>{t.sectors[sector]}</Text>
            {areasOfSector(sector).map((a) => {
              const isOpen = unlocked.includes(a.id);
              const cost = areaCost(a.id);
              return (
                <View key={a.id} style={styles.row}>
                  <Text style={styles.rowText}>{areaName(a.id, t.lang)}</Text>
                  {isOpen ? (
                    <View style={styles.openRow}>
                      <Icon name="check" size={16} />
                      <Text style={styles.open}>{t.shop.open}</Text>
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

        <Text style={styles.section}>{t.shop.colors}</Text>
        <Card style={{ gap: 8 }}>
          {COSMETICS.map((c) => {
            const has = owned.includes(c.id);
            return (
              <View key={c.id} style={styles.row}>
                <View style={[styles.dot, { backgroundColor: c.color }]} />
                <Text style={[styles.rowText, { flex: 1 }]}>{t.shop.cosmetics[c.id] ?? c.de}</Text>
                {has ? (
                  <Button
                    label={active === c.id ? t.shop.active : t.shop.use}
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

        <P>{t.shop.fair}</P>
        <Button label={t.shop.restore} variant="ghost" disabled={busy} onPress={restore} />
        <Text style={{ color: colors.dim, fontSize: 12 }}>{t.shop.areasTotal(AREAS.length)}</Text>
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
