/* Abnahme v3.5.3 — die sechs neuen Tests des Auftrags (§6) und die Regeln dahinter.
   Die Uhr ist verstellbar (uhr/minuten aus tests/v353-abnahme.js). */
var fails=0, n=0;
function ok(t,c){ n++; print((c?'OK   ':'FAIL ')+t); if(!c) fails++; }
function kopf(t){ print(''); print('── '+t+' ──'); }
function kid(id){ return S.karten.filter(function(k){ return k.id===id; })[0]; }
function frisch(){
  _store={}; S.karten=[]; S.unteraufgaben=[]; S.historie=[]; S.intraday=[]; S.routinenGruppen=[]; S.tagesketten=[];
  S.meta={ wohlstand:0, seeded:true, migration200:true }; S.settings=settingsMerge({});
  S.tag=null; S.fokus=null; S.meta.ketten=null; matrixTmp=null; S.ui.fokusOffen=false; S.ui.fokusZeigt=null; S.ui.fokusNav=null; S.ui.fokusOeff=null; S.ui.klGruppen=null; S.ui.tkWahl=null;
  S.ui.statDomain='alle'; S.ui.statDatum=null;
  abv3.aktiv=false; abv3.zurueck=false; abv3.schritt=1; aufstehenTmp=null;
}
var DO='2026-10-01';
function tagDonnerstag(){ frisch(); uhr('2026-10-01T09:00:00+02:00'); tagStarten(70, DO); }
function aufgabe(id, dom, soll){ return neueKarte({ id:id, domain:dom, titel:'Karte '+id, sollMin:soll||30, faelligkeit:DO, erstelltTs:'2026-09-30T08:00:00+02:00', flowBaseline:true }); }
function buchung(ts, punkte, dom){ S.intraday.push({ ts:ts, kartenId:'x', domaene:dom||'dfm', punkte:punkte, minuten:0, typ:'abhaken' }); }
function nah(a, b, eps){ return Math.abs(a-b)<=(eps==null ? 0.05 : eps); }
function lauf(id, min){ fokusStarten(id, null); minuten(min); fokusBeenden(); }   // echte Punkte: die Karte laeuft min Minuten
function rumpf(name){ var a=src.indexOf('function '+name+'('), b=src.indexOf('\nfunction ', a+10); return a<0 ? '' : src.slice(a, b<0 ? src.length : b); }

kopf('Version');
ok('APP_VERSION 3.5.3 · Datenvertrag bleibt 2.1.0 · Build neu', APP_VERSION==='3.5.3' && UI_VERSION==='v3.5.3' && DATENVERTRAG==='2.1.0' && APP_BUILD==='2026-10-02-2');

/* ══ (a) Pfeil: laufende Karte ÷ Ø heute ══════════════════════════════ */
kopf('(a) Pfeil der Statusleiste: live P/h der laufenden Karte ÷ Ø heute');
var ta=paceLeisteTeile(500, 600, 550);
ok('(a) Karte 550 ÷ Ø 500 = 1,10 → ↗ (GELBGRUEN)', nah(ta.r, 1.1, 1e-9) && tempopfeilStufe(ta.r).sym==='↗' && tempopfeilStufe(ta.r).c===FARBE.GELBGRUEN);
ok('(a) Schwellen: ≥ 1,25 ⇈ · ≥ 1,05 ↗ · > 0,95 → · > 0,75 ↘ · darunter ⇊', tempopfeilStufe(1.25).sym==='⇈' && tempopfeilStufe(1.249).sym==='↗' && tempopfeilStufe(1.05).sym==='↗' && tempopfeilStufe(1.049).sym==='→' &&
   tempopfeilStufe(0.951).sym==='→' && tempopfeilStufe(0.95).sym==='↘' && tempopfeilStufe(0.751).sym==='↘' && tempopfeilStufe(0.75).sym==='⇊');
var pa=paceLeisteHtml({ tempoSchnitt:500, tempoZiel:600 }, { wert:550, karte:{ domain:'dfm' } });
ok('(a) mit laufender Karte: Raute in der Familienfarbe an der Stelle der Karte (550 von Skala 690 → 79,7 %), Pfeil rechts', pa.indexOf('<b class="raute" style="left:79.7%;background:'+famFarbe({domain:'dfm'})+'"></b>')>=0 && /class="ppf"><svg/.test(pa));
var pp=paceLeisteHtml({ tempoSchnitt:500, tempoZiel:600 }, { wert:550, karte:{ domain:'privat' } });
ok('(a) Privat-Karte: Raute in LILA', pp.indexOf('background:'+FARBE.LILA+'"></b>')>=0);
var po=paceLeisteHtml({ tempoSchnitt:500, tempoZiel:600 }, null);
ok('(a) ohne laufende Karte: keine Raute, kein Pfeil', po.indexOf('raute')<0 && /class="ppf"><\/span>/.test(po) && paceLeisteTeile(500, 600, null).r===null);
ok('(a) der Trendpfeil aus 3.5.2 (Ø jetzt ÷ Ø vor 30 Min) ist entfallen', typeof paceTrend==='undefined' && typeof paceTrendStufe==='undefined');
tagDonnerstag();
S.karten=[ aufgabe('a1','dfm',60) ]; buchung('2026-10-01T09:05:00+02:00', 100);
fokusStarten('a1', null); minuten(30);
var pk=paceKarte(), tw=tempoWerte(kid('a1')).karte;
ok('(a) die Raute nimmt die live P/h der laufenden Karte (wie die Tempo-Leiste der Fokusansicht: '+Math.round(pk.wert)+' P/h)', pk && pk.karte.id==='a1' && tw.live!=null && pk.wert===tw.live);
renderStatusbar();
ok('(a) die Statusleiste zeichnet Zonen, Strich, Raute und Pfeil', (function(){ var h=el('sZTempo').innerHTML; return (h.match(/<i style="left:/g)||[]).length===5 && /<u style="left:/.test(h) && /class="raute"/.test(h) && /class="ppf"><svg/.test(h); })());
fokusBeenden();
ok('(a) pausiert: keine laufende Karte → keine Raute', paceKarte()===null);

/* ══ (b) Zonengrenzen ═════════════════════════════════════════════════ */
kopf('(b) Pace-Leiste: fünf Ampelzonen relativ zu „nötig"');
var tb5=paceLeisteTeile(400, 500, null), gr=tb5.zonen.map(function(z){ return Math.round(z.von/100*tb5.max); });
print('   nötig 500 · Skala bis '+tb5.max.toFixed(0)+' · Zonen ab '+gr.join(' · ')+' P/h');
ok('(b) nötig = 500: ROT unter 375 · ORANGE 375–400 · GELB 400–450 · GELBGRUEN 450–500 · GRUEN ab 500', gr.join(',')==='0,375,400,450,500' &&
   tb5.zonen.map(function(z){ return z.farbe; }).join(',')===[FARBE.ROT, FARBE.ORANGE, FARBE.GELB, FARBE.GELBGRUEN, FARBE.GRUEN].join(','));
ok('(b) die Zonen schließen lückenlos an und füllen die Leiste (letzte Zone bis 100 %)', tb5.zonen.every(function(z,i){ return i===0 ? z.von===0 : nah(z.von, tb5.zonen[i-1].bis, 1e-9); }) && tb5.zonen[4].bis===100);
ok('(b) Skala: max(Ø, Karte, nötig) × 1,15 — nötig 500 → 575; Karte 800 → 920', nah(tb5.max, 575, 1e-6) && nah(paceLeisteTeile(400, 500, 800).max, 920, 1e-6) && nah(paceLeisteTeile(700, 500, null).max, 805, 1e-6));
ok('(b) weißer Strich = Ø heute (400 von 575 → 69,6 %)', nah(tb5.schnitt, 400/575*100, 1e-9) && paceLeisteHtml({tempoSchnitt:400, tempoZiel:500}, null).indexOf('<u style="left:69.6%"></u>')>=0);
ok('(b) die Zahl im Diagramm trägt die Farbe ihrer Zone: 374 ROT · 375 ORANGE · 400 GELB · 450 GELBGRUEN · 500 GRUEN', paceFarbe(374,500)===FARBE.ROT && paceFarbe(375,500)===FARBE.ORANGE && paceFarbe(400,500)===FARBE.GELB &&
   paceFarbe(450,500)===FARBE.GELBGRUEN && paceFarbe(500,500)===FARBE.GRUEN);
ok('(b) Leiste 12 px, Zonen ohne Verlauf, Farben aus den Konstanten', /\.pbahn\.zonen/.test(src) && paceLeisteHtml({tempoSchnitt:400, tempoZiel:500}, null).indexOf('linear-gradient')<0);

/* ══ (c) Tagesprognose-Balken ═════════════════════════════════════════ */
kopf('(c) Tagesprognose-Balken');
var t1=tagesprognoseTeile({ dfm:3000, privat:1000, prognose:7900, ziel:8500, karteRest:300, karteFam:'dfm' });
ok('(c) Prognose 7.900 unter Ziel 8.500: max = Ziel (8.500), Differenz −600', t1.max===8500 && t1.diff===-600);
var t2=tagesprognoseTeile({ dfm:3000, privat:1000, prognose:8900, ziel:8500, karteRest:300, karteFam:'dfm' });
ok('(c) Prognose 8.900 über Ziel 8.500: max = Prognose (8.900), Differenz +400', t2.max===8900 && t2.diff===400);
ok('(c) Teile von links: DFM 3.000 · Privat 1.000 · laufende Karte 300 · Rest DFM 2.700 · Rest Privat 900 — zusammen die Prognose', t1.dfm===3000 && t1.privat===1000 && t1.karte===300 && nah(t1.restDfm, 2700, 1e-6) && nah(t1.restPrivat, 900, 1e-6) &&
   nah(t1.dfm+t1.privat+t1.karte+t1.restDfm+t1.restPrivat, 7900, 1e-6));
ok('(c) der Rest folgt dem bisherigen Familien-Anteil (3 : 1); ohne Punkte dem Anteil der Tagesziele', nah(t1.restDfm/t1.restPrivat, 3, 1e-6) && (function(){ var t=tagesprognoseTeile({ dfm:0, privat:0, prognose:1000, ziel:8500, zielDfm:6800 }); return nah(t.restDfm, 800, 1e-6) && nah(t.restPrivat, 200, 1e-6); })());
ok('(c) die Karte nimmt höchstens den Rest bis zur Prognose; die Prognose liegt nie unter dem Gesammelten', tagesprognoseTeile({ dfm:1000, privat:0, prognose:1200, ziel:5000, karteRest:900 }).karte===200 && tagesprognoseTeile({ dfm:1000, privat:500, prognose:900, ziel:5000 }).prognose===1500);
var h1=tagesprognoseBalkenHtml(t1), h2=tagesprognoseBalkenHtml(t2);
ok('(c) Differenz rechts im Balken: „−600" ROT, „+400" GRUEN', h1.indexOf('<span class="diff" style="color:'+FARBE.ROT+'">−600</span>')>=0 && h2.indexOf('<span class="diff" style="color:'+FARBE.GRUEN+'">+400</span>')>=0);
ok('(c) Segmente: DFM-Verlauf, Privat-Verlauf, Karte WEISS 85 %, zwei gestrichelte Umrisse (BLAU, LILA), Ziel-Linie, Skala 0 … max', h1.indexOf('class="d" style="left:0.00%;width:35.29%;background:'+verlauf(FARBE.BLAU))>=0 &&
   h1.indexOf('class="p" style="left:35.29%;width:11.76%;background:'+verlauf(FARBE.LILA))>=0 && h1.indexOf('class="kw"')>=0 && h1.indexOf(farbeAlpha(FARBE.WEISS, .85))>=0 &&
   h1.indexOf('border-color:'+FARBE.BLAU+'"')>=0 && h1.indexOf('border-color:'+FARBE.LILA+'"')>=0 && h1.indexOf('<u style="left:100.00%"></u>')>=0 && h2.indexOf('<u style="left:95.51%"></u>')>=0 &&
   h1.indexOf('<div class="skala"><span>0</span><span>8.500</span></div>')>=0 && h2.indexOf('<span>8.900</span>')>=0);
ok('(c) ohne laufende Karte kein weißes Segment', tagesprognoseBalkenHtml(tagesprognoseTeile({ dfm:3000, privat:1000, prognose:7900, ziel:8500 })).indexOf('class="kw"')<0);
tagDonnerstag();
S.karten=[ aufgabe('c1','dfm',60), aufgabe('c2','privat',30), aufgabe('c3','dfm',45) ]; lauf('c3', 30); lauf('c2', 15);
uhr('2026-10-01T11:00:00+02:00');
var tH=tagesprognoseHeute(), gH=diaGroessen();
print('   heute: DFM '+Math.round(tH.dfm)+' · Privat '+Math.round(tH.privat)+' · Prognose '+Math.round(tH.prognose)+' · Ziel '+tH.ziel);
ok('(c) heute: Prognose = Tagesprognose der Statusleiste, Ziel = Tagesziel, gesammelt je Familie', tH.dfm>0 && tH.privat>0 && tH.prognose>tH.dfm+tH.privat && nah(tH.prognose, gH.prognoseHeute, 1e-6) && tH.ziel===gH.zielHeute && nah(tH.dfm, gH.dfm, 1e-6) && nah(tH.privat, gH.privat, 1e-6) && tH.karte===0 &&
   nah(tH.restDfm/tH.restPrivat, tH.dfm/tH.privat, 1e-6));
fokusStarten('c1', null); minuten(10);
var tL=tagesprognoseHeute();
ok('(c) laufende Karte: weißes Segment = ihre Punkte bis Soll-Ende, höchstens der Rest ('+Math.round(tL.karte)+' P, Familie DFM)', tL.karte>0 && tL.karteFam==='dfm' && tL.karte<=tL.prognose-tL.dfm-tL.privat+1e-6);
var dtL=derTagHtml(kid('c1'));
ok('(c) Kopfzeile: „<Prognose> von Ziel <Ziel> · DFM <Ist> / <Plan>"', dtL.indexOf('<b>Tagesprognose</b><span>'+fmtP(tL.prognose)+' von Ziel '+fmtP(tL.ziel)+' · DFM '+hMin(dfmZeitHeute().ist)+' / '+hMin(dfmZeitHeute().plan)+'</span>')>=0);
fokusBeenden();

/* ══ (d) Tagesform-Markierungen ═══════════════════════════════════════ */
kopf('(d) Tagesform: Treppe mit 20 Säulen und vier Markierungen');
var m1=tagesformMarken({ akt:6, prog:8, noetig:11, schnitt:9 });
ok('(d) vier Stufen auf vier Säulen: je eine Umrandung ohne Einzug', [6,8,11,9].every(function(k){ return m1[k].length===1 && m1[k][0].einzug===0; }) && m1[6][0].art==='aktuell' && m1[8][0].art==='prognose' && m1[11][0].art==='noetig' && m1[9][0].art==='schnitt');
var m2=tagesformMarken({ akt:6, prog:6, noetig:8, schnitt:6 });
ok('(d) aktuell, Prognose und Ø auf Säule 6: Reihenfolge aktuell · Prognose · Ø, je 3 px weiter eingerückt', m2[6].map(function(r){ return r.art+':'+r.einzug; }).join(',')==='aktuell:0,prognose:3,schnitt:6' && m2[8].length===1 && m2[8][0].einzug===0);
var m3=tagesformMarken({ akt:7, prog:7, noetig:7, schnitt:7 });
ok('(d) alle vier auf einer Säule: aktuell · Prognose · nötig · Ø mit Einzug 0 · 3 · 6 · 9', m3[7].map(function(r){ return r.art+':'+r.einzug; }).join(',')==='aktuell:0,prognose:3,noetig:6,schnitt:9');
ok('(d) Farben und Strichart: aktuell GRUEN · Prognose WEISS · nötig WEISS gestrichelt · Ø ORANGE gestrichelt', m3[7][0].farbe===FARBE.GRUEN && !m3[7][0].dash && m3[7][1].farbe==='#fff' && !m3[7][1].dash && m3[7][2].farbe==='#fff' && m3[7][2].dash && m3[7][3].farbe===FARBE.ORANGE && m3[7][3].dash);
ok('(d) ohne Ø (keine aktiven Tage): die Markierung entfällt', (function(){ var m=tagesformMarken({ akt:3, prog:4, noetig:5, schnitt:null }); return Object.keys(m).length===3; })());
var sv=tagesformSvg({ akt:6, prog:6, noetig:8, schnitt:6 });
ok('(d) Treppe: 20 Säulen, 1 … 6 gefüllt (GRUEN-Verlauf), Rest LEER, Umrandungen 2 px, Zahl der aktuellen Säule weiß', (sv.match(/<rect x="[\d.]+" y="[\d.]+" width="[\d.]+" height="[\d.]+" rx="2" fill="(url|#)/g)||[]).length===20 &&
   (sv.match(/fill="url\(#/g)||[]).length===6 && (sv.match(new RegExp('fill="'+FARBE.LEER+'"','g'))||[]).length===14 && (sv.match(/class="tf-m /g)||[]).length===4 && (sv.match(/stroke-width="2"/g)||[]).length===4 &&
   sv.indexOf('fill="#fff" font-size="9" text-anchor="middle">6</text>')>=0 && sv.indexOf('fill="'+FARBE.GRAU+'" font-size="9" text-anchor="middle">7</text>')>=0);
ok('(d) Säule k steigt linear von 20 % auf 100 % der Höhe (56 px): Säule 1 = 11,2 px, Säule 20 = 56 px', /<rect x="0\.0" y="44\.8" width="[\d.]+" height="11\.2"/.test(sv) && /y="0\.0" width="[\d.]+" height="56\.0" rx="2" fill="#/.test(sv));
ok('(d) eingerückte Umrandung: 3 px je weitere Markierung (x und y um 3, Breite und Höhe um 6 kleiner)', (function(){ var r=sv.match(/<rect class="tf-m [a-z]+" x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g).map(function(q){ return q.match(/([\d.]+)/g).map(Number); });
  return nah(r[1][0]-r[0][0], 3) && nah(r[1][1]-r[0][1], 3) && nah(r[0][2]-r[1][2], 6) && nah(r[0][3]-r[1][3], 6) && nah(r[2][0]-r[1][0], 3); })());
tagDonnerstag();
[['2026-09-28', 1500], ['2026-09-29', 3000], ['2026-09-30', 4500]].forEach(function(q){ S.historie.push({ tagId:q[0]+'-1', datum:q[0], luecke:false, punkteBilanz:q[1], minutenGemessen:300 });
  S.intraday.push({ ts:q[0]+'T10:00:00+02:00', kartenId:'x', domaene:'dfm', punkte:q[1], minuten:300, typ:'timer' }); });
S.historie.push({ tagId:'2026-09-25-1', datum:'2026-09-25', luecke:false, urlaub:true, punkteBilanz:9000 }); S.intraday.push({ ts:'2026-09-25T10:00:00+02:00', kartenId:'x', domaene:'dfm', punkte:9000, minuten:300, typ:'timer' });   // Urlaub zaehlt nicht
var sch=outfitSchnitt28(), einzel=['2026-09-28','2026-09-29','2026-09-30'].map(function(d){ return outfitVon(num(tagSnapshot(d).punkteBilanz)/Math.max(1, zielTagGesamt(d))); });
print('   Tages-Outfits '+einzel.join(' · ')+' → Ø '+sch);
ok('(d) Ø erreicht = gerundeter Mittelwert der Tages-Outfits der aktiven Tage (ohne heute, ohne Urlaub)', sch===Math.round((einzel[0]+einzel[1]+einzel[2])/3) && einzel[0]<einzel[1] && einzel[1]<einzel[2]);
var st=tagesformStufen();
ok('(d) Stufen heute: aktuell = Outfit heute, Prognose nie darunter, nötig = Outfit beim Tagesziel', st.akt===outfitHeute() && st.prog>=st.akt && st.noetig===outfitVon(outfitFMit(zielUndIstHeute().ziel)) && st.noetig>=1 && st.noetig<=20);
var dtF=derTagHtml(null);
ok('(d) Kopfzeile: Wert in Ampelfarbe, „x % über/unter normal · Outfit n", Legende aktuell · Prognose · nötig fürs Ziel · Ø erreicht', /<b>Tagesform <span class="tf-w" style="color:#[0-9a-fA-F]{6}">\d,\d\d/.test(dtF) && /(\d+ % (über|unter) normal|wie normal) · Outfit \d+<\/span>/.test(dtF) &&
   dtF.indexOf('aktuell</span>')<dtF.indexOf('Prognose</span>') && dtF.indexOf('Prognose</span>')<dtF.indexOf('nötig fürs Ziel</span>') && dtF.indexOf('nötig fürs Ziel</span>')<dtF.indexOf('Ø erreicht</span>') && dtF.indexOf('aktuell</span>')>0);

/* ══ (e) Ausmal-Übernahme ═════════════════════════════════════════════ */
kopf('(e) Feldkarten: Übernahme des Ausmal-Stands');
// alt: Felder 10 und 11 gefärbt, 12 offen. neu: 1 (ganz alt gefärbt) · 2 (49 % alt gefärbt) · 3 (genau 50 %) · 4 (nur alt offen)
var U={ kulisse:1, bildPx:1000, neuFlaeche:{1:100, 2:100, 3:200, 4:50}, altFlaeche:{10:99, 11:150, 12:201}, ueberdeckung:{ 1:{10:50, 11:50}, 2:{10:49, 12:51}, 3:{11:100, 12:100}, 4:{12:50} } };
var E=feldkartenUebernahme(U, [10, 11], 10000);
ok('(e) 50-%-Regel: neu 1 (100 %) und neu 3 (genau 50 %) gefärbt · neu 2 (49 %) und neu 4 (0 %) offen', E.gefaerbt.join(',')==='1,3');
ok('(e) Tank-Gutschrift: 49 bezahlte Bildpunkte in einem neu offenen Feld → 49 ÷ 1.000 × Kulissenwert 10.000 = 490 P', E.verlorenPx===49 && E.tankPlus===490);
ok('(e) umgekehrt kein Abzug: nur Feld 11 alt gefärbt → neu 1 und neu 3 (je genau 50 %) gefärbt; ihre alt offenen Hälften kosten nichts, der Tank sinkt nie', feldkartenUebernahme(U, [11], 10000).gefaerbt.join(',')==='1,3' && feldkartenUebernahme(U, [11], 10000).tankPlus===0 && E.tankPlus>=0);
ok('(e) nur Feld 10 alt gefärbt → neu 1 (50 %) gefärbt, neu 2 (49 %) offen: Gutschrift 490 P', feldkartenUebernahme(U, [10], 10000).gefaerbt.join(',')==='1' && feldkartenUebernahme(U, [10], 10000).tankPlus===490);
ok('(e) nichts gefärbt → nichts übernommen, keine Gutschrift; alles gefärbt → alles gefärbt, keine Gutschrift', feldkartenUebernahme(U, [], 10000).gefaerbt.length===0 && feldkartenUebernahme(U, [], 10000).tankPlus===0 &&
   feldkartenUebernahme(U, [10,11,12], 10000).gefaerbt.join(',')==='1,2,3,4' && feldkartenUebernahme(U, [10,11,12], 10000).tankPlus===0);
frisch();
S.meta.ausmalen={ kulisse:1, gefaerbt:[10, 11], toepfe:[{farbe:2, punkte:300},{farbe:null, punkte:0},{farbe:5, punkte:40},{farbe:null, punkte:0},{farbe:null, punkte:0}], aktiverTopf:2, stationFarbe:3, tank:200, wohlstandSeitReset:0, freigeschaltetBis:1, fertig:[], verteilt:0 };
var tpVor=JSON.stringify(S.meta.ausmalen.toepfe);
ok('(e) die Übernahme ruht (FELDKARTEN_353 = false): der Start ändert nichts und setzt kein Merkmal', FELDKARTEN_353===false && (feldkarten353Start(), S.meta.feldkarten353===undefined && S.meta.ausmalen.gefaerbt.join(',')==='10,11'));
var E2=feldkarten353Anwenden(U), A2=ausmalState(), erw=Math.round(49/1000*kulissenWert(1));
ok('(e) angewendet: gefaerbt trägt die neuen IDs (1, 3), Tank 200 + '+erw+' = '+(200+erw), A2.gefaerbt.join(',')==='1,3' && A2.tank===200+erw && E2.tankPlus===erw);
ok('(e) Töpfe, aktiver Topf, Stationsfarbe und Kulisse bleiben', JSON.stringify(A2.toepfe)===tpVor && A2.aktiverTopf===2 && A2.stationFarbe===3 && A2.kulisse===1);
ok('(e) Sicherung feldkarten353_bak trägt den alten Stand; das Merkmal hält das Ergebnis', (function(){ var b=DB.get('feldkarten353_bak', null), m=S.meta.feldkarten353;
  return b && b.ausmalen.gefaerbt.join(',')==='10,11' && b.ausmalen.tank===200 && m && m.kulisse===1 && m.vorher===2 && m.uebernommen===2 && m.tankPlus===erw; })());
ok('(e) Datenvertrag unverändert: der Export trägt ausmalen.gefaerbt mit den neuen IDs', ausmalExport().gefaerbt.join(',')==='1,3' && DATENVERTRAG==='2.1.0');

/* ══ (f) dieselbe Render-Funktion ═════════════════════════════════════ */
kopf('(f) Fokus und Statistik nutzen dieselbe Render-Funktion');
tagDonnerstag();
S.karten=[ aufgabe('f1','dfm',60), aufgabe('f2','privat',30), aufgabe('f3','dfm',45) ]; lauf('f3', 30); lauf('f2', 15);
S.intraday.push({ ts:'2026-09-24T10:00:00+02:00', kartenId:'x', domaene:'dfm', punkte:600, minuten:60, typ:'timer' }, { ts:'2026-09-24T11:00:00+02:00', kartenId:'x', domaene:'privat', punkte:200, minuten:30, typ:'timer' });
uhr('2026-10-01T11:00:00+02:00'); _typMemo=null;
var einmal=function(f){ return (src.match(new RegExp('function '+f+'\\(','g'))||[]).length===1; };
ok('(f) je Grafik genau eine Render-Funktion im Quelltext', ['derTagHtml','tagesprognoseTeile','tagesprognoseBalkenHtml','tagesformMarken','tagesformSvg','belTagesDiagramm','tvZeichnen','tempoVergleichSvg','tempoVergleichLegende','tempoBlockHtml','paceLeisteHtml'].every(einmal));
var fok=fokusBloecke350(kid('f1')), stat=stmTag(analyseFenster(), 'alle');
var teil=function(h, a, b){ var i=h.indexOf(a), j=h.indexOf(b, i); return i<0 || j<0 ? null : h.slice(i, j); };
ok('(f) Tagesprognose: Fokus und Statistik tragen denselben Balken (derTagHtml → tagesprognoseBalkenHtml)', teil(fok, '<div class="dk dk-prog">', '<div class="dk dk-form">')!==null &&
   teil(fok, '<div class="dk dk-prog">', '<div class="dk dk-form">')===teil(stat, '<div class="dk dk-prog">', '<div class="dk dk-form">') && teil(fok, '<div class="pbar">', '<div class="skala">')===tagesprognoseBalkenHtml(tagesprognoseHeute()).split('<div class="skala">')[0]);
var ohneId=function(h){ return h==null ? null : h.replace(/tf\d+/g, 'tf'); };
ok('(f) Tagesform: dieselbe Treppe (tagesformSvg) in beiden', ohneId(teil(fok, '<svg class="tf-svg"', '</svg>'))!==null && ohneId(teil(fok, '<svg class="tf-svg"', '</svg>'))===ohneId(teil(stat, '<svg class="tf-svg"', '</svg>')));
ok('(f) Tagesverlauf: beide rufen belTagesDiagramm → tvZeichnen; Fokus ohne Bedienung (immer heute, beide Familien), Statistik mit Familien-Filter und Tagesauswahl', fok.indexOf('data-dialive="tv" data-diaopt=\'{"fokus":true}\'')>=0 &&
   stat.indexOf('data-dialive="tv" data-diaopt=\'{"fokus":false}\'')>=0 && teil(fok, 'data-dialive="tv"', 'class="legende"').indexOf('statfilter')<0 && teil(stat, 'data-dialive="tv"', 'class="legende"').indexOf('data-statdom="dfm"')>=0 &&
   _diaReg.tvf.zeichnen===tvZeichnen && _diaReg.tv.zeichnen===tvZeichnen);
var linien=function(D){ return D.serien.map(function(se){ return se.st.c+'|'+se.st.w+'|'+se.st.o+'|'+(se.st.dash||'')+'|'+(se.haupt?'ist':''); }).sort().join(' '); };
ok('(f) … mit denselben Linien', linien(_diaReg.tvf)===linien(_diaReg.tv) && _diaReg.tvf.serien.length>=4);
ok('(f) Tagesverlauf-Linien: Ist DFM BLAU und Privat LILA 2,5 px · Ø Wochentag je Familie gestrichelt 4 3 in Familienfarbe 50 %, 1,5 px · Prognose WEISS gestrichelt 1,5 px · keine graue Linie', (function(){ var s=_diaReg.tvf.serien, hat=function(c,w,o,d,ist){ return s.some(function(se){ return se.st.c===c && se.st.w===w && se.st.o===o && (se.st.dash||'')===d && !!se.haupt===ist; }); };
  return hat(FARBE.BLAU,2.5,1,'',true) && hat(FARBE.LILA,2.5,1,'',true) && hat(FARBE.BLAU,1.5,.5,'4 3',false) && hat(FARBE.LILA,1.5,.5,'4 3',false) && hat(FARBE.WEISS,1.5,1,'4 3',false) && !s.some(function(se){ return se.st.c===FARBE.GRAU; }); })());
ok('(f) Tagesziele je Familie (weiß gepunktet, „Ziel DFM" / „Ziel Privat"); die Prognose-Linien enden bei den Familien-Anteilen der Tagesprognose', (function(){ var D=_diaReg.tvf, t=tagesprognoseHeute(), pr=D.serien.filter(function(se){ return se.st===DIA_LINIE.prognose; });
  return D.ziele.map(function(z){ return z.label; }).join(',')==='Ziel DFM,Ziel Privat' && D.ziele[0].y===belZielDfm() && pr.length===2 && nah(pr[0].pts[1].p, t.endeDfm, 0.5) && nah(pr[1].pts[1].p, t.endePrivat, 0.5) && nah(t.endeDfm+t.endePrivat, t.prognose, 0.5); })());
ok('(f) Legende des Tagesverlaufs: DFM · Privat · Ø Donnerstag je Familie · Prognose', (function(){ var l=fok.slice(fok.indexOf('data-dialive="tv"')); var p=['>DFM</span>','>Privat</span>','Ø Donnerstag je Familie</span>','>Prognose</span>'].map(function(x){ return l.indexOf(x); });
  return p.every(function(v,i){ return v>=0 && (i===0 || v>p[i-1]); }); })());
ok('(f) Tempo-Vergleichslinien: „Tempo und Blöcke" und „Heute gegen typische Tage" zeichnen über tempoVergleichSvg, die Legenden über tempoVergleichLegende', rumpf('tempoBloeckeZeichnen').indexOf('tempoVergleichSvg(T, punkte)')>=0 && rumpf('ttZeichnen').indexOf('tempoVergleichSvg(T, punkte)')>=0 &&
   rumpf('tempoBloeckeHtml').indexOf('tempoVergleichLegende(T')>=0 && rumpf('heuteGegenTypischHtml').indexOf('tempoVergleichLegende(T')>=0 && fok.indexOf('Ø Donnerstag (1 Tag)</span>')>=0 && heuteGegenTypischHtml({bloecke:false, id:'ttv'}).indexOf('Ø Donnerstag (1 Tag)')>=0);
ok('(f) Fokus-Reihenfolge: Tempo und Blöcke · Der Tag (Tagesprognose · Tagesform · Tagesverlauf) · Matrix heute; die 2×2-Kacheln sind weg', (function(){ var p=['Tempo und Blöcke','<b>Tagesprognose</b>','<b>Tagesform ','<b>Tagesverlauf</b>','Matrix heute'].map(function(x){ return fok.indexOf(x); });
  return p.every(function(v,i){ return v>=0 && (i===0 || v>p[i-1]); }) && fok.indexOf('Diese Karte schiebt')<0 && fok.indexOf('DFM-Zeit heute')<0 && fok.indexOf('dt-kacheln')<0; })());
ok('(f) Statistik „Der Tag": dieselben drei Zeilen, aufgeklappt „Tempo und Blöcke"', (function(){ S.ui.statOffen={tag:true}; var h=stmTag(analyseFenster(), 'alle'); S.ui.statOffen={};
  return h.indexOf('<b>Tagesprognose</b>')<h.indexOf('<b>Tagesform ') && h.indexOf('<b>Tagesform ')<h.indexOf('<b>Tagesverlauf</b>') && h.indexOf('<b>Tagesverlauf</b>')<h.indexOf('Tempo und Blöcke') && h.indexOf('<b>Tagesprognose</b>')>0; })());

/* ══ §4 Aktuelle Kette mit Tagesketten ════════════════════════════════ */
kopf('§4 Aktuelle Kette: Tagesketten als Chip-Reihe');
tagDonnerstag();
S.karten=[ aufgabe('k1','dfm'), aufgabe('k2','dfm'), aufgabe('k3','privat'), aufgabe('k4','dfm'), aufgabe('k5','dfm') ];
fokusKarteAnsehen('k1'); renderFokus();
var fv=function(){ return el('fokusView').innerHTML; };
var grp=function(h, id){ var a=h.indexOf('data-klgrp="'+id+'"'), b=h.indexOf('data-klgrp="', a+12); return h.slice(a, b<0?h.length:b); };
var zeilen=function(){ return (grp(fv(), 'kette').match(/data-klkarte="([^"]+)"/g)||[]).map(function(x){ return x.slice(14,-1); }).filter(function(v,i,a){ return a.indexOf(v)===i; }); };
ok('§4 ohne Tagesketten: keine Chip-Reihe', fv().indexOf('kl-chips')<0 && fv().indexOf('data-tkwahl')<0);
var ganz=zeilen();
S.tagesketten=[ {id:'tk1', name:'DFM-Fokus 1', karten:['k4','k2','k1']}, {id:'tk2', name:'Abend', karten:['k3']} ]; renderFokus();
var gk=grp(fv(), 'kette');
ok('§4 mit Tagesketten: Chip-Reihe oben IN der Gruppe „Aktuelle Kette" — Ganzer Tag (aktiv) · DFM-Fokus 1 · Abend', gk.indexOf('<div class="kl-chips"><button type="button" class="kl-chip on" data-tkwahl=""><span>Ganzer Tag</span></button><button type="button" class="kl-chip" data-tkwahl="tk1"><span>DFM-Fokus 1</span></button><button type="button" class="kl-chip" data-tkwahl="tk2"><span>Abend</span></button></div>')>=0 &&
   gk.indexOf('kl-chips')<gk.indexOf('kl-grinh') && (fv().match(/kl-chips/g)||[]).length===1);
ok('§4 „Ganzer Tag" zeigt die aktuelle Kette wie ohne Tagesketten', zeilen().join(',')===ganz.join(',') && ganz.length>=3);
S.ui.tkWahl='tk1'; renderFokus();
ok('§4 Tageskette gewählt: ihre offenen Karten in ihrer Reihenfolge, ohne die gezeigte Karte (k4 · k2); Chip aktiv, Anzahl im Kopf', zeilen().join(',')==='k4,k2' && /class="kl-chip on" data-tkwahl="tk1"/.test(grp(fv(), 'kette')) && grp(fv(), 'kette').indexOf('<span class="anz">2</span>')>=0);
kid('k4').status='erledigt'; kid('k4').tagId=aktuelleTagId(); renderFokus();
ok('§4 … erledigte Karten fallen heraus', zeilen().join(',')==='k2');
S.ui.tkWahl='gibtsnicht'; renderFokus();
ok('§4 unbekannte Auswahl fällt auf „Ganzer Tag" zurück', tageskettenWahl()===null && /class="kl-chip on" data-tkwahl=""/.test(grp(fv(), 'kette')));
S.ui.tkWahl='tk2'; S.ui.klGruppen={kette:false}; renderFokus();
ok('§4 Gruppe zugeklappt: keine Chips', grp(fv(), 'kette').indexOf('kl-chips')<0);
ok('§4 der eigene Tagesketten-Block ist entfallen; Chips 32 px sichtbar (Tippfläche 44 px), aktiv weißer Rand, waagerecht wischbar', typeof tageskettenHtml==='undefined' && fv().indexOf('data-tkkopf')<0 && !/tkOffen/.test(src) &&
   /\.kl-chip span\{display:block;height:32px;/.test(src) && /\.kl-chip\{flex:none;height:44px;/.test(src) && /\.kl-chip\.on span\{border-color:#fff\}/.test(src) && /\.kl-chips\{display:flex;gap:6px;overflow-x:auto;/.test(src));

/* ══ §1/§2 Statusleiste und Vergleichslinien ══════════════════════════ */
kopf('§1 Matrix-Zelle · §2 Vergleichslinien');
tagDonnerstag();
S.tag.matrixSpur=[{ts:new Date(Date.now()-2*3600000).toISOString(), x:-0.5, y:0.2},{ts:new Date(Date.now()-600000).toISOString(), x:0.6, y:-0.1}];
var mk=matrixVerlaufSvg(S.tag.matrixSpur, {klein:true});
ok('§1 Matrix-Zelle: wieder der Matrixverlauf, 72×72, Farben aus den Konstanten', mk.indexOf('viewBox="0 0 72 72"')>=0 && mk.indexOf(FARBE.ROT)>=0 && mk.indexOf(FARBE.GRUEN)>=0 && typeof matrixMiniSvg==='undefined');
ok('§2 Legende: gestern (ROT gestrichelt) vor Ø Wochentag (BLAU)', (function(){ var l=tempoVergleichLegende({ gestern:[1], wtAlle:[1], wt:4, wtTage:3 }); return l.indexOf('gestern')<l.indexOf('Ø Donnerstag (3 Tage)') && l.indexOf('dashed '+farbeAlpha(FARBE.ROT,.55))>=0 && l.indexOf('background:'+FARBE.BLAU)>=0; })());

print('');
if(fails){ print(fails+' von '+n+' FEHLGESCHLAGEN'); throw new Error('Abnahme rot'); }
print('alle '+n+' Abnahmepunkte gruen');
