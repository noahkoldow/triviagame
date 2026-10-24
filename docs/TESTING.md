# Testen in Expo Go

Voraussetzung: Expo Go (SDK 58) auf dem Handy, Node >= 22, pnpm.

## A) Lokal (schnellster Weg)

```bash
git clone https://github.com/noahkoldow/triviagame && cd triviagame
pnpm install
pnpm start                                   # gleiches WLAN: QR-Code in Expo Go scannen
pnpm --filter @nexus/mobile start:tunnel     # anderes Netz (installiert ngrok-Tunnel)
```

## B) Als Expo-Projekt veröffentlichen (Link/QR ohne laufenden Rechner)

Einmalig, mit deinem Expo-Konto:

```bash
npm i -g eas-cli
eas login
cd apps/mobile && eas init            # legt das Projekt an und trägt die projectId in app.json ein
pnpm update:preview                   # veröffentlicht Branch "preview"
```

Danach auf expo.dev im Projekt unter _Updates → preview_ den QR-Code mit Expo Go scannen (oder den Link öffnen). Jede weitere Veröffentlichung ersetzt den Stand, die App lädt ihn beim Start.

## C) Automatisch bei jedem Push auf `main`

1. `eas init` (siehe B) ausführen und die geänderte `apps/mobile/app.json` committen.
2. Auf expo.dev ein Access Token erzeugen und im GitHub-Repo als Secret `EXPO_TOKEN` hinterlegen.
3. Repository-Variable `EAS_ENABLED=true` setzen.

Der Workflow `.github/workflows/eas-update.yml` prüft Typen und Tests und veröffentlicht dann den Branch `preview`.

## Hinweise

- Werbung und Käufe sind Mocks (siehe `docs/DECISIONS.md` D1). Der Spielstand und nachgeladene Fragen liegen lokal im Gerät. Das Backend (Fragen-Nachschub und Wochenliga) lässt sich mit `EXPO_PUBLIC_API_BASE` umstellen, ein leerer Wert spielt offline (siehe `docs/FIREBASE.md`).
- Zurücksetzen: Profil → „Spielstand zurücksetzen“.
