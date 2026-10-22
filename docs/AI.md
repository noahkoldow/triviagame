# KI-Anbindung: Fragen aus der KI, alle Typen

Stand: Schema, Prüfung und Anbieter-Schicht stehen und sind getestet. **Noch nicht verbunden** mit dem laufenden Spiel: der Pool ist weiter die feste Liste `MOCK_QUESTIONS`. Es gibt auch noch kein Backend.

## Fragetypen

Sechs Typen, alle für die KI vorgesehen und im Spiel bedienbar (`QuestionView`):

| Typ | Spiel | Felder der KI |
|---|---|---|
| `choice` | Auswahl | `options` (3 bis 5), `answer` (Index) |
| `estimate` | Schätzen | `answer`, `tolerance` (0 = exakt, bis 0,5), `unit` |
| `order` | Reihenfolge | `items` (3 bis 6, in richtiger Ordnung) |
| `truefalse` | Stimmt / Stimmt nicht | `answer` (boolean); die Aussage ist `stem` |
| `match` | Zuordnen | `pairs` (3 bis 6, links und rechts je eindeutig) |
| `cloze` | Lückentext | `text` mit `{0}`, `{1}` …, `answers`, `bank` (inkl. falscher Wörter) |

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

## Anbieter in der App (`apps/mobile/src/services/ai.ts`)

- `httpGenerator` und `httpChecker` rufen **unser eigenes Backend** auf (`AI_ENDPOINT` in `src/config.ts`, leer = aus). Die App sendet nur `{ task, prompt }`, keine Spielerdaten, und kennt weder Schlüssel noch Modell.
- `mockGenerator` antwortet offline im selben JSON-Format aus den eingebauten Fragen (Entwicklung, Tests, solange es kein Backend gibt).
- `questionSource(endpoint)` wählt je nach Konfiguration.

## Was das Backend tun muss

- `POST { task: "generate" | "check", prompt }` → `{ text }`.
- Den Schlüssel und den **Modellnamen aus der Konfiguration** (nicht im Code) verwenden.
- **Tagesbudget und Kill-Switch** durchsetzen, Anfragen begrenzen, nur anonyme Eingaben.
- Geprüfte Fragen in einen **gemeinsamen Pool** legen (Konzept 7.2), nicht pro Klick neu erzeugen.
- Eine **Meldefunktion** für Fragen bereitstellen; gemeldete Fragen sperren und neu prüfen.

## Offen

- Backend und Pool-Speicher (Firebase, siehe Konzept 8).
- Pool im Spiel aus dem Backend nachladen statt aus `MOCK_QUESTIONS` (der `Pool` kann beliebige `Question`s halten).
- Meldefunktion in der App.
- Verzweigungen (`deepen`/`bridge`) und Bereichs-Nachbarschaft für KI-Fragen vorschlagen lassen; bisher wählt das Spiel selbst per Bereichs-Links.
- Weitere Fragetypen, die zum Windows-95-Stil passen, etwa „In Ordner sortieren“ oder „Fehler im Text finden“.
