# NEXUS – Konzept (Arbeitstitel)

> Ein Wissens-Quiz im zerstörten Netzwerk: Du baust von einem zentralen Chip aus Bahnen wieder auf, sammelst verstreute Datenfragmente, merkst sie dir und beantwortest damit Fragen. Jede richtige Antwort öffnet zwei neue Knoten – tiefer oder breiter. Je weiter du nach außen kommst, desto weniger sieht die Welt nach Computer aus.

Status: Entwurf v0.1 · Sprache: Deutsch zuerst, Englisch danach · Plattform: iOS/Android (Expo)

---

## 1. Vision und Ziel

- **Nutzen:** Aufbau eines soliden, breiten Allgemeinwissens, mit Raum für Nischenwissen.
- **Gefühl:** Entdecken und Wiederaufbauen statt Abfragen. Jeder Knoten ist ein kleines Erfolgserlebnis, das Netz wächst sichtbar.
- **Kernidee:** Wissen wird nicht nur abgerufen, sondern *gesammelt und behalten* (Fragmente einsammeln → merken → anwenden).
- **Personalisierung:** Ein Gemini-Backend erzeugt Fragen und Fragmente; ein Interessenmodell steuert, was als Nächstes angeboten wird.

## 2. Setting und Story

**Das Geflecht** war ein weltumspannendes Netz aus Wissen. Ein Ereignis, **der Ausfall**, hat es zerrissen. Übrig ist der **Kern**, ein einzelner Chip, der gerade wieder hochfährt – ohne Erinnerung.

Du bist die **Wiederherstellungs-Instanz**: Du fährst Bahnen aus dem Kern, holst verstreute Daten aus den Trümmern zurück und stabilisierst das Netz. Mit jedem Sektor kehren Erinnerungen des Kerns zurück (Lore-Fragmente), und es wird klar, was den Ausfall verursacht hat: **das Rauschen**, eine Entropie-Macht, die Wissen in Unsinn auflöst.

Die Story ist bewusst leicht: Sie trägt Motivation und Charme, nie Textwände.

## 3. Spielstruktur: das Netz

### 3.1 Die vier Sektoren

Vier Himmelsrichtungen um den Kern, jede mit eigener Farbe und eigenem Weltcharakter:

| Sektor | Inhalt | Farbe | Endzustand der Optik |
|---|---|---|---|
| **Wissenschaft & Technik** | Physik, Chemie, Mathe, Informatik, Technik, Medizin | Cyan | Blaupausen → Labor → Sternenkarten und Moleküle |
| **Natur & Welt** | Biologie, Geografie, Klima, Tiere, Reisen, Ernährung | Grün | Leiterbahnen → Wurzeln → Wald, Küsten, Gebirge |
| **Geschichte & Gesellschaft** | Geschichte, Politik, Wirtschaft, Recht, Philosophie | Bernstein | Bahnen → Stein und Pergament → Karten und Ruinen |
| **Kultur & Kunst** | Literatur, Musik, Kunst, Film, Sprache, Religion | Magenta | Neonstreifen → Farbe und Tinte → Noten, Bühnen, Skulpturen |

Die Sektoren liegen im Ring (Wissenschaft – Natur – Kultur – Geschichte). Zwischen **benachbarten** Sektoren liegen **Überschneidungszonen**: Medizin und Biologie, Kunstgeschichte, Wissenschaftsgeschichte, Reisen und Kulinarik. Eine Frage mit zwei Themen erscheint in der Zone dazwischen und zählt für beide Sektoren.

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

Navigation: Pinch-Zoom-Karte des Netzes. Weit herausgezoomt sieht man die vier Farben und die Reichweite des Spielers (ein „Fußabdruck“ des Wissens, der zugleich als Profil dient).

## 6. Gamification

### 6.1 Ressourcen
- **Bits** (weiche Währung): für richtige Antworten, Streaks, Tagesaufgaben. Kosmetik und Rückspulen.
- **Kerne** (selten): Meilensteine, Bosse. Schalten Sektor-Skins und Sondermissionen frei.
- **Energie:** begrenzt nur Rückspulen und Bonusspiele, **nie** das Spielen selbst. Keine Wartezeit-Bezahlschranke.

### 6.2 Fortschritt
- **Integrität** (Lebensanzeige pro Lauf): sinkt bei Fehlern, regeneriert über Wiederholungen. Fällt sie auf null, gibt es einen kurzen Reparatur-Mini-Run statt Abbruch.
- **Sektor-Mastery:** pro Sektor Stufen (1–5 Sterne) nach abgedeckten Unterthemen *und* Tiefe. Der Wissens-Fußabdruck zeigt Breite und Tiefe getrennt.
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
- Rangliste nur unter Freunden, keine globale Hetze.

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
- Caching: Geprüfte Fragen kommen in einen **gemeinsamen Pool**. Personalisiert wird primär durch *Auswahl* und *Stil*, nicht durch neue Erzeugung für jeden Klick. Das senkt Kosten und Fehlerquote.
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

**Spielercharakter:** kleiner anpassbarer **Funke** (Lichtwesen), das auf den Bahnen läuft. Skins/Formen per Kernen.

**Guide: Byte**
Freundlicher Lötzinn-Käfer mit Chip-Panzer, neugierig und leicht tollpatschig. Gibt Tipps, kommentiert Antworten, wächst mit dem Netz (sein Panzer wird in äußeren Sektoren zu Blatt, Pergament, Farbe, …).

**Sektor-Hüter** (mit Persönlichkeit, Dialogzeilen, Boss-Rolle):
- **Quantis** – Wissenschaft: übergenauer, trockener Humor, Hologramm-Gestalt aus Gleichungen.
- **Rhizom** – Natur: ruhiger Baumgeist, spricht in langen Bildern, mag Tiere.
- **Kodex** – Geschichte: Archivar-Eule mit Tintenfeder, zitiert gern, irrt nie, behauptet er.
- **Muse** – Kultur: dramatisch, warm, spricht in Reimen/Rhythmus, Gestalt aus Farbe und Noten.

**Gegenspieler: das Rauschen**
Statisches Flimmern, das Fragmente mit Unsinn überlagert. Seine Diener, die **Glitches**, sind Köder-Fragmente mit Gesicht. Der Endboss ist keine Zerstörung, sondern Verständnis: das Rauschen „vergisst“, weil niemand fragt.

**Asset-Liste für den Prototyp:**
- Byte (6 Posen), Funke (Idle/Run/Jubel), 4 Hüter (je Portrait + 2 Posen), Glitch (3 Varianten).
- Knoten-Icons (offen, gelöst, beschädigt, Boss, Tages-Puls), Fragment-Karten-Rahmen je Sektor.
- 4 Sektor-Textursets + Kern-Platinenset, Partikel.
- UI-Sounds pro Sektor, 4 Musikschleifen.
- Alles zunächst als Vektor/SVG und prozedural, später ggf. illustriert; Rechte sauber dokumentieren.

## 9. Bildschirme

1. **Onboarding:** Byte im Kern, erster Knoten als Tutorial, Interessen-Abfrage als Spiel (Funke wählt Bahnen) statt Formular.
2. **Netzkarte:** zoombarer Graph, Sektorfarben, freigeschaltete und offene Knoten, Tages-Puls-Marker.
3. **Knoten-Ansicht:** Trümmerfeld → Cache → Frage → Auflösung.
4. **Codex:** Fragmente nach Sektor/Thema, Suchfunktion, Wiederholungsmodus.
5. **Profil/Fußabdruck:** Breite/Tiefe, Streaks, Erfolge, Freunde.
6. **Duelle und Events.**
7. **Einstellungen:** Sprache, Barrierefreiheit (Farbenblind-Palette, Reduce Motion, Text größer, Vorlesen), Datenschutz, Daten löschen.

## 10. Technik (Vorschlag)

- **App:** Expo (React Native, TypeScript strict), Expo Router, React Native Skia (Shader-Hintergrund, Graph), Reanimated/Gesture Handler.
- **Backend:** Firebase (Auth, Firestore, Cloud Functions 2nd gen), Gemini hinter einem Provider-Interface; Mock-Provider für Tests.
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

| Phase | Inhalt | Abnahme |
|---|---|---|
| 0 | Repo, Tooling, Taxonomie-Entwurf, Design-Tokens | Lint/Typecheck/Tests grün |
| 1 | **Reiner Spielkern:** Graph-Wachstum, Fragenablauf, Schwierigkeit, Scoring (Shared + Tests) | Simulation spielt 1000 Knoten ohne Fehler |
| 2 | **Vertical Slice:** Kern + 1 Sektor, Mock-Fragen, Netzkarte, Knoten-Ablauf | 10 Minuten spielbar |
| 3 | 4 Sektoren, Überschneidungszonen, Shader-Übergänge | Optik-Auflösung sichtbar |
| 4 | Gemini-Pipeline + Prüfer, Pool, Meldefunktion | Fehlerquote in Stichprobe < 2 % |
| 5 | Interessenmodell, Bandit, Weitblick-Quote | A/B im Simulator |
| 6 | Gamification: Codex, Tages-Puls, Bosse, Streaks, Charaktere | Retention-Test intern |
| 7 | Soziales (Duelle, Koop), Events | |
| 8 | Politur, Barrierefreiheit, Store-Vorbereitung | |

## 12. Risiken und offene Fragen

- **Faktenfehler der KI** sind das größte Risiko. Gegenmittel: Taxonomie, Prüfer-Durchlauf, Quellen, Meldefunktion, Pool statt Frischgenerierung.
- **Merk-Mechanik zu schwer oder zu leicht:** Cache-Größe, Fragmentzahl und Rückspulen müssen im Playtest getunt werden.
- **Shader-Performance** auf älteren Geräten: Qualitätsstufen und Fallback auf statische Texturen.
- **Rechte an Bildern/Quellen** der Fragmente (nur frei lizenzierte Inhalte, Attribution).
- **Kosten:** Budgetdeckel und Kill-Switch von Anfang an.

**Entscheidungen, die ich von dir brauche:**
1. Name und Tonalität: eher verspielt (Byte & Co.) oder eher cool/ernst?
2. Monetarisierung: komplett kostenlos, Abo, oder kosmetische Käufe?
3. Zielgruppe: Erwachsene, Jugendliche ab 14, oder beide mit Modus?
4. Reihenfolge: Prototyp zuerst mit Mock-Daten (Phase 1–2) oder direkt Gemini-Anbindung?
