# Progress

## Stand (Prototyp 0.1, Phase 0–2 des Konzepts)

Spielbar in Expo Go (Mock-Daten):

- **Spielkern** (`packages/shared`, 27 Tests): vier Sektoren, Hauptsektor + Nebengewichte, organisches Layout mit ungleichen Abständen, Vertiefung/Brücke-Wachstum, Schwierigkeit (Elo), Interessen-Bandit mit 20 % „Weitblick“, Spaced Repetition für beschädigte Knoten, Belohnungen/Streak, Werbe- und Gem-Regeln, 31 Mock-Fragen mit Fragmenten, Ködern und Fairnessregel (Schlüsselfragmente immer im Feld).
- **App**: Onboarding (Story, Name, Altersabfrage, Werbe-Einwilligung nur ab 16), Netzkarte (Skia, Pan/Zoom, Parallax-Ebenen, 2,5D-Schatten, Sektor-Szenerie, die vom Chip-Look zu Wald/Archiv/Molekülen/Noten übergeht), Knoten-Ablauf (Intro → Trümmerfeld sammeln → Cache → Frage → Auflösung; Fragetypen Auswahl/Schätzfrage/Reihenfolge; Rückspulen gegen Energie), Codex, Shop (Gems für Bereiche, Trümmerfelder; Mock-Käufe; Farben für Bits), Profil mit Wissens-Fußabdruck, Reparatur-Läufe.
- **Figuren**: Bolt (Skia-gezeichnet, Stimmungen), MORPH (Rauschen-Gesicht).
- **Werbung**: Mock-Overlay. Rewarded nach falscher Antwort (zweite Chance + Hinweis), Interstitial höchstens jede 3. Fehlantwort, mind. 3 min Abstand, nur ab 16, nie in Sammel-/Fragephase.

## Verifiziert

`pnpm typecheck`, `pnpm test`, `expo export --platform android` (Bundle baut). **Nicht** auf Gerät/Simulator gelaufen: Optik, Gesten und Haptik sind ungeprüft.

## Offen / nächste Schritte

1. Auf dem Handy testen (Expo Go), Optik/Performance nachjustieren (Parallax, Dekor-Menge).
2. Tages-Puls, Boss-Firewalls, Duelle/Koop, Events (Konzept 6.3/6.4).
3. Gemini-Pipeline (Provider-Interface `ContentProvider`), Prüfer-Durchlauf, Pool, Meldefunktion; Interessenmodell serverseitig.
4. Development Build: echte AdMob-/Kauf-Provider, UMP-Einwilligung, Firebase.
5. Englisch, Barrierefreiheit-Feinschliff, Sounds, illustrierte Assets für Bolt/MORPH/Hüter.
6. Mehr Fragen (Pool wächst mit Gemini), derzeit enden die Pfade nach ~31 Knoten.
