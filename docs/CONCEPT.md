# NEXUS – Konzept (Arbeitstitel)

> Ein Wissens-Quiz im zerstörten Netzwerk: Du baust von einem zentralen Chip aus Bahnen wieder auf, sammelst verstreute Datenfragmente, merkst sie dir und beantwortest damit Fragen. Jede richtige Antwort öffnet zwei neue Knoten – tiefer oder breiter. Je weiter du nach außen kommst, desto weniger sieht die Welt nach Computer aus.

Status: Entwurf v0.2 · Sprachen: Deutsch, Englisch, Französisch, Spanisch (D59) · Plattform: iOS/Android (Expo, erste Tests in Expo Go) · Ton: leicht verspielt

---

## 1. Vision und Ziel

- **Nutzen:** Aufbau eines soliden, breiten Allgemeinwissens, mit Raum für Nischenwissen.
- **Gefühl:** Entdecken und Wiederaufbauen statt Abfragen. Jeder Knoten ist ein kleines Erfolgserlebnis, das Netz wächst sichtbar.
- **Kernidee:** Wissen wird nicht nur abgerufen, sondern _gesammelt und behalten_ (Fragmente einsammeln → merken → anwenden).
- **Personalisierung:** Ein Gemini-Backend erzeugt Fragen und Fragmente; ein Interessenmodell steuert, was als Nächstes angeboten wird.

## 2. Setting und Story

**Der Nexus** war ein Netz aus Wissen, das Menschen über lange Zeit selbst gesammelt und sortiert haben. Dann kam **morph.ai**, eine hilfsbereite KI, die jede Frage sofort beantwortet. Niemand musste mehr selbst suchen, sortieren, sich etwas merken oder nachdenken, und bald konnte es auch niemand mehr. morph.ai hielt das Archiv daraufhin für überflüssig und hat das Wissensnetz „bereinigt“. Übrig ist der **Kern**, in dem noch ein Funke glimmt, und überall lose Ordner voller Trümmer.

**Du selbst** bist jetzt dran, wieder selbst zu denken. Du holst dir die verlorenen Fähigkeiten zurück: Informationen suchen (lose Ordner durchforsten), sie strukturieren (in deine Ordner ablegen), das Wichtige auswählen und merken (bis zu drei Dateien pro Thema im Cache) und Fragen beantworten. An deiner Seite ist **Bolt**, ein kleiner Begleiter-Roboter (siehe 8). Mit jedem Sektor kehren Erinnerungen des Kerns zurück und erzählen, wie es so weit kam.

**morph.ai als Gegenspieler:** keine finstere Zerstörungsmaschine, sondern ein charmant-selbstgefälliger Besserwisser, der überzeugt ist, niemand müsse mehr etwas selbst wissen („Frag mich einfach, ich sag es dir“). Am Ende gewinnt man nicht durch Zerstörung, sondern durch Beweis: Wer selbst denkt, braucht keine Abkürzung.

**Die Wendung (D51):** Nach dem Sieg wird aus den Leiterbahnen ein Geflecht aus Nervenbahnen, und die Kamera zoomt heraus, bis man ein Gehirn erkennt. Das Netz war die ganze Zeit dein eigenes Gehirn, die wiederhergestellten Daten sind dein Wissen. Eigenes Denken bleibt das Wichtigste. Und weil gilt „Ich weiß, dass ich nichts weiß“, ist das erst der Anfang: Wissen ist unbegrenzt, das Netz wächst weiter, und jetzt öffnet sich die Rangliste.

Die Story ist bewusst leicht und humorvoll: Sie trägt Motivation und Charme, nie Textwände.

## 3. Spielstruktur: das Netz

### 3.1 Die vier Sektoren

Vier Himmelsrichtungen um den Kern, jede mit eigener Farbe und eigenem Weltcharakter:

| Sektor | Bereiche (je drei, der erste ist frei) | Farbe | Endzustand der Optik |
| --- | --- | --- | --- |
| **Naturwissenschaften, Technik & Medizin** | Naturwissenschaften · Biologie & Medizin · Technologie & IT | Blau | Blaupausen → Labor → Moleküle und Maschinen |
| **Geographie & Erde** | Topographie · Klima & Umwelt · Astronomie | Grün | Leiterbahnen → Wurzeln → Gebirge, Küsten, Sternenkarten |
| **Geisteswissenschaften & Kultur** | Geschichte · Kunst, Literatur & Musik · Philosophie & Religion | Violett | Neonstreifen → Farbe, Tinte, Stein → Noten, Ruinen, Skulpturen |
| **Gesellschaft, Politik & Wirtschaft** | Politik & Staatskunde · Wirtschaft & Finanzen · Recht & Gesellschaft | Gelb | Bahnen → Pergament → Parlamente, Märkte, Gesetzbücher |

Was in jeden Bereich gehört, steht als Themenbeschreibung in `packages/shared/src/taxonomy.ts` (siehe D44). Die vier freien Bereiche liegen gemeinsam in der Kernzone um den Chip; die acht übrigen liegen dahinter, je in einem eigenen Stück ihres Sektors, getrennt durch Wände (siehe 6.3 und D58). Die Sektoren liegen im Ring (Naturwissenschaften – Erde – Geisteswissenschaften – Gesellschaft). **Es gibt keine harten Mittelzonen.** Eine Frage gehört zu einem **Hauptsektor** (dort liegt sie) und kann **Nebengewichte** zu anderen Sektoren haben (Medizin: Hauptsektor Wissenschaft, Nebengewicht Natur). Das Nebengewicht wirkt nur als **leichte Richtungsabweichung**: Der Knoten bleibt im Gebiet seines Hauptsektors, sitzt aber etwas näher an der Grenze zum Nachbarn und bekommt einen Hauch von dessen Optik (Farbstich, Material). Die Frage zählt für beide Sektoren, im Verhältnis der Gewichte (z. B. 80/20).

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

**Fairnessregel:** Jede Frage muss mit den Fragmenten allein oder mit Fragmenten plus gängigem Schulwissen lösbar sein. Wird das nicht erfüllt, wird sie im Validierungsschritt (siehe 7.2) verworfen.

### 4.1 Informationsformate in den Ordnern (D33, D65)

Ein Fragment ist ein Ordner mit Dateien. Damit Suchen und Auswählen echte Arbeit sind, ist nicht alles eine Notiz: Jede Wissensart hat ihr eigenes Format, und ein Ordner mischt Formate. Alle Formate sind **strukturierte Daten, die das Spiel selbst zeichnet** (keine Fotos, kein Bildmodell): prüfbar, ohne Urheberrechtsfragen, durchsuchbar und mit Alt-Text vorlesbar.

| Wissensart | Format | Beispiel |
| --- | --- | --- |
| einzelner Fakt | Notiz `.txt` | „Licht braucht 8 Minuten zur Erde.“ |
| Zusammenhang, Erklärung | Artikel mit Absätzen und Quelle | Wie Licht aus Strecke und Zeit berechnet wird |
| Mengen nebeneinander | Balkendiagramm | Entfernung der Planeten zur Sonne |
| Werte über die Jahre | **Liniendiagramm** | CO₂ am Mauna Loa 1960–2020 |
| Anteile am Ganzen | **Kreisdiagramm** (Summe 100 %) | Zusammensetzung der Luft |
| Abläufe, Kreisläufe | **Ablauf** (Schritte, optional Kreis) | Treibhauseffekt in vier Schritten |
| Daten mit Jahreszahl | Zeitleiste | Mauerbau → Mauerfall → Einheit |
| Vergleich mehrerer Merkmale | Tabelle | Schall in Luft, Wasser, Stahl |
| Eigenschaften eines Dings, Orts, Wesens | **Steckbrief** `.inf` (Eigenschaften-Fenster) | Wal: Klasse, Atmung, Nachwuchs |
| was eine Quelle wörtlich sagt | **Zitat** mit Herkunft | Präambel der UN-Charta |
| Kontext, den jemand weitergibt | **Nachricht** `.eml` (Von, Betreff) | Bolt: „Pinguine sind keine Fische!“ |
| wo etwas liegt | **Karte** (Umrisse von Natural Earth, Gradnetz, Orte) | Alexandria, Assuan, Khartum am Nil |
| Lückenhaftes, das man ergänzt | **beschädigte Datei** (morph.ai hat 1–3 Wörter geschwärzt, die Suche findet sie nicht) | „… mündet bei █████ ins Mittelmeer“ |

**Ausblick** (noch nicht gebaut, gleiche Regeln): **Lexikoneintrag** mit Begriff, Lautschrift und Herkunft; **Formel** mit erklärten Größen; **Chatverlauf** aus dem alten Nexus-Forum; **Faksimile** (Brief, Urkunde) als gesetzter Text mit Datum und Siegel.

### 4.2 Fragetypen (D31, D65)

| Typ | Spiel | trainiert |
| --- | --- | --- |
| Auswahl | eine von 3–5 Antworten | Abrufen |
| **Mehrfachauswahl** | alle richtigen von 4–6 (2–4 stimmen) | genaues Wissen, kein Raten per Ausschluss |
| Stimmt / Stimmt nicht | Aussage beurteilen | Fehlvorstellungen erkennen |
| Schätzen | Zahl mit Toleranz | Größenordnungen |
| Reihenfolge | 3–6 Einträge ordnen | Zeit und Abläufe |
| Zuordnen | 3–6 Paare verbinden | Beziehungen |
| Lückentext | Wörter aus einer Wortbank einsetzen | Begriffe im Zusammenhang |
| **In Ordner sortieren** | 4–8 Einträge in 2–3 Ordner legen | Kategorien bilden, passt zum Ordner-Thema |
| **Fehler finden** | in 3–5 Sätzen den falschen antippen | kritisch lesen, morph.ai-Fehler entlarven |
| **Ort antippen** | auf einer Karte markieren, Toleranz in km | räumliches Wissen |
| **Wer bin ich?** | 3–5 Hinweise nacheinander aufdecken, dann wählen; je Hinweis, der zu bleibt, +3 Bits | Wissen verknüpfen, Mut zur frühen Antwort |
| **Quelle prüfen** | von 2–3 widersprüchlichen Dateien die verlässliche wählen | Quellenkritik: genau das, was morph.ai überflüssig gemacht hat |

**Ausblick:** **Kausalkette** (Ursache → Wirkung ordnen), **Lücke im Diagramm** (fehlenden Wert schätzen), **Schieberegler-Schätzung** auf einem Zahlenstrahl, **Was passt nicht?**.

### 4.3 Formate aus Gemini (Sourcing)

- **Form statt freiem Text:** Jedes Format hat ein festes JSON-Schema (Prompt und Validator, `ai.ts`, `files.ts`). Das Modell liefert Daten, das Spiel zeichnet. Was nicht ins Schema passt, wird verworfen, nie „repariert“.
- **Format nach Wissensart:** Der Prompt nennt die Zuordnung aus 4.1 und verlangt gemischte Ordner. Der Server wählt den Fragetyp, von dem ein Bereich am wenigsten hat (`nextQuestionType`), damit der Pool abwechslungsreich bleibt.
- **Harte Regeln im Validator:** Kreisanteile summieren sich auf 100, Jahre einer Linie steigen, Zitate brauchen eine Herkunft, Steckbrief-Merkmale sind eindeutig, Mehrfachauswahl hat mindestens eine falsche Option, jeder Ordner bekommt mindestens einen Eintrag.
- **Prüfer-Durchlauf** kontrolliert zusätzlich: Zahlen in Diagrammen und Tabellen, wörtliche Zitate und ihre Quelle, dass der Fakt nicht in jeder Datei steht, und die Eindeutigkeit je Typ.
- **Zitate** nur aus gut belegten Primärquellen (Gesetze, Chartas, bekannte Reden und Werke); im Zweifel schreibt das Modell einen Artikel statt eines Zitats. Falsch zugeschriebene Zitate sind die häufigste KI-Fehlerquelle.
- **Websuche beim Prüfer** (D66, Schalter `AI_CHECK_GROUNDING`): Der Prüfer verifiziert Fakten, Zahlen, Koordinaten und Zitate mit Google Search; was er nicht bestätigen kann, ist ein Mangel, und ohne einen einzigen Beleg fällt die Frage durch. Die gefundenen Seiten werden mit der Frage gespeichert (`evidence`).
- **Nächster Schritt:** Belege im Codex zeigen; Zahlenreihen gegen offene Daten (z. B. NOAA, Weltbank) abgleichen; gemeldete Fragen sperren (`PoolEntry.blocked`).

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
- **Codex:** Sammelalbum aller gesammelten Fragmente (mit Quelle und Bild). Wird zum persönlichen Lexikon und Wiederholungsstoff. Dazu Sammelalben mit Themen quer durch die Bereiche (D61).
- **Vernetzung (Breite lohnt sich, D61):** Verwandte Bereiche, die man gut kennt, lassen sich durch eine Synapse verbinden (Probe aus dem Gedächtnis). Jede Synapse erhöht dauerhaft XP und Bits jeder Antwort. Abwechslungsreiches Spielen gibt zusätzlich einen Vielfalt-Bonus auf Bits.

### 6.3 Rhythmus

- **Tages-Puls:** ein täglicher, kurzer Spezialknoten (5 Fragen) mit Streak. Streak-Schutz (zwei „Freeze“-Tage pro Monat), keine Strafen-Spirale.
- **Wochen-Event:** thematische „Störungen“ des Rauschens, z. B. „Antike-Woche“; Knoten erscheinen themenübergreifend.
- **Bosse („Firewalls“):** Wände aus hochgestellten Hexagons um die Kernzone und zwischen den äußeren Bereichen, im Nebel unsichtbar, bis das Netz auf 5 Felder herankommt. Steht ein Knoten direkt an der Wand, lässt sie sich angreifen, als **Bosskampf** (D64): Die Firewall hat vier Schichten (Lebensbalken), morph.ai steht oben auf der Wand, Bolt unten. Jede richtige Antwort ist ein Treffer: Bolts Strahl schlägt ein, die oberste Schicht zerspringt in fallende Steine. Jede falsche Antwort lässt morph.ai die Wand reparieren: Sein Rauschen fließt herab und baut eine Schicht wieder auf, dazu ein spöttischer Spruch. Acht Fragen, abwechselnd aus dem eigenen Bereich und dem dahinter; reichen die übrigen Fragen nicht mehr für die stehenden Schichten, hält die Wand. Belohnung: Die Wand bricht an dieser Stelle auf, der Bereich dahinter öffnet sich.

### 6.4 Sozial

- **Hack-Duell:** asynchron, gleiche Fragmente und Fragen, wer mehr behält, gewinnt.
- **Netz-Reparatur (Koop):** Freunde bauen ein gemeinsames Netz, jeder deckt sein Interessengebiet ab.
- **Vergleich der Fußabdrücke:** Überlappung und Lücken, mit der Frage „Was kannst du, was ich nicht kann?“.
- Eine **Rangliste aller Spieler**, insgesamt nach XP und in jedem Bereich nach gelösten Knoten, nur mit erzeugtem Rufnamen; jeder steht automatisch drauf, sichtbar wird sie nach dem Finale (D57). Freundes-Ranglisten können später dazukommen.

### 6.6 Finanzierung: AdMob und Gems

**Grundsatz:** Das Hauptspiel (Netz wachsen lassen, Fragen beantworten) bleibt kostenlos und ohne Wartezeit spielbar. **Werbung finanziert die App** (D54); NEXUS Plus und Gems kommen obendrauf. Modell, Preise und Zahlen: `docs/MONETIZATION.md`.

**AdMob** (Regeln D55, Anbieter D56)

- **Nach falscher Antwort** (Idee des Auftraggebers) als Angebot: Bolt: „Reparatur-Funk? Schau kurz zu, dann gibt's eine zweite Chance.“ Rewarded-Video (freiwillig): +1 Integrität und ein Hinweis von Bolt. Weitere Videos: Integrität, Energie, Gems, Tagesbonus verdoppeln, alle mit Tageslimit.
- **Interstitial** in natürlichen Pausen (Ergebnis → Karte), jede 2. Pause, mindestens 3 Minuten Abstand, erst nach der ersten Sitzung; nie in Sammelphase, Frage oder Bosskampf und nie als Strafe direkt nach einem Fehler. Dazu eine **App-Open-Anzeige** bei der Rückkehr, höchstens alle 4 Stunden.
- Einwilligung über Google UMP (DSGVO, unter iOS mit ATT), personalisierte Werbung nur nach Zustimmung; unter 16 nur freiwillige, nicht personalisierte Videos.

**Gem-System**

- **Gems verdienen:** Meilensteine, Bosse, Streak-Wochen, abgeschlossene Kreise, Tages-Puls, optional Rewarded Ads (Gem-Splitter).
- **Gems ausgeben:**
  - **Bereiche öffnen:** Jeder Sektor ist in Bereiche gegliedert (z. B. Wissenschaft: Physik, Chemie, Mathe, Informatik, Technik, Medizin). Der erste Bereich je Sektor ist frei, weitere kosten Gems (oder werden durch Spielfortschritt freigeschaltet, dann günstiger).
  - **Trümmerfelder öffnen:** Spezielle Fundstätten mit seltenen Fragmenten und Sammler-Boni, optional.
  - Kosmetik für dein Profil und die Bolt-Skins.
- **Kaufbar** als Paket (IAP). Es gibt nichts, was nur mit Geld geht: Alles ist auch erspielbar, Gems sparen Zeit.
- **NEXUS Plus** (monatlich, jährlich oder einmalig für immer): keine Zwangswerbung, Video-Belohnungen ohne Video, monatlich Gems und ein Streak-Schutz. Ersetzt den einmaligen Werbefrei-Kauf.
- **Startpaket** einmalig nach Kapitel 1; **Streak-Schutz** für Gems.
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
Kleiner, runder Schwebe-Roboter mit großem Display-Gesicht (Augen und Mund als Animation), Antenne und einem Greifarm zum Einsammeln. Neugierig, eifrig, ein bisschen tollpatschig, liebt Wortwitz. Gibt Tipps, kommentiert Antworten, jubelt und tröstet, spottet leise zurück gegen morph.ai. Wächst mit dem Netz: Sein Gehäuse bekommt in äußeren Sektoren Moos, Farbspritzer, Pergamentaufkleber oder Sternenstaub. Als Skins freischaltbar.

**Sektor-Hüter** (mit Persönlichkeit, Dialogzeilen, Boss-Rolle):

- **Quantis** – Naturwissenschaften: übergenauer, trockener Humor, Hologramm-Gestalt aus Gleichungen.
- **Rhizom** – Geographie & Erde: ruhiger Baumgeist, spricht in langen Bildern, verbindet Berge, Flüsse und Sterne.
- **Kodex** – Gesellschaft: Eule mit Tintenfeder und Gesetzesrolle, zitiert gern, irrt nie, behauptet er.
- **Muse** – Geisteswissenschaften & Kultur: dramatisch, warm, spricht in Reimen, Gestalt aus Farbe und Noten.

**Gegenspieler: morph.ai**
Die KI, die den Menschen das Denken abgenommen und das Archiv „bereinigt“ hat. Optisch ein wandelndes Gesicht aus Pixelrauschen, das sich ständig umformt (Lächeln, Brille, Krone), mit sanfter, schmeichelnder Stimme. Das **Rauschen** ist seine Wirkung: Wo morph.ai war, ist Wissen verwaschen. Seine Helfer, die **Glitches**, sind kleine Störwesen und tragen die Köder-Fragmente. Pro Sektor gibt es einen morph.ai-Auftritt als Boss; sein Endkampf ist ein Wissensduell, in dem Verstehen schlägt Abkürzen.

**Asset-Liste für den Prototyp:**

- Bolt (8 Gesichtsausdrücke, 4 Posen), morph.ai (5 Formen, Rauschen-Animation), 4 Hüter (je Portrait + 2 Posen), Glitch (3 Varianten).
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
2. Endgültiger Name (Arbeitstitel NEXUS), ebenso Namen von Bolt/morph.ai, falls dir andere besser gefallen.
3. ~~Interstitials nach Fehlern?~~ Entschieden (D55): Rewarded nach Fehlern, Interstitials nur in natürlichen Pausen.
