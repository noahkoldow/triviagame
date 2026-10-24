# Codex: Einreichung von NEXUS 1.0 im App Store

Geprüfter Stand: **24.10.2026**, Commit `471d042` plus nicht committete Sprach-Änderungen im Arbeitsbaum. Ziel: NEXUS 1.0 im iOS App Store, zuerst DACH.

**Verhältnis zu `CODEX_HANDOFF.md`:** Dieses Dokument hält den geprüften Ist-Stand und die verbindliche Reihenfolge fest. Viele Aufgaben sind in der Handoff-Datei ausführlicher beschrieben; Verweise wie „→ H P2.1“ zeigen dorthin. **Wo sich beide widersprechen, gilt dieses Dokument.**

## 0. Befund

Geprüft mit `pnpm typecheck`, `npx expo-doctor`, HTTP-Proben gegen das Live-Backend und durch Lesen des Codes.

| # | Bereich | Ist-Stand | Beleg | Schwere |
|---|---|---|---|---|
| B1 | Backend | Die alte Function `gemini` (offener Proxy, nimmt freie Prompts an) ist **noch live**. `questions` und `league` sind **nicht deployed**. Die App ruft beide auf und bekommt 404: kein Fragen-Nachschub, keine Liga. | GET am 24.10.: `/gemini` → 405 (existiert), `/questions` → 404, `/league` → 404 | Blocker, Kostenrisiko |
| B2 | Repo | `pnpm typecheck` ist rot, weil die Sprach-Umstellung (de/en/fr/es) im Arbeitsbaum unfertig ist: `localize.ts` importiert `./i18n/content.{en,fr,es}`, die es nicht gibt; `lang` fehlt in `ai.test.ts`, `serve.test.ts`, `questiontypes.test.ts:80` und `functions/src/index.ts:178`. | `pnpm typecheck` | Blocker |
| B3 | Expo-Konfiguration | `expo-doctor`: `newArchEnabled` ist in SDK 58 kein gültiges Feld mehr in `app.json`. | expo-doctor 19/20 | Blocker (klein) |
| B4 | Build | `eas.json` hat kein `production`-Profil und keinen `submit`-Block. `version` steht auf 0.1.0, die Bundle-ID `app.nexus.game` ist nicht entschieden. | `apps/mobile/eas.json`, `apps/mobile/app.json` | Blocker |
| B5 | Käufe | Nur der Mock (`src/services/purchases.ts`); die Preise stehen fest im Code. | | Blocker |
| B6 | Werbung | Nur das Mock-Overlay. `decideAds` zeigt noch Interstitials. UMP, ATT und SKAdNetwork fehlen. | `packages/shared/src/monetization.ts:34` | Blocker, falls Werbung in 1.0 |
| B7 | Recht | `PRIVACY_URL` und `SUPPORT_EMAIL` sind leer. Es gibt weder Impressum noch Hosting. Datenschutz-URL und Support-URL sind Pflichtfelder in App Store Connect. | `apps/mobile/src/config.ts:19-21` | Blocker |
| B8 | Datenschutztext in der App | Er verspricht eine „vorgesehene“ Meldefunktion und erlaubt den Widerruf der Werbe-Einwilligung nur über „Spielstand zurücksetzen“. | `apps/mobile/app/privacy.tsx` | Blocker (Guideline 5.1.1, DSGVO Art. 7 Abs. 3) |
| B9 | KI-Inhalte | Es gibt keine Meldefunktion: weder Button noch Function `report`. | | Blocker (Risiko unter Guideline 1.2) |
| B10 | Einstellungen | Nur ein Gerüst mit Gehirn-Sequenz und Datenschutz. | `apps/mobile/app/settings.tsx` | hoch |
| B11 | Gerät | Die App lief nie auf einem iPhone oder Simulator. Der iPad-Kompatibilitätsmodus ist ungetestet. | `docs/PROGRESS.md` | Blocker (Guideline 2.1) |
| B12 | Barrierefreiheit | Die kritischen Punkte 1–2 aus `DESIGN_REVIEW.md` sind offen: Richtig/Falsch wird nur über Farbe angezeigt, Dynamic Type ist gedeckelt. | `docs/DESIGN_REVIEW.md` | hoch |
| B13 | Store-Eintrag | Es fehlen Screenshots, `store.config.json`, Prüfhinweise und `docs/LAUNCH_CHECKLIST.md`. | | Blocker |
| B14 | Inhalt | Bis zum Deploy ist der Pool leer; es gibt nur 61 eingebaute Fragen. Der Store-Text verspricht ein offenes Spiel. | | hoch |

**Passt schon, nicht anfassen:**
- App-Symbol ohne Alpha und Splash
- `ITSAppUsesNonExemptEncryption: false` und das Privacy Manifest für UserDefaults
- „Käufe wiederherstellen“
- Testhinweise erscheinen nur in Expo Go
- „Spielstand zurücksetzen“ löscht auch den Liga-Eintrag
- kein Login, also kein „Sign in with Apple“ nötig
- Die App sendet keine Prompts und keine personenbezogenen Daten an die KI. Das erfüllt Guideline 5.1.2(i) (seit 11/2025 nennt sie Dritt-KI ausdrücklich) und soll so bleiben.

## 1. Regeln für dich

- `CLAUDE.md` und Handoff §0 gelten weiter. Spielregeln stehen nur in `packages/shared` und haben Tests. Echte Dienste laufen nur im Dev- und Store-Build; Expo Go behält die Mocks. Native Module lädst du nur, wenn `IS_PROTOTYPE` falsch ist.
- **Keine Secrets und keine erfundenen IDs.** ASC-App-ID, Team-ID, RevenueCat-Schlüssel und AdMob-IDs kommen als EAS-Umgebungsvariable oder als deutlicher Platzhalter `TODO_HUMAN_…`.
- 👤 heißt: Ein Mensch muss handeln, weil es um ein Konto, Geld, einen Vertrag, einen Rechtstext, ein Gerät oder eine Änderung an der Produktion geht. Bereite Code und Doku vor und trage den Schritt mit genauem Klickpfad in `docs/LAUNCH_CHECKLIST.md` ein (neu anlegen). Deploys in die Produktion (Functions, Hosting, `eas update --channel production`) führst du **nur nach ausdrücklicher Freigabe** aus.
- Fremde Arbeit im Arbeitsbaum verwirfst du nicht (kein `git checkout -- .`, kein `git stash drop`).
- Nach jeder Phase:
  1. `pnpm typecheck && pnpm test`
  2. `npx expo-doctor` in `apps/mobile`
  3. `docs/PROGRESS.md` nachführen
  4. Conventional Commit, dann `git push`

## 2. Entscheidungen, bevor du baust

Frag den Auftraggeber. Bis zur Antwort gilt die Empfehlung, aber blockierte Aufgaben baust du nicht.

| # | Frage | Empfehlung | blockiert |
|---|---|---|---|
| E1 | Store-Name (max. 30 Zeichen) | „NEXUS – Wissensnetz“. Vorher die Verfügbarkeit in App Store Connect und Marken bei DPMA/EUIPO prüfen 👤 | 3.2, 8.1 |
| E2 | Bundle-ID. **Sie lässt sich nach dem Anlegen nie mehr ändern.** | eigene Domain rückwärts, z. B. `de.<nachname>.nexus`. Sie muss vor App Check, RevenueCat und dem App-Eintrag feststehen. | 2.3, 3, 4 |
| E3 | Entwicklerkonto als Einzelperson oder Organisation | Einzelperson geht schneller, der Klarname erscheint als Verkäufer. Wer Käufe anbietet, ist EU-Händler nach DSA: **Adresse, Telefon und E-Mail werden im EU-Store öffentlich angezeigt.** Eine Organisation braucht vorher eine D-U-N-S-Nummer. | alles in App Store Connect |
| E4 | Werbung in 1.0? | **Neu: keine Werbung in 1.0** (statt „nur Rewarded“ im Handoff). Das spart AdMob-Konto, UMP-Einwilligung, ATT, SKAdNetwork, `app-ads.txt` samt Website, die Altersabfrage und den Werbeteil im Datenschutz-Etikett. Bei einem DACH-Start bringt Werbung wenig ein. Werbung kommt in 1.1 als „nur Rewarded“ (→ H P2.2). | 4, 5, 8 |
| E5 | Wenn E4 = keine Werbung: Was ersetzt die zweite Chance nach einer falschen Antwort und das Video für 1 Gem? | Die zweite Chance kostet ⚡ wie das Rückspulen; das Video für Gems entfällt. Als **D53** in `DECISIONS.md` festhalten. | 4.2 |
| E6 | Sprachen und Länder in 1.0 | Nur Sprachen ausliefern, die **vollständig** sind: UI, Story, eingebaute Fragen, Server-Fragen, Datenschutz und Store-Text. Sonst die Sprachwahl im Store-Build auf `de` beschränken. Länder: DACH. Mit Englisch weitere EU-Länder möglich, USA erst nach §6. | 1.1, 8.1 |
| E7 | KI-Tagesbudget (`AI_DAILY_CALL_LIMIT`, heute 100) | 1.000 pro Tag plus Budget-Alarm | 2.2 |
| E8 | Altersfreigabe | Apple nutzt seit 2025 die Stufen **4+, 9+, 13+, 16+, 18+**; „12+“ aus dem Handoff gibt es nicht mehr. Den neuen Fragebogen ehrlich beantworten. **Nicht** in die Kategorie „Für Kinder“. | 8.5 |

## 3. Aufgaben in Reihenfolge

### Phase 1: Repo grün (sofort, nur Codex)

**1.1 Sprach-Umstellung abschließen oder auslagern.**
- Was zum Abschluss fehlt:
  - `packages/shared/src/i18n/content.{en,fr,es}.ts`
  - `lang` in den Tests und in `functions/src/index.ts:178`
  - der Systemprompt in `functions/src/index.ts:63`: Er sagt fest „German-language“ und muss der angefragten Sprache folgen.
  - ein Fragen-Pool je Sprache auf dem Server
- Wenn das nicht bis zum Launch fertig wird: die Arbeit auf einen Branch `feat/i18n` committen und `main` sauber halten (E6).

**1.2** In `apps/mobile/app.json` die Zeile `"newArchEnabled": true` entfernen. Die neue Architektur ist in SDK 58 Standard.

**Fertig, wenn:** `pnpm typecheck && pnpm test` grün sind und `npx expo-doctor` 20/20 meldet.

### Phase 2: Backend live (Codex bereitet vor, 👤 gibt frei, möglichst heute)

**2.1 Deploy** (→ H P0.1). Der offene Proxy kostet Geld, solange er läuft.
- `pnpm firebase:deploy`; die Frage, ob `gemini` gelöscht werden soll, mit Ja beantworten.
- Danach mit `curl` prüfen und in `docs/FIREBASE.md` protokollieren:
  - `/gemini` gibt 404.
  - Ein freier Prompt an `/questions` gibt 400.
  - Eine gültige Anfrage an `/questions` gibt Fragen zurück.
  - Liga: `join`, dann `sync`, dann `leave`.

**2.2 Limits.**
- `AI_DAILY_CALL_LIMIT` nach E7 in `functions/.env.nexus-trivia-prod-20261024` setzen.
- `functions/.env.example` mit allen nicht geheimen Parametern anlegen: `GEMINI_MODEL`, `AI_ENABLED`, `AI_DAILY_CALL_LIMIT`, später `APPCHECK_ENFORCE`.
- Die TTL-Regeln in der Konsole kontrollieren.
- Budget-Alarm 👤 (→ H P0.3).

**2.3 App Check** (→ H P0.2): erst nur protokollieren, nach dem Store-Release erzwingen.
- Braucht E2 und die Apple Team ID; App Attest in Firebase registriert ein Mensch 👤.
- Das Ausliefern aus dem Pool läuft ohne Token weiter, damit Expo Go spielbar bleibt.

**2.4 Pool vorfüllen** (→ H P3.1), bevor externe Tester und die App-Prüfung kommen.
- Ziel: mindestens 25 geprüfte Fragen je Bereich, je Sprache aus E6.
- Eine Stichprobe von 40 Fragen prüft ein Mensch 👤.

**Fertig, wenn:** das `curl`-Protokoll in `FIREBASE.md` steht und `/gemini` 404 gibt.

### Phase 3: Build-Grundlage

**3.1 `apps/mobile/eas.json`** (Werte mit `TODO_HUMAN_` trägt ein Mensch ein):
```json
"production": { "channel": "production", "autoIncrement": true, "environment": "production" }
```
```json
"submit": { "production": { "ios": { "ascAppId": "TODO_HUMAN_ASC_APP_ID", "appleTeamId": "TODO_HUMAN_TEAM_ID" } } }
```
- Für den Upload einen App-Store-Connect-API-Schlüssel per `eas credentials` hinterlegen 👤. Er kommt **nicht** ins Repo.

**3.2 `app.json`:**
- `version` auf `"1.0.0"` setzen.
- `ios.bundleIdentifier` nach E2 setzen und `android.package` angleichen.
- `name` bleibt kurz für den Home-Bildschirm („NEXUS“). Der Store-Name kommt aus E1.

**3.3 Xcode-26-Pflicht.** Seit dem 28.04.2026 nimmt App Store Connect nur Builds mit dem iOS-26-SDK an.
- Kein altes `image` in `eas.json` festnageln.
- Im Build-Log prüfen, dass Xcode 26 oder neuer lief.

**3.4 Development Build** für iOS (`eas build --profile development --platform ios`) 👤 (Apple-Konto, Gerät registrieren). Er ist die Grundlage für Phase 4 und 2.3.

**3.5** Der GitHub-Workflow veröffentlicht weiter nur `preview`. Ein Update auf `production` gibt es nur manuell und nur mit Freigabe.

**Fertig, wenn:** `eas build --profile production --platform ios` durchläuft.

### Phase 4: Käufe und Werbung

**4.1 Käufe** (→ H P2.1, RevenueCat). Zusätzlich zum Handoff:
- Vorbedingungen 👤 in App Store Connect:
  - **Paid Apps Agreement**, Bankverbindung und Steuerformulare müssen aktiv sein. Ohne sie funktionieren auch Sandbox-Käufe nicht.
  - Die Produkte anlegen, jedes mit Anzeigename, Beschreibung und Screenshot für die Prüfung.
  - Die ersten Käufe werden **zusammen mit der App-Version** eingereicht.
- Den öffentlichen RevenueCat-SDK-Schlüssel als EAS-Variable übergeben, z. B. `EXPO_PUBLIC_REVENUECAT_IOS_KEY`. Er steht nicht im Code.
- Die Gutschriftsregel (jede Transaktion nur einmal gutschreiben) als reine Funktion in shared, mit Test.
- Bei E4 = keine Werbung: `adfree` **nicht** anlegen und im Shop ausblenden. „Käufe wiederherstellen“ bleibt.

**4.2 Bei E4 = keine Werbung:**
- Einen Schalter `adsEnabled` in die Werberegeln (`decideAds`) aufnehmen und testen: ohne Werbung nie ein Interstitial und nie ein Video-Angebot.
- Die drei Aufrufer folgen ihm:
  - `app/index.tsx:604`
  - `app/node/[id].tsx:169-201`, die zweite Chance nach E5
  - `app/shop.tsx:58-65`, das Video für Gems entfällt
- Die Frage nach dem Geburtsjahr im Onboarding nur stellen, wenn Werbung an ist (Datensparsamkeit). Ohne Antwort gilt `ageGroup: 'minor'`, die sichere Voreinstellung.
- Das Mock-Overlay in Expo Go folgt demselben Schalter.

**4.2 Bei E4 = Rewarded:** → H P2.2 vollständig, dazu der Widerruf in den Einstellungen (5.2).

**Fertig, wenn:** auf einem Gerät ein Sandbox-Kauf und das Wiederherstellen klappen, der Test gegen doppelte Gutschrift grün ist und Expo Go weiter den Mock mit „Testmodus“ zeigt.

### Phase 5: Pflichtfunktionen in der App

**5.1 Meldefunktion** (→ H P3.2): Button in den Ergebnis-Screens, Function `report`, Sperre ab 3 Meldungen, lokale Sperre über `blockQuestion` in shared, mit Test.

**5.2 Einstellungen** (→ H P2.3):
- Ton an/aus, Haptik an/aus
- Liga verlassen, Spielstand löschen
- Links zu Datenschutz, Impressum und Support
- „Käufe wiederherstellen“
- mit Werbung zusätzlich: Einwilligung ändern (UMP „Privacy Options“)

**5.3 Datenschutztext in der App** (`app/privacy.tsx`) an den echten Build anpassen:
- Die Meldefunktion gibt es jetzt (nicht mehr „vorgesehen“).
- Werbung nach E4; ohne Werbung fällt der Abschnitt „Alter und Werbung“ weg.
- RevenueCat und Apple bei den Käufen nennen, App Check nennen.
- Den Impressum-Link ergänzen.
- Inhaltlich deckungsgleich mit der Web-Datenschutzerklärung (6.2).

**5.4** `docs/APPLE.md` richtigstellen (→ H P4.2).

### Phase 6: Recht und Web (Entwürfe, ein Mensch prüft 👤)

**6.1 Firebase Hosting:**
- `hosting/public/` mit `index.html`, `datenschutz.html`, `impressum.html` und `support.html` (Kontakt-E-Mail, FAQ zu Käufen und Liga).
- In `firebase.json` einen `hosting`-Block ergänzen.
- Deployen nur mit Freigabe.
- Danach `PRIVACY_URL` und `SUPPORT_EMAIL` in `src/config.ts` füllen.

**6.2 Datenschutzerklärung (Entwurf):**
- Verantwortlicher als Platzhalter
- Google Cloud/Firebase (Functions und Firestore in `europe-west3`)
- Gemini nur auf dem Server und ohne Personenbezug
- IP-Prüfwert höchstens 2 h
- Liga-Daten
- App Check (App Attest)
- Käufe über Apple und RevenueCat
- gegebenenfalls Crash-Reporting
- Rechtsgrundlagen, Speicherdauer und Rechte
- Deutlich als Entwurf markieren.

**6.3 Impressum nach § 5 DDG** (Entwurf mit Platzhaltern), aus der App in höchstens zwei Schritten erreichbar.

**6.4** 👤:
- die Auftragsverarbeitungs-Bedingungen von Google Cloud und RevenueCat annehmen
- die Texte rechtlich prüfen lassen
- die DSA-Händlerangaben in App Store Connect machen (E3); Apple prüft sie, das dauert einige Tage

### Phase 7: Qualität auf dem Gerät

**7.1 Gerätetest** (→ H P5.1) auf einem älteren iPhone (SE- oder 12-Klasse) und **zusätzlich im iPad-Kompatibilitätsmodus**, weil Apple iPhone-Apps auch auf dem iPad prüft.
- Prüfen: Layout, Safe Areas, Bildrate, Speicher, keine Abstürze.
- Die Testmatrix steht in `LAUNCH_CHECKLIST.md`.

**7.2 Netz-Fehlerfälle:**
- Im Flugmodus und bei 5xx vom Backend läuft das Spiel mit den eingebauten Fragen weiter.
- Die Liga zeigt eine klare Meldung.
- Nirgends bleibt ein Ladekreis ewig stehen.

**7.3** `DESIGN_REVIEW.md` Punkte 1 und 2. Danach 3 bis 5, wenn Zeit bleibt.

**7.4 VoiceOver-Durchgang** (→ H P5.4).

**7.5 Optional:** Crash-Reporting (→ H P5.5; dann auch ins Etikett aufnehmen) und ein Maestro-Rauchtest (→ H P5.7).

### Phase 8: Store-Eintrag

**8.1 `apps/mobile/store.config.json`** (EAS Metadata), de-DE plus die Sprachen aus E6:
- Name (E1), Untertitel (30 Zeichen), Schlüsselwörter (100 Zeichen), Beschreibung, Werbetext
- Support- und Datenschutz-URL, Copyright
- Kategorie Spiele › Quiz, Zweitkategorie Bildung
- In der Beschreibung die vier Sektoren und das offene Lernen nennen. Die Geschichte nur anreißen, die Gehirn-Enthüllung nicht verraten.

**8.2 Screenshots** in 6,9″ (1320×2868), 5–8 Stück, automatisiert mit Maestro im Simulator.
- Ein Demo-Spielstand, der nur unter `__DEV__` erreichbar ist, sorgt für ansehnliche Karten.
- Die Gehirn-Enthüllung nicht zeigen. iPad-Screenshots braucht es nicht (`supportsTablet: false`).

**8.3 Hinweise für die Prüfung** (Entwurf in `LAUNCH_CHECKLIST.md`):
- Es braucht keinen Login.
- So läuft eine Runde: Knoten antippen, Ordner lesen, Frage beantworten.
- Was Gems tun; die Käufe laufen in der Sandbox.
- Die Wochenliga öffnet sich erst nach dem Finale (D51) und ist in der Prüfzeit nicht erreichbar. Danach wird man automatisch eingeordnet (D53). Sagen, dass man jederzeit austreten kann, sie nur erzeugte Rufnamen zeigt und der Eintrag beim Austreten gelöscht wird.
- Server-Fragen schreibt eine KI. Sie werden geprüft und lassen sich melden.

**8.4 App-Datenschutz-Etikett** (Entwurf, → H P4.3), deckungsgleich mit 6.2.
- Bei E4 = keine Werbung: kein Tracking, keine ATT-Abfrage.
- Die Liga zählt als „Gameplay Content“ und Kennung, gedacht für die App-Funktion.
- Käufe nach den Angaben von RevenueCat.

**8.5 Altersfreigabe-Fragebogen** (Entwurf nach E8):
- keine Gewalt, keine freie Kommunikation (Rufnamen sind erzeugt), kein offener Web-Zugang, kein Glücksspiel
- KI-Inhalte mit Meldefunktion
- Käufe ja, Werbung nach E4

**8.6** Die Exportkontrolle ist mit `ITSAppUsesNonExemptEncryption: false` beantwortet; in App Store Connect nur bestätigen.

### Phase 9: TestFlight und Einreichung 👤

**9.1 Bauen und hochladen:**
```sh
eas build -p ios --profile production
eas submit -p ios --profile production
```

**9.2 TestFlight:**
1. Intern testen und die Ergebnisse in `LAUNCH_CHECKLIST.md` festhalten.
2. Dann extern testen. Dafür prüft Apple die Beta; Testbeschreibung und Feedback-Adresse sind nötig.

**9.3 Einreichen:** mit angehängten Käufen und manueller Veröffentlichung.

**9.4 Nach der Freigabe:** App Check erzwingen (2.3), Budget und Meldungen beobachten, `PROGRESS.md` auf 1.0 setzen.

## 4. 👤 Sofort anstoßen (lange Vorlaufzeit)

1. **Backend-Deploy freigeben** (Phase 2). Der offene Proxy ist live.
2. Apple Developer Program (99 USD/Jahr), bei einer Organisation vorher die D-U-N-S-Nummer (E3).
3. In App Store Connect Paid Apps Agreement, Bankverbindung und Steuerformulare.
4. DSA-Händlerangaben (Apple prüft sie).
5. E1–E8 beantworten, vor allem E2 (endgültig) und E4.
6. Domain oder Hosting-URL und eine Support-E-Mail-Adresse.
7. RevenueCat-Konto; den App-Store-Connect-API-Schlüssel in EAS hinterlegen.
8. Ein älteres iPhone für Tests, Zugang zu einem iPad-Simulator.

## 5. Bewusst nach 1.0

→ H §4, dazu Werbung (falls E4 = keine), Crash-Reporting (falls in 1.0 ausgelassen), Klang (→ H P5.6) und das Umziehen des lokalen Fragen-Caches (→ H P5.2).

## 6. Nur bei einem Start außerhalb von EU und DACH

Die USA (Utah, Louisiana; Texas ist rechtlich umstritten) sowie Brasilien, Australien und Singapur haben Altersprüf-Regeln für App Stores. Apple liefert dafür die **Declared Age Range API**. Vor einem Start dort prüfen, ob sie die eigene Altersabfrage ersetzen muss. Für DACH ist das nicht nötig.

## 7. Fertig heißt

- [ ] E1–E8 entschieden; `LAUNCH_CHECKLIST.md` vollständig, alle 👤-Schritte abgehakt
- [ ] `pnpm typecheck && pnpm test` grün, `npx expo-doctor` 20/20, Sprach-Arbeit fertig oder auf eigenem Branch
- [ ] `/gemini` gibt 404; `questions` und `league` sind live und geprüft; Budget-Alarm aktiv; Pool ≥ 25 je Bereich; Stichprobe < 2 % Fehler
- [ ] `production`-Profil baut mit Xcode 26 oder neuer; Version 1.0.0; endgültige Bundle-ID
- [ ] Sandbox-Kauf und Wiederherstellen auf dem Gerät; keine doppelte Gutschrift; Expo Go weiter mit Mocks
- [ ] Werbung nach E4 umgesetzt (aus oder Rewarded mit UMP)
- [ ] Meldefunktion mit Sperre auf dem Server; Einstellungen vollständig; Datenschutztext in der App stimmt mit dem Build überein
- [ ] Datenschutz-, Impressum- und Support-Seiten online und rechtlich geprüft; URLs in `config.ts` und App Store Connect
- [ ] Gerätetest (iPhone und iPad-Kompatibilität), Netz-Fehlerfälle, Design-Review 1–2, VoiceOver ohne Blocker
- [ ] Metadaten, Screenshots, Prüfhinweise, Datenschutz-Etikett, Altersfreigabe, DSA-Angaben und Käufe in App Store Connect
- [ ] TestFlight intern und extern bestanden, eingereicht; App Check nach der Freigabe erzwungen
- [ ] `PROGRESS.md` und `DECISIONS.md` (mindestens D53) nachgeführt
