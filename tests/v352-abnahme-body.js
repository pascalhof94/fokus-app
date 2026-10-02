/* Abnahme Hotfix v3.5.2 — die fuenf neuen Tests des Auftrags (§5) und die Regeln dahinter.
   Die Uhr ist verstellbar (uhr/minuten aus tests/v352-abnahme.js). */
var fails=0, n=0;
function ok(t,c){ n++; print((c?'OK   ':'FAIL ')+t); if(!c) fails++; }
function kopf(t){ print(''); print('── '+t+' ──'); }
function kid(id){ return S.karten.filter(function(k){ return k.id===id; })[0]; }
function frisch(){
  _store={}; S.karten=[]; S.unteraufgaben=[]; S.historie=[]; S.intraday=[]; S.routinenGruppen=[];
  S.meta={ wohlstand:0, seeded:true, migration200:true }; S.settings=settingsMerge({});
  S.tag=null; S.fokus=null; S.meta.ketten=null; matrixTmp=null; S.ui.fokusOffen=false; S.ui.fokusZeigt=null; S.ui.fokusNav=null; S.ui.fokusOeff=null; S.ui.klGruppen=null;
  abv3.aktiv=false; abv3.zurueck=false; abv3.schritt=1; aufstehenTmp=null;
}
var DO='2026-10-01';
function tagDonnerstag(){ frisch(); uhr('2026-10-01T09:00:00+02:00'); tagStarten(70, DO); }
function aufgabe(id, dom, soll){ return neueKarte({ id:id, domain:dom, titel:'Karte '+id, sollMin:soll||30, faelligkeit:DO, erstelltTs:'2026-09-30T08:00:00+02:00', flowBaseline:true }); }
function buchung(ts, punkte, dom){ S.intraday.push({ ts:ts, kartenId:'x', domaene:dom||'dfm', punkte:punkte, minuten:0, typ:'abhaken' }); }

kopf('Version');
ok('APP_VERSION 3.5.2 · Datenvertrag bleibt 2.1.0 · Build neu', APP_VERSION==='3.5.2' && UI_VERSION==='v3.5.2' && DATENVERTRAG==='2.1.0' && APP_BUILD==='2026-10-02-1');

/* ══ (a) Pace-Farbe ═══════════════════════════════════════════════════ */
kopf('(a) Pace-Leiste: diskrete Ampel nach Ø ÷ nötig');
ok('(a) Ø ÷ nötig = 0,92 → GELBGRUEN', paceFarbe(460, 500, false)===FARBE.GELBGRUEN && paceFarbe(92, 100, false)==='#a3d977');
ok('(a) Schwellen: ≥ 1,00 GRUEN · ≥ 0,90 GELBGRUEN · ≥ 0,80 GELB · ≥ 0,75 ORANGE · darunter ROT', paceFarbe(100,100)===FARBE.GRUEN && paceFarbe(130,100)===FARBE.GRUEN && paceFarbe(90,100)===FARBE.GELBGRUEN &&
   paceFarbe(89.9,100)===FARBE.GELB && paceFarbe(80,100)===FARBE.GELB && paceFarbe(79.9,100)===FARBE.ORANGE && paceFarbe(75,100)===FARBE.ORANGE && paceFarbe(74.9,100)===FARBE.ROT);
ok('(a) Tagesziel erreicht → UEBER', paceFarbe(300, 0, true)===FARBE.UEBER);
tagDonnerstag();
var pl=paceLeisteHtml({ tempoSchnitt:460, tempoZiel:500, punkteHeute:1000, zielHeute:5000 });
ok('(a) Leiste: Skala 0 … max(Ø, nötig) × 1,1 — Füllung 83,6 % im Verlauf 55 % → 100 %, weiße Marke bei 90,9 %', pl.indexOf('<i style="width:83.6%;background:linear-gradient(90deg,#a3d9778c,#a3d977)"></i>')>=0 && pl.indexOf('<u style="left:90.9%"></u>')>=0);
var pu=paceLeisteHtml({ tempoSchnitt:610, tempoZiel:0, punkteHeute:6000, zielHeute:5000 });
ok('(a) Tagesziel erreicht: Füllung UEBER, keine Marke', pu.indexOf('#FF2D95')>=0 && pu.indexOf('<u ')<0);
ok('(a) Ø über nötig: die Füllung reicht über die Marke hinaus (Ø 610, nötig 470 → Marke bei 70,0 %, Füllung 90,9 %)', (function(){ var h=paceLeisteHtml({ tempoSchnitt:610, tempoZiel:470, punkteHeute:1000, zielHeute:5000 });
  return h.indexOf('width:90.9%')>=0 && h.indexOf('left:70.0%')>=0 && h.indexOf('#3ecf8e')>=0; })());

/* ══ (b) Trendpfeil ═══════════════════════════════════════════════════ */
kopf('(b) Trendpfeil: Ø jetzt ÷ Ø vor 30 Min');
ok('(b) r = 1,02 → ↗ (GELBGRUEN)', paceTrendStufe(1.02).sym==='↗' && paceTrendStufe(1.02).c===FARBE.GELBGRUEN);
ok('(b) Schwellen: ≥ 1,05 ⇈ · ≥ 1,01 ↗ · > 0,99 → · > 0,95 ↘ · ≤ 0,95 ⇊', paceTrendStufe(1.05).sym==='⇈' && paceTrendStufe(1.049).sym==='↗' && paceTrendStufe(1.01).sym==='↗' && paceTrendStufe(1.009).sym==='→' &&
   paceTrendStufe(1).sym==='→' && paceTrendStufe(0.99).sym==='↘' && paceTrendStufe(0.951).sym==='↘' && paceTrendStufe(0.95).sym==='⇊' && paceTrendStufe(null)===null);
ok('(b) Farben: ⇈ GRUEN · → GELB · ↘ ORANGE · ⇊ ROT', paceTrendStufe(1.2).c===FARBE.GRUEN && paceTrendStufe(1).c===FARBE.GELB && paceTrendStufe(0.97).c===FARBE.ORANGE && paceTrendStufe(0.5).c===FARBE.ROT);
tagDonnerstag(); buchung('2026-10-01T09:10:00+02:00', 300);
uhr('2026-10-01T09:20:00+02:00');
ok('(b) unter 30 Min Messzeit heute: kein Pfeil', paceTrend()===null && paceLeisteHtml(diaGroessen()).indexOf('<svg')<0);
uhr('2026-10-01T11:00:00+02:00');
var rFall=paceTrend();
ok('(b) 300 P in der ersten Stunde, seit 30 Min nichts: Ø 150 gegen Ø 200 vor 30 Min → r = 0,75 → ⇊ ('+(rFall!=null?rFall.toFixed(3):'null')+')', Math.abs(rFall-0.75)<0.001 && paceTrendStufe(rFall).sym==='⇊');
buchung('2026-10-01T10:50:00+02:00', 300);
var rSteig=paceTrend();
ok('(b) dazu 300 P in den letzten 30 Min: Ø 300 gegen Ø 200 → r = 1,5 → ⇈ ('+(rSteig!=null?rSteig.toFixed(3):'null')+')', Math.abs(rSteig-1.5)<0.001 && paceTrendStufe(rSteig).sym==='⇈' && /class="ppf"><svg/.test(paceLeisteHtml(diaGroessen())));

/* ══ (c) Wochentags-Mittel ════════════════════════════════════════════ */
kopf('(c) „Ø dieser Wochentag": alle getrackten Tage dieses Wochentags, ohne Urlaub und ohne heute');
tagDonnerstag();
function tagMit(d, p){ S.intraday.push({ ts:d+'T10:00:00+02:00', kartenId:'x', domaene:'dfm', punkte:p, minuten:60, typ:'timer' }); }
tagMit('2026-09-03', 300); tagMit('2026-09-10', 600); tagMit('2026-09-17', 5000); tagMit('2026-09-24', 900);   // vier Donnerstage
tagMit('2026-09-30', 400);                                                                                       // gestern (Mittwoch)
S.historie.push({ tagId:'2026-09-17-1', datum:'2026-09-17', luecke:false, urlaub:true, punkteBilanz:5000 });       // Urlaub
buchung('2026-10-01T09:30:00+02:00', 200);                                                                       // heute
uhr('2026-10-01T12:00:00+02:00');
var wt=wochentagsTage(DO);
ok('(c) passende Tage: drei Donnerstage — der Urlaubs-Donnerstag, der Mittwoch und heute zählen nicht ('+wt.join(' · ')+')', wt.join(',')==='2026-09-03,2026-09-10,2026-09-24');
_typMemo=null; var T=heuteWochentagsKurven(), i10=T.xs.indexOf(10);
var roh=function(tage){ return tage.reduce(function(a,d){ var x=diaTagKurve(d,'dfm'), y=diaTagKurve(d,'privat'); return a+x.wert(10)-x.wert(9)+y.wert(10)-y.wert(9); },0)/tage.length; };
ok('(c) Mittel über ALLE drei Tage (300 · 600 · 900 → 600 P/h um 10 Uhr), nicht über die letzten zwei (750)', T.wtTage===3 && Math.round(roh(wt))===600 && Math.round(roh(wt.slice(-2)))===750 &&
   T.wtAlle[i10]!=null && T.zwei[i10]!=null && Math.abs(T.wtAlle[i10]/T.zwei[i10]-0.8)<0.001);
ok('(c) gestern (Mittwoch) als eigene Linie, über den ganzen Tag — auch rechts von jetzt', T.gestern && T.gestern.length===T.xs.length && T.gestern[T.xs.length-1]!=null && T.wtAlle[T.xs.length-1]!=null && T.xs[T.xs.length-1]>T.jetztX);
var tb=tempoBloeckeHtml(T, 'ttx');
ok('(c) Legende: heute · gestern · Ø Donnerstag (3 Tage) · Plan', tb.indexOf('>heute</span>')>=0 && tb.indexOf('>gestern</span>')>=0 && tb.indexOf('Ø Donnerstag (3 Tage)</span>')>=0 && tb.indexOf('>Plan</span>')>=0 &&
   tb.indexOf('>heute</span>')<tb.indexOf('>gestern</span>') && tb.indexOf('>gestern</span>')<tb.indexOf('Ø Donnerstag') && tb.indexOf('Ø Donnerstag')<tb.indexOf('>Plan</span>'));
ok('(c) Linien im Diagramm: Ø Wochentag GRAU 45 %, gestern GRAU 80 %, je 1,5 px', /stroke-opacity="'\+o\+'" stroke-width="1\.5"/.test(src) && /vgl\(T\.wtAlle, '\.45'\)\+vgl\(T\.gestern, '\.8'\)/.test(src));
S.intraday=S.intraday.filter(function(e){ return e.ts>='2026-10-01'; }); _typMemo=null; _dkMemoKey='';
var T0=heuteWochentagsKurven(), tb0=tempoBloeckeHtml(T0, 'tty');
ok('(c) ohne Vergleichstag entfallen Linie und Legenden-Eintrag', T0.wtAlle===null && T0.wtTage===0 && T0.gestern===null && tb0.indexOf('Ø Donnerstag')<0 && tb0.indexOf('>gestern</span>')<0 && tb0.indexOf('>heute</span>')>=0);

/* ══ (d) Tipp im Umkreis ══════════════════════════════════════════════ */
kopf('(d) Malmodus: der Tipp trifft das Feld im Umkreis');
// 40×40 Bildpunkte: Feld 1 (Farbe 0 = „Dunkelgrün") füllt alles, darin Feld 2 (Farbe 1 = „Hellblau") als 6×6-Quadrat in der Mitte
var W=40, H=40, feld=new Uint8Array(W*H*4), kanten=new Uint8Array(W*H*4), farbeVon={1:0, 2:1, 3:2};
for(var y=0;y<H;y++) for(var x=0;x<W;x++) feld[(y*W+x)*4]=(x>=17 && x<23 && y>=17 && y<23) ? 2 : 1;
var wahl=function(tf, gef, kn){ return feldWahlImKreis(feld, kn||kanten, W, H, 20, 20, 10, gef||[], farbeVon, tf); };
ok('(d) Finger auf dem kleinen hellblauen Feld, Topf = Dunkelgrün → der Kreis enthält Dunkelgrün → Feld 1 wird gewählt', wahl(0)===1);
ok('(d) Topf = Hellblau → das Feld der Topffarbe gilt, obwohl es weniger Pixel im Kreis hat', wahl(1)===2);
ok('(d) Topffarbe kommt im Kreis nicht vor (oder kein Topf) → das Feld mit den meisten Pixeln', wahl(5)===1 && wahl(null)===1);
ok('(d) bereits gefärbte Felder zählen nicht mit: Feld 1 gefärbt → Feld 2, beide gefärbt → kein Treffer', wahl(0,[1])===2 && wahl(null,[1])===2 && wahl(0,[1,2])===0);
var kn=new Uint8Array(W*H*4); for(var i=0;i<W*H;i++) if(feld[i*4]===1) kn[i*4]=255;
ok('(d) Kanten-Pixel zählen nicht mit: liegt Feld 1 im Kreis nur auf Kanten, gilt Feld 2', wahl(0,[],kn)===2);
ok('(d) nur ein Pixel statt Umkreis hätte Feld 2 getroffen; am Bildrand bleibt der Kreis im Bild', feld[(20*W+20)*4]===2 && feldWahlImKreis(feld, kanten, W, H, 0, 0, 10, [], farbeVon, 1)===1 && feldWahlImKreis(feld, kanten, W, H, 300, 300, 10, [], farbeVon, 1)===0);
// zwei Felder der Topffarbe im Kreis: das mit den meisten Pixeln
for(var y2=0;y2<H;y2++) for(var x2=0;x2<W;x2++) feld[(y2*W+x2)*4]=x2<18 ? 1 : (x2<21 ? 2 : 3);
farbeVon={1:0, 2:1, 3:0};
ok('(d) zwei offene Felder der Topffarbe im Kreis → das mit den meisten Pixeln (Feld 3 rechts schlägt Feld 1 links)', feldWahlImKreis(feld, kanten, W, H, 20, 20, 10, [], farbeVon, 0)===3 && feldWahlImKreis(feld, kanten, W, H, 16, 20, 10, [], farbeVon, 0)===1);
ok('(d) Umkreis 12 CSS-px, in Bildpixel umgerechnet (Zoom im Maßstab des Canvas); feldAn ist ersetzt', MAL_TIPP_RADIUS===12 && /feldImUmkreis\(fx, fy, MAL_TIPP_RADIUS\*k, tf\)/.test(src) && /k=cv\.width\/Math\.max\(1, r\.width\)/.test(src) && !/function feldAn\(/.test(src));
ok('(d) Hinweis bei unpassendem Feld: „Feld braucht <Farbe>" bzw. „Topf reicht noch nicht (fehlen n)"', /toast\('Feld braucht '\+D\.namen\[fc\]\)/.test(src) && /toast\('Topf reicht noch nicht \(fehlen '\+fmtP\(Math\.ceil\(p-t\.punkte\)\)\+'\)'\)/.test(src));

/* ══ (e) Klappzustand der Gruppen ═════════════════════════════════════ */
kopf('(e) Kartenlisten: fünf Gruppen, Klappzustand bleibt');
tagDonnerstag();
S.meta.tagesBloecke={ datum:DO, bloecke:[ {id:'m', name:'Morgen', von:7, bis:9, typ:'privat', parent:null, tiefe:0}, {id:'f1', name:'DFM-Fokus 1', von:9, bis:12.5, typ:'dfm', parent:null, tiefe:0},
  {id:'f1a', name:'Angebote', von:9, bis:10.5, typ:'dfm', parent:'f1', tiefe:1}, {id:'ab', name:'Abschluss', von:19.5, bis:21, typ:'privat', parent:null, tiefe:0} ] };
function routine(id, dom, extra){ var k=neueKarte(Object.assign({ id:id, domain:dom, titel:'Routine '+id, rhythmus:{typ:'taeglich'}, faelligkeit:DO }, extra||{})); return k; }
S.karten=[ aufgabe('g1','dfm'), aufgabe('g2','dfm'), aufgabe('g3','privat'), aufgabe('g4','dfm'),
  routine('rAuf','privat',{rolle:'aufstehen'}), routine('rMail','dfm',{block:'f1a', blockTag:DO}), routine('rAbs','privat',{rolle:'tagesabschluss'}), routine('rFrei','privat'), routine('rUhr','privat',{uhrzeit:'20:00'}) ];
kid('g4').status='erledigt'; kid('g4').tagId=aktuelleTagId();
fokusKarteAnsehen('g1'); renderFokus(); fokusKarteAnsehen('g2'); renderFokus(); fokusKarteAnsehen('g1'); renderFokus();
var fv=function(){ return el('fokusView').innerHTML; };
var grp=function(h, id){ var a=h.indexOf('data-klgrp="'+id+'"'), b=h.indexOf('data-klgrp="', a+12); return h.slice(a, b<0?h.length:b); };
var auf=function(id){ return /aria-expanded="true"/.test(grp(fv(), id)); };
ok('(e) fünf Gruppen in fester Reihenfolge: Aktuelle Kette · Verlauf · Routinen · Meistgenutzt · 7 Tage · Erledigt heute', (function(){ var h=fv(), p=['Aktuelle Kette','Verlauf','Routinen','Meistgenutzt · 7 Tage','Erledigt heute'].map(function(t){ return h.indexOf('<b>'+t+'</b><span class="anz">'); });
  return p.every(function(v,i){ return v>=0 && (i===0 || v>p[i-1]); }); })());
ok('(e) Standard: nur „Aktuelle Kette" offen', auf('kette') && !auf('verlauf') && !auf('routinen') && !auf('meist') && !auf('erledigt'));
klGruppeUmschalten('routinen'); klGruppeUmschalten('verlauf'); klGruppeUmschalten('kette'); renderFokus();
ok('(e) nach dem Umschalten und Neu-Render: Routinen und Verlauf offen, Kette zu — der Zustand bleibt', auf('routinen') && auf('verlauf') && !auf('kette') && !auf('meist'));
renderAlles(); renderFokus();
var ui2=JSON.parse(JSON.stringify(S.ui));
ok('(e) … auch nach einem weiteren Render; der Zustand lebt in S.ui.klGruppen (UI-Zustand, übersteht das Speichern)', auf('routinen') && auf('verlauf') && !auf('kette') && ui2.klGruppen.routinen===true && ui2.klGruppen.kette===false && ui2.klGruppen.meist===undefined);
ok('(e) der Klappzustand steht nicht im Export (Datenvertrag unverändert)', JSON.stringify(syncExport('delta')).indexOf('klGruppen')<0);
var rg=klRoutinenGruppen();
print('   Routinen: '+rg.map(function(g){ return g.name+' ['+g.karten.map(function(k){ return k.id; }).join(',')+']'; }).join(' · '));
ok('(e) Routinen nach Tagesblock: Morgen (Aufstehen) · DFM-Fokus 1 (Unterblock „Angebote" zählt zum Oberblock) · Abschluss (Uhrzeit 20:00, Tagesabschluss) · Ohne Block am Ende',
   rg.map(function(g){ return g.name; }).join('|')==='Morgen|DFM-Fokus 1|Abschluss|Ohne Block' && rg[0].karten[0].id==='rAuf' && rg[1].karten[0].id==='rMail' &&
   rg[2].karten.map(function(k){ return k.id; }).sort().join(',')==='rAbs,rUhr' && rg[3].karten[0].id==='rFrei');
ok('(e) Zwischenüberschriften je Block in der Gruppe Routinen, Anzahl rechts im Kopf', (function(){ var g=grp(fv(), 'routinen'); return g.indexOf('<span class="anz">5</span>')>=0 && ['Morgen','DFM-Fokus 1','Abschluss','Ohne Block'].every(function(t){ return g.indexOf('<div class="kl-zwh">'+t+'</div>')>=0; }); })());
ok('(e) Verlauf: heute geöffnete Karten, neueste oben, Mehrfach-Öffnungen einmal mit „2×"', (function(){ var v=klVerlauf(), g=grp(fv(), 'verlauf'); return v.map(function(q){ return q.k.id+':'+q.n; }).join(',')==='g1:2,g2:1' && g.indexOf(' · 2×</span>')>=0 && g.indexOf('<span class="anz">2</span>')>=0; })());
klGruppeUmschalten('erledigt'); klGruppeUmschalten('meist'); renderFokus();
ok('(e) Erledigt heute: abgehakte Karte gedimmt (Klasse erl), ✓ gefüllt', (function(){ var g=grp(fv(), 'erledigt'); return g.indexOf('<span class="anz">1</span>')>=0 && /class="kl-z fertig erl"[^>]*data-klkarte="g4"/.test(g) && /class="kl-check ok/.test(g); })());
kid('g4').status='offen'; kid('g4').tagId=null; renderFokus();
ok('(e) leere Gruppe: nur die Kopfzeile mit „0", obwohl sie aufgeklappt ist', (function(){ var g=grp(fv(), 'erledigt'); return auf('erledigt') && g.indexOf('<span class="anz">0</span>')>=0 && g.indexOf('kl-grinh')<0; })());
ok('(e) eine Karte darf in mehreren Gruppen stehen (g2 in Kette, Verlauf und Meistgenutzt)', (function(){ klGruppeUmschalten('kette'); renderFokus(); var h=fv(); return (h.match(/data-klkarte="g2"/g)||[]).length>=3; })());

/* ══ Statusleiste: Live-Segment ═══════════════════════════════════════ */
kopf('§1 Statusleiste: Punkteleiste zweiteilig, Zeile 3');
tagDonnerstag();
S.karten=[ aufgabe('s1','dfm',60), aufgabe('s2','privat',30) ];
S.intraday=[]; buchung('2026-10-01T09:05:00+02:00', 0);
fokusStarten('s1', null); minuten(30);
var g1=diaGroessen(), l1=statusLivePunkte(g1);
print('   DFM gesamt '+Math.round(g1.dfm)+' · davon live '+Math.round(l1.dfm)+' · Privat live '+l1.privat);
ok('§1 laufende DFM-Karte: Live-Punkte > 0 nur in der Familie DFM, die Familienzahl enthält sie', l1.dfm>0 && l1.privat===0 && Math.abs(g1.dfm-l1.dfm-ohneLaufendeUhr(function(){ return belIstDfm(); }))<0.001);
renderStatusbar();
ok('§1 Punkteleiste: gebuchter Teil + Live-Segment direkt anschließend, Zahl = Summe', el('sBarLiveD').style.display==='block' && el('sBarLiveD').style.left===el('sBarIstD').style.width && parseFloat(el('sBarLiveD').style.width)>0 &&
   el('sBarLiveP').style.display==='none' && String(el('sBarZD').textContent)===fmtP(Math.round(g1.dfm)));
fokusBeenden(); renderStatusbar();
ok('§1 nach dem Pausieren ist Live gebucht: kein Live-Segment, die gebuchte Füllung trägt die Summe', el('sBarLiveD').style.display==='none' && statusLivePunkte().dfm===0 && parseFloat(el('sBarIstD').style.width)>0);
renderFokusleiste();
print('   Zeile 3: „'+el('sTempo').textContent+'" '+el('sTempo').style.color+' · gesamt „'+el('fkRight').textContent+'"');
ok('§1 Zeile 3: P/h-Zahl (= Ø heute) im Diagramm in der Pace-Farbe, Gesamtpunkte daneben', /^\d[\d.]* P\/h$/.test(String(el('sTempo').textContent)) && el('sTempo').style.color===paceFarbe(diaGroessen().tempoSchnitt, diaGroessen().tempoZiel, false) &&
   String(el('fkRight').textContent)===fmtP(Math.round(tagesPunkteLive())));
ok('§1 Live-Segment in der hellen Familienfarbe mit feinen Streifen (CSS)', /\.live\.dfm\{background-color:#93c5fd\}/.test(src) && /\.live\.privat\{background-color:#d8b4fe\}/.test(src) && /repeating-linear-gradient\(90deg,rgba\(255,255,255,\.12\) 0 2px,transparent 2px 5px\)/.test(src));

print('');
if(fails){ print(fails+' von '+n+' FEHLGESCHLAGEN'); throw new Error('Abnahme rot'); }
print('alle '+n+' Abnahmepunkte gruen');
