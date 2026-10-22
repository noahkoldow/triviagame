# Apple App Store: Stand der Vorbereitung

Was im Code erledigt ist, und was noch von dir kommen muss. Gebaut für die App Store Review Guidelines und die Human Interface Guidelines; geprüft habe ich nichts gegen Apple selbst.

## Im Code erledigt

| Thema | Umsetzung |
|---|---|
| Kaufen (3.1.1) | Gems und „Werbefrei“ laufen über das `PurchaseProvider`-Interface, gedacht für StoreKit/RevenueCat. **„Käufe wiederherstellen“** ist im Shop. Gems lassen sich auch erspielen. |
| Datenschutz (5.1) | Bildschirm „Datenschutz & Info“ (`app/privacy.tsx`), erreichbar im Onboarding und im Profil. „Spielstand zurücksetzen“ löscht alle lokalen Daten. Es gibt kein Konto und keine Datenübertragung. |
| Kinder und Werbung | Altersabfrage per Geburtsjahr. Unter 16: nur freiwillige, nicht personalisierte Videos, keine Zwangswerbung. Personalisierung nur ab 16 und nur mit Zustimmung (Voreinstellung aus). |
| Platzhalter (2.1) | Test-Hinweise („Testwerbung“, „Käufe simuliert“) erscheinen nur im Prototyp (Expo Go), nie in einem Store-Build (`src/config.ts`). |
| Export-Compliance | `ITSAppUsesNonExemptEncryption: false` in `app.json`. |
| Privacy Manifest | `NSPrivacyAccessedAPITypes` für UserDefaults (AsyncStorage) in `app.json`. |
| Bedienung (HIG) | Tippflächen mindestens 44 pt (Buttons, Dock, Cache-Plätze, Schließen-Knöpfe über `hitSlop`). Safe Areas beachtet. Keine eigenen Wisch-Gesten, die System-Gesten stören. |
| Dynamic Type | Texte skalieren mit der Systemschrift, begrenzt (`maxFontSizeMultiplier` 1,3 bis 1,5) damit Leisten nicht brechen. |
| Bewegung reduzieren | Bei aktivierter Einstellung stehen Puls, Rauschen und die Intro-Szene still. |
| Blitzen | Alle Animationen wechseln höchstens dreimal pro Sekunde. |
| VoiceOver | Die Karte ist ein Bild und für Screenreader nicht lesbar. Dafür gibt es die **Knotenliste** (Dock → „Knoten“) mit denselben Aktionen. Buttons und Eingaben haben Beschriftungen. |

## Noch offen (braucht dich oder echte Dienste)

- **Apple Developer Account** und App-Eintrag; Bundle-ID `app.nexus.game` prüfen.
- **App-Symbol** 1024×1024 (ohne Transparenz) und Splash, Screenshots, Beschreibung. Aktuell gibt es keine Symbol-Datei.
- **Datenschutzerklärung als öffentliche URL** (Pflicht). Trage sie in `src/config.ts` ein (`PRIVACY_URL`, `SUPPORT_EMAIL`). Der Text in `app/privacy.tsx` ist ein Entwurf und sollte rechtlich geprüft werden.
- **App Privacy („Nährwertetikett“)** in App Store Connect ausfüllen. Mit echter Werbung kommen Werbe-Kennung, Nutzungsdaten und Geräteinformationen hinzu.
- **Echte Anbieter** im Development Build: StoreKit-Käufe, AdMob mit UMP-Einwilligung, ATT-Abfrage (`expo-tracking-transparency`, nur für personalisierte Werbung ab 16, mit `NSUserTrackingUsageDescription`). Die Mocks sind nur für Expo Go.
- **Altersfreigabe** festlegen (Werbung, KI-Inhalte). Nicht in die Kategorie „Kinder“ einreichen: dort sind Drittanbieter-Werbung und Tracking verboten.
- **KI-Inhalte (1.2)**: vor der Gemini-Anbindung eine **Meldefunktion** für falsche oder unpassende Fragen und eine Prüfung der Inhalte einbauen.
- **Hinweise für den Review**: kurze Anleitung, wie man das Spiel startet und was die Käufe tun.
- **Barrierefreiheit**: Kontraste und VoiceOver auf einem echten Gerät durchgehen. Das habe ich nicht getestet.
