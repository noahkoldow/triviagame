# Progress

## Stand (Prototyp 0.1, Phase 0–2 des Konzepts)

Spielbar in Expo Go (Mock-Daten):

- **Spielkern** (`packages/shared`, 27 Tests): vier Sektoren, Hauptsektor + Nebengewichte, organisches Layout mit ungleichen Abständen, Vertiefung/Brücke-Wachstum, Schwierigkeit (Elo), Interessen-Bandit mit 20 % „Weitblick“, Spaced Repetition für beschädigte Knoten, Belohnungen/Streak, Werbe- und Gem-Regeln, 31 Mock-Fragen mit Fragmenten, Ködern und Fairnessregel (Schlüsselfragmente immer im Feld).
- **App**: Onboarding (Story, Name, Altersabfrage, Werbe-Einwilligung nur ab 16), Netzkarte (Skia, Pan/Zoom, Parallax-Ebenen, 2,5D-Schatten, Sektor-Szenerie, die vom Chip-Look zu Wald/Archiv/Molekülen/Noten übergeht), Knoten-Ablauf (Intro → Trümmerfeld sammeln → Cache → Frage → Auflösung; Fragetypen Auswahl/Schätzfrage/Reihenfolge; Rückspulen gegen Energie), Codex, Shop (Gems für Bereiche, Trümmerfelder; Mock-Käufe; Farben für Bits), Profil mit Wissens-Fußabdruck, Reparatur-Läufe.
- **Figuren**: Bolt (Skia-gezeichnet, Stimmungen), morph.ai (Rauschen-Gesicht).
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
- Live bereitgestellt war bis D45 die Function `gemini` (Blaze, `GEMINI_API_KEY` in Secret Manager, `gemini-3.5-flash-lite`, 100 Modellaufrufe pro UTC-Tag). Sie nahm freie Prompts an und wird durch `questions` ersetzt (siehe 0.6).

## Prototyp 0.6 (Regie: Plot, offenes Ende, Liga, neue Sektoren)

- **Plot** (D36–D38): fünf Kapitel mit Zielleiste unter dem HUD, 18 Story-Momente als Dialoge, Logbuch im Codex, vier Hüter mit Porträts (erwachen bei 3 Knoten je Sektor, kommentieren richtige Antworten), Finale gegen morph.ai im Kern. Danach endlos weiter mit Meilensteinen.
- **Regeln** (D39–D43): kein Softlock bei Integrität 0 (Wartung), Reparatur zählt nur bei Fälligkeit, Streak-Freezes monatlich, Ergebnis-Screens frieren ihren Start ein, Knotenliste im Dock.
- **Sektoren** (D44): Naturwissenschaften, Technik & Medizin · Geographie & Erde · Geisteswissenschaften & Kultur · Gesellschaft, Politik & Wirtschaft, je drei Bereiche, 61 eingebaute Fragen, Migration alter Spielstände.
- **Kein offener Proxy** (D45): Functions `questions` (gemeinsamer geprüfter Pool, Erzeugung nur serverseitig, Limits pro IP) und `league`. **Im Code fertig, aber noch nicht deployed**; bis zum Deploy läuft live noch die alte `gemini`-Function.
- **Offenes Ende** (D46): Nachschub je Bereich, wartende Zweige wachsen nach.
- **Wochenliga** (D47): Dock → „Liga“, freiwillig, erzeugte Rufnamen, Austreten löscht den Eintrag.
- **Assets:** App-Symbol, Splash, Hüter, morph.ai-Formen, Bolt-Stimmungen (`docs/ASSETS.md`); HIG-Review in `docs/DESIGN_REVIEW.md`.
- **Ungeprüft auf Gerät:** Story-Dialoge, Zielleiste, Porträts, Liga-Bildschirm.

## Prototyp 0.7 (selbst denken: morph.ai, Cache, Gehirn)

- **morph.ai** (D50): Die KI hat den Menschen Suchen, Sortieren und Merken abgenommen und das Netz „bereinigt“; Onboarding, Story-Momente und Sprüche erzählen das so.
- **Cache und Ordner** (D49): Lose Ordner im Trümmerfeld lesen, in die Ordnerstruktur ablegen, bis zu 3 Dateien pro Thema in den Cache. In der Frage ist der Cache gratis, die Ordnerstruktur kostet 1–3 ⚡.
- **Enthüllung** (D51): Nach dem Finale werden Leiterbahnen zu Nervenbahnen, Zoom bis zum Gehirn, „Ich weiß, dass ich nichts weiß“. Danach öffnet sich die Wochenliga. In den neuen Einstellungen (Profil → Einstellungen) jederzeit abspielbar.
- **Liga nach dem Gehirn** (D53): Nach der ersten Sequenz automatisch eingeordnet und Liga mit Begrüßung gezeigt; der Liga-Knopf im Dock leuchtet, bis man ihn antippt.
- **Ungeprüft auf Gerät:** die Gehirn-Animation (Skia + Reanimated), die neuen Cache-Fenster, Einordnung und leuchtender Liga-Knopf.

## Verifiziert

`pnpm typecheck` (shared, functions, mobile), `pnpm test` (153 + 39 Tests), `expo export --platform ios` (Bundle baut), Functions-Bündel lädt und exportiert `questions` und `league`. **Nicht** auf Gerät/Simulator gelaufen; die neuen Functions sind nicht gegen die Produktion getestet, weil der Deploy noch aussteht.

## Offen / nächste Schritte

1. **Deploy** der Functions und Firestore-TTL (`pnpm firebase:deploy`, `gemini` beim Nachfragen löschen), danach mit `curl` prüfen: freier Prompt → 4xx, gültige Anfrage → Fragen, Liga beitreten/abgleichen/austreten. Stand 24.10.2026: `gemini` ist noch live, `questions` und `league` geben 404.
2. Auf dem Handy testen (Expo Go), Optik/Performance nachjustieren.
3. Store-Launch nach `docs/CODEX_SUBMISSION.md` (geprüfter Befund, Entscheidungen E1–E8, Reihenfolge); Details in `docs/CODEX_HANDOFF.md`.
4. Tages-Puls mit morph.ai als Gastgeber, Duelle/Koop, Events.
5. Englisch, Sounds, Design-Review abarbeiten.
