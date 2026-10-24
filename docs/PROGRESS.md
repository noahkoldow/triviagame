# Progress

## Stand (Prototyp 0.1, Phase 0–2 des Konzepts)

Spielbar in Expo Go (Mock-Daten):

- **Spielkern** (`packages/shared`, 27 Tests): vier Sektoren, Hauptsektor + Nebengewichte, organisches Layout mit ungleichen Abständen, Vertiefung/Brücke-Wachstum, Schwierigkeit (Elo), Interessen-Bandit mit 20 % „Weitblick“, Spaced Repetition für beschädigte Knoten, Belohnungen/Streak, Werbe- und Gem-Regeln, 31 Mock-Fragen mit Fragmenten, Ködern und Fairnessregel (Schlüsselfragmente immer im Feld).
- **App**: Onboarding (Story, Name, Altersabfrage, Werbe-Einwilligung nur ab 16), Netzkarte (Skia, Pan/Zoom, Parallax-Ebenen, 2,5D-Schatten, Sektor-Szenerie, die vom Chip-Look zu Wald/Archiv/Molekülen/Noten übergeht), Knoten-Ablauf (Intro → Trümmerfeld sammeln → Cache → Frage → Auflösung; Fragetypen Auswahl/Schätzfrage/Reihenfolge; Rückspulen gegen Energie), Codex, Shop (Gems für Bereiche, Trümmerfelder; Mock-Käufe; Farben für Bits), Profil mit Wissens-Fußabdruck, Reparatur-Läufe.
- **Figuren**: Bolt (Skia-gezeichnet, Stimmungen), MORPH (Rauschen-Gesicht).
- **Werbung**: Mock-Overlay. Rewarded nach falscher Antwort (zweite Chance + Hinweis), Interstitial höchstens jede 3. Fehlantwort, mind. 3 min Abstand, nur ab 16, nie in Sammel-/Fragephase.

## Prototyp 0.2 (Karte)

- Geneigte 3D-Karte (Perspektive, Billboards), Nebel der Erkundung, Szenerie pro Gebiet, Vorschau-Strang (siehe D9–D13).
- Trümmerfeld direkt auf der Karte; globaler Cache mit 4 Plätzen, nur per ⚡ in der Frage lesbar.
- Neues Karten-UI (HUD, Cache-Leiste, Dock). Interessen-Signal (`chooseNode`) ist jetzt verdrahtet.
- **Ungeprüft auf Gerät:** Optik der Neigung, Nebel-Performance, Hit-Tests, Gesten.

## Prototyp 0.3 (Hexagon-Chip-Karte)

- Karte jetzt aus kleinen Hexagon-Kacheln im Chip-Look (D15); deutlich weniger Zeichenaufwand als die Perspektiv-Insel (D9–D14).
- UI bleibt im Duolingo-Stil (dicke Kanten, kräftige Farben).
- **Ungeprüft auf Gerät:** Performance und Optik der Karte.

## Prototyp 0.4 (Folgen und Außenposten)

- Cache mit echter Entscheidung, Stichwort statt Frage, Folgen bei Fehlern (D17), gestörte Außenposten (D16).
- **Ungeprüft auf Gerät.** Strang-Vorschau ist standardmäßig aus (Prop `showStrand` in NetMap).

## Prototyp 0.5 (Firebase und Gemini)

- Neues Firebase-Projekt `nexus-trivia-prod-20261024`; Firestore-Standarddatenbank in `europe-west3`, Regeln deployed und Clientzugriffe gesperrt.
- Gemini-HTTP-Function (Node 22, Region `europe-west3`) mit Secret-Manager-Integration, konfigurierbarem Modell, Kill-Switch und Firestore-Tageslimit.
- App fragt beim Start höchstens eine KI-Frage pro Tag an. Shared-Validator und zweiter Gemini-Prüfer müssen sie annehmen; angenommene Fragen werden lokal gespeichert und zum Spielpool ergänzt.
- **Noch nicht live bereitgestellt:** Cloud-Billing, Gemini-API-Schlüssel und Function-Deploy fehlen. Einrichtung: `docs/FIREBASE.md`.

## Verifiziert

`pnpm typecheck`, `pnpm test`, `expo export --platform android` (Bundle baut). **Nicht** auf Gerät/Simulator gelaufen: Optik, Gesten und Haptik sind ungeprüft.

## Offen / nächste Schritte

1. Auf dem Handy testen (Expo Go), Optik/Performance nachjustieren (Parallax, Dekor-Menge).
2. Tages-Puls, Boss-Firewalls, Duelle/Koop, Events (Konzept 6.3/6.4).
3. Cloud-Billing verknüpfen, Gemini-Schlüssel setzen und Function bereitstellen; danach KI-Anfragen auf Gerät prüfen.
4. Gemeinsamen geprüften Firestore-Fragenpool, App Check, Auth, Meldefunktion und serverseitiges Interessenmodell aufbauen.
5. Development Build: echte AdMob-/Kauf-Provider und UMP-Einwilligung.
6. Englisch, Barrierefreiheit-Feinschliff, Sounds, illustrierte Assets für Bolt/MORPH/Hüter.
7. Mehr Fragen (Pool wächst mit Gemini), derzeit enden die Pfade nach ~31 Knoten.
