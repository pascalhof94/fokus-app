/* Abnahme v3.7.0 — Ketten überall, Tick-Logik neu, Kalender raus (Auftrag spec/261002_FokusApp_Auftrag_3-7-0.md).
   Die Uhr ist verstellbar (uhr/minuten aus tests/v370-abnahme.js). Stufen-Namen werden nie genannt. */
var fails=0, n=0;
function ok(t,c){ n++; print((c?'OK   ':'FAIL ')+t); if(!c) fails++; }
function kopf(t){ print(''); print('── '+t+' ──'); }
function frisch(){
  _store={}; S.karten=[]; S.unteraufgaben=[]; S.historie=[]; S.intraday=[]; S.routinenGruppen=[]; S.tagesketten=[];
  S.meta={ wohlstand:0, seeded:true, migration200:true, shop360:{ ts:'2026-09-30T08:00:00.000Z' }, reset35:{ ts:'2026-09-20T08:00:00.000Z' } }; S.settings=settingsMerge({}); S.belohnung=null;
  S.tag=null; S.fokus=null; S.meta.ketten=null; matrixTmp=null; S.ui.fokusOffen=false; S.ui.fokusZeigt=null; S.ui.fokusNav=null; S.ui.fokusOeff=null;
  S.ui.statOffen={}; S.ui.einstOffen=null; S.ui.malmodus=false; S.ui.klSort={}; S.ui.klGruppen={}; S.ui.navDomain='dfm'; S.ui.tkWahl=null; S.ui.suFrage='';
  abv3.aktiv=false; abv3.zurueck=false; abv3.schritt=1; aufstehenTmp=null; _ik=null; _kwTimer=null;
}
var DO='2026-10-01', SA='2026-10-03', P='privat', D='dfm';
function tagDonnerstag(){ frisch(); uhr('2026-10-01T09:00:00+02:00'); tagStarten(70, DO); belohnungInit(); }
function tagSamstag(){ frisch(); uhr('2026-10-03T09:00:00+02:00'); tagStarten(70, SA); belohnungInit(); }
function kid(id){ return S.karten.filter(function(k){ return k.id===id; })[0]; }
function imp(karten){ var r=syncImport(JSON.stringify({appVersion:'3.7.0', karten:karten})); if(r && r.fehler) print('   IMPORT-FEHLER '+r.fehler); return r; }
function rumpf(name){ var a=src.indexOf('function '+name+'('), b=src.indexOf('\nfunction ', a+10); return a<0 ? '' : src.slice(a, b<0 ? src.length : b); }
function ids(l){ return l.map(function(k){ return k.id; }).join(','); }
function gruppe(inh, g){ var r=[]; inh[g].teile.forEach(function(t){ t.karten.forEach(function(k){ if(r.indexOf(k.id)<0) r.push(k.id); }); }); return r.join(','); }
/* Kulissen-Stub: zwei Farben, drei Felder (Farbe 0: 1.000 und 600 P · Farbe 1: 800 P), Fassung 1.000 × 1,2 = 1.200 */
function kulisse(){
  _kul[1]={ json:{ felder:[{feld:1,farbe:0,anteil:.5,flaechePx:100},{feld:2,farbe:1,anteil:.4,flaechePx:100},{feld:3,farbe:0,anteil:.3,flaechePx:60}], farben:[{farbe:0,hex:'#111111'},{farbe:1,hex:'#222222'},{farbe:2,hex:'#333333'}] },
    punkte:{1:1000, 2:800, 3:600}, farbeVon:{1:0, 2:1, 3:0}, maxP:1000, hex:['#111111','#222222','#333333'], namen:['Ocker','Schwarz','Blau'], topFarben:['#111111','#222222'] };
  _kul[2]={ json:{ felder:[{feld:1,farbe:0,anteil:.2},{feld:2,farbe:1,anteil:.2},{feld:3,farbe:2,anteil:.2},{feld:4,farbe:3,anteil:.2},{feld:5,farbe:4,anteil:.1},{feld:6,farbe:5,anteil:.1}], farben:[{hex:'#a1'},{hex:'#a2'},{hex:'#a3'},{hex:'#a4'},{hex:'#a5'},{hex:'#a6'}] },
    punkte:{1:500,2:500,3:500,4:500,5:250,6:250}, farbeVon:{1:0,2:1,3:2,4:3,5:4,6:5}, maxP:500, hex:['#a1','#a2','#a3','#a4','#a5','#a6'], namen:['A','B','C','D','E','F'], topFarben:['#a1','#a2'] };
}
function kulisseWeg(){ delete _kul[1]; delete _kul[2]; }
function toepfe(l){ var A=ausmalState(); A.toepfe=[0,1,2,3,4].map(function(i){ return { farbe:(l[i]&&l[i][0]!=null)?l[i][0]:null, punkte:(l[i]&&l[i][1])||0 }; }); return A; }

kopf('Version');
ok('APP_VERSION 3.7.0 · Datenvertrag bleibt 2.1.0 · Build 2026-10-03-1', APP_VERSION==='3.7.6' && UI_VERSION==='v3.7.6' && DATENVERTRAG==='2.1.0' && APP_BUILD==='2026-10-05-2');

/* ══ §1 Fokus oben: „Nach vorn" ═══════════════════════════════════════ */
kopf('§1 Fokus oben: „⤒ Nach vorn"');
tagDonnerstag();
S.karten=[ neueKarte({ id:'a', domain:D, titel:'A', sollMin:30, faelligkeit:DO }), neueKarte({ id:'b', domain:D, titel:'B', sollMin:30, faelligkeit:DO }), neueKarte({ id:'c', domain:D, titel:'C', sollMin:30, faelligkeit:DO }), neueKarte({ id:'x', domain:D, titel:'X ohne Kette', sollMin:30 }) ];
ketteSetzen(['a','b','c']);
ok('§1 der Knopf steht zwischen „◀ Verlauf" und „nächste ▶" (data-fkvorn), 44 px, mittig', /navKnopf\(1\)\+'<button class="sw vorn" data-fkvorn="'\+k\.id\+'">⤒ Nach vorn<\/button>'\+navKnopf\(-1\)/.test(src) &&
   /\.fk-oben\{[^}]*grid-template-columns:auto 1fr auto/.test(src) && /button\.sw\.vorn\{justify-self:center/.test(src));
ok('§1 Karte in der Kette → Position 1', ketteNachVorn('c')===true && tagesKette().join(',')==='c,a,b');
ok('§1 Karte nicht in der Kette → wird an Position 1 eingefügt', ketteNachVorn('x')===true && tagesKette().join(',')==='x,c,a,b');
ok('§1 der Handler bestätigt mit „An erster Stelle" und zeichnet die Fokusansicht neu', /data-fkvorn\]'\)[\s\S]{0,200}toast\('An erster Stelle'\)[\s\S]{0,60}renderFokus\(\)/.test(src));

/* ══ §2 „In Kette" ═══════════════════════════════════════════════════ */
kopf('§2 „In Kette" neben „Schieben"');
S.tagesketten=[{ id:'tk1', name:'DFM-Fokus 1', karten:['a'] }];
S.karten.push(neueKarte({ id:'r1', domain:P, titel:'Routine', rhythmus:{typ:'taeglich'}, modus:'staffel', staffel:[20], faelligkeit:DO }));
S.karten.push(neueKarte({ id:'t1', domain:D, titel:'Counter DFM', ticksAktiv:true, faelligkeit:DO }));
ok('§2 der Knopf steht neben „Schieben" und öffnet die Vollbild-Ansicht', /<button class="kbtn breit" data-fkinkette="'\+k\.id\+'">In Kette<\/button>/.test(src) && /data-fkinkette\]'\)[\s\S]{0,120}oeffneInKette\(/.test(src) &&
   /<div id="inKetteOverlay" class="voll-ansicht" hidden>/.test(src) && /data-ikfertig[^>]*>Fertig</.test(src));
var g=ikGruppen(kid('b')), gid=g.map(function(x){ return x.id; }).join(',');
ok('§2 Gruppen: aktuelle Kette · jede Tageskette · Routinen nach Tagesblock · Ticks DFM/Privat (feste Ketten ohne Ziel)', gid==='ikKette,ikTk:tk1,ikRoutinen,ikTicksDfm,ikTicksPrivat' &&
   g[0].ziel==='kette' && g[1].ziel==='tk' && g[1].tk==='tk1' && g[2].ziel==='block' && g[3].ziel===null && g[4].ziel===null);
S.ui.klGruppen={ ikKette:true, 'ikTk:tk1':true, ikRoutinen:true, ikTicksDfm:true };
var ih=inKetteHtml(kid('b'));
ok('§2 die Karte oben (ziehbar), Gruppen klappbar, Teile als Drop-Ziele, feste Ketten markiert, leere Ziele beschriftet', /class="ik-karte" data-ikdrag="b"/.test(ih) && /data-ikziel="kette"/.test(ih) && /data-ikziel="tk" data-iktk="tk1"/.test(ih) &&
   /data-ikziel="" data-iktk="" data-ikblock="" data-ikfest="1"/.test(ih) && ih.indexOf('feste Kette')>=0 && /class="ik-leer"/.test(ih)===false || /class="ik-leer"/.test(ih));
ok('§2 Einfügen in die aktuelle Kette an Position 1 (vor der ersten sichtbaren Karte)', ikEinfuegen('kette', {}, 'b', 0)===true && tagesKette()[0]==='b');
ok('§2 Einfügen in eine Tageskette ans Ende; die Karte darf in mehreren Ketten stehen', ikEinfuegen('tk', { tk:'tk1' }, 'b', 1)===true && S.tagesketten[0].karten.join(',')==='a,b' && tagesKette().indexOf('b')===0);
ok('§2 Ziehen per langem Druck (300 ms), Einfügelinie, Loslassen fügt ein', /, 300\) \}; \}\);/.test(rumpf('ikDragBinden')) && /ik-linie/.test(rumpf('ikDragBinden')) && /ikEinfuegen\(/.test(rumpf('ikDragBinden')) && /toast\('Eingefügt'\)/.test(rumpf('ikDragBinden')));
ok('§2 „Fertig" schließt und zeichnet die Fokusansicht neu; die Vollbild-Ansicht liegt über dem Fokus-Layer (z-index 200)', /function schliesseInKette\(\)\{ el\('inKetteOverlay'\)\.hidden=true; _ik=null; renderFokus\(\); \}/.test(src) && /\.voll-ansicht\{position:fixed;inset:0;z-index:260;/.test(src));   // §2 (v3.7.6): 260

/* ══ §3 Matrixverlauf live ════════════════════════════════════════════ */
kopf('§3 Matrixverlauf live');
uhr('2026-10-01T12:00:00+02:00');
S.tag.matrixSpur=[ { ts:'2026-10-01T10:00:00+02:00', x:-0.5, y:0.2 }, { ts:'2026-10-01T11:00:00+02:00', x:0.4, y:0.3 } ];
var svgG=matrixVerlaufSvg(S.tag.matrixSpur), svgK=matrixVerlaufSvg(S.tag.matrixSpur, {klein:true});
ok('§3 die Linie läuft vom letzten Messpunkt bis „jetzt" weiter: ein Live-Punkt (r=4) ohne Marker und ohne Tipp-Ziel', (svgG.match(/r="4"/g)||[]).length===1 && (svgG.match(/data-mspunkt=/g)||[]).length===2 && /live:true/.test(rumpf('matrixVerlaufSvg')));
ok('§3 Statusleiste (klein) und Statistik (groß) laufen über dieselbe Funktion; die Statistik-Grafik ist live (data-dialive="mx")', /class="mv-gross" data-dialive="mx"/.test(src) && typeof svgK==='string' && svgK.indexOf('<path')>=0 && /'mx'/.test(rumpf('diagrammeLive')));
ok('§3 Aktualisierung jede Minute auch bei stehender Uhr (Ruhe-Intervall 20 s, jede dritte Runde die Diagramme) und bei jeder neuen Messung', /if\(\+\+_ruheTakt%3===0\) diagrammeLive\(\);/.test(src) && /20000\)/.test(src) && /matrixPosSetzen/.test(rumpf('matrixDialogSpeichern')));

/* ══ §4 Statusleiste ══════════════════════════════════════════════════ */
kopf('§4 Statusleiste: Zeilen getauscht, Topf-Countdown');
ok('§4 Zeile 1 = Punkteleiste, Zeile 2 = Ring · Titel · Restzeit · Kartenpunkte (CSS order), Abstand 5 px', /#topbar \.sl-z1\{order:2\}/.test(src) && /#statusbar \.sb-bar\{order:1\}/.test(src) && /#statusbar \.sl-z3\{order:3\}/.test(src) && /#topbar \.inner\{[^}]*row-gap:5px/.test(src));
kulisse(); belohnungInit();
var A=toepfe([[0,500],[null,0],[null,0],[null,0],[null,0]]); A.aktiverTopf=0; A.gefaerbt=[]; A.stationFarbe=0;
var cd=topfCountdown();
ok('§4 Countdown bis zum günstigsten offenen Feld der Topffarbe: Topf 500 P, Felder 1.000/600 → „−100" WEISS', cd.text==='−100' && cd.farbe===FARBE.WEISS && cd.fehlt===100);
A.toepfe[0].punkte=650; cd=topfCountdown();
ok('§4 reicht der Topf: „✓ malbar" GRUEN', cd.text==='✓ malbar' && cd.farbe===FARBE.GRUEN);
A.gefaerbt=[1,3]; cd=topfCountdown();
ok('§4 keine offenen Felder dieser Farbe: „—"', cd.text==='—');
A.aktiverTopf=1; cd=topfCountdown();
ok('§4 kein aktiver Topf (ohne Farbe): „—"', cd.text==='—');
ok('§4 die Töpfe-Zeile zeigt den Countdown (statt „0/5"), Farbkreis davor', /<div class="kf" title="Bis zum nächsten malbaren Feld"[^>]*><i><\/i><span id="sKF">—<\/span><\/div>/.test(src) && !/<small>\/5<\/small>/.test(src) &&
   /el\('sKF'\)\.textContent=c\.text; el\('sKF'\)\.style\.color=c\.farbe;/.test(src));

/* ══ §4a Pace-Leiste und Live-Beschriftungen ═════════════════════════ */
kopf('§4a Pace-Leiste direkt unter dem Mini-Diagramm, Live-Beschriftungen');
ok('§4a Abstand 5 px, Beschriftungen 10 px tabular-nums', /#statusbar \.sl-mitte\{[^}]*gap:5px/.test(src) && /#statusbar \.sl-pace \.plbl\{[^}]*font-size:10px;[^}]*font-variant-numeric:tabular-nums/.test(src));
/* §8 (v3.7.2): die Marken sind jetzt lila Raute = Ø Karte, grüner Strich = live mit Pfeil, weißer Strich = nötig — die
   Beschriftungen beziehen sich auf diese Marken (Kollisionsregel 4 px bleibt) */
var h1=paceLeisteHtml({ tempoSchnitt:512, tempoZiel:500 }, { wert:400, karte:{ domain:'dfm' }, oe:380 });
ok('§4a (v3.7.2) unter der Raute „◆ Ø 380" (LILA), unter dem grünen Strich „live 400" (GRUEN), unter dem weißen Strich „nötig 500" (WEISS)', /<b class="karte" data-px="[\d.]+" style="color:#a855f7;left:[\d.]+%">◆ Ø 380<\/b>/i.test(h1) && /<b class="live" data-px="[\d.]+" style="color:#3ecf8e;left:[\d.]+%">live 400<\/b>/i.test(h1) && h1.indexOf('style="color:'+FARBE.WEISS+';left:')>=0 && h1.indexOf('>nötig 500</b>')>=0);
ok('§4a (v3.7.2) live unter dem Tagesschnitt (400 < 512): Pfeil ← ROT am grünen Strich', h1.indexOf('class="ppfeil senkt"')>=0 && h1.indexOf(';color:'+FARBE.ROT+'">←</b>')>=0);
var h2=paceLeisteHtml({ tempoSchnitt:452, tempoZiel:500 }, null);
ok('§4a ohne laufende Karte: nur die nötig-Beschriftung, kein Pfeil', h2.indexOf('>nötig 500</b>')>=0 && h2.indexOf('class="karte"')<0 && h2.indexOf('class="live"')<0 && h2.indexOf('ppfeil')<0);
ok('§4a ohne „nötig" (Tagesziel erreicht) keine nötig-Beschriftung', paceLeisteHtml({ tempoSchnitt:600, tempoZiel:0 }, null).indexOf('class="noetig"')<0);
ok('§4a überlappende Beschriftungen werden seitlich verschoben, bis 4 px frei sind (nach jedem Zeichnen der Leiste)', /LUECKE=4/.test(rumpf('paceBeschriftungenEntzerren')) && /paceBeschriftungenEntzerren\(el\('sZTempo'\)\)/.test(rumpf('renderStatusbar')));
ok('§4a die Leiste selbst: fünf Zonen, weißer Strich, Raute, grüner Strich', /class="pzeile"><span class="pbahn zonen">(<i style="left:[\d.]+%;width:[\d.]+%;background:#[0-9a-fA-F]{6}"><\/i>){5}<u class="noetig" style="left:[\d.]+%"><\/u><b class="raute"/.test(h1) && /<u class="live"/.test(h1));

/* ══ §4b Kauf füllt einen Farbtopf ═══════════════════════════════════ */
kopf('§4b Kauf füllt einen Farbtopf');
A=toepfe([[0,500],[null,0],[null,0],[null,0],[null,0]]); A.aktiverTopf=0; A.gefaerbt=[]; A.stationFarbe=0; A.tank=0;
var of=offeneFarben();
ok('§4b offene Farben in der Reihenfolge der Auswahlstation mit Anzahl offener Felder (Ocker 2, Schwarz 1; Blau ohne Felder fehlt)', of.map(function(f){ return f.name+':'+f.n; }).join(',')==='Ocker:2,Schwarz:1');
ok('§4b Fassung je Farbe = größtes offenes Feld dieser Farbe × topfAufschlag (Ocker 1.000 → 1.200, Schwarz 800 → 960)', topfFassungFarbe(0)===1200 && topfFassungFarbe(1)===960);
var gs=farbeSchenken(0, topfFassungFarbe(0));
ok('§4b das Geschenk füllt den vorhandenen Topf dieser Farbe (500 → 1.200 voll), der Rest (500) geht in den Tank — keine Buchung', gs.topf===0 && A.toepfe[0].punkte===1200 && gs.inTopf===700 && gs.inTank===500 && A.tank===500 && A.verteilt===0);
gs=farbeSchenken(1, topfFassungFarbe(1));
ok('§4b ohne Topf dieser Farbe: der nächste leere Topf übernimmt die Farbe (Schwarz 960)', gs.topf===1 && A.toepfe[1].farbe===1 && A.toepfe[1].punkte===960 && gs.inTank===0);
A=toepfe([[0,1200],[1,960],[2,1200],[2,1200],[2,1200]]); A.tank=0;
gs=farbeSchenken(1, 300);
ok('§4b reicht kein Topf (alle voll bzw. belegt; §1 v3.7.3: Schwarz-Topf 960 ist nach seiner Fassung voll): alles geht in den Tank', gs.topf===-1 && gs.inTopf===0 && gs.inTank===300 && A.tank===300);
belohnungInit(); S.meta.muenzenGesamt=100000; S.meta.ausgegebenGesamt=0;
var dk=kaufBelohnungDaten('soziales', 1, 500, 30), kb=kaufBelohnungHtml(dk);
ok('§4b die Kaufdaten tragen die offenen Farben; die Ansicht hat den Schritt „Farbe wählen" (Farbpunkt · Name · Anzahl)', dk.farben.length===2 && kb.indexOf('Farbe wählen')>=0 && /<button class="mal-farbe" data-kbfarbe="0" aria-label="Ocker"><i style="background:#111111"><\/i><span>2<\/span><\/button>/.test(kb) && /data-kbfarbe="1"/.test(kb) && !/data-kbfarbe="2"/.test(kb));
ok('§4b nicht mehr überspringbar: kein Doppeltipp, kein Hinweis; „Weiter" bleibt', !/dblclick/.test(rumpf('kaufBelohnungZeigen')) && kb.indexOf('Doppeltipp')<0 && /data-belweiter="1">Weiter</.test(kb));
ok('§4b die Karten-Belohnung bleibt überspringbar (Doppeltipp)', /ov\.addEventListener\('dblclick', zu\)/.test(rumpf('belohnungAnsichtZeigen')) && /Doppeltipp überspringt/.test(rumpf('belohnungAnsichtZeigen')));
ok('§4b ohne Auswahl füllt „Weiter" die nächste offene Farbe (Vorgabe = erste in Stationsreihenfolge)', /let wahl=\(d\.farben\|\|\[\]\)\.length \? d\.farben\[0\]\.i : null;/.test(rumpf('kaufBelohnungZeigen')) && /farbeSchenken\(wahl, topfFassungFarbe\(wahl\)\)/.test(rumpf('kaufBelohnungZeigen')) && kb.indexOf('(Vorgabe)')>=0);
A.gefaerbt=[1,2,3]; kb=kaufBelohnungHtml(kaufBelohnungDaten('soziales', 1, 500, 30));
ok('§4b keine offene Farbe: „Alle Farben dieser Kulisse sind fertig", keine Auswahl', kb.indexOf('Alle Farben dieser Kulisse sind fertig')>=0 && kb.indexOf('data-kbfarbe')<0);
A.gefaerbt=[];

/* ══ §4c Fertige Farbe, Auto-Wechsel, Kulissen-Abschluss ═════════════ */
kopf('§4c Farbtöpfe füllen nur offene Farben · Kulissen-Abschluss · Kulissenwechsel');
var _ausmalW=ausmalW, wTest=0; ausmalW=function(){ return wTest; };
A=toepfe([[1,900],[null,0],[null,0],[null,0],[null,0]]); A.aktiverTopf=0; A.stationFarbe=1; A.gefaerbt=[2]; A.tank=0; A.verteilt=0; A.fertig=[]; A.kulissenFertig=[]; A.kulisse=1;
wTest=100; ausmalVerteilen();
ok('§4c ein Topf, dessen Farbe (Schwarz) keine offenen Felder mehr hat, nimmt nichts auf — die Farbe geht in einen leeren Topf mit offener Farbe (Ocker), der Topf bleibt stehen', A.toepfe[0].punkte===900 && A.toepfe[0].farbe===1 && A.aktiverTopf===1 && A.toepfe[1].farbe===0 && A.toepfe[1].punkte===100 && A.tank===0);
A=toepfe([[1,900],[0,1200],[0,1200],[0,1200],[0,1200]]); A.aktiverTopf=0; A.stationFarbe=1; A.tank=0; A.verteilt=100;
wTest=150; ausmalVerteilen();
ok('§4c ist kein Topf frei, geht sie in den Tank', A.tank===50 && A.toepfe[0].punkte===900);
topfAuskippen(0);
ok('§4c Auskippen: der Inhalt (900) geht in den Tank', A.toepfe[0].punkte===0 && A.toepfe[0].farbe===null && A.tank===950);
// Kulissen-Abschluss
S.historie.push({ tagId:'2026-09-29-1', datum:'2026-09-29', luecke:false, punkteBilanz:3000, punkteDfm:2000, punktePrivat:1000 }, { tagId:'2026-09-30-1', datum:'2026-09-30', luecke:false, punkteBilanz:1500, punkteDfm:1000, punktePrivat:500 });
S.intraday.push({ ts:'2026-09-30T10:00:00+02:00', kartenId:'a', domaene:'dfm', punkte:100, minuten:90, typ:'timer' });
A=toepfe([[0,1200],[null,0],[null,0],[null,0],[null,0]]); A.aktiverTopf=0; A.stationFarbe=0; A.gefaerbt=[2,3]; A.kulissenStart={1:'2026-09-29T08:00:00+02:00'}; A.malTage=['2026-09-29','2026-09-30']; A.kulissenFertig=[]; A.fertig=[]; A.freigeschaltetBis=1; A.tank=0;
S.ui.malTopf=0; uhr('2026-10-01T14:00:00+02:00');
var gemalt=feldAusmalen(1);
ok('§4c das letzte Feld: Eintrag in ausmalen.kulissenFertig {kulisse, ts, tage, farbe, fokusMin, felder}, Kulisse in „fertig"', gemalt===true && A.kulissenFertig.length===1 && A.kulissenFertig[0].kulisse===1 && A.kulissenFertig[0].tage===2 && A.kulissenFertig[0].felder===3 &&
   A.kulissenFertig[0].fokusMin===90 && typeof A.kulissenFertig[0].ts==='string' && A.fertig.indexOf(1)>=0 && A.malTage.indexOf(DO)>=0);
var kz=kulisseKennzahlen(1), kh=kulisseBelohnungHtml(kz);
ok('§4c Kennzahlen: Dauer 2 Tg 6 Std · Farbe seit Start (3.000 + 1.500 + heute) · Fokuszeit 90 Min · 3 Felder · 3 Tage mit Ausmalen · Punkte gesamt', kz.tage===2 && kz.std===6 && kz.farbe===4500+Math.round(Math.max(0, tagesPunkteLive())) && kz.fokusMin===90 && kz.felder===3 && kz.malTage===3 && kz.punkte===4500+Math.round(Math.max(0, tagesPunkteLive())));
ok('§4c die Ansicht: großes Bild der farbigen Kulisse mit Avatar im aktuellen Outfit (Tipp blendet ein/aus), sechs Kennzahlen, „Weiter"', /class="st kul-bild"/.test(kh) && /img class="bild" src="img\/kulissen\/bg01_farbig\.jpg"/.test(kh) && /img class="av" src="[^"]+"/.test(kh) && kh.indexOf('Tippen blendet den Avatar ein und aus')>=0 &&
   (kh.match(/<div class="t"><b>/g)||[]).length===6 && /data-belweiter="1">Weiter</.test(kh) && /classList\.toggle\('ohne-av'\)/.test(rumpf('kulisseBelohnungZeigen')) && !/dblclick/.test(rumpf('kulisseBelohnungZeigen')));
ok('§4c Hinweis (§1 v3.7.2: fertig = nächste sofort frei): „Kulisse 2 frei" GRUEN', A.freigeschaltetBis===2 && kh.indexOf('<b style="color:'+FARBE.GRUEN+'">Kulisse 2 frei</b>')>=0);
ok('§4c der Wechsel folgt entkoppelt (kulissenWechselPruefen per setTimeout)', A.kulisse===1 && /setTimeout/.test(rumpf('kulissenWechselPruefen')));
// Kulissenwechsel mit Geschenk
A.tank=100; A.toepfe[1]={ farbe:0, punkte:300 }; A.freigeschaltetBis=2; ausmalKulisseWechsel();
ok('§4c Kulissenwechsel: Start der neuen Kulisse gemerkt, vorheriger Topf- und Tankinhalt im Tank (Tank 100 + Topf 200 + Topf 300)', A.kulisse===2 && typeof A.kulissenStart[2]==='string' && A.tank===600 && A.gefaerbt.length===0);
ok('§4c (§2 v3.7.2 · §1 v3.7.3) das Geschenk ist EIN Topf voll in der Farbe mit dem größten Bedarf (A: 500 × 1,2 = 600), die anderen leer', A.toepfe[0].farbe===0 && A.toepfe[0].punkte===600 && A.toepfe.slice(1).every(function(t){ return t.farbe===null && t.punkte===0; }) && A.geschenkOffen===undefined && A.aktiverTopf===0 && A.stationFarbe===0);
A.kulisse=2; A.geschenkOffen=2; A.toepfe=[0,1,2,3,4].map(function(){ return { farbe:null, punkte:0 }; }); delete _kul[2];
ok('§4c sind die Kulissendaten noch nicht geladen, merkt ausmalen.geschenkOffen die Kulisse — nachgeholt beim Laden (ausmalDaten → kulissenGeschenkNachholen)', kulissenGeschenkNachholen()===false && A.geschenkOffen===2 && /kulissenGeschenkNachholen\(\);/.test(rumpf('ausmalDaten')));
kulisse(); ok('§4c … und holt es dann nach', kulissenGeschenkNachholen()===true && A.toepfe[0].punkte===600 && A.geschenkOffen===undefined);
var ex=ausmalExport();
ok('§4c Datenvertrag additiv: ausmalen.kulissenStart, ausmalen.kulissenFertig[], ausmalen.malTage im Export; der Import nimmt sie an', ex.kulissenStart[2]===A.kulissenStart[2] && ex.kulissenFertig.length===1 && Array.isArray(ex.malTage) &&
   (ausmalKorrektur({ kulissenStart:{1:'2026-09-01T00:00:00', 2:'2026-10-01T00:00:00'}, kulissenFertig:[{kulisse:1, ts:'x', tage:1, farbe:1, fokusMin:1, felder:1}], malTage:['2026-09-01','falsch'] }), A.kulissenStart[1]==='2026-09-01T00:00:00' && A.kulissenFertig.length===1 && A.malTage.join(',')==='2026-09-01'));
ausmalW=_ausmalW; kulisseWeg(); S.ui.malTopf=null;

/* ══ §5 Eine Kettenliste überall ═════════════════════════════════════ */
kopf('§5 Eine Kettenliste überall');
tagDonnerstag();
S.karten=[ neueKarte({ id:'a', domain:D, titel:'Angebot A', sollMin:30, faelligkeit:DO, komplexitaet:3 }), neueKarte({ id:'b', domain:D, titel:'Angebot B', sollMin:30, faelligkeit:anVorTage(DO,1), komplexitaet:1 }),
  neueKarte({ id:'rp', domain:P, titel:'Zähne', rhythmus:{typ:'taeglich'}, modus:'staffel', staffel:[20], faelligkeit:DO }), neueKarte({ id:'td', domain:D, titel:'Wasser DFM', ticksAktiv:true, faelligkeit:DO }),
  neueKarte({ id:'e', domain:D, titel:'Erledigt', status:'erledigt', tagId:aktuelleTagId(), faelligkeit:DO }) ];
ketteSetzen(['a','b','rp','td']);
S.intraday.push({ ts:'2026-09-30T07:30:00+02:00', kartenId:'rp', domaene:'privat', punkte:20, minuten:5, tickMin:5, typ:'tick' }, { ts:'2026-09-29T08:30:00+02:00', kartenId:'rp', domaene:'privat', punkte:20, minuten:5, tickMin:5, typ:'tick' },
  { ts:'2026-09-30T18:00:00+02:00', kartenId:'td', domaene:'dfm', punkte:20, minuten:5, tickMin:5, typ:'tick' });   // aktive Tage = Tage mit Minuten im Stunden-Log
S.historie.push({ tagId:'2026-09-29-1', datum:'2026-09-29', luecke:false, punkteBilanz:100 }, { tagId:'2026-09-30-1', datum:'2026-09-30', luecke:false, punkteBilanz:100 });
ok('§5 Gruppen in fester Reihenfolge: Aktuelle Kette · Verlauf · Routinen · Ticks DFM · Ticks Privat · Meistgenutzt · 7 Tage · Erledigt heute', KL_GRUPPEN.map(function(g){ return g[0]; }).join(',')==='kette,verlauf,routinen,ticksDfm,ticksPrivat,meist,erledigt' && KL_GRUPPEN[5][1]==='Meistgenutzt · 7 Tage');
var inh=kettenListeInhalt({ karte:null, filter:'' });
ok('§5 Inhalt: Kette (DFM) a,b,td · Routinen rp,td · Ticks DFM td · Ticks Privat rp · Erledigt e', gruppe(inh,'kette')==='a,b,td' && gruppe(inh,'routinen')==='rp,td' && gruppe(inh,'ticksDfm')==='td' && gruppe(inh,'ticksPrivat')==='rp' && gruppe(inh,'erledigt')==='e');
ok('§5 Sortierungen: Gruppiert · Termin · Ø Erledigungszeit · Priorität; Standard Kette = Kettenreihenfolge, Routinen/Ticks = Ø Erledigungszeit, sonst Priorität', KL_SORT.map(function(x){ return x[1]; }).join('|')==='Gruppiert|Termin|Ø Erledigungszeit|Priorität' &&
   klSortStandard('kette')==='kette' && klSortStandard('routinen')==='erledigungszeit' && klSortStandard('ticksDfm')==='erledigungszeit' && klSortStandard('meist')==='prio' && klSortStandard('erledigt')==='prio');
ok('§5 Ø Erledigungszeit = Ø Uhrzeit der Erledigung (Ticks/Abhaken) über die letzten 7 aktiven Tage: Zähne 08:00, Wasser 18:00 → Zähne zuerst', Math.abs(oeErledigungsZeit(kid('rp'))-8)<1e-9 && Math.abs(oeErledigungsZeit(kid('td'))-18)<1e-9 && gruppe(inh,'routinen')==='rp,td');
klSortSetzen('kette','termin'); inh=kettenListeInhalt({ karte:null, filter:'' });
ok('§5 Termin: nach Deadline (b gestern vor a heute, td ohne Datum zuletzt); die Wahl wird je Gruppe gemerkt (S.ui.klSort)', gruppe(inh,'kette')==='b,a,td' && klSortWahl('kette')==='termin' && S.ui.klSort.kette==='termin');
klSortSetzen('kette','prio'); inh=kettenListeInhalt({ karte:null, filter:'' });
ok('§5 Priorität: a (Komplexität 3) vor b', gruppe(inh,'kette').indexOf('a')<gruppe(inh,'kette').indexOf('b'));
klSortSetzen('kette','gruppiert'); inh=kettenListeInhalt({ karte:null, filter:'' });
ok('§5 Gruppiert: Zwischenüberschriften — Routinen nach Tagesblock, andere Gruppen nach Familie', inh.kette.teile.every(function(t){ return t.name==='DFM' || t.name==='Privat'; }) && typeof klGruppiert==='function');
klSortSetzen('kette','kette');
var fh=(fokusKarteAnsehen('a'), renderFokus(), el('fokusView').innerHTML);
ok('§5 unten in der Fokusansicht: dieselbe Kettenliste (ohne die gezeigte Karte in der Kette)', fh.indexOf('data-klliste')>=0 && /"kontext":"fokus"/.test(fh) && (function(){ var i2=kettenListeInhalt({ karte:kid('a'), filter:'' }); return gruppe(i2,'kette')==='b,td'; })());
sucheOeffnen();   // §4 (v3.7.6)
ok('§5 Suche: Suchfeld bleibt, darunter die Kettenliste; die Eingabe filtert alle Gruppen', el('suBody').innerHTML.indexOf('data-klliste')>=0 && /"kontext":"suche"/.test(el('suBody').innerHTML) && gruppe(kettenListeInhalt({ karte:null, filter:'angebot' }),'kette')==='a,b' && kettenListeInhalt({ karte:null, filter:'angebot' }).routinen.n===0);
sucheSchliessen(); oeffnePlusListe();
ok('§5 hinter dem „+": Vollbild mit „+ Neue Karte" oben und der Kettenliste', /<div id="plusOverlay" class="voll-ansicht" hidden>/.test(src) && /data-plusneu="1">＋ Neue Karte</.test(src) && el('plusBody').innerHTML.indexOf('data-klliste')>=0 && /el\('neuFab'\)\.addEventListener\('click', \(\)=>oeffnePlusListe\(\)\)/.test(src));
ok('§5 Klapp- und Sortierzustand stehen nicht im Datenvertrag', JSON.stringify(syncExport('delta')).indexOf('klSort')<0 && JSON.stringify(syncExport('delta')).indexOf('klGruppen')<0);

/* ══ §6 Kartenzeile ═══════════════════════════════════════════════════ */
kopf('§6 Kartenzeile');
var za=kartenZeileHtml(kid('a')), zr=kartenZeileHtml(kid('rp')), zt=kartenZeileHtml(kid('td')), ze=kartenZeileHtml(kid('e'));
ok('§6 Hintergrund = Familienfarbe 18 % über KACHEL, Schrift WEISS', za.indexOf('--famb:'+farbeAlpha(famFarbe(kid('a')),.18))>=0 && /\.kl-z\{background:linear-gradient\(var\(--famb,transparent\),var\(--famb,transparent\)\),#1a1d22;color:#e8e9ec;/.test(src));
ok('§6 Umrandung 1 px: Aufgaben ORANGE, Routinen/Counter BRAUN #a0703c', za.indexOf('--rand:'+FARBE.ORANGE)>=0 && zr.indexOf('--rand:#a0703c')>=0 && zt.indexOf('--rand:#a0703c')>=0 && KL_RAND_ROUTINE==='#a0703c' && /\.kl-z\{[^}]*border:1px solid var\(--rand,#2a2d33\)/.test(src));
ok('§6 links und rechts je 5 px Dringlichkeits-Ampel (--prio aus prioFarbe)', za.indexOf('--prio:'+prioFarbe(kid('a')))>=0 && /\.kl-z\{[^}]*border-left:5px solid var\(--prio,#9a9ca2\);border-right:5px solid var\(--prio,#9a9ca2\)/.test(src));
ok('§6 rechts: Tick-Knopf mit Zahl bei Karten mit Tick, sonst die heute gebuchte Zeit (live)', /data-kltick="td"/.test(zt) && /data-kltick="rp"/.test(zr) && /<span class="kl-zeit" data-klzeit="a">/.test(za) && za.indexOf('data-kltick')<0 && /kartenZeilenZeitLive\(\)/.test(src));
ok('§6 Titel-Tipp übernimmt in die Fokusansicht; Haken abgegrenzt; Erledigte mit Wieder-öffnen', /data-klfokus="a"/.test(za) && /data-klcheck="a"/.test(za) && /data-klreopen="e"/.test(ze) && /fokusKarteAnsehen\(/.test(rumpf('kettenListeKlick')));
routineTick(kid('td')); routineTick(kid('td'));
kid('td').tageslimit=2; var zt2=kartenZeileHtml(kid('td'));
ok('§6 über dem Tagesziel: Zeile blasser (55 %)', /class="kl-z[^"]* ueber/.test(zt2) && /\.kl-z\.ueber\{opacity:\.55\}/.test(src));

/* ══ §7 Zeit und Tick ═════════════════════════════════════════════════ */
kopf('§7 Zeit und Tick grundsätzlich neu');
ok('§7 Tick nur bei Freigabe: Staffel, Pflicht, Counter (ticksAktiv), Tick-Kurve, Sonderrolle — eine Aufgabe nicht', istTickbar(kid('rp')) && istTickbar(kid('td')) && istTickbar({ rolle:'aufstehen' }) && !istTickbar(kid('a')) && !istTickbar({ modus:'zeit' }));
S.karten.push(neueKarte({ id:'st', domain:P, titel:'Staffel', rhythmus:{typ:'taeglich'}, modus:'staffel', staffel:[50], tageslimit:1, tickMinuten:15, faelligkeit:DO }));
var t1=routineTick(kid('st'));
ok('§7 jeder Tick bucht seine Tick-Minuten auf die Karte (15 Min Ist-Zeit) und in den Stunden-Log (minuten + tickMin)', t1 && t1.min===15 && t1.gebucht===true && num(kid('st').istSek)===900 && Math.round(heuteInvestiertMin(kid('st')))===15 &&
   (function(){ var e=S.intraday.filter(function(x){ return x.kartenId==='st' && x.typ==='tick'; }).pop(); return e.minuten===15 && e.tickMin===15; })());
ok('§7 Tagesziel/Limit erreicht → NICHT abgehakt: offen, Status „Ziel erreicht", blasser', kid('st').status==='offen' && kartenStatusHeute(kid('st'))==='zielErreicht' && /class="kl-z[^"]* ueber/.test(kartenZeileHtml(kid('st'))));
tickUeberLimit(kid('st'), kid('st'));
ok('§7 ein Tick über dem Limit bucht weiter seine Minuten (30 Min)', tickAnzahlHeute(kid('st'))===2 && num(kid('st').istSek)===1800);
routineErledigen(kid('st'));
ok('§7 ✓ schließt die Karte samt Ticks des Tages', kid('st').status==='erledigt' && kartenStatusHeute(kid('st'))==='erledigt' && tickAnzahlHeute(kid('st'))===2);
karteWiederOeffnen('st');
ok('§7 Wieder öffnen: Uhr ab null (istMinutenStart), die Ticks bleiben', kid('st').status==='offen' && tickAnzahlHeute(kid('st'))===2 && Math.round(S.tag.istMinutenStart['st'])===30 && Math.round(heuteInvestiertMin(kid('st')))===0);
ok('§7 der Tick nach dem Abschließen bleibt möglich (bucht Minuten, keine Punkte)', (routineErledigen(kid('st')), tickUeberLimit(kid('st'), kid('st')), num(kid('st').istSek)===2700 && kid('st').status==='erledigt'));
ok('§7 die festen Ketten „Ticks DFM"/„Ticks Privat" = tickbare Karten der Familie', ids(klTicks('dfm'))==='td' && ids(klTicks('privat')).indexOf('rp')>=0 && ids(klTicks('privat')).indexOf('st')>=0);
ok('§7 die Punkte-Engine ist unverändert (Tick-Minuten gehen nicht in die Zeitpunkte des Ticks)', t1.punkte===50 && kartePunkteHeute(kid('st'))===50);

/* ══ §8 Positionsabfrage gibt Punkte ═════════════════════════════════ */
kopf('§8 Positionsabfrage gibt Punkte · Tagebuch raus');
tagDonnerstag();
S.karten=[ neueKarte({ id:'w', domain:D, titel:'Werkzeug', matrixFeld:'werkzeug', sollMin:10, faelligkeit:DO }) ];
ok('§8 Staffel: 1–5 je 100, 6–8 je 50, ab 9 je 20 (Settings positionStaffel)', positionStaffel(1)===100 && positionStaffel(5)===100 && positionStaffel(6)===50 && positionStaffel(8)===50 && positionStaffel(9)===20 && positionStaffel(30)===20 &&
   (S.settings.positionStaffel=[90,40,10], positionStaffel(1)===90 && positionStaffel(7)===40 && positionStaffel(9)===10) && (delete S.settings.positionStaffel, true));
var sum=0; for(var i=1;i<=9;i++){ matrixPosSetzen(0.1*i-0.5, 0.2, null, 'test'); }
var pk=positionKarte(false);
ok('§8 neun beantwortete Abfragen: 5×100 + 3×50 + 20 = 670 P auf der festen Privat-Karte „Position gesetzt" (rolle position, Werkzeug)', !!pk && pk.id==='k3-position' && pk.rolle==='position' && pk.domain==='privat' && matrixFeldVon(pk)==='werkzeug' && kartePunkteHeute(pk)===670 && tagesPunkteDomain('privat')===670);
var vor=kartePunkteHeute(pk); matrixUeberspringen(null, 'test');
ok('§8 übersprungene Abfragen bringen nichts', kartePunkteHeute(pk)===vor && S.tag.matrixUebersprungen===1);
ok('§8 die Buchung steht im Stunden-Log (Abhak-Punkte ohne Zeit) — Tagesbilanz = Log', (function(){ var l=S.intraday.filter(function(e){ return e.kartenId==='k3-position'; }); return l.length===9 && l.every(function(e){ return e.typ==='tick' && e.minuten===0; }) && Math.abs(l.reduce(function(a,e){ return a+num(e.punkte); },0)-670)<0.01; })());
ok('§8 die Karte steht in keiner Liste, Kette, Leiste oder als Werkzeug-Vorschlag', karteVerborgen(pk) && !abhakLeisteKarten().some(function(k){ return k.id===pk.id; }) && !ketteKarten().some(function(k){ return k.id===pk.id; }) && !werkzeugKarten().some(function(k){ return k.id===pk.id; }) &&
   (function(){ var i2=kettenListeInhalt({ karte:null, filter:'' }); return Object.keys(i2).every(function(g2){ return gruppe(i2,g2).indexOf('k3-position')<0; }); })());
ok('§8 per Paket setzbar (rolle position) — dann nutzt die App diese Karte', (imp([{ id:'pos-airtable', domain:P, titel:'Position gesetzt', rolle:'position', matrixFeld:'werkzeug' }]), kid('pos-airtable') && kid('pos-airtable').rolle==='position') && (S.karten=S.karten.filter(function(k){ return k.id!=='pos-airtable'; }), true));
// §2 (v3.7.1): das Tagebuch ist zurueck — Dialog ueber die Matrix, Karte sichtbar (Ticks Privat), eigene Punkte 0; der alte Such-Knopf bleibt weg
ok('§8 (v3.7.1) Tagebuch über die Matrix: Dialog, Matrix-Tipp und Karte k3-tagebuch (0 P, 0 Min); kein Such-Knopf', !karteVerborgen({ rolle:'tagebuch' }) && typeof oeffneTagebuch==='function' && typeof tagebuchSpeichern==='function' &&
   typeof tagebuchAusMatrixKlick==='function' && /closest\('svg\.fb-mx\.klick'\)/.test(src) && !/data-tagebuch="1"/.test(src) && (function(){ var k=tagebuchKarte(true); return k.rolle==='tagebuch' && k.ticksAktiv===true && num(k.tickWert)===0 && num(k.tickMinuten)===0; })());
S.tag.matrixSpur.push({ ts:jetztIso(), x:0.2, y:0.2, quelle:'tagebuch', anlass:'tagebuch', gedanke:'alt' });
ok('§8 bestehende Tagebuch-Einträge bleiben in Historie und Export', syncExport('delta').matrixSpur.some(function(e){ return e.quelle==='tagebuch' && e.gedanke==='alt'; }));

/* ══ §9 Tagesstart und Tagesabschluss ════════════════════════════════ */
kopf('§9 Tagesstart und Tagesabschluss');
frisch(); uhr('2026-10-01T07:00:00+02:00');
imp([ { id:'auf', domain:P, titel:'Aufstehen', matrixFeld:'werkzeug', modus:'pflicht', pflichtWert:0, tageslimit:1, rolle:'aufstehen', rhythmus:{typ:'taeglich'} },
      { id:'ab', domain:P, titel:'Tagesabschluss', matrixFeld:'werkzeug', modus:'pflicht', pflichtWert:0, tageslimit:1, rolle:'tagesabschluss', rhythmus:{typ:'taeglich'} },
      { id:'adhs', domain:P, titel:'ADHS-Erholung', matrixFeld:'zustand', modus:'zeit', zeitziel:120, rolle:'erholung', rhythmus:{typ:'taeglich'} },
      { id:'k3-schlafen', domain:P, titel:'Schlafen', matrixFeld:'zustand', rolle:'schlafen', immerSichtbar:true },
      { id:'arb', domain:D, titel:'Arbeit', sollMin:60, faelligkeit:DO } ]);
ok('§9 Setting tagesEckPunkte = 150 (Schema tagesabschluss.eckPunkte)', num(S.settings.tagesEckPunkte)===150 && EINST_SCHEMA.tagesabschluss.eckPunkte.p==='tagesEckPunkte');
aufstehenBestaetigen(70, { tapTs:jetztIso() });
var eck=function(an){ return (S.tag.log||[]).filter(function(e){ return e.art==='eck' && e.itemId==='eck-'+an; }); };
ok('§9 Tagesstart gibt 150 DFM und 150 Privat als Abhak-Punkte ohne Zeit (Tages-Log art eck je Familie)', tagOffen() && eck('aufstehen').length===2 && eck('aufstehen').map(function(e){ return e.domain+':'+e.punkte; }).sort().join(',')==='dfm:150,privat:150' &&
   tagesPunkteDomain('dfm')===150 && tagesPunkteDomain('privat')===150 && S.tag.eckpunkte.aufstehen);
ok('§9 … im Stunden-Log ohne Karte, mit Familie; Bilanz = Log', (function(){ var l=S.intraday.filter(function(e){ return e.eck==='aufstehen'; }); return l.length===2 && l.every(function(e){ return e.kartenId===null && e.punkte===150 && e.minuten===0; }) && l.map(function(e){ return e.domaene; }).sort().join(',')==='dfm,privat' && Math.abs(tagesPunkteLive()-S.intraday.reduce(function(a,e){ return a+num(e.punkte); },0))<0.01; })());
ok('§9 nur einmal je Tag', (tagesEckpunkteBuchen('aufstehen', kid('auf')), eck('aufstehen').length===2));
ok('§9 der Tick der Rollenkarte bleibt (Aufstehen abgehakt)', kid('auf').status==='erledigt');
uhr('2026-10-01T20:00:00+02:00'); fokusStarten('arb'); minuten(30);
oeffneAbschlussV3(1);
ok('§9 die Uhr der Karte „Tagesabschluss" startet beim Öffnen der Abschluss-Ansicht (Bugfix: ▶ öffnete nur die Ansicht)', S.fokus && S.fokus.laeuft && S.fokus.karteId==='ab' && /abschlussUhr:true/.test(rumpf('oeffneAbschlussV3')) && /!opt\.abschlussUhr/.test(rumpf('fokusStarten')));
closeSheet(); abv3.aktiv=false; minuten(10);
ok('§9 … und läuft weiter, wenn Pascal zur Fokusansicht zurückkehrt', S.fokus && S.fokus.laeuft && S.fokus.karteId==='ab' && Math.round(laufendeSek()/60)===10);
oeffneAbschlussV3(3); abschlussMessungUebernehmen();
ok('§9 Schritt 3 stoppt die Abschluss-Uhr nicht', S.fokus && S.fokus.laeuft && S.fokus.karteId==='ab');
var vorAb=tagesPunkteLive(); abschlussV3Schliessen();
ok('§9 Tagesabschluss: +150 DFM +150 Privat, die Abschluss-Uhr ist eingebucht (quelle tagesabschluss), Karte abgehakt', eck('abschluss').length===2 && Math.round(tagesPunkteLive()-vorAb)===300 && !(S.fokus && S.fokus.laeuft) &&
   S.intraday.some(function(e){ return e.kartenId==='ab' && e.typ==='timer' && e.quelle==='tagesabschluss'; }) && kid('ab').status==='erledigt' && !!S.tag.endeTs);
ok('§9 danach: „ADHS-Erholung" an Position 1 der Kette, Uhr startbar', tagesKette()[0]==='adhs' && uhrFrei(kid('adhs')) && (fokusStarten('adhs'), S.fokus && S.fokus.laeuft && S.fokus.karteId==='adhs'));
minuten(5); fokusZeitEinbuchen(); karteAbhaken('adhs', true);
ok('§9 ADHS-Erholung abgehakt → „Schlafen" an Position 1 mit Soll = Schlafbedarf (7 Std = 420 Min)', tagesKette()[0]==='k3-schlafen' && kid('k3-schlafen').sollMin===420 && nachAbschluss());
ok('§9 die App läuft nach dem Abschluss normal weiter (Nachtrag ins nächste Delta)', S.intraday.filter(function(e){ return e.nachAbschluss; }).length>=1);

/* ══ §9a Erholungskarten ═════════════════════════════════════════════ */
kopf('§9a Erholungskarten');
tagSamstag();
S.karten=[ neueKarte({ id:'sp', domain:P, titel:'Spaziergang', matrixFeld:'zustand', sollMin:60, faelligkeit:SA, erholung:true }), neueKarte({ id:'no', domain:P, titel:'Normal', matrixFeld:'zustand', sollMin:60, faelligkeit:SA }) ];
ok('§9a Karten-Einstellung „Erholung": Schalter in den Kartendetails (data-derholung, wie die Tick-Freigabe), Feld erholung:true, per Paket setzbar', /data-derholung="1"/.test(src) && /if\(t\.closest\('\[data-derholung\]'\)\)\{ entwurf\.erholung=!entwurf\.erholung; renderDetail\(\); return; \}/.test(src) &&
   (imp([{ id:'imp1', domain:P, titel:'Import', matrixFeld:'zustand', sollMin:30, faelligkeit:SA, erholung:true }]), !!kid('imp1') && kid('imp1').erholung===true) && syncExport('delta').karten.some(function(k){ return k.id==='sp' && k.erholung===true; }));
ok('§9a am Wochenende: Matrixfeld zählt als Werkzeug (Faktor aus den Einstellungen), egal welches Feld die Karte trägt', erholungAktiv(kid('sp')) && matrixFaktor(kid('sp'))===num(S.settings.matrixFaktor.werkzeug) && matrixFaktor(kid('no'))===num(S.settings.matrixFaktor.zustand) && matrixFeldVon(kid('sp'))==='zustand');
fokusStarten('sp'); minuten(30); fokusZeitEinbuchen(); fokusStarten('no'); minuten(30); fokusZeitEinbuchen();
var eSp=S.intraday.filter(function(e){ return e.kartenId==='sp'; }).pop(), eNo=S.intraday.filter(function(e){ return e.kartenId==='no'; }).pop();
ok('§9a jede Buchung trägt erholung:true im Stunden-Log — nur bei Erholungskarten', eSp.erholung===true && eNo.erholung===undefined);
var tage=analyseRohTage(), heute=tage.filter(function(e){ return e.datum===SA; })[0];
ok('§9a ACWR: Erholungspunkte mit Gewicht −0,5 in der Tageslast (Punkte − 1,5 × Erholung), nie unter 0; akut und chronisch über anLast', !!heute && heute.erholungPrivat>0 && Math.abs(anLast(heute,'alle')-Math.max(0, num(anPunkte(heute,'alle'))-1.5*heute.erholung))<1e-9 &&
   anLast({ punkte:100, erholung:200 }, 'alle')===0 && /anLast\(x\.e,dom\)/.test(rumpf('anAcwrReihe')) && /anLast\(x\.e,'alle'\)/.test(rumpf('acwrHeuteWerte')));
ok('§9a Tagesziele, Münzen, Farbe und Statusleiste zählen die Punkte voll (keine Erholungs-Gewichtung außerhalb der Belastung)', Math.abs(num(heute.punkte)-tagesPunkteLive())<0.01 && rumpf('renderStatusbar').indexOf('anLast')<0 && rumpf('tagesPunkteDomain').indexOf('erholung')<0 && rumpf('ausmalW').indexOf('erholung')<0);
uhr('2026-10-01T10:00:00+02:00');
ok('§9a (§5 v3.7.2) Erholung gilt auch werktags: Werkzeug-Faktor', (function(){ S.tag.datum=DO; var w=erholungAktiv(kid('sp')); var f=matrixFaktor(kid('sp')); S.tag.datum=SA; return w && f===num(S.settings.matrixFaktor.werkzeug); })());
ok('§9a der Akku bleibt unverändert (keine Erholungs-Logik in akkuBuchen)', rumpf('akkuBuchen').indexOf('erholung')<0);

/* ══ §10 Kein Auto-Hochscrollen ══════════════════════════════════════ */
kopf('§10 Kein Auto-Hochscrollen');
ok('§10 nachOben ist entfallen — kein Aufruf mehr', !/function nachOben\(/.test(src) && !/nachOben\(\);/.test(src));
ok('§10 ein Sheet beginnt nur beim Öffnen oben; ein Neuzeichnen (Tagesabschluss nach jedem Tipp) behält die Lage', /const neu=!sheetOffen\(\);/.test(rumpf('openSheet')) && /if\(neu\)\{ try\{ el\('sheetBody'\)\.scrollTop=0; \}catch\(e\)\{\} \}/.test(rumpf('openSheet')));
ok('§10 erlaubt: „▴ Einklappen" (Kopf an den Rand) und der Wechsel der Hauptansichten über die Leiste (setTab)', /scrollIntoView\(\{behavior:'smooth', block:'start'\}\)/.test(rumpf('statModulEinklappen')) && /m\.scrollTop=0; \}   \/\/ §9 \(v3\.0\.0\): JEDER Wechsel beginnt oben/.test(rumpf('setTab')));
ok('§10 keine weiteren Scroll-Resets (Shop, Mini-Kurve, Malmodus, Suche)', rumpf('zurBelohnung').indexOf('scrollTop')<0 && !/renderBelohnung\(\); if\(S\.ui\.malmodus\)\{ const m=document\.querySelector\('main'\)/.test(src) && !/renderSuche\(\); nachOben/.test(src));

/* ══ §11 Leiste unten ════════════════════════════════════════════════ */
kopf('§11 Leiste unten');
var nav=(src.match(/<nav id="nav">[\s\S]*?<\/nav>/)||[''])[0];
ok('§11 Tab „Suche" → „Shop" (🛍): Shop · Statistik · Einstellungen', /data-tab="belohnung"><span class="ic">🛍<\/span>Shop<\/button>[\s\S]*data-tab="statistik"[\s\S]*data-tab="einst"/.test(nav) && nav.indexOf('data-tab="suche"')<0);
ok('§11 die Suche über den runden 🔍-Knopf unten links (§4 v3.7.6: öffnet die Such-Ebene, Suchfeld bekommt den Fokus)', /el\('suchFab'\)\.addEventListener\('click', \(\)=>\{ haptik\(8\); sucheOeffnen\(\); \}\);/.test(src) && /f\.focus\(\{preventScroll:true\}\)/.test(rumpf('sucheOeffnen')) && /#suchFab\{position:fixed;left:16px/.test(src));
tagDonnerstag(); S.karten=[ neueKarte({ id:'k1', domain:D, titel:'Eins', sollMin:30, faelligkeit:DO }) ]; ketteSetzen(['k1']);
ok('§11 Tipp auf die Statusleiste öffnet immer die Fokusansicht — ohne angezeigte Karte die erste der Kette', fokusImmerZeigen()===true && S.ui.fokusOffen===true && fokusAngezeigtId()==='k1' &&
   /el\('statusbar'\)\.addEventListener\('click', e=>\{[\s\S]{0,260}fokusImmerZeigen\(\);/.test(src) && /\(z1\|\|el\('fkMid'\)\)\.addEventListener\('click', e=>\{ if\(e\.target\.closest\('#btnFigur'\)\) return; fokusImmerZeigen\(\); \}\)/.test(src));
ok('§11 Matrix (→ Tagebuch, §2 v3.7.1) und Punkte-Block (→ Statistik) behalten eigene Ziele', /if\(e\.target\.closest\('#sZMatrix'\)\)\{ oeffneTagebuch\(\); return; \}/.test(src) && /if\(e\.target\.closest\('#btnKurve'\)\) return;/.test(src));
ok('§11 setTab ohne gültigen Tab landet im Shop', (function(){ setTab('gibtsnicht'); return S.ui.tab==='belohnung'; })());

/* ══ §12 Kalender raus ═══════════════════════════════════════════════ */
kopf('§12 Kalender raus');
ok('§12 suKalenderHtml, suBlockKalenderHtml, kalenderBloecke und ihre Aufrufe sind entfernt; anKalenderReihe heißt anTagesReihe (Datenreihe der Belastung)', typeof suKalenderHtml==='undefined' && typeof suBlockKalenderHtml==='undefined' && typeof kalenderBloecke==='undefined' && typeof anKalenderReihe==='undefined' &&
   typeof anTagesReihe==='function' && src.indexOf('data-kalblock')<0 && src.indexOf('data-kalkarte')<0 && src.indexOf('kalZuJetzt')<0);
ok('§12 keine Einordnung nach aktueller Uhrzeit mehr: Block-Vorschlag, Vorauswahl des laufenden Blocks bei Neuanlage, Uhrzeit-Zuordnung der Routinen', typeof blockVorschlag==='undefined' && rumpf('oeffneDetail').indexOf('laufenderBlock')<0 && rumpf('klRoutineBlock').indexOf('jetztStunde')<0 &&
   (oeffneDetail(null), !entwurf.block) && (closeSheet(), true));
ok('§12 das Datum der Karte bleibt; Import-Felder mit Uhrzeit werden weiter angenommen', (imp([{ id:'u1', domain:D, titel:'Mit Uhrzeit', matrixFeld:'ziel', sollMin:30, uhrzeit:'14:30', faelligkeit:DO }]), !!kid('u1') && kid('u1').uhrzeit==='14:30' && kid('u1').faelligkeit===DO));
ok('§12 „Tempo und Blöcke" bleibt (Tagesblöcke, Soll-Form, Tagesrahmen)', typeof tagesBloecke==='function' && typeof tagesRahmen==='function' && typeof sollFormWerktag==='function' && /tagesstruktur:\{ bloecke:/.test(src));
ok('§12 Planung nur per Drag & Drop in Ketten (§2)', typeof ikEinfuegen==='function' && typeof ikDragBinden==='function');

print(''); print(fails ? ('ROT: '+fails+' von '+n+' Abnahmepunkten') : ('alle '+n+' Abnahmepunkte gruen'));
if(fails) throw new Error('Abnahme rot');
