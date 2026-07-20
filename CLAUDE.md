# Fokus App 2.0 — Projektanweisung (CLAUDE.md)

## Rolle
Du (Claude Code) implementierst diese App exakt nach der beiliegenden Spezifikation.
Architektur- und Anforderungsentscheidungen werden NICHT hier neu getroffen — die sind bereits
mit Pascal im Claude-Chat (claude.ai) verhandelt und liegen fest. Bei Unklarheiten: Rückfrage an
Pascal stellen, nicht selbst neu interpretieren oder umdesignen.

## Wichtigste Referenz
→ `spec/260720_FokusApp2-0_Handoff-Spezifikation.md` — die vollständige, verbindliche Spezifikation
(Architektur, Datenmodell inkl. JSON-Schema, Punktesystem, Oberfläche, Regeln, Belohnungsseite,
Navigation, technische Basis). Lies sie VOR jeder Implementierungsentscheidung vollständig.

## Weitere Dateien in diesem Projekt
- `spec/*.html` — visuelle Referenz-Mockups (Interaktion/Stil-Referenz, nicht 1:1 abzutippen):
  Konzept-Entwurf, Belohnungsseite-Stilvarianten, Pixel-Art-Rang-Visualisierung, Navigation-Mockup.
- `spec/_privat_belohnung_stufen_NICHT_ZEIGEN.md` — konkrete Inhalte der Belohnungs-Rang-Stufen.
  **Bau sie ein, aber besprich sie NICHT mit Pascal und faße sie nicht zusammen** — er möchte von
  den freigeschalteten Inhalten erst live in der fertigen App überrascht werden.
- `assets/` — Referenzfotos von Pascal für den Avatar-Feinschliff (folgen, sobald vorhanden).

## Kernprinzipien (Kurzfassung — Details ausschließlich in der Spezifikation verbindlich)
1. Zwei strikt getrennte Datendomänen (DFM/Airtable vs. Privat/Dokument) — nie im selben
   Speicher/Feld vermischen.
2. Die App hat KEINEN direkten Airtable- oder Internet-Zugriff. Sync läuft nur über
   Export-/Import-Dateien (JSON), die Pascal manuell zwischen App und dem Claude-Chat kopiert.
3. Ein Punktesystem für alle Aufgaben/Routinen/Counter (Komplexität × Energie × Blockade,
   zusätzlich Geld-Score nur bei DFM-Aufgaben) — alle Faktoren/Sätze sind Settings, keine
   Konstanten im Code.
4. Universeller Karten-Kontrakt, appweit identisch: Tap auf die Karte = Detailansicht öffnen,
   NIEMALS abhaken. Abhaken nur über ein eigenes, klein abgegrenztes Häkchen-Feld. Play/Pause =
   ein Toggle-Button (kein separates Play/Pause-Icon-Paar).
5. iPhone-only PWA (wie die bisherige Routinen-App), offline-fähig (localStorage), GitHub Pages
   Hosting, ein einheitliches DFM-CI-Dark-Farbschema (Werte in der Spezifikation, Abschnitt 8).

## Erste Schritte (Vorschlag — mit Pascal abstimmen, bevor du weit vorausbaust)
1. Projekt-Grundgerüst anlegen (`index.html` / `manifest.json` / `sw.js` / Icons), PWA-Update-Muster
   wie in der bisherigen Routinen-App (network-first Service Worker).
2. Datenmodell + lokalen Speicher implementieren (Spezifikation Abschnitt 2).
3. Tagesstream + Fokus-Leiste + Task-Karte bauen (Abschnitt 4), noch ohne Belohnungsseite.
4. Punktesystem-Engine anschließen (Abschnitt 3).
5. Navigation/3-Tab-Struktur einziehen (Abschnitt 7), universeller Karten-Kontrakt zuerst testen.
6. Belohnungsseite + Avatar zuletzt (Abschnitt 6) — den Avatar-Feinschliff (echte Ähnlichkeit zu
   Pascal) iterativ gemeinsam mit ihm verfeinern, sobald `assets/` Referenzfotos enthält.

## Nicht tun
- Keine eigene Architektur- oder Anforderungsentscheidung ohne Rückfrage an Pascal/den Claude-Chat.
- Keine Airtable-Zugangsdaten im Code (gibt es nicht, braucht die App auch nicht).
- Belohnungs-Rang-Inhalte nicht mit Pascal besprechen, zusammenfassen oder vorab zeigen.
