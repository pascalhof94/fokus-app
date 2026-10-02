/* Abnahme v3.2.0 „Uhr, Tick und Tagesabschluss konsistent" — die neun
   Testfaelle des Auftrags und die Regeln dahinter. Was nur im Browser
   pruefbar ist (Tippflaechen, elementFromPoint, langer Druck), prueft der
   UI-Harness (tests/ui). */
var fails=0, n=0;
function ok(t,c){ n++; print((c?'OK   ':'FAIL ')+t); if(!c) fails++; }
function kopf(t){ print(''); print('── '+t+' ──'); }
function frisch(){
  _store={}; S.karten=[]; S.unteraufgaben=[]; S.historie=[]; S.intraday=[]; S.routinenGruppen=[];
  S.meta={ wohlstand:0, seeded:true, migration200:true }; S.settings=settingsMerge({});
  S.tag=null; S.fokus=null; S.meta.ketten=null; matrixTmp=null; S.ui.fokusOffen=false; S.ui.fokusZeigt=null;
  abv3.aktiv=false; abv3.zurueck=false; abv3.schritt=1;
}
function kid(id){ return S.karten.filter(function(k){ return k.id===id; })[0]; }
function sub(id){ return S.unteraufgaben.filter(function(u){ return u.id===id; })[0]; }
function imp(karten, extra){ var p=Object.assign({appVersion:'3.2.0', karten:karten}, extra||{}); var r=syncImport(JSON.stringify(p)); if(r && r.fehler) print('   IMPORT-FEHLER '+r.fehler); return r; }
function logKarte(id){ return logRund((S.intraday||[]).filter(function(e){ return e.kartenId===id && logGehoertZuTag(e); }).reduce(function(a,e){ return a+num(e.punkte); },0)); }
function bilanzGleichLog(){ return Math.round(ohneLaufendeUhr(function(){ return tagesPunkteLive(); })*10)/10===Math.round(logSummeTag()*10)/10; }
function bestaet(){ abhakTmp.folge=false; el('abBonus').value=String(abhakTmp.bonusDef); el('abPktN').value=''; el('abIst').value=String(abhakTmp.istMin); abhakDialogConfirm(); }
var MO='2026-09-28';
var P='privat', D='dfm';
function katalog(){
  imp([
    {id:'r-klein-priv', domain:P, titel:'Kleine private Aufgabe', matrixFeld:'werkzeug', modus:'staffel', staffel:[30], immerSichtbar:true, tickMinuten:5},
    {id:'rasieren', domain:P, titel:'Rasieren', matrixFeld:'werkzeug', modus:'staffel', staffel:[20], tageslimit:1, tickMinuten:1, rhythmus:{typ:'taeglich'}},
    {id:'essen', domain:P, titel:'Essen', matrixFeld:'werkzeug', modus:'staffel', staffel:[100], tagesziel:3, tickMinuten:30, rhythmus:{typ:'taeglich'}},
    {id:'elvanse', domain:P, titel:'Elvanse nehmen', matrixFeld:'werkzeug', modus:'staffel', staffel:[50], tageslimit:1, tickMinuten:1, rhythmus:{typ:'taeglich'}},
    {id:'adhs', domain:P, titel:'ADHS-Erholung', matrixFeld:'zustand', modus:'zeit', zeitziel:120, rolle:'erholung', rhythmus:{typ:'taeglich'}},
    {id:'wecker', domain:P, titel:'Wecker prüfen', matrixFeld:'werkzeug', modus:'staffel', staffel:[10], tageslimit:1, tickMinuten:1, rhythmus:{typ:'taeglich'}},
    {id:'musik', domain:P, titel:'Musik anmachen', matrixFeld:'zustand', modus:'staffel', staffel:[5], immerSichtbar:true, tickMinuten:1},
    {id:'zaehne', domain:P, titel:'Zähne putzen', matrixFeld:'werkzeug', modus:'staffel', staffel:[50,100], tageslimit:2, rhythmus:{typ:'taeglich'},
      unteraufgaben:[{id:'zahnseide', titel:'Zahnseide', staffel:[50], tageslimit:1}]},
    {id:'pa', domain:P, titel:'private aufgabe', matrixFeld:'ziel', modus:'zeit', faelligkeit:MO, unteraufgaben:[{id:'pa-s1', titel:'Teil 1', sollMin:0}]},
    {id:'ab', domain:P, titel:'Tagesabschluss', matrixFeld:'werkzeug', modus:'pflicht', pflichtWert:50, tageslimit:1, rolle:'tagesabschluss', rhythmus:{typ:'taeglich'}},
    {id:'k3-schlafen', domain:P, titel:'Schlafen', matrixFeld:'zustand', rolle:'schlafen', immerSichtbar:true},
    {id:'auf', domain:P, titel:'Aufstehen', matrixFeld:'werkzeug', modus:'pflicht', pflichtWert:25, tageslimit:1, rolle:'aufstehen', rhythmus:{typ:'taeglich'}} ]);
}

/* ══ §1.2 · Der Ticker ist ein Datensatz ══════════════════════════════ */
kopf('§1.2 · Ticker-Datensatz');
frisch(); katalog(); tagStarten(70, MO);
var tkK=tickerVon(kid('r-klein-priv'));
ok('1.2 jede Staffel-/Pflicht-Karte hat eine Unteraufgabe {typ:"ticker"} ohne Titel', !!tkK && tkK.typ==='ticker' && tkK.titel==='' && tkK.parentId==='r-klein-priv' &&
   !!tickerVon(kid('ab')) && !tickerVon(kid('pa')) && !tickerVon(kid('adhs')));
ok('1.2 der Ticker ist keine Unteraufgabe der Liste (untermenge, Boni, Folgeaufgabe)', untermenge('zaehne').length===1 && untermenge('zaehne')[0].id==='zahnseide' && untermenge('r-klein-priv').length===0);
routineTick(kid('r-klein-priv'));
ok('1.2 die Ticks liegen im Ticker, nicht an der Karte', tkK.tickLog && tkK.tickLog.ticks.length===1 && kid('r-klein-priv').tickLog==null);
// Bestand bis v3.1: Ticks an der Karte wandern beim Laden in den Ticker
var alt=kid('musik'); S.unteraufgaben=S.unteraufgaben.filter(function(u){ return !(u.parentId==='musik' && u.typ==='ticker'); });
alt.tickLog={ tag:aktuelleTagId(), ticks:[{ts:jetztIso(), nr:1, basis:5, faktor:1, punkte:5, min:1, uhr:false}] };
tickerAlleSicherstellen();
ok('1.2 Migration: der alte tickLog der Karte wandert in den neuen Ticker', alt.tickLog===null && tickerVon(alt) && tickerVon(alt).tickLog.ticks.length===1 && tickAnzahlHeute(alt)===1);
routineTick(alt); routineTick(alt);
// Detail speichern laesst den Ticker stehen
oeffneDetail('musik'); detailSpeichern();
ok('1.2 Detail speichern löscht den Ticker nicht', !!tickerVon(kid('musik')) && tickAnzahlHeute(kid('musik'))===3);
var exK=syncExport('delta').karten.filter(function(k){ return k.id==='musik'; })[0];
var exT=exK.unteraufgaben.filter(function(u){ return u.typ==='ticker'; })[0];
print('   Export Ticker „Musik anmachen": '+JSON.stringify({id:exT.id, typ:exT.typ, ziel:exT.ziel, naechsterWert:exT.naechsterWert, ticks:exT.tickProtokoll.length}));
ok('1.2 der Export trägt den Ticker unter unteraufgaben (typ, Ticks, nächster Wert)', exT && exT.typ==='ticker' && exT.tickProtokoll.length===3 && exT.naechsterWert===5 && exT.ziel==='3×');
var rTk=imp([{id:'musik', unteraufgaben:[exT]}]);
ok('1.2 ein zurückgeschickter Ticker ist kein Fehler und legt keine zweite Unteraufgabe an', rTk.uebersprungen.length===0 && S.unteraufgaben.filter(function(u){ return u.parentId==='musik'; }).length===1);

/* ══ §1.1 · Uhr und Tick getrennt ════════════════════════════════════ */
kopf('§1.1 · Ist-Minuten und Tick-Minuten');
var e4=kid('essen'); routineTick(e4);
ok('1.1 ein Tick ohne Uhr bucht KEINE Ist-Zeit (tickMinuten = Belegzeit)', num(e4.istSek)===0 && tickMinHeute(e4)===30 && heuteInvestiertMin(e4)===0);
var ev=S.intraday.filter(function(e){ return e.kartenId==='essen' && e.typ==='tick'; }).pop();
ok('1.1 der Log-Eintrag trägt tickMin 30, minuten 0, quelle tick', ev.minuten===0 && ev.tickMin===30 && ev.quelle==='tick');
var exE=syncExport('delta').karten.filter(function(k){ return k.id==='essen'; })[0];
print('   Export „Essen": istMin '+exE.istMin+' · istMinHeute '+exE.istMinHeute+' · tickMin '+exE.tickMin+' · statusHeute '+exE.statusHeute);
ok('1.1/§5 Export: istMin und tickMin getrennt, statusHeute', exE.istMin===0 && exE.istMinHeute===0 && exE.tickMin===30 && exE.statusHeute==='offen');

/* ══ Testfall 1 · Kleine private Aufgabe ═════════════════════════════ */
kopf('Testfall 1 · Kleine private Aufgabe: 3 Ticks');
frisch(); katalog(); tagStarten(70, MO);
var kp=kid('r-klein-priv');
S.ui.suFrage='Kleine'; var su0=suFreitextHtml('Kleine');
ok('1 vor dem ersten Tick (0 Ticks) in der Suche sichtbar', su0.indexOf('data-kid="r-klein-priv"')>=0);
leisteTicken('r-klein-priv'); leisteTicken('r-klein-priv'); leisteTicken('r-klein-priv');
var su3=suFreitextHtml('Kleine'), lh1=abhakLeisteHtml();
print('   Status nach 3 Ticks: '+kp.status+' · kartenStatusHeute '+kartenStatusHeute(kp)+' · Zähler '+zaehlerText(kp)+' · '+kartePunkteHeute(kp)+' P');
ok('1 nach 3 Ticks offen, nicht gestrichen (Karte, Leiste, Suche)', kp.status==='offen' && kartenStatusHeute(kp)==='offen' && !istHeuteErledigt(kp) &&
   su3.indexOf('data-kid="r-klein-priv"')>=0 && !/class="zs-k al-z[^"]* fertig[^"]*"[^>]*data-alkarte="r-klein-priv"/.test(lh1));
ok('1 die Suche zeigt ihre Zähler-Zeile mit +1 und „3×"', /data-zzplus="r-klein-priv"/.test(su3) && /<span class="zz-n">3×<\/span>/.test(su3));
S.ui.suFrage='';
oeffneAbschlussV3(2);
var ab1=el('sheetBody').innerHTML;
ok('1 im Tagesabschluss (Schritt 2) als 3 Ticks aufgeführt', /Kleine private Aufgabe<small>/.test(ab1) && /data-zzplus="r-klein-priv" data-ort="abschluss"/.test(ab1) && /<span class="zz-n">3×<\/span>/.test(ab1));
closeSheet(); abv3.aktiv=false;

/* ══ Testfall 2 · Rasieren ═══════════════════════════════════════════ */
kopf('Testfall 2 · Rasieren: 1 Tick → erledigt überall');
var ra=kid('rasieren');
fokusStarten('rasieren');
print('   nach ▶: Ticks '+tickAnzahlHeute(ra)+' · Status '+ra.status+' · Uhr läuft '+!!(S.fokus && S.fokus.laeuft));
// v3.4.0 §1.2: kein Auto-Stopp mehr — die Uhr laeuft, bis pausiert wird (hier nach 70 s)
S.fokus.startMs=Date.now()-70000; fokusZeitEinbuchen();
var lh2=abhakLeisteHtml(), sr2=kartenreiheHtml(ra,'x'), kal2=kalenderBloecke([ra]).filter(function(b){ return b.kid==='rasieren'; });
print('   Leiste ✓: '+/data-alkarte="rasieren"[\s\S]*?al-ok/.test(lh2)+' · Suche erledigt: '+istHeuteErledigt(ra)+' · Kalender: '+kal2.map(function(b){ return b.art; }).join(','));
// v3.4.0 §1.4: erledigt bleibt der Status in jeder Ansicht (✓), aber nicht grau/gestrichen, solange die Uhr laufen kann
ok('2 ein Tick → erledigt: Leiste (✓, nicht grau), Suche (erledigt, nicht gestrichen), Kalender (Block „erledigt"), Status', kartenStatusHeute(ra)==='erledigt' &&
   /data-alkarte="rasieren"[\s\S]*?class="al-knopf al-ok"/.test(lh2) && !/class="zs-k al-z[^"]* fertig[^"]*"[^>]*data-alkarte="rasieren"/.test(lh2) && !/class="krow erledigt/.test(sr2) && kal2.length===1 && kal2[0].art==='erledigt' && istHeuteErledigt(ra));
ok('2 die Uhr lief bis zur Pause weiter (70 s Ist-Zeit, v3.4.0 §1.2)', !S.fokus.laeuft && Math.round(num(ra.istSek))===70);
/* §1.4: dieselbe Antwort in jeder Ansicht — fuer den ganzen Katalog */
var lh4=abhakLeisteHtml(), wid=0;
S.karten.forEach(function(k){
  if(!istLeistenKarte(k) || lh4.indexOf('data-alkarte="'+k.id+'"')<0) return;
  var leisteFertig=new RegExp('class="zs-k al-z[^"]* fertig[^"]*"[^>]*data-alkarte="'+k.id+'"').test(lh4), such=istHeuteErledigt(k), st=kartenStatusHeute(k)==='erledigt';
  // v3.4.0 §1.4: grau nur, wenn die Uhr nicht mehr laufen kann
  if(leisteFertig!==karteGrau(k) || such!==st){ wid++; print('   WIDERSPRUCH '+k.id+' Leiste '+leisteFertig+' Suche '+such+' Status '+st); }
});
ok('§1.4 kartenStatusHeute ist die eine Quelle: Leiste und Suche widersprechen sich bei keiner Karte', wid===0);

/* ══ Testfall 3 · Essen ═════════════════════════════════════════════ */
kopf('Testfall 3 · Essen: Ziel erreicht, weiter tickbar');
var es=kid('essen'), t3=[];
for(var i=0;i<3;i++) t3.push(routineTick(es));
ok('3 nach 3 Ticks „Ziel erreicht" (grüner Haken), Karte bleibt offen', kartenStatusHeute(es)==='zielErreicht' && es.status==='offen' && /Ziel erreicht/.test(zaehlerZeileHtml(es)));
var t4=routineTick(es);
ok('3 der 4. Tick ist möglich und bucht 100', !!t4 && t4.punkte===100 && kartePunkteHeute(es)===400 && zielText(es)==='4/3' && kartenStatusHeute(es)==='zielErreicht');

/* ══ Testfall 4 · Aufgabe: Bonus 1× ═════════════════════════════════ */
kopf('Testfall 4 · Aufgabe „private aufgabe" (Modus zeit): Abhakbonus höchstens 1×');
var pa=kid('pa'), bon=abhakbonusDefault(pa);
ok('4 die Aufgabe im Modus zeit ist eine Aufgabe (✓, keine Zähler-Zeile, nicht in der Leiste)', istAufgabeKarte(pa) && kartenreiheHtml(pa,'x').indexOf('data-check')>=0 &&
   kartenreiheHtml(pa,'x').indexOf('data-zzplus')<0 && !istLeistenKarte(pa));
fokusStarten('pa'); S.fokus.startMs=Date.now()-3*60000; fokusZeitEinbuchen();
ok('4 ▶ bucht bei einer Aufgabe keinen Start-Bonus (der Bonus kommt einmal mit ✓)', !pa.startBonus && ticksHeuteV3(pa).length===0);
karteAbhakenAuto('pa', false);
ok('4 ✓ öffnet den Abhak-Dialog (kein Tick)', !!abhakTmp && abhakTmp.kid==='pa' && abhakTmp.bonusDef===bon);
bestaet(); var l1=logKarte('pa');
sub('pa-s1').done=true; buchungAbgleich(pa,'unteraufgabe'); var l2=logKarte('pa');
karteAbhaken('pa', false); var l3=logKarte('pa');
karteAbhakenAuto('pa', false); var bd2=abhakTmp.bonusDef; bestaet(); var l4=logKarte('pa');
print('   ✓ '+l1+' → Unteraufgabe '+l2+' → Wiederöffnen '+l3+' → ✓ '+l4+' (Bonus '+bon+', im zweiten Dialog vorbelegt '+bd2+')');
ok('4 ✓ → Unteraufgabe → Wiederöffnen → ✓: Bonus in Summe 1× (Wiederöffnen zieht ihn zurück)', l1>=bon && l2===l1 && l3===0 && l4===l1 && pa.status==='erledigt');
ok('4 Tagesbilanz = Summe des Logs', bilanzGleichLog());

/* ══ Testfall 5 · Elvanse ═══════════════════════════════════════════ */
// v3.4.0 §1.2: Auto-Stopp und langer Druck sind entfallen — die Uhr laeuft, bis Pascal pausiert
kopf('Testfall 5 · Elvanse ▶: Tick sofort, Uhr läuft bis zur Pause (v3.4.0)');
var el5=kid('elvanse');
fokusStarten('elvanse');
ok('5 ▶ bucht den Tick sofort (Tageslimit 1 → erledigt), die Uhr läuft ohne Auto-Stopp', tickAnzahlHeute(el5)===1 && kartenStatusHeute(el5)==='erledigt' && S.fokus.laeuft && !S.fokus.autoStopMs);
S.fokus.startMs=Date.now()-55*60000; renderAlles();   // Befund-Lage von damals: 55 Min spaeter
ok('5 55 Min später läuft sie noch; Pause bucht 55 Min Ist-Zeit', S.fokus.laeuft && (fokusZeitEinbuchen(), Math.round(num(el5.istSek)/60))===55);
frisch(); katalog(); tagStarten(70, MO);   // wie bisher: frischer Tag fuer die folgenden Faelle

/* ══ §1.3 · ✓ nur auf Aufgaben, Zaehler-Zeile in jeder Ansicht ════════ */
kopf('§1.3 · ✓ nur auf Aufgaben · Zähler-Zeile überall');
fokusKarteAnsehen('essen'); renderFokus(); var fk=el('fokusView').innerHTML;
ok('1.3 Fokusansicht einer Routine: Zähler-Zeile mit +1, kein ✓', /data-zzplus="essen"/.test(fk) && fk.indexOf('data-fkcheck="essen"')<0);
fokusKarteAnsehen('pa'); renderFokus(); var fa=el('fokusView').innerHTML;
ok('1.3 Fokusansicht einer Aufgabe: ✓, keine Zähler-Zeile', /data-fkcheck="pa"/.test(fa) && fa.indexOf('data-zzplus')<0);
fokusKarteAnsehen('zaehne'); renderFokus(); var fz=el('fokusView').innerHTML;
ok('1.2 Unter-Zähler als weitere Zeile, mit ▶ (Uhr der Karte + Tick)', /data-zzsubplay="zahnseide"/.test(fz) && /data-zzsub="zahnseide"/.test(fz));
unterZaehlerStarten('zahnseide');
ok('1.1 ▶ am Unter-Zähler: die Uhr der Karte läuft, der Unter-Zähler hat den Tick, die Karte keinen', S.fokus.laeuft && S.fokus.karteId==='zaehne' && tickAnzahlHeute(sub('zahnseide'))===1 && tickAnzahlHeute(kid('zaehne'))===0);
fokusZeitEinbuchen();
var lh5=abhakLeisteHtml();
ok('1.2 Leiste: der Wert des nächsten Ticks steht in der Zeile', /Zähne putzen<span class="al-p">[^<]*nächster \+50 P/.test(lh5));
karteAbhakenAuto('essen', false);
ok('1.3 ein ✓-Weg auf eine Routine ist ein +1 (kein Abhak-Dialog)', tickAnzahlHeute(kid('essen'))===1 && !abhakTmp && kid('essen').status==='offen');

/* ══ Testfall 6 · Tagesabschluss mit laufender ADHS-Uhr ═════════════ */
kopf('Testfall 6 · Tagesabschluss mit laufender ADHS-Uhr');
frisch(); katalog(); tagStarten(70, MO);
S.tag.startTs=new Date(Date.now()-10*3600000).toISOString();   // aktiver Tag seit 10 Std.
var bil0=0;
fokusStarten('adhs'); S.fokus.startMs=Date.now()-30*60000;
oeffneAbschlussV3(1);
var foot1=el('sheetFoot').innerHTML;
ok('6/2.3 Schritt 1 hat kein „Schließen" (nur Weiter)', foot1.indexOf('data-abv3zu')<0 && /data-abv3schritt="2"/.test(foot1));
abv3.schritt=2; renderAbschlussV3();
var s2=el('sheetBody').innerHTML, f2=el('sheetFoot').innerHTML;
ok('6 Schritt 2 zeigt die laufende Uhr (⏸ stoppen) und „Messung übernehmen"', /Uhr läuft: <b>ADHS-Erholung<\/b>/.test(s2) && /data-abv3play="adhs"/.test(s2) && /data-abv3messung="1"/.test(f2) && f2.indexOf('data-abv3zu')<0);
abschlussMessungUebernehmen(); abv3.schritt=3;
var adhs=kid('adhs'), sit=S.intraday.filter(function(e){ return e.kartenId==='adhs' && e.typ==='timer'; }).pop();
print('   ADHS gestoppt: '+Math.round(num(adhs.istSek)/60)+' Min · Sitzung '+Math.round(sit.minuten)+' Min · '+logRund(sit.punkte)+' P · quelle '+sit.quelle);
ok('6 Uhr gestoppt, Zeit gebucht (30 Min), die Buchung trägt quelle „tagesabschluss"', !S.fokus.laeuft && Math.round(num(adhs.istSek)/60)===30 && sit.quelle==='tagesabschluss' && num(sit.punkte)>0);
var verteilt=intradayStatistik().filter(function(e){ return e.kartenId==='adhs' && e.verteilt; });
var sumV=logRund(verteilt.reduce(function(a,e){ return a+num(e.punkte); },0)), sumL=logRund(S.intraday.filter(function(e){ return e.kartenId==='adhs' && e.quelle==='tagesabschluss'; }).reduce(function(a,e){ return a+num(e.punkte); },0));
var stunden=verteilt.map(function(e){ return new Date(e.ts).getHours(); });
print('   verteilt auf '+verteilt.length+' Stunden (Tagesstart bis Abschluss-Beginn): je '+fmtP(verteilt[0]?verteilt[0].punkte:0)+' P · Summe '+sumV+' = Log '+sumL);
ok('6 in der Stunden-Statistik über die aktiven Stunden verteilt, Summe unverändert', verteilt.length===10 && Math.abs(sumV-sumL)<0.01 && verteilt.every(function(e){ return Date.parse(e.ts)<Date.parse(S.tag.abschluss.beginnTs); }));
var kurve=belTagKurve(belFensterDatum(jetztIso()), 'alle', 0), sprung=0;
for(var j=1;j<kurve.length;j++) sprung=Math.max(sprung, kurve[j].p-kurve[j-1].p);
ok('6 Tageskurve ohne Punktesprung vor dem Schlafen (größter Schritt ≤ ein Zehntel der Abschluss-Punkte + Einzelbuchung)', sprung<=sumL/10+60);
abv3.schritt=4; renderAbschlussV3();
var f4=el('sheetFoot').innerHTML, s4=el('sheetBody').innerHTML;
ok('6/2.3 Schritt 4 zeigt immer den Export (.md, Kopieren, Download); „Schließen" ist gesperrt', /id="abv3Md"/.test(s4) && /data-abv3dl="1"/.test(s4) && /data-abv3copy="1"/.test(s4) &&
   /class="btn prim gesperrt" data-abv3zu="1" aria-disabled="true"/.test(f4) && !abschlussExportOk());
abschlussV3Kopieren(); f4=el('sheetFoot').innerHTML;
ok('6/2.3 nach „Kopieren" ist „Schließen" aktiv', abschlussExportOk() && /class="btn prim" data-abv3zu="1" aria-disabled="false"/.test(f4));
abschlussV3SchliessenUI();
ok('6 Tag abgeschlossen, Bilanz = Log', !!S.tag.endeTs && !S.tag.geschlossenTs && bilanzGleichLog());

/* ══ Testfall 7 · Nach dem Abschluss bis „Schlafen" ═════════════════ */
kopf('Testfall 7 · Nach dem Abschluss Wecker ticken → Nachtrag bei „Schlafen"');
var b7=num(S.tag.punkteBilanz), h7=S.historie[S.historie.length-1];
leisteTicken('wecker');
ok('7 nach dem Abschluss ist eine Routine weiter tickbar (Buchung auf denselben Tag)', tickAnzahlHeute(kid('wecker'))===1 && logKarte('wecker')===10 && nachAbschluss());
fokusStarten('pa');
ok('7 Aufgaben sind nach dem Abschluss nicht startbar (grau)', !(S.fokus && S.fokus.karteId==='pa' && S.fokus.laeuft));
var lh7=abhakLeisteHtml();
ok('7 die Leiste zeigt die Routine aktiv, den Tagesabschluss grau', !/class="zs-k al-z[^"]* aus"[^>]*data-alkarte="wecker"/.test(lh7) && /class="zs-k al-z[^"]* aus"[^>]*data-alkarte="ab"/.test(lh7));
var ex7=syncExport('delta').tagesabschluss.nachtrag;
ok('7 der Export zeigt den Nachtrag schon vor „Schlafen"', ex7 && ex7.anzahl>=1 && ex7.eintraege.some(function(e){ return e.kartenId==='wecker'; }));
schlafUmschalten();
var nt=S.tag.nachtrag;
print('   Nachtrag: '+nt.anzahl+' Buchung(en) · +'+nt.punkte+' P · Bilanz '+nt.bilanzVorher+' → '+nt.bilanzNachher+' · Sheet „'+el('sheetTitel').textContent+'"');
print('   Nachtrag-Einträge: '+nt.eintraege.map(function(e){ return (e.titel||e.typ)+' '+e.typ+'/'+e.quelle+' '+e.punkte; }).join(' | '));
ok('7 „Schlafen" schließt den Tag endgültig und zeigt den Nachtrag-Export (Kopieren/Download)', !!S.tag.geschlossenTs && /Nachtrag/.test(el('sheetTitel').textContent) &&
   /data-ntcopy="1"/.test(el('sheetBody').innerHTML) && /data-ntdl="1"/.test(el('sheetBody').innerHTML) && /Seit dem Tagesabschluss/.test(el('ntMd') ? _nachtragMd : _nachtragMd));
ok('7 die Bilanz des Tages (Historie) ist nachgezogen: +10', nt.bilanzNachher===b7+10 && h7.punkteBilanz===b7+10 && h7.nachtrag.anzahl===nt.anzahl);
ok('7 der Nachtrag reist im Export bis zum bestätigten Sync', syncExport('delta').nachtraege.length===1 && (syncBestaetigen(), syncExport('delta').nachtraege.length===0));
leisteTicken('musik');
ok('7 nach „Schlafen" ist der Tag zu', tickAnzahlHeute(kid('musik'))===0);
schlafZustand().laeuft=null;

/* ══ Testfall 8 · Schlafen robust ═══════════════════════════════════ */
kopf('Testfall 8 · Schlafen 2 Sekunden → Fehltipp');
frisch(); katalog(); tagStarten(70, MO);
var z=schlafZustand(); z.schuldStd=7; z.letzte={ startTs:'2026-09-27T22:00:00.000Z', endeTs:'2026-09-28T05:00:00.000Z', dauerMin:420, punkte:100, schuldVorStd:7, schuldNachStd:7, gebucht:true, tagId:S.tag.tagId };
z.laeuft={ startTs:new Date(Date.now()-2000).toISOString(), abendAkku:null };
var f8=schlafStoppen();
ok('8 2 Sekunden: Fehltipp verworfen — kein Schlaf, keine Buchung, Schlafschuld bleibt 7', f8.verworfen && f8.fehltipp && schlafZustand().schuldStd===7 && schlafZustand().letzte.punkte===100 && !schlafLaeuft());
var ex8=syncExport('delta').schlaf;
ok('8 Export: schlaf.letzteNacht.fehltipp = true (die letzte gültige Nacht daneben)', ex8.letzteNacht.fehltipp===true && ex8.letzteGueltigeNacht.dauerMin===420);
z.laeuft={ startTs:new Date(Date.now()-30*60000).toISOString(), abendAkku:null };
var f8b=schlafStoppen();
ok('8 30 Minuten: zu kurz für eine Nacht (unter 60) — verworfen, keine Schuld', f8b.verworfen && !f8b.fehltipp && f8b.zuKurz && schlafZustand().schuldStd===7);
// Korrektur-Paket: die echte Nacht (ersetzt den Fehlstand vom 28.09.) und die Schuld direkt
z.letzte={ startTs:new Date(Date.now()-3000).toISOString(), endeTs:jetztIso(), dauerMin:0, punkte:0, schuldVorStd:7, schuldNachStd:14, gebucht:true, tagId:S.tag.tagId }; z.schuldStd=14;
var sk=kid('k3-schlafen'); tickLogHeute(sk).push({ ts:jetztIso(), nr:1, basis:0, faktor:1, punkte:0, min:0, uhr:true, schlafMin:0 });
var von=new Date(Date.now()-8*3600000).toISOString(), bis=new Date(Date.now()-3600000).toISOString();
var r8=imp([], { korrekturen:[{ datum:MO, grund:'Fehltipp 28.09.: echte Nacht nachgetragen', sitzungen:[{ kartenId:'k3-schlafen', von:von, bis:bis }] }] });
print('   Korrektur: '+JSON.stringify(S.meta.korrekturProtokoll.slice(-1)[0].aenderungen||S.meta.korrekturProtokoll.slice(-1)[0].zeilen||'')+' · Schuld '+schlafZustand().schuldStd);
ok('8 korrekturen.sitzungen auf k3-schlafen = eine Nacht: ersetzt den Fehlstand, rechnet die Schuld neu (7 + 7 − 7 = 7)', schlafZustand().letzte.dauerMin===420 && schlafZustand().schuldStd===7 && schlafZustand().letzte.punkte===100);
ok('8 … und bucht die Punkte der Nacht (100) in den Tag, Bilanz = Log', kartePunkteHeute(sk)===100 && bilanzGleichLog());
imp([], { korrekturen:[{ datum:MO, grund:'Schuld laut Sleepcycle', schlaf:{ schuldStd:3.5 } }] });
ok('8 korrekturen[].schlaf.schuldStd setzt die Schlafschuld (mit grund)', schlafZustand().schuldStd===3.5);
// Aufstehen ohne laufende Schlafen-Uhr: „Wann eingeschlafen?"
tagEnde8();
function tagEnde8(){ S.tag.routinenAuswertung=routinenAuswerten(S.tag.datum, {}); S.tag.endeTs=new Date(Date.now()-9*3600000).toISOString(); S.tag.geschlossenTs=S.tag.endeTs; }
schlafZustand().letzte.gebucht=true;
oeffneAufstehen();
ok('8 Aufstehen ohne Schlafen-Uhr fragt einmal „Wann eingeschlafen?"', /Wann eingeschlafen\?/.test(el('sheetBody').innerHTML) && /id="aufEinschlaf"/.test(el('sheetBody').innerHTML));
var hh=new Date(Date.now()-7*3600000), um=String(hh.getHours()).padStart(2,'0')+':'+String(hh.getMinutes()).padStart(2,'0');
aufstehenBestaetigen(70, { einschlafUm:um });
print('   Aufstehen mit Einschlafzeit '+um+': Nacht '+schlafZustand().letzte.dauerMin+' Min · '+schlafZustand().letzte.punkte+' P · gebucht '+schlafZustand().letzte.gebucht);
ok('8 … und bucht die Nacht daraus in den neuen Tag', tagOffen() && Math.abs(schlafZustand().letzte.dauerMin-420)<=1 && schlafZustand().letzte.gebucht===true && S.tag.morgen.schlafMin>=419);

/* ══ Testfall 9 · Import ohne Hüllen ═════════════════════════════════ */
kopf('Testfall 9 · Paket ohne Titel → abgewiesen, keine Hülle');
frisch(); katalog(); tagStarten(70, MO);
var vor9=S.karten.length;
var r9=syncImport(JSON.stringify({appVersion:'3.2.0', karten:[{id:'recX', block:'morgen'}, {id:'recY0000000000001', titel:'Neu ohne Matrix', domain:'dfm'}, {id:'neu-ok', titel:'Neu vollständig', domain:'privat', matrixFeld:'ziel'}], kette:['recX','neu-ok']}));
print('   übersprungen: '+r9.uebersprungen.map(function(u){ return u.grund; }).join(' | '));
ok('9 {id:"recX"} ohne Titel: abgewiesen mit „unbekannte Karte ohne Titel (id recX)", keine Hülle', !kid('recX') && r9.uebersprungen.some(function(u){ return /übersprungen: unbekannte Karte ohne Titel \(id recX\)/.test(u.grund); }));
ok('9 Neuanlage ohne matrixFeld: abgewiesen mit Grund; vollständige Karte angelegt', !kid('recY0000000000001') && r9.uebersprungen.some(function(u){ return /Pflichtfeld fehlt: matrixFeld/.test(u.grund); }) && !!kid('neu-ok') && S.karten.length===vor9+1);
ok('9 die Kette ignoriert die abgewiesene ID', tagesKette().indexOf('recX')<0 && tagesKette().indexOf('neu-ok')>=0);
ok('9 eine BEKANNTE Karte darf weiter ohne Titel kommen ({id, block})', !imp([{id:'essen', block:'morgen'}]).uebersprungen.length);

/* ══ §5 · Export ════════════════════════════════════════════════════ */
kopf('§5 · Export');
routineTick(kid('essen'));
var x5=syncExport('delta');
ok('§5 Log-Einträge mit quelle (uhr · tick · abhaken · tagesabschluss · schlafen · korrektur)', Array.isArray(x5.stundenLogHeute) && x5.stundenLogHeute.length>0 &&
   x5.stundenLogHeute.every(function(e){ return ['uhr','tick','abhaken','tagesabschluss','schlafen','korrektur'].indexOf(e.quelle)>=0; }));
ok('§5 karten[]: istMin, tickMin, statusHeute bei jeder Karte', x5.karten.every(function(k){ return typeof k.istMin==='number' && typeof k.tickMin==='number' && ['offen','zielErreicht','erledigt'].indexOf(k.statusHeute)>=0; }));
ok('§5 tagesabschluss.nachtrag und schlaf.letzteNacht.fehltipp im Vertrag', 'nachtrag' in x5.tagesabschluss && 'letzteNacht' in x5.schlaf);
var rt=syncImport(JSON.stringify(syncExport('delta')));
ok('§5 ein zurückgeschickter Delta-Export meldet keine unbekannten Felder', rt.uebersprungen.filter(function(u){ return /unbekanntes Feld/.test(u.grund); }).length===0);

/* ══ Version ════════════════════════════════════════════════════════ */
kopf('Version');
ok('APP_VERSION aktuell (3.4.0), alle Anzeigen aus APP_VERSION, Build 2026-10-02-4', APP_VERSION==='3.5.4' && VERSION===APP_VERSION && UI_VERSION==='v'+APP_VERSION && APP_BUILD==='2026-10-02-4' && DATENVERTRAG==='2.1.0');

print('');
print(fails? (fails+' von '+n+' FEHLGESCHLAGEN') : ('alle '+n+' Abnahmepunkte gruen'));
if(fails) throw 'Abnahme rot';
