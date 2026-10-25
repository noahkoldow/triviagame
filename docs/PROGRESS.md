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
- **Enthüllung** (D51): Nach dem Finale werden Leiterbahnen zu Nervenbahnen, Zoom bis zum Gehirn, „Ich weiß, dass ich nichts weiß“. Danach öffnet sich die Rangliste. In den neuen Einstellungen (Profil → Einstellungen) jederzeit abspielbar.
- **Liga nach dem Gehirn** (D53): Nach der ersten Sequenz kommt die Rangliste mit Begrüßung; der Knopf im Dock leuchtet, bis man ihn antippt.
- **Rangliste für alle** (D57, ersetzt die Wochenliga): jeder Spielstand automatisch drauf, insgesamt nach XP und je Bereich nach gelösten Knoten, beste 50 plus eigener Platz, kein Austreten (nur Zurücksetzen löscht).
- **Ungeprüft auf Gerät:** die Gehirn-Animation (Skia + Reanimated), die neuen Cache-Fenster, Rangliste und leuchtender Knopf; die neue `league`-Function ist nicht deployed.

## Prototyp 0.8 (Geld: Werbung trägt, Plus obendrauf)

- **Werbung** (D55): Interstitials in natürlichen Pausen (Ergebnis → Karte, jede 2. Pause, ≥ 3 min, ab 8 gelösten Knoten), App-Open bei der Rückkehr (höchstens alle 4 h), Rewarded-Videos mit Tageslimits je Platz; neu: Energie per Video, Tagesbonus verdoppeln. Nach einer falschen Antwort nie Werbung.
- **NEXUS Plus** (D54): Paywall `app/plus.tsx` (monatlich, jährlich, für immer, mit den Abo-Pflichtangaben), keine Zwangswerbung, Belohnungen ohne Video, Monatsbonus. Ersetzt „Werbefrei“.
- **Shop** neu: Tagesbonus (roter Punkt am Dock), Plus, Startpaket nach Kapitel 1, Gems mit Video-Limit, Streak-Schutz für Gems, Energie per Video. Gutschrift genau einmal je Transaktion.
- **AdMob** (D56): echter Anbieter mit UMP-Einwilligung und ATT-Text für Dev- und Store-Builds (`src/services/admob.ts`, `app.config.ts`); Expo Go behält den Mock. Einstellungen: personalisierte Werbung und Googles Datenschutz-Optionen.
- **Messen:** Analytics-Provider (Mock) mit den Ereignissen des Umsatz-Trichters. Modell, Annahmen und Kennzahlen in `docs/MONETIZATION.md`.
- **Ungeprüft auf Gerät:** AdMob, Einwilligung und ATT laufen nur im Development Build und sind dort noch nie gelaufen. Käufe sind weiter nur der Mock (RevenueCat fehlt, P2.1).

## Prototyp 0.9 (Wände)

- **Firewalls als Wände** (D58): Ring aus hochgestellten Hexagons um die vier Startbereiche, Trennwände zwischen den acht äußeren Bereichen. Sichtbar erst ab 5 Feldern Nähe, angreifbar erst direkt an der Wand; der Sieg reißt dort eine Lücke, durch die das Netz in den Bereich wächst. Außenposten entfallen, „Physik & Chemie“ heißt „Naturwissenschaften“.
- **Ungeprüft auf Gerät:** Wand-Kacheln (Höhe, Mauerfugen), pulsierende Kante, Schilder und Antippen der Wand. Eine CanvasKit-Vorschau der Szene sah stimmig aus.

## Prototyp 0.10 (Sprachen)

- **Deutsch, Englisch, Französisch, Spanisch** (D59): Sprachwahl als erster Schritt des Onboardings und in den Einstellungen. Oberfläche, Geschichte, Logbuch, Enthüllung, Datenschutzhinweise, Shop und Plus sind übersetzt, ebenso alle 61 eingebauten Fragen samt Ordnerdateien, Artikeln und Diagrammen.
- **Gemini je Sprache:** Anfrage mit `lang`, ein Pool je Sprache und Bereich, Prompt und Prüfer in der Zielsprache.
- **Ungeprüft auf Gerät:** Textlängen auf kleinen Bildschirmen (Französisch und Spanisch sind länger), Erkennung der Gerätesprache. Die Übersetzungen sollten Muttersprachler gegenlesen.

## Prototyp 0.11 (Karte wächst in der Nähe)

- **Keine Bahnen mehr quer über die Karte** (D60): Brücken führen nur in ein Thema, das man vom gelösten Knoten aus erreicht (Nachbarsektor oder nahe Lücke), sonst bleiben sie im Thema oder warten auf neue Fragen. Neue Knoten stehen höchstens 230 Einheiten vom Elternknoten (oder der Lücke) entfernt und meiden Kreuzungen. Alte Karten werden beim Laden einmal repariert.
- **Ungeprüft auf Gerät:** wie eine reparierte alte Karte aussieht. Die Reparatur dauert am Rechner 10–60 ms, bei 240 Knoten 0,2 s.

## Prototyp 0.12 (Breite lohnt sich)

- **Synapsen** (D61): Verwandte Bereiche mit je 4 gelösten Knoten lassen sich per Probe aus dem Gedächtnis verbinden. Jede Synapse gibt dauerhaft +5 % XP und Bits, reißt an gemeinsamen Wänden eine Abkürzung und schwebt als leuchtender Bogen über der Karte. Liste im Dock, Vernetzung im Profil.
- **Vielfalt-Bonus:** +20 % Bits bei 5 verschiedenen Bereichen unter den letzten 10 Antworten.
- **Sammelalben:** 8 Themen quer durch alle 12 Bereiche im Codex, ein volles Album bringt 3 Gems und 50 Bits.
- **Ungeprüft auf Gerät:** Bögen und Funken-Schilder auf der Karte, Antippen der Funken, Länge der Texte in FR/ES.

## Prototyp 0.13 (Bosskampf und neue Formate)

- **Firewalls als Bosskampf** (D64): vier Schichten, acht Fragen; richtig reißt eine Schicht ein (Strahl, fallende Steine), falsch lässt morph.ai sie reparieren (Rauschen fließt herab). Lebensbalken, verbleibende Fragen, Sprüche von Bolt und morph.ai.
- **Neue Formate und Fragetypen** (D65, Konzept 4.1–4.3): Steckbrief, Zitat, Nachricht, Linien-, Kreis- und Ablaufdiagramm; Mehrfachauswahl, In Ordner sortieren, Fehler finden. Alles im Gemini-Prompt, Validator und Prüfer, je eine eingebaute Frage pro Typ in vier Sprachen.
- **Ungeprüft auf Gerät:** Bosskampf-Animation (viele kleine Skia-Gruppen, Performance auf älteren Geräten), Textlängen der neuen Ansichten, Kreisdiagramm per react-native-svg.
- **Karten und weitere Typen** (D66): Karte (Natural Earth), Ort antippen, Wer bin ich? (Bonus für früh gelöst), Quelle prüfen, beschädigte Dateien; Websuche beim Prüfer (`AI_CHECK_GROUNDING`, aus). **Ungeprüft:** Antippen der Karte auf dem Gerät (Koordinaten aus `locationX/Y`), Websuche gegen echtes Gemini.

## Verifiziert

`pnpm typecheck` (shared, functions, mobile), `pnpm test` (227 + 54 Tests), `expo export --platform ios` (Bundle baut), Functions-Bündel lädt und exportiert `questions` und `league`. **Nicht** auf Gerät/Simulator gelaufen; die neuen Functions sind nicht gegen die Produktion getestet, weil der Deploy noch aussteht.

## Offen / nächste Schritte

1. **Deploy** der Functions und Firestore-TTL (`pnpm firebase:deploy`, `gemini` beim Nachfragen löschen), danach mit `curl` prüfen: freier Prompt → 4xx, gültige Anfrage → Fragen, Rangliste: `join`, `sync` mit `board`, `leave`. Stand 24.10.2026: `gemini` ist noch live, `questions` und `league` geben 404.
2. Auf dem Handy testen (Expo Go), Optik/Performance nachjustieren.
3. Store-Launch nach `docs/CODEX_SUBMISSION.md` (geprüfter Befund, Entscheidungen E1–E8, Reihenfolge); Details in `docs/CODEX_HANDOFF.md`.
4. **Geld:** AdMob-Konto, Anzeigenblöcke, EAS-Variablen, UMP-Mitteilungen, `app-ads.txt` (`docs/MONETIZATION.md` §6); RevenueCat-Anbieter für Käufe; Development Build mit Test-Anzeigen auf einem Gerät.
5. Tages-Puls mit morph.ai als Gastgeber, Duelle/Koop, Events.
6. Sounds, Design-Review abarbeiten; Übersetzungen von Muttersprachlern gegenlesen lassen.
