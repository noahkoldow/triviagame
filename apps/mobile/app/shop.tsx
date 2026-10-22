import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AREAS,
  COSMETICS,
  SECTORS,
  areaCost,
  areasOfSector,
  buyCosmetic,
  grantGems,
  unlockArea,
} from '@nexus/shared';
import { BackBar, Button, Card, Chip, P, tap } from '../src/components/ui';
import { ads } from '../src/services/ads';
import { pool } from '../src/services/content';
import { PRODUCTS, purchases } from '../src/services/purchases';
import { getState, update, useGame } from '../src/state/store';
import { de } from '../src/strings';
import { colors } from '../src/theme';

export default function Shop() {
  const router = useRouter();
  const gems = useGame((p) => p.gems);
  const bits = useGame((p) => p.bits);
  const unlocked = useGame((p) => p.unlockedAreas);
  const owned = useGame((p) => p.ownedCosmetics);
  const active = useGame((p) => p.activeCosmetic);
  const adFree = useGame((p) => p.profile.adFree);
  const [busy, setBusy] = useState(false);

  const buy = async (id: string) => {
    const product = PRODUCTS.find((p) => p.id === id)!;
    setBusy(true);
    const ok = await purchases.purchase(id);
    setBusy(false);
    if (!ok) return;
    update((p) => {
      let next = p;
      if (product.gems) next = grantGems(next, product.gems);
      if (product.adFree) next = { ...next, profile: { ...next.profile, adFree: true } };
      return next;
    });
    tap('success');
  };

  const watchForGems = async () => {
    setBusy(true);
    const s = getState();
    const ok = await ads.showRewarded({
      personalized: s.profile.ageGroup === 'adult' && s.profile.consent,
    });
    setBusy(false);
    if (ok) update((p) => grantGems(p, 1));
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.body}>
        <BackBar title="Shop" onBack={() => router.back()} />
        <View style={styles.balance}>
          <Chip label={`💎 ${gems}`} color={colors.gem} />
          <Chip label={`◈ ${bits}`} color={colors.bit} />
        </View>
        <P>
          Gems öffnen neue Bereiche in den Sektoren. Alles hier ist auch erspielbar, Gems sparen nur
          Zeit. Kein Vorteil bei Antworten.
        </P>

        <Text style={styles.section}>BEREICHE FREISCHALTEN</Text>
        {SECTORS.map((s) => (
          <Card key={s} style={{ gap: 8 }}>
            <Text style={[styles.sectorTitle, { color: colors.sector[s] }]}>{de.sectors[s]}</Text>
            {areasOfSector(s).map((a) => {
              const isOpen = unlocked.includes(a.id);
              const cost = areaCost(a.id);
              return (
                <View key={a.id} style={styles.row}>
                  <Text style={styles.rowText}>{a.de}</Text>
                  {isOpen ? (
                    <Text style={styles.open}>offen ✓</Text>
                  ) : (
                    <Button
                      variant="gem"
                      label={`${cost} 💎`}
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

        <Text style={styles.section}>GEMS</Text>
        <Card style={{ gap: 8 }}>
          <Button
            label="Video ansehen: +1 💎"
            variant="ghost"
            disabled={busy || adFree}
            onPress={watchForGems}
          />
          {PRODUCTS.filter((p) => p.gems).map((p) => (
            <Button
              key={p.id}
              label={`${p.title} · ${p.price}`}
              variant="gem"
              disabled={busy}
              onPress={() => buy(p.id)}
            />
          ))}
          <P>Testmodus: Käufe sind simuliert und kosten nichts.</P>
        </Card>

        <Text style={styles.section}>WERBEFREI</Text>
        <Card>
          {adFree ? (
            <P>Danke! Keine Werbung mehr.</P>
          ) : (
            <Button
              label={`Werbefrei · ${PRODUCTS.find((p) => p.adFree)!.price}`}
              disabled={busy}
              onPress={() => buy('adfree')}
            />
          )}
        </Card>

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
                    label={`${c.cost} ◈`}
                    disabled={bits < c.cost}
                    onPress={() => update((p) => buyCosmetic(p, c.id))}
                    style={styles.smallBtn}
                  />
                )}
              </View>
            );
          })}
        </Card>
        <Text style={{ color: colors.dim, fontSize: 12 }}>{AREAS.length} Bereiche insgesamt.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16, gap: 12 },
  balance: { flexDirection: 'row', gap: 10 },
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
  open: { color: colors.good, fontWeight: '900' },
  smallBtn: { minHeight: 40, paddingVertical: 4, paddingHorizontal: 14 },
  dot: { width: 22, height: 22, borderRadius: 11 },
});
