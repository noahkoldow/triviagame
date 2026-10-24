# Übergabe an Codex: Was bis zum App-Store-Launch fehlt

Ziel: **NEXUS 1.0 im iOS App Store**, zuerst im DACH-Raum auf Deutsch. Stand: 24.10.2026.

Fertig sind Spiellogik, Plot, offenes Ende, Wochenliga, die neue Sektor-Gliederung und die Charakter-Assets (siehe §1). Es fehlt das Gerüst für einen echten Store-Build: Deploy und Härtung des Backends, echte Käufe und Werbung, Meldefunktion, Recht und der Store-Eintrag.

Aufgaben mit 👤 brauchen einen Menschen (Konto, Geld, Rechtstext, Gerät). Bereite dafür Code und Doku vor, markiere Platzhalter deutlich und trage den menschlichen Schritt in `docs/LAUNCH_CHECKLIST.md` ein (neu anlegen). **Nichts erfinden:** keine IDs, Preise, Firmendaten oder Rechtstexte als endgültig ausgeben.

## 0. So arbeitest du hier

1. Lies zuerst `CLAUDE.md`, dann `docs/CONCEPT.md`, `docs/PROGRESS.md`, `docs/DECISIONS.md` (bis D47), `docs/DIRECTION.md`, `docs/ASSETS.md`, `docs/DESIGN_REVIEW.md`, `docs/FIREBASE.md`, `docs/AI.md` und `docs/APPLE.md`.
2. Regeln aus `CLAUDE.md`, die hier besonders zählen:
   - Spielregeln nur als reine Funktionen in `packages/shared`, mit Vitest-Tests. Die UI hält keine Regeln.
   - Jeder externe Dienst (Käufe, Werbung, App Check, Crash-Reporting) liegt hinter einem Provider-Interface mit Mock als Standard. **Expo Go muss im Standardpfad weiterlaufen.** Native Module also nur laden, wenn `IS_PROTOTYPE` (`apps/mobile/src/config.ts`) falsch ist, und zwar per dynamischem `require` hinter einem Try. Der Provider wird in `apps/mobile/app/_layout.tsx` gesetzt.
   - Keine Secrets im Code, keine festen Gemini-Modellnamen. **Die App sendet nie einen Prompt** (D45).
   - UI-Texte auf Deutsch, zentral in `apps/mobile/src/strings.ts` oder nah am Screen.
   - Vor jedem Commit `pnpm typecheck && pnpm test` (prüft shared, functions und mobile). Conventional Commits, eine Aufgabe pro Commit.
3. Nicht ohne neue Entscheidung in `DECISIONS.md` ändern: Story-System (D36–D38), die Regeln D39–D42, die Taxonomie D44, das Content-API D45, das offene Ende D46 und die Liga D47. Der Test in `packages/shared/src/story.test.ts` spielt die Geschichte bis nach dem Finale durch; er muss grün bleiben.
4. Das Backend ist ein pnpm-Paket (`functions/`). `pnpm --filter @nexus/functions build` bündelt `packages/shared` per esbuild nach `functions/lib/index.js`. Abhängigkeiten liegen gehoistet im Root (`node-linker=hoisted`).

## 1. Was schon steht (nicht neu bauen)

- Kernschleife, Netzwachstum, Außenposten, Firewalls, sechs Fragetypen, Cache-Explorer, Energie, Integrität, Leitner-Reparaturen, Interessen-Bandit, Wissens-Fußabdruck.
- **Sektoren** (D44): vier Sektoren mit je drei Bereichen und Themenbeschreibung für die KI, 61 eingebaute Fragen, Migration alter Spielstände.
- **Plot** (`story.ts`): fünf Kapitel mit Zielleiste, 18 Story-Momente, Logbuch im Codex, vier Hüter, Finale gegen MORPH (`/boss/core`), danach endlose Meilensteine.
- **Offenes Ende** (D46): Nachschub je Bereich (`refillPool`), wartende Zweige wachsen nach (`growWaitingNodes`).
- **Content-API ohne offenen Proxy** (D45): Function `questions` mit gemeinsamem geprüftem Pool. **Im Code fertig, noch nicht deployed** (siehe P0.1).
- **Wochenliga** (D47): Function `league`, Bildschirm `app/league.tsx`, erzeugte Rufnamen, Austreten löscht.
- **Kein Softlock** bei Integrität 0 (D39), Reparaturen zählen nur bei Fälligkeit (D40), **Knotenliste** für VoiceOver.
- **Assets** (`docs/ASSETS.md`): App-Symbol (iOS ohne Alpha), adaptives Android-Symbol, Splash, Hüter-Porträts, fünf MORPH-Formen, acht Bolt-Stimmungen.

## 2. Entscheidungen vorab 👤

Frag den Auftraggeber, bevor du die blockierten Aufgaben baust. Bis zur Antwort gilt jeweils die Empfehlung.

| # | Frage | Empfehlung der Regie | blockiert |
|---|---|---|---|
| E1 | Name im Store (max. 30 Zeichen; „Nexus“ allein ist vergeben) | „NEXUS – Wissensnetz“ | P1.1, P6.2 |
| E2 | Bundle-ID `app.nexus.game` behalten? Sie sollte zu einer eigenen Domain passen | eigene, z. B. `de.<nachname>.nexus` | P1.1 |
| E3 | Zielgruppe und Altersfreigabe | 12+, Jugendliche ab 12 erlaubt; unter 16 gelten die Regeln aus D5 | P2.2, P6.4 |
| E4 | Werbung in 1.0? | **nur freiwillige Rewarded-Videos, keine Interstitials** in 1.0. Zwangswerbung nach Fehlern bestraft Lernen; nach dem Start messen | P2.2 |
| E5 | Kauf-Anbieter | RevenueCat (`react-native-purchases`, Expo-Config-Plugin) | P2.1 |
| E6 | Länder und Sprache | DACH, nur Deutsch; Englisch in 1.1 | P6 |
| E7 | Tagesbudget der KI (`AI_DAILY_CALL_LIMIT`, heute 100 ≈ 75 neue Fragen/Tag) | für den Start 1.000 und Budget-Alarm (P0.3) | P0.1, P3.1 |

## 3. Aufgaben in Reihenfolge

### P0 Backend live und gehärtet (zuerst)

**P0.1 Deployen und prüfen** 👤 (der Deploy braucht die Freigabe des Auftraggebers).
- `pnpm firebase:deploy`; die Frage, ob die alte Function `gemini` gelöscht werden soll, mit Ja beantworten. Erst danach ist der offene Proxy weg.
- Prüfen mit `curl`, festgehalten in `docs/FIREBASE.md`:
  - `POST /gemini` gibt 404.
  - `POST /questions` mit `{"task":"generate","prompt":"…"}` gibt 400.
  - `POST /questions` mit `{"area":"physics","difficulty":1,"count":1,"have":[]}` gibt Fragen zurück, die `acceptServed` besteht.
  - Liga: `join` mit einem Rufnamen aus `aliasOptions`, dann `sync`, dann `leave`.
- TTL-Regeln aus `firestore.indexes.json` sind aktiv (Firebase-Konsole → Firestore → TTL).

**P0.2 Firebase App Check.** Die Endpunkte sind öffentlich; wer viele IPs hat, kann das Tagesbudget für neue Fragen leeren (der Pool bleibt nutzbar).
- In Dev- und Store-Build `@react-native-firebase/app-check` mit App Attest (iOS) als Provider. In Expo Go wird kein Token gesendet.
- Die Functions prüfen `X-Firebase-AppCheck` mit dem Admin SDK. Schalter `APPCHECK_ENFORCE`: erst protokollieren, nach dem Store-Release erzwingen.
- Erzeugung (`gen`) nur noch mit gültigem Token erlauben; Ausliefern aus dem Pool darf ohne Token weiterlaufen, damit Expo Go spielbar bleibt.

**P0.3 Budget-Alarm** 👤: ein Budget mit E-Mail-Alarm auf dem Cloud-Billing-Konto; Klickschritte in `docs/FIREBASE.md`.

### P1 Build und Identität

**P1.1 Store-Profil.** In `apps/mobile/eas.json` ein Profil `production` (`channel: "production"`, `autoIncrement: true`, `environment: "production"`) anlegen, dazu `submit.production.ios` mit Platzhaltern für `ascAppId` und `appleTeamId` 👤. In `app.json` `version` auf `1.0.0` setzen, Name und Bundle-ID nach E1/E2. Der GitHub-Workflow veröffentlicht weiter nur `preview`.
**P1.2 Prüfen:** `npx expo-doctor` ohne Fehler (Hinweis: `react-dom` 19.3.1 erwartet `react` ^19.3.1, das Projekt hat 19.3.0).
**P1.3 Development Build** für iOS (`eas build --profile development --platform ios`) als Basis für P0.2 und P2 👤 (Apple-Konto).
- Abnahme: `eas build --profile production --platform ios` läuft durch.

### P2 Echte Dienste (nur im Dev- und Store-Build; Expo Go behält die Mocks)

**P2.1 Käufe** (`apps/mobile/src/services/purchases.ts`). RevenueCat-Provider mit `gems_50`, `gems_150`, `gems_400` (Verbrauchsgut) und `adfree` (nicht verbrauchbar), angelegt in App Store Connect 👤.
- Preise kommen lokalisiert aus StoreKit statt aus `PRODUCTS[].price`.
- Gutschrift erst nach bestätigter Transaktion, nie doppelt: Transaktions-IDs merken. Die Gutschriftsregel ist rein und kommt nach shared, mit Test.
- `restore()` stellt „Werbefrei“ wieder her.
- Abnahme: Sandbox-Kauf und Wiederherstellen auf einem Gerät; Expo Go zeigt weiter den Mock und den Hinweis „Testmodus“.

**P2.2 Werbung** (nach E4). `react-native-google-mobile-ads` als `AdProvider` (`src/services/ads.ts`).
- Vor der ersten Anzeige die UMP-Einwilligung einholen. Die ATT-Abfrage (`expo-tracking-transparency`, `NSUserTrackingUsageDescription` auf Deutsch) kommt nur ab 16 und nur, wenn personalisiert werden soll.
- `SKAdNetworkItems` eintragen; `app-ads.txt` auf der Entwickler-Website 👤.
- Test-Anzeigen-IDs im Dev-Build, echte IDs als EAS-Umgebungsvariable 👤.
- `decideAds` in `packages/shared/src/monetization.ts` bleibt die einzige Regelquelle. Wenn E4 = nur Rewarded gilt, eine Konfiguration `interstitials: false` dort einführen und testen.

**P2.3 Einstellungen** (`apps/mobile/app/settings.tsx`, Konzept §9.7).
- Werbe-Einwilligung jederzeit ändern (UMP-„Privacy Options“). Heute geht das nur durch Zurücksetzen des Spielstands. Nach DSGVO muss der Widerruf so leicht sein wie die Zustimmung.
- Dazu: Ton an/aus, Haptik an/aus, Liga verlassen, Spielstand löschen, Links zu Datenschutz, Impressum und Support.
- Erreichbar aus dem Profil.

### P3 Inhalte und KI-Qualität

**P3.1 Pool vorfüllen.** Damit die ersten Spieler nicht auf die Erzeugung warten: eine geplante Function (`onSchedule`, nachts) füllt jeden Bereich bis 25 geprüfte Fragen (300), gleichmäßig über Schwierigkeit 1 bis 5 und die sechs Typen, im Rahmen des Tagesbudgets. Wiederverwenden: `nextQuestionType`, `avoidTopicsOf`, `generateQuestions` und das Speichern aus `questions`.
- Generierte Fragen bekommen bisher keine `deepen`- und `bridge`-Kandidaten; die App greift dann auf Bereich und Schwierigkeit zurück. Optional: Kandidaten aus dem Pool desselben bzw. benachbarter Bereiche (`areaDistance`) beim Speichern eintragen.
- Stichprobe von 40 Fragen von Hand prüfen 👤: Fehlerquote unter 2 % (Abnahme aus Konzept Phase 4).

**P3.2 Meldefunktion** (App Review 1.2; in `APPLE.md` offen).
- Button „Frage melden“ in den Ergebnis-Screens (`app/node/[id].tsx`, `app/boss/[id].tsx`) mit Grund: falsch, unklar oder unpassend.
- Neue Function `report` (gleiches Muster und Rate-Limit wie `questions`) zählt `reports` in `questions/{id}`. Ab 3 Meldungen `status: 'blocked'` und `blocked: true` im `poolIndex` (`choosePoolEntries` beachtet das schon).
- Lokal wird die Frage sofort gesperrt: reine Funktion `blockQuestion` in shared, mit Test. Ein offener Knoten mit dieser Frage bekommt eine Ersatzfrage, ein gelöster bleibt gelöst.

**P3.3 Quellen im Codex.** Artikel haben `source`; zeige sie im Codex und im Cache-Explorer an (Konzept 7.2).

### P4 Recht und Datenschutz (Texte prüft ein Mensch 👤)

**P4.1** Datenschutzerklärung und Impressum als statische Seiten auf Firebase Hosting (`hosting/public/datenschutz.html`, `impressum.html`), deutlich als Entwurf markiert. `PRIVACY_URL` und `SUPPORT_EMAIL` in `src/config.ts` füllen.
**P4.2** `docs/APPLE.md` richtigstellen: Dort steht noch „keine Datenübertragung“. `app/privacy.tsx` ist schon angepasst (Fragen-Nachschub, Wochenliga, KI).
**P4.3** Entwurf der App-Privacy-Angaben (App Store Connect) in `docs/LAUNCH_CHECKLIST.md`: je Dienst, welche Daten, ob mit der Person verknüpft, ob Tracking.
- Liga: zufällige Kennung, Rufname, Wochen-XP, nicht mit der Identität verknüpft.
- Fragen-API: IP-Adresse nur pseudonymisiert für Rate-Limits.
- Dazu Werbung und Crash-Reporting, falls aktiv.
**P4.4** EU-Händlerstatus (DSA) in App Store Connect angeben 👤.
**P4.5** Konto-Löschung (Guideline 5.1.1(v)): Die Liga ist eine Art Konto. „Aus der Liga austreten“ und „Spielstand zurücksetzen“ löschen den Server-Eintrag; in den Prüfhinweisen erwähnen.

### P5 Qualität

**P5.1 Gerätetest** 👤 + Codex. Laut `PROGRESS.md` sind Optik, Gesten und Performance der Karte nie auf einem Gerät gelaufen.
- Auf einem älteren iPhone (SE- oder 12-Klasse) Bildrate und Speicher messen.
- Bei Bedarf eine Qualitätsstufe einbauen (weniger Objekte in `propAtlas.ts`, ein Nebelband statt zwei in `hexmap.ts`).

**P5.2 Speicher.** Der lokale Fragen-Cache (`nexus:ai-pool:v1` in AsyncStorage) wächst im offenen Spiel unbegrenzt. Ab etwa 500 Fragen auf eine Datei (`expo-file-system`) oder SQLite umziehen. Gelöste Fragen, die nur noch im Codex gebraucht werden, auf Fragmente reduzieren.
**P5.3 Design-Review abarbeiten:** `docs/DESIGN_REVIEW.md`, von oben nach unten. Kritisch sind richtig/falsch nur über Farbe und die Dynamic-Type-Grenzen.
**P5.4 VoiceOver-Durchgang** auf dem Gerät: Knotenliste, Story-Dialoge, Liga und alle sechs Fragetypen. Zuordnen und Reihenfolge müssen ohne Ziehen bedienbar sein.
**P5.5 Crash-Reporting:** Sentry (`@sentry/react-native` mit Expo-Plugin) als Provider, nur im Store-Build aktiv; in die App-Privacy-Angaben aufnehmen.
**P5.6 Klang** (ASSETS.md §5) mit `expo-audio`, Stummschalter aus P2.3. Nur CC0 oder eigene Aufnahmen; jede Datei mit Quelle in `docs/CREDITS.md`.
**P5.7 Rauchtest:** ein Maestro-Flow gegen den Dev-Build: Onboarding → erster Knoten → richtige Antwort → Story-Dialog „Die erste Bahn“ → Codex-Logbuch zeigt `KERN_001.LOG` → Liga-Bildschirm öffnet.

### P6 Store-Eintrag und Einreichung

**P6.1 Screenshots** in 6,9″ (1320×2868), die fünf Motive aus ASSETS.md §4 plus die Wochenliga, automatisiert mit Maestro im Simulator. Für ansehnliche Karten einen Demo-Spielstand laden, der nur unter `__DEV__` erreichbar ist.
**P6.2 Texte** (de-DE) über EAS Metadata (`store.config.json`, `eas metadata:push`): Name, Untertitel (30 Zeichen), Schlüsselwörter (100), Beschreibung, Werbetext, Support-URL, Kategorie Spiele › Quiz, Zweitkategorie Bildung. Die vier Sektoren und das offene Lernen nennen, die Geschichte nur anreißen.
**P6.3 Hinweise für die Prüfung:** kein Login nötig, was Gems und „Werbefrei“ tun, Käufe in der Sandbox, die Liga ist freiwillig und löschbar. Wie man Firewalls und Finale erreicht, wird beschrieben; eine Abkürzung im Store-Build gibt es nicht.
**P6.4 Altersfreigabe-Fragebogen** als Entwurf (nach E3): Werbung ja, keine Gewalt, KI-erzeugte Inhalte mit Meldefunktion, keine freie Nutzerkommunikation (Rufnamen sind erzeugt), kein offener Web-Zugang.
**P6.5** TestFlight intern, dann extern, dann einreichen 👤.

## 4. Bewusst nach 1.0

Tages-Puls mit MORPH als Gastgeber (DIRECTION.md §6), Wochen-Events, Belohnungen für Liga-Aufstiege und Freundes-Ligen, Duelle und Koop, Englisch, Bolt-Skins und weitere Bit-Senken, Glitches auf Ordnern, iPad-Layout (`supportsTablet: false` bleibt; die App muss im iPad-Kompatibilitätsmodus trotzdem ohne Fehler laufen, weil Apple dort mitprüft).

## 5. Fertig heißt

- [ ] E1–E7 entschieden, `LAUNCH_CHECKLIST.md` vollständig, alle 👤-Schritte abgehakt
- [ ] `questions` und `league` deployed, `gemini` gelöscht, App Check erzwungen, Budget-Alarm aktiv
- [ ] Pool vorgefüllt (≥ 25 je Bereich), Stichprobe < 2 % Fehler, Meldefunktion mit serverseitigem Sperren
- [ ] Käufe, Wiederherstellen, Einwilligung und (falls E4) Werbung laufen im TestFlight-Build; Expo Go läuft weiter mit Mocks
- [ ] Einstellungen, Datenschutz-URL, Impressum, korrigierte `APPLE.md`
- [ ] Gerätetest bestanden, VoiceOver-Durchgang ohne Blocker, kritische Punkte aus dem Design-Review erledigt
- [ ] Screenshots, Texte, Prüfhinweise, Altersfreigabe hochgeladen
- [ ] `pnpm typecheck && pnpm test` grün, `npx expo-doctor` ohne Fehler, `PROGRESS.md` und `DECISIONS.md` nachgeführt
