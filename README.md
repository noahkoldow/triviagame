# NEXUS

Wissens-Quiz im zerstörten Netzwerk: Baue vom zentralen Chip aus Bahnen wieder auf, sammle Datenfragmente, merke sie dir und beantworte Fragen. Konzept: [docs/CONCEPT.md](docs/CONCEPT.md).

## Erster Test in Expo Go

```bash
pnpm install        # Node >= 22
pnpm start          # Expo-Dev-Server, QR-Code mit Expo Go scannen
# Handy und Rechner nicht im selben WLAN? -> pnpm --filter @nexus/mobile start:tunnel
```

Der Prototyp läuft komplett lokal: Mock-Fragen, Mock-Werbung (Overlay statt AdMob), Mock-Käufe. Der Spielstand liegt in `AsyncStorage`.

## Aufbau

- `packages/shared`: reine Spiellogik (Netzwachstum, organisches Layout, Schwierigkeit, Interessen-Bandit, Wiederholung, Belohnungen, Werbe- und Gem-Regeln, Mock-Fragen) mit Unit-Tests.
- `apps/mobile`: Expo (Expo Router, React Native Skia). Dienste hinter Interfaces: `src/services/{ads,purchases,content}.ts`.

## Befehle

`pnpm typecheck` · `pnpm test` · `pnpm format`
