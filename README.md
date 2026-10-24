# NEXUS

Wissens-Quiz im zerstörten Netzwerk: Baue vom zentralen Chip aus Bahnen wieder auf, sammle Datenfragmente, merke sie dir und beantworte Fragen. Konzept: [docs/CONCEPT.md](docs/CONCEPT.md).

## Erster Test in Expo Go

```bash
pnpm install        # Node >= 22
pnpm start          # Expo-Dev-Server, QR-Code mit Expo Go scannen
# Handy und Rechner nicht im selben WLAN? -> pnpm --filter @nexus/mobile start:tunnel
```

Ausführliche Anleitung (lokal, EAS Update, CI): [docs/TESTING.md](docs/TESTING.md).

Der Spielfluss funktioniert offline mit Mock-Fragen, Mock-Werbung (Overlay statt AdMob) und Mock-Käufen. Wenn das Gemini-Backend aktiv ist, ergänzt es den Fragenpool höchstens einmal pro Tag. Der Spielstand liegt in `AsyncStorage`.

Firebase-/Gemini-Backend und Einrichtung: [docs/FIREBASE.md](docs/FIREBASE.md). Ohne gesetzten Endpoint spielt die App mit den eingebauten Fragen weiter.

## Aufbau

- `packages/shared`: reine Spiellogik (Netzwachstum, organisches Layout, Schwierigkeit, Interessen-Bandit, Wiederholung, Belohnungen, Werbe- und Gem-Regeln, Mock-Fragen) mit Unit-Tests.
- `apps/mobile`: Expo (Expo Router, React Native Skia). Dienste hinter Interfaces: `src/services/{ads,purchases,content}.ts`.

## Befehle

`pnpm typecheck` · `pnpm test` · `pnpm format`
