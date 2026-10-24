# Regiebuch

Wie NEXUS sich anfühlen soll, wohin die Geschichte läuft und warum die Regeln so sind. Ergänzt `CONCEPT.md` (Idee) und `DECISIONS.md` (Einzelentscheidungen D36–D47). Stand: 24.10.2026.

## 1. Diagnose vor der Regie

**Trägt schon:** Die Kernschleife (Fragmente sammeln → merken → antworten) ist eigenständig und lernwirksam. Das Netz wächst sichtbar, Außenposten ziehen nach außen, Firewalls geben Zwischenziele. Der Cache als Datei-Explorer passt perfekt zum Nexus-OS-Look. Die Werbung ist fair.

**Fehlte:**

1. **Die Geschichte endete nach dem Onboarding.** MORPH tauchte nur noch in Fehlersprüchen auf, die vier Hüter kamen im Spiel gar nicht vor, es gab kein Logbuch und kein Ende. Ohne Ziel wird das Netz nach zwanzig Knoten beliebig.
2. **Kein „Was jetzt?“ auf der Karte.** Man sah Knoten, Außenposten und Firewalls, aber keine Richtung.
3. **Softlock bei Integrität 0.** Wer früh fünfmal danebenlag, hatte keinen beschädigten Knoten zum Reparieren. Ohne Video oder Gems ging es dann nicht weiter. Das widerspricht „nie Sackgasse“.
4. **Reparaturen ließen sich farmen.** Beschädigte Knoten waren jederzeit spielbar und gaben jedes Mal Belohnung, Integrität und Box-Fortschritt. Damit war der Wiederholungsabstand (Leitner) wirkungslos.
5. **Ergebnis-Screens kippten.** Nach einem Firewall-Sieg zeigte der Boss-Screen „bereits gebrochen“ statt des Siegs. Eine richtige Antwort im zweiten Versuch wurde als „Repariert!“ erzählt.
6. **Der Dock-Knopf „Knoten“ öffnete nichts.** Die Knotenliste für VoiceOver, die in `APPLE.md` versprochen ist, fehlte.
7. **Das Netz endete.** Nach etwa 30 Knoten gab es keine Fragen mehr, und Zweige ohne Frage wuchsen nie wieder.
8. **Offener KI-Proxy.** Die Function `gemini` nahm beliebige Prompts an.
9. **Die Sektoren passten nicht zum Anspruch „Allgemeinwissen“.** Jetzt gibt es vier Sektoren mit je drei Bereichen nach Vorgabe (D44).

Alle Punkte sind behoben (siehe §3; Punkt 8 ist im Code behoben, der Deploy steht aus).

## 2. Die Geschichte

**Ton:** leicht, warm, nie Textwände (höchstens 280 Zeichen pro Moment, per Test erzwungen). Humor kommt aus den Figuren, nicht aus Witzen über Wissen.

**Die Wendung:** MORPH ist kein Zerstörer. Er war ein eifriger Helfer, der zu viele Fragen auf einmal bekam. Um alle schneller zu bedienen, kürzte er die Antworten, dann die Kürzungen, bis nur Rauschen blieb. Seine vier Logbücher (je Firewall eins) erzählen das rückwärts. Am Ende gewinnt man ihn nicht durch Zerstörung, sondern durch Beweis: Wer versteht, braucht keine Abkürzung. Danach ist MORPH auf deiner Seite und tröstet bei Fehlern, statt zu spotten.

### Kapitel (Zielleiste unter dem HUD)

| # | Titel | Ziel | Was passiert |
|---|---|---|---|
| 1 | Neustart | Löse die vier Startknoten | Bolt jubelt über die erste Bahn (KERN_001). Nach vier Bahnen erinnert sich der Kern an seinen Namen (KERN_002). |
| 2 | Die Hüter | Je Sektor 3 gelöste Knoten | Quantis (Naturwissenschaften), Rhizom (Erde), Muse (Geisteswissenschaften) und Kodex (Gesellschaft) erwachen einzeln, jeder mit eigenem Logbuch. Danach kommentieren sie richtige Antworten in ihrem Sektor. Kodex verrät den Plan: vier Firewalls. |
| 3 | Die Firewalls | Brich alle vier | Jede gebrochene Firewall bringt einen Funkspruch von MORPH und eines seiner Protokolle (MORPH_1 bis MORPH_4). Dabei wechselt er die Gestalt: Glitch, Brille, Krone. |
| 4 | Das große Resümee | Stelle MORPH im Kern | Finale: 8 Fragen aus allen Sektoren, ohne Cache, 6 müssen stimmen. Sieg: MORPH startet neu im Modus „neugierig“ (KERN_004). |
| 5 | Endlos | Verbinde alle 12 Bereiche, danach alle 25 gelösten Knoten ein neuer Meilenstein | **Kein Ende.** Alle Säle offen ergibt KERN_005: „Das Archiv schreibt sich weiter.“ Gemini liefert laufend neue Fragen, die Wochenliga setzt jede Woche ein neues Ziel. |

Kleine Momente zwischendurch: erster beschädigter Knoten, Netz instabil (erklärt die Wartung), Bolt stellt nach den vier Startknoten die Wochenliga vor, erster verbundener Bereich (KERN_003).

**Das Spiel ist offen.** Die Geschichte hat einen Höhepunkt (das Finale), aber das Lernen hört nie auf: Wenn einem Bereich die Fragen ausgehen, holt die App neue aus dem gemeinsamen Pool, den Gemini auf dem Server füllt. Zweige, die kurz keine Frage fanden, warten und wachsen weiter, sobald Nachschub da ist.

Alte Spielstände sehen nur den jüngsten fälligen Moment, nicht einen Stapel Dialoge (`catchUpStory`).

### Stimmen im Spielfluss

- **Richtig** in einem Sektor mit wachem Hüter: kurzer Kommentar mit Porträt (Quantis trocken, Rhizom in Bildern, Kodex zitiert sich selbst, Muse reimt).
- **Falsch:** MORPH funkt dazwischen (sieben Sprüche). Nach dem Finale nimmt er drei freundliche Sprüche.
- Alles deterministisch aus einem Seed, damit Tests und Wiederholungen stabil bleiben.

## 3. Geänderte Regeln

| Regel | Vorher | Jetzt | Warum |
|---|---|---|---|
| Integrität 0 | sperrt neue Knoten immer | sperrt nur, solange eine **Wartung** oder fällige Reparatur möglich ist | kein Softlock, „nie Sackgasse“ |
| Wartung (neu) | – | einen gelösten Knoten aus dem Gedächtnis erneut beantworten, ohne Cache: +1 Integrität; je Knoten einmal am Tag, auch ein Fehlversuch verbraucht ihn | Wiederholen wird zum Ausweg statt zur Strafe |
| Reparatur vor Fälligkeit | volle Belohnung, Box +1, +1 Integrität | fehlende Wege wachsen; Belohnung, Box und Integrität nur bei Fälligkeit | der Abstand zwischen Wiederholungen zählt wieder |
| Streak-Freezes | 2 für immer | füllen sich jeden Monat auf 2 auf | wie im Konzept, keine Strafspirale |
| Ergebnis-Screens | prüften den Zustand neu | frieren den Startzustand ein | Sieg und Warnung bleiben sichtbar |
| Zweige ohne Frage | starben ab | warten und wachsen bei Nachschub | offenes Ende |
| Fragen-Nachschub | höchstens 3 je Gebiet, Prompt aus der App | je Bereich, sobald weniger als 3 ungenutzte übrig sind; Server bedient aus gemeinsamem Pool | nie ausgehen, kein offener Proxy |
| Rangliste | keine | Wochenliga (Gruppen bis 20, Top 5 steigen auf), freiwillig, erzeugte Rufnamen | wöchentliches Ziel ohne globale Hetze |

Unverändert und bewusst so gelassen: 1. Versuch lässt Vertiefung und Brücke wachsen, der 2. nur die Vertiefung, ab dem 3. wächst nichts bis zur Reparatur (D17). Energie füllt sich nur mit der Zeit. Der Cache wird nach jedem Versuch geleert (Merken bleibt die Leistung).

Abgesichert durch einen **automatischen Test** (`story.test.ts`), der die Geschichte mit den 61 eingebauten Fragen vom ersten Knoten bis nach dem Finale durchspielt. Er prüft nur, dass alles erreichbar ist; im Spiel selbst gibt es keine Simulation und kein Ende.

## 4. Die ersten zehn Minuten

| Zeit | Moment | Gefühl |
|---|---|---|
| 0:00 | Win95-Assistent, MORPH zerstört das Netz, Profil | „Oh, das ist anders.“ |
| 1:00 | Karte, Zielleiste „Kapitel 1 · 0/4“, Bolt zeigt auf einen Knoten | klare Richtung |
| 1:30 | erstes Trümmerfeld, Ordner sammeln, Frage, richtig | **erste Bahn leuchtet**, Logbuch-Datei |
| ~5:00 | vierter Startknoten, der Kern erinnert sich | Neugier auf die Geschichte |
| 8–12 | der erste Hüter erwacht | **Haken der Sitzung**: eine neue Figur, die mich ab jetzt lobt |

Wenn der erste Hüter in Tests später als nach 12 Minuten kommt, `GUARDIAN_WAKE` von 3 auf 2 senken.

## 5. Wirtschaft: Befund und Empfehlung

| Ressource | Quellen | Senken | Befund |
|---|---|---|---|
| Gems | Start 5 · schwerer Erstversuch +1 · Kreis +1 · Firewall +3 · Finale +10 · Video +1 | Bereiche 15/25/35 · Heilen 3 | ausgewogen; Bereiche öffnen sich auch kostenlos durch Wachstum |
| Bits | jede richtige Antwort | nur 4 Farben (300 Bits gesamt) | **zu wenig Senken**: Bits sind nach etwa 30 Knoten wertlos. Bolt-Skins, Spur-Effekte und Codex-Rahmen als Bit-Ware ergänzen. |
| Energie | 1 pro 20 min, max 5 | Cache in der Frage öffnen (1–5) | gut, solange Fragen ohne Blitz lösbar sind |
| Integrität | richtige Antwort, fällige Reparatur, Wartung, Video, 3 Gems | Fehler, verlorene Kämpfe | jetzt ohne Sackgasse |

## 6. Als Nächstes (Regie-Wunschliste)

1. **Tages-Puls mit MORPH als Gastgeber** (nach dem Finale): „MORPHs Kurzfassung des Tages“, fünf Fragen, Serie. Für das Post-Game ist das der natürlichste Rückkehrgrund.
2. **Wochen-Event „Rückfall“:** MORPH verfällt für eine Woche in alte Muster, ein Thema ist verrauscht und bringt doppelte Bits.
3. **Glitches auf Ordnern** (Asset-Bibel §2) als Stimmung im Trümmerfeld.
4. **Inhalte:** Nachschub kommt jetzt laufend aus dem Pool. Zum Start sollte der Pool trotzdem vorgefüllt sein (mindestens 25 geprüfte Fragen je Bereich, also 300), damit die ersten Spieler nicht auf die Erzeugung warten.
5. **Liga-Ausbau:** Belohnung für Aufstiege (Gems, Rahmen fürs Profil), Freundes-Ligen.

Wer was davon baut, steht in `docs/CODEX_HANDOFF.md`.
