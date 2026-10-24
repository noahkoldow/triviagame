# KI-Anbindung: Fragen aus der KI, alle Typen

Stand: Schema, Prüfung, serverseitige Erzeugung mit gemeinsamem Fragenpool und Nachladen in der App stehen. Einrichtung und Projektangaben: [FIREBASE.md](FIREBASE.md). Wenn das Backend nicht erreichbar oder deaktiviert ist, bleibt die App mit ihren lokalen Fragen spielbar.

## Fragetypen

Sechs Typen, alle für die KI vorgesehen und im Spiel bedienbar (`QuestionView`):

| Typ         | Spiel                 | Felder der KI                                                        |
| ----------- | --------------------- | -------------------------------------------------------------------- |
| `choice`    | Auswahl               | `options` (3 bis 5), `answer` (Index)                                |
| `estimate`  | Schätzen              | `answer`, `tolerance` (0 = exakt, bis 0,5), `unit`                   |
| `order`     | Reihenfolge           | `items` (3 bis 6, in richtiger Ordnung)                              |
| `truefalse` | Stimmt / Stimmt nicht | `answer` (boolean); die Aussage ist `stem`                           |
| `match`     | Zuordnen              | `pairs` (3 bis 6, links und rechts je eindeutig)                     |
| `cloze`     | Lückentext            | `text` mit `{0}`, `{1}` …, `answers`, `bank` (inkl. falscher Wörter) |

Alle Typen haben dazu: `area`, `difficulty`, `topic`, `intro`, `stem`, `explanation`, `fragments`.

## Ablauf (`packages/shared/src/ai.ts`)

1. `buildGenerationPrompt(request)` baut den Auftrag aus Bereich (feste Taxonomie), Schwierigkeit, Typ und Themen, die vermieden werden sollen. Der Prompt nennt **keinen Modellnamen**.
2. Der **Generator** liefert nur Text (`QuestionGenerator`).
3. `parseDrafts` findet das JSON (auch in Code-Zäunen oder zwischen Text).
4. `validateDraft` prüft **jede** Frage gegen das Schema des Typs und die Inhaltsregeln (Liste unten) und meldet alle Fehler.
5. Optional der **Prüfer** (`QuestionChecker`, zweiter KI-Durchlauf): Fakten, Eindeutigkeit, Köder, Lösbarkeit aus den Fragmenten. Alles, was unklar ist, zählt als „nicht ok“.
6. Nur was durchkommt, wird zur `Question` (ID aus Inhalt gehasht, also stabil und dublettenfrei).

`generateQuestions(generator, checker, request, known)` macht 1 bis 6. Ein ausgefallenes Backend, Unsinn als Antwort oder ein Fehler im Prüfer führen nie zu einer Frage im Spiel.

### Inhaltsregeln

- Bereich, Typ und Schwierigkeit gültig und wie angefragt.
- Stichwort 3 bis 40 Zeichen, Einführung 20 bis 160, Frage bis 220, Erklärung 10 bis 400.
- 3 bis 7 Fragmente, **1 bis 3 Schlüsselfragmente** (der Cache fasst 3) und **mindestens ein Köder**; Etiketten bis 18 Zeichen und je Frage eindeutig.
- **Kein Verrat der Antwort:** Stichwort, Einführung und Etiketten dürfen die richtige Antwort nicht als eigenes Wort enthalten („Rom“ trifft nicht „Roman“).
- Typregeln wie in der Tabelle, etwa: Lücken und Antworten passen zusammen, die Wortbank enthält alle Antworten plus mindestens ein falsches Wort, Paare sind eindeutig.

Ein Test prüft, dass alle vorhandenen Fragen diese Regeln bestehen, damit die Regeln realistisch bleiben.

## Wo die Pipeline läuft (D45)

Die Pipeline läuft **nur auf dem Server** (Function `questions`, `functions/src/index.ts`). Die App sendet keinen Prompt, sondern `{ area, difficulty, count, have }` (`parsePoolRequest`). Der Server bedient zuerst aus dem gemeinsamen, geprüften Pool in Firestore. Nur wenn dort nichts Neues liegt, baut er den Prompt selbst (`buildGenerationPrompt` mit der Themenbeschreibung des Bereichs), ruft Gemini, validiert, lässt prüfen und legt das Ergebnis im Pool ab. Details: [FIREBASE.md](FIREBASE.md).

## In der App (`apps/mobile/src/services/ai.ts`, `content.ts`)

- `httpQuestionApi` fragt `questions` an und prüft jede gelieferte Frage erneut (`acceptServed`: gleiche Validierung, unveränderte Kennung).
- `refillPool` lädt nach, sobald ein freigeschalteter Bereich weniger als drei ungenutzte Fragen hat, auf dem Niveau des Spielers dort. Danach wachsen wartende Zweige (`growWaitingNodes`). So endet das Netz nie: Das Spiel ist offen.
- Ohne Backend (`EXPO_PUBLIC_API_BASE=""`) spielt die App nur mit den 61 eingebauten Fragen.

## Offen

- Meldefunktion in der App und serverseitiges Sperren gemeldeter Fragen (`PoolEntry.blocked` ist vorbereitet).
- Firebase App Check vor dem Launch.
- Verzweigungen (`deepen`/`bridge`) und Bereichs-Nachbarschaft für KI-Fragen vorschlagen lassen; bisher wählt das Spiel selbst per Bereichs-Links.
- Weitere Fragetypen, die zum Windows-95-Stil passen, etwa „In Ordner sortieren“ oder „Fehler im Text finden“.

## Dateien in Cache-Ordnern

Fragmente können `files` tragen (siehe `validateFiles` in `packages/shared/src/files.ts`). Die KI bekommt dafür im Prompt die Formen von Notiz, Artikel und Bild und muss sie liefern wie die Fragen selbst; die Prüfung lehnt Fehler ab.

- **Notiz:** 10 bis 400 Zeichen. **Artikel:** drei bis vier kurze Absätze (bis 900 Zeichen, mit Leerzeile getrennt), mit Quelle. **Bild:** `alt` (10 bis 200 Zeichen) und ein `chart`:
  - `bars`: 2 bis 6 Balken mit Beschriftung und Zahl, optional Einheit.
  - `timeline`: 2 bis 6 Ereignisse mit ganzer Jahreszahl.
  - `table`: 2 bis 5 Spalten, 1 bis 6 Zeilen, jede Zeile so lang wie die Kopfzeile.
- 1 bis 5 Dateien pro Ordner, Dateinamen eindeutig und ohne die Antwort zu verraten.
- Der Fakt des Fragments muss in mindestens einer Datei stehen; die anderen geben Kontext oder sind plausible, aber unwichtige Köder.

Offen: Der Prüfer sollte auch kontrollieren, dass Zahlen im Diagramm stimmen und der Fakt nicht in jeder Datei steht (dann gäbe es nichts zu suchen).
