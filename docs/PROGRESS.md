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
- **Regeln** (D39–D43): kein Softlock bei Integrität 0 (Wartung), Reparatur zählt nur bei Fälligkeit und heilt mit einer richtigen Antwort (D67), Streak-Freezes monatlich, Ergebnis-Screens frieren ihren Start ein, Knotenliste im Dock.
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

## Prototyp 0.14 (Die Firewalls werden angekündigt)

- **Vorahnung** (D68): Bolt bemerkt die erste Wand im Rauschen, jeder Hüter nennt beim Erwachen seine zwei Säle hinter der Firewall, vor jedem Wandkampf eigene Worte von morph.ai und dem Hüter (Bolt, solange er schläft), nach der dritten Wand fängt der Kern morph.ais Vorbereitung auf das Finale auf. Zwei neue Logbuch-Einträge, alles in vier Sprachen.
- **Ungeprüft auf Gerät:** Höhe des Kampf-Intros (drei Zeilen über der Frage) auf kleinen Bildschirmen. Die Reime der Muse und die neuen Texte sollten Muttersprachler gegenlesen.

## Prototyp 0.15 (größere Bereiche, Server live)

- **Größere Bereiche** (D69, D70): Ring um die Kernzone bei 650 statt 470, äußere Bereiche bis 3500; die erste Wand kommt nach rund 15 statt 5 gelösten Knoten (D69 hatte 800 und rund 30). Alte Spielstände: Lücken wandern auf die neue Wand, Knoten in der falschen Zone werden neu gesetzt.
- **Functions deployed** (25.10.2026): `questions` und `league` sind live, `gemini` ist gelöscht. Geprüft mit `curl`: freier Prompt → 400, `gemini` → 404, gültige Anfrage → neu erzeugte Fragen, `league` ohne Kennung → 400.
- **Ungeprüft auf Gerät:** wie sich der Weg bis zur Wand anfühlt; ob das Tagesbudget (100 Modellaufrufe, also etwa 75 neue Fragen am Tag) für die größere Kernzone reicht, solange der Pool noch klein ist.

## Prototyp 0.16 (Hüter kämpfen mit, Bosskämpfe auf Zeit)

- **Hüter im Kampf** (D71): Der wache Hüter steht in der Firewall-Szene neben Bolt, schießt mit, zuckt bei morph.ais Gegenschlag und kommentiert jede Antwort. Keine Boni.
- **Erwachen:** Jeder Hüter bittet um Hilfe für seine zwei Säle; die Karte zoomt heraus und umrandet sie, der Dialog dockt unten an.
- **Gegenschlag** (D72): Nach einem verlorenen Wandkampf beschädigt morph.ai 1–2 gelöste Knoten an der Wand; erst nach ihrer Reparatur lässt sich die Wand wieder angreifen.
- **Tempo bis zur Wand** (D73): Angreifen erst, wenn der Knoten vor der Wand beantwortet ist und mindestens 15 Knoten beantwortet sind (+5 je gebrochener Wand); Ring bei 520. Jede Spielweise kommt so nach etwa 15 Antworten an die erste Wand.
- **Zeitlimit:** eine Uhr pro Firewall-Kampf und Finale (je nach Fragetypen, etwa 2:30 bei acht Auswahlfragen), läuft nur bei offener Frage; abgelaufen heißt verloren. Mit Screenreader doppelt so lang.
- **Ungeprüft auf Gerät:** Kamerafahrt und Umrisse der Säle (Zoom unter `MIN_ZOOM`), Höhe des angedockten Dialogs auf kleinen Bildschirmen, ob die Uhr zu knapp oder zu großzügig ist.

## Prototyp 0.17 (Store-Blocker, D74)

- **Käufe:** RevenueCat in Store-Builds, nie der Mock; ohne Schlüssel keine Kauf-Knöpfe.
- **Build:** Profil `production` mit `submit`, Abbruch ohne echte AdMob-/RevenueCat-IDs, Privacy Manifest ergänzt, ATT-Text in vier Sprachen, Android ohne Speicher-Rechte.
- **Kinder:** unter 13 kindgerichtete G-Anzeigen, unter 16 höchstens PG.
- **Spielstand:** wird bei fehlenden Fragen repariert statt verworfen, mit Sicherung; Absturz-Bildschirm statt App-Ende.
- **Fragen:** Hinweis „Bolt sucht neue Fragen“ mit Neuversuch, Melden von Fragen (Function `report`), Pools füllen sich selbst bis 25 (Function `topUpPools`).
- **Rangliste:** erster Abgleich gedeckelt, TTL für inaktive Einträge und den Budget-Zähler.
- **Nicht deployed:** `report`, `topUpPools`, die neuen TTL-Regeln und das neue `league` (Deckel, `expiresAt`). Bis zum Deploy meldet die App ins Leere (404, wird ignoriert).
- **Ungeprüft auf Gerät:** RevenueCat-Kauf und -Wiederherstellen (Sandbox), Melde-Fenster, Hinweis bei leerem Pool, Absturz-Bildschirm.

## Prototyp 0.18 (Zähler statt Erklärtext, D75)

- **Firewall-Fenster als Checkliste:** Statt Absätzen ein Satz und Zähler: „An der Wand“ (✓ oder „noch etwa N Schritte“), „Knoten beantwortet 12 / 15“ und nach einem verlorenen Kampf „Knoten repariert 1 / 2“. Erfüllte Punkte leuchten grün, alle Bedingungen sind gleichzeitig sichtbar.
- **Synapsen im Profil:** ohne Synapse das nächste offene verwandte Paar als Zähler („Physik 3 / 4 · Biomedizin 2 / 4“), voll: „Bereit: Verbinde die beiden auf der Karte.“
- **Finale:** ist es noch zu, drei Zähler (Startknoten, Hüter, Firewalls je x / 4) statt eines Satzes.
- **Ungeprüft auf Gerät:** Zeilenbreite der Checkliste in FR/ES.

## Prototyp 0.19 (Finale in vier Phasen, D76)

- **Später:** Das Finale öffnet erst, wenn alle 12 Bereiche je 3 beantwortete Knoten haben. Kapitel 4 zählt das (x / 12), danach erst der Finale-Knopf.
- **Vier Phasen:** je Sektor 3 Fragen, 2 richtig brechen das Schild, morph.ai wechselt das Gesicht und spricht zu jedem Sektor, der Hüter kämpft mit. Eigene Uhr pro Phase.
- **Ordnerstruktur im Duell:** ohne Blitze, aber auf Zeit; je Phase eine Frage aus einem abgelegten Ordner, wenn es einen gibt.
- **Ungeprüft auf Gerät:** Kampfbild mit 2-Schichten-Schild, Explorer über laufender Uhr, Textlängen in FR/ES.

## Verifiziert

`pnpm typecheck` (shared, functions, mobile), `pnpm test` (257 + 56 Tests), `expo export --platform ios` (Bundle baut), Functions-Bündel lädt und exportiert `questions`, `league`, `report` und `topUpPools`. **Nicht** auf Gerät/Simulator gelaufen; die Functions sind nur per `curl` gegen die Produktion geprüft (D69).

## Offen / nächste Schritte

1. **Server beobachten:** Functions sind seit 25.10.2026 live. Noch prüfen: Rangliste mit `join`, `sync` mit `board`, `leave` aus der App; TTL-Regeln in der Konsole; Tagesbudget `AI_DAILY_CALL_LIMIT` anheben, wenn der Pool zu langsam wächst (D69 braucht Nachschub).
2. Auf dem Handy testen (Expo Go), Optik/Performance nachjustieren.
3. Store-Launch nach `docs/CODEX_SUBMISSION.md` (geprüfter Befund, Entscheidungen E1–E8, Reihenfolge); Details in `docs/CODEX_HANDOFF.md`.
4. **Geld:** AdMob-Konto, Anzeigenblöcke, RevenueCat-Konto und Produkte, EAS-Variablen in `production`, UMP-Mitteilungen, `app-ads.txt` (`docs/MONETIZATION.md` §6); Development Build mit Test-Anzeigen und Sandbox-Käufen auf einem Gerät.
4a. **Deploy** von `report`, `topUpPools`, `league` und den TTL-Regeln (`firebase deploy --only functions,firestore:indexes`); `AI_DAILY_CALL_LIMIT` für den Vorlauf anheben (E7), damit die 1200 Fragen vor dem Start stehen.
4b. **Vor der Einreichung (👤):** Bundle-ID und Name festlegen, Datenschutzerklärung und Impressum unter einer URL (`PRIVACY_URL`, `SUPPORT_EMAIL`), Datenschutztext der App aktualisieren, App Check, Store-Eintrag in vier Sprachen, Altersfreigabe, Datenschutz-Etikett und Data Safety.
5. Tages-Puls mit morph.ai als Gastgeber, Duelle/Koop, Events.
6. Sounds, Design-Review abarbeiten; Übersetzungen von Muttersprachlern gegenlesen lassen.
