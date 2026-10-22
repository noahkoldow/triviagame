# Decisions

- **D1 Expo Go first.** Skia, Reanimated und `PanResponder` laufen in Expo Go; AdMob, IAP und natives Firebase nicht. Darum Provider-Interfaces mit Mock als Standard; echte Provider erst im Development Build.
- **D2 Karte ohne Gesture-Handler.** Pan/Pinch über `PanResponder` (robust bei Gesture-Handler v3-API-Umbruch). Tippen = Hit-Test in Weltkoordinaten.
- **D3 2,5D statt 3D-Engine.** Parallax-Ebenen (fern/mittel/nah), weiche Schatten und Tiefenwert `z` pro Knoten. Knoten selbst bleiben in einer Ebene, damit Kanten exakt anliegen.
- **D4 Organische Sektoren.** Jede Frage hat einen Hauptsektor; Nebengewichte biegen nur den Winkel leicht und färben den Ring (kein Mittelplatzieren). Position = Elternrichtung + Streuung + Abstoßung, deterministisch per Seed.
- **D5 Alter und Werbung.** Alterstor per Geburtsjahr; unter 16: nur freiwillige, nicht personalisierte Rewarded-Videos, keine Interstitials. Ab 16: Interstitial max. jede 3. Fehlantwort, ≥ 3 min Abstand; Personalisierung nur mit Zustimmung (später UMP).
- **D6 Falsche Antwort ist kein Game Over.** Knoten bleibt offen, neue Variante; ≥ 3 Versuche → Knoten wird „beschädigt“ (wächst trotzdem) und kehrt per Leitner-SRS als Reparatur zurück. Integrität 0 halbiert Belohnungen statt zu blocken.
- **D7 Gems kaufbar, aber erspielbar.** Gems öffnen Bereiche (erster je Sektor frei) und Trümmerfelder; kein Vorteil bei Antworten.
- **D8 Fairnessregel Fragmente.** Schlüsselfragmente sind immer im Trümmerfeld und passen in den Cache (getestet für alle Mock-Fragen).
