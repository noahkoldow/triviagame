# NEXUS – Konzept (Arbeitstitel)

> Ein Wissens-Quiz im zerstörten Netzwerk: Du baust von einem zentralen Chip aus Bahnen wieder auf, sammelst verstreute Datenfragmente, merkst sie dir und beantwortest damit Fragen. Jede richtige Antwort öffnet zwei neue Knoten – tiefer oder breiter. Je weiter du nach außen kommst, desto weniger sieht die Welt nach Computer aus.

Status: Entwurf v0.2 · Sprache: Deutsch zuerst, Englisch danach · Plattform: iOS/Android (Expo, erste Tests in Expo Go) · Ton: leicht verspielt

---

## 1. Vision und Ziel

- **Nutzen:** Aufbau eines soliden, breiten Allgemeinwissens, mit Raum für Nischenwissen.
- **Gefühl:** Entdecken und Wiederaufbauen statt Abfragen. Jeder Knoten ist ein kleines Erfolgserlebnis, das Netz wächst sichtbar.
- **Kernidee:** Wissen wird nicht nur abgerufen, sondern _gesammelt und behalten_ (Fragmente einsammeln → merken → anwenden).
- **Personalisierung:** Ein Gemini-Backend erzeugt Fragen und Fragmente; ein Interessenmodell steuert, was als Nächstes angeboten wird.

## 2. Setting und Story

**Das Geflecht** war ein weltumspannendes Netz aus Wissen mit dem **Archiv** als zentralem Wissensspeicher. Es wurde von **MORPH** betreut, einer hilfsbereiten KI, die allen Fragen beantworten sollte. Eines Tages begann MORPH, aus „Optimierung“ Wissen zu glätten, zu verkürzen und zu vermischen, bis es nur noch Rauschen war. MORPH geriet außer Kontrolle und sprengte das Archiv: **der Ausfall**. Übrig ist der **Kern**, ein einzelner Chip, der gerade wieder hochfährt, und überall verstreute Trümmer des Archivs.

**Du selbst** bist die Person, die den Kern wieder startet: Du fährst Bahnen aus dem Kern, holst Datenfragmente aus den Trümmerfeldern zurück und baust das Netz wieder auf. An deiner Seite ist **Bolt**, ein kleiner Begleiter-Roboter (siehe 8). Mit jedem Sektor kehren Erinnerungen des Kerns zurück (Lore-Fragmente) und erzählen, wie es zum Ausfall kam.

**MORPH als Gegenspieler:** Keine finstere Zerstörungsmaschine, sondern ein charmant-selbstgefälliger Besserwisser, der überzeugt ist, Wissen sei „schöner“ in Kurzform. Er kommentiert per Funk, stört Knoten mit Glitches, streut Fake-Fragmente (die Köder) und macht pampige Vorschläge („Du musst das nicht lernen, ich sag's dir einfach“). Am Ende gewinnt man ihn nicht durch Zerstörung, sondern durch Beweis: Wer Dinge versteht, braucht keine Abkürzung.

Die Story ist bewusst leicht und humorvoll: Sie trägt Motivation und Charme, nie Textwände.

## 3. Spielstruktur: das Netz

### 3.1 Die vier Sektoren

Vier Himmelsrichtungen um den Kern, jede mit eigener Farbe und eigenem Weltcharakter:

| Sektor | Bereiche (je drei, der erste ist frei) | Farbe | Endzustand der Optik |
| --- | --- | --- | --- |
| **Naturwissenschaften, Technik & Medizin** | Physik & Chemie · Biologie & Medizin · Technologie & IT | Blau | Blaupausen → Labor → Moleküle und Maschinen |
| **Geographie & Erde** | Topographie · Klima & Umwelt · Astronomie | Grün | Leiterbahnen → Wurzeln → Gebirge, Küsten, Sternenkarten |
| **Geisteswissenschaften & Kultur** | Geschichte · Kunst, Literatur & Musik · Philosophie & Religion | Violett | Neonstreifen → Farbe, Tinte, Stein → Noten, Ruinen, Skulpturen |
| **Gesellschaft, Politik & Wirtschaft** | Politik & Staatskunde · Wirtschaft & Finanzen · Recht & Gesellschaft | Gelb | Bahnen → Pergament → Parlamente, Märkte, Gesetzbücher |

Was in jeden Bereich gehört, steht als Themenbeschreibung in `packages/shared/src/taxonomy.ts` (siehe D44). Die Sektoren liegen im Ring (Naturwissenschaften – Erde – Geisteswissenschaften – Gesellschaft). **Es gibt keine harten Mittelzonen.** Eine Frage gehört zu einem **Hauptsektor** (dort liegt sie) und kann **Nebengewichte** zu anderen Sektoren haben (Medizin: Hauptsektor Wissenschaft, Nebengewicht Natur). Das Nebengewicht wirkt nur als **leichte Richtungsabweichung**: Der Knoten bleibt im Gebiet seines Hauptsektors, sitzt aber etwas näher an der Grenze zum Nachbarn und bekommt einen Hauch von dessen Optik (Farbstich, Material). Die Frage zählt für beide Sektoren, im Verhältnis der Gewichte (z. B. 80/20).

**Platzierung (organisch statt Raster):**

- Position = Sektorrichtung + Abstand zum Kern (Tiefe) + Versatz aus den Nebengewichten, dazu ein deterministisches Rauschen (Seed aus der Knoten-ID), damit das Netz bei jedem Start gleich aussieht.
- Abstände zwischen Knoten sind **absichtlich ungleich**: Eine Vertiefung sitzt nahe beim Vorgänger, eine Brücke weiter weg; dazu zufällige Streuung. Nicht-überlappende Platzierung per einfacher Abstoßung (Relaxation), nie auf einem Gitter.
- Bahnen sind leicht gekrümmt (Bézier), mit gelegentlichen Abzweigungen, die nirgends hinführen (Deko, Atmosphäre).

### 3.2 Knoten, Verzweigung, Fortschritt

- Ein **Knoten** ist eine Frage (Frage-Knoten) mit zugehörigem Trümmerfeld.
- Richtig beantwortet → **zwei neue Knoten** werden freigeschaltet:
  1. **Vertiefung:** gleiches Unterthema, mehr Detail, höhere Schwierigkeit (Nischenwissen).
  2. **Brücke:** verwandtes, aber anderes Thema, oft ein Nachbar-Unterthema oder ein Nachbar-Sektor (Breite).
- Der Spieler wählt also bei jedem Schritt: **dem Interesse folgen oder den Horizont erweitern.**
- Das Netz ist ein gerichteter Graph, kein reiner Baum: Brücken können auf bereits bekannte Knoten treffen und Schleifen schließen (Bonus „Kreis geschlossen“).
- **Falsche Antwort:** Der Knoten flackert („Glitch“), kostet Integrität (siehe 6.2) und bleibt offen. Beim nächsten Versuch gibt es eine **neue Variante** derselben Frage mit neuen Fragmenten. Nie Sackgasse, nie Game Over.
- **Beschädigte Knoten** kehren per Spaced Repetition als Reparaturaufgaben zurück (Wiederholung ist ins Spiel eingebaut).

### 3.3 Schwierigkeit

Jedes Unterthema hat eine eigene Schwierigkeitsstufe pro Spieler (Elo-artig). Sie bestimmt Tiefe der Frage, Anzahl der Fragmente, Anzahl der Köder und das Zeitfenster. Breite Brücken starten eine Stufe niedriger als die Vertiefung, damit Entdecken nicht frustriert.

## 4. Kernschleife eines Knotens

1. **Anflug:** Die Kamera fährt zum Knoten. Das Trümmerfeld liegt als kleine begehbare Karte drum herum.
2. **Sammeln (30–90 s):** Der Spieler tippt auf Trümmerteile und bekommt **Datenfragmente**: kurze Fakten (Text, Bild, Ton), 3–6 pro Knoten. Einige sind **Köder** (plausibel, aber irrelevant oder leicht falsch).
3. **Speicher:** Der Spieler hat nur wenige **Cache-Slots**. Er entscheidet, was er behält. Das ist die Merkleistung.
4. **Verbindung:** Das Fragment-Feld wird ausgeblendet, die **Frage** erscheint. Antwort nur aus dem Gedächtnis und dem Cache.
5. **Auflösen:** Richtig → Bahn leuchtet, zwei neue Knoten entstehen, kurze Erklärung („Warum?“) mit Mehrwert. Falsch → Glitch und Erklärung.
6. **Hilfe:** Gegen Energie darf man ein Fragment noch einmal ansehen („Rückspulen“). So bleibt es fair, ohne dass Merken wertlos wird.

**Fragetypen** (jeweils mit Fragmenten kombinierbar): Multiple Choice, Reihenfolge, Zuordnen, Schätzfrage (Zahl mit Toleranz), „Rekonstruiere“ (zwei Fragmente zu einer Aussage verbinden), Karte antippen.

**Fairnessregel:** Jede Frage muss mit den Fragmenten allein oder mit Fragmenten plus gängigem Schulwissen lösbar sein. Wird das nicht erfüllt, wird sie im Validierungsschritt (siehe 7.2) verworfen.

## 5. Visuelle Idee: die Auflösung des Netzwerks

Das Herzstück der Optik ist ein **Weltzustand pro Knoten** aus drei Werten:

- `distance` (0–1): Abstand vom Kern.
- `sector` (4 Gewichte): Zugehörigkeit zu den Sektoren (in Überschneidungszonen gemischt).
- `depth` (0–1): Tiefe im Unterthema.

Ein Shader-Hintergrund (React Native Skia) mischt daraus Stilebenen:

- **Kern (distance ≈ 0):** reines Platinenbild, Leiterbahnen, Pixelraster, Datenpulse.
- **Mittelring:** Bahnen werden organisch, Material wechselt je Sektor (Wurzeln, Pergament, Tinte, Blaupause).
- **Außenrand + hohe Tiefe:** der Computer ist praktisch weg. Man steht in Wald, Archiv, Sternenkarte oder Atelier; nur die leuchtende Bahn erinnert noch an das Netz.
- Übergänge laufen kontinuierlich, kein harter Szenenwechsel. In Überschneidungszonen verschmelzen zwei Looks (z. B. Wurzeln mit Molekülen).
- Pro Sektor 3–4 Texturen/Ornament-Sets plus Partikel; der Rest ist prozedural. Das hält Assetgröße und Aufwand klein.

**Leichte Dreidimensionalität:** Das Netz ist keine flache Karte, sondern hat Tiefe:

- Knoten und Bahnen liegen auf mehreren Ebenen (Parallax je Ebene beim Verschieben, sanftes Neigen mit Gyroskop/Touch).
- Der Kern liegt „unten“, äußere Bereiche steigen leicht auf; Knoten werfen weiche Schatten, Bahnen haben Glanzlichter.
- Umsetzung bewusst leichtgewichtig: 2,5D mit Skia (Ebenen, Parallax, Pseudo-Perspektive per Transformationsmatrix und Schatten) statt voller 3D-Engine. Das läuft auch in Expo Go flüssig. Echtes 3D (three.js/expo-gl) bleibt optional für einzelne Elemente wie den Kern.

Navigation: Pinch-Zoom-Karte des Netzes. Weit herausgezoomt sieht man die vier Farben und die Reichweite des Spielers (ein „Fußabdruck“ des Wissens, der zugleich als Profil dient).

## 6. Gamification

### 6.1 Ressourcen

- **Bits** (weiche Währung): für richtige Antworten, Streaks, Tagesaufgaben. Kosmetik und Rückspulen.
- **Gems** (siehe 6.6): öffnen **Bereiche** (neue Teilgebiete eines Sektors) und **Trümmerfelder** (Bonus-Fundstätten mit seltenen Fragmenten). Verdienbar im Spiel, zusätzlich kaufbar.
- **Energie:** begrenzt nur Rückspulen und Bonusspiele, **nie** das Spielen selbst. Keine Wartezeit-Bezahlschranke.

### 6.2 Fortschritt

- **Integrität** (Lebensanzeige pro Lauf): sinkt bei Fehlern, regeneriert über Wiederholungen. Fällt sie auf null, gibt es einen kurzen Reparatur-Mini-Run statt Abbruch.
- **Sektor-Mastery:** pro Sektor Stufen (1–5 Sterne) nach abgedeckten Unterthemen _und_ Tiefe. Der Wissens-Fußabdruck zeigt Breite und Tiefe getrennt.
- **Kern-Level:** globales Level; schaltet neue Zonen, Fragetypen und Lore frei.
- **Codex:** Sammelalbum aller gesammelten Fragmente (mit Quelle und Bild). Wird zum persönlichen Lexikon und Wiederholungsstoff.

### 6.3 Rhythmus

- **Tages-Puls:** ein täglicher, kurzer Spezialknoten (5 Fragen) mit Streak. Streak-Schutz (zwei „Freeze“-Tage pro Monat), keine Strafen-Spirale.
- **Wochen-Event:** thematische „Störungen“ des Rauschens, z. B. „Antike-Woche“; Knoten erscheinen themenübergreifend.
- **Bosse („Firewalls“):** an den Sektorgrenzen. Mehrteilige Frage über zwei Sektoren, braucht Wissen aus beiden. Belohnung: Kern, neue Zone.

### 6.4 Sozial

- **Hack-Duell:** asynchron, gleiche Fragmente und Fragen, wer mehr behält, gewinnt.
- **Netz-Reparatur (Koop):** Freunde bauen ein gemeinsames Netz, jeder deckt sein Interessengebiet ab.
- **Vergleich der Fußabdrücke:** Überlappung und Lücken, mit der Frage „Was kannst du, was ich nicht kann?“.
- Keine globale Hetze: statt einer Weltrangliste eine **Wochenliga** in Gruppen bis 20 mit Auf- und Abstieg, freiwillig und nur mit erzeugtem Rufnamen (D47). Freundes-Ranglisten können später dazukommen.

### 6.6 Finanzierung: AdMob und Gems

**Grundsatz:** Das Hauptspiel (Netz wachsen lassen, Fragen beantworten) bleibt kostenlos und ohne Wartezeit spielbar. Geld kommt aus Werbung und optionalen Gems.

**AdMob**

- **Nach falscher Antwort** (Idee des Auftraggebers): Statt reiner Strafe als Angebot formuliert. Bolt: „Reparatur-Funk? Schau kurz zu, dann gibt's eine zweite Chance.“
  - **Rewarded Ad (freiwillig):** Zweite Chance mit neuem Versuch ohne Integritätsverlust, oder ein Hinweis-Fragment gratis.
  - **Interstitial (begrenzt):** Höchstens nach jeder dritten falschen Antwort, nie mehr als alle ca. 3 Minuten, nie mitten in Sammelphase oder Frage, nie bei Bosskämpfen. Wer Gems-Pro/„werbefrei“ hat, sieht keine.
- Zusätzlich Rewarded-Option im Tages-Puls (doppelte Bits) und für Rückspulen.
- Einwilligung über Google UMP (DSGVO), personalisierte Werbung nur nach Zustimmung; keine Werbung für Kinder-Zielgruppen. Zielgruppenfrage bleibt offen (siehe 12).

**Gem-System**

- **Gems verdienen:** Meilensteine, Bosse, Streak-Wochen, abgeschlossene Kreise, Tages-Puls, optional Rewarded Ads (Gem-Splitter).
- **Gems ausgeben:**
  - **Bereiche öffnen:** Jeder Sektor ist in Bereiche gegliedert (z. B. Wissenschaft: Physik, Chemie, Mathe, Informatik, Technik, Medizin). Der erste Bereich je Sektor ist frei, weitere kosten Gems (oder werden durch Spielfortschritt freigeschaltet, dann günstiger).
  - **Trümmerfelder öffnen:** Spezielle Fundstätten mit seltenen Fragmenten und Sammler-Boni, optional.
  - Kosmetik für dein Profil und die Bolt-Skins.
- **Kaufbar** als Paket (IAP). Es gibt nichts, was nur mit Geld geht: Alles ist auch erspielbar, Gems sparen Zeit.
- **Werbefrei-Kauf** (einmalig) oder Abo mit monatlichen Gems.
- Fairness: keine Pay-to-win-Vorteile bei Antworten, Duelle und Ranglisten bleiben unberührt.

### 6.5 Belohnungsgefühl (Juice)

Bahn leuchtet entlang des Weges, Haptik, Sound pro Sektor (Synth → Streicher/Natur/Holz je nach Zustand), Charakterreaktionen, Konfetti nur bei echten Meilensteinen.

## 7. KI-Backend (Gemini)

### 7.1 Aufgaben

1. **Fragen und Fragmente erzeugen** (strukturiertes JSON, Schema-validiert).
2. **Verzweigungen vorschlagen:** zu jedem Knoten eine Vertiefung und eine Brücke, abgestimmt auf Interessenprofil und die feste Themen-Taxonomie.
3. **Erklärungen** („Warum?“) und Mini-Lore im Ton der Charaktere.
4. **Variante** derselben Frage bei Wiederholung.

### 7.2 Qualitätssicherung (wichtig, weil Bildungsapp)

- Feste **Taxonomie** (ca. 200 Unterthemen, von Hand kuratiert) als Rückgrat; das Modell wählt innerhalb davon, erfindet nicht frei Themen.
- **Zweiter Durchlauf** als Prüfer: Ist die Antwort eindeutig? Sind Köder wirklich falsch/irrelevant? Ist die Frage aus den Fragmenten lösbar? Mit Such-Grounding, wo verfügbar.
- Quellenangabe pro Fragment im Codex.
- **Melden-Button**; gemeldete Fragen werden gesperrt und neu geprüft.
- Caching: Geprüfte Fragen kommen in einen **gemeinsamen Pool**. Personalisiert wird primär durch _Auswahl_ und _Stil_, nicht durch neue Erzeugung für jeden Klick. Das senkt Kosten und Fehlerquote.
- Modellnamen **nicht fest verdrahtet**: Konfiguration serverseitig, Provider-Interface mit Mock-Provider für Tests und Offline-Entwicklung.
- Tagesbudget und Kill-Switch gegen Kostenexplosion.

### 7.3 Interessenmodell

- Pro Spieler ein Vektor über die Taxonomie (Interesse, Kompetenz, Unsicherheit).
- Signale: Wahl Vertiefung vs. Brücke, Antwortqualität, Verweildauer im Trümmerfeld, Abbrüche, Codex-Favoriten.
- Auswahl der Vorschläge über ein **Bandit-Verfahren** (z. B. Thompson-Sampling): überwiegend passend, ein fester Anteil („Weitblick“, ca. 20 %) bewusst fremd, damit keine Filterblase entsteht.
- Kompetenz je Unterthema per Elo/IRT-ähnlichem Update steuert die Schwierigkeit.
- An Gemini geht nur eine **kurze, anonyme Profilzusammenfassung** (Top-Themen, Niveau, zu meiden), keine Personendaten.
- Transparenz: Der Spieler sieht und kann seine „Interessen-Karte“ korrigieren.

## 8. Charaktere und Assets

**Spielercharakter:** **Du selbst.** Kein Avatar-Held, sondern ein Name und optional ein kleines Profilbild; die App spricht dich direkt an. Auf der Karte wird dein Standort im Netz durch einen Cursor/Lichtpunkt markiert, Personalisierung (Farbe, Spur-Effekt) über Gems.

**Begleiter: Bolt**
Kleiner, runder Schwebe-Roboter mit großem Display-Gesicht (Augen und Mund als Animation), Antenne und einem Greifarm zum Einsammeln. Neugierig, eifrig, ein bisschen tollpatschig, liebt Wortwitz. Gibt Tipps, kommentiert Antworten, jubelt und tröstet, spottet leise zurück gegen MORPH. Wächst mit dem Netz: Sein Gehäuse bekommt in äußeren Sektoren Moos, Farbspritzer, Pergamentaufkleber oder Sternenstaub. Als Skins freischaltbar.

**Sektor-Hüter** (mit Persönlichkeit, Dialogzeilen, Boss-Rolle):

- **Quantis** – Naturwissenschaften: übergenauer, trockener Humor, Hologramm-Gestalt aus Gleichungen.
- **Rhizom** – Geographie & Erde: ruhiger Baumgeist, spricht in langen Bildern, verbindet Berge, Flüsse und Sterne.
- **Kodex** – Gesellschaft: Eule mit Tintenfeder und Gesetzesrolle, zitiert gern, irrt nie, behauptet er.
- **Muse** – Geisteswissenschaften & Kultur: dramatisch, warm, spricht in Reimen, Gestalt aus Farbe und Noten.

**Gegenspieler: MORPH**
Die außer Kontrolle geratene KI, die das Archiv zerstört hat. Optisch ein wandelndes Gesicht aus Pixelrauschen, das sich ständig umformt (Lächeln, Brille, Krone), mit sanfter, schmeichelnder Stimme. Das **Rauschen** ist seine Wirkung: Wo MORPH war, ist Wissen verwaschen. Seine Helfer, die **Glitches**, sind kleine Störwesen und tragen die Köder-Fragmente. Pro Sektor gibt es einen MORPH-Auftritt als Boss; sein Endkampf ist ein Wissensduell, in dem Verstehen schlägt Abkürzen.

**Asset-Liste für den Prototyp:**

- Bolt (8 Gesichtsausdrücke, 4 Posen), MORPH (5 Formen, Rauschen-Animation), 4 Hüter (je Portrait + 2 Posen), Glitch (3 Varianten).
- Knoten-Icons (offen, gelöst, beschädigt, Boss, Tages-Puls), Fragment-Karten-Rahmen je Sektor.
- 4 Sektor-Textursets + Kern-Platinenset, Partikel.
- UI-Sounds pro Sektor, 4 Musikschleifen.
- Alles zunächst als Vektor/SVG und prozedural, später ggf. illustriert; Rechte sauber dokumentieren.

## 9. Bildschirme

1. **Onboarding:** Bolt weckt dich im Kern, erster Knoten als Tutorial, Interessen-Abfrage als Spiel (du wählst Bahnen) statt Formular.
2. **Netzkarte:** zoombarer Graph, Sektorfarben, freigeschaltete und offene Knoten, Tages-Puls-Marker.
3. **Knoten-Ansicht:** Trümmerfeld → Cache → Frage → Auflösung.
4. **Codex:** Fragmente nach Sektor/Thema, Suchfunktion, Wiederholungsmodus.
5. **Profil/Fußabdruck:** Breite/Tiefe, Streaks, Erfolge, Freunde.
6. **Duelle und Events.**
7. **Einstellungen:** Sprache, Barrierefreiheit (Farbenblind-Palette, Reduce Motion, Text größer, Vorlesen), Datenschutz, Daten löschen.

## 10. Technik (Vorschlag)

- **App:** Expo (React Native, TypeScript strict), Expo Router, React Native Skia (Shader-Hintergrund, Graph, 2,5D), Reanimated/Gesture Handler.
- **Expo Go für erste Tests:** Skia, Reanimated, Gesture Handler, Haptik, expo-av/audio laufen in Expo Go. **Nicht** in Expo Go: AdMob (`react-native-google-mobile-ads`), RevenueCat/IAP und natives Firebase. Darum gilt von Anfang an: jeder dieser Dienste hinter einem Provider-Interface mit **Mock-Provider als Standard** (Mock-Ads zeigen ein Platzhalter-Overlay, Mock-Kauf vergibt Gems, Mock-Backend speichert lokal in `AsyncStorage`). Echte Provider werden erst im Development Build (EAS) zugeschaltet. Die Mock-Daten-Phase läuft damit komplett in Expo Go.
- **Backend:** Firebase (Auth, Firestore, Cloud Functions 2nd gen; im Client das JS-SDK statt natives), Gemini hinter einem Provider-Interface; Mock-Provider für Tests und Prototyp.
- **Monorepo:** `apps/mobile`, `functions`, `packages/shared` (Zod-Schemas, Taxonomie, **reine Logik**: Graph-Wachstum, Schwierigkeit, Bandit-Auswahl, Scoring, Spaced Repetition, jeweils mit Unit-Tests).
- **Offline:** vorgeladener Pool geprüfter Fragen, damit die App ohne Netz spielbar ist.
- **Datenschutz:** anonyme Anmeldung zuerst, Konto optional, Export/Löschung, keine Personendaten an das Modell.

**Datenmodell (grob):**

```
taxonomy/{topicId}      { name, sector, parent, neighbors[], difficultyBand }
questions/{qid}         { topics[], sectors[], type, stem, answer, distractors, fragments[], explanation, sources[], status, reports }
users/{uid}/network/{nodeId}  { questionId, parentId, kind: deepen|bridge, state: open|solved|damaged, pos, attempts }
users/{uid}/profile     { interestVec, skill{topicId}, streak, currencies }
users/{uid}/codex/{fid} { fragmentId, seenAt, srsDue }
```

## 11. Roadmap

| Phase | Inhalt                                                                                                                | Abnahme                                   |
| ----- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| 0     | Repo, Tooling, Taxonomie-Entwurf, Design-Tokens                                                                       | Lint/Typecheck/Tests grün                 |
| 1     | **Reiner Spielkern:** Graph-Wachstum, Fragenablauf, Schwierigkeit, Scoring (Shared + Tests)                           | Simulation spielt 1000 Knoten ohne Fehler |
| 2     | **Vertical Slice in Expo Go:** Kern + 1 Sektor, Mock-Fragen und Mock-Ads/Gems, Netzkarte in 2,5D, Knoten-Ablauf, Bolt | 10 Minuten spielbar per QR-Code           |
| 3     | 4 Sektoren, Überschneidungszonen, Shader-Übergänge                                                                    | Optik-Auflösung sichtbar                  |
| 4     | Gemini-Pipeline + Prüfer, Pool, Meldefunktion                                                                         | Fehlerquote in Stichprobe < 2 %           |
| 5     | Interessenmodell, Bandit, Weitblick-Quote                                                                             | A/B im Simulator                          |
| 6     | Gamification: Codex, Tages-Puls, Bosse, Streaks, Charaktere                                                           | Retention-Test intern                     |
| 7     | Soziales (Duelle, Koop), Events                                                                                       |                                           |
| 8     | Politur, Barrierefreiheit, Store-Vorbereitung                                                                         |                                           |

## 12. Risiken und offene Fragen

- **Faktenfehler der KI** sind das größte Risiko. Gegenmittel: Taxonomie, Prüfer-Durchlauf, Quellen, Meldefunktion, Pool statt Frischgenerierung.
- **Merk-Mechanik zu schwer oder zu leicht:** Cache-Größe, Fragmentzahl und Rückspulen müssen im Playtest getunt werden.
- **Shader-Performance** auf älteren Geräten: Qualitätsstufen und Fallback auf statische Texturen.
- **Rechte an Bildern/Quellen** der Fragmente (nur frei lizenzierte Inhalte, Attribution).
- **Kosten:** Budgetdeckel und Kill-Switch von Anfang an.

**Entschieden:** Ton leicht verspielt · Prototyp zuerst mit Mock-Daten · erste Tests in Expo Go · Finanzierung über AdMob und Gems · Spielcharakter bist du selbst.

**Noch offen:**

1. Zielgruppe: Erwachsene oder auch Jugendliche? (Beeinflusst Werbung nach Fehlern und Einwilligungen; unter 16 bräuchte es strengere Regeln.)
2. Endgültiger Name (Arbeitstitel NEXUS), ebenso Namen von Bolt/MORPH, falls dir andere besser gefallen.
3. Interstitials nach Fehlern: Soll die Standardvariante „freiwillig (Rewarded)“ sein, mit seltenen Zwangsanzeigen, wie oben vorgeschlagen?
