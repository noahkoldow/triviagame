# Firebase- und Gemini-Backend

Das Backend liegt in `functions/`. Es stellt `POST /gemini` mit dem Vertrag `{ task: "generate" | "check", prompt }` bereit, den `apps/mobile/src/services/ai.ts` bereits versteht. Wenn das Backend nicht erreichbar oder deaktiviert ist, bleibt die App bei ihren lokalen Fragen.

## Firebase-Projekt

Firebase-Projekte sind zugleich Google-Cloud-Projekte. Das neue Projekt ist bereits erstellt und in `.firebaserc` als Standard gewählt:

```bash
firebase login
```

Projekt-ID: `nexus-trivia-prod-20261024`. Firestore ist als Standarddatenbank in `europe-west3` angelegt. Funktionen benötigen den Firebase-Tarif Blaze; dazu muss ein Cloud-Billing-Konto mit dem Projekt verknüpft werden. Das macht Bereitstellungen möglich und kann Cloud-Kosten verursachen.

## Modell und Secret

In Google AI Studio einen Gemini-API-Schlüssel für dasselbe Cloud-Projekt erstellen und als Secret setzen. Der Schlüssel bleibt in Secret Manager und wird ausschließlich an die Function gebunden:

```bash
firebase functions:secrets:set GEMINI_API_KEY
```

Bei der ersten Bereitstellung fragt Firebase nach `GEMINI_MODEL`, `AI_ENABLED` und `AI_DAILY_CALL_LIMIT`. `AI_ENABLED` muss zunächst `false` sein; nach dem Einrichten des Schlüssels und Prüfen der Abrechnung kann es auf `true` gesetzt werden. Das Tageslimit zählt Generierungs- und Prüfer-Aufrufe zusammen und reserviert einen Aufruf vor dem Modellabruf.

Die nicht geheimen Parameter werden projektbezogen in `functions/.env.nexus-trivia-prod-20261024` gespeichert. Setze dort nach dem Secret `AI_ENABLED=true` und führe den Function-Deploy erneut aus, um Live-Aufrufe freizuschalten. `AI_DAILY_CALL_LIMIT` gilt pro Projekt und UTC-Tag; Eingaben sind auf 48.000 Zeichen und Ausgaben auf 8.192 Tokens begrenzt.

```bash
pnpm install
pnpm firebase:deploy
```

Die App verwendet bereits die Produktions-URL `https://europe-west3-nexus-trivia-prod-20261024.cloudfunctions.net/gemini`. Für Emulatoren oder abweichende Umgebungen kann sie in `apps/mobile/.env` überschrieben werden:

```dotenv
EXPO_PUBLIC_AI_ENDPOINT=https://europe-west3-PROJEKT_ID.cloudfunctions.net/gemini
```

Danach Expo neu starten. Für Store-Builds denselben Wert als öffentliches EAS-Umgebungsmerkmal der passenden Umgebung `preview` oder `production` setzen. Der Endpoint ist öffentlich erreichbar; der globale Firestore-Tageszähler und der Kill-Switch begrenzen die Nutzung. Für eine öffentliche Veröffentlichung sind zusätzlich Firebase App Check und eine Authentisierung oder ein serverseitiger Fragenpool erforderlich.

## Emulator

```bash
pnpm firebase:emulators
```

Im Simulator kann `EXPO_PUBLIC_AI_ENDPOINT` auf die lokale Function-URL zeigen. Auf einem echten Telefon muss `localhost` durch die LAN-IP des Entwicklungsrechners ersetzt werden.

## Aktueller Umfang

Beim App-Start wird höchstens eine KI-Frage pro UTC-Tag für ein freigeschaltetes Startgebiet erzeugt. Die bestehende Shared-Pipeline validiert sie und lässt sie vom Gemini-Prüfer abnehmen, bevor sie in den Spielpool gelangt. Akzeptierte Fragen werden lokal gespeichert. Die Function schreibt nur den internen Tageszähler mit dem Admin SDK; Firestore-Regeln sperren Clientzugriffe vollständig. Ein gemeinsamer Pool, App Check und Nutzeranmeldung sind noch offen.
