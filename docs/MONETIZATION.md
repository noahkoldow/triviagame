# Monetarisierung (CFO)

Stand: 25.10.2026. Entscheidungen: D54–D56 in `DECISIONS.md`. Regeln im Code: `packages/shared/src/monetization.ts` (`AD_POLICY`) und `packages/shared/src/shop.ts`.

## 1. Grundsatz

**NEXUS ist überwiegend kostenlos, Werbung finanziert die App** (Vorgabe des Auftraggebers, 25.10.2026). Käufe kommen obendrauf: **NEXUS Plus** als Abo ersetzt die Werbung, Gems sparen Zeit. Nichts davon bringt einen Vorteil bei Antworten oder in der Liga.

Bei werbefinanzierten Apps entscheidet die Bindung über den Umsatz: Wer nach einer Woche noch spielt, sieht Werbung. Darum bleibt die erste Sitzung werbefrei, und Werbung kommt nie mitten ins Lernen.

## 2. Einnahmequellen und Regeln

### Werbung (Hauptquelle)

| Format | Wann | Grenzen |
|---|---|---|
| **Rewarded-Video** (freiwillig) | zweite Chance nach falscher Antwort, +1 Integrität, +2 Energie, +1 Gem im Shop, Tagesbonus verdoppeln | je Platz und Tag: 5 / 3 / 4 / 5 / 1. Volle Leisten werden nicht angeboten. |
| **Interstitial** | in einer natürlichen Pause: beim Verlassen eines Ergebnisses zur Karte | jede 2. Pause, mindestens 3 min seit der letzten Werbung (auch seit einem Rewarded-Video), erst ab 8 gelösten Knoten |
| **App-Open** | Rückkehr in die App nach ≥ 1 min im Hintergrund oder Kaltstart | höchstens alle 4 h, erst ab 8 gelösten Knoten |

**Nie:** in einer Frage, im Trümmerfeld, bei Firewalls und Finale, direkt nach einer falschen Antwort, vor dem Ende des Onboardings. **Unter 16:** nur freiwillige, nicht personalisierte Videos (D5). **Plus oder das frühere „Werbefrei“:** keine Zwangswerbung; jede Video-Belohnung kommt sofort, mit denselben Tageslimits.

Alle Werte stehen in `AD_POLICY` und lassen sich per EAS-Update ohne Store-Release ändern.

### NEXUS Plus (Abo)

- keine Interstitials und keine App-Open-Werbung
- Video-Belohnungen ohne Video (gleiche Tageslimits, also kein Vorteil gegenüber Gratis-Spielern)
- jeden Kalendermonat 50 Gems und 1 Streak-Schutz (im Shop abholen, beim Kauf sofort)
- Monatlich, jährlich (mit Rabatt, aus den Store-Preisen berechnet) oder einmalig „für immer“. Für immer ist der Anker für Abo-Muffel (in DACH verbreitet) und lässt das Jahresabo günstig wirken.

### Gems und Startpaket

- **Startpaket** (einmalig pro Spielstand, nach Kapitel 1 = 4 gelöste Knoten): 100 Gems und 3 Streak-Schutz. Es erscheint einmal nach einer richtigen Antwort und bleibt danach im Shop. Kein Countdown, keine künstliche Verknappung.
- **Gem-Pakete:** 50 / 150 / 400.
- **Senken:** Bereiche (15/25 je Sektor), Netz heilen (3), **Streak-Schutz (10, Vorrat bis 5)**. Energie gibt es bewusst nicht für Gems: Der Ordner in der Frage ist eine Antworthilfe, Energie per Video hat dagegen jeder.
- **Tagesbonus:** 15 Bits und 1 Gem einmal am Tag im Shop (roter Punkt am Dock), per Video verdoppelbar. Das bringt eine tägliche Rückkehr und ein Rewarded-Video.

## 3. Produkte und Preise

Preise sind **Empfehlungen und Platzhalter**. Die App zeigt die lokalisierten Preise aus dem Store, die Texte in `src/services/purchases.ts` sind nur der Ersatz, bis der Store antwortet.

| Produkt-ID | Typ in App Store Connect | Inhalt | Empfehlung |
|---|---|---|---|
| `gems_50` | Verbrauchsartikel | 50 Gems | 0,99 € |
| `gems_150` | Verbrauchsartikel | 150 Gems | 2,49 € |
| `gems_400` | Verbrauchsartikel | 400 Gems | 5,99 € |
| `starter` | Verbrauchsartikel (die App bietet ihn nur einmal an) | 100 Gems, 3 Streak-Schutz | 1,99 € |
| `plus_month` | Auto-Abo, Gruppe „NEXUS Plus“ | Plus | 4,99 € / Monat |
| `plus_year` | Auto-Abo, gleiche Gruppe | Plus | 29,99 € / Jahr, 7 Tage gratis testen |
| `plus_life` | Nicht verbrauchbar | Plus für immer | 59,99 € |

Das frühere Produkt `adfree` entfällt (würde Plus kannibalisieren). Wer es im Prototyp hatte, behält „Werbefrei“ (`profile.adFree`).

Gutschrift: `applyPurchase` schreibt jede Transaktion genau einmal gut. Für Plus gilt der Ablauf, den der Store meldet (`applyEntitlements` beim Start und beim Wiederherstellen).

## 4. Umsatzrechnung

**Alle Zahlen sind Annahmen für einen DACH-Start auf iOS und müssen nach dem Start durch Messung ersetzt werden.** eCPM = Auszahlung je 1.000 Einblendungen.

| je 1.000 täglich Aktive (DAU) | niedrig | mittel | hoch |
|---|---|---|---|
| Anteil mit Zwangswerbung (erwachsen, nach der ersten Sitzung, ohne Plus) | 70 % | 70 % | 70 % |
| Interstitials je berechtigtem DAU und Tag | 1,5 | 2,5 | 4 |
| App-Open je berechtigtem DAU und Tag | 0,5 | 0,8 | 1 |
| Rewarded je DAU und Tag | 0,6 | 1,2 | 2 |
| eCPM Interstitial / App-Open / Rewarded | 4 / 3 / 8 € | 8 / 6 / 14 € | 14 / 10 / 25 € |
| **Werbeumsatz pro Tag** | **≈ 10 €** | **≈ 34 €** | **≈ 96 €** |
| **pro DAU und Tag (ARPDAU)** | 1,0 ct | 3,4 ct | 9,6 ct |

Plus und Gems, Annahme 1 % zahlende DAU mit je etwa 3 € netto im Monat (nach 15 % Apple-Anteil im Small Business Program): etwa 30 + 30 € im Monat je 1.000 DAU. **Werbung trägt also über 90 % des Umsatzes**, wie vorgegeben.

Kosten: Apple-Entwicklerprogramm (99 USD/Jahr), Firebase und Gemini. Die KI-Kosten sind durch das Tagesbudget gedeckelt (E7) und wachsen kaum mit den Spielern, weil alle aus einem gemeinsamen Fragen-Pool spielen.

Die größten Hebel sind deshalb **Bindung (D7), Einwilligungsquote (personalisierte Werbung bringt ein Vielfaches) und eCPM (Mediation)**, nicht die Anzeigenfrequenz.

## 5. Messen

Ereignisse über `src/services/analytics.ts` (heute ein Mock, im Store-Build z. B. Firebase Analytics, nur mit Einwilligung, ohne Personendaten): `ad_offer`, `ad_shown`, `ad_reward`, `shop_open`, `paywall_open`, `offer_shown`, `purchase_start`, `purchase_done`, `purchase_cancel`.

| Kennzahl | Zielwert zum Start |
|---|---|
| Bindung D1 / D7 / D30 | ≥ 40 % / ≥ 15 % / ≥ 6 % |
| Werbung je DAU nach Format, Füllrate | Füllrate ≥ 90 % |
| Rewarded: geschaut je Angebot | ≥ 25 % |
| Einwilligung (UMP) und ATT-Zustimmung | messen, dann Texte testen |
| Paywall-Aufrufe → Plus-Käufe | ≥ 3 % |
| Leitplanke | eine höhere Werbefrequenz darf D7 nicht senken (A/B-Test) |

## 6. Was ein Mensch tun muss, damit Geld fließt 👤

Der Code ist fertig (AdMob-Anbieter, Einwilligung, Regeln). Es fehlen Konten und IDs:

1. **AdMob-Konto** mit Zahlungsprofil (Adresse, Bankverbindung, Steuerangaben).
2. In AdMob eine **iOS-App** anlegen (nach dem Store-Start mit dem App-Store-Eintrag verknüpfen) und drei **Anzeigenblöcke**: Rewarded, Interstitial, App-Open. Für Android später dasselbe.
3. **EAS-Umgebungsvariablen** (öffentlich, keine Secrets): `ADMOB_IOS_APP_ID`, `EXPO_PUBLIC_ADMOB_IOS_REWARDED`, `EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL`, `EXPO_PUBLIC_ADMOB_IOS_APP_OPEN` (für Android die `ANDROID`-Varianten). Bis dahin laufen Googles Test-IDs, die nichts auszahlen.
4. AdMob → **Datenschutz und Mitteilungen**: DSGVO-Mitteilung (EWR, UK, Schweiz) und die **IDFA-Erklärung** für iOS veröffentlichen. Die App zeigt sie über UMP vor dem ersten Laden, die ATT-Abfrage kommt aus dieser Mitteilung (Text in `app.config.ts`).
5. **`app-ads.txt`** auf der Website der Entwickler-Domain (dieselbe Domain wie die Marketing- bzw. Support-URL im App Store) mit der Zeile aus AdMob.
6. **App-Datenschutz-Etikett:** Werbedaten, Geräte-ID (bei ATT-Zustimmung), „zum Tracking verwendet“ für personalisierte Werbung; Käufe nach den Angaben von RevenueCat.
7. **Käufe:** Paid Apps Agreement, die Produkte aus §3 in App Store Connect, RevenueCat-Konto mit dem Entitlement `plus` (an `plus_month`, `plus_year`, `plus_life`). Der RevenueCat-Anbieter selbst ist noch zu bauen (→ `CODEX_HANDOFF.md` P2.1); das Interface steht.
8. **Development Build** auf einem echten Gerät: Einwilligung, Rewarded, Interstitial, App-Open mit Test-IDs prüfen, danach mit echten IDs und registriertem Testgerät.

## 7. Nach dem Start (in dieser Reihenfolge)

1. **Mediation** über AdMob-Bidding (AppLovin, Meta Audience Network, Unity, Liftoff): typischerweise deutlich höhere eCPM. Braucht die Adapter-Pakete und deren SKAdNetwork-IDs in `app.config.ts`.
2. **Einwilligungstexte testen** (UMP-Mitteilung, IDFA-Erklärung): mehr Zustimmung bedeutet ein Vielfaches an eCPM.
3. **A/B-Test der Frequenz:** jede 2. gegen jede 3. Pause, Leitplanke D7.
4. **Weitere Rewarded-Plätze**, sobald Bits echte Senken haben (Bolt-Skins, Spur-Effekte): „Bits verdoppeln“ nach einer richtigen Antwort.
5. **Android** (der Code ist plattformneutral) und **weitere Sprachen** (in Arbeit): mehr Reichweite, außerhalb von DACH teils deutlich höhere eCPM.
6. `AD_POLICY` aus einer Server-Konfiguration lesen, damit Tests ohne Update laufen.
