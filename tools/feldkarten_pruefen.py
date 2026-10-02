#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Feldkarten gegen die sichtbaren Konturen der farbigen Fassung pruefen — das Pruefskript aus 3.5.2 (unveraenderte Masse),
ergaenzt um die Insel-Pruefung und ein Overlay-Bild je Kulisse (3.5.3, Auftrag §5 Nr. 7). Aendert keine Felddaten.

Masse je Kulisse:
  grenzeOhneKonturProzent  Anteil der Grenzlaenge zwischen zwei Feldern, an dem sich die farbige Fassung 5 px links/rechts
                           (bzw. oben/unten) um weniger als 22 RGB-Einheiten unterscheidet           Abnahme: <= 5 %
  felderMitFremdfarbe      Felder, in denen >= 1.500 px UND >= 15 % der Flaeche sichtbar besser zu einer ANDEREN
                           Palettenfarbe passen (naechste Palettenfarbe im RGB-Abstand, Raster 3 px)  Abnahme: 0
  inseln                   Feld-IDs, die aus mehr als einer zusammenhaengenden Flaeche bestehen        Abnahme: 0

Aufruf aus der Repo-Wurzel:
  python3 tools/feldkarten_pruefen.py [--dir DIR] [--kulissen 1,2] [--overlay ZIELORDNER]
  --dir: Ordner mit bgNN_feldkarte.png / _kanten.png / _felder.json (Standard img/kulissen); die farbige Fassung kommt immer
         aus img/kulissen.
Reines Python 3, Bilder ueber das macOS-Werkzeug `sips`.
"""
import json, os, struct, subprocess, sys, tempfile
from itertools import groupby


def bmp(pfad):
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
    return w, h, bpx, [d[off + (y if oben else h - 1 - y) * zeile: off + (y if oben else h - 1 - y) * zeile + w * bpx] for y in range(h)]


def hexrgb(hx):
    hx = hx.lstrip('#')
    return (int(hx[0:2], 16), int(hx[2:4], 16), int(hx[4:6], 16))


def dist2(a, b):
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2


def inseln(F, bf, w, h):
    """Feld-IDs mit mehr als einer zusammenhaengenden Flaeche (4er-Nachbarschaft, ueber Laeufe)"""
    eltern, wert = [], []

    def find(a):
        while eltern[a] != a:
            eltern[a] = eltern[eltern[a]]
            a = eltern[a]
        return a
    vor = []
    for y in range(h):
        row = F[y][2::bf] if bf >= 3 else F[y]
        akt, x = [], 0
        for v, grp in groupby(row):
            n = sum(1 for _ in grp)
            akt.append([x, x + n, -1, v])
            x += n
        j = 0
        for lauf in akt:
            while j < len(vor) and vor[j][1] <= lauf[0]:
                j += 1
            i = j
            while i < len(vor) and vor[i][0] < lauf[1]:
                if vor[i][3] == lauf[3]:
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
                wert.append(lauf[3])
        vor = akt
    teile = {}
    for i in range(len(eltern)):
        if find(i) == i and wert[i]:
            teile[wert[i]] = teile.get(wert[i], 0) + 1
    return sorted(v for v, n in teile.items() if n > 1)


def pruefe(n, repo, ordner, overlay):
    nn = '%02d' % n
    K = os.path.join(repo, 'img', 'kulissen')
    J = json.load(open(os.path.join(ordner, 'bg' + nn + '_felder.json')))
    pal = [hexrgb(f['hex']) for f in sorted(J['farben'], key=lambda f: f['farbe'])]
    farbeVon = {f['feld']: f['farbe'] for f in J['felder']}
    flaeche = {f['feld']: f['flaechePx'] for f in J['felder']}
    w, h, bf, F = bmp(os.path.join(ordner, 'bg' + nn + '_feldkarte.png'))
    _, _, bk, E = bmp(os.path.join(ordner, 'bg' + nn + '_kanten.png'))
    _, _, bc, C = bmp(os.path.join(K, 'bg' + nn + '_farbig.jpg'))
    fid = lambda x, y: F[y][x * bf + 2] if bf >= 3 else F[y][x]
    kante = lambda x, y: (E[y][x * bk + 2] if bk >= 3 else E[y][x]) > 127
    rgb = lambda x, y: (C[y][x * bc + 2], C[y][x * bc + 1], C[y][x * bc])
    ids = set()
    null = 0
    for y in range(h):
        r = F[y][2::bf] if bf >= 3 else F[y]
        ids.update(r)
        null += r.count(0)
    unbekannt = sorted(i for i in ids if i and i not in farbeVon)
    # B) sichtbare Farbe (naechste Palettenfarbe) gegen die Feldfarbe, Raster 3 px, Kanten ausgenommen
    je = {}
    ges = fehl = 0
    cache = {}
    for y in range(0, h, 3):
        for x in range(0, w, 3):
            f = fid(x, y)
            if not f or f not in farbeVon or kante(x, y):
                continue
            c = rgb(x, y)
            best = cache.get(c)
            if best is None:
                best = cache[c] = min(range(len(pal)), key=lambda i: dist2(c, pal[i]))
            q = je.setdefault(f, [0, 0, {}])
            q[0] += 1
            ges += 1
            if best != farbeVon[f]:
                q[1] += 1
                fehl += 1
                q[2][best] = q[2].get(best, 0) + 1
    fremd = []
    for f, q in je.items():
        if not q[2]:
            continue
        bfarbe, bn = max(q[2].items(), key=lambda t: t[1])
        if bn * 9 >= 1500 and bn / q[0] >= 0.15:
            fremd.append((f, farbeVon[f], bfarbe, bn * 9, round(bn / q[0] * 100)))
    # C) Feldgrenzen ohne sichtbare Kontur
    gr = ohne = ohneGleich = 0
    S, T2 = 5, 22 * 22
    for y in range(S, h - S, 2):
        for x in range(S, w - S - 1):
            a, b = fid(x, y), fid(x + 1, y)
            if a and b and a != b and a in farbeVon and b in farbeVon:
                if fid(x - S, y) != a or fid(x + 1 + S, y) != b:
                    continue
                gr += 1
                if dist2(rgb(x - S, y), rgb(x + 1 + S, y)) < T2:
                    ohne += 1
                    ohneGleich += farbeVon[a] == farbeVon[b]
    for x in range(S, w - S, 2):
        for y in range(S, h - S - 1):
            a, b = fid(x, y), fid(x, y + 1)
            if a and b and a != b and a in farbeVon and b in farbeVon:
                if fid(x, y - S) != a or fid(x, y + 1 + S) != b:
                    continue
                gr += 1
                if dist2(rgb(x, y - S), rgb(x, y + 1 + S)) < T2:
                    ohne += 1
                    ohneGleich += farbeVon[a] == farbeVon[b]
    ins = inseln(F, bf, w, h)
    if overlay:
        os.makedirs(overlay, exist_ok=True)
        zl = (w * 3 + 3) // 4 * 4
        out = bytearray()
        for y in range(h - 1, -1, -1):
            row = bytearray(zl)
            c, e = C[y], E[y]
            for x in range(w):
                row[x * 3:x * 3 + 3] = b'\xff\xff\xff' if (e[x * bk + 2] if bk >= 3 else e[x]) > 127 else c[x * bc:x * bc + 3]
            out += row
        kopf = b'BM' + struct.pack('<IHHI', 54 + len(out), 0, 0, 54) + struct.pack('<IiiHHIIiiII', 40, w, h, 1, 24, 0, len(out), 2835, 2835, 0, 0)
        with tempfile.TemporaryDirectory() as t:
            b = os.path.join(t, 'o.bmp')
            open(b, 'wb').write(kopf + out)
            subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '80', b, '--out', os.path.join(overlay, 'Feldkarte_Kulisse' + nn + '_Overlay.jpg')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    groesstes = max(flaeche.values())
    return dict(kulisse=n, felder=len(farbeVon), grenzeOhneKonturProzent=round(ohne / max(1, gr) * 100, 1), felderMitFremdfarbe=len(fremd),
                inseln=ins, nullPixel=null, idsOhneJson=unbekannt, farbFehlProzent=round(fehl / max(1, ges) * 100, 1),
                groesstesFeldProzent=round(groesstes / (w * h) * 100, 1), kleinstesFeldPx=min(flaeche.values()),
                grenzPaare=gr, ohneKonturGleicheFarbe=ohneGleich, fremd=sorted(fremd, key=lambda t: -t[3])[:5],
                abnahme=(ohne / max(1, gr) <= 0.05 and not fremd and not ins and not null and not unbekannt))


def main(argv):
    repo = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
    ordner = os.path.join(repo, 'img', 'kulissen')
    overlay = None
    nummern = list(range(1, 11))
    i = 0
    while i < len(argv):
        if argv[i] == '--dir':
            ordner = os.path.abspath(argv[i + 1]); i += 2
        elif argv[i] == '--overlay':
            overlay = os.path.abspath(argv[i + 1]); i += 2
        elif argv[i] == '--kulissen':
            nummern = [int(x) for x in argv[i + 1].split(',')]; i += 2
        else:
            print('Unbekanntes Argument:', argv[i]); return 2
    alle = True
    for n in nummern:
        e = pruefe(n, repo, ordner, overlay)
        alle = alle and e['abnahme']
        print(json.dumps(e, ensure_ascii=False), flush=True)
    return 0 if alle else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
