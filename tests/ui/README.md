# UI-Testharness — Augen für die Fokus App

## Der eine Befehl

```bash
bash tests/ui/run.sh
```

Startet selbst einen lokalen HTTP-Server (`python3 -m http.server`), lädt die
App über `http://localhost` (echter Origin → echtes `localStorage`), fährt mit
dem System-Chrome (headless) alle Ansichten durch, schreibt Screenshots bei
375 px und 430 px nach `tests/ui/screens/`, prüft Layout (Überlauf, Tap-Größen,
buchstabenweiser Umbruch, 0-Größen), `localStorage` (Persistenz über Reload,
Migration genau einmal, Timer überlebt Reload) und lässt jeden Konsolen-Fehler
den Lauf scheitern. Der Server wird in jedem Fall wieder beendet.

## Die Regel für jedes Update mit UI-Anteil (Sparregel, v1.10.1)

- **Der Lauf ist immer vollständig.** Alle Ansichten, beide Breiten, alle
  Prüfpunkte. Er kostet fast nichts und schreibt alle Bilder auf die Platte.
- **Angesehen wird nur, was der Auftrag angefasst hat** — in der Regel bei
  375 px. Eine zweite Breite nur dort, wo der Befund selbst breitenabhängig war.
- **Eine volle Runde über alle Ansichten** gibt es nur bei einem
  Meilenstein-Release, nach einem Umbau am Layout-Gerüst, oder wenn eine
  Prüfung etwas meldet, das man sehen muss.
- **Im Report benennen, was man sieht** — je angesehener Ansicht ein Satz.

Begründung: Bilder sind teuer, Prüfpunkte sind billig. Die Maschine soll alles
messen und nur das Nötige ansehen.

**Ein Screenshot, der komisch aussieht, bleibt ein Befund — auch wenn alle
Assertions grün sind.** Daran ändert die Sparregel nichts.

## Bausteine

- `run.sh` — Runner (Server-Lifecycle, Chrome-Aufrufe, Auswertung, Exit-Code)
- `harness.html` — same-origin Wrapper: Fixture → `localStorage`, App im
  iframe, View-Aktionen, Layout-Checks, Konsolen-Wächter; Ergebnis als JSON im
  DOM (von `run.sh` über `--dump-dom` eingesammelt)
- `fixture.js` — erfundener Datenbestand, alle Kartenarten; hier erweitern
- `screens/` — Screenshots, bei jedem Lauf überschrieben, in `.gitignore`

Die Tap-Größen-Ausnahmen (Sekundärzeile 40 px seit v1.8.0 usw.) stehen als
**eine** Konstante `TAP_AUSNAHMEN` in `harness.html`.
