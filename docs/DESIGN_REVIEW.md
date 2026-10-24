# Design-Review (HIG / App Store)

Stand: 2026-10-24. Geprüft: `apps/mobile/app/*.tsx`, `app/node/[id].tsx`, `app/boss/[id].tsx`, `src/components/Win.tsx`, `ui.tsx`, `MapUi.tsx` (plus `QuestionView.tsx`, weil dort die Antwort-Rückmeldung sitzt). Grundlage: Apple HIG (Juni/Sept. 2026). Kontraste sind aus den Hex-Werten gerechnet (WCAG), nicht geschätzt. Zeilennummern gelten für den Stand dieses Reviews.

## Zusammenfassung

**Bewertung: kritische Punkte offen.** Die Idee trägt: Nexus OS als Windows-95-Fiktion („MORPH.EXE“) mit Duolingo-Grün als einziger Aktionsfarbe ist ein echter Standpunkt, und die Grundpalette hat gute Kontraste (Text auf Panel 13,3:1, `dim` 5,5:1, Sektorfarben ≥ 5,6:1). Für die Freigabe fehlen vor allem drei Dinge: Richtig/Falsch wird nur über Rot/Grün angezeigt, Dynamic Type ist auf 130–150 % gedeckelt, und mehrere Bedienelemente haben für VoiceOver keine sinnvolle Beschriftung.

Reihenfolge der Arbeit: 1–2 (kritisch), dann 3–5 (hoch), dann der Rest.

## Kritisch

### 1. Richtig/Falsch nur über Farbe (Rot/Grün)
- **Was:** Nach dem Prüfen färbt `QuestionView.tsx:353-357` die Optionen nur dunkelgrün `#1F5A12` bzw. dunkelrot `#6A1B1B`. Die beiden Töne unterscheiden sich untereinander nur mit 1,42:1. Die Boss-Fortschrittsblöcke `boss/[id].tsx:197` nutzen `#58CC02` gegen `#FF4B4B`, also 1,58:1, und genau das Rot-Grün-Paar, das bei Farbenblindheit kippt. VoiceOver bekommt das Ergebnis nicht mit: `QuestionView.tsx:75` meldet nur `selected`, und das Label in `boss/[id].tsx:191` sagt nur „Frage i von n“.
- **Warum:** `color.md › Inclusive color`: „Avoid relying solely on color to differentiate between objects, indicate interactivity, or communicate essential information.“ Ebenso `accessibility.md › Vision`: „Convey information with more than color alone.“
- **Fix:** In der Optionszeile bei `reveal` ein Symbol plus Wort anzeigen: `Icon name="check"` + „Richtig“ bzw. `Icon name="close"` + „Deine Wahl“. Dazu `accessibilityLabel={`${o}, richtig`}` bzw. `${o}, deine Wahl, falsch`. In jeden Boss-Block ein ✓ oder ✗ (Icon 10 pt, schwarz) setzen und das Label auf `Frage ${i+1} von ${n}. ${richtig} richtig, ${falsch} falsch` erweitern.

### 2. Dynamic Type gedeckelt, Layouts passen sich nicht an
- **Was:** Den Kerninhalt deckelt `maxFontSizeMultiplier` bei 1,3–1,5. Das betrifft die Antwortoptionen (`QuestionView.tsx:79,136,166,245,268` mit 1,3–1,4), `P` (`ui.tsx:121`, 1,5), `H1` (`ui.tsx:111`, 1,4), Button-Labels (`ui.tsx:75`, 1,3) und den Story-Text (`onboarding.tsx:112`, 1,4). Dagegen wachsen HUD-Werte, `Chip` und `Pill` unbegrenzt (`MapUi.tsx:84`, `ui.tsx:144,152`), ohne Umbruch: Die HUD-Zeile `MapUi.tsx:187` und die Belohnungszeile `node/[id].tsx:544` haben kein `flexWrap` und laufen bei AX-Größen aus dem Bild. `fontScale` wird nirgends ausgewertet.
- **Warum:** `accessibility.md › Vision`: „give people the option to enlarge text by at least 200 percent“. `typography.md › Conveying hierarchy`: „Prioritize important content when responding to text-size changes.“ `layout.md › Adaptability`: „horizontally adjacent views may need to stack vertically“.
- **Fix:** Inhalt (Fragestamm, Optionen, Erklärung, Story, Codex-Texte, `P`) ohne Deckel oder mit mindestens 2,0. Chrome (Titelleisten, Dock, HUD) darf bei 1,3 bleiben, muss dann aber umbrechen: `const { fontScale } = useWindowDimensions()`; ab `fontScale > 1.3` steht das HUD zweizeilig (Level-Zeile oben, Werte darunter). `flexWrap: 'wrap'` gehört in `MapUi.tsx:187`, `node/[id].tsx:544` und `shop.tsx:186` (`boss/[id].tsx:245` macht es schon richtig). Button-Labels auf 2,0 erhöhen, ohne `numberOfLines`.

## Verbesserungen

### 3. VoiceOver: fehlende oder verschluckte Beschriftungen (hoch)
- `MapUi.tsx:48,62,63`: `Stat` ohne `label`, VoiceOver liest nur „3“, „120“ oder „5“. Fix: `label={`Serie ${streak} Tage`}`, `${bits} Bits`, `${gems} Gems`.
- `shop.tsx:97-104` und `shop.tsx:165-171`: Das Button-Label ist nur die Zahl (`${cost}`), das Icon wird nicht vorgelesen. Fix: `Button` in `ui.tsx:29-59` bekommt eine optionale Prop `a11yLabel` (Vorrang vor `label`). Werte: `${a.de} freischalten, ${cost} Gems`, `${c.de} kaufen, ${c.cost} Bits`, für `shop.tsx:115` „Video ansehen, plus 1 Gem“.
- `index.tsx:330`: Das Label „Tipp von Bolt schließen“ ersetzt den Tipptext. Wer VoiceOver nutzt, hört die Gesten-Anleitung nie. Fix: `accessibilityLabel` = Tipptext, `accessibilityHint="Doppeltippen schließt den Tipp"`.
- `onboarding.tsx:161` („< Zurück“) und `boss/[id].tsx:234` („Weiter >“): VoiceOver liest „kleiner als“. Fix: Pfeile als `Icon` (Prop `icon` gibt es schon) oder `a11yLabel` ohne Pfeil.
- Beleg: `accessibility.md › Vision`: „Describe your app’s interface and content for VoiceOver.“

### 4. Level-Fortschritt im HUD unsichtbar (hoch)
- **Was:** `MapUi.tsx:44` füllt die Segmente mit `#000080` auf `#1A2430`, das sind **1,02:1**. Der Balken wirkt leer.
- **Warum:** `color.md › Inclusive color`: „Avoid using colors that make it hard to perceive content“. Für Bedien- und Statusgrafik gelten mindestens 3:1.
- **Fix:** Gefüllte Segmente in `colors.accent` `#1CB0F6` (6,42:1) oder `WIN.titleB` `#1084D0` (3,91:1).

### 5. Mehrere „Default-Buttons“ pro Dialog (hoch)
- **Was:** In `index.tsx:491` ist „Schließen“ der grüne Primär-Button mit schwarzem Rahmen, „Sofort verbinden“ darüber nur sekundär. In `index.tsx:507-533` stehen zwei Primär-Buttons untereinander („Wartung starten“ und „Schließen“).
- **Warum:** `buttons.md › Style`: „use a button that has a prominent visual style for the most likely action in a view.“
- **Fix:** „Schließen“ überall auf `variant="ghost"`. Genau ein Primär-Button je Dialog, und zwar die eigentliche Aktion.

### 6. Text-Kontraste und Mindestgrößen (mittel)
- `ui.tsx:50`: `danger` `#B00020` auf `#C0C0C0` = **4,03:1** bei 14 pt/600, gefordert sind 4,5:1. Fix: `#8A0018` (5,51:1) oder `fontWeight: '700'`.
- `node/[id].tsx:388`: `P` in `colors.bad` `#FF4B4B` auf `#1F2C33` = **4,34:1** bei 15 pt. Fix: Text in `colors.text`, das Rot nur für Rahmen oder Icon. Alternativ `#FF7070` (5,32:1).
- `MapUi.tsx:200`: `goalChapter` mit 10 pt liegt unter dem iOS-Minimum von 11 pt (`accessibility.md › Vision`, Tabelle). Fix: 12 pt.
- `ui.tsx:170`: `btnSub` (11 pt) trägt ganze Sätze (`node/[id].tsx:278-284`, `index.tsx:509`). Fix: Den Untertitel auf höchstens 4 Wörter kürzen, die Erklärung als `P` (≥ 13 pt) unter den Button.

### 7. Boss-Lauf ohne Rückfrage abbrechbar (mittel)
- **Was:** `boss/[id].tsx:189`: Das „X“ der Titelleiste ruft mitten im Lauf `router.back()` auf. Bisherige Antworten gehen still verloren.
- **Warum:** `modality.md › Best practices`: „help people avoid data loss by getting confirmation before closing a modal view.“
- **Fix:** Bei `marks.length > 0 && !outcome` ein `Alert` zeigen: „Angriff abbrechen? Deine bisherigen Antworten zählen nicht.“ mit [„Weiterspielen“ (cancel), „Abbrechen“ (destructive)].

### 8. Feste Positionen und sichere Bereiche (mittel)
- `index.tsx:672`: Der Tipp sitzt fest bei `bottom: 176`. Bei größerer Schrift oder anderem Inset überlappt er Dock und Cache. `panelTop` wird schon gemessen (`index.tsx:109,343`). Fix: `bottom: size.height - (panelTop ?? size.height) + 8` setzen oder den Tipp als erstes Element in den unteren Stapel `styles.stack` legen.
- `index.tsx:698`: Unten ausgerichtete Dialoge (`backdrop`, `padding: 12`) liegen unter dem Home-Indikator. Fix: `paddingBottom: 12 + useSafeAreaInsets().bottom`.
- `index.tsx:304,314`: Die Banner sind etwa 39 pt hoch. Fix: `minHeight: 44` (`accessibility.md › Mobility`, 44×44 pt).
- Beleg: `layout.md › Guides and safe areas`.

### 9. Navigation: „X“ auf gepushten Seiten (mittel)
- **Was:** Codex, Profil, Shop und Datenschutz werden gepusht (`_layout.tsx:53-58`, `animation: 'fade'`), aber über ein „X“ oben rechts geschlossen (`ui.tsx:125-137`, `BackBar`). Ein X steht auf iOS für das Schließen eines Modals. Ob die Wisch-zurück-Geste mit `fade` greift, bitte auf dem Gerät prüfen.
- **Warum:** `modality.md › Best practices`: „people typically expect to find a button in the top toolbar or swipe down“.
- **Fix:** Diese vier Routen mit `presentation: 'modal'` deklarieren, dann passen X und Wisch nach unten zusammen und das Fenster-Bild bleibt stimmig. Alternative: Push behalten, aber links einen Zurück-Pfeil „Netz“ statt des X.

## Handwerk (Look)

### 10. Win95 und Duolingo-Reste mischen sich (mittel)
- Sichtbar abgerundet in einer sonst eckigen Welt: die Banner `index.tsx:656-663` (Radius 16) und der Tipp `index.tsx:676` (Radius 22). Fix: Banner als eingelassene Statusleiste (`sunken`, eckig, Icon links) wie `GoalBar`.
- Tote Stile aus der Duolingo-Phase, bitte löschen: `index.tsx:666,682,687-695,699-708`; `node/[id].tsx:487,489,491-523,525,531-543,545-557`; `AdOverlay.tsx:55-62`; `profile.tsx:128-136`.
- Die zwei Frage-Bildschirme sehen verschieden aus: Die normale Frage (`node/[id].tsx:246-306`) steht auf dunklem Grund mit freiem X, der Boss (`boss/[id].tsx:187-238`) im `Window` auf türkisem Desktop. Fix: Die Regel festschreiben (Türkis = System/MORPH, Dunkel = Spielwelt) und die normale Frage ebenfalls in ein `Window` mit dem Thema als Titel setzen.
- Schrift: Fast alles steht in 800/900, dazu kommen gesperrte Versal-Labels mit 10–12 pt („KAPITEL“, „NEUE WEGE“, „BEREICHE FREISCHALTEN“). Fix: 900 nur für `H1` und den Primär-Button, Labels in 700.
- Beleg: `branding.md › Best practices`: „Help people feel comfortable by using standard patterns consistently.“

### 11. Kleinigkeiten (niedrig)
- `shop.tsx:199`: Das Padding von `smallBtn` landet im Wrapper und damit innerhalb des schwarzen Default-Rahmens (`ui.tsx:87`). Zwischen Rahmen und Knopf entsteht eine Lücke. Fix: Padding entfernen.
- `node/[id].tsx:429,559`: Das Sprecher-Label „MORPH funkt dazwischen“ steht im Kultur-Violett `#CE82FF`. MORPH ist Magenta `#FF86D0`, Violett gehört Muse (`color.md › Best practices`: „Avoid using the same color to mean different things.“). Fix: `color: '#FF86D0'`.
- `onboarding.tsx`: „Fertig“ bleibt bei ungültigem Jahr nur grau. Fix: Ab 4 Ziffern einen Hinweis zeigen: „Bitte ein Jahr zwischen 1900 und {Jahr} eingeben.“

## Neue Figuren einbauen (kein HIG-Punkt)
- `node/[id].tsx:345`: `<Morph size={96} form="glasses" />` (Besserwisser nach Fehlern).
- `boss/[id].tsx:155` (verloren) und `boss/[id].tsx:210` (Finale-Intro): `form="crown"`. Firewall gebrochen: `<Morph form="glitch" />`. Nach dem Finale: `form="reformed"`.
- `_layout.tsx:45` (Ladebildschirm) und der erste Onboarding-Schritt: `<Bolt mood="sleepy" />`. Netz instabil (`index.tsx:499-536`): `mood="worried"`. Hüter geweckt oder Kapitel geschafft: `mood="proud"`.
## Was funktioniert (beibehalten)
- Knotenliste als Alternative zur Karte für VoiceOver und kleine Bildschirme (`index.tsx:538-601`), passend zu `accessibility.md › Mobility`: „Offer alternatives to gestures.“
- Spielstand-Reset mit Rückfrage, „Abbrechen“ und destruktivem Stil (`profile.tsx:100-112`).
- Tippflächen fast überall ≥ 44 pt (`ui.tsx:159`, Dock, Cache-Leiste, Checkbox-Zeilen, `hitSlop` am Titelleisten-X).
- Ehrlicher Shop: Preise im Label, „Käufe wiederherstellen“ sichtbar, „Kein Vorteil bei Antworten“.
- Bewegung reduzieren: `MorphScene` und `NetMap`. Neu dazu: `Bolt` (Schweben), `Guardian` (Idle) und `Morph`. Morph flackerte vorher mit 6 Wechseln/s (160 ms) und ist jetzt bei 360 ms, also höchstens 3/s.
- Eine einzige Aktionsfarbe (Grün) im Win95-Relief: Daran erkennt man die App.

## Plattform
- Nur dunkel (`app.json: userInterfaceStyle: "dark"`) ist für ein Spiel vertretbar (`dark-mode.md › Best practices`: „In rare cases, consider using only a dark appearance“).
- App-Symbol und Splash sind eingebunden (`app.json`, Quellen in `apps/mobile/assets/src/`). iOS erzeugt die dunkle und getönte Variante selbst. Später lassen sich eigene Varianten über eine Icon-Composer-Datei (`ios.icon`) nachliefern.
