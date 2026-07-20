# Fokus App 2.0 — Handoff-Spezifikation für Claude Code

**Status:** vollständig verhandelt mit Pascal im Claude-Chat, wartet auf finale Freigabe.
**Zweck dieses Dokuments:** Claude Code implementiert GENAU das hier Definierte. Bei Unklarheiten
nicht selbst interpretieren/neu designen — Rückfrage an Pascal, der sie im Claude-Chat klärt.

---

## 0 · Rollen & Prozess

| Wer | Aufgabe |
|---|---|
| **Claude Chat** (claude.ai, dieser Kontext) | Betrieb: kompletter täglicher Datenfluss (Sync mit Airtable + Privat-Dokument), alle Skills/Systemprompts, Definition JEDER künftigen Anforderungsänderung. |
| **Claude Code** | Reine Umsetzung dieser Spezifikation. Kein eigener Airtable-Zugriff, keine Sync-Logik-Entscheidungen — die App exportiert/importiert nur Dateien/Text, die Menschen (Pascal) manuell zwischen App und Claude-Chat hin- und herträgt. |
| **Pascal** | Nutzt die App täglich, gibt Freigaben, bringt Änderungswünsche in den Claude-Chat (nicht direkt zu Claude Code). |

---

## 1 · Architektur & Datenfluss

### 1.1 Systemübersicht
Drei Speicher-Layer:
1. **App-eigener Arbeitsspeicher** (aktuell: `localStorage`, wie in der bisherigen Routinen-App) — hält den laufenden Tag/die laufende Session (Punkte, Streak, heutige Queue, Wohlstand-Stand).
2. **DFM-Persistenz:** Airtable (Base `appyHNK8rnpMnKwny`) + Finder-Dokumente — **unverändert**, App hat KEINEN direkten Zugriff darauf.
3. **Privat-Persistenz:** eine einzelne Datei im Finder (Details siehe 2.3) — App hat auch hierauf keinen direkten Live-Zugriff, sondern schreibt/liest sie über manuellen Export/Import durch Pascal.

Die App selbst hat **keine Internet-/API-Anbindung an Airtable oder Claude** — jeglicher Datentransfer
läuft über Dateien/Text, die Pascal manuell zwischen App und dem Claude-Chat kopiert (Copy/Paste oder
Download/Upload), genau wie beim bisherigen Feierabend-Export-Muster.

### 1.2 Datenfluss-Momente
- **Tag starten:** App fragt kurz Energie + Motivation ab → schlägt einen Akku-Startwert vor (Pascal kann ihn jederzeit manuell überschreiben). App lädt außerdem den zuletzt importierten Airtable-/Privat-Stand aus ihrem eigenen Speicher (siehe „Sync jetzt" — der eigentliche Import passiert dort, nicht live beim Start).
- **Sync jetzt (Button, jederzeit auslösbar):** App erzeugt einen Export-Block (JSON, wie bisheriger Feierabend-Export). Pascal kopiert ihn in den Claude-Chat. Dort verarbeiten die bestehenden Skills die DFM-Seite (Airtable-Schreibungen nach Freigabe) und erzeugen ein **Import-Paket** zurück, das Pascal in die App einfügt (Paste/Upload). Die App gleicht dieses Paket über die **Airtable-Record-ID** ab: neue ID → anlegen, vorhandene ID mit geänderten Feldern → updaten, ID nicht mehr enthalten/archiviert → entfernen. **Keine Duplikate.**
- **Nebenläufige Skills:** `/Mails analysieren`, DFM-Erfassung etc. schreiben manchmal unabhängig von der App direkt nach Airtable. Die App bemerkt das nicht selbst — erst beim nächsten „Sync jetzt" (Import-Paket) zieht sie diese Änderungen mit rein.
- **Tag abschließen:** finalisiert beide Seiten (Export für DFM + finale Privat-Dokument-Version), friert die heute erledigten Punkte ein, addiert die Tages-Gesamtpunkte zum kumulativen **Wohlstand-Stand** (siehe 6.3).

---

## 2 · Datenmodell & Speicherorte

### 2.1 Typ-System — für BEIDE Domänen identisch
Jedes Item hat einen Typ: **Aufgabe** / **Routine** / **Counter**. Gilt gleichermaßen für DFM- und Privat-Items (bisher hatte DFM nur „Aufgabe" als normale Karte — das wird erweitert).

| Typ | Beispiel DFM | Beispiel Privat |
|---|---|---|
| Aufgabe | Angebot überarbeiten | Wäsche machen |
| Routine | Post abholen (täglich) | Morgenhygiene |
| Counter | Kaltakquise-Anrufe (Tick) | Heißgetränk (Tick) |

### 2.2 Counter: konfigurierbare Tick-Kurve
Ersetzt die alte starre Trennung „Aufbau-Counter" vs. „Limit-Counter":
```
Tick 1 .. Schwelle:   + Punkte pro Tick
Tick > Schwelle:      ± Punkte pro Tick (kann negativ werden)
```
Beispiel Heißgetränk: Schwelle 3, danach −2 P/Tick. Beispiel Kopf: Schwelle 2, danach −2 P/Tick.
Schwelle und beide Punktesätze sind pro Counter frei einstellbar (Settings, siehe 4.3/7.3).

### 2.3 Privat-Dokument — Format & Ablage
- **Genau eine Datei**, enthält ZWEI Teile in einem Dokument: oben eine für Pascal lesbare KPI-Übersicht (Klartext), darunter ein eingebetteter JSON-Block mit den vollständigen Rohdaten.
- **Format:** Markdown (`.md`).
- **Namenskonvention:** `YYMMDD_Privat_Tagesabschluss.md` (analog zur DFM-Konvention `YYMMDD_[CTC]_[SONSTIGES]`, aber eigener Namensraum).
- **Ablageort:** eigener Ordner, getrennt vom `/DFM Workflow/`-Baum (exakter Pfad noch mit Pascal final abzustimmen — Platzhalter im Code, nicht hart annehmen).
- Wird bei jedem „Tag abschließen" neu geschrieben (überschreibt/versioniert die Vortagesdatei — Versionierung nach demselben Muster wie DFM, kein Löschen).

### 2.4 Datenschema-Vorschlag (aus 2.1–2.3 abgeleitet, zur technischen Umsetzung)

```jsonc
// Item (Aufgabe/Routine/Counter, DFM oder Privat)
{
  "id": "recXXXXXXXXXXXXXX | lokale-uuid",   // Airtable-Record-ID bei DFM, sonst lokal generiert
  "domain": "dfm | privat",
  "typ": "aufgabe | routine | counter",
  "titel": "string",
  "komplexitaet": "leicht | mittel | schwer",
  "energie": "gibt | neutral | zieht",
  "blockade": "keine | leicht | mittel | stark",
  "geldImpact": "hoch | mittel | niedrig | null",   // nur domain=dfm
  "projekt": "string | null",                        // dfm: Airtable-Link-Name, privat: Freitext
  "deadline": "YYYY-MM-DD | null",
  "aufwandGeplantMin": "number",
  "istMinuten": "number",
  "prioritaet": "muss | soll | idee",
  "notiz": "string",
  "kommentarFuerClaude": "string",
  "streamSlot": "number (Minuten seit 00:00) | null",  // null = nicht im Tagesstream platziert
  "status": "offen | in_arbeit | erledigt",
  "istAnker": "boolean",           // true = fixer Termin, nicht verschiebbar
  "ankerBezugId": "id | null"      // für Vor-/Nachbereitung: verweist auf den Anker-Termin
}

// Counter-spezifische Zusatzfelder
{
  "tickSchwelle": "number",
  "punkteJeTickVorSchwelle": "number",
  "punkteJeTickNachSchwelle": "number",
  "tickStandHeute": "number"
}

// Tagesstand (App-Arbeitsspeicher)
{
  "datum": "YYYY-MM-DD",
  "akkuProzent": "number",
  "gesamtpunkteHeute": "number",
  "wohlstandStand": "number",       // kumulativ, siehe 6.3
  "streak": "number",
  "log": [ /* erledigte Items mit Zeitstempel */ ]
}

// Export-Paket (Sync jetzt / Tag abschließen)
{
  "typ": "sync | tagesabschluss",
  "datum": "YYYY-MM-DD",
  "items": [ /* Item[] mit aktuellem Status */ ],
  "zeitEintraege": [ { "itemId": "id", "minuten": "number", "erledigt": "boolean" } ]
}

// Import-Paket (Rückgabe aus dem Claude-Chat in die App)
{
  "neu": [ /* Item[] */ ],
  "aktualisiert": [ /* Item[] mit id */ ],
  "entfernt": [ "id", "id" ]
}
```

---

## 3 · Punktesystem — vollständig

### 3.1 Basisformel (gilt für JEDE Aufgabe/Routine, jede Domäne)
```
Punkte = (Ist-Minuten ÷ 5) × Komplexität × Energie × Blockade
```
Ausnahme Priorität **"Idee"**: Ist-Minuten werden für die Formel auf die geplanten Minuten
**gedeckelt** — Mehrarbeit an einer Idee bringt keinen Punkte-Bonus (verhindert Prokrastination
auf Kosten liegender Muss-Aufgaben).

### 3.2 Komplexität × Energie × Blockade — Faktoren
| Komplexität | Faktor | | Energie | Faktor | | Blockade | Faktor |
|---|---|---|---|---|---|---|---|
| leicht | ×1,0 | | gibt | ×0,8 | | keine | ×1,0 |
| mittel | ×1,5 | | neutral | ×1,0 | | leicht | ×1,2 |
| schwer | ×2,0 | | zieht | ×1,3 | | mittel | ×1,5 |
| | | | | | | stark | ×2,0 |

### 3.3 Geld-Score-Zusatz — NUR bei DFM-Aufgaben
```
DFM-Gesamtpunkte = Basis-Punkte + Geld-Score
Geld-Score = (Hoch 300 / Mittel 200 / Niedrig 100) − Tage bis Deadline
```
Privat-Aufgaben haben keinen Geld-Score-Anteil.

### 3.4 Boni & Mali
| Regel | Satz | Gilt für |
|---|---|---|
| Schiebe-Malus (Muss) | −20 % der Basis-Punkte je Tag geschoben | beide Domänen |
| Schiebe-Malus (Soll) | −10 % je Tag | beide |
| Schiebe-Malus (Idee) | 0 % | beide |
| Plan-Malus (im Tagesstream platziert, bei Tagesabschluss nicht erledigt) | wie Schiebe-Malus (nach Muss/Soll/Idee) | beide |
| Rhythmus-Routine verpasst | −2 Punkte/Tag überfällig | nur Privat |
| Rhythmus-Routine früher erledigt | +1 Tagesbonus | nur Privat |
| Streak-Bonus | +3 | beide |
| Limit-Counter über Grenze | individuell, siehe Tick-Kurve (2.2) | beide, meist Privat |

### 3.5 Gesamtpunktestand & Aufschlüsselung
Eine **Gesamtzahl** = Summe aller heute erledigten Punkte (DFM + Privat zusammen). Zusätzlich zwei
wählbare Aufschlüsselungs-Achsen im Dashboard: **nach Bereich** (Finanzen/Sales/…/Privat) und
**nach Tagesabschnitt** (Morgen/Tag/Abend). Erledigte Punkte frieren zum Abschlusszeitpunkt ein;
offene Aufgaben zeigen den live berechneten (aktuellen) Wert — ändert sich automatisch, wenn sich
z. B. Geld-Impact oder eine Prioritäts-Einstellung ändert.

### 3.6 Pace-Kennzahlen
```
Punkte/Min (Punktedichte)  = Punkte ÷ Ist-Minuten
Punkte/Std-Ziel            = Tagesziel-Punkte ÷ verfügbare Arbeitsstunden
```
Tagesziel-Punkte = Summe der Punkte aller aktuell im Tagesstream platzierten Items (wächst dynamisch,
wenn weitere Aufgaben aus der Warteschlange reingezogen werden — analog zur bisherigen
Gamingcockpit-Logik, jetzt aber über beide Domänen vereinigt).
Punkte/Std-Ziel läuft als Soll-Linie neben dem tatsächlichen Punkte/Std — zeigt sofort, ob Pascal im
Soll ist oder hinterherhinkt (siehe Mockup 4.2).

### 3.7 Einstellbarkeit
**Alle** Faktoren/Sätze aus 3.2–3.6 sind Settings (einstellbar über die ⚙️-Ansicht, siehe 7.3),
keine festen Konstanten im Code — das System muss sich im Live-Betrieb balancieren lassen.

---

## 4 · Oberfläche

### 4.1 Sticky Fokus-Leiste
Fixer Layer über allen drei Tabs (siehe Abschnitt 7), niemals ausgeblendet.
- Zeigt aktuellen Fokus (Titel, Timer, Punkte/Min live), plus kompakten Akku-Indikator (Icon + %).
- **Play/Pause ist EIN Toggle-Button**, kein separates Play- und Pause-Icon: läuft der Fokus, zeigt der Button ⏸ (Tap pausiert); ist pausiert, zeigt er ▶ (Tap startet weiter). Beliebig oft hin und her, Pascal bestimmt.
- Wenn kein Fokus aktiv: Leiste bleibt sichtbar, ein Tap öffnet den Fokus-Tacho zur Auswahl/Instant-Start.

### 4.2 Fokus-Tacho (Modal/Sheet)
- Öffnet sich beim Tap auf die Fokus-Leiste.
- **Task-Switcher-Filter:** zeigt NUR Items, die entweder bereits begonnen-aber-nicht-fertig sind, ODER Priorität „Muss" haben (unabhängig vom Startstatus). Alles andere wird hier nicht gelistet.
- Im Tacho ist die **komplette Karte editierbar** (alle Felder aus 2.4), inkl. Live-Anzeige Punkte/Min.
- Instant-Timer-Option: Name eintippen → startet sofort einen Fokus, legt im Hintergrund ein echtes Muss-Item an (Analogie zur bisherigen Routinen-App).

### 4.3 Task-Karte (Sheet, von unten)
- Felder als **Schieberegler** (Komplexität/Energie/Blockade) statt Tabellenzeilen/Dropdowns — schneller einzustellen, gleiches Bedienkonzept auch in den Settings (7.3) wiederverwendet.
- **Zwei getrennte Kommentarfelder:**
  - **Notiz** — strukturierter Kontext, entspricht 1:1 dem Airtable-Notiz-Feld.
  - **Kommentar für Claude** — Instruktions-/Korrektur-Kanal: Dinge, die beim nächsten Sync verarbeitet werden sollen (z. B. „hab nebenbei X mit erledigt, bitte in Airtable/Privat-Dokument nachtragen").

### 4.4 Tagesstream (Hauptansicht)
- Karten-**Höhe skaliert nach Inhalt** (Feldanzahl), NICHT nach geplanter Zeitdauer.
- Zeit-Fortschritt bleibt trotzdem sichtbar, aber als **eigene, kompakte Pace-Leiste**: dünner
  Zeit-Fortschrittsstrich (Arbeitstag-Start bis -Ende, Jetzt-Marker) + Punkte/Std-Pace (3.6) als
  Hauptsignal, weil das direkt am Tagesziel hängt. Akku bleibt ein eigenes, separates Widget.
- Karten farblich nach Domäne unterschieden (Rand blau = DFM, orange = Privat, grau = Counter).

### 4.5 Dashboard-Grundlage
Geht in der Belohnungsseite (Abschnitt 6) auf — dort auch die klassische Bereich-/Tagesabschnitt-Aufschlüsselung.

---

## 5 · Regeln: Sortierung & Verschieben

### 5.1 Sortierung
- Im Tagesstream: chronologisch nach zugewiesenem Zeit-Slot (`streamSlot`).
- Nicht platzierte Items landen in der Warteschlange, sortiert nach **Gesamt-Punktzahl absteigend**
  (Basis + Blockade + ggf. Geld-Score).

### 5.2 Anker-Termine (Deadlines, Vor-/Nachbereitung)
- Echte Kalender-Termine sind **fixe Anker** (`istAnker: true`) — nicht per Drag verschiebbar.
- Vor-/Nachbereitung (`ankerBezugId` verweist auf den Anker) haben ein **begrenztes
  Verschiebe-Fenster**: Vorbereitung verschiebbar bis kurz vor den Termin, Nachbereitung
  verschiebbar bis Tagesende — nicht frei wie normale Aufgaben.

### 5.3 Verschieben (normale Aufgaben/Routinen/Counter)
- Ziehen am Griff (⠿) versetzt auf neuen Zeitpunkt im Stream — **Push-down-Layout**: Karten
  überlappen nie, rücken sich ggf. nach hinten, bleiben immer voll lesbar.
- Rausziehen aus dem Stream (kein `streamSlot` mehr) legt das Item zurück in die Warteschlange und
  löst den Schiebe-Malus aus (3.4), sobald der Tag endet, ohne dass es erledigt wurde.
- *(Als vorläufig übernommen markiert — wird im Live-Betrieb weiter getestet und ggf. per Settings-Update nachjustiert.)*

---

## 6 · Belohnungsseite & Avatar

### 6.1 Akku-Prominenz
Kompakter Indikator dauerhaft in der Fokus-Leiste (4.1). Die volle Energie-Kurve über den Tag lebt
exklusiv auf der Belohnungsseite (Tab 2), um den Stream nicht zu überladen.

### 6.2 Avatar-Konzept
- **Stil:** Pixel-Art (siehe Companion-Datei `260720_FokusApp2-0_Rang-Visualisierung-PixelArt2x.html`
  für Technik/Auflösung — 2x Pixel-Dichte ggü. dem ersten Test). Angelehnt an Pascal selbst
  (Feinabgleich mit Referenzfoto folgt in eigener Runde), NICHT Fantasy-Look wie Habitica.
- **Fortschritt-Thema:** reale Welt statt Fantasy — von „mittellos" bis „wohlhabend".
- **Kein Shop/keine Währung:** alles schaltet automatisch bei Schwellenwerten frei, nichts wird gekauft.
- **Vitalitäts-Achse** (Tamagotchi-Effekt): bewusst als *gepflegt-vital ↔ erschöpft-vernachlässigt*
  umgesetzt statt als Körpergewicht (Pascals Original-Idee war „dünn vs. Fitnessmodell") — gleiche
  Wirkung, ohne Gewichts-/Körperbild-Assoziation. Getrieben von z. B. Akku-Durchschnitt/Konsistenz,
  nicht von echten Gesundheitsdaten.
- **Bewegung:** Idle-Animation + eigene Animation beim Rang-Aufstieg (Konfetti + optischer Wechsel,
  siehe Companion-Datei für Referenz-Interaktion).

### 6.3 Freischalt-Mechanik
- **6 Kategorien**, jede mit einer **eigenen Leiter von 12–15 Stufen** (nicht eine gemeinsame
  Rang-Leiter): 🚗 Fahrzeuge · 🏙️ Dachterrasse/Wohnen · 🌍 Landschaften/Reisen · ✈️🚤 Mobilität
  (andere Formen) · 🐾 Begleiter · 👥 Freunde/Soziales.
- **Wohlstand-Formel** (treibt alle Leitern an):
  ```
  Wohlstand_neu = Wohlstand_alt + Tages-Gesamtpunkte
  ```
  Wird bei JEDEM Tagesabschluss aktualisiert, **kumulativ, nie zurückgesetzt** — unabhängig vom
  täglichen Pace-Zähler aus 3.6, der jeden Tag neu bei 0 beginnt.
- Objekte schalten **nach Wert aufsteigend** frei. Manche Stufen sind zusätzlich an eine
  **Mindest-Stufe einer anderen Kategorie** gebunden (Cross-Prerequisite).
- **Zufallsfaktor:** bei erreichtem Schwellenwert + erfüllter Vorbedingung kommt ein Objekt in einen
  „Eligible Pool" — die tatsächliche Freischaltung würfelt (Vorschlag: tägliche Chance, bis sie
  eintritt), damit der Moment überrascht statt exakt vorhersehbar zu sein.
- **Die konkreten 12–15 Stufen je Kategorie** (welches Objekt bei welchem Wohlstand-Wert, welche
  Cross-Prerequisites) liegen in einer separaten, vertraulichen Datei vor, die NICHT Teil dieses
  Dokuments ist und Pascal bewusst nicht vorab gezeigt wird (Überraschungseffekt beim
  In-App-Erreichen). Diese Datei wird separat an Claude Code übergeben.

### 6.4 Dashboard
Zwei Aufschlüsselungs-Achsen (Bereich / Tagesabschnitt, siehe 3.5) leben visuell auf dieser Seite,
zusammen mit Avatar, Rang-Fortschrittsbalken je Kategorie und den Pace-Kennzahlen aus 3.6.

---

## 7 · Navigation & Interaktions-Kontrakt

### 7.1 Globale Struktur
- **Genau 3 Tabs**, nicht mehr: 🕐 Stream (Standard) · 🏆 Belohnung · ⚙️ Einstellungen.
- Fokus-Leiste (4.1) ist **kein Tab** — sie liegt als fixer Layer über allen dreien.
- „Tag starten"/„Tag abschließen" sind geführte Screens/Wizards, aus dem Stream-Tab heraus gestartet — kein eigener Dauer-Tab.

### 7.2 Universeller Karten-Kontrakt — gilt identisch für JEDEN Kartentyp (DFM/Privat, Aufgabe/Routine/Counter, überall im System)
| Element | Aktion |
|---|---|
| ▶⏸ Play/Pause-Button (eigenes kleines Element) | Fokus starten/pausieren, Toggle (4.1) |
| **Tap auf die Karte selbst** (überall sonst auf der Karte) | öffnet **immer** die Detailansicht als Sheet von unten — **niemals** ein Abhaken |
| **Eigenes Häkchen-Feld** (klein, präzise abgegrenzter eigener Hit-Bereich) | **einziger** Weg zum Abhaken/Erledigt-Markieren |
| ⠿ Griff | **nur** zum Verschieben/Neuordnen im Stream (Drag) — löst sonst nichts aus |
| Sheet schließen | immer per Wisch-nach-unten ODER ✕ oben rechts — ein einziges Muster überall |

**Warum diese Präzisierung wichtig ist:** In der Vorgängerversion war das Tap-Verhalten je Screen
uneinheitlich (mal ganze Karte = Häkchen, mal nur ein Mini-Button) und es gab teils verschachteltes
Aufklappen — beides eine wesentliche Bug-/Frustrationsquelle. Pascal hat sich zudem wiederholt aus
Versehen beim Karten-Tap Items abgehakt — daher jetzt strikt: **Kartenfläche = ansehen,
Häkchen-Feld = abhaken**, nie vermischt.

### 7.3 Einstellungen (⚙️-Tab)
Nutzt exakt dieselbe Schieberegler-Komponente wie die Task-Karte (4.3) für alle einstellbaren
Punkte-Parameter (3.7) — kein neues visuelles Vokabular, nur ein neuer Ort dafür.

---

## 8 · Technische Basis

| Aspekt | Festlegung |
|---|---|
| **Device-Ziel** | Nur iPhone (wie bisherige Routinen-App) — Safe-Areas (Dynamic Island/Home-Indikator), 8pt-Raster, 44pt-Touch-Targets wie dort bewährt. |
| **Technik** | PWA: eine `index.html` (HTML/CSS/Vanilla-JS) + `manifest.json` + `sw.js` + Icons, wie das bisherige Muster. |
| **Hosting** | GitHub Pages, „Zum Home-Bildschirm" installiert. |
| **Repo** | **Empfehlung: neues, eigenständiges Repo** (z. B. `fokus` oder `fokus-app`) statt Weiterbau im bestehenden `routinen`-Repo — passt zum „Altlasten entfernen"-Ziel, verhindert versehentliche Kollisionen mit der weiterhin täglich genutzten Routinen-App, eigene saubere Versionshistorie von Tag 1 an. Der bestehende Code dient nur als Konzept-Referenz, nicht als Basis (siehe frühere Entscheidung „komplett neuer Code"). |
| **Offline-Verhalten** | Muss vollständig offline funktionieren, `localStorage` als App-eigener Speicher, network-first Service-Worker fürs Update-Pattern (nur `index.html` ersetzen, App mit Internet öffnen/schließen/neu öffnen für Updates — bewährtes Muster übernehmen). |
| **Individualisierbarkeit** | Ansichten/Settings config-getrieben (2.1, 3.7) statt hart codiert — Ziel: Pascal kann Felder/Parameter selbst anpassen, ohne dass jede Kleinigkeit einen Code-Update-Zyklus braucht. |
| **Design-System** | EIN einheitliches DFM-CI-Dark-Farbschema für die gesamte App (löst die Inkonsistenz der drei Vorgänger-Oberflächen): `--bg:#0d1420 --card:#141e2e --card2:#182438 --line:#243349 --ok:#3ecf8e --warn:#f2b84b --bad:#f66d6d --blue:#4f8ef7 --purple:#b98af7 --cyan:#6dd3e0 --txt:#e8eef7 --mut:#8fa1b8` |

---

## 9 · Referenz- und Companion-Dateien

| Datei | Inhalt |
|---|---|
| `260720_FokusApp2-0_Konzept-Entwurf_v0.4.html` | Visuelle Vorgänger-Fassung dieses Konzepts (Chat-Review-Historie) |
| `260720_FokusApp2-0_Belohnungsseite-Mockup.html` | Zwei Avatar-Stilvarianten, interaktive Rang-Up-Animation (Konzept-Vorlage) |
| `260720_FokusApp2-0_Avatar-PixelArt-Stiltest.html` | Erster Pixel-Art-Stiltest (niedrigere Auflösung) |
| `260720_FokusApp2-0_Rang-Visualisierung-PixelArt2x.html` | **Aktuelle** Referenz: Pixel-Art in doppelter Auflösung, Variante-B-Richtung |
| `260720_FokusApp2-0_Navigation-Mockup.html` | Navigation & Interaktions-Kontrakt, inkl. Play/Pause-Toggle-Demo |
| *(separat, vertraulich)* | Konkrete 12–15-Stufen-Inhalte je Belohnungs-Kategorie — wird direkt an Claude Code übergeben, nicht Teil der Pascal-Review-Kette |

---

## 10 · Offene Punkte / noch zu bestätigen
- Exakter Ablagepfad des Privat-Dokuments (2.3) — Platzhalter im Code, nicht hart annehmen.
- Feinschliff der Avatar-Ähnlichkeit zu Pascal (echtes Referenzfoto-Mapping) — eigene Runde nach Grundgerüst.
- Live-Balancing von Punkte-Sätzen (3.4/3.7) und Verschiebe-Regeln (5.3) — ausdrücklich als iterativ markiert.
