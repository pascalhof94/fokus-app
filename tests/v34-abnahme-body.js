/* Abnahme v3.4.0 „Routinen wie ADHS-Erholung, Schlafmessung, Hinweis beim
   Aufstehen" — die zehn Testfaelle des Auftrags (§4), der Schlaf-Befund
   vom 28./29.09. (§2) und die Regeln dahinter. Die Uhr ist verstellbar
   (uhr/minuten aus tests/v34-abnahme.js). */
var fails=0, n=0;
function ok(t,c){ n++; print((c?'OK   ':'FAIL ')+t); if(!c) fails++; }
function kopf(t){ print(''); print('── '+t+' ──'); }
function kid(id){ return S.karten.filter(function(k){ return k.id===id; })[0]; }
function frisch(){
  _store={}; S.karten=[]; S.unteraufgaben=[]; S.historie=[]; S.intraday=[]; S.routinenGruppen=[];
  S.meta={ wohlstand:0, seeded:true, migration200:true }; S.settings=settingsMerge({});
  S.tag=null; S.fokus=null; S.meta.ketten=null; matrixTmp=null; S.ui.fokusOffen=false; S.ui.fokusZeigt=null;
  abv3.aktiv=false; abv3.zurueck=false; abv3.schritt=1; aufstehenTmp=null;
}
function imp(karten){ var r=syncImport(JSON.stringify({appVersion:'3.5.0', karten:karten})); if(r && r.fehler) print('   IMPORT-FEHLER '+r.fehler); return r; }
function logKarte(id){ return logRund((S.intraday||[]).filter(function(e){ return e.kartenId===id && logGehoertZuTag(e); }).reduce(function(a,e){ return a+num(e.punkte); },0)); }
function bilanzGleichLog(){ return Math.round(ohneLaufendeUhr(function(){ return tagesPunkteLive(); })*10)/10===Math.round(logSummeTag()*10)/10; }
function leisteZeile(id){ var h=abhakLeisteHtml(), i=h.indexOf('data-alkarte="'+id+'"'); if(i<0) return ''; var a=h.lastIndexOf('<div class="zs-k al-z', i); var b=h.indexOf('<div class="zs-k al-z', i); return h.slice(a, b<0?h.length:b); }
function hhmm(ms){ var d=new Date(ms); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }
var P='privat', MO='2026-09-28', DI='2026-09-29';
// Werte wie im echten Bestand (Tagesabschluss-Export 28.09.): Schlafen traegt modus staffel und einen Rhythmus
function katalog(){
  imp([
    {id:'r-rasieren', domain:P, titel:'Rasieren', matrixFeld:'werkzeug', modus:'staffel', staffel:[50], tageslimit:1, tickMinuten:5, rhythmus:{typ:'taeglich'}},
    {id:'r-zaehne', domain:P, titel:'Zähne putzen', matrixFeld:'werkzeug', modus:'staffel', staffel:[50,100], tageslimit:2, tickMinuten:3, rhythmus:{typ:'taeglich'}},
    {id:'r-klein-priv', domain:P, titel:'Kleine private Aufgabe', matrixFeld:'werkzeug', modus:'staffel', staffel:[50], tickMinuten:5, immerSichtbar:true, rhythmus:{typ:'taeglich'}},
    {id:'214e7c86-7638-4250-8af0-f2a4d43b972c', domain:P, titel:'ADHS-Erholung', matrixFeld:'werkzeug', modus:'zeit', zeitziel:120, rhythmus:{typ:'taeglich'}},
    {id:'r-wasser', domain:P, titel:'Wasser für die Nacht', matrixFeld:'werkzeug', modus:'pflicht', pflichtWert:50, pflichtDeckel:10, pflichtAbzug:5, tageslimit:1, rhythmus:{typ:'taeglich'}},
    {id:'k3-aufstehen', domain:P, titel:'Aufstehen und in den Tag starten', matrixFeld:'werkzeug', modus:'pflicht', pflichtWert:25, pflichtDeckel:10, pflichtAbzug:0, rolle:'aufstehen', rhythmus:{typ:'taeglich'}},
    {id:'k3-tagesabschluss', domain:P, titel:'Tagesabschluss', matrixFeld:'werkzeug', modus:'pflicht', pflichtWert:50, pflichtDeckel:30, pflichtAbzug:5, tageslimit:1, rolle:'tagesabschluss', rhythmus:{typ:'taeglich'}},
    {id:'k3-schlafen', domain:P, titel:'Schlafen', matrixFeld:'werkzeug', modus:'staffel', rolle:'schlafen', rhythmus:{typ:'taeglich'}},
    {id:'aufgabe', domain:P, titel:'private aufgabe', matrixFeld:'ziel', modus:'zeit', faelligkeit:MO} ]);
}
function tagMontag(){ frisch(); katalog(); uhr('2026-09-28T07:00:00+02:00'); tagStarten(70, MO); }
function abschliessen(){ oeffneAbschlussV3(1); S.tag.abschluss.exportTs=jetztIso(); abschlussV3SchliessenUI(); }
var ADHS='214e7c86-7638-4250-8af0-f2a4d43b972c';

/* ══ Testfall 1 · Rasieren ═══════════════════════════════════════════ */
kopf('Testfall 1 · Rasieren (staffel, Tageslimit 1)');
tagMontag();
var ra=kid('r-rasieren');
fokusStarten('r-rasieren');
ok('1 ▶ bucht Tick 50 sofort, die Uhr läuft; Tageslimit 1 → „Ziel erreicht", offen (§7 v3.7.0)', tickAnzahlHeute(ra)===1 && staffelPunkteHeute(ra)===50 && S.fokus.laeuft && S.fokus.karteId==='r-rasieren' && kartenStatusHeute(ra)==='zielErreicht' && ra.status==='offen');
minuten(12); renderAlles();
ok('1 … und läuft nach 12 Min noch (kein Auto-Stopp nach tickMinuten)', S.fokus.laeuft && !S.fokus.autoStopMs);
fokusZeitEinbuchen();
ok('1 Pause: 12 Min Ist-Zeit, 50 P', Math.round(heuteInvestiertMin(ra))===12 && kartePunkteHeute(ra)===50);
minuten(20);
var p1=tagesPunkteLive(), log1=(S.intraday||[]).length;
leistePlay('r-rasieren');
ok('1 erneut ▶ (Leiste): die Uhr läuft, kein Tick, keine Punkte', S.fokus.laeuft && S.fokus.nurZeit===true && tickAnzahlHeute(ra)===1 && kartePunkteHeute(ra)===50);
var zl1=leisteZeile('r-rasieren'), zz1=zaehlerZeileHtml(ra);
ok('1 während der Messung: nicht ausgegraut, nicht gestrichen; „1/1" und „Ziel erreicht" bleiben (§7 v3.7.0: kein ✓ durch das Limit)', zl1.indexOf(' fertig')<0 && zz1.indexOf('zz fertig')<0 && /data-alzahl="r-rasieren"[^>]*>1\/1</.test(zl1) && /zz-ok">Ziel erreicht/.test(zz1));
minuten(130); renderAlles();
ok('1 nach 130 Min Messung: weiter 0 Punkte (keine Dauerlauf-Strafe)', kartePunkteHeute(ra)===50 && Math.round(tagesPunkteLive())===Math.round(p1));
fokusZeitEinbuchen();
var e1=S.intraday.slice(log1).filter(function(e){ return e.kartenId==='r-rasieren' && e.typ==='timer'; })[0];
ok('1 Pause: istMinHeute 142, Log-Eintrag quelle „uhr" mit 0 Punkten', Math.round(heuteInvestiertMin(ra))===142 && !!e1 && logQuelle(e1)==='uhr' && num(e1.punkte)===0 && Math.round(e1.minuten)===130);
var x1=syncExport('delta').karten.filter(function(k){ return k.id==='r-rasieren'; })[0];
ok('1 Export: istMinHeute 142, statusHeute zielErreicht (§7 v3.7.0), Punkte 50', x1.istMinHeute===142 && x1.statusHeute==='zielErreicht' && Math.round(kartePunkteHeute(ra))===50);
ok('1 Bilanz = Log', bilanzGleichLog());

/* ══ Testfall 2 · Zähne putzen ═══════════════════════════════════════ */
kopf('Testfall 2 · Zähne putzen (Tageslimit 2)');
var za=kid('r-zaehne');
fokusStarten('r-zaehne'); minuten(3); fokusZeitEinbuchen(); minuten(10);
fokusStarten('r-zaehne'); minuten(3); fokusZeitEinbuchen(); minuten(10);
ok('2 zwei ▶ (je eigener Durchgang) → 50 + 100 P, Tageslimit erreicht („Ziel erreicht", §7 v3.7.0)', tickAnzahlHeute(za)===2 && kartePunkteHeute(za)===150 && kartenStatusHeute(za)==='zielErreicht');
fokusStarten('r-zaehne');
ok('2 drittes ▶: die Uhr läuft, kein Tick', S.fokus.laeuft && S.fokus.nurZeit && tickAnzahlHeute(za)===2);
minuten(4); fokusZeitEinbuchen();
ok('2 … keine Punkte, die Zeit ist gemessen (6 + 4 Min)', kartePunkteHeute(za)===150 && Math.round(heuteInvestiertMin(za))===10 && bilanzGleichLog());

/* ══ §1.5 · Pflicht: Abzug nur im Durchgang mit dem Tick ═══════════════ */
kopf('§1.5 · Pflicht-Karte mit Tageslimit: Abzug nur im Durchgang, der den Tick gebucht hat');
var wa=kid('r-wasser');
fokusStarten('r-wasser'); minuten(25); fokusZeitEinbuchen();
ok('1.5 ▶ bucht den Pflicht-Tick (50), 25 Min > Deckel 10 → 2 × 5 Abzug = 40 P', kartePunkteHeute(wa)===40 && tickAnzahlHeute(wa)===1);
minuten(10); fokusStarten('r-wasser'); minuten(40); renderAlles();
ok('1.5 weitere Messzeit nach dem Limit (40 Min) erzeugt keinen Abzug, auch nicht live', kartePunkteHeute(wa)===40 && S.fokus.nurZeit);
fokusZeitEinbuchen();
ok('1.5 … auch nicht beim Pausieren (40 P, 65 Min gemessen)', kartePunkteHeute(wa)===40 && Math.round(heuteInvestiertMin(wa))===65 && bilanzGleichLog());

/* ══ Testfall 4 · Kleine private Aufgabe (ohne Limit) ═════════════════ */
kopf('Testfall 4 · Kleine private Aufgabe (ohne Limit): je ▶ ein Tick');
var kp=kid('r-klein-priv');
fokusStarten('r-klein-priv'); minuten(3); fokusZeitEinbuchen(); minuten(10);
fokusStarten('r-klein-priv'); minuten(3); fokusZeitEinbuchen(); minuten(10);
fokusStarten('r-klein-priv'); minuten(3); fokusZeitEinbuchen();
ok('4 drei Durchgänge = drei Ticks (150 P), nie „nur Zeit"', tickAnzahlHeute(kp)===3 && kartePunkteHeute(kp)===150 && kartenStatusHeute(kp)!=='erledigt');

/* ══ Testfall 5 · ADHS-Erholung ═════════════════════════════════════ */
kopf('Testfall 5 · ADHS-Erholung (zeit, Zeitziel 120): unverändert');
var ad=kid(ADHS);
minuten(10); fokusStarten(ADHS); minuten(125); fokusZeitEinbuchen();
var p5=kartePunkteHeute(ad);
ok('5 nach 125 Min: „Ziel erreicht", bleibt offen und startbar', kartenStatusHeute(ad)==='zielErreicht' && ad.status==='offen' && /Ziel erreicht/.test(zaehlerZeileHtml(ad)));
minuten(10); fokusStarten(ADHS);
ok('5 ▶ nach dem Ziel: die Uhr misst weiter und zählt wie bisher (keine reine Messung)', S.fokus.laeuft && !S.fokus.nurZeit);
minuten(30); fokusZeitEinbuchen();
ok('5 … Zeit bringt weiter Punkte ('+Math.round(p5)+' → '+Math.round(kartePunkteHeute(ad))+' P)', kartePunkteHeute(ad)>p5 && Math.round(heuteInvestiertMin(ad))===155);

/* ══ Testfall 10 · Aufgabe nach ✓ ═══════════════════════════════════ */
kopf('Testfall 10 · Aufgabe nach ✓: nicht startbar (unverändert)');
var au=kid('aufgabe');
karteAbhaken('aufgabe', true);
var vorKarten=S.karten.length;
fokusStarten('aufgabe');
ok('10 die erledigte Aufgabe selbst bekommt keine Uhr und bleibt erledigt (▶ öffnet wie bisher eine neue Karte)', au.status==='erledigt' && !(S.fokus && S.fokus.karteId==='aufgabe') && S.karten.length===vorKarten+1 && !uhrFrei(au));
fokusBeenden();
ok('10 Leiste: die Aufgabe steht nicht darin; Suche: sie bleibt gestrichen', abhakLeisteHtml().indexOf('data-alkarte="aufgabe"')<0 && /class="krow erledigt/.test(kartenreiheHtml(au,'x')));

/* ══ §1.7 · dieselbe Start-Logik in jeder Ansicht ═══════════════════ */
kopf('§1.7 · jede Ansicht: ▶ bleibt, nichts grau');
fokusKarteAnsehen('r-rasieren'); renderFokus(); var fv=el('fokusView').innerHTML;
ok('1.7 Fokus: Routine mit erreichtem Limit zeigt ▶ und die Zähler-Zeile „Ziel erreicht", nicht den „erledigt"-Verlaufskasten (§7 v3.7.0)', /data-fktoggle="r-rasieren"/.test(fv) && fv.indexOf('data-wiederholen="r-rasieren"')<0 && /zz-ok">Ziel erreicht/.test(fv));
var sr=kartenreiheHtml(ra,'x');
ok('1.7 Suche: nicht gestrichen, ▶ startet in den Fokus (nicht „Wieder öffnen")', !/class="krow[^"]*erledigt/.test(sr) && /aria-label="In den Fokus starten"/.test(sr));
ok('1.7 (§12 v3.7.0) kein Kalender mehr; die Uhr bleibt frei', typeof kalenderBloecke==='undefined' && uhrFrei(ra));
ok('1.7 Zeitstrahl: ▶ auch auf der erledigten Routine', /data-zsplay="r-rasieren"/.test(zeitstrahlHtml()) || tagesKette().indexOf('r-rasieren')<0);

/* ══ Testfall 3 · Tagesabschluss nach dem Abschluss ═════════════════ */
kopf('Testfall 3 · Tagesabschluss (pflicht, Tageslimit 1) nach dem Abschluss');
uhr('2026-09-28T22:30:00+02:00');
var ab=kid('k3-tagesabschluss');
abschliessen();
var pAb=kartePunkteHeute(ab), bil3=S.tag.punkteBilanz;
ok('3 der Abschluss bucht den Pflicht-Tick (50 P)', tickAnzahlHeute(ab)===1 && pAb===50 && nachAbschluss());
leistePlay('k3-tagesabschluss');
ok('3 ▶ danach: die Uhr läuft (nur Zeit), kein Dialog', S.fokus.laeuft && S.fokus.karteId==='k3-tagesabschluss' && S.fokus.nurZeit && !abv3.aktiv);
minuten(40); fokusZeitEinbuchen();
ok('3 40 Min (über dem Deckel 30): 0 Punkte, kein Abzug, Zeit gemessen', kartePunkteHeute(ab)===pAb && Math.round(heuteInvestiertMin(ab))===40);
ok('3 die Messung zählt im Nachtrag mit 0 Punkten', nachtragStand().eintraege.filter(function(e){ return e.kartenId==='k3-tagesabschluss'; }).every(function(e){ return e.punkte===0; }));
fokusStarten('r-rasieren'); minuten(5); fokusZeitEinbuchen();
ok('3 auch nach dem Abschluss: erledigte Routinen messen weiter (Rasieren +5 Min, 50 P)', Math.round(heuteInvestiertMin(ra))===147 && kartePunkteHeute(ra)===50);

/* ══ §2 · Befund 28./29.09. reproduziert ════════════════════════════ */
kopf('§2 · Befund: „Schlafen" nach dem Abschluss');
uhr('2026-09-28T23:00:00+02:00');
var sk=kid('k3-schlafen');
fokusKarteAnsehen('k3-schlafen'); renderFokus();
ok('2.1 nach dem Abschluss: Schlafen startbar und hervorgehoben (Leiste, Fokusansicht)', leisteAktiv(sk) && / hervor/.test(leisteZeile('k3-schlafen')) && leisteZeile('k3-schlafen').indexOf(' aus')<0 && /data-fktoggle="k3-schlafen"[^>]*>▶</.test(el('fokusView').innerHTML));
// der Tipp auf ▶ in der Fokusansicht (dieselbe Karte, die der Abschluss dort zeigt)
if(S.fokus && S.fokus.karteId==='k3-schlafen') fokusToggle(); else fokusStarten('k3-schlafen');
renderFokus(); var fs=el('fokusView').innerHTML;
ok('2.2 ▶ startet die Schlaf-Uhr mit Zeitstempel (23:00)', schlafLaeuft() && schlafZustand().laeuft.startTs===new Date(_RD.parse('2026-09-28T23:00:00+02:00')).toISOString() && schlafZustand().laeuft.tagId===S.tag.tagId);
ok('2 Ursache (e) behoben: die Fokusansicht zeigt jetzt ⏸ (vorher ▶ — der zweite Tipp stoppte die Uhr als Fehltipp)', /data-fktoggle="k3-schlafen"[^>]*>⏸</.test(fs) && /data-alplay="k3-schlafen"[^>]*>⏸</.test(abhakLeisteHtml()));
ok('2 (§2 v3.7.3) kein Nachtrag-Export beim Schlafen: „Schlafen" bleibt hervorgehoben und läuft, der Tag bleibt der Anker (kein geschlossenTs)', / hervor/.test(leisteZeile('k3-schlafen')) && schlafLaeuft() && !S.tag.geschlossenTs);
// (a) gesperrt? (b) Mitternacht/Neuladen? (d) Dauer?
ok('2 (a) trifft nicht zu: Schlafen war nach dem Abschluss nie gesperrt oder grau', leisteAktiv(sk));

/* ══ Testfall 7 · Neuladen um 01:00 ═════════════════════════════════ */
kopf('Testfall 7 · Schlafen ▶, App neu geladen um 01:00');
uhr('2026-09-29T01:00:00+02:00');
var tagVor=S.tag.tagId;
ladeAlles(); S.unteraufgaben=DB.get('unteraufgaben', []); pruefeTagKante(); renderAlles();
ok('7 nach dem Neuladen (nach Mitternacht): die Uhr läuft weiter, seit 23:00, derselbe App-Tag', schlafLaeuft() && schlafZustand().laeuft.startTs===new Date(_RD.parse('2026-09-28T23:00:00+02:00')).toISOString() && S.tag.tagId===tagVor);
ok('2 (b) trifft nicht zu: kein Tageswechsel um Mitternacht, solange „Schlafen" läuft', aktuelleTagId()===tagVor && heuteApp()===MO && !tagOffen());

/* ══ Testfall 6 · Aufstehen 07:30 ═══════════════════════════════════ */
kopf('Testfall 6 · Schlafen 23:00, Gerät gesperrt über Mitternacht, 07:30 Aufstehen');
uhr('2026-09-29T07:30:00+02:00');
ladeAlles(); S.unteraufgaben=DB.get('unteraufgaben', []); renderAlles();
var hVor=(S.historie||[]).filter(function(h){ return h.tagId===tagVor; })[0], bilVor=num(hVor && hVor.punkteBilanz), wVor=num(S.meta.wohlstand);
leistePlay('k3-aufstehen');   // der Tipp auf „Aufstehen"
var nacht=schlafZustand().letzte, dlg=el('sheetBody').innerHTML;
print('   Nacht: '+nacht.dauerMin+' Min · '+nacht.punkte+' P · Tag '+nacht.tagId+' · Quelle '+nacht.quelle+' · Bilanz Vortag '+bilVor+' → '+num(hVor.punkteBilanz));
ok('6 der Tipp stoppt die Schlaf-Uhr und bucht die Nacht: 8,5 Std, 100 P', !schlafLaeuft() && nacht.dauerMin===510 && nacht.punkte===100 && nacht.gebucht);
ok('6 … auf das Datum des Einschlafens (Vortag '+MO+'), in dessen Bilanz (+100)', nacht.tagId===tagVor && S.tag.datum===MO && num(hVor.punkteBilanz)===bilVor+100 && num(S.meta.wohlstand)===wVor+100);
ok('6 … erst dann der Aufstehen-Dialog (ohne „Wann eingeschlafen?")', /Wie voll fühlt sich der Akku an\?/.test(dlg) && dlg.indexOf('aufEinschlaf')<0 && /Letzte Nacht: 8:30 Std · 100 P/.test(dlg));
ok('2 (c) trifft nicht zu, (d) auch nicht: die Dauer kommt aus den Zeitstempeln (510 Min)', nacht.dauerMin===Math.round((_RD.parse('2026-09-29T07:30:00+02:00')-_RD.parse('2026-09-28T23:00:00+02:00'))/60000));
uhr('2026-09-29T07:31:10+02:00');   // Dialog ausgefuellt
aufstehenBestaetigenUI();
ok('6 der neue Tag beginnt 07:30 (mit dem Tipp), Datum '+DI, tagOffen() && S.tag.datum===DI && S.tag.startTs===new Date(_RD.parse('2026-09-29T07:30:00+02:00')).toISOString() && S.tag.morgen.aufstehTs===S.tag.startTs);
ok('6 die Nacht zählt nicht noch einmal im neuen Tag', kartePunkteHeute(sk)===0 && S.tag.morgen.schlafMin===510 && S.tag.morgen.schlafPunkte===100);
var x6=syncExport('delta');
ok('2.6 Export: schlaf.letzteGueltigeNacht = die gemessene Nacht, quelle „uhr"', x6.schlaf.letzteGueltigeNacht.quelle==='uhr' && x6.schlaf.letzteGueltigeNacht.dauerMin===510 && x6.schlaf.letzteGueltigeNacht.tagId===tagVor);
ok('3 Export: aufstehen {ts, akku, kommentarClaude, nachtGebucht}', x6.aufstehen && x6.aufstehen.ts===S.tag.startTs && x6.aufstehen.akku===Math.round(num(S.tag.akku)) && x6.aufstehen.kommentarClaude==='' && x6.aufstehen.nachtGebucht===true);
ok('6 Bilanz = Log (neuer Tag)', bilanzGleichLog());

/* ══ Testfall 8 · Aufstehen ohne Schlaf-Uhr ═════════════════════════ */
kopf('Testfall 8 · Aufstehen ohne Schlaf-Uhr → „Wann eingeschlafen?"');
tagMontag();
uhr('2026-09-28T22:45:00+02:00'); abschliessen();
var tag8=S.tag.tagId, bil8=S.tag.punkteBilanz;
uhr('2026-09-29T07:00:00+02:00');
oeffneAufstehen();
ok('8 der Dialog fragt „Wann eingeschlafen?"', /Wann eingeschlafen\?/.test(el('sheetBody').innerHTML) && /id="aufEinschlaf"/.test(el('sheetBody').innerHTML));
el('aufEinschlaf').value=hhmm(_RD.parse('2026-09-28T23:30:00+02:00'));
aufstehenBestaetigenUI();
var n8=schlafZustand().letzte, h8=(S.historie||[]).filter(function(h){ return h.tagId===tag8; })[0];
ok('8 Nacht gebucht: 7,5 Std, 100 P, quelle „nachgefragt", auf dem Vortag', n8.dauerMin===450 && n8.punkte===100 && n8.quelle==='nachgefragt' && n8.tagId===tag8 && num(h8.punkteBilanz)===bil8+100);
ok('8 Export: letzteGueltigeNacht.quelle „nachgefragt", aufstehen.nachtGebucht', syncExport('delta').schlaf.letzteGueltigeNacht.quelle==='nachgefragt' && syncExport('delta').aufstehen.nachtGebucht===true);

/* ══ Testfall 9 · Hinweis für Claude ════════════════════════════════ */
kopf('Testfall 9 · Aufstehen-Dialog mit „Kopf schwer, später starten"');
tagMontag();
uhr('2026-09-28T22:45:00+02:00'); abschliessen();
uhr('2026-09-28T23:10:00+02:00'); leistePlay('k3-schlafen');
uhr('2026-09-29T06:40:00+02:00');
oeffneAufstehen();
var d9=el('sheetBody').innerHTML;
ok('9 unter der Akku-Eingabe ein Textfeld wie im Tagesabschluss, Platzhalter „Hinweis für Claude (optional)"',
   /id="aufAkku"[^>]*><\/div><div class="field"><textarea id="aufKom" style="min-height:54px" placeholder="Hinweis für Claude \(optional\)"><\/textarea><\/div>/.test(d9) &&
   claudeKommentarFeld('abv3Kom','','Kommentar für Claude','')==='<div class="field"><label>Kommentar für Claude</label><textarea id="abv3Kom" style="min-height:54px"></textarea></div>');
el('aufKom').value='Kopf schwer, später starten';
aufstehenBestaetigenUI();
var d=syncExport('delta'), v=syncExport('voll'), md=abschlussMarkdown();
ok('9 Export Delta: aufstehen.kommentarClaude wortgleich', d.aufstehen.kommentarClaude==='Kopf schwer, später starten' && d.aufstehen.nachtGebucht===true);
ok('9 Vollexport und Tagesabschluss-.md tragen es ebenso', v.aufstehen.kommentarClaude==='Kopf schwer, später starten' && md.indexOf('"kommentarClaude": "Kopf schwer, später starten"')>=0);
ok('9 Datenvertrag bleibt 2.0 (Ergänzung)', DATENVERTRAG==='2.1.0' && !syncImport(JSON.stringify(d)).fehler);
// leer ist erlaubt
tagMontag(); uhr('2026-09-28T22:45:00+02:00'); abschliessen(); uhr('2026-09-29T07:00:00+02:00');
oeffneAufstehen(); el('aufEinschlaf').value=''; el('aufKom').value='';   // der DOM-Stub behaelt Felder — im Browser ist das Feld neu
aufstehenBestaetigenUI();
ok('9 leer ist erlaubt: Tag gestartet, kommentarClaude "" und nachtGebucht false', tagOffen() && syncExport('delta').aufstehen.kommentarClaude==='' && syncExport('delta').aufstehen.nachtGebucht===false);

/* ══ §2 · Fehltipp-Regel und Abbrechen ══════════════════════════════ */
kopf('§2 · Fehltipp beim Aufstehen, Dialog abgebrochen');
tagMontag(); uhr('2026-09-28T22:45:00+02:00'); abschliessen();
uhr('2026-09-29T06:55:00+02:00'); leistePlay('k3-schlafen');
uhr('2026-09-29T07:00:00+02:00'); oeffneAufstehen();
ok('2 5 Min „Schlaf": verworfen (Fehltipp-Regel), dann fragt der Dialog nach der Einschlafzeit', !schlafLaeuft() && /Wann eingeschlafen\?/.test(el('sheetBody').innerHTML));
closeSheet(); aufstehenTmp=null;
tagMontag(); uhr('2026-09-28T22:45:00+02:00'); abschliessen();
uhr('2026-09-28T23:00:00+02:00'); leistePlay('k3-schlafen');
uhr('2026-09-29T07:00:00+02:00'); oeffneAufstehen(); closeSheet(); aufstehenTmp=null;   // Abbrechen
var gebucht1=schlafZustand().letzte;
minuten(2); oeffneAufstehen();
ok('2 nach Abbrechen: der nächste Tipp fragt nicht noch einmal, die Nacht bleibt einmal gebucht', el('sheetBody').innerHTML.indexOf('aufEinschlaf')<0 && schlafZustand().letzte===gebucht1 && gebucht1.dauerMin===480);
aufstehenBestaetigenUI();
ok('2 … und „Aufstehen" startet danach den Tag', tagOffen() && S.tag.datum===DI);

/* ══ §1.2 · kein langer Druck mehr ══════════════════════════════════ */
kopf('§1.2 · Auto-Stopp und langer Druck entfernt');
ok('1.2 es gibt keinen Auto-Stopp mehr (uhrAutoStopPruefen entfallen)', typeof uhrAutoStopPruefen==='undefined');
ok('1.2 der lange Druck wirkt nur noch auf „Schließen" im Tagesabschluss', /closest\('\[data-abv3zu\]'\)/.test(src) && !/closest\('\[data-alplay\],\[data-zsplay\]/.test(src));

/* ══ Version ════════════════════════════════════════════════════════ */
kopf('Version');
ok('APP_VERSION 3.4.0, Build 2026-10-02-6', APP_VERSION==='3.8.0' && UI_VERSION==='v3.8.0' && APP_BUILD==='2026-10-05-3');

print('');
if(fails){ print(fails+' von '+n+' FEHLGESCHLAGEN'); throw new Error('Abnahme rot'); }
print('alle '+n+' Abnahmepunkte gruen');
