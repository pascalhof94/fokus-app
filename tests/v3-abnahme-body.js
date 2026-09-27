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
print('   Essen 4 Ticks: '+JSON.stringify(punkte(te))+' · Zeit '+Math.round(heuteInvestiertMin(kid('essen')))+' Min · Ziel '+zielText(kid('essen')));
ok('1 Essen: 3 Ticks à 100 erfüllen das Ziel, der 4. bringt weiter 100; jeder Tick zählt 30 Min', JSON.stringify(punkte(te))==='[100,100,100,100]' &&
   Math.round(heuteInvestiertMin(kid('essen')))===120 && zielErreicht(kid('essen')) && zielText(kid('essen'))==='4/3');
var tg=tick('gesicht',4);
ok('1 Gesicht waschen: 50, 100, 100, 50', JSON.stringify(punkte(tg))==='[50,100,100,50]');
var tz=tick('zaehne',3);
print('   Zähne 3 Ticks: '+JSON.stringify(punkte(tz))+' · Status '+kid('zaehne').status);
ok('1 Zähne: 50, 100 — dann erledigt, ein dritter Tick wird nicht angenommen', JSON.stringify(punkte(tz))==='[50,100,null]' && kid('zaehne').status==='erledigt');
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
var verlauf={};
plan.forEach(function(p){
  tagAm(tagNach(MO,p.d));
  p.t.forEach(function(id){ var t=routineTick(kid(id)); if(id==='runde') (verlauf.runde=verlauf.runde||[]).push(t?t.faktor:null); });
  tagEnde();
  ['duschen','whatsapp'].forEach(function(id){ (verlauf[id]=verlauf[id]||[]).push(kid(id).streak); });
  (verlauf.gruppe=verlauf.gruppe||[]).push(S.meta.gruppenPflicht.Bad.streak);
});
print('   Serie Duschen (alle 2 Tage):   '+verlauf.duschen.join(' · '));
print('   Serie Haare ODER Duschen:      '+verlauf.gruppe.join(' · '));
print('   Serie WhatsApp (ohne Samstag): '+verlauf.whatsapp.join(' · '));
print('   Serienfaktor Katzenklo:        '+verlauf.runde.join(' · '));
ok('3 Duschen alle 2 Tage: Mo ✓, Di frei (Serie hält), Mi ✓, Do frei, Fr ohne → gerissen', verlauf.duschen.slice(0,5).join(',')==='1,1,2,2,0');
ok('3 Haare ODER Duschen: Mo Duschen, Di Haare, Mi Duschen → Gruppe 3; Do ohne beides → gerissen', verlauf.gruppe.slice(0,4).join(',')==='1,2,3,0');
ok('3 WhatsApp ohne Samstag: Sa neutral, So weiter (6), Mo ohne → gerissen', verlauf.whatsapp.join(',')==='1,2,3,4,5,5,6,0');
ok('3 Serienfaktor Katzenklo (alle 2 Tage, täglich erledigt): 1,0 → +0,2 je Tag bis 2,0', verlauf.runde.join(',')==='1,1.2,1.4,1.6,1.8,2,2');
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
tagAm(tagNach(MO,4)); routineTick(fk=kid(fk.id)); tagEnde();
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
  {id:'runde', domain:'privat', titel:'Geschirr', modus:'staffel', staffel:[100], tageslimit:1, rhythmus:{typ:'alleNTage', n:2}, serienfaktor:true, serienFaktor:1.4},
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
ok('5 erledigt (Tageslimit) → grau ans Ende seines Blocks', /al-z[^"]* fertig[^"]*" [^>]*data-alkarte="zaehne"/.test(abhakLeisteHtml()) && lk.indexOf('zaehne')>lk.indexOf('mails'));
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
ok('7 Schritt 2: je Karte Anzahl, Punkte, Serie; offene Ziele mit „überspringen" und „mit Abzug −100"', /Essen<small>2\/3 · 200 P · Serie 0/.test(s2h) &&
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
ok('7 danach ist alles grau außer „Schlafen"', /class="zs-k al-z[^"]* aus"[^>]*data-alkarte="essen"/.test(lh) && !/class="zs-k al-z[^"]* aus"[^>]*data-alkarte="schlaf"/.test(lh) && /Tag abgeschlossen/.test(lh));
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
S.ui.suSicht='heute'; S.ui.suDom='alle'; S.ui.suArt='alle'; renderSuche();
var fl=el('suFilter').innerHTML, sl=el('suSichten').innerHTML;
ok('9 zwei Filter: Routinen/Counter oder Aufgaben · DFM oder privat', /data-suart="routinen"[\s\S]*data-suart="aufgaben"/.test(fl) && /data-sudom="dfm"[\s\S]*data-sudom="privat"/.test(fl) && fl.indexOf('alle')<0);
ok('9 vier Sortierungen: Heute · Fällig · Neueste · Erledigte', (sl.match(/data-susicht=/g)||[]).length===4 && /Heute[\s\S]*Fällig[\s\S]*Neueste[\s\S]*Erledigte/.test(sl));
function ids(h){ return (h.match(/data-kid="([^"]+)"/g)||[]).map(function(x){ return x.slice(10,-1); }).filter(function(x,i,a){ return a.indexOf(x)===i; }).join(','); }
ok('9 Neueste: zuletzt angelegt zuerst', ids(suSichtHtml('neueste'))==='a2,a1,r1');
ok('9 Fällig: nach Deadline', ids(suSichtHtml('faellig')).indexOf('a1')<ids(suSichtHtml('faellig')).indexOf('a2'));
S.ui.suSicht='erledigte';
ok('9 Erledigte: nur Erledigtes', ids(suSichtHtml('erledigte'))==='e1');
S.ui.suSicht='neueste'; S.ui.suArt='aufgaben'; S.ui.suDom='privat';
ok('9 Filter wirken: Aufgaben + privat → nur „Steuer"', ids(suSichtHtml('neueste'))==='a2');
S.ui.suArt='alle'; S.ui.suDom='alle';
ok('9 jede Ansicht beginnt oben: setTab, Sortierung, Filter, Fokus und Sheet rufen nachOben bzw. setzen scrollTop 0',
   /m\.scrollTop=0; \}   \/\/ §9/.test(src) && /renderSuche\(\); nachOben\(\); haptik\(8\);   \/\/ §9/.test(src) && /sheetBody'\)\.scrollTop=0/.test(src) && (src.match(/nachOben\(\);   \/\/ §9/g)||[]).length>=2);

/* ══ 12 · Version ═════════════════════════════════════════════════════ */
kopf('12 · Version');
ok('12 APP_VERSION 3.0.0 · Datenvertrag 2.0 additiv (Gate ab 2.0)', VERSION==='3.0.0' && UI_VERSION==='v3.0.0' && !syncImport(JSON.stringify({appVersion:'2.0.0', karten:[{id:'x', titel:'x'}]})).fehler);

print('');
print(fails? (fails+' von '+n+' FEHLGESCHLAGEN') : ('alle '+n+' Abnahmepunkte gruen'));
if(fails) throw 'Abnahme rot';
