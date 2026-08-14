# Fokus App — Paket 2 (v1.5.0): Avatar-Panorama — Komposition aus BG + Objekten + Avatar + Vitalitäts-CSS

## Kontext
Repo `pascalhof94/fokus-app`, Datei `neu.html` (einzige Code-Änderung). Stand: **v1.4.2** (Commit 8918b20, Build 2026-08-13-9). Alle 60 finalen Panorama-Bilder liegen in `img/` (von Pascal vor dem Lauf hineingelegt):
- `avatar-s01.png … avatar-s20.png` — 20 Wohlstands-Avatare, transparent, **alle exakt 720 px hoch, Breite variiert** (alpha-gecroppt). ACHTUNG: s01–s04 ÜBERSCHREIBEN die bisherigen Dateien gleichen Namens (neues Format: gecroppt statt Leinwand).
- `obj-home1…5.png, obj-car1…5.png, obj-boat1…5.png, obj-air1…5.png, obj-pet1…5.png, obj-friends1…5.png` — 30 Wohlstands-Objekte, transparent, max. Kante 560 px.
- `bg01.jpg … bg10.jpg` — 10 vollflächige Reise-Hintergründe (1200×669), Progression arm→reich: Home-Office → Wohnzimmer → Park → Hügel → Altstadt → Promenade → Bergsee → Palmenstrand → Mittelmeerklippe → Yacht-Deck.
- `avatar-pascal.png` bleibt im Repo als reiner Not-Fallback.

## Leitplanken
NUR `neu.html` ändern (sw.js/index.html/manifest tabu) · `APP_VERSION` → **1.5.0**, `APP_BUILD` hochzählen · keine Storage-Format-Änderung (alles Abgeleitetes zur Laufzeit) · Regressionssuiten müssen grün bleiben · Report als TEXT im Chat (kein Anhang).

## A — AVATAR_BILDER auf 20 echte Slots
```js
const AVATAR_BILDER = [
  'img/avatar-s01.png','img/avatar-s02.png','img/avatar-s03.png','img/avatar-s04.png',
  'img/avatar-s05.png','img/avatar-s06.png','img/avatar-s07.png','img/avatar-s08.png',
  'img/avatar-s09.png','img/avatar-s10.png','img/avatar-s11.png','img/avatar-s12.png',
  'img/avatar-s13.png','img/avatar-s14.png','img/avatar-s15.png','img/avatar-s16.png',
  'img/avatar-s17.png','img/avatar-s18.png','img/avatar-s19.png','img/avatar-s20.png'
];
```
20 Einträge, ein Eintrag je `bildSlot` (Struktur wie in v1.4.2 von dir korrigiert). `avatar-pascal.png` nur noch als `onerror`-Fallback am `<img>`. Der v1.4.2-Contract gilt unverändert: `avatarBild()` liefert in JEDEM Zustand eine gültige Quelle — Vitalität ändert nie die Bildquelle, nur CSS.

## B — Panorama-Komposition in `.avscene` (Belohnungsseite)
Die `.avscene` wird zur Bühne mit Layern (alle absolut positioniert, Szene behält ihre bisherige Außengeometrie):

**Layer 0 — Hintergrund:** `bgFuerLevel(level)`: Stufe = `Math.min(10, Math.floor((level-1)/10)+1)` → `img/bg<NN>.jpg` als `background-image` (cover, center). Der bestehende HSL-Verlauf `av.bgStyle` bleibt als Unterlage darunter — bei Ladefehler des JPG sieht man ihn statt eines Lochs. Der Hintergrund hängt am **Gesamt-Avatar-Level**, nicht an einer Kategorie (Reise-Orte = Gesamtwohlstand; die bisherige Emoji-Kategorie „reisen" wird unten auf boat gemappt).

**Layer 1 — Wohlstands-Objekte:** ersetzt die Emoji-Objekte aus `szeneObjekteHtml()` durch `<img>`-Elemente. Kategorien-Mapping bestehende Wohlstands-Leitern → Bildzonen:
`wohnen→home · fahrzeuge→car · reisen→boat · mobilitaet→air · begleiter→pet · soziales→friends`.
Bildstufe je Kategorie: `bildStufe = Math.ceil(aktuelleStufe / maxStufeDerKategorie * 5)` (1–5); Kategorie ohne Freischaltung (Stufe 0) → Objekt komplett ausblenden. Die kleinen Stufen-Badges (Zahlen) dürfen bleiben.

**Positionen/Größen** (Prozent der Szenenhöhe, Startwerte — feinjustieren erlaubt, Ziel: aufgeräumtes Diorama ohne Überdeckung des Avatars):
- home: hinten links, Höhe ~55 %
- car: vor dem Haus („Einfahrt"), Höhe ~22 %
- boat: hinten rechts am Horizont, Höhe ~18 %
- air: oben rechts „fliegend", Höhe ~14 % (darf über dem Horizont schweben)
- friends: rechts als Gruppe, Höhe ~38 %
- pet: vorn neben dem Avatar, Höhe ~14 %
- Avatar: mittig-vorn, bestehende Darstellungsgröße.
**z-Reihenfolge** (hinten→vorn): bg < home < boat < air < friends < car < pet < Avatar.
**Grundlinie:** Objekte (außer air) und Avatar bottom-aligned auf einer gemeinsamen Bodenlinie bei ~92 % Szenenhöhe — Avatare/Objekte sind alpha-gecroppt, Ausrichtung deshalb IMMER über Höhe + bottom steuern, nie über feste Breiten.

**Funkel-Layer `.avfx`** bleibt oberstes Element wie bisher (inkl. `prefers-reduced-motion`).

## C — Vitalität: 5 CSS-Stufen statt binär „erschöpft"
Ersetzt das binäre `.erschoepft` durch Stufen nach Akku (Klassen auf `.avscene`):
- Akku ≥ 80: keine Klasse (voll)
- 60–79: `vital-1` — Avatar `saturate(.9) brightness(.97)`
- 40–59: `vital-2` — Avatar `saturate(.75) brightness(.92)`
- 20–39: `vital-3` — Avatar `saturate(.6) brightness(.85)`, `.avfx` gedämpft
- < 20: `vital-4` — bisheriger Erschöpft-Look (Graustufen .55 / Helligkeit .8, drop-shadow bleibt erhalten wie in v1.4.1 gelöst)
Die Filter wirken auf den Avatar-Layer; BG + Objekte höchstens minimal (max. `saturate(.9)` ab vital-3), damit die Szene lebendig bleibt. Bestehende Aufrufstellen von `erschoepft` migrieren; kein Storage-Feld nötig (rein abgeleitet).

## D — Laden & Robustheit
- Alle Panorama-`<img>`: `loading="lazy" decoding="async"`; Objekte mit `onerror` → Element ausblenden; Avatar mit `onerror` → `img/avatar-pascal.png`.
- KEIN Edit an `sw.js` (tabu) — Runtime-Caching übernimmt der bestehende SW von selbst.
- Tacho-Ring auf der Fokusseite bleibt unverändert (nutzt weiter nur das Avatarbild, kein Panorama).

## Bekannte Bild-Eigenheiten (kein Bug, bitte nicht „reparieren")
- `avatar-s16`, `avatar-s18`, `avatar-s19` sind ¾-Körper (enden an den Oberschenkeln) — bottom-aligned dargestellt wirken sie näher; akzeptiertes Interim, Ersatzbilder folgen später.
- `obj-pet1` (Goldfischglas) und `obj-boat4` (Segel) enthalten bewusst weiße/helle Flächen.

## Abnahme
1. Level 1 / 11 / 21 / … / 91 zeigen bg01…bg10 und den jeweils korrekten Avatar-Slot (Slot-Grenzen 1–5 = s01 usw. wie in v1.4.2).
2. Kategorie-Stufen mappen korrekt auf Objektbilder (Test: eine Kategorie auf Stufe 0/1/max setzen → ausgeblendet/Bild 1/Bild 5).
3. Vitalitätsstufen: Akku 85/70/50/30/10 zeigen die 5 Zustände; Bildquelle bleibt in allen gesetzt.
4. Grundlinie sauber: nichts schwebt (außer air), nichts überdeckt den Avatar.
5. Funkel-Stufen (Lv 25/50/75/90+) unverändert sichtbar, `prefers-reduced-motion` respektiert.
6. Tacho-Ring unverändert; keine 404 in der Konsole; jsc-Syntax sauber; Regressionen grün; APP_VERSION 1.5.0, Build erhöht.

Report als Text: Commit, Build, gewählte finale Positionen/Größen, Abweichungen.
Empfehlung: Opus, ~40–50 % Fenster.
