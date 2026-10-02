#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Feldkarten der zehn Kulissen neu erzeugen — Fokus App 3.5.3, Auftrag §5.

Ziel: Jedes Feld ist eine zusammenhaengende Flaeche EINER Palettenfarbe, deren Grenzen auf sichtbaren
Farbkanten der farbigen Fassung liegen (Befund 3.5.2: die alten Grenzen folgten Helligkeitsverlaeufen).

Verfahren je Kulisse (verbindlich laut Auftrag):
  1. Eingabe: img/kulissen/bgNN_farbig.jpg und die 10 Palettenfarben aus bgNN_felder.json.
  2. Jeden Bildpunkt der naechstgelegenen Palettenfarbe zuordnen (Abstand in CIELAB), danach Modusfilter 7x7.
  3. Zusammenhaengende Flaechen je Farbe bilden (4er-Nachbarschaft).
  4. Flaechen unter 0,35 % der Bildflaeche dem Nachbarn mit der laengsten gemeinsamen Grenze zuschlagen
     (der Nachbar behaelt seine Farbe); wiederholen, bis keine mehr uebrig ist. Stossen dadurch zwei Flaechen
     derselben Farbe aneinander, sind sie EIN Feld (Regel 3).
  5. Feldanzahl 24 bis 60: darueber die kleinsten Felder weiter nach Regel 4 zusammenlegen; darunter die
     groessten Felder entlang ihrer staerksten inneren Helligkeitskante teilen (nie ohne sichtbare Kante).
  6. Ausgabe: bgNN_feldkarte.png (Graustufe, Wert = Feld-ID 1..n), bgNN_kanten.png (Grenzen 2 px),
     bgNN_blass_kanten.jpg (blasse Fassung img/bgNN.jpg + Kanten), bgNN_felder.json (Schema wie bisher).
     bgNN_farbig.jpg bleibt unveraendert.
  Zusaetzlich bgNN_uebernahme353.json: Ueberdeckung alter und neuer Felder in Bildpunkten — damit uebernimmt
  die App den Ausmal-Stand beim ersten Start von 3.5.3 (50-%-Regel, Tank-Gutschrift).

Aufruf aus der Repo-Wurzel:
  python3 tools/feldkarten_353.py                 # alle zehn, schreibt nach img/kulissen
  python3 tools/feldkarten_353.py --aus /tmp/x    # in ein anderes Verzeichnis (Probe)
  python3 tools/feldkarten_353.py --kulissen 1,5  # nur einzelne
  python3 tools/feldkarten_353.py --alt DIR       # alte Feldkarten (fuer die Ueberdeckung) aus DIR statt img/kulissen

Reines Python 3 ohne Zusatzpakete; Bilder werden ueber das macOS-Werkzeug `sips` gelesen/geschrieben.
"""
import heapq, json, os, struct, subprocess, sys, tempfile, zlib
from itertools import accumulate, groupby

MIN_ANTEIL = 0.0035      # Regel 4: Flaechen unter 0,35 % der Bildflaeche
FELD_MIN, FELD_MAX = 24, 60
KANTE_SICHTBAR = 22      # Farbabstand (RGB, 5 px je Seite), ab dem eine Kante als sichtbar gilt (wie Pruefskript 3.5.2)


# ── Bilder lesen und schreiben ─────────────────────────────────────────────
def bmp_lesen(pfad):
    """-> (w, h, bytes je Pixel, Zeilen von oben nach unten; Pixel = B,G,R[,A])"""
    with tempfile.TemporaryDirectory() as t:
        ziel = os.path.join(t, 'b.bmp')
        subprocess.run(['sips', '-s', 'format', 'bmp', pfad, '--out', ziel], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        d = open(ziel, 'rb').read()
    off = struct.unpack_from('<I', d, 10)[0]
    w, h = struct.unpack_from('<ii', d, 18)
    bpx = struct.unpack_from('<H', d, 28)[0] // 8
    zeile = (w * bpx + 3) // 4 * 4
    oben = h < 0
    h = abs(h)
    rows = []
    for y in range(h):
        yy = y if oben else h - 1 - y
        rows.append(d[off + yy * zeile: off + yy * zeile + w * bpx])
    return w, h, bpx, rows


def png_grau_schreiben(pfad, w, h, rows):
    """8-Bit-Graustufen-PNG ohne Zusatz-Chunks (kein Farbprofil — die App liest die Werte unveraendert)."""
    def chunk(typ, daten):
        c = struct.pack('>I', len(daten)) + typ + daten
        return c + struct.pack('>I', zlib.crc32(typ + daten) & 0xffffffff)
    roh = b''.join(b'\x00' + bytes(r) for r in rows)
    with open(pfad, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 0, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(roh, 9)) + chunk(b'IEND', b''))


def jpg_schreiben(pfad, w, h, rows_bgr):
    """rows_bgr: Zeilen von oben nach unten, je 3 Bytes B,G,R"""
    zl = (w * 3 + 3) // 4 * 4
    pad = b'\x00' * (zl - w * 3)
    daten = b''.join(bytes(r) + pad for r in reversed(rows_bgr))
    kopf = b'BM' + struct.pack('<IHHI', 54 + len(daten), 0, 0, 54) + struct.pack('<IiiHHIIiiII', 40, w, h, 1, 24, 0, len(daten), 2835, 2835, 0, 0)
    with tempfile.TemporaryDirectory() as t:
        b = os.path.join(t, 'b.bmp')
        open(b, 'wb').write(kopf + daten)
        subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '85', b, '--out', pfad], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)


# ── Farbe ──────────────────────────────────────────────────────────────────
_LIN = [((v / 255) / 12.92 if v / 255 <= 0.04045 else ((v / 255 + 0.055) / 1.055) ** 2.4) for v in range(256)]


def lab(r, g, b):
    r, g, b = _LIN[r], _LIN[g], _LIN[b]
    x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047
    y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b
    z = (0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / 1.08883
    f = lambda t: t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116
    fx, fy, fz = f(x), f(y), f(z)
    return 116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)


def hexrgb(hx):
    hx = hx.lstrip('#')
    return int(hx[0:2], 16), int(hx[2:4], 16), int(hx[4:6], 16)


# ── Schritt 2: naechste Palettenfarbe (CIELAB) + Modusfilter 7x7 ───────────
def klassifizieren(w, h, bpx, rows, palette):
    pl = [lab(*c) for c in palette]
    cache = {}
    out = []
    for row in rows:
        neu = bytearray(w)
        for x, key in enumerate(zip(row[2::bpx], row[1::bpx], row[0::bpx])):
            c = cache.get(key)
            if c is None:
                L, a, b = lab(*key)
                best, bd = 0, 1e18
                for i, (pL, pa, pb) in enumerate(pl):
                    d = (L - pL) ** 2 + (a - pa) ** 2 + (b - pb) ** 2
                    if d < bd:
                        best, bd = i, d
                c = cache[key] = best
            neu[x] = c
        out.append(neu)
    return out


def modusfilter(rows, w, h, k, R=3):
    """haeufigste Farbe im Fenster (2R+1)^2; bei Gleichstand bleibt die Farbe des Bildpunkts, sonst die kleinste Nummer"""
    col = [[0] * w for _ in range(k)]

    def zaehl(row, s):
        for x, l in enumerate(row):
            col[l][x] += s
    for y in range(0, min(h, R + 1)):
        zaehl(rows[y], 1)
    out = []
    nullen, breit = [0] * (R + 1), 2 * R + 1
    for y in range(h):
        sums = []
        for c in range(k):
            cum = list(accumulate(col[c]))
            P = nullen + cum + [cum[-1]] * R
            sums.append([b - a for a, b in zip(P, P[breit:])])
        row = rows[y]
        neu = bytearray(w)
        for x, t in enumerate(zip(*sums)):
            m = max(t)
            c = row[x]
            neu[x] = c if t[c] == m else t.index(m)
        out.append(neu)
        if y + R + 1 < h:
            zaehl(rows[y + R + 1], 1)
        if y - R >= 0:
            zaehl(rows[y - R], -1)
    return out


# ── Schritt 3: zusammenhaengende Flaechen (4er-Nachbarschaft) ueber Laeufe ──
def flaechen(rows, w, h):
    """-> laeufe[y] = Liste [x0, x1, flaeche] (x1 exklusiv), farbe[flaeche], groesse[flaeche], nachbarn[a][b] = Grenzlaenge"""
    eltern = []

    def find(a):
        while eltern[a] != a:
            eltern[a] = eltern[eltern[a]]
            a = eltern[a]
        return a
    farbe = []
    laeufe = []
    vor = []
    for y in range(h):
        akt = []
        x = 0
        for l, grp in groupby(rows[y]):
            n = sum(1 for _ in grp)
            akt.append([x, x + n, -1, l])
            x += n
        j = 0
        for lauf in akt:
            x0, x1, _, l = lauf
            while j < len(vor) and vor[j][1] <= x0:
                j += 1
            i = j
            while i < len(vor) and vor[i][0] < x1:
                if vor[i][3] == l:
                    r = find(vor[i][2])
                    if lauf[2] < 0:
                        lauf[2] = r
                    else:
                        a = find(lauf[2])
                        if a != r:
                            eltern[max(a, r)] = min(a, r)
                            lauf[2] = min(a, r)
                i += 1
            if lauf[2] < 0:
                lauf[2] = len(eltern)
                eltern.append(len(eltern))
                farbe.append(l)
        laeufe.append(akt)
        vor = akt
    groesse = {}
    nachbarn = {}

    def grenze(a, b, n):
        if a == b:
            return
        nachbarn.setdefault(a, {})[b] = nachbarn.get(a, {}).get(b, 0) + n
        nachbarn.setdefault(b, {})[a] = nachbarn.get(b, {}).get(a, 0) + n
    vor = []
    for y in range(h):
        akt = laeufe[y]
        for lauf in akt:
            lauf[2] = find(lauf[2])
            groesse[lauf[2]] = groesse.get(lauf[2], 0) + lauf[1] - lauf[0]
        for a, b in zip(akt, akt[1:]):
            grenze(a[2], b[2], 1)
        j = 0
        for lauf in akt:
            while j < len(vor) and vor[j][1] <= lauf[0]:
                j += 1
            i = j
            while i < len(vor) and vor[i][0] < lauf[1]:
                grenze(lauf[2], vor[i][2], min(lauf[1], vor[i][1]) - max(lauf[0], vor[i][0]))
                i += 1
        vor = akt
    for r in groesse:
        nachbarn.setdefault(r, {})
    return laeufe, {r: farbe[r] for r in groesse}, groesse, nachbarn


# ── Schritt 4/5: kleine Flaechen zusammenlegen ─────────────────────────────
class Felder:
    def __init__(self, farbe, groesse, nachbarn):
        self.farbe, self.groesse, self.nb = farbe, groesse, nachbarn
        self.ziel = {r: r for r in groesse}

    def find(self, a):
        while self.ziel[a] != a:
            self.ziel[a] = self.ziel[self.ziel[a]]
            a = self.ziel[a]
        return a

    def schlucken(self, klein, gross):
        """`klein` geht in `gross` auf; `gross` behaelt seine Farbe"""
        nb = self.nb
        for n2, laenge in nb.pop(klein).items():
            del nb[n2][klein]
            if n2 == gross:
                continue
            nb[gross][n2] = nb[gross].get(n2, 0) + laenge
            nb[n2][gross] = nb[n2].get(gross, 0) + laenge
        self.groesse[gross] += self.groesse.pop(klein)
        del self.farbe[klein]
        self.ziel[klein] = gross

    def gleiche_farbe_vereinen(self, r):
        """Regel 3: aneinanderstossende Flaechen derselben Farbe sind EIN Feld"""
        while True:
            gleich = [n for n in self.nb[r] if self.farbe[n] == self.farbe[r]]
            if not gleich:
                return r
            n = gleich[0]
            if self.groesse[n] > self.groesse[r]:
                self.schlucken(r, n)
                r = n
            else:
                self.schlucken(n, r)

    def bester_nachbar(self, r):
        return max(self.nb[r], key=lambda n: (self.nb[r][n], self.groesse[n], -n)) if self.nb[r] else None

    def zusammenlegen(self, min_px, hoechstens=None):
        """Flaechen unter min_px dem Nachbarn mit der laengsten gemeinsamen Grenze zuschlagen (kleinste zuerst);
        mit `hoechstens`: weiter die kleinsten zusammenlegen, bis nur noch so viele Felder uebrig sind"""
        heap = [(g, r) for r, g in self.groesse.items()]
        heapq.heapify(heap)
        while heap:
            g, r = heapq.heappop(heap)
            if r not in self.groesse or self.groesse[r] != g:
                continue
            if not (g < min_px or (hoechstens and len(self.groesse) > hoechstens)):
                break
            n = self.bester_nachbar(r)
            if n is None:
                continue
            self.schlucken(r, n)
            n = self.gleiche_farbe_vereinen(n)
            heapq.heappush(heap, (self.groesse[n], n))


# ── Schritt 5 (unten): zu wenige Felder — groesste entlang ihrer staerksten inneren Helligkeitskante teilen ──
def teilen(feld_rows, farbig, w, h, bpx, fid, neu_id, min_px):
    """Teilt Feld fid an der Helligkeitsschwelle mit der staerksten Kante; nur wenn die Kante sichtbar ist und beide
    Teile zusammenhaengend und gross genug sind. -> True, wenn geteilt."""
    px = [(x, y) for y in range(h) for x in range(w) if feld_rows[y][x] == fid]
    hell = {}
    for x, y in px:
        r = farbig[y]
        hell[(x, y)] = (r[x * bpx + 2] * 299 + r[x * bpx + 1] * 587 + r[x * bpx] * 114) // 1000
    werte = sorted(set(hell.values()))
    if len(werte) < 2:
        return False
    best = None
    for t in werte[1:]:
        kante, n = 0, 0
        for (x, y), v in hell.items():
            for q in ((x + 1, y), (x, y + 1)):
                v2 = hell.get(q)
                if v2 is not None and (v < t) != (v2 < t):
                    kante += abs(v - v2)
                    n += 1
        if n and (best is None or kante / n > best[0]):
            best = (kante / n, t)
    if best is None or best[0] < KANTE_SICHTBAR:
        return False
    t = best[1]
    dunkel = set(p for p, v in hell.items() if v < t)
    for teil in (dunkel, set(hell) - dunkel):
        if len(teil) < min_px:
            return False
        start = next(iter(teil))
        gesehen, stapel = {start}, [start]
        while stapel:
            x, y = stapel.pop()
            for q in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if q in teil and q not in gesehen:
                    gesehen.add(q)
                    stapel.append(q)
        if len(gesehen) != len(teil):
            return False
    for x, y in dunkel:
        feld_rows[y][x] = neu_id
    return True


# ── Eine Kulisse ───────────────────────────────────────────────────────────
def kulisse(n, repo, aus, alt):
    nn = '%02d' % n
    K = os.path.join(repo, 'img', 'kulissen')
    J = json.load(open(os.path.join(K, 'bg' + nn + '_felder.json')))
    palette = [hexrgb(f['hex']) for f in sorted(J['farben'], key=lambda f: f['farbe'])]
    w, h, bpx, farbig = bmp_lesen(os.path.join(K, 'bg' + nn + '_farbig.jpg'))
    flaeche_bild = w * h
    min_px = MIN_ANTEIL * flaeche_bild

    klassen = modusfilter(klassifizieren(w, h, bpx, farbig, palette), w, h, len(palette))
    laeufe, farbe, groesse, nachbarn = flaechen(klassen, w, h)
    roh = len(groesse)
    F = Felder(farbe, groesse, nachbarn)
    F.zusammenlegen(min_px)
    nach4 = len(F.groesse)
    if len(F.groesse) > FELD_MAX:
        F.zusammenlegen(min_px, hoechstens=FELD_MAX)

    # Nummern 1..n: nach Farbe, darin nach Flaeche absteigend (wie bisher)
    folge = sorted(F.groesse, key=lambda r: (F.farbe[r], -F.groesse[r], r))
    nummer = {r: i + 1 for i, r in enumerate(folge)}
    feld_rows = []
    for y in range(h):
        row = bytearray(w)
        for x0, x1, r, _ in laeufe[y]:
            row[x0:x1] = bytes([nummer[F.find(r)]]) * (x1 - x0)
        feld_rows.append(row)
    feldfarbe = {nummer[r]: F.farbe[r] for r in folge}

    geteilt = 0
    while len(feldfarbe) < FELD_MIN:
        gr = {}
        for row in feld_rows:
            for v, grp in groupby(row):
                gr[v] = gr.get(v, 0) + sum(1 for _ in grp)
        ok = False
        for fid in sorted(gr, key=lambda f: -gr[f]):
            neu = max(feldfarbe) + 1
            if teilen(feld_rows, farbig, w, h, bpx, fid, neu, min_px):
                feldfarbe[neu] = feldfarbe[fid]
                geteilt += 1
                ok = True
                break
        if not ok:
            break
    if geteilt:   # neu durchnummerieren
        gr = {}
        for row in feld_rows:
            for v, grp in groupby(row):
                gr[v] = gr.get(v, 0) + sum(1 for _ in grp)
        folge = sorted(gr, key=lambda f: (feldfarbe[f], -gr[f], f))
        tab = bytearray(256)
        for i, f in enumerate(folge):
            tab[f] = i + 1
        feld_rows = [bytearray(row.translate(bytes(tab))) for row in feld_rows]
        feldfarbe = {i + 1: feldfarbe[f] for i, f in enumerate(folge)}

    # Flaeche und Rahmen je Feld
    flaeche = {}
    bbox = {}
    for y, row in enumerate(feld_rows):
        x = 0
        for v, grp in groupby(row):
            c = sum(1 for _ in grp)
            flaeche[v] = flaeche.get(v, 0) + c
            b = bbox.get(v)
            if b is None:
                bbox[v] = [x, y, x + c - 1, y]
            else:
                if x < b[0]: b[0] = x
                if x + c - 1 > b[2]: b[2] = x + c - 1
                b[3] = y
            x += c

    # Kanten 2 px: der Bildpunkt und sein rechter bzw. unterer Nachbar, wenn sie zu verschiedenen Feldern gehoeren
    kanten = [bytearray(w) for _ in range(h)]
    for y in range(h):
        row, k = feld_rows[y], kanten[y]
        for x, (a, b) in enumerate(zip(row, row[1:])):
            if a != b:
                k[x] = k[x + 1] = 255
        if y + 1 < h:
            k2 = kanten[y + 1]
            for x, (a, b) in enumerate(zip(row, feld_rows[y + 1])):
                if a != b:
                    k[x] = k2[x] = 255

    os.makedirs(aus, exist_ok=True)
    png_grau_schreiben(os.path.join(aus, 'bg' + nn + '_feldkarte.png'), w, h, feld_rows)
    png_grau_schreiben(os.path.join(aus, 'bg' + nn + '_kanten.png'), w, h, kanten)
    # blasse Fassung + Kanten (#141418 wie in der App)
    bw, bh, bb, blass = bmp_lesen(os.path.join(repo, 'img', 'bg' + nn + '.jpg'))
    if (bw, bh) == (w, h):
        zeilen = []
        for y in range(h):
            src, k = blass[y], kanten[y]
            row = bytearray(w * 3)
            for x in range(w):
                row[x * 3:x * 3 + 3] = b'\x18\x14\x14' if k[x] else src[x * bb:x * bb + 3]
            zeilen.append(row)
        jpg_schreiben(os.path.join(aus, 'bg' + nn + '_blass_kanten.jpg'), w, h, zeilen)
    groesstes = max(flaeche.values())
    neu = dict(J)
    neu.update(anzahlFelder=len(flaeche), groesstesFeldPx=groesstes, topfFassungPx=int(round(groesstes * 1.2)),
               felder=[{'feld': f, 'farbe': feldfarbe[f], 'flaechePx': flaeche[f], 'anteil': round(flaeche[f] / flaeche_bild, 6), 'bbox': bbox[f]} for f in sorted(flaeche)])
    json.dump(neu, open(os.path.join(aus, 'bg' + nn + '_felder.json'), 'w'), ensure_ascii=False, separators=(',', ':'))

    # Ueberdeckung alt/neu fuer die Uebernahme des Ausmal-Stands
    ueb = None
    altpfad = os.path.join(alt, 'bg' + nn + '_feldkarte.png')
    if os.path.exists(altpfad):
        aw, ah, ab, altk = bmp_lesen(altpfad)
        if (aw, ah) == (w, h):
            paare = {}
            altfl = {}
            for y in range(h):
                for a, b in zip(altk[y][2::ab] if ab >= 3 else altk[y], feld_rows[y]):
                    if a:
                        paare[(b, a)] = paare.get((b, a), 0) + 1
                        altfl[a] = altfl.get(a, 0) + 1
            decke = {}
            for (b, a), c in paare.items():
                decke.setdefault(str(b), {})[str(a)] = c
            ueb = {'kulisse': n, 'bildPx': flaeche_bild, 'neuFlaeche': {str(f): flaeche[f] for f in sorted(flaeche)},
                   'altFlaeche': {str(a): altfl[a] for a in sorted(altfl)}, 'ueberdeckung': decke}
            json.dump(ueb, open(os.path.join(aus, 'bg' + nn + '_uebernahme353.json'), 'w'), separators=(',', ':'))
    return {'kulisse': n, 'flaechenRoh': roh, 'nachRegel4': nach4, 'geteilt': geteilt, 'felder': len(flaeche),
            'groesstesFeldProzent': round(groesstes / flaeche_bild * 100, 1), 'kleinstesFeldPx': min(flaeche.values()),
            'farbenGenutzt': len(set(feldfarbe.values())), 'uebernahme': bool(ueb)}


def main(argv):
    repo = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
    aus = os.path.join(repo, 'img', 'kulissen')
    alt = aus
    nummern = list(range(1, 11))
    i = 0
    while i < len(argv):
        if argv[i] == '--aus':
            aus = os.path.abspath(argv[i + 1]); i += 2
        elif argv[i] == '--alt':
            alt = os.path.abspath(argv[i + 1]); i += 2
        elif argv[i] == '--kulissen':
            nummern = [int(x) for x in argv[i + 1].split(',')]; i += 2
        else:
            print('Unbekanntes Argument:', argv[i]); return 2
    for n in nummern:
        print(json.dumps(kulisse(n, repo, aus, alt), ensure_ascii=False), flush=True)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
