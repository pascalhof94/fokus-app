/* v3.5.4 §6: die Einstellungen sind klappbare Abschnitte (Standard: alle zu). Diese Suite prueft die INHALTE der Abschnitte
   und liest sie deshalb aufgeklappt; das Klappen selbst prueft die v354-Suite. */
einstAbschnittOffen=function(){ return true; };
/* v3.2.0 §4: eine unbekannte Karte wird nur mit titel, domain und matrixFeld angelegt (sonst
   abgewiesen, nie eine Huelle). Die Pakete dieser Suite stammen aus der Zeit davor und tragen
   domain/matrixFeld nicht immer — der Shim ergaenzt sie NUR fuer unbekannte Karten MIT Titel,
   nach der Altregel (domain fehlt = dfm, matrixFeld fehlt = ziel). Die Regel selbst prueft die
   v3.2-Suite; wo ein Test die Altregel selbst prueft, ruft er syncImportOhneShim. */
var syncImportOhneShim=syncImport;
syncImport=function(text, opt){
  try{ var p=JSON.parse(text), aend=false;
    if(p && !Array.isArray(p) && Array.isArray(p.karten) && !p.wiederherstellung){
      var abl={}; try{ abl=vomGeraetAblage()||{}; }catch(e){}
      p.karten.forEach(function(c){
        if(!c || c.vomGeraet===true || c.titel==null || String(c.titel).trim()==='') return;
        var bek=S.karten.some(function(k){ return (c.id!=null && (k.id===c.id || k.airtableId===c.id)) || (c.airtableId!=null && k.airtableId===c.airtableId); })
          || (c.id!=null && abl[c.id]) || Object.keys(abl).some(function(x){ return abl[x] && abl[x].karte && c.airtableId!=null && abl[x].karte.airtableId===c.airtableId; });
        if(bek) return;
        if(c.domain!=='dfm' && c.domain!=='privat'){ c.domain='dfm'; aend=true; }
        if(c.matrixFeld==null || c.matrixFeld===''){ c.matrixFeld='ziel'; aend=true; }
      });
      if(aend) text=JSON.stringify(p);
    }
  }catch(e){}
  return syncImportOhneShim(text, opt);
};
/* Abnahme v3.0.0 „Routinen-System" — die zwoelf Punkte des Auftrags.
   Punkte, die nur im Browser pruefbar sind (Layout, Tippflaechen, Klicks per
   elementFromPoint), prueft der UI-Harness (tests/ui). */
var fails=0, n=0;
function ok(t,c){ n++; print((c?'OK   ':'FAIL ')+t); if(!c) fails++; }
function kopf(t){ print(''); print('── '+t+' ──'); }
function frisch(){
  _store={}; S.karten=[]; S.unteraufgaben=[]; S.historie=[]; S.intraday=[]; S.routinenGruppen=[];
  S.meta={ wohlstand:0, seeded:true, migration200:true }; S.settings=settingsMerge({});
  S.tag=null; S.fokus=null; S.meta.ketten=null; matrixTmp=null; S.ui.fokusOffen=false;
}
function kid(id){ return S.karten.filter(function(k){ return k.id===id; })[0]; }
function sub(id){ return S.unteraufgaben.filter(function(u){ return u.id===id; })[0]; }
function imp(karten){ var r=syncImport(JSON.stringify({appVersion:'3.0.0', karten:karten})); if(r && r.fehler) print('   IMPORT-FEHLER '+r.fehler); return r; }
function tagEnde(){ S.tag.routinenAuswertung=routinenAuswerten(S.tag.datum, S.tag.abschlussEntscheid||{}); S.tag.endeTs=jetztIso(); }
function tagAm(d){ if(tagOffen()) tagEnde(); tagStarten(70, d); }
function punkte(ts){ return ts.map(function(t){ return t ? t.punkte : null; }); }
function tick(k,m){ var r=[]; for(var i=0;i<m;i++) r.push(routineTick(kid(k))); return r; }
function bilanzGleichLog(){ return Math.round(ohneLaufendeUhr(function(){ return tagesPunkteLive(); })*10)/10===Math.round(logSummeTag()*10)/10; }
var MO='2026-09-28';   // ein Montag
function tagNach(d,n){ return anVorTage(d,-n); }

/* ══ 1 · Staffel-Zahlenbelege ══════════════════════════════════════════ */
kopf('1 · Staffel');
frisch();
imp([
  {id:'kaffee', domain:'privat', titel:'Kaffee', modus:'staffel', staffel:[50,50,0], staffelDanach:-50, immerSichtbar:true, tickMinuten:5},
  {id:'essen', domain:'privat', titel:'Essen', modus:'staffel', staffel:[100], tagesziel:3, tickMinuten:30, rhythmus:{typ:'taeglich'}, abzugOhneStreak:-100},
  {id:'gesicht', domain:'privat', titel:'Gesicht waschen', modus:'staffel', staffel:[50,100,100], staffelDanach:50, rhythmus:{typ:'taeglich'}},
  {id:'zaehne', domain:'privat', titel:'Zähne putzen', modus:'staffel', staffel:[50,100], tageslimit:2, rhythmus:{typ:'taeglich'},
    unteraufgaben:[{id:'zahnseide', titel:'Zahnseide', staffel:[50], tageslimit:1}]} ]);
tagAm(MO);
var tk=tick('kaffee',4);
print('   Kaffee 4 Ticks: '+JSON.stringify(punkte(tk))+' → '+kartePunkteHeute(kid('kaffee')));
ok('1 Kaffee: 50, 50, 0, −50 (Tag 50)', JSON.stringify(punkte(tk))==='[50,50,0,-50]' && kartePunkteHeute(kid('kaffee'))===50);
var te=tick('essen',4);
print('   Essen 4 Ticks: '+JSON.stringify(punkte(te))+' · Ist '+Math.round(heuteInvestiertMin(kid('essen')))+' Min · Tick-Belegzeit '+tickMinHeute(kid('essen'))+' Min · Ziel '+zielText(kid('essen')));
// §7 (v3.7.0): die 30 Min je Tick sind Belegzeit (tickMin) UND werden als Ist-Zeit auf die Karte gebucht
ok('1 Essen: 3 Ticks à 100 erfüllen das Ziel, der 4. bringt weiter 100; jeder Tick belegt 30 Min und bucht sie als Ist-Zeit (§7 v3.7.0)', JSON.stringify(punkte(te))==='[100,100,100,100]' &&
   Math.round(heuteInvestiertMin(kid('essen')))===120 && tickMinHeute(kid('essen'))===120 && zielErreicht(kid('essen')) && zielText(kid('essen'))==='4/3');
var tg=tick('gesicht',4);
ok('1 Gesicht waschen: 50, 100, 100, 50', JSON.stringify(punkte(tg))==='[50,100,100,50]');
var tz=tick('zaehne',3);
print('   Zähne 3 Ticks: '+JSON.stringify(punkte(tz))+' · Status '+kid('zaehne').status);
ok('1 Zähne: 50, 100 — Tageslimit erreicht: ein dritter Tick wird nicht angenommen; die Karte bleibt OFFEN (Status „Ziel erreicht", §7 v3.7.0)', JSON.stringify(punkte(tz))==='[50,100,null]' && kid('zaehne').status==='offen' && kartenStatusHeute(kid('zaehne'))==='zielErreicht');
var z1=unterTick('zahnseide'), z2=unterTick('zahnseide');
ok('1 Zahnseide (Unter-Zähler, einmalig): +50, danach erledigt; zählt zur Karte', z1 && z1.punkte===50 && z2===null && sub('zahnseide').done===true &&
   kartePunkteHeute(kid('zaehne'))===200);
ok('1 Tagesbilanz = Summe des Stunden-Logs', bilanzGleichLog());
/* Essen: Tag mit 2 Ticks ohne Serie → −100 */
tagAm(tagNach(MO,1));
tick('essen',2);
kid('essen').streak=0;
var vorAbzug=Math.round(tagesPunkteDomain('privat'));
tagEnde();
var wE=S.tag.routinenAuswertung.filter(function(x){ return x.id==='essen'; })[0];
print('   Essen 2 Ticks ohne Serie: '+JSON.stringify({ticks:wE.ticks, ziel:wE.ziel, abzug:wE.abzug, grund:wE.grund, streak:wE.streak}));
ok('1 Essen: Tag mit 2 Ticks ohne Serie → −100 im Tagesabschluss', wE.abzug===100 && Math.round(tagesPunkteDomain('privat'))===vorAbzug-100 && bilanzGleichLog());
/* mit Serie: gerissen, aber kein Abzug */
tagStarten(70, tagNach(MO,2)); tick('essen',3); tagEnde();
tagStarten(70, tagNach(MO,3)); tick('essen',1);
var sVor=kid('essen').streak; tagEnde();
var wE2=S.tag.routinenAuswertung.filter(function(x){ return x.id==='essen'; })[0];
ok('1 Essen mit Serie ('+sVor+') verfehlt: Serie reißt, kein Abzug', sVor===1 && wE2.gerissen===true && wE2.abzug===0 && kid('essen').streak===0);

/* ══ 2 · Unter-Zähler ═════════════════════════════════════════════════ */
kopf('2 · Unter-Zähler');
frisch();
imp([
  {id:'linkedin', domain:'dfm', titel:'LinkedIn', modus:'zeit', zeitziel:30, rhythmus:{typ:'taeglich'}, ausnahmeTage:['Sa'],
    unteraufgaben:[{id:'lead', titel:'Lead eingepflegt', staffel:[50]}, {id:'nachricht', titel:'Nachricht an Lead', staffel:[80], tagesziel:3}, {id:'airtable', titel:'Airtable', staffel:[50]}]},
  {id:'adhs', domain:'privat', titel:'ADHS-Erholung', modus:'zeit', zeitziel:120, matrixFeld:'werkzeug', akkuLadung:0.25, rhythmus:{typ:'taeglich'},
    unteraufgaben:[{id:'nebel', titel:'Vernebelung', staffel:[-100,-100,-100,-100], staffelDanach:-150},
                   {id:'kopf', titel:'Kopf befreien', staffel:[20,20,20,20,-20,-20,-20,-20], staffelDanach:-100}]} ]);
tagAm(MO);
var nr=[unterTick('nachricht'),unterTick('nachricht'),unterTick('nachricht')];
print('   Nachricht an Lead 3×: '+JSON.stringify(punkte(nr))+' · Zähler '+zielText(sub('nachricht')));
ok('2 LinkedIn „Nachricht an Lead" 3× → 240, Zähler 3/3', staffelPunkteHeute(sub('nachricht'))===240 && zielText(sub('nachricht'))==='3/3');
ok('2 … die Karte muss dafür nicht laufen und bekommt die 240', !S.fokus && kartePunkteHeute(kid('linkedin'))===240);
var kb=[]; for(var i=0;i<9;i++) kb.push(unterTick('kopf'));
print('   Kopf befreien Tick 1–9: '+JSON.stringify(punkte(kb)));
ok('2 ADHS „Kopf befreien" Tick 1–9 → +20 ×4, −20 ×4, −100', JSON.stringify(punkte(kb))==='[20,20,20,20,-20,-20,-20,-20,-100]');
var exU=syncExport('delta').karten.filter(function(k){ return k.id==='adhs'; })[0].unteraufgaben.filter(function(u){ return u.id==='kopf'; })[0];
print('   Export Unter-Zähler: '+JSON.stringify({titel:exU.titel, punkteHeute:exU.punkteHeute, ziel:exU.ziel, tickProtokoll:exU.tickProtokoll.slice(0,2).map(function(t){ return {ts:'…', nr:t.nr, punkte:t.punkte}; })}));
ok('2 Punkte je Unter-Zähler im Export, jeder Tick mit Zeitstempel', exU.punkteHeute===-100 && exU.tickProtokoll.length===9 && exU.tickProtokoll.every(function(t){ return /^\d{4}-\d{2}-\d{2}T/.test(t.ts); }));
ok('2 Unter-Zähler bringen keinen Unteraufgaben-Bonus (100) obendrauf', subBonusErreicht(kid('linkedin'))===0);

/* ══ 3 · Serien-Regeln ═══════════════════════════════════════════════ */
kopf('3 · Serien');
frisch();
imp([
  {id:'duschen', domain:'privat', titel:'Duschen', modus:'staffel', staffel:[50], tageslimit:1, rhythmus:{typ:'alleNTage', n:2}, gruppePflicht:'Bad'},
  {id:'haare', domain:'privat', titel:'Haare machen', modus:'staffel', staffel:[50], tageslimit:1, immerSichtbar:true, gruppePflicht:'Bad'},
  {id:'whatsapp', domain:'dfm', titel:'WhatsApp', modus:'staffel', staffel:[50], rhythmus:{typ:'taeglich'}, ausnahmeTage:['Sa'], immerSichtbar:true},
  {id:'bad', domain:'privat', titel:'Bad putzen', modus:'staffel', staffel:[300], tageslimit:1, rhythmus:{typ:'wochenende'}, streakToleranz:10, abzugJeTagUeberfaellig:100},
  {id:'runde', domain:'privat', titel:'Katzenklo', modus:'staffel', staffel:[100], tageslimit:1, rhythmus:{typ:'alleNTage', n:2}, immerSichtbar:true, serienfaktor:true} ]);
var plan=[ // Tag 0 = Mo 28.09.
  {d:0, t:['duschen','whatsapp','runde']},
  {d:1, t:['haare','whatsapp','runde']},
  {d:2, t:['duschen','whatsapp','runde']},
  {d:3, t:['whatsapp','runde']},
  {d:4, t:['whatsapp','runde']},
  {d:5, t:['bad','runde']},               // Sa: WhatsApp frei, Bad geputzt
  {d:6, t:['whatsapp','runde']},          // So
  {d:7, t:[]} ];
var serieVerlauf={};
plan.forEach(function(p){
  tagAm(tagNach(MO,p.d));
  p.t.forEach(function(id){ var t=routineTick(kid(id)); if(id==='runde') (serieVerlauf.runde=serieVerlauf.runde||[]).push(t?t.faktor:null); });
  tagEnde();
  ['duschen','whatsapp'].forEach(function(id){ (serieVerlauf[id]=serieVerlauf[id]||[]).push(kid(id).streak); });
  (serieVerlauf.gruppe=serieVerlauf.gruppe||[]).push(S.meta.gruppenPflicht.Bad.streak);
});
print('   Serie Duschen (alle 2 Tage):   '+serieVerlauf.duschen.join(' · '));
print('   Serie Haare ODER Duschen:      '+serieVerlauf.gruppe.join(' · '));
print('   Serie WhatsApp (ohne Samstag): '+serieVerlauf.whatsapp.join(' · '));
print('   Serienfaktor Katzenklo:        '+serieVerlauf.runde.join(' · '));
ok('3 Duschen alle 2 Tage: Mo ✓, Di frei (Serie hält), Mi ✓, Do frei, Fr ohne → gerissen', serieVerlauf.duschen.slice(0,5).join(',')==='1,1,2,2,0');
ok('3 Haare ODER Duschen: Mo Duschen, Di Haare, Mi Duschen → Gruppe 3; Do ohne beides → gerissen', serieVerlauf.gruppe.slice(0,4).join(',')==='1,2,3,0');
ok('3 WhatsApp ohne Samstag: Sa neutral, So weiter (6), Mo ohne → gerissen', serieVerlauf.whatsapp.join(',')==='1,2,3,4,5,5,6,0');
ok('3 Serienfaktor Katzenklo (alle 2 Tage, täglich erledigt): 1,0 → +0,2 je Tag bis 2,0', serieVerlauf.runde.join(',')==='1,1.2,1.4,1.6,1.8,2,2');
tagAm(tagNach(MO,11)); var tR=routineTick(kid('runde'));
print('   Katzenklo nach 4 Tagen Pause: Faktor '+tR.faktor+' · '+tR.punkte+' P');
ok('3 Rückfall: mehr ausgelassen als der Rhythmus erlaubt → ×1,0', tR.faktor===1 && tR.punkte===100);
/* Bad putzen: Sa 03.10. geputzt, das naechste Wochenende nicht */
var bad=[];
for(var d=12; d<=16; d++){ tagAm(tagNach(MO,d)); tagEnde();
  bad.push(tagNach(MO,d).slice(8)+'.'+tagNach(MO,d).slice(5,7)+'. '+['Mo','Di','Mi','Do','Fr','Sa','So'][wochentagNr(tagNach(MO,d))-1]+' Serie '+kid('bad').streak+' Abzug '+((S.tag.routinenAuswertung.filter(function(x){ return x.id==='bad'; })[0]||{}).abzug)); }
print('   Bad putzen (geputzt Sa 03.10.): '+bad.join(' · '));
ok('3 Bad putzen: nächstes Wochenende nicht geputzt → ab Montag −100 je Tag; die Serie hält 10 Tage Toleranz, am 10. Tag reißt sie',
   /Sa Serie 1 Abzug 0$/.test(bad[0]) && /So Serie 1 Abzug 0$/.test(bad[1]) && /Mo Serie 1 Abzug 100$/.test(bad[2]) && /Di Serie 0 Abzug 100$/.test(bad[3]) && /Mi Serie 0 Abzug 100$/.test(bad[4]));

/* ══ 4 · Folgekarte ══════════════════════════════════════════════════ */
kopf('4 · Folgekarte');
frisch();
imp([{id:'wm', domain:'privat', titel:'Waschmaschine anstellen', modus:'staffel', staffel:[100], tageslimit:1, rhythmus:{typ:'alleNTage', n:3}, immerSichtbar:true, serienfaktor:true,
  folgekarte:{titel:'Wäsche ausräumen', wert:100, abzugJeTagUeberfaellig:-50}}]);
tagAm(MO);
routineTick(kid('wm'));
ok('4 (§7 v3.7.0) das Tageslimit schliesst die Karte nicht mehr — die Folgekarte kommt erst mit ✓', kid('wm').status==='offen' && !S.karten.some(function(k){ return k.folgeVon==='wm'; }));
routineErledigen(kid('wm'));   // ✓
var fk=S.karten.filter(function(k){ return k.folgeVon==='wm'; })[0];
print('   Folgekarte: '+JSON.stringify({titel:fk&&fk.titel, faelligkeit:fk&&fk.faelligkeit, staffel:fk&&fk.staffel, abzugJeTagUeberfaellig:fk&&fk.abzugJeTagUeberfaellig}));
ok('4 Waschmaschine → „Wäsche ausräumen", Deadline morgen, 100, −50 je Tag danach', fk && fk.titel==='Wäsche ausräumen' && fk.faelligkeit===tagNach(MO,1) &&
   JSON.stringify(fk.staffel)==='[100]' && fk.abzugJeTagUeberfaellig===50 && fk.tageslimit===1);
ok('4 die Folgekarte steht schon heute in der Routinen-Leiste', routineHeuteSichtbar(fk));
tagEnde(); tagAm(tagNach(MO,1)); tagEnde();
var a1=(S.tag.routinenAuswertung.filter(function(x){ return x.id===fk.id; })[0]||{}).abzug;
tagAm(tagNach(MO,2)); tagEnde();
var a2=(S.tag.routinenAuswertung.filter(function(x){ return x.id===fk.id; })[0]||{}).abzug;
tagAm(tagNach(MO,3)); tagEnde();
var a3=(S.tag.routinenAuswertung.filter(function(x){ return x.id===fk.id; })[0]||{}).abzug;
print('   Abzug am Fälligkeitstag / Tag danach / zwei Tage danach: '+a1+' / '+a2+' / '+a3);
ok('4 am Fälligkeitstag kein Abzug, danach −50 je Tag', a1===0 && a2===50 && a3===50);
tagAm(tagNach(MO,4)); routineTick(fk=kid(fk.id)); routineErledigen(fk); tagEnde();   // §7 (v3.7.0): Tick + ✓
ok('4 ausgeräumt: erledigt, kein Abzug mehr', fk.status==='erledigt' && (S.tag.routinenAuswertung.filter(function(x){ return x.id===fk.id; })[0]||{abzug:0}).abzug===0);

/* ══ 10 · Privates Tagesziel ═════════════════════════════════════════ */
kopf('10 · Privates Tagesziel');
frisch();
S.tag=neuerTag(MO,1);
ok('10 ohne Karten im Routinen-System gilt der eingestellte Wert', privatZielDynamisch(MO)===num(S.settings.tagesZielPrivat));
imp([
  {id:'auf', domain:'privat', titel:'Aufstehen und in den Tag starten', rolle:'aufstehen', modus:'pflicht', pflichtWert:25, tageslimit:1, rhythmus:{typ:'taeglich'}},
  {id:'ab', domain:'privat', titel:'Tagesabschluss', rolle:'tagesabschluss', modus:'pflicht', pflichtWert:50, tageslimit:1, rhythmus:{typ:'taeglich'}},
  {id:'schlaf', domain:'privat', titel:'Schlafen', rolle:'schlafen', modus:'staffel', rhythmus:{typ:'taeglich'}},
  {id:'katzen', domain:'privat', titel:'Katzen füttern', modus:'staffel', staffel:[50], tagesziel:3, rhythmus:{typ:'taeglich'}},
  {id:'kaffee', domain:'privat', titel:'Kaffee', modus:'staffel', staffel:[50,50,0], staffelDanach:-50, rhythmus:{typ:'taeglich'}},
  {id:'essen', domain:'privat', titel:'Essen', modus:'staffel', staffel:[100], tagesziel:3, rhythmus:{typ:'taeglich'}},
  {id:'zaehne', domain:'privat', titel:'Zähne putzen', modus:'staffel', staffel:[50,100], tageslimit:2, rhythmus:{typ:'taeglich'},
    unteraufgaben:[{id:'zs', titel:'Zahnseide', staffel:[50], tageslimit:1}]},
  {id:'runde', domain:'privat', titel:'Geschirr', modus:'staffel', staffel:[100], tageslimit:1, rhythmus:{typ:'alleNTage', n:2}, serienfaktor:true, serienFaktor:1.4, korrektur:true},   // v3.1: Stand-Felder nur mit korrektur:true
  {id:'bad', domain:'privat', titel:'Bad putzen', modus:'staffel', staffel:[300], tageslimit:1, rhythmus:{typ:'wochenende'}},
  {id:'mails', domain:'dfm', titel:'Mails & Post', modus:'staffel', staffel:[100,60], staffelDanach:50, rhythmus:{typ:'wochentage', tage:[1,2,3,4,5]}} ]);
var teile=['auf','ab','schlaf','katzen','kaffee','essen','zaehne','runde'].map(function(id){ return id+' '+Math.round(routineMaxPunkte(kid(id))); });
print('   fällig am Montag: '+teile.join(' · ')+' (Bad putzen am Wochenende, Mails sind DFM) + 750');
ok('10 Ziel privat = 25 + 50 + 100 + 150 + 100 + 300 + (150 + 50) + 100 × 1,4 + 750 = 1.815', privatZielDynamisch(MO)===1815);
ok('10 DFM bleibt 5.000', tagesZielDomain('dfm')===5000);

/* ══ 5 · Routinen-Leiste ══════════════════════════════════════════════ */
kopf('5 · Routinen-Leiste');
frisch();
imp([
  {id:'auf', domain:'privat', titel:'Aufstehen und in den Tag starten', rolle:'aufstehen', modus:'pflicht', pflichtWert:25, tageslimit:1, rhythmus:{typ:'taeglich'}},
  {id:'ab', domain:'privat', titel:'Tagesabschluss', rolle:'tagesabschluss', modus:'pflicht', pflichtWert:50, tageslimit:1, rhythmus:{typ:'taeglich'}},
  {id:'schlaf', domain:'privat', titel:'Schlafen', rolle:'schlafen', modus:'staffel', rhythmus:{typ:'taeglich'}},
  {id:'toilette', domain:'privat', titel:'Toilette', modus:'pflicht', pflichtWert:50, pflichtDeckel:30, pflichtAbzug:10, pflichtMin:-20, rhythmus:{typ:'taeglich'}},
  {id:'zaehne', domain:'privat', titel:'Zähne putzen', modus:'staffel', staffel:[50,100], tageslimit:2, rhythmus:{typ:'taeglich'},
    unteraufgaben:[{id:'zahnseide', titel:'Zahnseide', staffel:[50], tageslimit:1}]},
  {id:'mails', domain:'dfm', titel:'Mails & Post', modus:'staffel', staffel:[100,60], staffelDanach:50, rhythmus:{typ:'taeglich'},
    unteraufgaben:[{id:'m1', titel:'Post öffnen/sortieren', staffel:[50]}, {id:'m2', titel:'Dokumente einscannen', staffel:[50]}]},
  {id:'aufgabe', domain:'dfm', titel:'Angebot Kaiser', sollMin:60, faelligkeit:MO} ]);
S.karten.forEach(function(k){ if(!k.faelligkeit) k.faelligkeit=MO; });
tagStarten(70, MO);
ketteSetzen(['toilette','zaehne','mails','aufgabe']);
var lk=abhakLeisteKarten().map(function(k){ return k.id; });
print('   Leiste: '+lk.join(' · '));
ok('5 nur Routinen und Counter (DFM und privat), keine Aufgabe', lk.indexOf('aufgabe')<0 && lk.indexOf('mails')>=0 && lk.indexOf('zaehne')>=0);
ok('5 Aufstehen zuerst, Tagesabschluss und Schlafen zuletzt, dazwischen in Kettenfolge (feste Reihenfolge per Paket)', lk.join(',')==='auf,toilette,zaehne,mails,ab,schlaf');
var lh=abhakLeisteHtml();
ok('5 drei Felder je Zeile: ▶/⏸ · +1 · Zähler', /data-alplay="zaehne"/.test(lh) && /data-alcheck="zaehne"/.test(lh) && /data-alzahl="zaehne"[^>]*>0\/2 ▾</.test(lh));
S.ui.alOffen={zaehne:true}; lh=abhakLeisteHtml();
ok('5 der Zähler klappt die Unter-Zähler auf — eingerückt, eigener +1', /al-sub[\s\S]*Zahnseide[\s\S]*data-alsub="zahnseide"/.test(lh));
routineTick(kid('zaehne')); routineTick(kid('zaehne'));
lk=abhakLeisteKarten().map(function(k){ return k.id; });
// §7 (v3.7.0): das Tageslimit schliesst nicht mehr — „Ziel erreicht", offen; ✓ schliesst
ok('5 (§7 v3.7.0) Tageslimit erreicht → Karte bleibt offen mit Status „Ziel erreicht"', kid('zaehne').status==='offen' && kartenStatusHeute(kid('zaehne'))==='zielErreicht');
routineErledigen(kid('zaehne')); lk=abhakLeisteKarten().map(function(k){ return k.id; });
ok('5 nach ✓: erledigt → ✓ ans Ende seines Blocks, nicht grau (v3.4 §1.4)', !/al-z[^"]* fertig[^"]*" [^>]*data-alkarte="zaehne"/.test(abhakLeisteHtml()) && /data-alkarte="zaehne"[^>]*>(?:(?!data-alkarte=)[\s\S])*al-ok/.test(abhakLeisteHtml()) && lk.indexOf('zaehne')>lk.indexOf('mails'));
ok('5 Zähler zeigt „2/2" bei Tageslimit, Tagesziel „n/Ziel"', zielText(kid('zaehne'))==='2/2');

/* ══ 6 · Tagesstart ═══════════════════════════════════════════════════ */
kopf('6 · Tagesstart');
ok('6 der Priorisierungs-Knopf ist weg: „Tag starten" öffnet „Aufstehen"', (function(){ S.tag.endeTs=jetztIso(); oeffneTagStart(); var h=el('sheetBody').innerHTML, t=el('sheetTitel').textContent;
  closeSheet(); return /Aufstehen/.test(t) && /Wie voll fühlt sich der Akku an/.test(h) && h.indexOf('tsprio')<0; })());
/* Schlaf gestern Abend 23:00 → Aufstehen */
frisch();
imp([
  {id:'auf', domain:'privat', titel:'Aufstehen und in den Tag starten', rolle:'aufstehen', modus:'pflicht', pflichtWert:25, tageslimit:1, rhythmus:{typ:'taeglich'}},
  {id:'schlaf', domain:'privat', titel:'Schlafen', rolle:'schlafen', modus:'staffel', rhythmus:{typ:'taeglich'}} ]);
S.tag=neuerTag(anVorTage(MO,1),1); S.tag.endeTs=jetztIso();
var z=schlafZustand(); z.schuldStd=0;
z.laeuft={ startTs:new Date(Date.now()-7*3600000).toISOString(), abendAkku:5 };
kid('schlaf').nachtnotiz='Zweimal wach, Kopf voll von der Präsentation';
var prog=aufstehenPrognose();
var m=aufstehenBestaetigen(65);
print('   Morgen: '+JSON.stringify({akkuPrognose:m.akkuPrognose, akkuGefuehl:m.akkuGefuehl, abweichung:m.abweichung, schlafMin:m.schlafMin, schlafPunkte:m.schlafPunkte, nachtnotiz:m.nachtnotiz}));
ok('6 „Aufstehen" setzt die Aufstehzeit, startet den Tag, fragt den Akku (vorbelegt mit der Schlaf-Prognose)', tagOffen() && !!m.aufstehTs && m.akkuPrognose===prog && prog===Math.round(5+7*12) && S.tag.akku===65);
ok('6 die Abweichung Prognose ↔ Gefühl geht in den Export', syncExport('delta').tagesabschluss.morgen.abweichung===65-prog);
ok('6 die Aufstehen-Karte bucht ihren Wert (Pflicht 25) und ist erledigt', kartePunkteHeute(kid('auf'))===25 && kid('auf').status==='erledigt');

/* ══ 8 · Schlafen ═════════════════════════════════════════════════════ */
kopf('8 · Schlafen');
ok('8 Punkte nach Stufen: 7 Std → 100 (zählt zum neuen Tag)', m.schlafPunkte===100 && kartePunkteHeute(kid('schlaf'))===100 && bilanzGleichLog());
ok('8 Stufen: ≥7 → 100 · 6–7 → 70 · 5–6 → 30 · <5 → 0 · 12 Std → 100 (kein Abzug)', schlafPunkte(7)===100 && schlafPunkte(6.5)===70 && schlafPunkte(5.2)===30 && schlafPunkte(4.9)===0 && schlafPunkte(12)===100);
ok('8 die Nachtnotiz reist mit der Nacht (und das Feld ist wieder leer)', m.nachtnotiz==='Zweimal wach, Kopf voll von der Präsentation' && kid('schlaf').nachtnotiz==='');
/* Schlafschuld: 5 Std → +2, danach 9 Std → −2 */
function nacht(std, abend){ var z=schlafZustand(); z.laeuft={ startTs:new Date(Date.now()-std*3600000).toISOString(), abendAkku:abend }; return schlafStoppen(); }
z=schlafZustand(); z.schuldStd=0;
var n1=nacht(5, 40), s1=z.schuldStd, n2=nacht(9, 40), s2=z.schuldStd;
print('   Schlafschuld: 5 Std → '+s1+' Std · danach 9 Std → '+s2+' Std · Punkte '+n1.punkte+' / '+n2.punkte);
ok('8 Schlafschuld: 5 Std (30 P) → 2 Std Schuld; eine lange Nacht (9 Std, 100 P) baut sie ab → 0', s1===2 && s2===0 && n1.punkte===30 && n2.punkte===100);
z.schuldStd=3;
var pr=schlafPrognose(20, new Date(2026,8,28,22,0,0).getTime());
print('   Prognose (Abendakku 20 %, Schuld 3 Std, Start 22:00): '+JSON.stringify(pr));
ok('8 Prognose: für 100 % braucht es (80 + 3×5) ÷ 12 = 7,9 Std → bis 05:55; Aufstehen 08:00 → 100 %', pr.brauchtStd===7.9 && belUhr(kalStunde(pr.bisTs))==='05:55' && pr.akkuBeiAufstehen===100);
var pr2=schlafPrognose(20, new Date(2026,8,29,1,0,0).getTime());
ok('8 Prognose spät (01:00): Aufstehen 08:00 → 20 + 7×12 − 15 = 89 %', pr2.akkuBeiAufstehen===89);

/* ══ 7 · Tagesabschluss ═══════════════════════════════════════════════ */
kopf('7 · Tagesabschluss');
frisch();
imp([
  {id:'ab', domain:'privat', titel:'Tagesabschluss', rolle:'tagesabschluss', modus:'pflicht', pflichtWert:50, tageslimit:1, rhythmus:{typ:'taeglich'}},
  {id:'schlaf', domain:'privat', titel:'Schlafen', rolle:'schlafen', modus:'staffel', rhythmus:{typ:'taeglich'}},
  {id:'essen', domain:'privat', titel:'Essen', modus:'staffel', staffel:[100], tagesziel:3, tickMinuten:30, rhythmus:{typ:'taeglich'}, abzugOhneStreak:100},
  {id:'katzen', domain:'privat', titel:'Katzen füttern', modus:'staffel', staffel:[50], tagesziel:3, rhythmus:{typ:'taeglich'}},
  {id:'a1', domain:'dfm', titel:'Angebot Kaiser', sollMin:30, faelligkeit:MO},
  {id:'a2', domain:'privat', titel:'Steuer', sollMin:30, faelligkeit:MO} ]);
tagStarten(70, MO);
tick('essen',2); tick('katzen',3);
oeffneAbschlussV3(1);
var s1h=el('sheetBody').innerHTML;
ok('7 Schritt 1 Reflexion: Akku, drei optionale Fragen, Schlaf-Prognose', /data-abv3feld="akku"/.test(s1h) && /in einem Wort/.test(s1h) && /Energie gegeben/.test(s1h) && /Energie gekostet/.test(s1h) &&
   /Für 100 % Akku bis/.test(s1h) && /Aufstehen um 08:00 → Akku/.test(s1h));
abschlussV3Stand().reflexion={ akku:35, wort:'zäh', energieGegeben:'Spaziergang', energieGekostet:'Mails' };
abv3.schritt=2; renderAbschlussV3();
var s2h=el('sheetBody').innerHTML;
// v3.2.0 §2.1: die Anzahl steht in der Zaehler-Zeile (+1/−1 zum Nachtragen und Korrigieren), dazu ▶/⏸ je Karte
ok('7 Schritt 2: je Karte Zähler (2/3, +1/−1, ▶), Punkte, Serie; offene Ziele mit „überspringen" und „mit Abzug −100"', /Essen<small>200 P · Serie 0/.test(s2h) &&
   /data-zzplus="essen" data-ort="abschluss"/.test(s2h) && /data-zzminus="essen"/.test(s2h) && /data-abv3play="essen"/.test(s2h) && /<span class="zz-n">2\/3<\/span>/.test(s2h) &&
   /data-abv3wahl="essen" data-v="ueberspringen"/.test(s2h) && /data-abv3wahl="essen" data-v="abzug">mit Abzug −100/.test(s2h) && s2h.indexOf('data-abv3wahl="katzen"')<0 && /sonst −100 P/.test(s2h));
abschlussV3Entscheiden('essen','ueberspringen');
abv3.schritt=3; renderAbschlussV3();
var s3h=el('sheetBody').innerHTML;
ok('7 Schritt 3: offene Aufgaben mit „abhaken" und „schieben"', /data-abv3haken="a1"/.test(s3h) && /data-abv3schieb="a2"/.test(s3h));
/* Abhaken läuft durch den normalen Dialog und kehrt zurück */
abv3.aktiv=false; abv3.zurueck=true; abhakDialog('a1', false); abhakDialogConfirm();
ok('7 Abhaken führt zurück in den Abschluss (Schritt 3), nicht in die Suche', kid('a1').status==='erledigt' && abv3.aktiv && abv3.schritt===3 && /Tagesabschluss/.test(el('sheetTitel').textContent));
abschlussV3Schieben('a2', anVorTage(MO,-2), 'Unterlagen fehlen noch', 20);
ok('7 Schieben mit Datum, Kommentar für Claude und Abzug', kid('a2').faelligkeit===anVorTage(MO,-2) && kid('a2').kommentarClaude==='Unterlagen fehlen noch' && S.tag.abschluss.geschoben[0].abzug===20);
abv3.schritt=4; renderAbschlussV3();
var md=abschlussMarkdown(), zeilen1=md.split('\n');
print('   .md Zeile 1: „'+zeilen1[0]+'" · letzte Zeilen: '+JSON.stringify(zeilen1.slice(-3)));
ok('7 Schritt 4: .md mit Datum und Uhrzeit in Zeile 1 und dem vollständigen Export als JSON-Block am Ende', /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(zeilen1[0]) &&
   /```json\n\{[\s\S]*\}\n```\n$/.test(md) && JSON.parse(md.split('```json\n')[1].split('\n```')[0]).tagesabschluss.reflexion.wort==='zäh');
ok('7 Knöpfe Herunterladen und Text kopieren', /data-abv3dl="1"/.test(el('sheetBody').innerHTML) && /data-abv3copy="1"/.test(el('sheetBody').innerHTML));
var ex7=JSON.parse(md.split('```json\n')[1].split('\n```')[0]).tagesabschluss;
print('   Export tagesabschluss: '+JSON.stringify({reflexion:ex7.reflexion, uebersprungen:ex7.uebersprungen, geschoben:ex7.geschoben.map(function(g){ return {titel:g.titel, datum:g.datum, kommentar:g.kommentar, abzug:g.abzug}; }), schlafPrognose:ex7.schlafPrognose}));
ok('7 der Export trägt Reflexion, Übersprungenes und Geschobenes mit Kommentar', ex7.reflexion.energieGekostet==='Mails' && ex7.uebersprungen[0].id==='essen' && ex7.uebersprungen[0].mitAbzug===false && ex7.geschoben[0].kommentar==='Unterlagen fehlen noch');
abschlussV3SchliessenUI();
var wEss=S.historie[S.historie.length-1].routinenAuswertung.filter(function(x){ return x.id==='essen'; })[0];
ok('7 Schließen = Tag abgeschlossen; „Tagesabschluss" hat seine 50 gebucht; übersprungenes Essen ohne Abzug', !tagOffen() && !!S.tag.endeTs && S.historie.length===1 &&
   kartePunkteHeute(kid('ab'))===50 && wEss.abzug===0 && wEss.entscheidung==='ueberspringen');
lh=abhakLeisteHtml();
// v3.2.0 §2.4: nach dem Abschluss bleiben Routinen und Counter bis „Schlafen" buchbar — grau ist nur der Tagesabschluss selbst
ok('7 danach: Routinen bleiben aktiv bis „Schlafen", der Tagesabschluss ist grau', !/class="zs-k al-z[^"]* aus"[^>]*data-alkarte="essen"/.test(lh) && /class="zs-k al-z[^"]* aus"[^>]*data-alkarte="ab"/.test(lh) &&
   !/class="zs-k al-z[^"]* aus"[^>]*data-alkarte="schlaf"/.test(lh) && /Tag abgeschlossen/.test(lh));
ok('7 die Fokusansicht zeigt danach „Schlafen"', S.ui.fokusZeigt==='schlaf' && S.ui.fokusOffen===true);
ok('7 der Abendakku (35 %) steht für die Schlaf-Prognose bereit', schlafZustand().abendAkku===35);

/* ══ 9 · Suche ════════════════════════════════════════════════════════ */
kopf('9 · Suche');
frisch();
S.tag=neuerTag(MO,1);
S.karten=[ neueKarte({id:'r1', domain:'privat', titel:'Katzen', rhythmus:{typ:'taeglich'}, faelligkeit:MO, erstelltTs:'2026-09-20T08:00:00Z'}),
           neueKarte({id:'a1', domain:'dfm', titel:'Angebot', faelligkeit:MO, erstelltTs:'2026-09-25T08:00:00Z'}),
           neueKarte({id:'a2', domain:'privat', titel:'Steuer', faelligkeit:anVorTage(MO,-3), erstelltTs:'2026-09-27T08:00:00Z'}),
           neueKarte({id:'e1', domain:'dfm', titel:'Fertig', status:'erledigt', tagId:aktuelleTagId(), faelligkeit:MO}) ];
renderSuche();
/* §5/§10/§12 (v3.7.0): Filter-Knoepfe und Sortierungen sind entfallen; die Suche ist Suchfeld + Kettenliste mit Sortierung je Gruppe;
   kein automatisches Hochscrollen mehr */
ok('9 (v3.7.0) Filter und Sichten sind versteckt, der Suchkoerper ist die Kettenliste', /id="suFilter"[^>]*hidden/.test(src) && /id="suSichten"[^>]*hidden/.test(src) && el('suBody').innerHTML.indexOf('data-klliste')>=0);
ok('9 (v3.7.0) Sortierungen je Gruppe: Gruppiert · Termin · Ø Erledigungszeit · Priorität, Kette zusaetzlich Kettenreihenfolge', KL_SORT.map(function(x){ return x[0]; }).join(',')==='gruppiert,termin,erledigungszeit,prio' && klSortStandard('kette')==='kette' && klSortStandard('routinen')==='erledigungszeit' && klSortStandard('verlauf')==='prio');
function gIds(g, wahl){ klSortSetzen(g, wahl); var i=kettenListeInhalt({karte:null, filter:''}); var r=[]; i[g].teile.forEach(function(t){ t.karten.forEach(function(k){ if(r.indexOf(k.id)<0) r.push(k.id); }); }); return r.join(','); }
S.ui.navDomain='dfm';
ok('9 Termin: nach Deadline (DFM-Kette: a1 heute)', gIds('kette','termin')==='a1');
S.ui.navDomain='privat';
ok('9 Termin (Privat): nur Katzen (heute faellig) — Steuer in 3 Tagen steht nicht in der Kette', gIds('kette','termin')==='r1');
ok('9 Erledigt heute: nur Erledigtes', gIds('erledigt','prio')==='e1');
var inhS=kettenListeInhalt({karte:null, filter:'katzen'});
ok('9 Suchfeld wirkt auf alle Gruppen: „katzen" → r1 in Kette und Routinen, nichts in Erledigt', inhS.kette.n===1 && inhS.kette.teile[0].karten[0].id==='r1' && inhS.routinen.n===1 && inhS.erledigt.n===0);
klSortSetzen('kette','kette'); S.ui.navDomain='dfm';
ok('9 (§10 v3.7.0) kein automatisches Hochscrollen: nachOben entfallen, Sheet nur beim Oeffnen oben, Tab-Wechsel in setTab',
   !/function nachOben\(/.test(src) && !/nachOben\(\);/.test(src) && /const neu=!sheetOffen\(\);/.test(src) && /if\(neu\)\{ try\{ el\('sheetBody'\)\.scrollTop=0; \}catch\(e\)\{\} \}/.test(src) && /m\.scrollTop=0; \}   \/\/ §9/.test(src));

/* ══ 12 · Version ═════════════════════════════════════════════════════ */
kopf('12 · Version');
ok('12 APP_VERSION 3.7.0 · Datenvertrag 2.0 additiv (Gate ab 2.0)', APP_VERSION==='3.7.6' && VERSION===APP_VERSION && UI_VERSION==='v'+APP_VERSION && !syncImport(JSON.stringify({appVersion:'2.1.0', karten:[{id:'x', titel:'x'}]})).fehler);

kopf('Nachtrag v3.0.1 · eine Versionskonstante');
frisch(); S.tag=neuerTag(MO,1);
var lit=(src.match(new RegExp("'"+APP_VERSION.replace(/\./g,'\\.')+"'",'g'))||[]).length, ex3=syncExport('delta');
renderEinst(); var einst=el('einstBody').innerHTML;
ok('v3.0.1 die Versionszahl steht genau EINMAL im Code (APP_VERSION)', lit===1 && src.indexOf("const APP_VERSION = '"+APP_VERSION+"';")>=0);
ok('v3.0.1 VERSION und UI_VERSION sind Aliase von APP_VERSION', /const VERSION = APP_VERSION;/.test(src) && /const UI_VERSION = 'v'\+APP_VERSION;/.test(src));
ok('v3.0.1 Einstellungen (Info und Fuß) und Export zeigen dieselbe Version', einst.indexOf('Fokus App v'+APP_VERSION+' · Build '+APP_BUILD)>=0 && einst.indexOf('<span>Version</span><b>v'+APP_VERSION+'<')>=0 && ex3.appVersion===APP_VERSION &&
   tagBackupPaket().appVersion===APP_VERSION);
ok('v3.0.1 der Seitentitel liest APP_VERSION, kein fester Titel mehr', /<title>Fokus<\/title>/.test(src) && /document\.title='Fokus '\+UI_VERSION/.test(src) && src.indexOf('Fokus v1')<0);
ok('v3.0.1 die .md des Abschlusses nennt Version und Build', abschlussMarkdown().indexOf('- App: v'+APP_VERSION+' · Build '+APP_BUILD)>=0);
ok('v3.0.1 das Gate prüft gegen DATENVERTRAG (2.1.0 seit v3.5.0), nicht gegen die App-Version', DATENVERTRAG==='2.1.0' && !syncImport(JSON.stringify({appVersion:'2.1.0', karten:[{id:'g', titel:'g'}]})).fehler &&
   /älter als 2\.1\.0/.test(syncImport(JSON.stringify({appVersion:'1.13.5', karten:[{id:'g', titel:'g'}]})).fehler));

/* ══════════════════════════════════════════════════════════════════════
   v3.1.0 „Sync-Tür" — §1 die drei Fehler vom 27.09.
   ══════════════════════════════════════════════════════════════════════ */
kopf('v3.1 §1.1 · keine Prognose, auch ohne modus (die acht Karten vom 27.09.)');
frisch();
var GE=anVorTage(MO,1);
function alt(id, titel, extra){ return neueKarte(Object.assign({id:id, domain:'privat', titel:titel, rhythmus:{typ:'taeglich'}, nurAbhaken:true, matrixFeld:'werkzeug', faelligkeit:GE}, extra||{})); }
S.karten=[
  alt('duschen','Duschen',{pflicht:true, pflichtWert:40, pflichtDeckel:20, pflichtAbzug:10, pflichtMin:0, rhythmus:{typ:'alleNTage', n:2}, sollMin:15}),
  alt('rasieren','Rasieren',{pflicht:true, pflichtWert:20, pflichtDeckel:10, pflichtAbzug:10, pflichtMin:0, rhythmus:{typ:'alleNTage', n:2}, sollMin:5}),
  alt('haare','Haare machen',{pflicht:true, pflichtWert:20, pflichtDeckel:10, pflichtAbzug:10, pflichtMin:0, sollMin:10}),
  alt('fruehstueck','Frühstücken',{sollMin:20}),
  alt('vitamine','Vitamine',{sollMin:10, abhakbonus:15}),
  alt('essenM','Essen machen',{pflicht:true, pflichtWert:40, pflichtDeckel:40, pflichtAbzug:10, pflichtMin:0, sollMin:30}),
  alt('kaffee','Kaffee trinken',{sollMin:5, abhakbonus:25}),
  alt('toilette','Toilette',{pflicht:true, pflichtWert:50, pflichtDeckel:30, pflichtAbzug:10, pflichtMin:-20, sollMin:10}) ];
/* der Stand vom Vortag, wie er vor v2.9.1 gebucht wurde: Werte mit Prognose, zum Teil offen gelassen */
S.tag=neuerTag(GE,1); S.tag.startTs=GE+'T05:00:00.000Z';
var alteWerte={duschen:203, rasieren:140, haare:39, fruehstueck:113, vitamine:143, essenM:95, kaffee:82, toilette:135};
S.karten.forEach(function(k){ k.punkteOverride=alteWerte[k.id]; k.status=(k.id==='fruehstueck'||k.id==='vitamine')?'offen':'erledigt'; k.tagId=(k.status==='erledigt')?S.tag.tagId:null;
  k.zuletztRoutine=GE; k.abschluesse=[{ts:GE+'T08:00:00.000Z', tagId:S.tag.tagId, punkteIstVorher:alteWerte[k.id], istMinVorher:0, bonusPunkte:15, echt:true}]; });
S.tag.endeTs=GE+'T22:00:00.000Z'; S.tag.geschlossenTs=S.tag.endeTs;   // v3.2.0 §2.4 · §6 (v3.7.2): „Aufstehen"/Tagesstart schliesst den Vortag trotzdem endgueltig (Abgleich des Vortags mit seinen Override-Werten — Zeilen mit dem ALTEN tagId)
tagStarten(70, MO);
ok('1.1 der Tagesstart setzt JEDE Routine zurück — auch die heute nicht fälligen (Duschen, Rasieren alle 2 Tage)', S.karten.every(function(k){ return k.status==='offen' && k.punkteOverride===null; }) && !routineFaellig(kid('duschen'), MO));
/* ein Alt-Override, der trotzdem an einer offenen Karte haengt, zaehlt nicht mehr */
kid('fruehstueck').punkteOverride=113;
S.fokus={ karteId:'fruehstueck', laeuft:false, startMs:0, sessionSek:0 }; fokusKarteAnsehen('fruehstueck'); renderAlles();   // angetippt und ausgewählt, nicht gestartet
var aus1=S.intraday.filter(function(e){ return e.typ==='ausgleich' && e.kartenId==='fruehstueck'; });
ok('1.1 Frühstücken antippen: kein Ausgleich, 0 P (vorher 113 aus dem Vortag)', aus1.length===0 && kartenBeitragHeute(kid('fruehstueck'))===0);
kid('fruehstueck').punkteOverride=null;
function uhr(id, min){ fokusStarten(id); S.fokus.startMs=Date.now()-min*60000; fokusZeitEinbuchen(); }
leisteTicken('vitamine'); leisteTicken('kaffee'); leisteTicken('essenM');
uhr('toilette', 12); uhr('toilette', 8);    // zwei Durchgaenge (Neustart nach der Pause > 5 Min)
kid('toilette').durchgang.pauseTs=new Date(Date.now()-10*60000).toISOString(); uhr('toilette', 10);
uhr('duschen', 17); leisteAbhaken('duschen');
uhr('rasieren', 1); leisteAbhaken('rasieren');
uhr('haare', 5); leisteAbhaken('haare');
var werte={}; ['duschen','rasieren','haare','fruehstueck','vitamine','essenM','kaffee','toilette'].forEach(function(id){ werte[id]=Math.round(kartePunkteHeute(kid(id))); });
print('   gebucht: '+JSON.stringify(werte));
ok('1.1 Duschen 17 Min → 40 (Pflicht, vorher 243) · Rasieren 1 Min → 20 (160) · Haare 5 Min → 20 (59)', werte.duschen===40 && werte.rasieren===20 && werte.haare===20);
ok('1.1 Frühstücken 0 (113) · Vitamine 15 (143) · Essen machen 40 (95) · Kaffee trinken 25 (82) · Toilette 2 Durchgänge 100 (135)',
   werte.fruehstueck===0 && werte.vitamine===15 && werte.essenM===40 && werte.kaffee===25 && werte.toilette===100);
renderAlles();
ok('1.1 keine Ausgleich-Zeile des HEUTIGEN Tages trägt eine Prognose — Tagesbilanz = Summe des Logs (§6 v3.7.2: der Vortag wurde beim Start mit seinen Override-Werten abgeglichen)', S.intraday.filter(function(e){ return e.typ==='ausgleich' && e.tagId===S.tag.tagId; }).length===0 && bilanzGleichLog() &&
   Math.round(ohneLaufendeUhr(function(){ return tagesPunkteLive(); }))===40+20+20+0+15+40+25+100);
/* Wieder oeffnen: ein Abschluss vom Vortag bringt seinen Wert nicht zurueck */
var k7=kid('kaffee'); k7.status='erledigt'; k7.tagId=aktuelleTagId(); k7.abschluesse.push({ts:GE+'T09:00:00.000Z', tagId:GE+'-1', punkteIstVorher:82, istMinVorher:0, echt:true});
karteAbhaken('kaffee');
ok('1.1 Wiederöffnen stellt keinen Wert vom Vortag her (82)', !overrideGilt(kid('kaffee')) && kartePunkte(kid('kaffee'))===25);

kopf('v3.1 §1.2 · ein Tick schließt nur bei erreichtem Tageslimit');
frisch(); S.tag=neuerTag(MO,1); S.tag.startTs=MO+'T05:00:00.000Z';
S.karten=[ neueKarte({id:'musik', domain:'privat', titel:'Musik anmachen', rhythmus:{typ:'taeglich'}, ticksAktiv:true, tickWert:10, faelligkeit:MO}),
           neueKarte({id:'musik1', domain:'privat', titel:'Musik anmachen (Tageslimit 1)', rhythmus:{typ:'taeglich'}, ticksAktiv:true, tickWert:10, tageslimit:1, faelligkeit:MO}),
           neueKarte({id:'zaehneAlt', domain:'privat', titel:'Zähne putzen (ohne modus, ohne Ticks)', rhythmus:{typ:'taeglich'}, abhakbonus:25, faelligkeit:MO}),
           neueKarte({id:'musikV3', domain:'privat', titel:'Musik (modus staffel, ohne Limit)', modus:'staffel', staffel:[10], rhythmus:{typ:'taeglich'}, faelligkeit:MO}) ];
leisteTicken('musik'); leisteTicken('musik'); leisteTicken('musik1'); leisteTicken('zaehneAlt'); leisteTicken('musikV3');
print('   Status: '+['musik','musik1','zaehneAlt','musikV3'].map(function(id){ return id+' '+kid(id).status+' ('+kid(id).ticksHeute+'×)'; }).join(' · '));
ok('1.2 „Musik anmachen" (Rhythmus + Ticks, ohne Tageslimit): 2× +1 → offen (vorher: abgehakt)', kid('musik').status==='offen' && kid('musik').ticksHeute===2);
ok('1.2 mit Tageslimit 1: +1 → Limit erreicht, Karte bleibt offen mit Status „Ziel erreicht" (§7 v3.7.0)', kid('musik1').status==='offen' && kartenStatusHeute(kid('musik1'))==='zielErreicht');
ok('1.2 alte Routine ohne Ticks: +1 → offen, bucht den Abhakbonus, zählt als heute erledigt (Serie)', kid('zaehneAlt').status==='offen' && Math.round(kartePunkteHeute(kid('zaehneAlt')))===25 && routErledigtHeute(kid('zaehneAlt')) && kid('zaehneAlt').streak===1);
ok('1.2 Staffel ohne Tageslimit: offen', kid('musikV3').status==='offen');

kopf('v3.1 §1.3 · Routinen und Counter erzeugen keine Folgekarten');
frisch(); S.tag=neuerTag(MO,1);
S.karten=[ neueKarte({id:'zp', domain:'privat', titel:'Zähne putzen', rhythmus:{typ:'taeglich'}, faelligkeit:MO}),
           neueKarte({id:'ds', domain:'privat', titel:'Duschen', rhythmus:{typ:'alleNTage', n:2}, faelligkeit:MO}) ];
S.unteraufgaben=[neueUnteraufgabe('zp',{id:'zs1', titel:'Zahnseide'}), neueUnteraufgabe('ds',{id:'ds1', titel:'Haare waschen'})];
var vor=S.karten.length;
abhakDialog('zp', false); var folgeZp=abhakTmp.folge; abhakDialogConfirm();
abhakDialog('ds', false); abhakDialogConfirm();
fokusStarten('zp');
ok('1.3 Erledigen von „Zähne putzen" und „Duschen" (mit offener Unteraufgabe) erzeugt keine Karte', folgeZp===false && S.karten.length===vor &&
   !S.karten.some(function(k){ return k.vorgaengerAppId; }) && kid('zp').status==='erledigt');
ok('1.3 der Abhak-Dialog bietet bei Routinen keine Folgeaufgabe an', (function(){ kid('ds').status='offen'; abhakDialog('ds', false); var h=el('sheetBody').innerHTML; closeSheet(); abhakTmp=null; return h.indexOf('data-abfolge')<0; })());
ok('1.3 ▶ auf einer erledigten Routine legt keine Dublette an', S.karten.length===vor);

/* ══ v3.1 §2–§6 · Sync-Tür ═════════════════════════════════════════════ */
kopf('v3.1 §2/§6 · einstellungen per Paket — erst Zusammenfassung, dann Übernehmen');
frisch(); S.tag=neuerTag(MO,1);
var paketE={ appVersion:'3.1.0', einstellungen:{ grund:'im Chat am 27.09. besprochen',
  ziele:{ privat:{basis:'routinen', plus:750}, grund:'Ziel aus den fälligen Routinen' },
  abhakbonus:{ aufgabe:{ werkzeug:180 } },
  schlaf:{ bedarfStd:7.5 },
  punkte:{ basisDfm:200, farbe:'blau' },
  quatsch:{ x:1 } } };
var vorS=JSON.stringify(S.settings);
var r1=syncImport(JSON.stringify(paketE));
var vs=r1.vorschau.einstellungen;
print('   Vorschau: '+vs.aenderungen.map(function(a){ return a.bereich+'.'+a.feld+' '+kurz(a.vorher)+' → '+kurz(a.nachher); }).join(' | ')+' · unbekannt '+vs.unbekannt.join(', '));
ok('§6 ohne „Übernehmen" ändert das Paket nichts, es kommt eine Zusammenfassung zurück', r1.freigabeNoetig===true && JSON.stringify(S.settings)===vorS && vs.aenderungen.length===4);
ok('§6 unbekannte Felder werden gemeldet (einstellungen.quatsch, punkte.farbe)', vs.unbekannt.indexOf('einstellungen.quatsch')>=0 && vs.unbekannt.indexOf('einstellungen.punkte.farbe')>=0);
oeffneSyncFreigabe(JSON.stringify(paketE), r1.vorschau, 'einst');
var fh=el('sheetBody').innerHTML;
ok('§6 die Zusammenfassung nennt Bereich, Feld, vorher → nachher und hat „Übernehmen"', /ziele\.privat/.test(fh) && /schlaf\.bedarfStd/.test(fh) && /7 → 7\.5/.test(fh) && /data-freigabego/.test(el('sheetFoot').innerHTML));
var r2=syncFreigabeAnwenden();
ok('§4 nach „Übernehmen": privat = Routinen + 750, Abhakbonus Aufgabe/Werkzeug 180, Schlafbedarf 7,5, Grundrate DFM 200',
   S.settings.tagesZielPrivatModus==='routinen' && S.settings.tagesZielPrivatSockel===750 && S.settings.abhakbonusTabelle.aufgabe.werkzeug===180 &&
   S.settings.schlafBedarfStd===7.5 && S.settings.basisProStdDfm===200 && r2.tuer.einstellungen===4);
ok('§6 vorher wurde gesichert', !!DB.get('import_bak',null) && DB.get('import_bak',{}).settings.schlafBedarfStd===7);
var pe=(S.meta.korrekturProtokoll||[]).filter(function(e){ return e.art==='einstellungen'; });
print('   Protokoll: '+pe.map(function(e){ return e.bereich+' · '+e.grund+' · '+e.aenderungen.join(' / '); }).join(' ‖ '));
ok('§5 jede Änderung steht im Protokoll — mit Grund aus dem Paket und vorher/nachher', pe.length===4 && pe.some(function(e){ return e.bereich==='ziele' && e.grund==='Ziel aus den fälligen Routinen'; }) &&
   pe.some(function(e){ return e.bereich==='schlaf' && e.grund==='im Chat am 27.09. besprochen' && /schlaf\.bedarfStd: 7 → 7\.5/.test(e.aenderungen[0]); }));
syncImport(JSON.stringify({appVersion:'3.1.0', einstellungen:{ schlaf:{ bedarfStd:null } }}), {freigabe:true});
ok('§6 null setzt auf den Standard (Schlafbedarf 7), ein fehlendes Feld ändert nichts', S.settings.schlafBedarfStd===7 && S.settings.basisProStdDfm===200);
var rF=syncImport(JSON.stringify({appVersion:'3.1.0', einstellungen:{ daempfung:{ privat:3 } }}));
ok('§6 ungültige Werte werden abgewiesen (Dämpfung 3 > 1)', rF.vorschau.einstellungen.fehler.length===1 && /größer als 1/.test(rF.vorschau.einstellungen.fehler[0].grund));
syncImport(JSON.stringify({appVersion:'3.1.0', einstellungen:{ ziele:{ weModus:'getrennt' }, erholung:{ zeitzielMin:90 }, tagesabschluss:{ abzugStandard:30, fragen:['Ein Wort?','Plus?','Minus?'] },
  tagesstruktur:{ bloecke:[{name:'Morgen', minMin:60, maxMin:90, typ:'privat'},{name:'DFM-Fokus 1', minMin:180, maxMin:240, typ:'dfm'}] } }}), {freigabe:true});
var kE=neueKarte({id:'erh', domain:'privat', titel:'ADHS-Erholung', modus:'zeit', rolle:'erholung', rhythmus:{typ:'taeglich'}}); S.karten.push(kE);
ok('§2 Erholung (rolle „erholung"): Zeitziel 90 und Akku 30 %/120 Min aus den Einstellungen', zeitzielVon(kE)===90 && akkuRate(kE)===15 && zielText(kE)==='0/90′');
ok('§2 Tagesabschluss: Reflexionsfragen und Standard-Abzug aus den Einstellungen', reflexionsFrage(0)==='Ein Wort?' && S.settings.abschlussAbzugStandard===30);
ok('§2 Wochenende getrennt: der Sonntag zählt den Samstag nicht mit', S.settings.weModus==='getrennt' && /weModus==='getrennt'\) return s;/.test(src));
renderEinst();
ok('§2 Tagesstruktur wird gezeigt; alle Parameter haben ein Eingabefeld (auch Grundrate, Zeit-Gewicht, Matrix-Faktoren)', /DFM-Fokus 1[\s\S]*180–240 Min/.test(el('einstBody').innerHTML) &&
   /data-tuer="einstellungen\|punkte\|matrixFaktoren\|werkzeug"/.test(el('einstBody').innerHTML) && /data-tuer="einstellungen\|punkte\|basisDfm"/.test(el('einstBody').innerHTML) &&
   /data-tuer="statistik\|ampel\|gruen"/.test(el('einstBody').innerHTML));

kopf('v3.1 §3 · statistik per Paket');
var pS={ appVersion:'3.1.0', statistik:{ grund:'Statistik entrümpeln', zeitfenster:14, ampel:{ gruen:0.3 }, module:{ ausgeblendet:['acwr','routinen'] } } };   // v3.5.0 §5: neue Modul-IDs
var rS=syncImport(JSON.stringify(pS));
ok('§3 Zusammenfassung vor dem Anwenden (3 Änderungen)', rS.freigabeNoetig && rS.vorschau.statistik.aenderungen.length===3);
syncImport(JSON.stringify(pS), {freigabe:true});
renderStatistik(); var sh=el('statistikBody').innerHTML;
ok('§3 Zeitfenster 14 Tage, Ampelgrenze 0,3 (0,25 ist jetzt gelb), ACWR und Routinen ausgeblendet (v3.5.0-IDs)', analyseFenster().span===14 && ampelStufe(0.25)==='gelb' && ampelStufe(0.31)==='gruen' &&
   sh.indexOf('data-stmodul="acwr"')<0 && sh.indexOf('data-stmodul="routinen"')<0 && sh.indexOf('data-stmodul="tag"')>=0);
ok('§3 unbekanntes Modul wird abgewiesen', syncImport(JSON.stringify({appVersion:'3.1.0', statistik:{ module:{ ausgeblendet:['gibtsnicht'] } }})).vorschau.statistik.fehler.length===1);
ok('§3 Statistik-Änderungen im Protokoll', (S.meta.korrekturProtokoll||[]).some(function(e){ return e.art==='statistik' && e.grund==='Statistik entrümpeln'; }));

kopf('v3.1 §4 · Kartendetails vollständig');
frisch(); S.tag=neuerTag(MO,1);
imp([{id:'li', domain:'dfm', titel:'LinkedIn', modus:'zeit', rhythmus:{typ:'taeglich'}, serienfaktor:true,
  unteraufgaben:[{id:'u1', titel:'Lead eingepflegt', staffel:[50]}, {id:'u2', titel:'Nachricht an Lead', staffel:[80], tagesziel:3}]}]);
imp([{id:'li', unteraufgaben:[{id:'u1', titel:'Lead in Airtable eingepflegt'}, {id:'u2', staffel:[90]}, {id:'u3', titel:'Airtable', staffel:[50]}]}]);
ok('§4 Unter-Zähler anlegen, umbenennen, Staffel ändern', S.unteraufgaben.length===3 && sub('u1').titel==='Lead in Airtable eingepflegt' && JSON.stringify(sub('u2').staffel)==='[90]' && sub('u3').titel==='Airtable');
var rE=imp([{id:'li', unteraufgaben:[{id:'u3', entfernt:true}]}]);
ok('§4 Unter-Zähler entfernen mit entfernt:true', !sub('u3') && S.unteraufgaben.length===2 && rE.subsEntfernt===1);
var rK=imp([{id:'li', serienFaktor:1.6, streak:12}]);
print('   ohne korrektur: '+rK.uebersprungen.map(function(u){ return u.was+' — '+u.grund; }).join(' | '));
ok('§4 serienFaktor und streak ohne korrektur:true abgelehnt (gemeldet)', kid('li').serienFaktor===1 && kid('li').streak===0 && rK.uebersprungen.filter(function(u){ return /nur mit korrektur:true/.test(u.grund); }).length===2);
imp([{id:'li', serienFaktor:1.6, streak:12, korrektur:true, grund:'Serie aus Airtable nachgetragen'}]);
ok('§4 mit korrektur:true angenommen und protokolliert', kid('li').serienFaktor===1.6 && kid('li').streak===12 &&
   (S.meta.korrekturProtokoll||[]).some(function(e){ return e.art==='karte' && e.grund==='Serie aus Airtable nachgetragen' && e.aenderungen.length===2; }));
var rU=imp([{id:'li', titel:'LinkedIn', lieblingsfarbe:'grün'}]);
ok('§4 unbekannte Kartenfelder werden gemeldet und ignoriert; ein zurückgeschickter Export ist kein Fehler', rU.uebersprungen.some(function(u){ return /lieblingsfarbe/.test(u.was); }) &&
   imp([syncExport('delta').karten[0]]).uebersprungen.length===0);
imp([{id:'li', domain:'privat'}]);
ok('§4 Domäne einer bekannten Karte ist schreibbar', kid('li').domain==='privat');

kopf('v3.1 §5 · Export: vollständiger Ist-Stand');
frisch(); S.tag=neuerTag(MO,1);
var ev=syncExport('voll');
var nE=Object.keys(EINST_SCHEMA).reduce(function(a,b){ return a+Object.keys(EINST_SCHEMA[b]).length; },0), nS=Object.keys(STAT_SCHEMA).reduce(function(a,b){ return a+Object.keys(STAT_SCHEMA[b]).length; },0);
var hE=Object.keys(ev.einstellungen).reduce(function(a,b){ return a+Object.keys(ev.einstellungen[b]).length; },0), hS=Object.keys(ev.statistik).reduce(function(a,b){ return a+Object.keys(ev.statistik[b]).length; },0);
ok('§5 Vollexport trägt einstellungen ('+hE+' Felder) und statistik ('+hS+' Felder) vollständig — auch die Standards', hE===nE && hS===nS && ev.einstellungen.schlaf.bedarfStd===7 && ev.statistik.ampel.gruen===0.2);
ok('§5 Delta ohne Änderung: ohne die beiden Bereiche', syncExport('delta').einstellungen===undefined && syncExport('delta').statistik===undefined);
syncImport(JSON.stringify({appVersion:'3.1.0', einstellungen:{ serienfaktor:{ max:2.5 } }}), {freigabe:true});
ok('§5 Delta nach einer Änderung: einstellungen dabei (statistik nicht)', syncExport('delta').einstellungen && syncExport('delta').einstellungen.serienfaktor.max===2.5 && syncExport('delta').statistik===undefined);
syncBestaetigen();
ok('§5 nach dem bestätigten Sync fällt es wieder weg', syncExport('delta').einstellungen===undefined);
ok('§5 ein zurückgeschickter Vollexport ist ohne Abweichung und braucht keine Freigabe', !syncImport(JSON.stringify(syncExport('voll'))).freigabeNoetig);

print('');
print(fails? (fails+' von '+n+' FEHLGESCHLAGEN') : ('alle '+n+' Abnahmepunkte gruen'));
if(fails) throw 'Abnahme rot';
