# Firebase- und Gemini-Backend

Das Backend liegt in `functions/` und hat zwei HTTP-Functions in `europe-west3`. Die App schickt **nie einen Prompt**. Ohne erreichbares Backend spielt sie mit den eingebauten Fragen weiter, und die Rangliste ist dann nicht verfügbar.

| Function | Vertrag | Zweck |
|---|---|---|
| `questions` | `POST { area, difficulty, count, have, lang }` → `{ questions }` | Fragen aus dem gemeinsamen, geprüften Pool; bei Bedarf schreibt der Server neue |
| `league` | `POST { action: "join" \| "sync" \| "leave", … }` | Rangliste aller Spieler (siehe unten) |

Die frühere Function `gemini` nahm freie Prompts an und war damit ein offener Gemini-Proxy. Sie ist aus dem Code entfernt und wird beim nächsten Deploy gelöscht (D45).

## Aktives Firebase-Projekt

Projekt-ID: `nexus-trivia-prod-20261024` (Blaze). Firestore liegt in `europe-west3`; die Regeln sperren jeden Clientzugriff, gelesen und geschrieben wird nur über die Functions (Admin SDK). Secret Manager enthält `GEMINI_API_KEY`. Das Modell steht in `GEMINI_MODEL`, nicht im Code.

Basis-URL der App: `https://europe-west3-nexus-trivia-prod-20261024.cloudfunctions.net` (`API_BASE` in `apps/mobile/src/config.ts`, überschreibbar mit `EXPO_PUBLIC_API_BASE`).

## Fragen: wie `questions` arbeitet

1. Die Anfrage wird streng geprüft (`parsePoolRequest` in `packages/shared/src/serve.ts`). Erlaubt sind nur die Felder Bereich (aus der Taxonomie), Schwierigkeit 1–5, Anzahl 1–3, bis zu 400 Kennungen bekannter Fragen und die Sprache (`de`, `en`, `fr`, `es`; fehlt sie, gilt `de` für ältere App-Versionen). Alles andere, etwa ein `prompt`-Feld, gibt 400.
2. Jede Sprache hat ihren eigenen Pool. Der Server sucht im Index `poolIndex/{sprache}_{bereich}` (etwa `fr_physics`) ungesehene, nicht gesperrte Fragen nahe der Schwierigkeit und liefert sie aus `questions/{id}`.
3. Nur wenn dort nichts Neues liegt, schreibt das Modell drei neue Fragen. Den Prompt baut der Server selbst aus Taxonomie, Themenbeschreibung und Sprache (alle Spielertexte in der Zielsprache), mit dem seltensten Fragetyp des Bereichs und ohne dessen letzte Themen. Jede Frage geht durch Validator und Prüfer und landet im **gemeinsamen** Pool, profitiert also allen.
4. Die App prüft jede gelieferte Frage noch einmal (`acceptServed`).

## Limits und Schutz

- **Tagesbudget** über alle Modellaufrufe (Generieren und Prüfen): `AI_DAILY_CALL_LIMIT`, derzeit 100 pro UTC-Tag. Eine Erzeugung kostet bis zu 4 Aufrufe. Für viele Spieler das Limit anheben; der gemeinsame Pool senkt die Kosten pro Spieler mit der Zeit.
- **Kill-Switch:** `AI_ENABLED=false` stoppt neue Erzeugung, der Pool wird weiter ausgeliefert.
- **Websuche beim Prüfer:** `AI_CHECK_GROUNDING=true` lässt den Prüfer mit Google Search verifizieren und speichert die Belege (D66). Standard aus; Suchanfragen kosten über das Freikontingent hinaus.
- **Pro Client und Stunde** (gehashte IP, `limits/`): 60 Fragen-Anfragen, davon höchstens 6 mit Erzeugung; 5 Anmeldungen zur Rangliste; 120 Abgleiche je Spieler.
- **TTL:** `limits` trägt `expiresAt`. Die TTL-Regeln stehen in `firestore.indexes.json` und gehen mit `firestore:indexes` raus. Rate-Limit-Einträge verschwinden so nach etwa zwei Stunden.
- **Restrisiko:** Die Endpunkte sind öffentlich. Wer viele IP-Adressen hat, kann das Tagesbudget für neue Fragen aufbrauchen; der vorhandene Pool bleibt dann trotzdem nutzbar. Vor dem Launch kommt Firebase App Check dazu (`docs/CODEX_HANDOFF.md`).

## Rangliste (D57)

- `join` mit einem **erzeugten Rufnamen** (`isAlias`, keine freie Eingabe) legt `leaguePlayers/{uuid}` an (Rufname, Hash des Tokens, `xp` und `areas.<bereich>` auf 0) und gibt `playerId` und `token` zurück. Die App macht das von selbst.
- `sync` mit `scores` (`{ xp, areas }`) und `board` (`"all"` oder eine Bereichs-ID) nimmt die Punkte über `acceptScores` an (nur steigend, höchstens 6000 XP und 120 Knoten pro Stunde seit dem letzten Abgleich `syncedAt`; der erste Abgleich bringt den Spielstand mit) und liefert die besten 50 dieser Ansicht, die Gesamtzahl und den eigenen Platz (Zählabfrage `> eigene Punkte`). Fremde Kennungen gehen nie raus. Sortiert wird über die automatischen Einzelfeld-Indizes auf `xp` und `areas.*`, ein zusammengesetzter Index ist nicht nötig.
- `leave` löscht den Eintrag; das passiert nur beim Zurücksetzen des Spielstands.

## Deploy und Konfiguration

Nicht geheime Parameter liegen lokal in der ignorierten Datei `functions/.env.nexus-trivia-prod-20261024` (`GEMINI_MODEL`, `AI_ENABLED`, `AI_DAILY_CALL_LIMIT`, `AI_CHECK_GROUNDING`; ohne Terminal verlangt `--non-interactive` jeden davon). `pnpm firebase:deploy` bündelt `packages/shared` mit esbuild in `functions/lib/index.js` und deployt Regeln, Indizes und Functions. Beim ersten Deploy nach D45 fragt die CLI, ob `gemini` gelöscht werden soll: mit „Ja“ bestätigen (oder `--force`).

```bash
pnpm firebase:deploy
```

## Emulator

```bash
pnpm firebase:emulators
```

In `apps/mobile/.env` dann `EXPO_PUBLIC_API_BASE=http://<LAN-IP>:5001/nexus-trivia-prod-20261024/europe-west3` setzen und Expo neu starten.
