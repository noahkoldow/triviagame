# NEXUS – Wissens-Quiz im zerstörten Netzwerk

Lies `docs/CONCEPT.md` (Konzept) und `docs/PROGRESS.md` (Stand, TODOs) zu Beginn jeder Sitzung. Entscheidungen in `docs/DECISIONS.md`.

## Stack

pnpm workspaces. `apps/mobile` (Expo SDK 58, Expo Router, React Native Skia, Expo Go-tauglich), `packages/shared` (reine Logik, Vitest).

## Konventionen

- TypeScript strict; Conventional Commits; kleine Commits.
- Spiellogik als reine Funktionen in `packages/shared` mit Tests; UI hält keine Spielregeln.
- Externe Dienste (Ads, Käufe, KI-Inhalte, Backend) hinter Provider-Interfaces mit Mock als Standard. Nichts, was Expo Go sprengt (kein AdMob/natives Firebase) im Standardpfad.
- Keine Secrets im Code. Keine festen Gemini-Modellnamen (Konfiguration).
- UI-Texte nur in `apps/mobile/src/i18n/{de,en,fr,es}.ts` (Deutsch ist die Quelle, die anderen Sprachen müssen jeden Schlüssel haben), im Screen über `useStrings()`. Story-Texte in `packages/shared/src/i18n/story.*.ts`, Übersetzungen eingebauter Fragen in `packages/shared/src/i18n/content.*.ts`. Kein neuer sichtbarer Text ohne alle vier Sprachen (D59).
- Vor jedem Commit: `pnpm typecheck && pnpm test`.
