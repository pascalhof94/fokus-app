# Fokus App 2.0 — Belohnungsseite: interne Stufen-Inhalte (VERTRAULICH, nicht an Pascal zeigen vor Live-Gang)

Mechanik: Wohlstand = kumulative Lebenszeit-Punkte (nie zurückgesetzt). Jede Kategorie hat eigene
Stufen mit Wohlstand-Schwellen (aufsteigend nach Wert). Manche Stufen zusätzlich an Mindest-Stufe
einer anderen Kategorie gebunden (Cross-Prerequisite). Reveal-Zeitpunkt bei erfüllten Bedingungen
randomisiert (nicht sofort beim Schwellenwert, sondern verzögert im Fenster +0 bis +3 Tage / +Punkte,
damit der Moment überrascht statt vorhersehbar zu sein).

## 🚗 Fahrzeuge (12 Stufen)
1. Fahrrad (Alltagsrad) — 0
2. E-Bike — 800
3. Gebrauchtwagen (Kleinwagen) — 2200
4. Kompaktklasse (gepflegt) — 4500
5. Erstes Coupé (gebraucht, z. B. CLA) — 7500
6. Neuwagen Kompakt-Coupé — 11000
7. BMW M4 (gebraucht) — 16000 · Vorbedingung: Dachterrasse Stufe 4
8. BMW M4 (neu, Vollausstattung) — 22000
9. Exotisches Coupé / Sammlerstück — 29000
10. Zweitwagen (Alltag + Spaß-Coupé) — 37000
11. Kleine Sammlung (2-3 besondere Fahrzeuge) — 46000
12. Referenz-Sammlerstück (wie das gelbe Coupé im Sammler-Showroom) — 56000

## 🏙️ Dachterrasse / Wohnen (12 Stufen)
1. WG-Zimmer — 0
2. Eigene kleine Wohnung — 900
3. Wohnung mit Balkon — 2400
4. Wohnung mit kleiner Dachterrasse — 4800 · Vorbedingung: Fahrzeuge Stufe 3
5. Dachterrasse mit Sitzecke — 7800
6. Dachterrasse mit Grill + Lounge — 11500
7. Dachterrasse mit Whirlpool — 16500
8. Penthouse-Terrasse mit Stadtblick — 23000
9. Terrasse mit Fluss-/Wasserblick — 30000
10. Whirlpool + Wasserblick kombiniert (Traum-Kombi) — 39000
11. Zweitwohnsitz mit Terrasse in mediterranem Klima — 48000
12. Signature-Penthouse (Whirlpool + Skyline + Wasser) — 58000

## 🌍 Landschaften / Reisen (12 Stufen)
1. Wochenendtrip nahes Ausland — 0
2. Städtetrip (beeindruckende Stadt) — 1000
3. Erste Fernreise — 2800
4. Bergurlaub — 5200
5. Insel/Meer-Urlaub — 8200
6. Mediterranes Ziel — 12000
7. Tropisches Ziel — 17000
8. Dschungel-Trip — 23500 · Vorbedingung: Mobilität Stufe 6
9. Kombi-Reise Berge + Meer — 30500
10. Kombi-Reise Berge + Dschungel + Meer (alles gleichzeitig) — 39500
11. Mehrwöchige Kulturreise, neues Kontinent — 49000
12. Signature-Trip (alles: Berge, Dschungel, Meer, neue Kultur) — 59000

## ✈️🚤 Mobilität — andere Formen (12 Stufen)
1. Zu Fuß/ÖPNV — 0
2. Fahrrad-Langstrecke — 700
3. Erste Motorrad-/Roller-Fahrt — 2000
4. Bootstour (Passagier) — 3800
5. Kleines Segelboot/Ausflugsboot — 6500
6. Motorboot-Charter — 10000
7. Erster Rundflug (Passagier) — 14500
8. Segelflug/Kleinflugzeug (Passagier) — 20000
9. Flugstunde (selbst am Steuer) — 26500
10. Bootscharter mehrere Tage — 34000
11. Kombinierter Wasser+Luft-Trip — 43000
12. Signature-Mobilitätstag (Boot + Flug an einem Tag) — 53000

## 🐾 Begleiter (12 Stufen)
1. Erste eigene Katze — 0
2. Katze gut eingelebt (Routine steht) — 600
3. Zweite Katze / Hund als Idee — 1800
4. Hund dazu — 3600
5. Beide gut eingespielt — 6000
6. Größerer Wohnraum für Tiere — 9500
7. Garten/Auslauf für Tiere — 14000
8. Reisen mit Tieren möglich — 19500
9. Tierpension/Betreuung organisiert — 26000
10. Drittes Tier — 33500
11. Tierfreundliches Zweitwohnsitz-Setup — 42000
12. Signature-Setup (alle Tiere, viel Platz, Garten) — 52000

## 👥 Freunde / Soziales (12 Stufen)
1. Spieleabend zuhause — 0
2. Kleiner Ausflug mit Freunden — 500
3. Tennis-/Sport-Match — 1600
4. Roadtrip zu zweit/dritt — 3200
5. Gruppenreise (Freunde) — 5500
6. Event/Feier ausrichten — 8800
7. Größere Feier (Limo, besonderer Anlass) — 13000
8. Freunde aus dem Ausland besuchen — 18000
9. Reunion-Trip (alte Freunde, neues Ziel) — 24500
10. Großes Gruppenevent organisieren — 32000
11. Mehrtägiger Freundes-Trip ins Ausland — 41000
12. Signature-Moment (großer Kreis, besonderer Ort) — 51000

## Reveal-Logik (Zufallsfaktor)
Bei erreichtem Schwellenwert + erfüllter Vorbedingung: Objekt kommt in den "Eligible Pool".
Tatsächliche Freischaltung würfelt täglich (z. B. 40% Chance pro Tag im Pool), bis sie eintritt —
nie sofort garantiert, aber nie zu lange hinausgezögert. Bei mehreren eligible Objekten gleichzeitig:
zufällige Reihenfolge statt Kategorien-Rotation.
