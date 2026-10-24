# Asset-Bibel

Alles, was NEXUS an Figuren, Symbolen, Bildern und Klängen braucht. Grundsatz: **Vektor und Code statt Bilddateien.** Figuren und Objekte werden mit React Native Skia gezeichnet (wie `Bolt.tsx`, `Morph.tsx`, `propAtlas.ts`). Bitmaps gibt es nur dort, wo das System sie verlangt: App-Symbol, Splash, Store-Grafiken. Deren Quelle liegt als SVG im Repo (`apps/mobile/assets/src/`).

Status: ✅ vorhanden · 🎨 Design-Auftrag läuft · 📋 offen (siehe `docs/CODEX_HANDOFF.md`)

## 1. Stilregeln

Drei Ebenen, die zusammen die Geschichte erzählen:

| Ebene | Look | Warum |
|---|---|---|
| **Nexus OS** (Fenster, Dialoge, Taskleiste) | Windows 95/98: graues Relief, blaue Titelleisten, türkiser Desktop (`Win.tsx`) | Das ist das Betriebssystem des alten Archivs. morph.ai läuft darin. |
| **Die Karte** | Hexagon-Platine im Kern, nach außen Biome (Wald, Archiv, Atelier, Labor), kräftige Duolingo-Farben, Low-Poly-Objekte | Je weiter vom Kern, desto weniger Computer. |
| **Figuren** | Runde, dicke Formen; 2–3 flache Töne plus ein Leuchten in der Sektorfarbe; Gesicht auf einem Display oder klar lesbare Augen | Lesbar bei 40 px, freundlich, kein Kindchenschema-Kitsch. |

- **Farben** (Tokens in `theme.ts`): Naturwissenschaften `#1CB0F6`, Erde `#58CC02`, Geisteswissenschaften `#CE82FF`, Gesellschaft `#FFC800`, morph.ai `#FF86D0`, Grund `#131F24`, Display `#0B1220`.
- **Bewegung:** sanft (Schweben, Atmen, Blinzeln). Höchstens drei Wechsel pro Sekunde (Blitzregel). Bei „Bewegung reduzieren“ steht alles still.
- **Keine Fotos, keine KI-Bilder, keine fremden Marken.** Rechte bleiben sauber, die App bleibt klein.
- Jede Figur hat ein `accessibilityLabel` mit Namen und Rolle.

## 2. Figuren

### Bolt, der Begleiter ✅

Schwebender runder Roboter mit Display-Gesicht, Antenne, zwei Kugel-Armen und Bauchlicht (`Bolt.tsx`, 100×100-Raster).

| Stimmung | Gesicht | Wann |
|---|---|---|
| `happy` ✅ | Augen hoch, Lächeln | Begrüßung, Tipps |
| `think` ✅ | ein Auge schmal, gerader Mund | Frage läuft |
| `sad` ✅ | Mund nach unten | Fehler, Zerstörung |
| `wow` ✅ | große Augen, runder Mund | richtige Antwort |
| `wink` ✅ | ein Auge als Strich | Wortwitz |
| `proud` ✅ | Augen als Bögen (^ ^), Antenne leuchtet heller | Hüter geweckt, Kapitel geschafft |
| `worried` ✅ | Augen schräg nach innen, Mund als Welle | Netz instabil, morph.ai taucht auf |
| `sleepy` ✅ | Augen als flache Striche, kleines „z“ über der Antenne | Onboarding: Bolt bootet |

Später (📋): Skins pro Sektor (Moos, Farbspritzer, Pergament-Aufkleber, Sternenstaub), freischaltbar mit Bits.

### morph.ai, der Gegenspieler ✅

Gesicht aus 12×12 flackernden Pixeln in Magenta (`Morph.tsx`). Emblem: sechs verschlungene Schleifen (`MorphScene.tsx`).

| Form | Aussehen | Wann |
|---|---|---|
| `smile` ✅ | das heutige Gesicht | Standard, Funksprüche |
| `glasses` ✅ | Pixel-Brille, eine Braue hoch | Besserwisser-Sprüche nach Fehlern |
| `crown` ✅ | Pixel-Krone, breites Grinsen | Firewalls, Finale |
| `glitch` ✅ | Zeilen springen seitlich versetzt, Gesicht zerfällt | Firewall gebrochen |
| `reformed` ✅ | ruhige Pixel, Violett-Blau statt Magenta, kleines ehrliches Lächeln | nach dem Finale |

### Die vier Hüter ✅

Sie schlafen im Archiv und erwachen, wenn ihr Sektor wächst (drei gelöste Knoten). Danach kommentieren sie richtige Antworten in ihrem Sektor. Porträt 1:1 im 100×100-Raster wie Bolt, Komponente `Guardian.tsx` mit `who` und `size`.

| Hüter | Sektor | Gestalt | Ton |
|---|---|---|---|
| **Quantis** | Naturwissenschaften, Blau | Hologramm-Kopf aus einem Drahtgitter-Ikosaeder, Monokel aus einer Elektronenbahn, schwebende Zeichen (π, Σ), feine Scanlinien | übergenau, trocken |
| **Rhizom** | Geographie & Erde, Grün | Baumstumpf-Kopf mit Rindenmaserung, zwei ruhige Leucht-Augen in Astlöchern, Krone aus drei Blättern, Wurzelbart; atmet langsam | ruhig, spricht in Bildern |
| **Kodex** | Gesellschaft, Gelb | Eule: runder Körper, große runde Brille, Federkiel im Ohrbüschel, Gesetzesrolle unter dem Flügel, Tintenfleck auf der Brust; blinzelt | zitiert gern, „irrt nie“ |
| **Muse** | Geisteswissenschaften & Kultur, Violett | Maske aus einem Farbklecks, Haare aus Pinselstrichen, Notenschlüssel als Ohrring, zwei schwebende Achtelnoten; Farbe wandert sanft | dramatisch, reimt |

Später (📋): je zwei Posen (ruhig, jubelnd) für Hüter-Momente.

### Glitches 📋

Kleine Störwesen, die Köder-Fragmente tragen. Drei Varianten: **Pix** (Pixelhaufen mit zwei Augen), **Zack** (Zickzack-Blitz), **Loop** (eine einzelne morph.ai-Schleife). Sie sitzen auf Köder-Ordnern im Trümmerfeld, sobald ein Knoten Schwierigkeit 3 oder mehr hat. Sie verraten nicht, welcher Ordner der Köder ist (sie sitzen auch auf Kontext-Ordnern), sie sind nur Stimmung.

## 3. Spielobjekte

| Objekt | Status | Beschreibung |
|---|---|---|
| Knoten (offen, gelöst, beschädigt) | ✅ | Hex-Kacheln mit Symbol (`NodeViews.tsx`) |
| Firewall | ✅ | Mauer-Symbol auf der Sektorgrenze |
| Außenposten | ✅ | gestörter Punkt mit Rauschen |
| **Kern / Finale** | 📋 | Der Chip im Zentrum bekommt im Kapitel 4 eine magentafarbene Krone aus Rauschen; Antippen startet das Finale |
| Fragment-Ordner | ✅ | gelbe Desktop-Ordner (D25) |
| **Logbuch-Datei** | ✅ (Codex) | `.LOG`-Dateien im Ordner `SYSTEM/LOGS`, im Codex lesbar |
| Diagramme in Ordnern | ✅ | Balken, Zeitleiste, Tabelle (`ChartView.tsx`) |
| Szenerie (12 Bereiche) | ✅ | Low-Poly-Objekte im Atlas (`propAtlas.ts`) |
| Ordnerstruktur und Cache | ✅ | Explorer mit Gebietsebene (`Ordner\Thema\Ordner\Datei`), Cache-Fenster mit 3 Plätzen je Thema (`CacheFiles.tsx`) |
| **Gehirn-Enthüllung** | ✅ | `app/brain.tsx`: das eigene Netz als Leiterbahnen im Winkel, die zu geschwungenen Nervenbahnen mit Dendriten werden; Zoom bis zum seitlichen Gehirn (Großhirn mit Furchen, Kleinhirn, Hirnstamm) voller prozeduraler Bahnen in Violett. Geometrie in `brain.logic.ts`. Später (📋): eigene Musik und ein illustrierteres Gehirn. |
| Tages-Puls-Marker | 📋 | pulsierender Ring am Kern, eine Ziffer für die Serie |

## 4. App-Symbol, Splash, Store ✅ / 📋

**App-Symbol „Funke im Kern“** ✅: dunkler Grund (`#0B1220` nach `#131F24`), in der Mitte ein flaches Hexagon wie ein Chip-Die mit hellem Rand, daraus vier kurze Leiterbahnen in den Sektorfarben (Blau oben, Grün rechts, Violett unten, Gelb links), im Zentrum ein heller Funke mit weichem Leuchten. Kein Text. Muss bei 29 pt noch lesbar sein. iOS: 1024×1024, **ohne Alphakanal**. Android: adaptives Symbol (Vordergrund in der 66-%-Schutzzone, Hintergrund `#131F24`, Monochrom-Variante).

**Splash** ✅: dasselbe Hexagon mit Funke auf `#070B16`, mittig, ohne Text.

**Store-Screenshots** 📋 (6,9″ iPhone, 1320×2868): fünf Bilder mit kurzer Zeile oben.
1. „Baue das Netz des Wissens wieder auf“: Karte mit gewachsenem Netz
2. „Sammle Fragmente und merke sie dir“: Trümmerfeld mit Ordnern
3. „Antworte ohne Spickzettel“: Frage mit versiegeltem Cache
4. „Brich morph.ais Firewalls“: Boss-Fenster
5. „Dein Wissens-Fußabdruck“: Netzdiagramm im Profil

## 5. Klang 📋

Nur freie Lizenzen (CC0, z. B. Kenney-Audio-Pakete) oder Auftragsarbeit; jede Datei in `docs/CREDITS.md` mit Quelle und Lizenz. Abspielen mit `expo-audio` (läuft in Expo Go). Stummschalter in den Einstellungen; Haptik bleibt.

| Klang | Charakter |
|---|---|
| Tippen, Fenster auf/zu | kurzer trockener Klick wie bei alten Systemen |
| Richtig, pro Sektor | Naturwissenschaften: Synth-Pling · Erde: Marimba · Geisteswissenschaften: Pizzicato · Gesellschaft: weiches Horn |
| Falsch / Glitch | kurzer Bitcrush-Knackser, nie schrill |
| morph.ai erscheint | gefiltertes Rauschen, das anschwillt |
| Firewall bricht | Glas-Splitter plus aufsteigender Akkord |
| Musik | Kern: ruhiges Chiptune-Pad, 80 bpm · je Sektor eine Schleife (Synth-Arpeggio, Marimba mit Vögeln, Klavier mit Streichern, Laute) · leise, unter 90 s, nahtlos |

## 6. Dateien

```
apps/mobile/assets/
  src/icon.svg            Quelle des App-Symbols
  src/splash.svg          Quelle des Splash
  icon.png                1024×1024, RGB ohne Alpha
  adaptive-icon.png       Android-Vordergrund, 1024×1024, transparent
  adaptive-mono.png       Android-Monochrom
  splash-icon.png         Splash-Motiv
apps/mobile/src/components/
  Bolt.tsx  Morph.tsx  Guardian.tsx
```
