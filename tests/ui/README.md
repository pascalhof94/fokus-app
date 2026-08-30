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

## Die Regel für jedes Update mit UI-Anteil

1. **Lauf fahren** (`bash tests/ui/run.sh`).
2. **Screenshots ANSEHEN** — mit dem Read-Tool öffnen, nicht nur den Exit-Code
   lesen. Ein Lauf ohne Ansehen erfüllt den Zweck dieses Werkzeugs nicht.
3. **Im Report benennen, was man sieht** — je Ansicht ein Satz.

**Ein Screenshot, der komisch aussieht, ist ein Befund — auch wenn alle
Assertions grün sind.**

## Bausteine

- `run.sh` — Runner (Server-Lifecycle, Chrome-Aufrufe, Auswertung, Exit-Code)
- `harness.html` — same-origin Wrapper: Fixture → `localStorage`, App im
  iframe, View-Aktionen, Layout-Checks, Konsolen-Wächter; Ergebnis als JSON im
  DOM (von `run.sh` über `--dump-dom` eingesammelt)
- `fixture.js` — erfundener Datenbestand, alle Kartenarten; hier erweitern
- `screens/` — Screenshots, bei jedem Lauf überschrieben, in `.gitignore`

Die Tap-Größen-Ausnahmen (Sekundärzeile 40 px seit v1.8.0 usw.) stehen als
**eine** Konstante `TAP_AUSNAHMEN` in `harness.html`.
