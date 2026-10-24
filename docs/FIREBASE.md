# Firebase- und Gemini-Backend

Das Backend liegt in `functions/` und hat zwei HTTP-Functions in `europe-west3`. Die App schickt **nie einen Prompt**. Ohne erreichbares Backend spielt sie mit den eingebauten Fragen weiter, und die Liga ist dann nicht verfügbar.

| Function | Vertrag | Zweck |
|---|---|---|
| `questions` | `POST { area, difficulty, count, have }` → `{ questions }` | Fragen aus dem gemeinsamen, geprüften Pool; bei Bedarf schreibt der Server neue |
| `league` | `POST { action: "join" \| "sync" \| "leave", … }` | Wochenliga (siehe unten) |

Die frühere Function `gemini` nahm freie Prompts an und war damit ein offener Gemini-Proxy. Sie ist aus dem Code entfernt und wird beim nächsten Deploy gelöscht (D45).

## Aktives Firebase-Projekt

Projekt-ID: `nexus-trivia-prod-20261024` (Blaze). Firestore liegt in `europe-west3`; die Regeln sperren jeden Clientzugriff, gelesen und geschrieben wird nur über die Functions (Admin SDK). Secret Manager enthält `GEMINI_API_KEY`. Das Modell steht in `GEMINI_MODEL`, nicht im Code.

Basis-URL der App: `https://europe-west3-nexus-trivia-prod-20261024.cloudfunctions.net` (`API_BASE` in `apps/mobile/src/config.ts`, überschreibbar mit `EXPO_PUBLIC_API_BASE`).

## Fragen: wie `questions` arbeitet

1. Die Anfrage wird streng geprüft (`parsePoolRequest` in `packages/shared/src/serve.ts`). Erlaubt sind nur die Felder Bereich (aus der Taxonomie), Schwierigkeit 1–5, Anzahl 1–3 und bis zu 400 Kennungen bekannter Fragen. Alles andere, etwa ein `prompt`-Feld, gibt 400.
2. Der Server sucht im Index `poolIndex/{bereich}` ungesehene, nicht gesperrte Fragen nahe der Schwierigkeit und liefert sie aus `questions/{id}`.
3. Nur wenn dort nichts Neues liegt, schreibt das Modell drei neue Fragen. Den Prompt baut der Server selbst aus Taxonomie und Themenbeschreibung, mit dem seltensten Fragetyp des Bereichs und ohne dessen letzte Themen. Jede Frage geht durch Validator und Prüfer und landet im **gemeinsamen** Pool, profitiert also allen.
4. Die App prüft jede gelieferte Frage noch einmal (`acceptServed`).

## Limits und Schutz

- **Tagesbudget** über alle Modellaufrufe (Generieren und Prüfen): `AI_DAILY_CALL_LIMIT`, derzeit 100 pro UTC-Tag. Eine Erzeugung kostet bis zu 4 Aufrufe. Für viele Spieler das Limit anheben; der gemeinsame Pool senkt die Kosten pro Spieler mit der Zeit.
- **Kill-Switch:** `AI_ENABLED=false` stoppt neue Erzeugung, der Pool wird weiter ausgeliefert.
- **Pro Client und Stunde** (gehashte IP, `limits/`): 60 Fragen-Anfragen, davon höchstens 6 mit Erzeugung; 5 Liga-Beitritte; 120 Liga-Abgleiche je Spieler.
- **TTL:** `limits`, `leagueSlots` und `leagueGroups` tragen `expiresAt`. Die TTL-Regeln stehen in `firestore.indexes.json` und gehen mit `firestore:indexes` raus. Rate-Limit-Einträge verschwinden so nach etwa zwei Stunden.
- **Restrisiko:** Die Endpunkte sind öffentlich. Wer viele IP-Adressen hat, kann das Tagesbudget für neue Fragen aufbrauchen; der vorhandene Pool bleibt dann trotzdem nutzbar. Vor dem Launch kommt Firebase App Check dazu (`docs/CODEX_HANDOFF.md`).

## Wochenliga

- `join` mit einem **erzeugten Rufnamen** (`isAlias`, keine freie Eingabe) legt `leaguePlayers/{uuid}` an (Rufname, Hash des Tokens, Liga, Woche, Gruppe, XP) und gibt `playerId` und `token` zurück.
- `sync` meldet die XP der Woche (nie weniger als zuvor, höchstens 20.000). Zu Wochenbeginn bestimmt der Rang der Vorwoche die neue Liga, dann teilt der Server in Gruppen bis 20 ein (`leagueSlots`, `leagueGroups`). Die Antwort enthält Rangliste, Zonen und Wochenende, aber keine fremden Kennungen.
- `leave` löscht den Eintrag; das passiert auch beim Zurücksetzen des Spielstands.

## Deploy und Konfiguration

Nicht geheime Parameter liegen lokal in der ignorierten Datei `functions/.env.nexus-trivia-prod-20261024`. `pnpm firebase:deploy` bündelt `packages/shared` mit esbuild in `functions/lib/index.js` und deployt Regeln, Indizes und Functions. Beim ersten Deploy nach D45 fragt die CLI, ob `gemini` gelöscht werden soll: mit „Ja“ bestätigen (oder `--force`).

```bash
pnpm firebase:deploy
```

## Emulator

```bash
pnpm firebase:emulators
```

In `apps/mobile/.env` dann `EXPO_PUBLIC_API_BASE=http://<LAN-IP>:5001/nexus-trivia-prod-20261024/europe-west3` setzen und Expo neu starten.
