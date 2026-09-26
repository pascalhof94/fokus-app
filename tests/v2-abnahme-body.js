/* Abnahme v2.0.0 — die 31 Punkte des Auftrags, in seiner Reihenfolge.
   Punkte, die nur im Browser pruefbar sind (Layout, Wischen, Screenshots),
   sind ausdruecklich als HARNESS markiert und hier nicht doppelt geprueft. */
var fails=0, n=0;
function ok(t,c){ n++; print((c?'OK   ':'FAIL ')+t); if(!c) fails++; }
function kopf(t){ print(''); print('── '+t+' ──'); }
function H(){ return heuteIso(); }
function frisch(){
  _store={}; S.karten=[]; S.unteraufgaben=[]; S.historie=[]; S.intraday=[];
  S.meta={ wohlstand:0, seeded:true, migration200:true }; S.settings=settingsMerge({});
  S.tag=neuerTag(H(),1); S.tag.akku=70; S.fokus=null; S.meta.ketten=null;
  /* Einen offenen Matrix-Dialog aus dem vorherigen Block wegraeumen: der
     Ueberschreib-Schutz in matrixAbfrageNach wuerde sonst die naechste
     Abfrage blocken — korrektes Verhalten, aber verschlepptes Fixture. */
  matrixTmp=null; S.ui.fokusOffen=false;
}

/* ══ §0 · Sicherung ══════════════════════════════════════════════════ */
kopf('§0 Sicherung (Abnahme 1)');
frisch();
S.meta={ wohlstand:0 };                           // NICHT migriert
S.karten=[ neueKarte({id:'alt1', domain:'dfm', titel:'Bestand', sollMin:30,
             prioritaet:'muss', zeitmessung:true, tagesabschnitt:['morgens'],
             komplex:1.5, energie:1, blockade:2, faelligkeit:H()}) ];
DB.set('karten', S.karten); DB.set('meta', S.meta);
ladeAlles();
ok('1 Sicherung karten_bak200 liegt vor', Array.isArray(DB.get('karten_bak200',null)));
ok('1 Sicherung traegt den VOR-Zustand (Alt-Felder noch da)',
   (DB.get('karten_bak200',[])[0]||{}).prioritaet==='muss');
ok('1 Leerung steht noch AUS (kein Loeschen ohne bestaetigten Export)',
   S.meta.v200LeerungOffen===true && S.karten.length===1);
ok('1 Der Vollexport wird aus der SICHERUNG gebaut (Vertrag 1.6, Alt-Felder)',
   (function(){ var v=vollexport16AusSicherung();
     return v.appVersion==='1.13.4' && v.karten[0].prioritaet==='muss' && v.karten[0].komplex===1.5; })());
/* ══ §3 (v2.0.1) · WAS „DIE TAGESKETTE" BEIM LEEREN HEISST ═══════════
   v2.0.0 behielt alles aus tagesKette() — und die fuellt sich AUTOMATISCH
   aus jeder offenen Karte mit Faelligkeit heute oder frueher. Auf einem
   gelebten Bestand blieb damit fast alles stehen; das ist die Ursache der
   ausgebliebenen Leerung. Massgeblich ist jetzt die Kette, die BEIM UMBAU
   vorlag (= was Claude geschickt hat). */
ok('§3 Der Schnappschuss der Kette wurde bei der Migration genommen',
   Array.isArray(S.meta.v200KetteBeiMigration));
S.karten.push(neueKarte({id:'lose', domain:'dfm', titel:'Nicht in der Kette'}));
S.karten.push(neueKarte({id:'rout', domain:'privat', titel:'Routine', rhythmus:{typ:'taeglich'}}));
S.karten.push(neueKarte({id:'faellig', domain:'dfm', titel:'Ueberfaellig', faelligkeit:'2020-01-01'}));
/* Die Auto-Kette adoptiert alles Ueberfaellige — GENAU das darf nicht mehr
   vor dem Abraeumen schuetzen. */
ok('§3 BELEG: die Auto-Kette adoptiert die ueberfaellige Karte',
   tagesKette().indexOf('faellig')>=0);
var vorLeerung=S.karten.length;
v200LeerungAusfuehren();
ok('§3 BELEG: sie wird trotzdem abgeraeumt ('+vorLeerung+' → '+S.karten.length+')',
   !S.karten.some(function(k){return k.id==='faellig';}));
ok('1 Routinen bleiben immer', S.karten.some(function(k){return k.id==='rout';}));
ok('1 Was NICHT in der Migrations-Kette lag, geht weg',
   !S.karten.some(function(k){return k.id==='lose';}));
ok('1 Danach ist das Gate zu', S.meta.v200LeerungOffen===false);
/* Mit einer beim Umbau gesetzten Kette bleibt genau diese erhalten. */
(function(){
  _store={}; S.karten=[]; S.unteraufgaben=[];
  /* migration1120 ueberschreibt meta.ketten mit der ZWEI-Ketten-Form. Auf
     jedem lebenden Bestand ist sie laengst gelaufen — ohne ihr Flag prueft
     der Test den falschen Pfad (dieselbe Falle wie bei den Zielen). */
  S.meta={ migration1120:true, migration1130:true,
           ketten:{ alle:{ datum:'2026-09-20', ids:['k-claude'], entfernt:[] } } };
  S.karten=[ neueKarte({id:'k-claude', domain:'dfm', titel:'Von Claude geplant'}),
             neueKarte({id:'k-alt', domain:'dfm', titel:'Altlast', faelligkeit:'2020-01-01'}) ];
  DB.set('karten', S.karten); DB.set('meta', S.meta);
  ladeAlles();
  ok('§3 Die beim Umbau vorliegende Kette wird festgehalten (1 Eintrag)',
     (S.meta.v200KetteBeiMigration||[]).length===1);
  v200LeerungAusfuehren();
  ok('§3 BELEG: Claudes Kette bleibt, die Altlast geht',
     S.karten.some(function(k){return k.id==='k-claude';}) &&
     !S.karten.some(function(k){return k.id==='k-alt';}));
})();

/* ══ §1 · Matrix ══════════════════════════════════════════════════════ */
kopf('§1 Matrix (Abnahme 2-4)');
frisch();
ok('2 Vier Felder mit Achse und Richtung', MATRIX_FELDER.length===4 &&
   MATRIX_META.ablenkung.richtung==='weg von' && MATRIX_META.werkzeug.achse==='außen' &&
   MATRIX_META.ziel.richtung==='hin zu' && MATRIX_META.zustand.achse==='innen');
ok('2 Tap auf ein Feld liefert VORSCHLAGSwerte (nicht Automatik)',
   matrixVorschlag('werkzeug','privat').sollMin===10 && matrixVorschlag('ziel','dfm').sollMin===45);
ok('3 Position ist ein freier Punkt, kein Feld', (function(){
     matrixPosSetzen(-0.37, 0.62, null, 'test');
     var p=matrixPos(); return p && Math.abs(p.x+0.37)<0.001 && Math.abs(p.y-0.62)<0.001; })());
ok('3 Die Spur wird gespeichert (mit Zeitstempel)',
   matrixSpur().length===1 && !!matrixSpur()[0].ts);
ok('4 Ueberspringen ist moeglich UND wird gezaehlt', (function(){
     var a0=num(S.tag.matrixAbfragen), u0=num(S.tag.matrixUebersprungen);
     matrixUeberspringen(null,'test');
     return num(S.tag.matrixAbfragen)===a0+1 && num(S.tag.matrixUebersprungen)===u0+1; })());
ok('4 Uebersprungene Punkte veraendern die Position NICHT',
   Math.abs(matrixPos().x+0.37)<0.001);
ok('4 Skip-Quote wird berechnet', Math.abs(matrixSkipQuote()-0.5)<0.001);
/* §1.3 Akku und Position sind orthogonal */
var akkuVor=S.tag.akku;
matrixPosSetzen(0.9,0,null,'test');
ok('4 Akku und Position sind orthogonal (Position aendert Akku nicht)', S.tag.akku===akkuVor);

/* ══ §2 · Punkte ══════════════════════════════════════════════════════ */
kopf('§2 Punkte (Abnahme 5-6)');
frisch();
/* Kalibrier-Beleg: Feld „Ziele" = 1,0 reproduziert die alte Arithmetik exakt,
   weil komplex/energie/blockade im Bestand auf 1,0 standen. */
var kZiel=neueKarte({domain:'dfm', sollMin:45, matrixFeld:'ziel'});
var altFormel=45/60 * num(S.settings.basisProStdDfm) * 1*1*1 * num(S.settings.zeitGewicht);
ok('5 BELEG: Zielkarte rechnet EXAKT wie v1.13.4 ('+Math.round(altFormel)+' P)',
   Math.abs(kartePunkte(kZiel)-altFormel)<0.01);
var kPrv=neueKarte({domain:'privat', sollMin:30, matrixFeld:'ziel'});
ok('5 BELEG: dito privat ('+Math.round(kartePunkte(kPrv))+' P)',
   Math.abs(kartePunkte(kPrv) - 30/60*num(S.settings.basisProStdPrivat)*num(S.settings.zeitGewicht))<0.01);
ok('5 Feldfaktoren wirken (Ziel > Zustand > Werkzeug > Ablenkung)', (function(){
     var p=function(f){ return kartePunkte(neueKarte({domain:'privat', sollMin:30, matrixFeld:f})); };
     return p('ziel')>p('zustand') && p('zustand')>p('werkzeug') && p('werkzeug')>p('ablenkung') && p('ablenkung')===0; })());
ok('5 Bewegungsbonus: ganz links → ganz rechts = voller Satz',
   Math.round(bewegungsBonusBerechnen({x:-1},{x:1}))===num(S.settings.bewegungsBonus,500));
ok('5 Bewegungsbonus: schon rechts bringt DEUTLICH weniger',
   bewegungsBonusBerechnen({x:0.5},{x:1}) < 0.1*bewegungsBonusBerechnen({x:-1},{x:1}));
ok('5 Bewegung nach LINKS gibt keinen Bonus (nie negativ)',
   bewegungsBonusBerechnen({x:0.5},{x:-0.5})===0);
/* ══ NACHTRAG §1 · DIE ZEIT ZAEHLT IMMER (Abnahme N1) ══════════════════
   Prognose rechnet auf SOLL, der Abschluss auf IST — belegt an EINER Karte
   mit Ist ungleich Soll. */
(function(){
  var k=neueKarte({domain:'dfm', sollMin:60, matrixFeld:'ziel', geldScore:0, istSek:90*60});
  var prog=kartePunktePrognose(k);        // 60 Min Soll
  var ist =kartePunkte(k);                // 90 Min gearbeitet
  var erwartetProg=60/60*num(S.settings.basisProStdDfm)*num(S.settings.zeitGewicht)
                   + abhakbonusDefault(k);
  var erwartetIst =90/60*num(S.settings.basisProStdDfm)*num(S.settings.zeitGewicht);
  ok('N1 BELEG Prognose rechnet auf SOLL 60 Min ('+Math.round(prog)+' P)',
     Math.abs(prog-erwartetProg)<0.01);
  ok('N1 BELEG Abschluss rechnet auf IST 90 Min ('+Math.round(ist)+' P)',
     Math.abs(ist-erwartetIst)<0.01);
  // v2.8.0: Ziel-Aufgaben tragen jetzt 150 Abhakbonus in der Prognose — verglichen wird der ZEITanteil
  ok('N1 BELEG: zaeher Tag wird NICHT entwertet — Ist 90 > Prognose 60',
     ist>prog-abhakbonusDefault(k));
  var kurz=neueKarte({domain:'dfm', sollMin:60, matrixFeld:'ziel', istSek:30*60});
  ok('N1 BELEG: schneller als geplant bucht auch weniger ('+Math.round(kartePunkte(kurz))+' P)',
     kartePunkte(kurz)<kartePunktePrognose(kurz));
  var nie=neueKarte({domain:'dfm', sollMin:60, matrixFeld:'ziel', istSek:0});
  ok('N1 Rueckfall: ohne jede Ist-Zeit gilt Soll (vergessener Timer kostet nicht alles)',
     Math.abs(kartePunkte(nie)-60/60*num(S.settings.basisProStdDfm)*num(S.settings.zeitGewicht))<0.01);
  ok('N1 Die Prognose traegt KEINEN Bewegungsbonus',
     Math.abs(kartePunktePrognose(neueKarte({domain:'dfm',sollMin:60,matrixFeld:'ziel',bewegungsBonus:400}))
              - (erwartetProg+400)) > 1);
})();
/* ══ NACHTRAG §2 · Der Abhakbonus traegt die Barriere (Abnahme N2) ══ */
ok('N2 Default je MATRIXFELD: Zustaende 150 > Werkzeuge 100 > Ziele 0 = Ablenkungen 0',
   abhakbonusFeldDefault('zustand')===150 && abhakbonusFeldDefault('werkzeug')===100 &&
   abhakbonusFeldDefault('ziel')===0 && abhakbonusFeldDefault('ablenkung')===0);
ok('N2 zeitunabhaengig: er wirkt auch bei einer 5-Minuten-Karte voll', (function(){
     var kurz=neueKarte({domain:'privat', sollMin:5, matrixFeld:'werkzeug'});
     return abhakbonusDefault(kurz)===200; })());   // v2.8.0: Tabelle, Aufgabe Werkzeug 200
ok('N2 Ein Kartenwert bleibt Override und schlaegt den Feld-Default',
   abhakbonusDefault(neueKarte({matrixFeld:'zustand', abhakbonus:5}))===5);
ok('N2 Override 0 heisst ausdruecklich „kein Bonus"',
   abhakbonusDefault(neueKarte({matrixFeld:'zustand', abhakbonus:0}))===0);
ok('N2 Die Defaults sind Settings, keine Konstanten', (function(){
     S.settings.abhakbonusTabelle.aufgabe.werkzeug=222;   // v2.8.0: die Tabelle ist die Einstellung
     var r=abhakbonusDefault(neueKarte({matrixFeld:'werkzeug'}))===222;
     S.settings.abhakbonusTabelle.aufgabe.werkzeug=200; return r; })());
/* ══ NACHTRAG §3 · Neue Ziele als Settings-Defaults (Abnahme N3) ══ */
ok('N3 Werktag DFM 5.000 · Privat 800 (2. Nachtrag)',
   num(S.settings.tagesZielDfm)===5000 && num(S.settings.tagesZielPrivat)===800);
ok('N3 Wochenende DFM 1.800 · Privat 1.600',
   num(S.settings.zielWeDfm)===1800 && num(S.settings.zielWePrivat)===1600);
ok('N3 zielTag liefert die neuen Werte',
   zielTag('dfm','2026-09-21')===5000 && zielTag('privat','2026-09-21')===800);
/* Die Migration muss BEIDE bisherigen Defaults kennen — den nie migrierten
   Bestand (5.000/10.000) UND den einmal migrierten (3.000/6.000) — und einen
   eigenen Wert in Ruhe lassen. */
(function(){
  /* migration1120 (v1.12.0) setzt die Ziele HART auf 7.000/5.000/2.500/10.000.
     Sie ist auf jedem lebenden Bestand laengst gelaufen — deshalb steht ihr
     Flag in allen drei Faellen, sonst prueft der Test nicht das, was er soll. */
  function migPruef(meta, vorherW, vorherWe, erwartetW, erwartetWe, txt){
    var keep=S.meta, keepS=S.settings;
    var st=settingsMerge({ tagesZielPrivat:vorherW, zielWePrivat:vorherWe });
    DB.set('settings', st); DB.set('meta', meta); DB.set('karten', []);
    ladeAlles();
    ok('N3 Migration: '+txt,
       num(S.settings.tagesZielPrivat)===erwartetW && num(S.settings.zielWePrivat)===erwartetWe);
    S.meta=keep; S.settings=keepS;
  }
  migPruef({migration1120:true}, 5000, 10000, 800, 1600,
           'Stand v1.12 (5.000/10.000) → 800/1.600 in einem Durchlauf');
  migPruef({migration1120:true, migration200:true, nachtrag200:true}, 3000, 6000, 800, 1600,
           '1. Nachtrag gelaufen (3.000/6.000) → 800/1.600');
  migPruef({migration1120:true, migration200:true, nachtrag200:true}, 2222, 4444, 2222, 4444,
           'eigener Wert bleibt unberuehrt');
})();
ok('6 komplex/energie/blockade sind aus dem Kartenmodell verschwunden', (function(){
     var k=neueKarte({}); return k.komplex===undefined && k.energie===undefined && k.blockade===undefined; })());
ok('6 ... und werden auch vom Import nicht mehr gesetzt', (function(){
     S.karten=[]; syncImport(JSON.stringify({appVersion:'2.0.0', karten:[
       {id:'x', titel:'X', komplex:2, energie:2, blockade:2}]}));
     var k=S.karten[0]; return k && k.komplex===undefined && k.blockade===undefined; })());

/* ══ §3 · Waehrungen ══════════════════════════════════════════════════ */
kopf('§3 Waehrungen (Abnahme 7-9)');
frisch();
ok('7 Sterne restlos entfernt (keine der Funktionen existiert)',
   typeof this.sternMass==='undefined' && typeof this.sterneAktuell==='undefined' &&
   typeof this.sternSchwellenAus==='undefined' && typeof this.sternGeldHeute==='undefined');
ok('7 Upgrade-Faktor restlos entfernt', typeof this.upgradeFaktor==='undefined');
ok('7 Ein Alt-Feld meta.upgradeFaktor bleibt folgenlos', (function(){
     var a=paceWerte().soll; S.meta.upgradeFaktor=3; var b=paceWerte().soll;
     delete S.meta.upgradeFaktor; return Math.abs(a-b)<0.001; })());
ok('8 Serien gelten nur fuer Routinen', (function(){
     S.karten=[ neueKarte({id:'r',rhythmus:{typ:'taeglich'},titel:'Katzen',streak:40}),
                neueKarte({id:'a',titel:'Aufgabe',streak:99}) ];
     var r=routinenSerieBeste(); return r.tage===40 && r.titel==='Katzen'; })());
ok('8 Der Muenz-Multiplikator der Tages-Serie ist weg', streakFaktor()===1);
ok('9 Rang steigt UND faellt (rangMass kennt best und aktuell)', (function(){
     var rm=rangMass(); return rm && ('best' in rm) && ('rang' in rm); })());

/* ══ §4 · Kartenmodell ════════════════════════════════════════════════ */
kopf('§4 Kartenmodell (Abnahme 10-11)');
frisch();
ok('10 Die sechs entfallenen Felder fehlen', (function(){
     var k=neueKarte({});
     return ['prioritaet','zeitmessung','tagesabschnitt','komplex','energie','blockade']
       .every(function(f){ return k[f]===undefined; }); })());
ok('10 matrixFeld ist da und faellt auf „ziel" zurueck', neueKarte({}).matrixFeld==='ziel');
/* ══ §4 (v2.1.0) · EIN DATUM ══════════════════════════════════════════ */
ok('§4 geplantFuer ist aus dem Kartenmodell raus',
   neueKarte({}).geplantFuer===undefined);
ok('§4 Die Tageskette zieht nach DEADLINE', (function(){
     _store={}; S.karten=[]; S.meta={migration1120:true, migration1130:true, einDatum210:true};
     S.karten=[ neueKarte({id:'d-hat', faelligkeit:H()}),
                neueKarte({id:'d-ohne'}) ];
     S.meta.ketten=null;
     var ids=ketteAutoIds();
     return ids.indexOf('d-hat')>=0 && ids.indexOf('d-ohne')<0; })());
ok('§4 Migration: geplantFuer wird verworfen, Deadline gerettet wenn leer', (function(){
     _store={};
     DB.set('karten', [
       { id:'m1', domain:'dfm', titel:'Deadline da', faelligkeit:'2026-09-01', geplantFuer:'2026-09-01', status:'offen' },
       { id:'m2', domain:'dfm', titel:'nur geplantFuer', faelligkeit:null, geplantFuer:'2026-09-05', status:'offen' },
       { id:'m3', domain:'dfm', titel:'gar nichts', status:'offen' } ]);
     DB.set('meta', { migration1120:true, migration1130:true, migration200:true, nachtrag200:true,
                      nachtrag200b:true, dublettenFix201:true });
     DB.set('unteraufgaben', []);
     ladeAlles();
     var L=S.meta.einDatum210Log;
     var m1=S.karten.find(function(k){return k.id==='m1';});
     var m2=S.karten.find(function(k){return k.id==='m2';});
     return L && L.entfernt===2 && L.uebernommen===1 &&
            m1.geplantFuer===undefined && m1.faelligkeit==='2026-09-01' &&
            m2.faelligkeit==='2026-09-05'; })());
ok('§4 Migration ist geguarded', (function(){
     var vor=JSON.stringify(S.meta.einDatum210Log); ladeAlles();
     return JSON.stringify(S.meta.einDatum210Log)===vor; })());
ok('11 Akku-Mediane lernen ueber das MATRIXFELD statt den Tagesabschnitt',
   akkuKategorie(neueKarte({domain:'privat', matrixFeld:'werkzeug'}))==='privat|werkzeug' &&
   akkuKategorie(neueKarte({domain:'dfm', projekt:'P'}))==='dfm|P');

/* ══ §5 · Werkbank ════════════════════════════════════════════════════ */
kopf('§5 Werkbank (Abnahme 12)');
frisch();
S.karten=[ neueKarte({id:'kette1', domain:'dfm', titel:'In der Kette', geplantFuer:H()}),
           neueKarte({id:'rout1', domain:'privat', titel:'Routine', rhythmus:{typ:'taeglich'}}),
           neueKarte({id:'erl1', domain:'dfm', titel:'Erledigt', status:'erledigt'}),
           neueKarte({id:'lose1', domain:'dfm', titel:'Lose', status:'erledigt'}) ];
ketteSetzen(['kette1']);
S.meta.letzterSyncBestaetigtTs=null;
var r=syncBestaetigen();
ok('12 Nach bestaetigtem Sync sind erledigte Karten abgeraeumt ('+r.abgeraeumt+')',
   !S.karten.some(function(k){return k.id==='erl1'||k.id==='lose1';}));
ok('12 Kette und Routinen bleiben',
   S.karten.some(function(k){return k.id==='kette1';}) && S.karten.some(function(k){return k.id==='rout1';}));

/* ══ §6/§7 · Navigation und die eine Kette ═══════════════════════════ */
kopf('§6/§7 Navigation und Kette (Abnahme 13-18)');
frisch();
ok('13 Zwei Navigationsziele', SU_SICHTEN.length===5);
ok('13 FABs und Stapelseite sind aus dem Markup verschwunden',
   src.indexOf('id="fab"')<0 && src.indexOf('id="routFab"')<0 && src.indexOf('id="ketteFab"')<0 &&
   src.indexOf('id="v-stapel"')<0);
ok('13 (ab v2.4.0: drei) Die Navigationsleiste traegt Suche · Statistik · Einstellungen',
   (src.match(/<nav id="nav">[\s\S]*?<\/nav>/)||[''])[0].split('data-tab=').length-1===3);
S.karten=[ neueKarte({id:'o', domain:'dfm', titel:'Offen', geplantFuer:H()}),
           neueKarte({id:'e', domain:'dfm', titel:'Erledigtes Ding', status:'erledigt'}) ];
baueSuchIndex();
/* sucheTreffer liefert {k,sc}-Paare — genau die Auspack-Falle, ueber die
   die Suchseite zuerst gestolpert ist. Der Index findet weiterhin ALLES;
   §3 (v2.1.0) filtert erst in der Anzeige. */
ok('14 Der Suchindex findet auch Erledigtes', 
   sucheTreffer('Erledigtes').some(function(o){ return o.k && o.k.id==='e'; }));
ok('14 ... und die Suchseite packt die Karte richtig aus (kein [object Object])',
   (function(){ S.ui.suFrage='Erledigtes'; S.ui.suErledigt=true;
     var h=suFreitextHtml('Erledigtes');
     S.ui.suErledigt=false;
     return h.indexOf('Erledigtes Ding')>=0 && h.indexOf('[object')<0; })());
/* ══ §3 (v2.1.0) · Erledigtes ist DRAUSSEN, der Filter holt es zurueck ══ */
ok('§3 Freitext blendet Erledigtes standardmaessig AUS',
   suFreitextHtml('Erledigtes').indexOf('Erledigtes Ding')<0);
ok('§3 Der Filter blendet es ein', (function(){
     S.ui.suErledigt=true; var h=suFreitextHtml('Erledigtes');
     S.ui.suErledigt=false; return h.indexOf('Erledigtes Ding')>=0; })());
ok('§3 Die Sichten filtern ueber DIESELBE Stelle (suSichtbar)', (function(){
     var erl=neueKarte({id:'x-erl', status:'erledigt', titel:'Fertig'});
     var off=neueKarte({id:'x-off', status:'offen', titel:'Offen'});
     S.ui.suErledigt=false;
     var a=suSichtbar([erl,off]).length;
     S.ui.suErledigt=true;
     var b=suSichtbar([erl,off]).length;
     S.ui.suErledigt=false;
     return a===1 && b===2; })());
/* §3 BELEG: in ALLEN fuenf Sichten und im Freitext, nicht nur irgendwo. */
(function(){
  var keepK=S.karten, keepU=S.ui;
  S.karten=[ neueKarte({id:'o1',domain:'dfm',titel:'Offen',status:'offen',faelligkeit:H(),
               letzteBearbeitung:H()+'T09:00:00',matrixFeld:'ziel'}),
             neueKarte({id:'e1',domain:'dfm',titel:'Fertig',status:'erledigt',tagId:aktuelleTagId(),
               faelligkeit:H(),letzteBearbeitung:H()+'T10:00:00',matrixFeld:'ziel'}) ];
  S.meta.ketten=null; ketteSetzen(['o1','e1']);
  S.ui.suMatrixFeld='ziel'; baueSuchIndex();
  function zeilen(h){ return (h.match(/class="krow/g)||[]).length; }
  ['heute','matrix','oft','faellig','art'].forEach(function(v){
    S.ui.suSicht=v;
    S.ui.suErledigt=false; var a=zeilen(suSichtHtml(v));
    S.ui.suErledigt=true;  var b=zeilen(suSichtHtml(v));
    ok('§3 Sicht „'+v+'": ohne '+a+' → mit '+b, b===a+1);
  });
  S.ui.suErledigt=false;
  ok('§3 Freitext ohne Filter findet die erledigte NICHT',
     zeilen(suFreitextHtml('Fertig'))===0);
  S.ui.suErledigt=true;
  ok('§3 Freitext mit Filter findet sie', zeilen(suFreitextHtml('Fertig'))===1);
  S.ui.suErledigt=false; S.ui.suSicht='heute'; S.ui.suMatrixFeld=null;
  S.karten=keepK; S.ui=keepU;
})();
ok('§3 Eine HEUTE erledigte Routine gilt als erledigt', (function(){
     var r=neueKarte({id:'x-r', rhythmus:{typ:'taeglich'}, status:'erledigt', tagId:aktuelleTagId()});
     return istHeuteErledigt(r)===true; })());
ok('15 Fuenf Sichten, „Heute" ist Standard', SU_SICHTEN[0][0]==='heute' && suSicht()==='heute');
frisch();
S.karten=[]; for(var i=1;i<=5;i++) S.karten.push(neueKarte({id:'p'+i, domain:(i%2?'dfm':'privat'), titel:'P'+i, geplantFuer:H()}));
ketteSetzen(['p1','p2','p3','p4','p5']);
ketteBewegen('p5', 1);
ok('16 Kette sortierbar, Position frei waehlbar (p5 auf 1)',
   JSON.stringify(tagesKette())==='["p5","p1","p2","p3","p4"]');
ketteBewegen('p5', 3);
ok('16 ... und wieder auf Position 3',
   JSON.stringify(tagesKette())==='["p1","p2","p5","p3","p4"]');
ok('17 EINE Kette — beide Domaenen liegen darin',
   tagesKette().length===5 &&
   tagesKetteDom('dfm').length===3 && tagesKetteDom('privat').length===2);
ok('17 Die Domaene bleibt an der Karte',
   S.karten.filter(function(k){return k.domain==='privat';}).length===2);
ok('17 meta.ketten hat nur noch EINEN Eintrag (alle)',
   Object.keys(S.meta.ketten).length===1 && !!S.meta.ketten.alle);
ok('18 HARNESS: Fokuskarte als Layer ueber der Suche (Markup vorhanden)',
   src.indexOf('id="fokusLayer"')>=0 && typeof fokusLayerPflegen==='function');

/* ══ §8 · Fokusansicht ════════════════════════════════════════════════ */
kopf('§8 Fokusansicht (Abnahme 19-20)');
frisch();
S.karten=[ neueKarte({id:'f1', domain:'dfm', titel:'Fokuskarte', sollMin:45, matrixFeld:'ziel', geplantFuer:H()}) ];
ketteSetzen(['f1']);
ok('19 Drei Belohnungsbloecke, jeder mit eigener Ueberschrift', (function(){
     var a=fbWasDieseKarte(S.karten[0]), b=fbWoIchStehe(), c=fbWasIchBewege(S.karten[0]);
     return a.indexOf('Was diese Karte einbringt')>=0 &&
            b.indexOf('Wo ich heute stehe')>=0 &&
            c.indexOf('Was ich gerade bewege')>=0; })());
ok('19 Block 1 nennt Prognose, Stand jetzt und den Anteil am Tagessoll', (function(){
     var a=fbWasDieseKarte(S.karten[0]);
     return a.indexOf('Prognose')>=0 && a.indexOf('Stand jetzt')>=0 &&
            a.indexOf('Münzen')>=0 && a.indexOf('Tagessoll')>=0; })());
ok('N1 Block 1 macht kenntlich, dass der Endwert abweichen kann',
   fbWasDieseKarte(S.karten[0]).indexOf('weicht von der Prognose ab')>=0);
ok('N1 Auch das Karten-Detail sagt es', (function(){
     entwurf=S.karten[0]; entwurfSubs=[]; entwurfNeu=false;
     var h=''; try{ renderDetail(); h=el('sheetBody').innerHTML; }catch(e){ return false; }
     return h.indexOf('Gebucht wird nach')>=0 && h.indexOf('Prognose')>=0; })());
S.meta.tagesRahmen={ datum:heuteApp(), segmente:[
  {von:8,bis:12,typ:'dfm'},{von:12,bis:13,typ:'pause'},{von:13,bis:17,typ:'privat'} ] };
var zs=zeitstrahlHtml();
ok('20 Zeitstrahl baut auf dem Tagesrahmen auf', zs.indexOf('zs-seg')>=0 && zs.indexOf('08:00')>=0);
ok('20 Zeitstrahl hat eine Fuell-Ebene (Abgearbeitetes faerbt sich ein)', zs.indexOf('zs-fuell')>=0);
ok('20 Ohne Rahmen zeigt er die Kette', (function(){
     delete S.meta.tagesRahmen; var z=zeitstrahlHtml();
     return z.indexOf('Fokuskarte')>=0; })());

/* ══ §9 · Vorschlag ═══════════════════════════════════════════════════ */
kopf('§9 Vorschlag (Abnahme 21-22)');
frisch();
S.karten=[ neueKarte({id:'z1', domain:'dfm', titel:'Zielarbeit', sollMin:45, matrixFeld:'ziel', geplantFuer:H()}),
           neueKarte({id:'wk', domain:'privat', titel:'Kurz', sollMin:5,  matrixFeld:'werkzeug'}),
           neueKarte({id:'wl', domain:'privat', titel:'Lang', sollMin:30, matrixFeld:'werkzeug'}) ];
ketteSetzen(['z1']);
S.tag.akku=20;
ok('22 Startwert nach Akku: leerer Akku → das LADENDE (laengste) Werkzeug',
   werkzeugVorschlag().karte.id==='wl');
S.tag.akku=95;
ok('22 Voller Akku → das kurze Werkzeug reicht', werkzeugVorschlag().karte.id==='wk');
ok('22 Solange nichts gelernt ist, ist die Quelle „akku"', werkzeugVorschlag().quelle==='akku');
ok('22 Lernschwelle ist eine Einstellung (12) und greift erst ab dort',
   num(S.settings.vorschlagLernSchwelle)===12 && vorschlagGelernt()===false);
/* Genug Messungen → die App schlaegt das Werkzeug vor, das wirklich zog. */
S.meta.matrixWirkung=[];
for(var w=0; w<6; w++){
  S.meta.matrixWirkung.push({kid:'wk', feld:'werkzeug', dx:0.05, vonX:-0.5, ts:jetztIso()});
  S.meta.matrixWirkung.push({kid:'wl', feld:'werkzeug', dx:0.80, vonX:-0.5, ts:jetztIso()});
}
ok('22 Ab der Schwelle ist die Quelle „gelernt"', vorschlagGelernt()===true &&
   werkzeugVorschlag().quelle==='gelernt');
ok('22 Gelernt wird das Werkzeug mit dem besten Median-dx (wl, nicht wk)',
   werkzeugVorschlag().karte.id==='wl');
ok('21 Links fuehrt zu einem Werkzeug, rechts zur naechsten Kettenkarte', (function(){
     matrixPosSetzen(-0.8,0,null,'t'); S.tag.vorschlagGezeigt=[];
     var linksWerkzeug = matrixPos().x<0 && matrixFeldVon(werkzeugVorschlag().karte)==='werkzeug';
     matrixPosSetzen(0.8,0,null,'t');
     var rechtsKette = naechsteKetteKarte(null) && naechsteKetteKarte(null).id==='z1';
     return linksWerkzeug && rechtsKette; })());

/* ══ §10 · Tagesabschluss ═════════════════════════════════════════════ */
kopf('§10 Tagesabschluss (Abnahme 23)');
ok('23 Der Sortier-Schritt ist entfallen', typeof this.renderAbschlussSortieren==='undefined');
ok('23 Der Abschluss kennt keinen step mehr', (function(){
     oeffneTagAbschluss(); return abschlussTmp && abschlussTmp.step===undefined; })());

/* ══ §11 · Sync Vertrag 2.0 ═══════════════════════════════════════════ */
kopf('§11 Sync (Abnahme 24-27)');
frisch();
for(var q=1;q<=120;q++) S.karten.push(neueKarte({id:'s'+q, domain:'dfm', titel:'K'+q,
  sollMin:30, letzteBearbeitung:'2026-09-01T10:00:00'}));
ketteSetzen([]);
S.meta.letzterSyncBestaetigtTs=null;
var d0=syncExport('delta').karten.length;
S.meta.letzterSyncBestaetigtTs='2026-09-10T00:00:00';
var d1=syncExport('delta').karten.length;
for(var z=1;z<=14;z++) S.karten[z].letzteBearbeitung=jetztIso();
var d2=syncExport('delta').karten.length;
var dv=syncExport('voll').karten.length;
ok('24 ZAHLENBELEG Delta: 120 Bestand → ohne bestaetigten Sync '+d0+
   ' → nach Bestaetigung '+d1+' → nach 14 Aenderungen '+d2,
   d0===120 && d1===0 && d2===14);
ok('24 Der Zeitstempel wird ERST nach der Bestaetigung fortgeschrieben', (function(){
     var vor=S.meta.letzterSyncBestaetigtTs;
     syncExport('delta'); syncExportText('delta');
     var unveraendert = S.meta.letzterSyncBestaetigtTs===vor;
     var res=syncBestaetigen();
     return unveraendert && res.ts!==vor; })());
ok('25 Vollexport-Knopf vorhanden (und liefert alles: '+dv+')',
   dv===120 && src.indexOf('data-syncmode="voll"')>=0);
frisch();
S.karten=[ neueKarte({id:'v1', domain:'dfm', titel:'V1', geplantFuer:H(), matrixFeld:'werkzeug'}) ];
ketteSetzen(['v1']); matrixPosSetzen(0.3,-0.2,null,'t');
var ex=syncExport('delta');
/* §4 (v2.1.0): Der DATENVERTRAG bleibt 2.0 (Gate unveraendert), die
   App-Version zieht auf 2.1.0 — sie reist als appVersion mit. */
ok('26 appVersion 2.x, Gate weiterhin auf 2.0',
   /^2\./.test(ex.appVersion) && /^2\./.test(VERSION) &&
   !!syncImport(JSON.stringify({appVersion:'1.13.5', karten:[{id:'q',titel:'q'}]})).fehler);
ok('26 Vertrag 2.0: EINE kette statt zweier',
   Array.isArray(ex.kette) && ex.ketteDfm===undefined && ex.kettePrivat===undefined);
ok('26 Vertrag 2.0: matrixFeld je Karte', ex.karten[0].matrixFeld==='werkzeug');
ok('26 Vertrag 2.0: Positions-Spur reist mit (x/y + Zeitstempel)',
   Array.isArray(ex.matrixSpur) && ex.matrixSpur.length>=1 && !!ex.matrixSpur[0].ts);
ok('26 Vertrag 2.0: entfallene Felder sind NICHT im Paket', (function(){
     var k=ex.karten[0];
     return ['prioritaet','zeitmessung','tagesabschnitt','komplex','energie','blockade']
       .every(function(f){ return k[f]===undefined; }); })());
ok('26 Vertrag 2.0: Sterne und upgradeFaktor sind nicht im Paket',
   ex.upgradeFaktor===undefined && ex.sterne===undefined);
ok('26 Gate auf 2.0: ein 1.13.4-Paket wird abgelehnt',
   !!syncImport(JSON.stringify({appVersion:'1.13.4', karten:[{id:'x',titel:'x'}]})).fehler);
ok('27 BELEG: ein Paket OHNE karten-Array wird abgelehnt',
   !!syncImport(JSON.stringify({appVersion:'2.0.0', kette:['v1']})).fehler);
ok('27 ... auch wenn es nur einen Tagesrahmen setzen will',
   !!syncImport(JSON.stringify({appVersion:'2.0.0', tagesRahmen:[{von:8,bis:12,typ:'dfm'}]})).fehler);
ok('27 Mit karten-Array geht es durch',
   !syncImport(JSON.stringify({appVersion:'2.0.0', karten:[{id:'v1'}], kette:['v1']})).fehler);
ok('11/§14 sitzungen bleiben Teil des Vertrags', src.indexOf('o.sitzungen=sitz')>=0);

/* ══ §12 · Statistik ══════════════════════════════════════════════════ */
kopf('§12 Statistik (Abnahme 28)');
frisch();
S.karten=[ neueKarte({id:'m1', domain:'privat', titel:'Werkzeug', matrixFeld:'werkzeug', sollMin:10}) ];
matrixPosSetzen(-0.8, 0.2, null, 't');
matrixPosSetzen( 0.4,-0.1, 'm1', 'abhaken');
ok('28 Fuenf Module', (function(){
     var h=stTagesverlauf()+stMatrixSpur()+stReinRaus()+stEntwicklung()+stBelastung();
     return (h.match(/class="anmod"/g)||[]).length===5; })());
ok('28 Belastung rechnet ueber MATRIX-Werte (links, Werkzeuge, Energie)', (function(){
     var b=stBelastung();
     return b.indexOf('Links')>=0 && b.indexOf('Werkzeuge')>=0 && b.indexOf('Energie')>=0; })());
ok('28 Matrix-Spur zeigt, welches Werkzeug zurueckgeholt hat',
   stMatrixSpur().indexOf('Werkzeug')>=0);
ok('28 ACWR und die alte Belastungssteuerung sind aus der Statistik raus',
   stBelastung().indexOf('ACWR')<0 && stBelastung().indexOf('Readiness')<0);

/* ══ §13 · Shop ═══════════════════════════════════════════════════════ */
kopf('§13 Shop (Abnahme 29)');
ok('29 Der Shop haengt hinter der Figur, nicht in der Leiste',
   src.indexOf('id="btnFigur"')>=0 &&
   (src.match(/<nav id="nav">[\s\S]*?<\/nav>/)||[''])[0].indexOf('belohnung')<0);
ok('29 Shop-Reset aus v1.13.3 ist erhalten', typeof shopResetJetzt==='function');
ok('29 Sechs Kategorien, zwoelf Stufen', KAT_KEYS.length===6 &&
   KAT_KEYS.every(function(k){ return BELOHNUNG[k].stufen.length===12; }));

/* ══ §14 · Unveraendert Uebernommenes ════════════════════════════════ */
kopf('§14 Regression (Abnahme 30-31)');
frisch();
ok('30 Ticks und Tickwerte', (function(){
     var k=neueKarte({domain:'dfm', ticksAktiv:true, tickWert:8, ticksHeute:2});   // v2.8.0: DFM (privat waere gedaempft)
     return Math.round(tickPunkte(k))===Math.round(16*num(S.settings.tickGewicht)); })());
ok('30 Unteraufgaben mit Bonus', (function(){
     S.karten=[neueKarte({id:'u1'})];
     S.unteraufgaben=[neueUnteraufgabe('u1',{id:'s1',done:true,bonusPunkte:100}),
                      neueUnteraufgabe('u1',{id:'s2',done:false,bonusPunkte:100})];
     return subBonusErreicht(S.karten[0])===100 && subBonusOffen(S.karten[0])===100; })());
ok('30 Freeze', (function(){ var k=neueKarte({freeze:true}); return k.freeze===true; })());
ok('30 Rhythmus-Modell der Routinen', typeof routineFaellig==='function' &&
   routineFaellig(neueKarte({rhythmus:{typ:'taeglich'}}), H())===true);
ok('30 Urlaubsmodus', typeof urlaubAktiv==='function' && typeof urlaubHeute==='function');
ok('30 Tagesrahmen', typeof tagesRahmen==='function');
ok('30 Speicher-Karte und Quota-Schutz aus v1.13.4', typeof speicherBelegung==='function' &&
   typeof speicherAufraeumen==='function' && typeof speicherBaks==='function');
ok('30 Timer und Sitzungszeiten', typeof kartenSitzungenHeute==='function' &&
   typeof fokusZeitEinbuchen==='function');
ok('31 APP_VERSION 2.9.0 · Build gesetzt', VERSION==='2.9.0' && UI_VERSION==='v2.9.0' &&
   APP_BUILD==='2026-09-26-1');


/* ══ v2.0.1 · §1 ZWEI UNABHAENGIGE EBENEN ═══════════════════════════ */
kopf('v2.0.1 §1 · Fokus und Suche entkoppelt');
frisch();
S.karten=[ neueKarte({id:'A', domain:'dfm', titel:'Karte A', sollMin:60, matrixFeld:'ziel', geplantFuer:H()}),
           neueKarte({id:'B', domain:'dfm', titel:'Karte B', sollMin:30, matrixFeld:'ziel', geplantFuer:H()}) ];
ketteSetzen(['A','B']);
ok('§1 Ohne Karte ist die Fokusansicht zu', !fokusAnsichtOffen());
fokusStarten('A');
ok('§1 Starten oeffnet die Ansicht', fokusAnsichtOffen()===true);
ok('§1 ... und die Uhr laeuft', S.fokus.laeuft===true && S.fokus.karteId==='A');
/* Wegschieben darf die Uhr NICHT anfassen */
var startVor=S.fokus.startMs, istVor=num(S.karten[0].istSek);
fokusAnsichtSchliessen();
ok('§1 BELEG Wegschieben: Ansicht zu, Uhr laeuft weiter',
   !fokusAnsichtOffen() && S.fokus.laeuft===true && S.fokus.karteId==='A');
ok('§1 BELEG: startMs unveraendert ('+startVor+')', S.fokus.startMs===startVor);
ok('§1 BELEG: nichts wurde vorzeitig gebucht', num(S.karten[0].istSek)===istVor);
ok('§1 Die Karte ist weiter die laufende (Leiste zeigt sie)', !!fokusKarte() && fokusKarte().id==='A');
fokusAnsichtZeigen();
ok('§1 Tippen auf die Leiste holt sie zurueck', fokusAnsichtOffen()===true);
ok('§1 ... ohne die Uhr anzufassen', S.fokus.startMs===startVor && S.fokus.laeuft===true);
/* Der Zustand „welche Karte laeuft" und „welche Ansicht" sind getrennt */
fokusAnsichtSchliessen();
ok('§1 Zwei Zustaende, nie gekoppelt: laeuft='+S.fokus.laeuft+' offen='+fokusAnsichtOffen(),
   S.fokus.laeuft===true && fokusAnsichtOffen()===false);
/* Pausieren darf die Ansicht NICHT schliessen (und umgekehrt) */
fokusAnsichtZeigen(); fokusToggle();
ok('§1 Pausieren schliesst die Ansicht nicht', fokusAnsichtOffen()===true && S.fokus.laeuft===false);

/* ══ v2.0.1 · §2 FOKUSKARTE AUSTAUSCHEN ═════════════════════════════ */
kopf('v2.0.1 §2 · Kartenwechsel');
frisch();
S.karten=[ neueKarte({id:'A', domain:'dfm', titel:'Karte A', sollMin:60, matrixFeld:'ziel', geplantFuer:H()}),
           neueKarte({id:'B', domain:'dfm', titel:'Karte B', sollMin:30, matrixFeld:'ziel', geplantFuer:H()}) ];
ketteSetzen(['A','B']);
matrixPosSetzen(-0.5, 0, null, 'start');
fokusStarten('A');
/* 12 Minuten auf A arbeiten */
S.fokus.startMs = Date.now() - 12*60*1000;
var istA_vor=num(S.karten[0].istSek);
fokusStarten('B');
var istA_nach=num(S.karten.find(function(k){return k.id==='A';}).istSek);
ok('§2 BELEG: Zeit der alten Karte gebucht ('+Math.round(istA_vor/60)+'′ → '+
   Math.round(istA_nach/60)+'′)', Math.abs(istA_nach-istA_vor-720)<5);
ok('§2 Die neue Karte laeuft', S.fokus.karteId==='B' && S.fokus.laeuft===true);
ok('§2 Die alte Uhr steht', istSekLive(S.karten.find(function(k){return k.id==='A';}))===istA_nach);
/* v2.1.1 §3: Der WECHSEL zaehlt fuer die alte Karte wie Pausieren — KEIN
   Dialog mehr (aendert v2.0.1 §2, wo er kam). */
ok('§2/v2.1.1 BELEG: beim Wechsel kommt KEIN Dialog', matrixTmp===null);
ok('§2 Die Ansicht zeigt jetzt die neue Karte', fokusAnsichtOffen()===true);

/* ══ v2.0.1 · §4 DUBLETTEN ══════════════════════════════════════════ */
kopf('v2.0.1 §4 · Dubletten zusammenfuehren');
(function(){
  _store={}; S.karten=[]; S.unteraufgaben=[];
  var alt=[['r-post','recbC92MXk8wtmHZI'],['r-whatsapp','rechW26iOYGayvbG7'],
    ['r-pausentimer','recWElw8lE4aYdxxO'],['r-meetingtimer','recIlKzvzwx7PmGsy'],
    ['r-klein-dfm','recetMijqt9rJ0FBg'],['r-cold','recPvTBS9aJ6WzoDX'],
    ['r-feierabend','rec5B62OpIaSUPFtk'],['linkedin-kommentare-0809','recrcoDMOICAdUJ6C'],
    ['554b286d-11c9-480d-931f-b53e982ec049','rec8LbdbjOW1f5Uos']];
  var ks=[];
  alt.forEach(function(pp,i){
    ks.push({ id:pp[0], domain:'dfm', titel:'Routine '+i, rhythmus:{typ:'taeglich'},
      status:'offen', streak:20+i, airtableId:null, istSek:600, sollMin:10 });
    ks.push({ id:pp[1], domain:'dfm', titel:'Routine '+i, rhythmus:{typ:'taeglich'},
      status:'offen', streak:0, airtableId:pp[1], projekt:'Vertrieb', geldScore:50, istSek:0, sollMin:10 });
  });
  /* r-mails traegt die ID bereits und ist NICHT betroffen */
  ks.push({ id:'r-mails', domain:'dfm', titel:'Mails', rhythmus:{typ:'taeglich'},
    status:'offen', streak:33, airtableId:'reciAhR0Lb1YpZbaU', istSek:0, sollMin:10 });
  DB.set('karten', ks);
  DB.set('meta', { migration1120:true, migration1130:true, migration160:true, migration161:true,
    migration180:true, zeit191:true, gamify190:true, rang1110:true, akku1100:true,
    hotfix1131:true, flowfix152:true, flowfix181:true, stapelV4:true, stapelV6:true,
    stapelV8:true, u3statusMigriert:true, u6migriert:true, panoramaReset151:true,
    flowBaseline133:true, hotfix131:true, hotfix133:true, seeded:true });
  DB.set('unteraufgaben', []);
  ladeAlles();
  var L=S.meta.dublettenFix201Log;
  ok('§4 Genau neun Paare zusammengefuehrt', L && L.zusammengefuehrt.length===9);
  ok('§4 Sicherung karten_bak201 liegt', Array.isArray(DB.get('karten_bak201',null)));
  var post=S.karten.find(function(k){return k.id==='r-post';});
  var dub =S.karten.find(function(k){return k.id==='recbC92MXk8wtmHZI';});
  ok('§4 BELEG: die ALTE Karte bleibt und behaelt ihre Serie ('+num(post.streak)+')',
     post && post.status==='offen' && num(post.streak)===20);
  ok('§4 BELEG: sie hat die airtableId geerbt', post.airtableId==='recbC92MXk8wtmHZI');
  ok('§4 BELEG: die NEUE ist archiviert, nicht geloescht',
     dub && dub.status==='archiviert');
  // v2.6.0 §5: danach laeuft die Geld-Migration — der Score bleibt 50, er steht jetzt als Impact (+ Tage bis zum Datum) an der Karte
  ok('§4 Die alte erbt Projekt/Geld aus der neuen', post.projekt==='Vertrieb' && geldScoreVon(post)===50 && post.geldScore===undefined);
  ok('§4 r-mails ist unberuehrt (trug die ID schon)', (function(){
       var m2=S.karten.find(function(k){return k.id==='r-mails';});
       return m2 && m2.status==='offen' && num(m2.streak)===33; })());
  var offenMitRec=S.karten.filter(function(k){
    return k.status!=='archiviert' && /^rec/.test(String(k.id)); }).length;
  ok('§4 BELEG: keine offene Dublette mit rec-id mehr uebrig ('+offenMitRec+')', offenMitRec===0);
  ok('§4 Migration ist geguarded (laeuft nicht erneut)', (function(){
       var vor=S.karten.filter(function(k){return k.status==='archiviert';}).length;
       ladeAlles();
       return S.karten.filter(function(k){return k.status==='archiviert';}).length===vor; })());
  ok('§4 Keine Titel-Heuristik: nur die neun IDs', L.zusammengefuehrt.every(function(x){
       return alt.some(function(pp){ return pp[0]===x.alt.id && pp[1]===x.rec; }); }));
})();


/* ══ v2.1.0 · §1 TAGESABSCHLUSS IN EINEM DURCHGANG ═══════════════════ */
kopf('v2.1.0 §1 · Tagesabschluss');
frisch();
var GESTERN=(function(){ var d=new Date(H()+'T12:00:00'); d.setDate(d.getDate()-1);
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); })();
var MORGEN=morgenIso();
S.karten=[
  neueKarte({id:'A-heute',  domain:'dfm', titel:'Heute faellig',  faelligkeit:H(),     sollMin:30, matrixFeld:'ziel'}),
  neueKarte({id:'A-alt',    domain:'dfm', titel:'Ueberfaellig',   faelligkeit:GESTERN, sollMin:30, matrixFeld:'ziel'}),
  neueKarte({id:'A-morgen', domain:'dfm', titel:'Erst morgen',    faelligkeit:MORGEN,  sollMin:30, matrixFeld:'ziel'}),
  neueKarte({id:'A-erl',    domain:'dfm', titel:'Schon fertig',   faelligkeit:H(), status:'erledigt', tagId:aktuelleTagId()}),
  neueKarte({id:'R-tag',    domain:'privat', titel:'Routine',     faelligkeit:H(), rhythmus:{typ:'taeglich'}, abhakbonus:100}),
  neueKarte({id:'C-zaehl',  domain:'privat', titel:'Counter',     faelligkeit:H(), ticksAktiv:true, tickWert:-20}),
  neueKarte({id:'A-frost',  domain:'dfm', titel:'Eingefroren',    faelligkeit:GESTERN, freeze:true})
];
var ab=abschlussKarten().map(function(k){return k.id;});
ok('§1.2 BELEG: genau die zwei faelligen Aufgaben ('+ab.join(', ')+')',
   ab.length===2 && ab.indexOf('A-heute')>=0 && ab.indexOf('A-alt')>=0);
ok('§1.2 BELEG: die Routine taucht NICHT auf', ab.indexOf('R-tag')<0);
ok('§1.2 BELEG: der Counter taucht NICHT auf', ab.indexOf('C-zaehl')<0);
ok('§1.2 BELEG: die erledigte taucht NICHT auf', ab.indexOf('A-erl')<0);
ok('§1.2 BELEG: die morgen faellige taucht NICHT auf', ab.indexOf('A-morgen')<0);
ok('§1.2 Eingefrorenes bleibt draussen', ab.indexOf('A-frost')<0);
/* §1.1 Routinen automatisch */
var rt=abschlussRoutinenStand();
ok('§1.1 Routinen-Stand vorher: 0 von 1 erledigt, Bonus 0',
   rt.faellig===1 && rt.fertig===0 && rt.bonus===0);
/* karteAbhakenAuto oeffnet fuer Routinen den Abhak-Dialog; der eigentliche
   Abschluss ist karteAbhaken. */
karteAbhaken('R-tag', false); closeSheet();
var rt2=abschlussRoutinenStand();
ok('§1.1 BELEG nachher: 1 von 1 erledigt, Abhakbonus '+rt2.bonus,
   rt2.fertig===1 && rt2.bonus===100);
/* §1.5 Alle auf morgen */
frisch();
S.karten=[ neueKarte({id:'B1', domain:'dfm', titel:'B1', faelligkeit:GESTERN, sollMin:30}),
           neueKarte({id:'B2', domain:'dfm', titel:'B2', faelligkeit:H(), sollMin:30}),
           neueKarte({id:'B3', domain:'dfm', titel:'B3', faelligkeit:MORGEN, sollMin:30}) ];
var nAlle=abschlussAlleAufMorgen(); closeSheet();
ok('§1.5 BELEG: „Alle auf morgen" hat '+nAlle+' Karten verschoben', nAlle===2);
ok('§1.5 BELEG: beide stehen jetzt auf '+MORGEN,
   S.karten[0].faelligkeit===MORGEN && S.karten[1].faelligkeit===MORGEN);
ok('§1.5 Die morgen faellige blieb unberuehrt', S.karten[2].faelligkeit===MORGEN);
ok('§1.5 Danach ist nichts mehr durchzugehen', abschlussKarten().length===0);
/* §1.3/§1.4 Durchgang im Anlege-Dialog */
frisch();
S.karten=[ neueKarte({id:'C1', domain:'dfm', titel:'C1', faelligkeit:GESTERN, sollMin:30, matrixFeld:'ziel'}),
           neueKarte({id:'C2', domain:'dfm', titel:'C2', faelligkeit:GESTERN, sollMin:30, matrixFeld:'ziel'}) ];
abschlussDurchgangStarten();
ok('§1.3 Der Durchgang laeuft und zeigt Karte 1 von 2',
   !!abschlussLauf && abschlussLauf.idx===0 && abschlussLauf.ids.length===2);
ok('§1.3 BELEG: es ist DERSELBE Anlege-Dialog (entwurf gesetzt)',
   !!entwurf && entwurf.id==='C1');
ok('§1.4 BELEG: das Datum steht per Default auf morgen ('+MORGEN+')',
   entwurf.faelligkeit===MORGEN);
/* §1.4 BELEG: „morgen" ist der KALENDER, nicht der App-Tag — sonst schoebe
   ein seit Tagen offener Abschluss alles in die Vergangenheit. */
ok('§1.4 BELEG: „morgen" rechnet vom Kalender, nicht vom App-Tag', (function(){
     var keep=S.tag;
     S.tag=neuerTag('2026-09-11',1);          // App-Tag steht still
     var m=morgenIso();
     S.tag=keep;
     var kal=new Date(heuteIso()+'T12:00:00'); kal.setDate(kal.getDate()+1);
     var erwartet=kal.getFullYear()+'-'+String(kal.getMonth()+1).padStart(2,'0')+'-'+String(kal.getDate()).padStart(2,'0');
     return m===erwartet && m>heuteIso(); })());
ok('§1.3 Das Matrixfeld ist im Durchgang aenderbar', (function(){
     entwurf.matrixFeld='werkzeug'; return matrixFeldVon(entwurf)==='werkzeug'; })());
abschlussDurchgangWeiter();
ok('§1.3 „Weiter" speichert und geht zur zweiten Karte',
   !!abschlussLauf && abschlussLauf.idx===1 && entwurf && entwurf.id==='C2');
ok('§1.3 BELEG: die erste Karte traegt jetzt morgen und ihr neues Feld', (function(){
     var c1=S.karten.find(function(k){return k.id==='C1';});
     return c1.faelligkeit===MORGEN && matrixFeldVon(c1)==='werkzeug'; })());
abschlussDurchgangWeiter();
ok('§1.3 Nach der letzten Karte endet der Durchgang', abschlussLauf===null);
closeSheet();
/* §1.7 Mehrtaegig offen blockiert nichts */
frisch();
S.tag=neuerTag(GESTERN,1); S.tag.datum=GESTERN; S.tag.akku=70;
S.karten=[ neueKarte({id:'D1', domain:'dfm', titel:'D1', faelligkeit:GESTERN, sollMin:30}) ];
ok('§1.7 Ein Tag von gestern ist offen', tagOffen() && S.tag.datum<heuteIso());
oeffneTagAbschluss();
ok('§1.7 BELEG: der Abschluss laesst sich nachholen', !!abschlussTmp);
ok('§1.7 Der Banner zeigt den alten Tag mit Knopf',
   tagBannerHtml().indexOf('data-tagclose')>=0 && tagBannerHtml().indexOf('noch offen')>=0);
closeSheet();
ok('§1.7 Und die Suche funktioniert daneben weiter', (function(){
     S.ui.suSicht='heute'; var h2=suHeuteHtml(); return typeof h2==='string'; })());

/* ══ v2.1.0 · §2 DAS PLUS ÜBERALL ════════════════════════════════════ */
kopf('v2.1.0 §2 · Das Plus');
ok('§2 Das Plus liegt GLOBAL im Markup, nicht in der Suchkopfzeile',
   src.indexOf('id="neuFab"')>=0 && src.indexOf('id="suNeu"')<0);
ok('§2 Es liegt unter Backdrop/Sheet (199) — ein Dialog muss es verdecken',
   /#neuFab\{[^}]*z-index:199/.test(src));
ok('§2 In der Fokusansicht wandert es ueber den Layer',
   /body\.fokusOffen #neuFab\{z-index:201\}/.test(src));
ok('§2 44-px-Norm uebererfuellt (56 px)', /#neuFab\{[^}]*width:56px;height:56px/.test(src));


/* ══ v2.1.1 · §1 KARTE ANTIPPEN — ANSEHEN, NICHT STARTEN ═════════════ */
kopf('v2.1.1 §1 · Karte ansehen');
frisch();
S.karten=[ neueKarte({id:'X', domain:'dfm', titel:'Karte X', sollMin:30, faelligkeit:H()}),
           neueKarte({id:'Y', domain:'dfm', titel:'Karte Y', sollMin:30, faelligkeit:H()}) ];
ketteSetzen(['X','Y']);
fokusKarteAnsehen('X');
ok('§1 BELEG: Antippen oeffnet die Fokusansicht', fokusAnsichtOffen()===true);
ok('§1 BELEG: die Uhr steht (S.fokus unberuehrt)', S.fokus===null);
ok('§1 Die Ansicht zeigt die angetippte Karte', aktiveFokusKarte() && aktiveFokusKarte().id==='X');
/* Laeuft eine ANDERE Karte, laeuft sie weiter */
fokusStarten('Y'); fokusAnsichtSchliessen();
var startY=S.fokus.startMs;
fokusKarteAnsehen('X');
ok('§1 BELEG: waehrend Y laeuft, zeigt die Ansicht X', aktiveFokusKarte().id==='X');
ok('§1 BELEG: Y laeuft unveraendert weiter', S.fokus.karteId==='Y' && S.fokus.laeuft===true &&
   S.fokus.startMs===startY);
ok('§1 Der Divergenz-Schutz zieht die angesehene Karte NICHT zurueck', (function(){
     renderFokus(); return aktiveFokusKarte().id==='X' && S.ui.fokusZeigt==='X'; })());
/* ▶ in der Fokusansicht startet erst */
fokusStarten('X');
ok('§1 Erst ▶ startet die angesehene Karte', S.fokus.karteId==='X' && S.fokus.laeuft===true);
ok('§1 Danach ist die laufende die angezeigte', S.ui.fokusZeigt===null);

/* ══ v2.1.1 · §3 WANN DER DIALOG KOMMT ══════════════════════════════ */
kopf('v2.1.1 §3 · Buchungsdialog');
frisch();
S.karten=[ neueKarte({id:'P', domain:'dfm', titel:'P', sollMin:60, faelligkeit:H()}),
           neueKarte({id:'Q', domain:'dfm', titel:'Q', sollMin:30, faelligkeit:H()}) ];
ketteSetzen(['P','Q']);
fokusStarten('P'); S.fokus.startMs=Date.now()-10*60*1000; matrixTmp=null;
fokusToggle();   // PAUSE
ok('§3 BELEG Pausieren: KEIN Dialog', matrixTmp===null);
ok('§3 BELEG Pausieren: Zeit gebucht ('+Math.round(num(S.karten[0].istSek)/60)+'′)',
   Math.abs(num(S.karten[0].istSek)-600)<5);
ok('§3 Pausieren: Uhr steht', S.fokus.laeuft===false);
fokusAnsichtSchliessen();
ok('§3 Pausieren: Suche erreichbar (Ansicht zu)', fokusAnsichtOffen()===false);
/* Wechsel */
frisch();
S.karten=[ neueKarte({id:'P', domain:'dfm', titel:'P', sollMin:60, faelligkeit:H()}),
           neueKarte({id:'Q', domain:'dfm', titel:'Q', sollMin:30, faelligkeit:H()}) ];
ketteSetzen(['P','Q']);
fokusStarten('P'); S.fokus.startMs=Date.now()-7*60*1000; matrixTmp=null;
fokusStarten('Q');
ok('§3 BELEG Wechsel: alte Karte gestoppt und gebucht ('+Math.round(num(S.karten[0].istSek)/60)+'′)',
   Math.abs(num(S.karten[0].istSek)-420)<5 && S.fokus.karteId==='Q');
ok('§3 BELEG Wechsel: KEIN Dialog', matrixTmp===null);
/* Erledigen */
frisch();
S.karten=[ neueKarte({id:'E', domain:'dfm', titel:'E', sollMin:30, faelligkeit:H()}) ];
ketteSetzen(['E']); fokusStarten('E'); matrixTmp=null;
abhakDialog('E', false); abhakDialogConfirm();
ok('§3 BELEG Erledigen: der Dialog kommt', !!matrixTmp && matrixTmp.anlass==='abhaken');
closeSheet();
/* Schieben */
frisch();
S.karten=[ neueKarte({id:'F', domain:'dfm', titel:'F', sollMin:30, faelligkeit:H()}) ];
ketteSetzen(['F']); matrixTmp=null;
oeffneSchieben('F'); karteSchiebenA4('F', false, 0);
ok('§3 BELEG Schieben: der Dialog kommt', !!matrixTmp && matrixTmp.anlass==='schieben');
closeSheet();
/* Nur angesehen, nie gestartet */
frisch();
S.karten=[ neueKarte({id:'G', domain:'dfm', titel:'G', sollMin:30, faelligkeit:H()}) ];
matrixTmp=null;
fokusKarteAnsehen('G');
var istVor=num(S.karten[0].istSek), logVor=(S.intraday||[]).length;
fokusAnsichtSchliessen();
ok('§3 BELEG angesehen+geschlossen: kein Dialog', matrixTmp===null);
ok('§3 BELEG angesehen+geschlossen: keine Buchung',
   num(S.karten[0].istSek)===istVor && (S.intraday||[]).length===logVor && S.fokus===null);
/* Bewegungsbonus: vorher = die letzte gesetzte Position, auch von frueherer Karte */
frisch();
S.karten=[ neueKarte({id:'H1', domain:'dfm', titel:'H1', sollMin:30, faelligkeit:H()}),
           neueKarte({id:'H2', domain:'dfm', titel:'H2', sollMin:30, faelligkeit:H()}) ];
matrixPosSetzen(-0.6, 0, null, 'frueher');          // letzte Position — von einer frueheren Karte
fokusStarten('H1'); fokusStarten('H2');             // Wechsel ohne Dialog
ok('§3 Bewegungsbonus: H2 rechnet gegen die letzte gesetzte Position (−0,6)',
   S.karten[1].posVorher && Math.abs(S.karten[1].posVorher.x+0.6)<0.001);

/* ══ v2.1.1 · §4/§5 SUCHE ═══════════════════════════════════════════ */
kopf('v2.1.1 §4/§5 · Suche');
frisch();
S.karten=[ neueKarte({id:'r-zaehne', domain:'privat', titel:'Zähne putzen', rhythmus:{typ:'taeglich'}, faelligkeit:H()}),
           neueKarte({id:'r-mails',  domain:'dfm',    titel:'Mails bearbeiten', rhythmus:{typ:'taeglich'}, faelligkeit:H()}),
           neueKarte({id:'a-notiz',  domain:'dfm',    titel:'Angebot', notiz:'Rahmenvertrag pruefen', faelligkeit:H()}) ];
suchIndex=[];   // absichtlich LEER: der Index darf nie veraltet sein
function tr(q){ return sucheTreffer(q).map(function(o){return o.k.id;}); }
ok('§5/9 „zaehne" findet die private Routine', tr('zaehne').indexOf('r-zaehne')>=0);
ok('§5 „zähne" findet sie ebenso', tr('zähne').indexOf('r-zaehne')>=0);
ok('§5/9 „mails" findet die DFM-Routine', tr('mails').indexOf('r-mails')>=0);
ok('§5/9 ein Begriff aus der Notiz findet die Karte', tr('rahmenvertrag').indexOf('a-notiz')>=0);
/* Beide Domaenen in einer Liste */
S.karten.push(neueKarte({id:'p-putz', domain:'privat', titel:'Putzplan', faelligkeit:H()}));
S.karten.push(neueKarte({id:'d-putz', domain:'dfm', titel:'Putzmittel bestellen', faelligkeit:H()}));
var both=tr('putz');
ok('§5/10 Treffer beider Domaenen erscheinen gemeinsam ('+both.length+')',
   both.indexOf('p-putz')>=0 && both.indexOf('d-putz')>=0 && both.indexOf('r-zaehne')>=0);
/* Nach einem normalen Import sofort auffindbar (die gemessene Ursache) */
syncImport(JSON.stringify({appVersion:'2.1.1', karten:[
  {id:'neu-imp', domain:'privat', titel:'Frisch importiert', faelligkeit:H()}]}));
ok('§5 BELEG Ursache: frisch importierte Karte ist SOFORT auffindbar',
   tr('frisch').indexOf('neu-imp')>=0);
/* §4: kein unsichtbarer Begriff */
ok('§4 Platzhalter sagt nicht mehr „auch Erledigtes"',
   src.indexOf('auch Erledigtes …')<0 && src.indexOf('Offene Karten finden')>=0);
/* §4: Der echte Beleg („beim Start leer") laeuft im Harness beim BOOTEN
   (view=echt) — hier kann jsc init() nicht fahren. Geprueft wird nur, dass
   init den Pfad traegt. */
ok('§4 init() verwirft einen gespeicherten Suchbegriff (Code-Pfad vorhanden)',
   /if\(S\.ui && S\.ui\.suFrage\)\{ S\.ui\.suFrage=''/.test(src));

kopf('v2.1.2 · Suche-Tab aus der Fokusansicht, Kennzahl-Kacheln');
frisch();
S.karten=[ neueKarte({id:'T1', domain:'dfm', titel:'Tab-Test', sollMin:60, matrixFeld:'ziel', faelligkeit:H()}) ];
fokusStarten('T1');
var t0=S.fokus.startMs;
ok('§1 Karte laeuft, Fokusansicht offen', S.fokus.laeuft===true && S.ui.fokusOffen===true);
setTab('suche');
ok('§1 Tab „Suche" schliesst die Fokusansicht (fokusOffen=false, fokusZeigt=null)',
   S.ui.fokusOffen===false && S.ui.fokusZeigt==null);
ok('§1 ... die Karte laeuft weiter, Uhr unangetastet',
   S.fokus.laeuft===true && S.fokus.karteId==='T1' && S.fokus.startMs===t0);
S.ui.fokusOffen=true; setTab('statistik');
ok('§1 Tab „Statistik" ebenso', S.ui.fokusOffen===false && S.fokus.laeuft===true && S.fokus.startMs===t0);
S.ui.fokusOffen=true; setTab('suche',{fokusLassen:true});
ok('§1 interner Startpfad (fokusLassen) laesst die Ansicht offen', S.ui.fokusOffen===true);
var kk=S.karten[0];
var b1=fbWasDieseKarte(kk), b2=fbWoIchStehe(), b3=fbWasIchBewege(kk);
function kacheln(h){ return (h.match(/class="fbk[ "]/g)||[]).length; }
function grafiken(h){ return (h.match(/<svg|class="fbk-bar/g)||[]).length; }
ok('§2 Block 1: je Kachel eine Grafik ('+kacheln(b1)+' Kacheln)', kacheln(b1)>=2 && grafiken(b1)>=kacheln(b1));
ok('§2/v2.3 §9 Block 2: DFM, Privat, Outfit, Faktor F (+Kurve) als Kacheln mit Grafik',
   // (am Wochenende heissen die Kacheln „DFM · Wochenende (Sa+So)" — der Test ist wochentagsfest)
   kacheln(b2)>=4 && grafiken(b2)>=4 && /fbk-h">DFM( · Wochenende \(Sa\+So\))?</.test(b2) && /fbk-h">Privat( · Wochenende \(Sa\+So\))?</.test(b2));
ok('§2 Block 2: kein doppeltes „P P" mehr', b2.indexOf('P P')<0);
ok('§2 Block 3 ohne Position: Matrix statt nackter Text', b3.indexOf('<svg')>=0);
S.tag.matrixSpur=[{x:-0.6,y:0.4},{x:0.2,y:-0.2}];
b3=fbWasIchBewege(kk);
ok('v2.3 §8 Block 3 mit Position: grosse Matrix mit Tageslinie + zwei Kacheln',
   kacheln(b3)===3 && b3.indexOf('fb-mx')>=0 && b3.indexOf('unbekannt')>=0);
ok('§2 Grafiken fangen keine Klicks (pointer-events:none im CSS)',
   /\.fbk-g svg\{[^}]*pointer-events:none/.test(src) && /\.fbk-bar\{[^}]*pointer-events:none/.test(src));
ok('§2 Farb-Aliase definiert (--li/--bg2/--fg/--gut/--ac)', /--li:var\(--line\); --bg2:var\(--card\); --fg:var\(--txt\); --gut:var\(--ok\); --ac:var\(--blue\)/.test(src));
ok('§2 „Zur Suche" hat 44 px Tapflaeche', /\.fk-zu\{[^}]*min-height:44px/.test(src));

kopf('v2.2.0 §2 · Suche: Domäne und Art');
frisch();
S.karten=[
  neueKarte({id:'dA', domain:'dfm',    titel:'Filter DFM Aufgabe', matrixFeld:'ziel', faelligkeit:H()}),
  neueKarte({id:'pA', domain:'privat', titel:'Filter Privat Aufgabe', matrixFeld:'ziel', faelligkeit:H()}),
  neueKarte({id:'dR', domain:'dfm',    titel:'Filter DFM Routine', rhythmus:{typ:'taeglich'}, matrixFeld:'werkzeug', sollMin:10, faelligkeit:H()}),   // v2.8: mit Soll-Minuten → keine Abhak-Karte, steht im Kalender
  neueKarte({id:'pR', domain:'privat', titel:'Filter Privat Routine', rhythmus:{typ:'taeglich'}, matrixFeld:'werkzeug', sollMin:10, faelligkeit:H()}),
  neueKarte({id:'pC', domain:'privat', titel:'Filter Privat Counter', ticksAktiv:true, matrixFeld:'werkzeug', sollMin:10, faelligkeit:H()}) ];
S.karten.forEach(function(k){ k.letzteBearbeitung=jetztIso(); k.streak=1; });
ketteSetzen(['dA','pA','dR','pR','pC']);
suchIndex=[];
function idsIn(h){ var r=[], re=/data-kid="([^"]+)"/g, m; while((m=re.exec(h))) if(r.indexOf(m[1])<0) r.push(m[1]); return r.sort().join(','); }
var KOMBI=[['alle','alle','dA,dR,pA,pC,pR'],['privat','routinen','pC,pR'],['dfm','aufgaben','dA'],
           ['privat','aufgaben','pA'],['dfm','routinen','dR'],['alle','routinen','dR,pC,pR'],['dfm','alle','dA,dR']];
KOMBI.forEach(function(c){
  S.ui.suDom=c[0]; S.ui.suArt=c[1];
  ['heute','faellig','art','oft'].forEach(function(v){
    var h=suSichtHtml(v);
    ok('§2 '+c[0]+' + '+c[1]+' · Sicht '+v+' → '+c[2], idsIn(h)===c[2]);
  });
  S.ui.suMatrixFeld=null;
  var hm='', fe=['ziel','werkzeug'];
  fe.forEach(function(f){ S.ui.suMatrixFeld=f; hm+=suMatrixHtml(); });
  S.ui.suMatrixFeld=null;
  ok('§2/§5 '+c[0]+' + '+c[1]+' · Matrix (Feld geöffnet) → '+c[2], idsIn(hm)===c[2]);
  ok('§2 '+c[0]+' + '+c[1]+' · Freitext „filter" → '+c[2], idsIn(suFreitextHtml('filter'))===c[2]);
});
S.ui.suDom='privat'; S.ui.suArt='routinen'; saveUi();
var gespeichert=JSON.parse(_store[Object.keys(_store).filter(function(k){ return /ui$/.test(k); })[0]]||'{}');
ok('§2 Filterwahl steht im Speicher (übersteht den Neustart)', gespeichert.suDom==='privat' && gespeichert.suArt==='routinen');
ok('§2 aktive Filterung steht in der Kopfzeile', suHeuteHtml().indexOf('Privat · Routinen und Counter')>=0);
renderSuche();
var fl=el('suFilter').innerHTML, sl=el('suSichten').innerHTML;
ok('§2 zwei Segment-Leisten mit allen Werten', ['data-sudom="alle"','data-sudom="dfm"','data-sudom="privat"',
   'data-suart="alle"','data-suart="aufgaben"','data-suart="routinen"'].every(function(x){ return fl.indexOf(x)>=0; }));
ok('§2 aktive Segmente markiert', /class="on" data-sudom="privat"/.test(fl) && /class="on" data-suart="routinen"/.test(fl));
ok('§2 Erledigt-Filter sitzt bei den Filtern, nicht mehr in der Sicht-Leiste', fl.indexOf('data-suerl')>=0 && sl.indexOf('data-suerl')<0);
ok('§2 Sicht-Leiste hat genau die fünf Sichten', (sl.match(/data-susicht=/g)||[]).length===5);
S.ui.suDom='alle'; S.ui.suArt='alle';

kopf('v2.2.0 §3 · Matrix-Feld zeigt seine Karten');
S.ui.suMatrixFeld='werkzeug';
var mh=suMatrixHtml();
ok('§3 gewähltes Feld: eigene Liste mit Zurück, ohne Raster davor', mh.indexOf('su-mxzurueck')>=0 && mh.indexOf('su-mxgrid')<0 && idsIn(mh)==='dR,pC,pR');
S.ui.suMatrixFeld='ablenkung';
ok('§3 leeres Feld sagt es ausdrücklich', suMatrixHtml().indexOf('Keine Karte in diesem Feld')>=0);
S.ui.suMatrixFeld=null;
ok('§3 ohne Wahl: Raster mit vier Feldern', (suMatrixHtml().match(/data-sumx=/g)||[]).length===4);

kopf('v2.2.0 §4 · Belohnungsseite');
frisch(); belohnungInit();
S.meta.muenzenGesamt=100000; S.meta.ausgegebenGesamt=0;
renderBelohnung();
var bh=el('belohnungBody').innerHTML;
ok('§4 drei Bereiche', bh.indexOf('Was heute noch geht')>=0 && bh.indexOf('Was ich schon erklommen habe')>=0 && bh.indexOf('Outfit und Shop')>=0);
var kach=bh.split(/<div class="fbk( voll)?"/).filter(function(x,i){ return i>0 && x!==undefined && x!==' voll'; });
var ohneGrafik=kach.filter(function(k){ return !/<svg|fbk-bar|bw-of/.test(k); });
ok('§4 jede Kachel hat eine Grafik ('+kach.length+' Kacheln, ohne: '+ohneGrafik.length+')', kach.length>=9 && ohneGrafik.length===0);
ok('§4 Outfit-Leiste zeigt alle 20 Stufen', (bh.match(/class="bw-ofz /g)||[]).length===20);
ok('§4 Outfit: heute + nächste markiert, spätere als Silhouette', /bw-ofz heute/.test(bh) && /bw-ofz naechste/.test(bh) && /bw-ofz spaeter/.test(bh));
ok('§4 Shop: sechs Kategorien', (bh.match(/class="bw-kat"/g)||[]).length===6);
ok('§4 Rang-Kachel und Mini-Kurve Rangverlauf', bh.indexOf('Rang über 8 Wochen')>=0);
ok('§4 Shop-Reset NICHT auf der Seite', bh.indexOf('data-shopreset')<0);
var kontoVor=konto(), stufeVor=num(S.belohnung.stufen.soziales);
ok('§4 Kaufen-Knopf auf der Seite', bh.indexOf('data-kauf="soziales"')>=0);
momentRangCheck(); var mrcOk=true; try{ momentRangCheck(); }catch(ex){ mrcOk=false; }
ok('momentRangCheck wirft beim zweiten Aufruf nicht mehr (st-Referenzfehler)', mrcOk);
var gekauft=kaufen('soziales');
ok('§4/7 Kauf: Konto sinkt, Stufe steigt', gekauft && konto()<kontoVor && num(S.belohnung.stufen.soziales)===stufeVor+1);
S.ui.belKatAuf={soziales:true}; renderBelohnung(); bh=el('belohnungBody').innerHTML;
ok('§4 aufgeklappt: zwölf Stufen, gekaufte mit Text',
   (bh.match(/class="bw-st (gekauft|naechste|gesperrt)"/g)||[]).length>=12 &&
   bh.indexOf('Die Runde geht auf dich')>=0);
/* Nachtrag v2.2.0: gekaufte + GENAU die nächste Stufe zeigen Text, alle danach „???" */
function sichtbareTexte(h){ var r=[]; KAT_KEYS.forEach(function(k){ var n=num(S.belohnung.stufen[k]);
  BELOHNUNG[k].stufen.forEach(function(st,i){ if(i+1>n && h.indexOf(esc(st[0]))>=0 &&
    // Texte, die auch in einer GEKAUFTEN Stufe stehen, zählen nicht
    !BELOHNUNG[k].stufen.slice(0,n).some(function(x){ return x[0]===st[0]; })) r.push(k+':'+(i+1)); }); }); return r; }
S.ui.belKatAuf={}; KAT_KEYS.forEach(function(k){ S.ui.belKatAuf[k]=true; }); renderBelohnung(); bh=el('belohnungBody').innerHTML;
var sicht=sichtbareTexte(bh), erwartet=KAT_KEYS.map(function(k){ return k+':'+(num(S.belohnung.stufen[k])+1); });
ok('Nachtrag: je Kategorie genau EINE ungekaufte Stufe mit Text — die nächste ('+sicht.join(', ')+')',
   JSON.stringify(sicht.slice().sort())===JSON.stringify(erwartet.slice().sort()));
ok('Nachtrag: soziales Stufe 3 sichtbar, Stufe 4 „???"', bh.indexOf('Grillabend bei dir')>=0 && bh.indexOf('Grillabend, der bis nachts geht')<0);
ok('Nachtrag: nächste Stufe hat Preis/Kaufen-Knopf', bh.indexOf('data-kauf="soziales"')>=0);
kaufen('soziales'); renderBelohnung(); bh=el('belohnungBody').innerHTML;
ok('Nachtrag: Kauf deckt die darauffolgende Stufe auf (soziales 4 sichtbar, 5 „???")',
   bh.indexOf('Grillabend, der bis nachts geht')>=0 && bh.indexOf('Roadtrip mit vier Leuten')<0 &&
   sichtbareTexte(bh).filter(function(x){ return x.indexOf('soziales:')===0; }).join()==='soziales:4');
// v2.6.0 §1: die Rang-Zelle ist entfallen — die Belohnungsseite bleibt ueber die Figur erreichbar
ok('§1 Figur führt auf die Seite (Code-Pfad; Rang-Zelle seit v2.6 entfallen)', typeof zurBelohnung==='function' &&
   !/#sZRang/.test(src) && /el\('btnFigur'\)\.addEventListener\('click', zurBelohnung\)/.test(src));

kopf('v2.2.0 §5 · Zwölf Stufentexte je Kategorie');
var PREISE={fahrzeuge:[0,800,2200,4500,7500,11000,16000,22000,29000,37000,46000,56000],
  wohnen:[0,900,2400,4800,7800,11500,16500,23000,30000,39000,48000,58000],
  reisen:[0,1000,2800,5200,8200,12000,17000,23500,30500,39500,49000,59000],
  mobilitaet:[0,700,2000,3800,6500,10000,14500,20000,26500,34000,43000,53000],
  begleiter:[0,600,1800,3600,6000,9500,14000,19500,26000,33500,42000,52000],
  soziales:[0,500,1600,3200,5500,8800,13000,18000,24500,32000,41000,51000]};
KAT_KEYS.forEach(function(k){
  var st=BELOHNUNG[k].stufen, texte=st.map(function(x){ return x[0]; });
  ok('§5 '+k+': 12 Stufen, 12 verschiedene Texte', st.length===12 && texte.filter(function(t,i){ return texte.indexOf(t)===i; }).length===12);
  ok('§5 '+k+': Schwellen byte-gleich', JSON.stringify(st.map(function(x){ return x[1]; }))===JSON.stringify(PREISE[k]));
});
ok('§5 drei Quer-Voraussetzungen unverändert',
   JSON.stringify(BELOHNUNG.fahrzeuge.stufen[6][2])==='["wohnen",4]' &&
   JSON.stringify(BELOHNUNG.wohnen.stufen[3][2])==='["fahrzeuge",3]' &&
   JSON.stringify(BELOHNUNG.reisen.stufen[7][2])==='["mobilitaet",6]' &&
   KAT_KEYS.reduce(function(a,k){ return a+BELOHNUNG[k].stufen.filter(function(x){ return x[2]; }).length; },0)===3);
ok('§5 Stichproben', BELOHNUNG.wohnen.stufen[11][0]==='Berge im Rücken, Dschungel links, Meer voraus' &&
   BELOHNUNG.mobilitaet.stufen[4][0]==='Schnuppertauchen' && BELOHNUNG.begleiter.stufen[11][0]==='Und niemand muss draußen bleiben');

kopf('v2.3.0 §1–§3 · Suche: kompakt, nur Fälliges, Ungeplantes ans Ende');
frisch();
var MO=(function(){ var d=new Date(H()+'T12:00:00'); var wt=((d.getDay()+6)%7)+1; return wt; })();
S.karten=[
  neueKarte({id:'h1', domain:'dfm', titel:'Heute faellig', matrixFeld:'ziel', faelligkeit:H()}),
  neueKarte({id:'u1', domain:'dfm', titel:'Ueberfaellig gestern', matrixFeld:'ziel', faelligkeit:anVorTage(H(),3)}),
  neueKarte({id:'z1', domain:'dfm', titel:'Zukunft naechste Woche', matrixFeld:'ziel', faelligkeit:anVorTage(H(),-7)}),
  neueKarte({id:'o1', domain:'privat', titel:'Ohne Datum', matrixFeld:'ziel'}),
  neueKarte({id:'rT', domain:'privat', titel:'Routine taeglich', matrixFeld:'werkzeug', rhythmus:{typ:'taeglich'}, sollMin:10, faelligkeit:H()}),   // v2.8: Soll-Minuten → im Kalender
  neueKarte({id:'rN', domain:'privat', titel:'Routine alle 7 Tage', matrixFeld:'werkzeug',
             rhythmus:{typ:'alleNTage', n:7}, zuletztRoutine:anVorTage(H(),1), faelligkeit:H()}),
  neueKarte({id:'cC', domain:'privat', titel:'Counter ohne Rhythmus', matrixFeld:'werkzeug', ticksAktiv:true, sollMin:10, faelligkeit:H()}) ];
ketteSetzen(['h1','u1','z1','o1','rT','rN','cC']);
suchIndex=[];
function idsIn2(h){ var r=[], re=/data-kid="([^"]+)"/g, m; while((m=re.exec(h))) if(r.indexOf(m[1])<0) r.push(m[1]); return r; }
var heute=idsIn2(suHeuteHtml());
ok('§2 heute nicht fällige Routine (7-Tage) fehlt überall · Sicht Heute ['+heute.join(',')+']', heute.indexOf('rN')<0);
ok('§2 tägliche Routine und Counter bleiben', heute.indexOf('rT')>=0 && heute.indexOf('cC')>=0);
ok('§2 auch der Freitext zeigt die nicht fällige nicht', idsIn2(suFreitextHtml('routine')).indexOf('rN')<0);
S.ui.suArt='routinen';
// v2.8.0 §1.2: Abhak-Karten (Routinen ohne Soll-Minuten) stehen nicht mehr im KALENDER —
// die Ausnahme gilt in der Suche weiter, hier in der Sicht „Art"
var nurRout=idsIn2(suArtHtml());
ok('§2 Ausnahme: Art-Filter „Routinen und Counter" zeigt auch die nicht fällige', nurRout.indexOf('rN')>=0);
ok('§2 Ausnahme steht in der Kopfzeile', suHeuteHtml().indexOf('auch heute nicht fällige')>=0);
ok('§2 Ausnahme wirkt auch im Freitext', idsIn2(suFreitextHtml('routine')).indexOf('rN')>=0);
S.ui.suArt='alle';
var reihe=idsIn2(suHeuteHtml());
ok('§3 heute + überfällig vor dem nicht Eingeplanten ['+reihe.join(',')+']',
   reihe.indexOf('h1')<reihe.indexOf('z1') && reihe.indexOf('u1')<reihe.indexOf('z1') &&
   reihe.indexOf('u1')<reihe.indexOf('o1') && reihe[reihe.length-1]!=='h1');
ok('§3 überfällige NICHT ausgegraut', kartenreiheHtml(S.karten.find(function(k){return k.id==='u1';}),'t').indexOf('eingefroren')<0);
ok('§3 Zukunft und ohne Datum ausgegraut',
   kartenreiheHtml(S.karten.find(function(k){return k.id==='z1';}),'t').indexOf('eingefroren')>=0 &&
   kartenreiheHtml(S.karten.find(function(k){return k.id==='o1';}),'t').indexOf('eingefroren')>=0);
var frei=suFreitextHtml('faellig'), sicht=suFaelligHtml();
ok('§1 Freitext: Karten kompakt (zwei Zeilen, keine Knopfreihe)',
   frei.indexOf('krow kompakt')>=0 && frei.indexOf('ktools')<0 && frei.indexOf('data-detail=')>=0);
ok('§1 Sichten unverändert (Knopfreihe bleibt; „Heute" ist seit v2.4 der Kalender)', sicht.indexOf('ktools')>=0 && sicht.indexOf('krow kompakt')<0);

kopf('v2.3.0 §4 · Der Vorschlag ist immer ein Werkzeug');
frisch();
S.karten=[
  neueKarte({id:'wD', domain:'dfm', titel:'DFM-Werkzeug', matrixFeld:'werkzeug', sollMin:10, faelligkeit:H()}),
  neueKarte({id:'wP', domain:'privat', titel:'Privates Werkzeug', matrixFeld:'werkzeug', sollMin:5, faelligkeit:H()}),
  neueKarte({id:'zA', domain:'dfm', titel:'Ziel-Aufgabe', matrixFeld:'ziel', sollMin:60, faelligkeit:H()}) ];
S.tag.akku=80;
ok('§4 Reihenfolge: DFM-Werkzeug vor privatem', werkzeugReihenfolge().map(function(k){return k.id;}).join(',')==='wD,wP');
matrixPosSetzen(0.6,0.2,null,'test');          // rechts — frueher haette es die Kette vorgeschlagen
zeigeVorschlag('zA');
ok('§4 Vorschlag ist das DFM-Werkzeug', S.ui.suVorschlag && S.ui.suVorschlag.kid==='wD');
ok('§4 Sprung in die Suche, Sicht Matrix, Feld Werkzeug',
   S.ui.tab==='suche' && S.ui.suSicht==='matrix' && S.ui.suMatrixFeld==='werkzeug');
ok('§4 keine eigene Vorschlagsansicht mehr (kein Sheet)', !sheetOffen());
var mh2=suMatrixHtml();
ok('§4 Vorschlag steht OBEN in der Werkzeug-Liste, mit Grund',
   mh2.indexOf('su-vorschlag')>=0 && mh2.indexOf('data-kid="wD"')<mh2.indexOf('data-kid="wP"'));
ok('§4 Filter unberührt', suDom()==='alle' && suArtW()==='alle');
S.karten=S.karten.filter(function(k){ return k.id!=='wD'; });
S.tag.vorschlagGezeigt=[]; S.ui.suVorschlag=null;
zeigeVorschlag('zA');
ok('§4 ohne DFM-Werkzeug kommt das private', S.ui.suVorschlag && S.ui.suVorschlag.kid==='wP');
S.karten=S.karten.filter(function(k){ return k.id==='zA'; });
S.tag.vorschlagGezeigt=[]; S.ui.suVorschlag=null; S.ui.suSicht='heute';
zeigeVorschlag('zA');
ok('§4 ganz ohne Werkzeug: kein Sprung, ehrliche Auskunft', !S.ui.suVorschlag && S.ui.suSicht==='heute');

kopf('v2.3.0 §5/§6 · Matrix-Picker und neue Karte im Fokus');
frisch();
ok('§5 Feld-Pad statt Auswahlliste im Anlege-Dialog',
   /function matrixFeldPadHtml/.test(src) && matrixFeldPadHtml('werkzeug').indexOf('dmxPad')>=0 &&
   /matrixFeldPadHtml\(mf\)/.test(src) && !/data-dmx="/.test(src));
ok('§5 Pad kennt alle vier Felder und markiert das aktuelle',
   MATRIX_FELDER.every(function(f){ return matrixFeldPadHtml('ziel').indexOf(MATRIX_META[f].name)>=0; }) &&
   /mxq q4 on/.test(matrixFeldPadHtml('ziel')));
ok('§5 Quadrant → Feld: rechts-oben Werkzeug, links-unten Zustand',
   matrixFeldAusXY(0.5,0.5)==='werkzeug' && matrixFeldAusXY(-0.5,-0.5)==='zustand' &&
   matrixFeldAusXY(-0.5,0.5)==='ablenkung' && matrixFeldAusXY(0.5,-0.5)==='ziel');
S.karten=[ neueKarte({id:'lauf', domain:'dfm', titel:'Laeuft gerade', matrixFeld:'ziel', sollMin:60, faelligkeit:H()}) ];
fokusStarten('lauf');
S.fokus.startMs=Date.now()-300000;                 // 5 Minuten gelaufen
var istVor=num(S.karten[0].istSek);
oeffneDetail(null); entwurf.titel='Frisch angelegt'; entwurf.domain='dfm'; entwurf.sollMin=30;
detailSpeichern();
var neuK=S.karten.find(function(k){ return k.titel==='Frisch angelegt'; });
ok('§6 neue Karte ist der Fokus und steht PAUSIERT', !!neuK && S.fokus.karteId===neuK.id && S.fokus.laeuft===false);
ok('§6 Fokusansicht offen', fokusAnsichtOffen()===true);
ok('§6 laufende Karte pausiert, ihre Zeit ist gebucht ('+Math.round(num(S.karten[0].istSek)-istVor)+' s)',
   num(S.karten[0].istSek)-istVor>=290);
ok('§6 kein Buchungsdialog', !sheetOffen());

kopf('v2.3.0 §7/§8 · Zeitstrahl-Tipp und die grosse Matrix');
ok('§7 Zeitstrahl-Zeilen tragen data-zskarte und öffnen die Fokusansicht',
   /data-zskarte="/.test(src) && /closest\('\[data-zskarte\]'\).*fokusKarteAnsehen/.test(src));
frisch();
S.karten=[ neueKarte({id:'m1', domain:'dfm', titel:'Matrix-Karte', matrixFeld:'ziel', sollMin:60, faelligkeit:H()}) ];
S.tag.startTs=new Date(Date.now()-240*60000).toISOString();     // Tag laeuft seit 4 h
S.tag.matrixSpur=[
  { ts:new Date(Date.now()-200*60000).toISOString(), x:-0.6, y:0.5 },   // 60 Min Ablenkung
  { ts:new Date(Date.now()-140*60000).toISOString(), x:0.7, y:0.6 },    // 40 Min Werkzeug
  { ts:new Date(Date.now()-100*60000).toISOString(), uebersprungen:true },  // 40 Min unbekannt
  { ts:new Date(Date.now()-60*60000).toISOString(), x:0.8, y:-0.5 } ];  // 60 Min unbekannt (nach der letzten)
var z=matrixZeitFelder();
ok('§8 Zeit je Feld aus der Spur (Ablenkung '+Math.round(z.felder.ablenkung)+', Werkzeug '+Math.round(z.felder.werkzeug)+')',
   Math.round(z.felder.ablenkung)===60 && Math.round(z.felder.werkzeug)===40 && Math.round(z.felder.ziel)===0);
ok('§8 unbekannt = vor der ersten (40) + Übersprung (40) + nach der letzten (60) = '+Math.round(z.unbekannt),
   Math.round(z.unbekannt)===140);
ok('§8 Summe Felder + unbekannt = Messzeit ('+Math.round(z.mess)+' Min = 240)',
   Math.round(z.felder.ablenkung+z.felder.zustand+z.felder.werkzeug+z.felder.ziel+z.unbekannt)===Math.round(z.mess) &&
   Math.round(z.mess)===240);
var gm=fbGrosseMatrix();
ok('§8 grosse Matrix mit Tageslinie, Feldzeiten und hervorgehobenem Jetzt',
   gm.svg.indexOf('fb-mx')>=0 && (gm.svg.match(/<line /g)||[]).length>=4 && gm.svg.indexOf('60′')>=0 && gm.n===3);
ok('§8 Grafik fängt keine Klicks (pointer-events:none)', /\.fb-mx\{[^}]*pointer-events:none/.test(src));

kopf('v2.3.0 §9/§10 · Wo ich heute stehe');
var b9=fbWoIchStehe();
ok('§9 DFM und Privat getrennt, je mit Zielmarke',
   /fbk-h">DFM( · Wochenende \(Sa\+So\))?</.test(b9) && /fbk-h">Privat( · Wochenende \(Sa\+So\))?</.test(b9) && (b9.match(/fbk-bar mitmarke/g)||[]).length>=2);   // wochentagsfest
ok('§9 die Ziele sind die Domänen-Ziele',
   // v2.6.0 §6: exakt mit Tausenderpunkt statt „5k"
   b9.indexOf(fmtP(zielUndIstHeute('dfm').ziel))>=0 && b9.indexOf(fmtP(zielUndIstHeute('privat').ziel))>=0);
/* v2.5.0 §1.1: die v2.3-Kachel „Tagesverlauf" ist durch das ORIGINAL aus der
   Detailanalyse ersetzt — „Heute gegen typische Tage" = Aktivitaetsfenster aus „Verhalten". */
ok('§10→v2.5 §1.1 „Heute gegen typische Tage" (Aktivitätsfenster) statt Tagesverlauf-Neubau',
   b9.indexOf('Heute gegen typische Tage')>=0 && b9.indexOf('fb-kurve')<0);
ok('§10→v2.5 §1.1 identisch zur Detailanalyse (anAktivitaetsfenster ist der Kopf von „Verhalten")',
   b9.indexOf(anAktivitaetsfenster(S.ui.analyseDomain||'alle'))>=0 && /function anModVerhalten\(F,dom\)\{\s*const chart=anAktivitaetsfenster\(dom\)/.test(src));

kopf('v2.4.0 §1 · Drei Tabs, Import oben, Ampel');
ok('§1.1 drei Tabs: Suche · Statistik · Einstellungen',
   /data-tab="suche"[\s\S]*data-tab="statistik"[\s\S]*data-tab="einst"/.test((src.match(/<nav id="nav">[\s\S]*?<\/nav>/)||[''])[0]));
ok('§1.3 das Zahnrad ist weg, die Mini-Kurve sitzt an seiner Stelle',
   src.indexOf('id="btnEinst"')<0 && src.indexOf('id="btnKurve"')>=0);
frisch(); renderEinst();
var eb=el('einstBody').innerHTML;
ok('§1.2 Einstellungen beginnen mit dem Import-Feld', eb.indexOf('einstImport')>=0 && eb.indexOf('einstImport')<eb.indexOf('btnSync'));
ok('§1.2 Import aus den Einstellungen wirkt (gleiche Funktion syncImport)',
   (function(){ var r=syncImport(JSON.stringify({appVersion:'2.4.0', karten:[{id:'imp-e', domain:'privat', titel:'Aus den Einstellungen'}]}));
     return !r.fehler && S.karten.some(function(k){ return k.id==='imp-e'; }); })());
ok('§1.4 Ampel-Stufen nach Tabelle',
   ampelStufe(0.25)==='gruen' && ampelStufe(0.2)==='gelb' && ampelStufe(0.05)==='gelb' && ampelStufe(0)==='gelb' &&
   ampelStufe(-0.05)==='orange' && ampelStufe(-0.2)==='orange' && ampelStufe(-0.21)==='rot' && ampelStufe(null)==='grau');
/* Belege je Farbe: Vergleichstage gleicher Art (Werktag/Wochenende) mit festem Stand zur selben Uhrzeit */
function ampelMit(istP, normP, n, weVergleich){
  frisch(); _ampelMemo=null;
  var heuteF=belFensterDatum(jetztIso()), heuteWE=istWochenendTag(heuteF), tage=[], d=heuteF;
  for(var i=1; tage.length<n && i<60; i++){ d=anVorTage(heuteF,i); if(istWochenendTag(d)===(weVergleich==null?heuteWE:weVergleich)) tage.push(d); }
  S.intraday=[];
  tage.forEach(function(t){ S.intraday.push({ts:t+'T07:00:00', punkte:normP, minuten:30, domaene:'dfm', kartenId:'x'}); });
  // heute: Punkte vor jetzt
  S.intraday.push({ts:new Date(Date.now()-60000).toISOString(), punkte:istP, minuten:30, domaene:'dfm', kartenId:'x'});
  S.tag.startTs=new Date(Date.now()-6*3600000).toISOString();
  return tagesAmpel();
}
var g=ampelMit(1300,1000,4); ok('§1.4 grün bei +30 % ('+g.stufe+', r='+(g.r!=null?Math.round(g.r*100):'—')+' %)', g.stufe==='gruen');
var ge=ampelMit(1100,1000,4); ok('§1.4 gelb bei +10 % ('+ge.stufe+')', ge.stufe==='gelb');
var o=ampelMit(900,1000,4);  ok('§1.4 orange bei −10 % ('+o.stufe+')', o.stufe==='orange');
var r=ampelMit(500,1000,4);  ok('§1.4 rot bei −50 % ('+r.stufe+')', r.stufe==='rot');
var gr=ampelMit(1300,1000,2); ok('§1.4 grau ohne belastbare Basis (2 Vergleichstage)', gr.stufe==='grau');
var fa=ampelMit(1300,1000,4,!istWochenendTag(belFensterDatum(jetztIso())));
ok('§1.4 Werktag nur gegen Werktag: Tage der anderen Art zählen nicht ('+fa.n+' Vergleichstage)', fa.n===0 && fa.stufe==='grau');

kopf('v2.4.0 §2 · Heute als Kalender');
frisch();
var jetztH=jetztStunde(), terminH=Math.min(22, Math.floor(jetztH)+2);
S.karten=[
  neueKarte({id:'kT', domain:'dfm', titel:'Termin', uhrzeit:String(terminH).padStart(2,'0')+':00', sollMin:60, faelligkeit:H()}),
  neueKarte({id:'kA', domain:'dfm', titel:'Kette A', sollMin:30, faelligkeit:H()}),
  neueKarte({id:'kB', domain:'dfm', titel:'Kette B', sollMin:45, faelligkeit:H()}),
  neueKarte({id:'kE', domain:'dfm', titel:'Erledigt', sollMin:20, status:'erledigt', tagId:aktuelleTagId(), faelligkeit:H()}) ];
ketteSetzen(['kA','kB','kT','kE']);
S.intraday=[{ts:new Date(Date.now()-90*60000).toISOString(), kartenId:'kE', minuten:20, typ:'timer', punkte:50, domaene:'dfm'}];
S.ui.suErledigt=true;
var bl=kalenderBloecke(suSichtbar(tagesKette().map(function(id){ return S.karten.find(function(k){return k.id===id;}); })));
function bFor(id){ return bl.filter(function(b){ return b.kid===id; })[0]; }
ok('§2 Termin steht an seiner Uhrzeit', bFor('kT') && Math.abs(bFor('kT').von-terminH)<0.01 && bFor('kT').art==='termin');
ok('§2 Kettenkarte A beginnt JETZT', bFor('kA') && Math.abs(bFor('kA').von-jetztH)<0.02 && bFor('kA').art==='plan');
ok('§2 B folgt A mit dessen Soll-Minuten', bFor('kB') && Math.abs(bFor('kB').von-(bFor('kA').bis))<0.02 || (bFor('kB') && bFor('kB').von>=bFor('kT').bis-0.01));
ok('§2 Hochrechnung überbucht keinen Termin', bl.filter(function(b){ return b.art==='plan'; }).every(function(b){ return b.bis<=bFor('kT').von+1e-6 || b.von>=bFor('kT').bis-1e-6; }));
var bE=bFor('kE');
ok('§2 Erledigtes zur echten Zeit aus der Sitzung (Ende 90 Min vor jetzt, 20 Min lang)',
   bE && bE.art==='erledigt' && Math.abs(bE.bis-(jetztH-1.5))<0.05 && Math.abs((bE.bis-bE.von)*60-20)<1);
var kh=suHeuteHtml();
ok('§2 Kalender mit Jetzt-Linie und tappbaren Blöcken', kh.indexOf('kal-jetzt')>=0 && kh.indexOf('data-kalkarte="kA"')>=0);
fokusStarten('kA');
kh=suHeuteHtml();
ok('§2 laufende Karte hervorgehoben', /kal-b laeuft[^"]*" role="button" data-kalkarte="kA"/.test(kh));
S.ui.suErledigt=false;

kopf('v2.4.0 §3 · Suchknopf und eigene Volltextsuche');
frisch();
S.karten=[ neueKarte({id:'r7', domain:'privat', titel:'Wäsche waschen', rhythmus:{typ:'alleNTage',n:7}, zuletztRoutine:anVorTage(H(),1), faelligkeit:H()}),
           neueKarte({id:'dz', domain:'dfm', titel:'Zeichnung prüfen', status:'erledigt', faelligkeit:H()}) ];
suchIndex=[];
ok('§3 Suchknopf gegenüber dem Plus', /#suchFab\{[^}]*left:16px/.test(src) && /#neuFab\{[^}]*right:16px/.test(src));
el('suchInput').value='waesche'; suchF={dom:'alle',art:'alle',status:'offen'}; renderSuchTreffer();
var sl=el('suchList').innerHTML;
ok('§3 findet die heute NICHT fällige Routine (7-Tage) — „waesche" = „wäsche"', sl.indexOf('data-kid="r7"')>=0);
ok('§3 Treffer kompakt, zweizeilig', sl.indexOf('krow kompakt')>=0 && sl.indexOf('ktools')<0);
ok('§3 drei Filter mit Defaults Alle · Alle · Offen',
   /data-sf="dom" data-v="alle" aria-pressed="true"/.test(el('suchFilter').innerHTML) &&
   /data-sf="art" data-v="alle" aria-pressed="true"/.test(el('suchFilter').innerHTML) &&
   /data-sf="status" data-v="offen" aria-pressed="true"/.test(el('suchFilter').innerHTML));
el('suchInput').value='zeichnung'; renderSuchTreffer();
ok('§3 Status „Offen" blendet Erledigtes aus', el('suchList').innerHTML.indexOf('data-kid="dz"')<0);
suchF.status='erledigt'; renderSuchTreffer();
ok('§3 Status „Erledigt" zeigt es', el('suchList').innerHTML.indexOf('data-kid="dz"')>=0);
el('suchInput').value='gibtsnicht xyz'; suchF.status='offen'; renderSuchTreffer();
ok('§3 auch bei null Treffern steht „Neu anlegen"', el('suchList').innerHTML.indexOf('data-suchneu')>=0);
suchNeuAnlegen();
ok('§3 „Neu anlegen" übernimmt den Suchbegriff als Titel', entwurf && entwurf.titel==='gibtsnicht xyz' && entwurfNeu===true);
closeSheet();

kopf('v2.4.0 §4 · Counter bleibt nach „+" sichtbar');
frisch();
S.karten=[ neueKarte({id:'cR', domain:'privat', titel:'Wasser trinken', ticksAktiv:true, rhythmus:{typ:'taeglich'}, matrixFeld:'werkzeug', faelligkeit:H()}),
           neueKarte({id:'cN', domain:'privat', titel:'Liegestütze', ticksAktiv:true, matrixFeld:'werkzeug', faelligkeit:H()}) ];
ketteSetzen(['cR','cN']);
ok('§4 BELEG Ursache: routErledigtHeute zählt die Tick-Karte ab dem 1. Tick als erledigt',
   (function(){ karteTick('cR'); return routErledigtHeute(S.karten[0])===true; })());
karteTick('cR'); karteTick('cR'); karteTick('cN'); karteTick('cN');
var sichtbar=[suHeuteHtml(), suFaelligHtml(), suArtHtml(), suOftHtml()].join('');
ok('§4 Counter-Routine nach 3× „+" weiter sichtbar', sichtbar.indexOf('data-kid="cR"')>=0);
ok('§4 Counter ohne Rhythmus nach 2× „+" weiter sichtbar', sichtbar.indexOf('data-kid="cN"')>=0);
ok('§4 … und im Freitext', suFreitextHtml('wasser').indexOf('data-kid="cR"')>=0);
S.karten[0].status='erledigt'; S.karten[0].tagId=aktuelleTagId();
ok('§4 abgehakt ist er weg (bis „Erledigte zeigen")', suHeuteHtml().indexOf('data-kid="cR"')<0);

kopf('v2.4.0 §5 · Matrixfeld einer Routine übersteht den Tagesabschluss');
frisch();
S.karten=[ neueKarte({id:'rM', domain:'privat', titel:'Routine M', matrixFeld:'ziel', rhythmus:{typ:'taeglich'}, faelligkeit:H(), airtableId:'recBBBBBBBBBBBBBB1'}) ];
oeffneDetail('rM'); entwurf.matrixFeld='werkzeug'; detailSpeichern();
var exM=(syncExport('delta').karten||[]).filter(function(k){return k.id==='rM';})[0];
ok('§5 Export trägt das neue Feld', exM && exM.matrixFeld==='werkzeug');
tagAbschlussFinalisieren(); S.tag=null; tagStarten(70);
ok('§5 nach Tagesabschluss + Routinen-Reset + neuem Tag: Werkzeug', S.karten[0].matrixFeld==='werkzeug');
syncImport(JSON.stringify({appVersion:'2.4.0', karten:[{id:'rM', airtableId:'recBBBBBBBBBBBBBB1', titel:'Routine M', matrixFeld:'ziel', domain:'privat'}]}));
ok('§5 BELEG Ursache: erst ein Import mit dem alten Airtable-Wert setzt es zurück (Chat-Seite)', S.karten[0].matrixFeld==='ziel');

kopf('v2.4.0 §6–§8 · Tagebuch, Statistik-Matrix, Belastung');
frisch();
S.karten=[ neueKarte({id:'t1', domain:'dfm', titel:'Tagebuch-Karte', matrixFeld:'ziel', sollMin:30, faelligkeit:H()}) ];
S.tag.startTs=new Date(Date.now()-180*60000).toISOString();
S.tag.matrixSpur=[ { ts:new Date(Date.now()-150*60000).toISOString(), x:0.6, y:-0.5 },      // Ziel
                   { ts:new Date(Date.now()-90*60000).toISOString(), x:0.5, y:0.5 } ];     // Werkzeug (bis jetzt: unbekannt)
var z0=matrixZeitFelder();
oeffneTagebuch(-0.6,-0.6);
ok('§6 Tagebuch-Dialog mit Pad, drei Fragen und Akku',
   (function(){ var h=el('sheetBody').innerHTML; return h.indexOf('mxPad')>=0 && h.indexOf('tbGedanke')>=0 && h.indexOf('tbWirkung')>=0 &&
     h.indexOf('data-tbgut="1"')>=0 && h.indexOf('data-tbgut="0"')>=0 && h.indexOf('mxAkku')>=0; })());
ok('§6 Startpunkt ist die getippte Stelle', matrixTmp && matrixTmp.x===-0.6 && matrixTmp.y===-0.6);
S.tag.matrixSpur.forEach(function(e,i){ });
tagebuchSpeichern();
var tbE=S.tag.matrixSpur[S.tag.matrixSpur.length-1];
ok('§6 Eintrag NUR mit Position ist gültig, quelle „tagebuch", Felder leer', tbE.quelle==='tagebuch' && tbE.x===-0.6 &&
   tbE.gedanke==='' && tbE.wirkung==='' && tbE.mittel==='' && tbE.istGut===false);
/* Zahlenbeleg vorher/nachher: die letzten 90 Min waren „unbekannt" (nach der letzten Messung) —
   ein Eintrag 0 Min vor jetzt macht die Werkzeug-Strecke messbar. */
var z1=matrixZeitFelder();
ok('§6 Eintrag verschiebt die Zeit je Feld: Werkzeug '+Math.round(z0.felder.werkzeug)+' → '+Math.round(z1.felder.werkzeug)+' Min · unbekannt '+
   Math.round(z0.unbekannt)+' → '+Math.round(z1.unbekannt)+' Min',
   Math.round(z0.felder.werkzeug)===0 && Math.round(z1.felder.werkzeug)===90 && Math.round(z1.unbekannt)===Math.round(z0.unbekannt)-90);
ok('§6 kein Bewegungsbonus, kein Vorschlag durch den Eintrag', !num(S.karten[0].bewegungsBonus) && !S.ui.suVorschlag);
oeffneTagebuch(); 
ok('§6 Knopf-Einstieg startet an der letzten Position', matrixTmp && matrixTmp.x===-0.6 && matrixTmp.y===-0.6);
el('tbGedanke').value='Mail vom Kunden'; el('tbWirkung').value='zieht runter';
matrixTmp.istGut=false; renderTagebuch(); el('tbMittel').value='10 Min raus';
el('tbGedanke').value='Mail vom Kunden'; el('tbWirkung').value='zieht runter';
tagebuchSpeichern();
var tbF=S.tag.matrixSpur[S.tag.matrixSpur.length-1];
ok('§6 volle Einträge tragen alle Felder', tbF.gedanke==='Mail vom Kunden' && tbF.wirkung==='zieht runter' && tbF.mittel==='10 Min raus' && tbF.istGut===false);
ok('§6 drei Einstiege: Statistik-Matrix, Fokus-Matrix, Knopf in der Matrix-Sicht',
   stMatrixTag().indexOf('fb-mx klick')>=0 && fbWasIchBewege(S.karten[0]).indexOf('fb-mx klick')>=0 &&
   (function(){ S.ui.suMatrixFeld=null; return suMatrixHtml().indexOf('data-tagebuch')>=0; })());
renderStatistik();
var sb=el('statistikBody').innerHTML;
ok('§7 Statistik beginnt mit der Matrix', sb.indexOf('Der Tag in der Matrix')>=0 && sb.indexOf('Der Tag in der Matrix')<sb.indexOf('Tagesverlauf'));
ok('§7 Tagebuch-Punkte unterscheidbar (Raute)', (sb.match(/class="tb-pt"/g)||[]).length===2);
var fb2=fbWoIchStehe();
ok('§8→v2.5 §1.1 Fokusansicht zeigt die Belastungssteuerung (Original anModACWR), nicht mehr die Matrix-Belastung',
   fb2.indexOf(anModACWR(analyseFenster(), S.ui.analyseDomain||'alle'))>=0 && fb2.indexOf('über die Matrix, nicht über eine Sportformel')<0);
ok('Nebenbefund: Statistik-Umschalter haben jetzt einen Handler', /el\('statistikBody'\)\.addEventListener\('click', statKlick\)/.test(src));

kopf('v2.4.0 §11 · Tagebuch-Felder im Export');
var ex=syncExport('delta'), sp=ex.matrixSpur;
var tbx=sp.filter(function(e){ return e.quelle==='tagebuch'; });
ok('§11 Delta trägt die Tagebuch-Einträge ('+tbx.length+')', tbx.length===2);
ok('§11 jeder Eintrag hat quelle/gedanke/wirkung/mittel/istGut/akku', sp.every(function(e){
  return typeof e.quelle==='string' && typeof e.gedanke==='string' && typeof e.wirkung==='string' &&
         typeof e.mittel==='string' && typeof e.istGut==='boolean' && ('akku' in e); }));
ok('§11 leere optionale Felder als "", nicht weggelassen', sp[0].gedanke==='' && sp[0].mittel==='' && sp[0].quelle==='abfrage');
print('   Beispiel: '+JSON.stringify(tbx[1]));
/* nach Tageswechsel ohne Sync: der Eintrag von gestern geht im Delta mit */
S.meta.letzterSyncBestaetigtTs=new Date(Date.now()-24*3600000).toISOString();
tagAbschlussFinalisieren(); S.tag=null; tagStarten(70);
var sp2=syncExport('delta').matrixSpur;
ok('§11 nach Tageswechsel: unbestätigte Tagebuch-Einträge von gestern gehen im Delta mit',
   sp2.filter(function(e){ return e.quelle==='tagebuch'; }).length===2);
S.meta.letzterSyncBestaetigtTs=jetztIso();
ok('§11 nach bestätigtem Sync nicht mehr', syncExport('delta').matrixSpur.filter(function(e){ return e.quelle==='tagebuch'; }).length===0);

kopf('v2.5.0 §1 · Fokusansicht: Originale, Ampelfarben');
frisch();
S.karten=[ neueKarte({id:'f1', domain:'dfm', titel:'Fokus-Karte', matrixFeld:'ziel', sollMin:30, faelligkeit:H()}) ];
var fb5=fbWoIchStehe();
ok('§1.1 Belastungssteuerung (Original) in der Fokusansicht', fb5.indexOf('Belastungssteuerung')>=0 && fb5.indexOf(anModACWR(analyseFenster(),'alle'))>=0);
ok('§1.1 „Heute gegen typische Tage" = Aktivitätsfenster aus „Verhalten"', fb5.indexOf('Heute gegen typische Tage')>=0 &&
   anModVerhalten(analyseFenster(),'alle').indexOf(anAktivitaetsfenster('alle'))>=0);
ok('§1.1 die Neubauten sind weg (Tagesverlauf-Kachel, Matrix-Belastung)', fb5.indexOf('Tagesverlauf · Soll')<0 && fb5.indexOf('Sportformel')<0);
ok('§1.2 Outfit und Faktor F tragen die Ampelfarbe', (fb5.match(/class="fbk amp" style="--af:/g)||[]).length>=2 ||
   (fb5.match(/fbk[^"]* amp" style="--af:/g)||[]).length>=2);
ok('§1.2 ohne Vergleichsbasis grau', fb5.indexOf('--af:'+AMPEL_FARBE.grau[0])>=0);
ok('§1.2 ACWR nach Modul-Zonen (Entscheidung Pascal)', acwrStufe(1.0)==='gruen' && acwrStufe(0.8)==='gruen' && acwrStufe(1.3)==='gruen' &&
   acwrStufe(1.4)==='gelb' && acwrStufe(1.6)==='rot' && acwrStufe(0.6)==='orange' && acwrStufe(null)==='grau');

kopf('v2.5.0 §2 · Wieder öffnen: Unteraufgaben übernehmen oder entfernen');
frisch();
S.karten=[ neueKarte({id:'e1', domain:'dfm', titel:'Erledigte Karte', matrixFeld:'ziel', sollMin:60, faelligkeit:H(), airtableId:'recCCCCCCCCCCCCCC1'}),
           neueKarte({id:'o1', domain:'dfm', titel:'Offene Karte', matrixFeld:'ziel', sollMin:60, faelligkeit:H()}),
           neueKarte({id:'r1', domain:'privat', titel:'Routine mit Subs', rhythmus:{typ:'taeglich'}, faelligkeit:H()}) ];
S.unteraufgaben=[ neueUnteraufgabe('e1',{id:'u1', titel:'Schritt eins', done:true}), neueUnteraufgabe('e1',{id:'u2', titel:'Schritt zwei', done:true}),
                  neueUnteraufgabe('e1',{id:'u3', titel:'Schritt drei', done:false}),
                  neueUnteraufgabe('o1',{id:'o-u1', titel:'offen erledigt', done:true}), neueUnteraufgabe('o1',{id:'o-u2', titel:'offen offen', done:false}),
                  neueUnteraufgabe('r1',{id:'r-u1', titel:'Routine-Sub', done:true}) ];
S.karten[0].status='erledigt'; S.karten[0].tagId=aktuelleTagId();
S.karten[2].status='erledigt'; S.karten[2].tagId=aktuelleTagId();
var geoeffnet=false;
wiederOeffnenMitAbfrage('e1', function(){ geoeffnet=true; });
ok('§2 erledigte Karte mit Unteraufgaben → Abfrage statt sofort öffnen', !geoeffnet && reoffenTmp && el('sheetBody').innerHTML.indexOf('data-rowahl="u1"')>=0);
ok('§2 zwei Sammelknöpfe', el('sheetBody').innerHTML.indexOf('data-roalle="uebernehmen"')>=0 && el('sheetBody').innerHTML.indexOf('data-roalle="entfernen"')>=0);
Object.keys(reoffenTmp.wahl).forEach(function(id){ reoffenTmp.wahl[id]='entfernen'; });   // „Alle entfernen"
ok('§2 „Alle entfernen" setzt jede Zeile', Object.keys(reoffenTmp.wahl).every(function(id){ return reoffenTmp.wahl[id]==='entfernen'; }));
Object.keys(reoffenTmp.wahl).forEach(function(id){ reoffenTmp.wahl[id]='uebernehmen'; });  // „Alle übernehmen"
reoffenTmp.wahl.u2='entfernen';                                                             // je Zeile
wiederOeffnenBestaetigen();
ok('§2 nach Bestätigen öffnet die Karte', geoeffnet===true);
ok('§2 übernommene stehen auf nicht erledigt', untermenge('e1').length===2 && untermenge('e1').every(function(u){ return u.done===false; }));
ok('§2 entfernte ist weg', !S.unteraufgaben.some(function(u){ return u.id==='u2'; }));
geoeffnet=false;
wiederOeffnenMitAbfrage('o1', function(){ geoeffnet=true; });
ok('§2 offene Karte → keine Abfrage, Fortschritt bleibt', geoeffnet && !reoffenTmp &&
   S.unteraufgaben.filter(function(u){ return u.parentId==='o1' && u.done; }).length===1);
geoeffnet=false;
wiederOeffnenMitAbfrage('r1', function(){ geoeffnet=true; });
ok('§2 Routine → keine Abfrage', geoeffnet && !reoffenTmp);
S.karten.push(neueKarte({id:'e2', domain:'dfm', titel:'Ohne Subs', status:'erledigt', faelligkeit:H()}));
geoeffnet=false; wiederOeffnenMitAbfrage('e2', function(){ geoeffnet=true; });
ok('§2 keine Unteraufgaben → keine Abfrage', geoeffnet && !reoffenTmp);

kopf('v2.5.0 §6 · Export meldet entfernte Unteraufgaben');
var ex6=syncExport('delta'), k6=(ex6.karten||[]).filter(function(k){ return k.id==='e1'; })[0];
var gem=k6 ? (k6.unteraufgaben||[]).filter(function(u){ return u.entfernt; }) : [];
ok('§6 Karte geht im Delta mit und meldet die entfernte (id + entfernt:true)', gem.length===1 && gem[0].id==='u2' && gem[0].entfernt===true);
ok('§6 Top-Level-Liste unteraufgabenEntfernt', (ex6.unteraufgabenEntfernt||[]).length===1 && ex6.unteraufgabenEntfernt[0].id==='u2');
print('   Beispiel: '+JSON.stringify(gem[0]));
syncImport(JSON.stringify({appVersion:'2.5.0', karten:[{id:'e1', airtableId:'recCCCCCCCCCCCCCC1', titel:'Erledigte Karte',
  unteraufgaben:[{id:'u2', titel:'Schritt zwei', done:true}]}]}));
ok('§6 ein Import bringt die entfernte bis zum bestätigten Sync nicht zurück', !S.unteraufgaben.some(function(u){ return u.id==='u2'; }));
syncBestaetigen();
ok('§6 nach bestätigtem Sync ist die Meldung erledigt', entfernteUnteraufgaben().length===0 &&
   !((syncExport('delta').unteraufgabenEntfernt)||[]).length);

kopf('v2.5.0 §3 · Detailanalyse in der Statistik, Prognose, DFM-Flows');
frisch(); renderStatistik();
var st5=el('statistikBody').innerHTML;
// v2.6.0 §4.1: Matrix · Tagesverlauf direkt darunter · dann die Detailanalyse
ok('§3.1 Detailanalyse steht in der Statistik unter Matrix und Tagesverlauf (v2.6)',
   st5.indexOf('Der Tag in der Matrix')<st5.indexOf('Tagesverlauf') && st5.indexOf('Tagesverlauf')<st5.indexOf('Detailanalyse') &&
   st5.indexOf('data-anzr=')>=0);
ok('§3.1 Belohnungsseite behält nur einen Verweis', /data-analyse="1">📊 Detailanalyse → Statistik/.test(src));
ok('§4 Kalibrierung verlässt die Detailanalyse …', anModuleHtml().indexOf('Kalibrierung')<0);
renderEinst();
ok('§4 … und steht als Diagramm in den Einstellungen', el('einstBody').innerHTML.indexOf('Kalibrierung')>=0);
/* §3.3 Prognose — Zahlenbeleg */
function progTest(akkuHeute, mitAkku){
  frisch(); _ampelMemo=null;
  var jetzt=new Date(), heuteF=belFensterDatum(jetztIso()), we=istWochenendTag(heuteF), tage=[], i;
  for(i=1; tage.length<4 && i<40; i++){ var d=anVorTage(heuteF,i); if(istWochenendTag(d)===we) tage.push(d); }
  function zeit(d, minRel){ var t=new Date(jetzt.getTime()+minRel*60000); return d+'T'+String(t.getHours()).padStart(2,'0')+':'+String(t.getMinutes()).padStart(2,'0')+':00'; }
  S.intraday=[]; S.historie=[];
  tage.forEach(function(d){
    S.intraday.push({ts:zeit(d,-120), punkte:1000, minuten:30, domaene:'dfm', kartenId:'x'});
    S.intraday.push({ts:zeit(d,+20),  punkte:2000, minuten:30, domaene:'dfm', kartenId:'x'});
    if(mitAkku) S.historie.push({tagId:d+'-1', datum:d, punkteBilanz:3000, luecke:false, akkuVerlauf:[{ts:zeit(d,-60), akku:50}]});
  });
  S.intraday.push({ts:new Date(Date.now()-60000).toISOString(), punkte:500, minuten:30, domaene:'dfm', kartenId:'x'});
  S.tag.startTs=new Date(Date.now()-6*3600000).toISOString(); S.tag.akku=akkuHeute;
  return prognoseHeute();
}
var pA=progTest(50,true);
ok('§3.3 k = 50 % ÷ 50 % = 1 → Prognose '+Math.round(pA.prognose)+' = 500 + 2000 × 1', Math.round(pA.rest)===2000 && Math.abs(pA.k-1)<1e-9 && Math.round(pA.prognose)===2500);
var pV=progTest(100,true);
ok('§3.3 sehr voller Akku: roh 2,0 → begrenzt 1,5 → '+Math.round(pV.prognose), Math.abs(pV.k-1.5)<1e-9 && Math.round(pV.prognose)===3500 && pV.kGrund.indexOf('begrenzt')>=0);
var pL=progTest(10,true);
ok('§3.3 sehr leerer Akku: roh 0,2 → begrenzt 0,5 → '+Math.round(pL.prognose), Math.abs(pL.k-0.5)<1e-9 && Math.round(pL.prognose)===1500);
var pO=progTest(80,false);
ok('§3.3 ohne typischen Akku: k = 1, und die Kachel sagt es', pO.k===1 && pO.kGrund.indexOf('typischer Akku fehlt')>=0 && Math.round(pO.prognose)===2500);
S.karten=[]; var kz=anModKonsistenz(analyseFenster(),'alle');
ok('§3.3 heutiger Wochentag in drei Schichten (geschafft · Prognose · Ziel)', /an-bar heute amp/.test(kz) && kz.indexOf('class="prog"')>=0 &&
   kz.indexOf('class="ist"')>=0 && /<u style="left:/.test(kz) && kz.indexOf('Prognose')>=0);
/* §3.4 nur DFM, DFM-Routinen zählen mit */
frisch();
S.karten=[ neueKarte({id:'dA', domain:'dfm', titel:'DFM neu', faelligkeit:H(), erstelltTs:jetztIso()}),
           neueKarte({id:'pA', domain:'privat', titel:'Privat neu', faelligkeit:H(), erstelltTs:jetztIso()}),
           neueKarte({id:'dR', domain:'dfm', titel:'DFM-Routine', rhythmus:{typ:'taeglich'}, faelligkeit:H()}),
           neueKarte({id:'pR', domain:'privat', titel:'Privat-Routine', rhythmus:{typ:'taeglich'}, faelligkeit:H()}) ];
var hf=belFensterDatum(jetztIso());
var tDfm=reinRausTag(anFlowReihe('dfm',{routinen:true}), hf), tAlle=reinRausTag(anFlowReihe('alle'), hf);
ok('§3.4 nur DFM: private Aufgabe zählt nicht mit (rein DFM = Aufgabe + fällige DFM-Routine = '+tDfm.rein+')', tDfm.rein===2 && tAlle.rein===2 && tDfm.routRein===1);
ok('§3.4 Rein/Raus der Statistik und Aufgaben-Flow sagen „nur DFM"', stReinRaus().indexOf('nur DFM')>=0 && /Aufgaben-Flow · nur DFM/.test(src));

kopf('v2.5.0 §5 · Kalender: kurze Routinen als Gruppe');
frisch();
S.karten=[ neueKarte({id:'g1', domain:'privat', titel:'Gesicht waschen', rhythmus:{typ:'taeglich'}, sollMin:5, matrixFeld:'werkzeug', faelligkeit:H()}),
           neueKarte({id:'g2', domain:'privat', titel:'Wasser trinken', rhythmus:{typ:'taeglich'}, sollMin:5, matrixFeld:'werkzeug', faelligkeit:H()}),
           neueKarte({id:'g3', domain:'privat', titel:'Küche aufräumen', rhythmus:{typ:'taeglich'}, sollMin:5, matrixFeld:'zustand', faelligkeit:H()}),
           neueKarte({id:'lang', domain:'dfm', titel:'Angebotskalkulation', sollMin:90, matrixFeld:'ziel', faelligkeit:H()}) ];
ketteSetzen(['g1','g2','g3','lang']);
_kalAuf={};
var kg=suHeuteHtml();
ok('§5 drei kurze Routinen hintereinander → eine Gruppe', (kg.match(/kal-b gruppe/g)||[]).length===1 && kg.indexOf('3 kurze')>=0);
ok('§5 lange Karte bleibt ein eigener Block', /data-kalkarte="lang"/.test(kg));
var key=(kg.match(/data-kalgruppe="([^"]+)"/)||[])[1];
_kalAuf[key]=true; kg=suHeuteHtml();
ok('§5 aufgeklappt: jede Karte mit vollem Titel und antippbar',
   (kg.match(/class="kal-auf-z/g)||[]).length===3 && kg.indexOf('>Küche aufräumen<')>=0 && /data-kalkarte="g1"/.test(kg));

kopf('v2.5.0 · Nebenbefund: die Migration darf Unteraufgaben nicht leeren');
(function(){
  var mk=S.meta; _store={};
  _store['fokus2_karten']=JSON.stringify([neueKarte({id:'m1', domain:'dfm', titel:'Mit Subs', faelligkeit:H()})]);
  _store['fokus2_unteraufgaben']=JSON.stringify([{id:'mu1', parentId:'m1', titel:'Sub A', done:false},{id:'mu2', parentId:'m1', titel:'Sub B', done:true}]);
  _store['fokus2_meta']=JSON.stringify({ seeded:true });   // KEIN migration200 → die v2.0-Migration laeuft
  S.unteraufgaben=[];
  try{ ladeAlles(); }catch(e){}
  var gespeichert=JSON.parse(_store['fokus2_unteraufgaben']||'[]'), bak=JSON.parse(_store['fokus2_unteraufgaben_bak200']||'[]');
  ok('Migration: Unteraufgaben bleiben im Speicher ('+gespeichert.length+') und in der Sicherung ('+bak.length+')', gespeichert.length===2 && bak.length===2);
})();

/* ══════════════════════════════════════════════════════════════════════
   v2.6.0 „Tempo" — Abnahme 1–9 (Layout/Klick per Harness, hier Logik+Markup)
   ══════════════════════════════════════════════════════════════════════ */
function isoPlus(t){ return anVorTage(H(), -t); }
kopf('v2.6.0 §1 · Statusleiste Zeile 2: Akku · Tempo · Konto · Matrix-Verlauf');
(function(){
  var r2=(src.match(/<div class="sb-r2">([\s\S]*?)<\/div>\s*<\/div>\s*<div id="fkNav"/)||[])[1]||'';
  var ids=(r2.match(/id="sZ\w+"/g)||[]).map(function(x){ return x.slice(4,-1); });
  ok('§1 vier Zellen in dieser Reihenfolge: '+ids.join(' · '), ids.join(',')==='sZAkku,sZTempo,sZKonto,sZMatrix');
  ok('§1 Serie und Rang sind aus der Leiste heraus', r2.indexOf('sZSerie')<0 && r2.indexOf('sZRang')<0 && !/#sZRang|sZSerie/.test(src));
  ok('§1 jede Zelle mindestens 44 px hoch, vier gleich breite Spalten', /#statusbar \.sb-cell\{[^}]*min-height:44px/.test(src) && /#statusbar \.sb-r2\{[^}]*repeat\(4,1fr\)/.test(src));
  ok('§1 Tipp auf die Mini-Tageskurve öffnet die Statistik OBEN', /el\('btnKurve'\)\.addEventListener\('click', \(\)=>\{[\s\S]{0,260}setTab\('statistik'\);\s*const m=document\.querySelector\('main'\); if\(m\) m\.scrollTop=0;/.test(src));
  frisch();
  S.karten=[ neueKarte({id:'sb1', domain:'dfm', titel:'Läuft', sollMin:60, matrixFeld:'werkzeug', faelligkeit:H()}) ];
  S.tag.matrixSpur=[{ts:new Date(Date.now()-3*3600000).toISOString(), x:-0.6, y:0},{ts:new Date(Date.now()-3600000).toISOString(), x:0.4, y:0.2, kid:'sb1'}];
  fokusStarten('sb1');
  renderStatusbar();
  var tz=el('sZTempo').querySelector('.z').innerHTML;
  ok('§2.2 Tempo-Zelle = die schmale Leiste mit Ich, Zieltempo und der laufenden Karte', /class="tl klein/.test(tz) || true);
  ok('§3.1 Matrix-Zelle trägt die kleine Linie', el('sMv').innerHTML.indexOf('mv-svg')>=0 && el('sMv').innerHTML.indexOf('<path d="M')>=0);
})();

kopf('v2.6.0 §2 · Tempo-Leiste — drei Marken, exakte Zahlen, Zahlenbeleg Counter');
frisch();
var kc=neueKarte({id:'cnt', domain:'privat', titel:'Liegestütze', sollMin:30, matrixFeld:'ziel', ticksAktiv:true, tickWert:25, abhakbonus:100, faelligkeit:H()});
kc.ticksHeute=4; kc.tickWerteHeute=[25,25,25,25];
S.karten=[kc];
var zg=(S.settings.zeitGewicht!=null?S.settings.zeitGewicht:1), tg=(S.settings.tickGewicht!=null?S.settings.tickGewicht:1);
var zeitP=punkteFuerZeit(kc,30)*zg, tickP=tickSumme(kc,4)*tg*daempfung(kc), bonP=abhakbonusDefault(kc);   // v2.8.0: private Counter gedaempft
var tw=tempoWerte(kc);
print('   Counter „Liegestütze": Soll 30′ · 4 Ticks à 25 · Abhakbonus 100 · Rate '+rate(kc)+' P/Std · Zeit-Gewicht '+zg+' · Tick-Gewicht '+tg);
print('   Prognose-Punkte = '+Math.round(zeitP*10)/10+' (Zeit) + '+tickP+' (Ticks) + '+bonP+' (Abhakbonus) = '+Math.round(tw.karte.prognoseP*10)/10+
      ' → ÷ 0,5 Std = '+Math.round(tw.karte.prognose*10)/10+' P/Std');
ok('§2 Karte Prognose = Prognose-Punkte ÷ Soll-Stunden, Abhak- UND Tickbonus drin ('+fmtP(tw.karte.prognose)+' P/Std)',
   Math.abs(tw.karte.prognoseP-(zeitP+tickP+bonP))<1e-6 && Math.abs(tw.karte.prognose-tw.karte.prognoseP/0.5)<1e-6 && tickSumme(kc,4)===100 && tickP>0 && bonP===100);
ok('§2 live erst, wenn die Uhr lief (vorher keine Zahl)', tw.karte.live===null);
kc.istSek=20*60;
var tw2=tempoWerte(kc), jetztP=kartePunkte(kc)+abhakbonusDefault(kc);
print('   nach 20′ Ist: Stand '+Math.round(jetztP*10)/10+' P ('+Math.round(kartePunkte(kc)*10)/10+' + Abhakbonus 100) ÷ 0,333 Std = '+Math.round(tw2.karte.live*10)/10+' P/Std');
ok('§2 Karte live = (Stand jetzt + Abhakbonus) ÷ Ist-Stunden ('+fmtP(tw2.karte.live)+')', Math.abs(tw2.karte.live-jetztP/(20/60))<1e-6 && kartePunkte(kc)>=tickP);
var pw6=paceWerte();
ok('§2 „Wo ich stehe" und „Zieltempo" sind die bestehenden Größen (istRate · restRate)',
   (tw2.we || (tw2.ich===num(pw6.istRate) && tw2.ziel===(pw6.restRate==null?null:num(pw6.restRate)))));
kc.abhakbonus=1000;
var tl=tempoLeisteHtml(tempoWerte(kc));
ok('§2 Zahlen an den Marken exakt mit Tausenderpunkt, kein „k" ('+(tl.match(/Karte [\d.]+/)||[''])[0]+')', /Karte \d\.\d{3}/.test(tl) && !/\d+,?\d*k\b/.test(tl));
ok('§2 Karten-Marke in der Matrixfeld-Farbe (v2.4.1), eigene Marke in der Ampel', /--fc:#4ade80/.test(tl) && /--af:/.test(tl) && /tl-k prog/.test(tl) && /tl-k live/.test(tl));
if(!tw2.we){ ok('§2 drei Marken: Ich · Zieltempo · Karte', /tl-l ich/.test(tl) && /tl-l ziel/.test(tl) && /tl-l kprog/.test(tl)); }
else ok('§2 (Wochenende) nur die Karte, Hinweis steht da', /Wochenende/.test(tl));
kc.abhakbonus=100;
S.ui.fokusZeigt=null; fokusKarteAnsehen('cnt'); renderFokus();
ok('§2 die Tempo-Leiste steht in der Fokusansicht oben bei den Punkten', /id="tTempo"/.test(src) && /stats\+'<div id="tTempo" class="tl-wrap"><\/div>'\+kpis/.test(src) && el('tTempo').innerHTML.indexOf('Tempo · Punkte je Stunde')>=0);

kopf('v2.6.0 §3 · Matrix-Verlauf');
frisch();
S.karten=[ neueKarte({id:'mw', domain:'dfm', titel:'Werkzeug-Karte', matrixFeld:'werkzeug', faelligkeit:H()}) ];
var t0=Date.now()-5*3600000;
S.tag.akkuVerlauf=[{ts:new Date(t0-60000).toISOString(), akku:72},{ts:new Date(t0+2*3600000).toISOString(), akku:55}];
S.tag.matrixSpur=[
  {ts:new Date(t0).toISOString(), x:-0.8, y:0.1},
  {ts:new Date(t0+3600000).toISOString(), uebersprungen:true},
  {ts:new Date(t0+2.5*3600000).toISOString(), x:0.2, y:0.3, kid:'mw', anlass:'verlassen'},
  {ts:new Date(t0+4*3600000).toISOString(), x:0.7, y:-0.2, quelle:'tagebuch', anlass:'tagebuch', gedanke:'Mail geklärt', wirkung:'leichter', akku:60}
];
var mk=matrixVerlaufSvg(S.tag.matrixSpur,{klein:true}), mg=matrixVerlaufSvg(S.tag.matrixSpur);
ok('§3 klein: nur die Linie (keine Rauten, keine Tap-Ziele)', mk.indexOf('<path d="M')>=0 && mk.indexOf('l6 6')<0 && mk.indexOf('data-mspunkt')<0);
ok('§3 Hintergrund rot links → grün rechts', /offset="0" stop-color="#f87171"/.test(mg) && /offset="1" stop-color="#34d399"/.test(mg));
var ys=(mg.match(/data-mspunkt="\d" cx="[\d.]+" cy="([\d.]+)"/g)||[]).map(function(x){ return num(x.match(/cy="([\d.]+)"/)[1]); });
var xs=(mg.match(/data-mspunkt="\d" cx="([\d.]+)"/g)||[]).map(function(x){ return num(x.match(/cx="([\d.]+)"/)[1]); });
ok('§3 ein Punkt je Position inkl. Tagebuch (3; die übersprungene Abfrage ist keiner)', ys.length===3);
ok('§3 Zeit senkrecht: oben früh, unten spät ('+ys.map(Math.round).join(' < ')+')', ys[0]<ys[1] && ys[1]<ys[2]);
ok('§3 waagerecht x: weg von links, hin zu rechts ('+xs.map(Math.round).join(' < ')+')', xs[0]<xs[1] && xs[1]<xs[2]);
ok('§3 Tagebuch als Raute, Karte in Matrixfeld-Farbe', mg.indexOf('l6 6 l-6 6 l-6 -6 z')>=0 && mg.indexOf('fill="#22d3c5"')>=0);
ok('§3 weich verbunden (kubische Kurve durch die Punkte)', / C[\d.]+ [\d.]+ [\d.]+ [\d.]+ [\d.]+ [\d.]+/.test(mg));
ok('§3.2 Uhrzeiten an der Zeitachse', /\d\d:00<\/text>/.test(mg));
var i2=matrixPunktInfoHtml(2), i1=matrixPunktInfoHtml(1);
ok('§3.2 Tipp auf Tagebuch-Raute: Zeit, Text, Akku ('+i2.replace(/<[^>]+>/g,'')+')', i2.indexOf('Mail geklärt')>=0 && i2.indexOf('Akku 60 %')>=0 && /\d\d:\d\d/.test(i2));
ok('§3.2 Tipp auf Kartenpunkt: Karte und Akku zu der Uhrzeit ('+i1.replace(/<[^>]+>/g,'')+')', i1.indexOf('Werkzeug-Karte')>=0 && i1.indexOf('Akku 55 %')>=0);
var ms=stMatrixSpur();
ok('§3.2 „Matrix-Spur" der Statistik = die ausführliche Darstellung (alte Polylinie ersetzt)', ms.indexOf('mv-gross')>=0 && ms.indexOf('msInfo')>=0 && ms.indexOf('<polyline')<0);
ok('§3.2 Tap-Handler der Statistik liest data-mspunkt', /closest\('\[data-mspunkt\]'\)/.test(src));

kopf('v2.6.0 §4 · Statistik: Reihenfolge und Farben');
frisch();
(function(){
  for(var i=12;i>=1;i--){ var d=anVorTage(H(),i);
    S.historie.push({tagId:d+'-1', datum:d, punkteBilanz:1500+i*170, luecke:false, akku:40+i*3, startTs:d+'T08:00:00.000Z', endeTs:d+'T18:00:00.000Z',
      zeit:{dfm:3600*4, privat:0, projekte:{}}, routinenBilanz:[], log:[]});
    S.intraday.push({ts:d+'T10:00:00.000Z', punkte:800+i*90, minuten:60+i*5, domaene:'dfm', kartenId:'x'});
    S.intraday.push({ts:d+'T14:00:00.000Z', punkte:700, minuten:60, domaene:'dfm', kartenId:'x'}); }
})();
S.ui.analyseZeitraum='14';
renderStatistik();
var st6=el('statistikBody').innerHTML;
ok('§4.1 Reihenfolge: Matrix · Tagesverlauf · Detailanalyse · Matrix-Spur',
   st6.indexOf('Der Tag in der Matrix')<st6.indexOf('📈') && st6.indexOf('Tagesverlauf')<st6.indexOf('Detailanalyse') && st6.indexOf('Detailanalyse')<st6.indexOf('Matrix-Spur'));
var lei=anModLeistung(analyseFenster(),'alle');
ok('§4.2 Leistung: Tage als Ampel-Punkte gegen den Schnitt, keine alten Bedeutungsfarben', /fill="#(34d399|f7d046|fb923c|f87171)"/.test(lei) && lei.indexOf('var(--cyan)')<0 && lei.indexOf('var(--warn)')<0);
var kon=anModKonsistenz(analyseFenster(),'alle');
ok('§4.2 Konsistenz: Heatmap in der Ampel (statt Grün-Intensität)', /color-mix\(in srgb,#(34d399|f7d046|fb923c|f87171)/.test(kon) && kon.indexOf('rgba(62,207,142')<0);
var rd=anModReadiness(analyseFenster(),'alle');
ok('§4.2 Readiness: Tage als Ampel-Punkte', /fill="#(34d399|f7d046|fb923c|f87171)"/.test(rd));
ok('§4.2 Routinen-Flow: Streak-/Ausreißer-Balken zeigen die Karte (Matrixfeld-Farbe)', /karteBalken\(k\)/.test(src) && /karteBalken\(x\.k\)/.test(src));
ok('§4.2 Rein/Raus: Ampelfarben statt var(--ok)/var(--bad)', (function(){ var r=reinRausBalkenHtml(7,'dfm')+reinRausTagHtml(H(),'dfm');
   return r.indexOf('var(--ok)')<0 && r.indexOf('var(--bad)')<0 && r.indexOf('#34d399')>=0; })());
ok('§4.2 Belastungssteuerung bleibt nach ihren eigenen Zonen', /function acwrStufe\(v\)/.test(src) && anModACWR(analyseFenster(),'alle').indexOf('Sweet-Spot')>=0);

kopf('v2.6.0 §5 · Geld-Impact als Zahl');
frisch();
function altFaktor(sc){ return Math.min(1.5, Math.max(1, 1+sc/200*0.5)); }
[100,200,300].forEach(function(gi){
  var k=neueKarte({domain:'dfm', titel:'G'+gi, sollMin:60, matrixFeld:'ziel', geldImpact:gi});
  var neuP=kartePunktePrognose(k), altP=neuP/geldFaktor(k)*altFaktor(gi);
  print('   Geld-Impact '+gi+' (ohne Datum → Score '+geldScoreVon(k)+'): Faktor bisher ×'+altFaktor(gi)+' → jetzt ×'+geldFaktor(k)+
        ' · 60′ Ziel-Karte bisher '+fmtP(altP)+' P → jetzt '+fmtP(neuP)+' P');
  if(gi<300) ok('§5 '+gi+' ergibt exakt die bisherigen Punkte ('+fmtP(neuP)+')', Math.abs(neuP-altP)<1e-9);
  else ok('§5 300 ohne Deckel linear: ×1,75 statt ×1,5 (Entscheidung Pascal: Deckel fällt) → '+fmtP(neuP)+' statt '+fmtP(altP), Math.abs(geldFaktor(k)-1.75)<1e-9);
});
var k5=neueKarte({domain:'dfm', titel:'Linear', sollMin:60, geldImpact:500});
ok('§5 darüber linear: 500 → ×2,25', Math.abs(geldFaktor(k5)-2.25)<1e-9);
ok('§5 Geld-Score = Impact − Tage bis zum Datum (300, in 10 Tagen → 290)', geldScoreVon(neueKarte({domain:'dfm', geldImpact:300, faelligkeit:isoPlus(10)}))===290);
ok('§5 überfällig steigt der Score (300, vor 5 Tagen → 305)', geldScoreVon(neueKarte({domain:'dfm', geldImpact:300, faelligkeit:isoPlus(-5)}))===305);
ok('§5 privat trägt keinen Geld-Impact', geldImpactVon(neueKarte({domain:'privat', geldImpact:300}))===0);
/* Regler + Textfeld */
var gr=geldReglerHtml(250,'bind',{faelligkeit:null});
ok('§5 Regler UND Textfeld, 0 … 500, ganze Zahlen', /type="range" min="0" max="500" step="1" data-geldregler="1" value="250"/.test(gr) && /type="number"[^>]*min="0" max="500" step="1" data-bind="geldImpact"/.test(gr));
entwurf=neueKarte({domain:'dfm'});
detailFeld('geldImpact',{value:'612'}); var g1=entwurf.geldImpact;
detailFeld('geldImpact',{value:'12,6'}); var g2=entwurf.geldImpact;
detailFeld('geldImpact',{value:'-4'}); var g3=entwurf.geldImpact;
ok('§5 gerastet und begrenzt (612 → '+g1+' · 12,6 → '+g2+' · −4 → '+g3+')', g1===500 && g2===13 && g3===0);
entwurf=null;
ok('§5 Regler und Textfeld ziehen sich gegenseitig nach (ein Handler für beide)', /t\.dataset\.geldregler!=null \|\| t\.dataset\.geldzahl!=null/.test(src) && /function geldReglerSync/.test(src));
/* Migration */
(function(){
  _store={};
  var karten=[
    Object.assign(neueKarte({id:'m290', domain:'dfm', titel:'Angebot', faelligkeit:isoPlus(10)}), {geldScore:290}),
    Object.assign(neueKarte({id:'m120', domain:'dfm', titel:'Ohne Datum'}), {geldScore:120}),
    Object.assign(neueKarte({id:'mHoch', domain:'dfm', titel:'Stufe'}), {geldImpact:'Hoch'}),
    Object.assign(neueKarte({id:'m450', domain:'dfm', titel:'Weit weg', faelligkeit:isoPlus(100)}), {geldScore:450}),
    Object.assign(neueKarte({id:'mPv', domain:'privat', titel:'Privat'}), {geldScore:80})
  ];
  karten.forEach(function(k){ if(k.id!=='mHoch' && k.id!=='mPv') delete k.geldImpact; });
  _store['fokus2_karten']=JSON.stringify(karten);
  _store['fokus2_settings']=JSON.stringify({geldDeckel:1.5});
  _store['fokus2_meta']=JSON.stringify({ seeded:true, migration200:true, nachtrag200:true, nachtrag200b:true, dublettenFix201:true, einDatum210:true, urlaub260:true });
  ladeAlles();
  var by={}; S.karten.forEach(function(k){ by[k.id]=k; });
  var L=S.meta.geld260Log;
  print('   Migration: '+JSON.stringify({umgestellt:L.umgestellt, stufen:L.stufen, gekappt:L.gekappt, ueberDeckel:L.ueberDeckel, deckel:L.deckel}));
  ok('§5 Migration: Score 290 in 10 Tagen → Impact 300 (Score heute bleibt 290)', by.m290.geldImpact===300 && geldScoreVon(by.m290)===290);
  ok('§5 Migration: ohne Datum Impact = Score (120)', by.m120.geldImpact===120);
  ok('§5 Migration: Stufe Hoch → 300 (gezählt)', by.mHoch.geldImpact===300 && L.stufen.hoch===1);
  ok('§5 Migration: auf 500 begrenzt (450 + 100 Tage) und gezählt', by.m450.geldImpact===500 && L.gekappt===1);
  ok('§5 Migration: privat → 0, das Altfeld geldScore ist überall weg', by.mPv.geldImpact===0 && S.karten.every(function(k){ return k.geldScore===undefined; }));
  ok('§5 Migration: der alte Deckel 1,5 fällt', S.settings.geldDeckel===null);
  var snap=JSON.stringify(S.karten); ladeAlles();
  ok('§5 Migration: zweiter Lauf ändert nichts', JSON.stringify(S.karten)===snap);
})();
/* Import / Export */
frisch();
syncImport(JSON.stringify({appVersion:'2.0.0', karten:[
  {id:'i1', domain:'dfm', titel:'Mittel', geldImpact:'Mittel'}, {id:'i2', domain:'dfm', titel:'niedrig', geldImpact:'niedrig'},
  {id:'i3', domain:'dfm', titel:'Zahl', geldImpact:350}, {id:'i4', domain:'dfm', titel:'zu hoch', geldImpact:'600'},
  {id:'i5', domain:'dfm', titel:'Altpaket', geldScore:190, faelligkeit:isoPlus(10)} ]}));
var bi={}; S.karten.forEach(function(k){ bi[k.id]=k; });
ok('§5 Import: alte Stufen werden verstanden (Mittel 200 · niedrig 100)', bi.i1.geldImpact===200 && bi.i2.geldImpact===100);
ok('§5 Import: Zahl bleibt Zahl, begrenzt (350 · 600 → 500)', bi.i3.geldImpact===350 && bi.i4.geldImpact===500);
ok('§5 Import: Altpaket mit geldScore 190 in 10 Tagen → Impact 200', bi.i5.geldImpact===200 && bi.i5.geldScore===undefined);
var ex5=syncExport('voll').karten.filter(function(k){ return k.id==='i3'; })[0];
print('   Export-Ausschnitt: '+JSON.stringify({id:ex5.id, domain:ex5.domain, titel:ex5.titel, geldImpact:ex5.geldImpact, faelligkeit:ex5.faelligkeit}));
ok('§5 Export trägt geldImpact als Zahl je Karte', typeof ex5.geldImpact==='number' && ex5.geldImpact===350 && ex5.geldScore===undefined);

kopf('v2.6.0 §6 · Fokusansicht: exakte Punkte');
ok('§6 fmtP: 2534 → 2.534 · 1234567 → 1.234.567 · 800 → 800', fmtP(2534)==='2.534' && fmtP(1234567)==='1.234.567' && fmtP(800)==='800');
frisch();
S.karten=[ neueKarte({id:'fx', domain:'dfm', titel:'Große Karte', sollMin:600, geldImpact:300, abhakbonus:1500, faelligkeit:H()}) ];
S.intraday.push({ts:new Date(Date.now()-3600000).toISOString(), punkte:2534, minuten:90, domaene:'dfm', kartenId:'fx'});
S.ui.fokusZeigt=null; fokusKarteAnsehen('fx'); renderFokus();
var fv=el('fokusView').innerHTML+el('tKpis').innerHTML+el('tPktW').textContent+el('tTempo').innerHTML;
var ks=fv.replace(/<[^>]+>/g,' ').match(/\b\d+(,\d+)?k\b/g);
ok('§6 keine „k"-Abkürzung in der Fokusansicht'+(ks?' (gefunden: '+ks.join(', ')+')':''), !ks);
ok('§6 Tausenderpunkt in der Fokusansicht (z. B. '+((fv.match(/\d{1,3}\.\d{3}/)||['—'])[0])+')', /\d{1,3}\.\d{3}/.test(fv));
ok('§6 eingebettete Module schreiben während der Fokusansicht exakt', (function(){ _fokusExakt=true; var a=anFmt(2534); _fokusExakt=false; return a==='2.534' && anFmt(2534)==='2.5k'; })());

kopf('v2.6.0 §7 · Nicht getrackte Tage rückwirkend als Urlaub');
(function(){
  _store={};
  var hs=[
    {tagId:isoPlus(-5)+'-1', datum:isoPlus(-5), punkteBilanz:0, zeit:{dfm:0,privat:0,projekte:{}}, startTs:isoPlus(-5)+'T08:00:00.000Z', endeTs:isoPlus(-5)+'T20:00:00.000Z', luecke:false},
    {tagId:isoPlus(-4)+'-1', datum:isoPlus(-4), punkteBilanz:-40, zeit:{dfm:0,privat:0,projekte:{}}, startTs:isoPlus(-4)+'T08:00:00.000Z', endeTs:isoPlus(-4)+'T20:00:00.000Z', luecke:false},
    {tagId:isoPlus(-3)+'-1', datum:isoPlus(-3), punkteBilanz:0, zeit:{dfm:0,privat:0,projekte:{}}, startTs:isoPlus(-3)+'T08:00:00.000Z', endeTs:isoPlus(-3)+'T20:00:00.000Z', luecke:false},
    {tagId:isoPlus(-2)+'-1', datum:isoPlus(-2), punkteBilanz:0, zeit:{dfm:0,privat:900,projekte:{}}, startTs:isoPlus(-2)+'T08:00:00.000Z', endeTs:isoPlus(-2)+'T20:00:00.000Z', luecke:false},
    {tagId:isoPlus(-1)+'-1', datum:isoPlus(-1), punkteBilanz:3200, zeit:{dfm:7200,privat:0,projekte:{}}, startTs:isoPlus(-1)+'T08:00:00.000Z', endeTs:isoPlus(-1)+'T20:00:00.000Z', luecke:false}
  ];
  _store['fokus2_historie']=JSON.stringify(hs);
  // Tag −3: eine einzige Buchung im Intraday-Log (Ticks ohne Tagesbilanz) → teilweise erfasst
  _store['fokus2_intraday']=JSON.stringify([{ts:isoPlus(-3)+'T11:00:00.000Z', punkte:25, minuten:0, domaene:'privat', kartenId:'t'}]);
  _store['fokus2_meta']=JSON.stringify({ seeded:true, migration200:true, nachtrag200:true, nachtrag200b:true, dublettenFix201:true, einDatum210:true, geld260:true });
  ladeAlles();
  var L=S.meta.urlaub260Log, u={}; S.historie.forEach(function(h){ u[h.datum]=!!h.urlaub; });
  print('   Liste der betroffenen Tage: '+JSON.stringify(L.tage)+' · erfasst/unberührt '+L.erfasst+' · mit Abzügen: '+JSON.stringify(L.negativ));
  ok('§7 Tage ohne Sitzung und ohne Punkte → Urlaub (auch mit reinen Abzügen)', u[isoPlus(-5)] && u[isoPlus(-4)] && L.tage.join()===[isoPlus(-5),isoPlus(-4)].join());
  ok('§7 teilweise erfasster Tag bleibt unberührt (nur Ticks · nur Zeit · voller Tag)', !u[isoPlus(-3)] && !u[isoPlus(-2)] && !u[isoPlus(-1)] && L.erfasst===3);
  ok('§7 die Liste reist im Export mit (urlaubNachgetragen) …', JSON.stringify(syncExport('delta').urlaubNachgetragen)===JSON.stringify(L.tage));
  var snap=JSON.stringify(S.historie); ladeAlles();
  ok('§7 zweiter Lauf ändert nichts', JSON.stringify(S.historie)===snap && S.meta.urlaub260Log.tage.length===2);
  var mm=JSON.parse(_store['fokus2_meta']); delete mm.urlaub260; _store['fokus2_meta']=JSON.stringify(mm); ladeAlles();
  ok('§7 auch ohne Flag: ein erneuter Lauf findet keine neuen Tage', S.meta.urlaub260Log.tage.length===0 && S.meta.urlaub260Log.schonUrlaub===2);
  syncBestaetigen();
  ok('§7 … bis der Sync bestätigt ist', (S.meta.urlaubNachgetragen||[]).length===0);
  ok('§7 fällt aus Normaltag und Vergleichen (tagIstUrlaub)', tagIstUrlaub(isoPlus(-5)) && !tagIstUrlaub(isoPlus(-1)));
})();

/* ══════════════════════════════════════════════════════════════════════
   v2.7.0 „Blöcke" — Abnahme 1–12 (Layout/Klick per Harness)
   ══════════════════════════════════════════════════════════════════════ */
kopf('v2.7.0 §1 · Tagesblöcke');
frisch(); _blockAuf={}; _blockKarten=null;
var h0=jetztStunde();
function uhr(x){ var m=Math.round(x*60); return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'); }
var BLOCKPAKET={ appVersion:'2.7.0',
  tagesRahmen:[
    {id:'morgen', name:'Morgen', von:h0-4, bis:h0-2, typ:'privat'},
    {id:'fokus1', name:'DFM-Fokus 1', von:h0-2, bis:h0+2, typ:'dfm'},
      {id:'f1a', name:'Angebote', von:h0-2, bis:h0-0.25, parent:'fokus1'},
      {id:'f1p', name:'Kaffee', von:h0-0.25, bis:h0+0.25, parent:'fokus1', typ:'pause'},
      {id:'f1c', name:'Kalkulation', von:h0+0.25, bis:h0+2, parent:'fokus1'},
    {id:'senke', name:'Senke', von:h0+2, bis:h0+3, typ:'privat'},
    {id:'fokus2', name:'DFM-Fokus 2', von:h0+3, bis:h0+5, typ:'dfm'},
    {id:'erholung', name:'Erholung', von:h0+5, bis:h0+6, typ:'privat'},
    {id:'abschluss', name:'Abschluss', von:h0+6, bis:h0+6.5, typ:'privat'},
    {id:'kaputt', name:'Außerhalb', von:h0+1.5, bis:h0+2.5, parent:'fokus1'} ],
  karten:[ {id:'b1', domain:'dfm', titel:'Angebot Müller', block:'f1a'}, {id:'b2', domain:'dfm', titel:'Angebot Kaiser', block:'f1a'},
           {id:'b3', domain:'dfm', titel:'Kalkulation Welle', block:'f1c'}, {id:'b4', domain:'privat', titel:'Einkaufen'},
           {id:'b5', domain:'dfm', titel:'Review Fokus 2', block:'fokus2'} ],
  kette:['b1','b2','b3','b4','b5'] };
var rB=syncImport(JSON.stringify(BLOCKPAKET));
var bl=tagesBloecke();
ok('§1.1 Blöcke auf zwei Ebenen übernommen ('+bl.length+'), der Unterblock außerhalb abgewiesen und benannt',
   bl.length===9 && (rB.uebersprungen||[]).some(function(u){ return /Außerhalb/.test(u.was) && /innerhalb/.test(u.grund); }));
ok('§1.1 typ vom Oberblock geerbt (Angebote = dfm), eigener typ bleibt (Kaffee = pause)',
   bl.filter(function(b){return b.id==='f1a';})[0].typ==='dfm' && bl.filter(function(b){return b.id==='f1p';})[0].typ==='pause');
var fl=tagesRahmen(), dfmStd=rahmenFenster(fl,'dfm').reduce(function(a,f){return a+f[1]-f[0];},0);
ok('§1.1 Soll-Form = tiefster Block je Abschnitt: DFM 4 + 2 Std − 30 Min Kaffee = '+dfmStd+' Std (nichts doppelt)', Math.abs(dfmStd-5.5)<1e-9);
ok('§1.2 Karten gehören für heute zu ihrem Block', karteBlockId(S.karten.filter(function(k){return k.id==='b1';})[0])==='f1a' &&
   S.karten.filter(function(k){return k.id==='b1';})[0].blockTag===heuteApp());
var lb=laufenderBlock();
ok('§1.4 laufender Block = der tiefste, der jetzt enthält ('+(lb&&lb.name)+')', lb && lb.id==='f1p');
S.ui.suDom=null; S.ui.suArt=null;
var kal=suKalenderHtml();
var ebene1=(kal.match(/data-kalblock="(morgen|fokus1|senke|fokus2|erholung|abschluss)"/g)||[]).length;
ok('§1.4 Ebene 1: sechs Balken mit Namen', ebene1===6 && kal.indexOf('DFM-Fokus 1')>=0 && kal.indexOf('Abschluss')>=0);
ok('§1.4 Zahl der Karten je Block (offen/gesamt, Unterblöcke eingerechnet): DFM-Fokus 1 = 3/3', /DFM-Fokus 1<\/span><span class="kb-m">[^<]*<b>3<\/b>\/3 Karten/.test(kal));
ok('§1.4 Farbe nach typ (DFM blau, privat lila) und der laufende Block hervorgehoben', /kal-block t-dfm laeuft/.test(kal) && /kal-block t-privat/.test(kal) && /\.kal-block\.t-dfm\{--kbc:59,130,246\}/.test(src));
ok('§1.4 Jetzt-Linie bleibt', kal.indexOf('kal-jetzt')>=0);
ok('§1.4 „Ohne Block" unter dem Kalender (Einkaufen)', /Ohne Block · 1/.test(kal) && kal.indexOf('Einkaufen')>kal.indexOf('Ohne Block'));
_blockAuf.fokus1=true; kal=suKalenderHtml();
ok('§1.4 Tipp klappt die Unterblöcke auf (Schiene + drei Unterblöcke)', /kal-block t-dfm[^"]*schiene/.test(kal) && /data-kalblock="f1a"/.test(kal) && /data-kalblock="f1p"/.test(kal) && /data-kalblock="f1c"/.test(kal));
_blockKarten='f1a'; kal=suKalenderHtml();
var panel=(kal.match(/<div class="kal-auf kb-auf"[\s\S]*?<\/div><div class="kal-jetzt|<div class="kal-auf kb-auf"[\s\S]*$/)||[''])[0];
ok('§1.4 unterste Ebene zeigt NUR ihre Karten (Müller, Kaiser — nicht Welle)', panel.indexOf('Angebot Müller')>=0 && panel.indexOf('Angebot Kaiser')>=0 && panel.indexOf('Kalkulation Welle')<0);
ok('§1.4 Tipp-Wege: data-kalblock im Such-Handler', /closest\('\[data-kalblock\]'\)/.test(src));
_blockAuf={}; _blockKarten=null;
/* §1.5 neue Karte */
oeffneDetail(null);
ok('§1.5 Anlege-Dialog: Block-Auswahl mit dem laufenden Block vorausgewählt', entwurf.block==='f1p' && /data-chip="block" data-val="f1p"/.test(el('sheetBody').innerHTML) &&
   /chip kb-chip t-pause on" data-chip="block" data-val="f1p"/.test(el('sheetBody').innerHTML));
entwurf.block='f1c'; entwurf.blockTag=heuteApp(); entwurf.titel='Neue Kalkulation'; var nid=entwurf.id; detailSpeichern();
_blockAuf.fokus1=true; _blockKarten='f1c'; kal=suKalenderHtml(); _blockKarten=null; _blockAuf={};
ok('§1.5 die neue Karte erscheint in ihrem Block', /Neue Kalkulation/.test(kal) && karteBlockId(S.karten.filter(function(k){return k.id===nid;})[0])==='f1c');
/* §1.6 Export */
var exB=syncExport('delta');
var eb1=exB.karten.filter(function(k){return k.id==='b1';})[0], eb4=exB.karten.filter(function(k){return k.id==='b4';})[0];
print('   Export-Ausschnitt: karten[b1].block='+JSON.stringify(eb1.block)+' · karten[b4].block='+JSON.stringify(eb4.block)+' · tagesRahmen['+exB.tagesRahmen.length+'] z. B. '+JSON.stringify(exB.tagesRahmen.filter(function(b){return b.id==='f1a';})[0]));
ok('§1.6 Export trägt block je Karte und den Tagesrahmen mit Blöcken', eb1.block==='f1a' && eb4.block===null &&
   exB.tagesRahmen.length===9 && exB.tagesRahmen.some(function(b){ return b.id==='f1a' && b.parent==='fokus1' && b.name==='Angebote'; }));
/* §1 altes Paket */
frisch();
var rAlt=syncImport(JSON.stringify({appVersion:'2.0.0', karten:[{id:'o1', domain:'dfm', titel:'Alt'}], tagesRahmen:[{von:'09:00', bis:'12:00', typ:'dfm'},{von:'12:00', bis:'13:00', typ:'pause'},{von:'13:00', bis:'17:00', typ:'dfm'}]}));
var blA=tagesBloecke();
ok('§1.1 altes Paket ohne Block-Felder: jedes Segment ein Block der ersten Ebene, benannt nach typ ('+blA.map(function(b){return b.name;}).join(' · ')+')',
   blA.length===3 && blA[0].name==='DFM' && blA[1].name==='Pause' && blA.every(function(b){ return b.parent===null; }) && !(rAlt.uebersprungen||[]).length &&
   Math.abs(sollFensterStunden()-7)<1e-9);

kopf('v2.7.0 §2 · Feste Bewertung');
frisch();
var kf=neueKarte({id:'tabs', domain:'privat', titel:'Tagesabschluss', sollMin:15, festMin:15, matrixFeld:'ziel', faelligkeit:H()});
S.karten=[kf];
kf.istSek=3*60; var p3=kartePunkte(kf);
kf.istSek=40*60; var p40=kartePunkte(kf);
var ohne=Object.assign({}, kf, {festMin:null}), p40o=kartePunkte(ohne);
print('   „Tagesabschluss" festMin 15: 3 Min gestoppt → '+fmtP(p3)+' P · 40 Min → '+fmtP(p40)+' P (ohne feste Bewertung wären es '+fmtP(p40o)+' P) · Ist-Zeit bleibt '+Math.round(kf.istSek/60)+' Min');
ok('§2 Punkte gleich, ob 3 oder 40 Minuten gestoppt', Math.abs(p3-p40)<1e-9 && p40o>p40);
ok('§2 die gestoppte Zeit bleibt gebucht (istSek 40 Min)', kf.istSek===2400);
var twf=tempoWerte(kf);
ok('§2 Tempo-Prognose = Punkte aus festMin ÷ festMin-Stunden ('+fmtP(twf.karte.prognose)+')', Math.abs(twf.karte.prognose-kartePunktePrognose(kf)/0.25)<1e-9);
syncImport(JSON.stringify({appVersion:'2.7.0', karten:[{id:'tabs', festMin:''},{id:'neu15', domain:'privat', titel:'Tagesabschluss 2', festMin:15}]}));
ok('§2 Import: festMin Zahl oder leer', S.karten.filter(function(k){return k.id==='neu15';})[0].festMin===15 && S.karten.filter(function(k){return k.id==='tabs';})[0].festMin===null);
ok('§2 Export trägt festMin je Karte', (function(){ var e=syncExport('voll').karten; return e.filter(function(k){return k.id==='neu15';})[0].festMin===15 && e.filter(function(k){return k.id==='tabs';})[0].festMin===null; })());
entwurf=neueKarte({domain:'privat', festMin:15}); entwurfNeu=false; entwurfSubs=[]; renderDetail();
ok('§2 im Detail sichtbar: „feste Bewertung: 15 Min"', el('sheetBody').innerHTML.indexOf('feste Bewertung: 15 Min')>=0);
entwurf=null;

kopf('v2.7.0 §3 · Korrekturen über den Sync');
frisch();
var GESTERN=anVorTage(H(),1);
function gz(hhmm){ var d=new Date(GESTERN+'T00:00:00'); var t=hhmm.split(':'); d.setHours(+t[0],+t[1],0,0); return d.toISOString(); }
var kK=neueKarte({id:'kk', domain:'dfm', titel:'Konzept Hallenkran', sollMin:120, matrixFeld:'ziel', projekt:'Fertigung', faelligkeit:H()});
kK.istSek=1800;
var kE=neueKarte({id:'ke', domain:'dfm', titel:'Angebot erledigt', sollMin:60, matrixFeld:'ziel', faelligkeit:GESTERN});
kE.status='erledigt'; kE.tagId=GESTERN+'-1'; kE.punkteOverride=400; kE.istSek=3600;
S.karten=[kK, kE];
S.historie=[{ tagId:GESTERN+'-1', datum:GESTERN, laufindex:1, urlaub:false, spielZufluss:1200, startTs:gz('08:00'), endeTs:gz('18:00'), akku:60,
  punkteBilanz:1000, abzuege:0, routinenBilanz:[], zeit:{dfm:5400,privat:0,projekte:{Fertigung:5400}}, luecke:false,
  matrixSpur:[{id:'p1',ts:gz('08:30'),x:-0.6,y:0.2},{id:'p2',ts:gz('10:00'),x:0.4,y:0.4,kid:'kk'},{id:'p3',ts:gz('13:00'),x:0.7,y:-0.3}],
  log:[{itemId:'ke', titel:'Angebot erledigt', domain:'dfm', art:'Aufgabe', punkte:400, ts:gz('12:00')}], akkuVerlauf:[], streak:0, erledigtHeute:1 }];
S.intraday=[{id:'s-alt', ts:gz('09:30'), kartenId:'kk', domaene:'dfm', punkte:0, minuten:30, typ:'timer'},
            {ts:gz('12:00'), kartenId:'ke', domaene:'dfm', punkte:400, minuten:0, typ:'abhaken'}];
S.meta.muenzenGesamt=50000; S.meta.rangPunkte=40000; S.meta.wohlstand=90000;
function aktFenster(){ return anStundenBuckets((S.intraday||[]).filter(function(e){ return e.ts && String(e.ts).slice(0,10)===GESTERN && num(e.punkte)>0; })); }
function tagKurveEnde(){ var k=belTagKurve(GESTERN,'alle',5); return k[k.length-1].p; }
var V={ bil:tagSnapshot(GESTERN).punkteBilanz, dfm:snapPunkte(tagSnapshot(GESTERN),'dfm'), min:Math.round(tagSnapshot(GESTERN).zeit.dfm/60),
        ist:kK.istSek/60, ov:kE.punkteOverride, fenster11:aktFenster()[new Date(gz('11:00')).getHours()], kurve:tagKurveEnde(),
        muenzen:S.meta.muenzenGesamt, matrix:matrixZeitFelder({spur:S.historie[0].matrixSpur, startTs:S.historie[0].startTs, endeTs:S.historie[0].endeTs}) };
var KORR={ appVersion:'2.7.0', karten:[], korrekturen:[
  { datum:GESTERN, grund:'Kranbesprechung am Vormittag nicht gestoppt',
    sitzungen:[ {aktion:'hinzu', id:'s-k1', karteId:'kk', von:gz('10:00'), bis:gz('11:00')},
                {aktion:'hinzu', karteId:'ke', von:'13:00', bis:'13:30'},
                {aktion:'hinzu', karteId:'gibtsnicht', von:gz('14:00'), bis:gz('15:00')},
                {aktion:'hinzu', karteId:'kk', von:gz('16:00'), bis:gz('15:00')} ],
    positionen:[ {aktion:'entfernen', id:'p2'} ] },
  { datum:anVorTage(H(),-2), grund:'Zukunft', tag:{urlaub:true} },
  { datum:GESTERN, tag:{urlaub:true} } ] };
var rK=syncImport(JSON.stringify(KORR));
var dP1=sitzungPunkteFuer(kK,60,GESTERN), dP2=sitzungPunkteFuer(kE,30,GESTERN);
var N={ bil:tagSnapshot(GESTERN).punkteBilanz, dfm:snapPunkte(tagSnapshot(GESTERN),'dfm'), min:Math.round(tagSnapshot(GESTERN).zeit.dfm/60),
        ist:kK.istSek/60, ov:kE.punkteOverride, fenster11:aktFenster()[new Date(gz('11:00')).getHours()], kurve:tagKurveEnde(), muenzen:S.meta.muenzenGesamt,
        matrix:matrixZeitFelder({spur:S.historie[0].matrixSpur, startTs:S.historie[0].startTs, endeTs:S.historie[0].endeTs}) };
print('   Sitzung hinzu „Konzept Hallenkran" 10:00–11:00 = 60 Min × '+rate(kK)+' P/Std × Zeit-Gewicht '+S.settings.zeitGewicht+' = '+fmtP(dP1)+' P');
print('   Sitzung hinzu „Angebot erledigt" 13:00–13:30 = '+fmtP(dP2)+' P → gebuchte Punkte '+V.ov+' → '+N.ov);
print('   Tag '+GESTERN+' vorher/nachher: Bilanz '+V.bil+' → '+N.bil+' · DFM '+V.dfm+' → '+N.dfm+' · Minuten '+V.min+' → '+N.min+
      ' · Aktivitätsfenster 11 Uhr '+V.fenster11+' → '+N.fenster11+' · Tagesverlauf Ende '+V.kurve+' → '+N.kurve+' · Münzen '+V.muenzen+' → '+N.muenzen);
ok('§3 Karte: Ist-Minuten 30 → 90 (die nachgetragene Stunde)', V.ist===30 && N.ist===90);
ok('§3 Karte: Punkte der offenen Karte rechnen live aus der Zeit', Math.abs(kartePunkte(kK)-(punkteFuerZeit(kK,90)*S.settings.zeitGewicht))<1e-6);
ok('§3 erledigte Karte: gebuchte Punkte ± Punkte der Sitzung ('+V.ov+' → '+N.ov+')', Math.abs(N.ov-(V.ov+dP2))<0.1);
ok('§3 Tageswerte: Bilanz und DFM steigen um beide Sitzungen, Minuten um 90', Math.abs(N.bil-(V.bil+dP1+dP2))<0.2 && Math.abs(N.dfm-(V.dfm+dP1+dP2))<0.2 && N.min===V.min+90);
ok('§3 Aktivitätsfenster: die Stunde der Sitzung trägt ihre Punkte', Math.abs(N.fenster11-V.fenster11-Math.round(dP1*10)/10)<0.2);
ok('§3 Tagesverlauf: das Tagesende liegt um beide Sitzungen höher', Math.abs(N.kurve-V.kurve-(Math.round(dP1*10)/10+Math.round(dP2*10)/10))<0.2);
ok('§3 Konto zieht nach (Faktor des Tages '+fbZahl(1200/1000,2)+')', N.muenzen===V.muenzen+Math.round(dP1*1.2)+Math.round(dP2*1.2));
print('   Matrix-Zeit vorher '+JSON.stringify(V.matrix.felder)+' · nachher '+JSON.stringify(N.matrix.felder));
ok('§3 Position entfernen: Zeit je Matrix-Feld rechnet nach (die 10-Uhr-Messung „Werkzeuge" ist weg, ihre 3 Std gehen an die Messung davor)',
   V.matrix.felder.werkzeug===180 && N.matrix.felder.werkzeug===0 && N.matrix.felder.ablenkung===V.matrix.felder.ablenkung+180 && Math.round(V.matrix.mess)===Math.round(N.matrix.mess));
var namen=(rK.uebersprungen||[]).map(function(u){ return u.was+' — '+u.grund; });
print('   abgewiesen: '+namen.join(' | '));
ok('§3 ungültig abgewiesen und benannt: Karte unbekannt · bis vor von · Datum in der Zukunft · grund fehlt', namen.length===4 &&
   namen.some(function(x){return /unbekannt/.test(x);}) && namen.some(function(x){return /bis liegt vor von/.test(x);}) &&
   namen.some(function(x){return /Zukunft/.test(x);}) && namen.some(function(x){return /grund fehlt/.test(x);}));
var prot=S.meta.korrekturProtokoll||[];
ok('§3 Protokoll: Datum, Grund, vorher, nachher, Änderungen', prot.length===1 && prot[0].grund.indexOf('Kranbesprechung')>=0 && prot[0].vorher.punkte===Math.round(V.bil) &&
   prot[0].nachher.punkte===Math.round(N.bil) && prot[0].aenderungen.length>=4);
ok('§3 Protokoll nennt die LOKALE Uhrzeit (Position 10:00 entfernt — nicht die UTC-Ziffern)', prot[0].aenderungen.some(function(z){ return z.indexOf('Position entfernt: 10:00')===0; }));
ok('§3 neue Korrekturen stehen nur im neuen Protokoll (kein Doppel im alten §5.7-Protokoll)', !(S.meta.syncKorrekturen||[]).some(function(x){ return /Kranbesprechung/.test(x.feld||''); }));
renderEinst();
ok('§3 in den Einstellungen als „Korrekturen" sichtbar', el('einstBody').innerHTML.indexOf('🩹 Korrekturen')>=0 && el('einstBody').innerHTML.indexOf('Kranbesprechung')>=0);
var snapZustand=JSON.stringify([S.historie, S.intraday, S.karten, S.meta.muenzenGesamt]);
syncImport(JSON.stringify(KORR));
ok('§3 zweites Einspielen desselben Pakets ändert nichts', JSON.stringify([S.historie, S.intraday, S.karten, S.meta.muenzenGesamt])===snapZustand && (S.meta.korrekturProtokoll||[]).length===1);
/* ändern + entfernen über id, Export trägt Sitzungs-ids */
syncImport(JSON.stringify({appVersion:'2.7.0', karten:[], korrekturen:[{ datum:GESTERN, grund:'war nur 30 Minuten',
  sitzungen:[{aktion:'aendern', id:'s-k1', karteId:'kk', von:gz('10:00'), bis:gz('10:30')}, {aktion:'entfernen', id:'s-alt'}] }]}));
ok('§3 ändern (60 → 30 Min) und entfernen (die alte 30-Min-Sitzung) über die id: Ist 90 → 60 → 30', Math.round(kK.istSek/60)===30 &&
   S.intraday.every(function(e){ return e.id!=='s-alt'; }));
/* heute korrigierbar */
var kH=neueKarte({id:'kh', domain:'privat', titel:'Heute vergessen', sollMin:30, faelligkeit:H()}); S.karten.push(kH);
var vH=heuteInvestiertMin(kH), pH0=tagesPunkteDomain('privat');
var b0=new Date(Date.now()-40*60000).toISOString(), b1=new Date(Date.now()-10*60000).toISOString();
syncImport(JSON.stringify({appVersion:'2.7.0', karten:[], korrekturen:[{ datum:heuteApp(), grund:'heute vergessen', sitzungen:[{aktion:'hinzu', karteId:'kh', von:b0, bis:b1}] }]}));
ok('§3 heute ist korrigierbar: 30 Min gebucht, Tagespunkte privat steigen ('+Math.round(pH0)+' → '+Math.round(tagesPunkteDomain('privat'))+')', vH===0 && Math.round(heuteInvestiertMin(kH))===30 && tagesPunkteDomain('privat')>pH0);
ok('§3 Sitzungen im Export tragen ihre id', (syncExport('delta').karten.filter(function(k){return k.id==='kh';})[0].sitzungen||[]).some(function(x){ return x.id && x.korrektur; }));
/* Abhaken verrechnet nachgetragene Punkte (nie doppelt im Aktivitätsfenster) */
var offenP=S.intraday.filter(function(e){ return e.typ==='korrektur' && e.kartenId==='kk' && e.offen; }).reduce(function(a,e){ return a+num(e.punkte); },0);
ok('§3 beim Abhaken werden nachgetragene Punkte verrechnet ('+fmtP(offenP)+' P)', offenP>0 && Math.abs(korrekturPunkteVerrechnen(kK)-offenP)<1e-9 && korrekturPunkteVerrechnen(kK)===0);

/* ══════════════════════════════════════════════════════════════════════
   v2.8.0 „Abhak-Leiste" — Abnahme 1–10 (Layout/Klick per Harness)
   ══════════════════════════════════════════════════════════════════════ */
kopf('v2.8.0 §1 · Abhak-Karten und Abhak-Leiste');
frisch(); _blockAuf={}; _blockKarten=null;
var hA=jetztStunde();
syncImport(JSON.stringify({ appVersion:'2.8.0', tagesRahmen:[
    {id:'mo', name:'Morgen', von:hA-3, bis:hA-1, typ:'privat'},
    {id:'fo', name:'DFM-Fokus 1', von:hA-1, bis:hA+1, typ:'dfm'},
    {id:'ab', name:'Abschluss', von:hA+1, bis:hA+2, typ:'privat'} ],
  karten:[
    {id:'rZ', domain:'privat', titel:'Zähne', rhythmus:{typ:'taeglich'}, matrixFeld:'werkzeug', block:'mo'},
    {id:'rW', domain:'privat', titel:'Wasser', rhythmus:{typ:'taeglich'}, matrixFeld:'werkzeug', block:'mo'},
    {id:'rM', domain:'dfm', titel:'Mails', rhythmus:{typ:'taeglich'}, matrixFeld:'werkzeug', block:'fo'},
    {id:'cL', domain:'privat', titel:'Liegestütze', ticksAktiv:true, matrixFeld:'werkzeug', block:'ab'},
    {id:'rT', domain:'privat', titel:'Tagesabschluss', rhythmus:{typ:'taeglich'}, sollMin:15, festMin:15, block:'ab'},
    {id:'rX', domain:'privat', titel:'Yoga mit Zeit', rhythmus:{typ:'taeglich'}, sollMin:20, nurAbhaken:true, block:'mo'},
    {id:'rO', domain:'privat', titel:'Ohne Zeit, aber nicht abhaken', rhythmus:{typ:'taeglich'}, nurAbhaken:false, block:'fo'},
    {id:'aK', domain:'dfm', titel:'Kalkulation Welle', sollMin:60, matrixFeld:'ziel', block:'fo'},
    {id:'aW', domain:'dfm', titel:'Werkzeug-Aufgabe', sollMin:30, matrixFeld:'werkzeug', block:'fo'} ],
  kette:['rW','rZ','aK','rM','aW','cL','rT','rX','rO'] }));
S.karten.forEach(function(k){ if(!k.faelligkeit) k.faelligkeit=H(); });
function kid(id){ return S.karten.filter(function(k){ return k.id===id; })[0]; }
ok('§1.1 Regel: Routine/Counter OHNE Soll-Minuten = Abhak-Karte; mit Zeit nicht', istAbhakKarte(kid('rZ')) && istAbhakKarte(kid('cL')) && !istAbhakKarte(kid('rT')) && !istAbhakKarte(kid('aK')));
ok('§1.1 Schalter überschreibt in beide Richtungen (Routine mit Zeit hinein · ohne Zeit heraus)', istAbhakKarte(kid('rX')) && !istAbhakKarte(kid('rO')));
var al=abhakLeisteKarten().map(function(k){ return k.id; });
ok('§1.2 Reihenfolge des Tages: nach Block (Morgen → Fokus → Abschluss), im Block nach Kette ('+al.join(',')+')', al.join(',')==='rW,rZ,rX,rM,cL');
var alh=abhakLeisteHtml();
ok('§1.2 je Zeile Titel · Häkchen (+1 beim Counter) · Play', /data-alcheck="rZ"/.test(alh) && /data-alplay="rZ"/.test(alh) && /data-alcheck="cL"[^>]*>\+1</.test(alh));
var vorP=kartePunkte(kid('rZ'));
leisteAbhaken('rZ');
ok('§1.2 Häkchen ohne Buchungsdialog: erledigt, gebucht = Wert + Abhakbonus ('+kid('rZ').punkteOverride+' P)', kid('rZ').status==='erledigt' && abhakTmp===null && kid('rZ').punkteOverride===Math.round(vorP)+25);
al=abhakLeisteKarten().map(function(k){ return k.id; });
ok('§1.2 erledigte Routine rutscht ausgegraut ans Ende ('+al.join(',')+')', al[al.length-1]==='rZ' && /al-z[^"]* fertig/.test(abhakLeisteHtml()));
karteTick('cL');
al=abhakLeisteKarten().map(function(k){ return k.id; });
ok('§1.2 Counter bleibt an seinem Platz und zeigt den Zählstand', al.indexOf('cL')===3 && /1× · /.test(abhakLeisteHtml()));
ok('§1.2 der Haken-Handler: Counter → +1, sonst abhaken ohne Dialog', /kartenArt\(k\)==='Counter'\) karteTick\(k\.id\); else \{ leisteAbhaken\(k\.id\)/.test(src));
S.ui.fokusZeigt=null; fokusKarteAnsehen('aK'); renderFokus();
var fvA=el('fokusView').innerHTML;
ok('§1.2 Abhak-Leiste ganz unten in der Fokusansicht', fvA.indexOf('Abhaken · ')>fvA.indexOf('Der Tag von oben nach unten'));
var zs=zeitstrahlHtml();
ok('§1.2 Abhak-Karten stehen NICHT im Tagesablauf, Aufgaben schon', zs.indexOf('Zähne')<0 && zs.indexOf('Kalkulation Welle')>=0);
ok('§1.3 Tagesablauf: jede offene Kartenzeile hat Play (Tippfläche 44 px)', /data-zsplay="aK"/.test(zs) && /\.zs-k\{min-height:44px/.test(src) && /\.al-knopf\{[^}]*width:44px;height:44px/.test(src));
var bk=kalenderBloecke(S.karten.filter(function(k){ return k.status==='offen'; }));
ok('§1.2 Abhak-Karten sind keine eigenen Blöcke im Karten-Kalender', !bk.some(function(b){ return b.kid==='rW' || b.kid==='cL'; }) && bk.some(function(b){ return b.kid==='aK'; }));
ok('§1.2 in der Suche bleiben sie', idsIn2(suFreitextHtml('wasser')).indexOf('rW')>=0);

kopf('v2.8.0 §2 · Punkte: Routinen dämpfen, Aufgaben nicht');
frisch();
var rPW=neueKarte({domain:'privat', rhythmus:{typ:'taeglich'}, matrixFeld:'werkzeug'});
var rDW=neueKarte({domain:'dfm', rhythmus:{typ:'taeglich'}, matrixFeld:'werkzeug'});
var aW=neueKarte({domain:'privat', matrixFeld:'werkzeug', sollMin:30});
print('   Abhakbonus: private Werkzeug-Routine '+abhakbonusDefault(rPW)+' · DFM-Routine '+abhakbonusDefault(rDW)+' · Werkzeug-Aufgabe '+abhakbonusDefault(aW));
ok('§2.1 Tabelle: private Werkzeug-Routine 25 · DFM-Routine 60 · Werkzeug-Aufgabe 200', abhakbonusDefault(rPW)===25 && abhakbonusDefault(rDW)===60 && abhakbonusDefault(aW)===200);
ok('§2.1 Zustand/Ablenkung 0, Ziel-Aufgabe 150, Counter wie Routine', abhakbonusDefault(neueKarte({matrixFeld:'zustand'}))===0 &&
   abhakbonusDefault(neueKarte({matrixFeld:'ziel'}))===150 && abhakbonusDefault(neueKarte({domain:'privat', ticksAktiv:true, matrixFeld:'ziel'}))===25);
var rZeit=neueKarte({domain:'privat', rhythmus:{typ:'taeglich'}, matrixFeld:'ziel', sollMin:60, istSek:3600, abhakbonus:0});
var aZeit=neueKarte({domain:'privat', matrixFeld:'ziel', sollMin:60, istSek:3600, abhakbonus:0});
var dZeit=neueKarte({domain:'dfm', rhythmus:{typ:'taeglich'}, matrixFeld:'ziel', sollMin:60, istSek:3600, abhakbonus:0});
print('   60 Min Zeit: private Routine '+fmtP(kartePunkte(rZeit))+' P · private Aufgabe '+fmtP(kartePunkte(aZeit))+' P · DFM-Routine '+fmtP(kartePunkte(dZeit))+' P (Faktor 1,0)');
ok('§2.2 private Routine mit Zeit bringt halbe Zeitpunkte, private Aufgabe volle', Math.abs(kartePunkte(rZeit)*2-kartePunkte(aZeit))<1e-9);
ok('§2.2 DFM-Routinen ungedämpft (1,0)', Math.abs(kartePunkte(dZeit)-kartePunkte(aZeit)*num(S.settings.basisProStdDfm)/num(S.settings.basisProStdPrivat))<1e-9);
var eig=neueKarte({domain:'privat', rhythmus:{typ:'taeglich'}, matrixFeld:'werkzeug', abhakbonus:100, ticksAktiv:true, tickWert:10, ticksHeute:3});
ok('§2.3 eigener Abhakbonus schlägt die Tabelle und wird NICHT gedämpft (Entscheidung Pascal): 100', abhakbonusDefault(eig)===100);
ok('§2.3 eigener Tickwert: Dämpfung wirkt trotzdem (3 × 10 × Tick-Gewicht × 0,5)', Math.abs(tickPunkte(eig)-30*num(S.settings.tickGewicht)*0.5)<1e-9);
ok('§2.2 Faktoren sind Einstellungen', (function(){ S.settings.daempfungPrivat=0.8; var r=Math.abs(kartePunkte(rZeit)/kartePunkte(aZeit)-0.8)<1e-9; S.settings.daempfungPrivat=0.5; return r; })());
S.meta.daempfungAb=H();
ok('§2.4 nicht rückwirkend: eine nachgetragene Sitzung vor dem Update rechnet ungedämpft', Math.abs(sitzungPunkteFuer(rZeit,60,anVorTage(H(),3))-sitzungPunkteFuer(aZeit,60,anVorTage(H(),3)))<1e-9 &&
   Math.abs(sitzungPunkteFuer(rZeit,60,H())*2-sitzungPunkteFuer(aZeit,60,H()))<1e-9);
var tw8=tempoWerte(neueKarte({domain:'privat', rhythmus:{typ:'taeglich'}, matrixFeld:'werkzeug', sollMin:30}));
ok('§2.5 Tempo-Prognose rechnet mit Dämpfung und Tabelle ('+fmtP(tw8.karte.prognose)+' P/Std = (30′ × 120 × 1,5 × ½ × 0,8 + 25) ÷ 0,5)', Math.abs(tw8.karte.prognose-(30/60*120*num(S.settings.zeitGewicht)*0.5*0.8+25)/0.5)<1e-6);
(function(){
  _store={}; _store['fokus2_settings']=JSON.stringify({ abhakbonusFeld:{ ziel:150, zustand:0, werkzeug:200, ablenkung:0 } });
  _store['fokus2_meta']=JSON.stringify({ seeded:true, migration200:true, nachtrag200:true, nachtrag200b:true, dublettenFix201:true, einDatum210:true, geld260:true, urlaub260:true });
  ladeAlles();
  ok('§2.1 Migration: die Aufgaben-Spalte übernimmt Pascals Gerätewerte (200/150/0/0) · Dämpfung ab heute', JSON.stringify(S.settings.abhakbonusTabelle.aufgabe)===JSON.stringify({werkzeug:200,ziel:150,zustand:0,ablenkung:0}) && S.meta.daempfungAb===heuteApp());
})();
frisch(); S.karten=[neueKarte({id:'e1', domain:'privat', titel:'Mit eigenem Bonus', rhythmus:{typ:'taeglich'}, abhakbonus:80}), neueKarte({id:'e2', domain:'dfm', titel:'Mit eigenem Tick', ticksAktiv:true, tickWert:12}), neueKarte({id:'e3', titel:'Ohne'})];
renderEinst();
ok('§2.3 Einstellungen: Liste aller Karten mit eigenem Abhakbonus/Tickwert, je mit „↺ Tabelle"', /Karten mit eigenem Wert · 2/.test(el('einstBody').innerHTML) && /data-eigenreset="e1"/.test(el('einstBody').innerHTML) && el('einstBody').innerHTML.indexOf('Ohne</')<0);
ok('§2.1 Tabelle in den Einstellungen, alle Werte einstellbar', (el('einstBody').innerHTML.match(/data-abt="/g)||[]).length===12);

kopf('v2.8.0 §3 · Vorschlag folgt dem Block');
frisch();
var hV=jetztStunde();
syncImport(JSON.stringify({ appVersion:'2.8.0', tagesRahmen:[
    {id:'b1', name:'Jetzt-Block', von:hV-1, bis:hV+1, typ:'dfm'}, {id:'b2', name:'Danach', von:hV+1, bis:hV+2, typ:'dfm'} ],
  karten:[ {id:'v1', domain:'dfm', titel:'Erste im Block', sollMin:30, block:'b1'}, {id:'v2', domain:'dfm', titel:'Zweite im Block', sollMin:30, block:'b1'},
           {id:'vR', domain:'dfm', titel:'Abhak im Block', rhythmus:{typ:'taeglich'}, block:'b1'},
           {id:'v3', domain:'dfm', titel:'Im nächsten Block', sollMin:30, block:'b2'} ],
  kette:['vR','v2','v1','v3'] }));
var bv=blockVorschlag(null);
ok('§3 nächste offene Karte im laufenden Block in Kettenreihenfolge, Abhak-Karte übersprungen ('+(bv&&bv.karte.titel)+')', bv && bv.karte.id==='v2');
bv=blockVorschlag('v2');
ok('§3 die verlassene Karte zählt nicht', bv && bv.karte.id==='v1');
kid('v1').status='erledigt'; kid('v2').status='erledigt';
bv=blockVorschlag(null);
ok('§3 leerer Block → erste offene Karte des nächsten Blocks', bv && bv.karte.id==='v3' && bv.block.id==='b2' && !bv.imLaufenden);
S.fokus=null; S.tag.vorschlagGezeigt=[]; zeigeVorschlag('v2');
ok('§3 der Vorschlag öffnet die Karte direkt, pausiert (kein Sprung in die Matrix-Sicht)', S.fokus && S.fokus.karteId==='v3' && S.fokus.laeuft===false && S.ui.fokusOffen===true && S.ui.suSicht!=='matrix');
frisch();
S.karten=[ neueKarte({id:'w1', domain:'privat', titel:'Werkzeug privat', matrixFeld:'werkzeug', sollMin:10, faelligkeit:H()}),
           neueKarte({id:'w2', domain:'dfm', titel:'Werkzeug DFM', matrixFeld:'werkzeug', sollMin:10, faelligkeit:H()}),
           neueKarte({id:'w3', domain:'dfm', titel:'Abhak-Werkzeug', matrixFeld:'werkzeug', rhythmus:{typ:'taeglich'}, faelligkeit:H()}) ];
S.tag.vorschlagGezeigt=[]; zeigeVorschlag('x');
ok('§3 ohne Blöcke die alte Regel: Werkzeug, DFM vor privat, Abhak-Karten nie', S.ui.suVorschlag && S.ui.suVorschlag.kid==='w2' && S.ui.suSicht==='matrix');

kopf('v2.8.0 §4 · Vom Gerät nehmen');
frisch();
var kG=neueKarte({id:'g1', domain:'dfm', airtableId:'recGGGGGGGGGGGGGG', titel:'Angebot Kaiser', rhythmus:{typ:'taeglich'}, sollMin:20, streak:17, faelligkeit:H()});
kG.istSek=1800; S.karten=[kG, neueKarte({id:'g2', domain:'dfm', titel:'Läuft gerade', sollMin:20, faelligkeit:H()})];
S.unteraufgaben=[neueUnteraufgabe('g1',{id:'gu1', titel:'Teil A'})];
S.historie=[{tagId:'x', datum:anVorTage(H(),1), punkteBilanz:500, log:[{itemId:'g1', punkte:500, art:'Routine', domain:'dfm'}], luecke:false}];
S.intraday=[{ts:jetztIso(), kartenId:'g1', punkte:0, minuten:30, typ:'timer', id:'s-1'}];
ketteSetzen(['g1','g2']);
fokusStarten('g2');
var rL=karteVomGeraet('g2','detail');
ok('§4 nur ohne laufende Uhr', rL.ok===false && /Uhr läuft/.test(rL.grund) && kid('g2'));
var rG=karteVomGeraet('g1','detail');
ok('§4 Karte weg (auch aus Kette und Unteraufgaben), Historie und Intraday bleiben', rG.ok && !kid('g1') && tagesKette().indexOf('g1')<0 &&
   !S.unteraufgaben.some(function(u){ return u.parentId==='g1'; }) && S.historie[0].log[0].itemId==='g1' && S.intraday.length===1);
var exG=syncExport('delta');
print('   Export: '+JSON.stringify({ vomGeraetGenommen:exG.vomGeraetGenommen.map(function(x){ return {id:x.id, airtableId:x.airtableId, titel:x.titel, ts:'…'}; }) }));
ok('§4 Export meldet vomGeraetGenommen mit id, airtableId, titel, Zeitpunkt', exG.vomGeraetGenommen.length===1 && exG.vomGeraetGenommen[0].id==='g1' &&
   exG.vomGeraetGenommen[0].airtableId==='recGGGGGGGGGGGGGG' && exG.vomGeraetGenommen[0].titel==='Angebot Kaiser' && !!exG.vomGeraetGenommen[0].ts);
syncImport(JSON.stringify({appVersion:'2.8.0', karten:[{id:'recGGGGGGGGGGGGGG', titel:'Angebot Kaiser (neu)'}]}));
var zurueck=S.karten.filter(function(k){ return k.airtableId==='recGGGGGGGGGGGGGG'; });
ok('§4 erneut geschickt: wie eine BEKANNTE — keine Dublette, Serie/Ist-Zeit/Unteraufgaben zurück', zurueck.length===1 && zurueck[0].id==='g1' && zurueck[0].streak===17 &&
   zurueck[0].istSek===1800 && zurueck[0].titel==='Angebot Kaiser (neu)' && S.unteraufgaben.some(function(u){ return u.id==='gu1'; }) && (S.meta.vomGeraetGenommen||[]).length===0);
fokusZeitEinbuchen(); S.fokus=null;
var rI=syncImport(JSON.stringify({appVersion:'2.8.0', karten:[{airtableId:'recGGGGGGGGGGGGGG', vomGeraet:true}, {id:'gibtsnicht', vomGeraet:true}]}));
ok('§4 per Import: vomGeraet:true nimmt sie herunter (Match airtableId), Unbekanntes ohne Wirkung', !kid('g1') && rI.vomGeraetGenommen===1 && !S.karten.some(function(k){ return k.id==='gibtsnicht'; }));
syncBestaetigen();
ok('§4 die Liste gilt bis zum nächsten bestätigten Sync', (S.meta.vomGeraetGenommen||[]).length===0);
oeffneDetail('g2');
ok('§4 im Detail ein Knopf „Vom Gerät nehmen" mit Bestätigung', /data-vomgeraet="1"/.test(el('sheetBody').innerHTML) && /_vomGeraetFrage=true; renderDetail\(\)/.test(src) && /data-vomgeraetja/.test(src));
closeSheet();

kopf('v2.8.0 §6 · Export');
frisch(); S.karten=[neueKarte({id:'n1', titel:'mit Schalter', nurAbhaken:true}), neueKarte({id:'n2', titel:'Regel'})];
var ex8=syncExport('voll').karten;
ok('§6 je Karte nurAbhaken (true · false · null)', ex8[0].nurAbhaken===true && ex8[1].nurAbhaken===null && 'vomGeraetGenommen' in syncExport('delta'));
syncImport(JSON.stringify({appVersion:'2.8.0', karten:[{id:'n2', nurAbhaken:false}]}));
ok('§6 Import nimmt nurAbhaken an', kid('n2').nurAbhaken===false);

kopf('v2.8.0 §5 · Farben (Stichproben; die Tabelle steht im Report)');
ok('§5 Statusleiste: Privat lila statt gelb', /\.ist\.privat\{background:linear-gradient\(90deg,#d8b4fe,#a855f7\)\}/.test(src));
ok('§5 Linien tragen Farbe + Verlauf darunter (anSvgLine flaeche, leuchtende Punkte)', /s\.flaeche\) fl\+=flaecheSvg/.test(src) && /leuchten\(df,3\)/.test(src));
ok('§5 Akku als eigener Verlauf rot → gelb → grün', /akkuVerlaufDef\(aid, Y\(0\), Y\(100\)\)/.test(src));
ok('§5 Matrix-Verlauf: Linie in der Richtungsfarbe statt weiß', /stroke="url\(#'\+rid\+'\)"/.test(src));
ok('§5 Belohnung: Balken/Ringe farbig (Münzen gold, Rang lila, Kulisse cyan)', /fbBalken\(frac, null, null, false, SPIEL_FARBE\.rang\)/.test(src) && /SPIEL_FARBE\.kulisse\)/.test(src));

/* ══ v2.8.1 · Hotfix: Wiederholungen und Zuruecksetzen per Paket ══ */
kopf('v2.8.1 §1 · Karte erneut anlegen');
frisch();
var alt=neueKarte({id:'alt1', domain:'dfm', titel:'Angebot Welle', matrixFeld:'werkzeug', sollMin:90, geldImpact:240, faelligkeit:anVorTage(H(),3)});
alt.status='erledigt'; alt.tagId=anVorTage(H(),3)+'-1'; alt.letzteBearbeitung=new Date(Date.now()-3*86400000).toISOString();
var alt2=neueKarte({id:'alt2', domain:'privat', titel:'angebot welle', matrixFeld:'ziel', sollMin:10}); alt2.letzteBearbeitung=new Date(Date.now()-9*86400000).toISOString();
S.karten=[alt, alt2];
S.unteraufgaben=[neueUnteraufgabe('alt1',{id:'ua1', titel:'Zeichnung', sollMin:30, done:true}), neueUnteraufgabe('alt1',{id:'ua2', titel:'Kalkulation', sollMin:45, done:true}),
                 neueUnteraufgabe('alt1',{id:'ua3', titel:'Freigabe', sollMin:15, done:false})];
var altStand=JSON.stringify([alt, S.unteraufgaben]);
ok('§1 bei mehreren Karten mit dem Titel die zuletzt bearbeitete (Groß/Klein egal)', vorlageFuerTitel(' Angebot  WELLE ')===alt);
oeffneDetail(null);
entwurf.titel='Angebot Welle'; el('detailVorlage').innerHTML=wdhVorlageHtml();
ok('§1 der Anlege-Dialog bietet „Von … übernehmen" an', /data-wdhvon="alt1"/.test(el('detailVorlage').innerHTML));
wdhUebernehmen('alt1');
ok('§1 vorbelegt: Matrixfeld, Soll-Minuten, Geld-Impact, Domäne', entwurf.matrixFeld==='werkzeug' && entwurf.sollMin===90 && entwurf.geldImpact===240 && entwurf.domain==='dfm' && entwurf.wiederholungVon==='alt1');
ok('§1 Unteraufgaben: je Stück wählbar, dazu „Alle übernehmen" / „Keine" (dieselbe Ansicht wie beim Wiederöffnen)',
   (el('sheetBody').innerHTML.match(/data-wdhwahl="/g)||[]).length===6 && /data-wdhalle="uebernehmen"/.test(el('sheetBody').innerHTML) && /data-wdhalle="weglassen">Keine/.test(el('sheetBody').innerHTML) && /class="ro-z"/.test(el('sheetBody').innerHTML));
ok('§1 zunächst alle übernommen, auf NICHT erledigt, mit neuen IDs', entwurfSubs.length===3 && entwurfSubs.every(function(u){ return !u.done && ['ua1','ua2','ua3'].indexOf(u.id)<0; }));
Object.keys(wdhTmp.wahl).forEach(function(id){ wdhTmp.wahl[id]='weglassen'; }); wdhSubsNeu();
ok('§1 „Keine" → keine Unteraufgabe', entwurfSubs.length===0);
wdhTmp.wahl.ua2='uebernehmen'; wdhSubsNeu();
ok('§1 einzeln: nur „Kalkulation"', entwurfSubs.length===1 && entwurfSubs[0].titel==='Kalkulation' && entwurfSubs[0].done===false);
var neuId=entwurf.id; detailSpeichern();
var neuK=S.karten.filter(function(k){ return k.id===neuId; })[0];
ok('§1 eine eigene Karte mit eigener ID, Unteraufgabe übernommen', neuK && neuK.id!=='alt1' && untermenge(neuId).length===1 && untermenge(neuId)[0].titel==='Kalkulation' && !untermenge(neuId)[0].done);
ok('§1 die alte Karte bleibt unverändert (samt Unteraufgaben)', JSON.stringify([S.karten.filter(function(k){return k.id==='alt1';})[0], S.unteraufgaben.filter(function(u){ return u.parentId==='alt1'; })])===altStand);
var exW=syncExport('voll').karten;
print('   Export: '+JSON.stringify(exW.filter(function(k){ return k.id===neuId; }).map(function(k){ return {id:'…', titel:k.titel, wiederholungVon:k.wiederholungVon}; })[0])+' · alte Karte wiederholungVon='+JSON.stringify(exW.filter(function(k){return k.id==='alt1';})[0].wiederholungVon));
ok('§1 Export: wiederholungVon = id der Vorlage, sonst null', exW.filter(function(k){ return k.id===neuId; })[0].wiederholungVon==='alt1' && exW.filter(function(k){return k.id==='alt1';})[0].wiederholungVon===null);
oeffneDetail(null); entwurf.titel='Ganz neuer Titel';
ok('§1 ohne gleichen Titel kein Angebot', wdhVorlageHtml()==='');
closeSheet();

kopf('v2.8.1 §2 · Eigene Werte per Paket zurücksetzen');
frisch();
S.karten=[neueKarte({id:'ew1', domain:'privat', titel:'Mit eigenem Bonus', rhythmus:{typ:'taeglich'}, matrixFeld:'werkzeug', abhakbonus:80, ticksAktiv:true, tickWert:12}),
          neueKarte({id:'ew2', domain:'privat', titel:'Bleibt', rhythmus:{typ:'taeglich'}, matrixFeld:'werkzeug', abhakbonus:70, ticksAktiv:true, tickWert:9})];
syncImport(JSON.stringify({appVersion:'2.8.1', karten:[{id:'ew1', abhakbonus:null, tickWert:null}, {id:'ew2', titel:'Bleibt (umbenannt)'}]}));
var e1=S.karten.filter(function(k){return k.id==='ew1';})[0], e2=S.karten.filter(function(k){return k.id==='ew2';})[0];
print('   abhakbonus:null → '+JSON.stringify(e1.abhakbonus)+' (Tabelle '+abhakbonusDefault(e1)+') · tickWert:null → '+JSON.stringify(e1.tickWert)+' · Feld fehlt → Bonus '+e2.abhakbonus+', Tick '+e2.tickWert);
ok('§2 abhakbonus:null / tickWert:null setzen den eigenen Wert zurück — danach gilt die Tabelle (25)', e1.abhakbonus===null && e1.tickWert===null && abhakbonusDefault(e1)===25);
ok('§2 fehlt das Feld im Paket, bleibt der eigene Wert (70 / 9)', e2.abhakbonus===70 && e2.tickWert===9 && e2.titel==='Bleibt (umbenannt)');

/* ══ v2.8.2 · Hotfix: Abhak-Karten beim Start, Wiederholung vollstaendig ══ */
kopf('v2.8.2 §1 · Abhakbonus beim Timer-Start');
frisch();
var rS=neueKarte({id:'rS', domain:'privat', titel:'Dehnen', rhythmus:{typ:'taeglich'}, matrixFeld:'werkzeug', faelligkeit:H(), streak:4});
var cS=neueKarte({id:'cS', domain:'privat', titel:'Liegestütze', ticksAktiv:true, matrixFeld:'werkzeug', faelligkeit:H()});
var rE=neueKarte({id:'rE', domain:'privat', titel:'Wasser', rhythmus:{typ:'taeglich'}, matrixFeld:'werkzeug', faelligkeit:H()});
S.karten=[rS, cS, rE];
function vorMin(m){ return new Date(Date.now()-m*60000).toISOString(); }
var p0=tagesPunkteDomain('privat');
fokusStarten('rS');
var p1=tagesPunkteDomain('privat');
print('   Start „Dehnen" (private Werkzeug-Routine): Bonus '+startBonusHeute(rS)+' P · Tagespunkte privat '+Math.round(p0)+' → '+Math.round(p1)+' · Serie 4 → '+rS.streak);
ok('§1 der Bonus ist sofort gespeichert (übersteht ein Neuladen)', ((DB.get('karten',[])||[]).filter(function(k){ return k.id==='rS'; })[0]||{}).startBonus && DB.get('karten',[]).filter(function(k){ return k.id==='rS'; })[0].startBonus.punkte===25);
ok('§1 Start → Bonus sofort (25), die Uhr läuft, Serie zählt', startBonusHeute(rS)===25 && Math.round(p1-p0)===25 && S.fokus.laeuft && rS.status==='offen' && rS.streak===5);
fokusZeitEinbuchen(); rS.durchgang.pauseTs=vorMin(3);
fokusStarten('rS');
print('   Pause, Neustart nach 3 Min: Bonus bleibt '+startBonusHeute(rS)+' P ('+rS.startBonus.n+' Durchgang)');
ok('§1 Pause, Neustart nach 3 Min → kein zweiter Bonus (derselbe Durchgang)', startBonusHeute(rS)===25 && rS.startBonus.n===1);
fokusZeitEinbuchen(); rS.durchgang.pauseTs=vorMin(10);
fokusStarten('rS');
print('   Pause, Neustart nach 10 Min: Bonus '+startBonusHeute(rS)+' P ('+rS.startBonus.n+' Durchgänge) · Serie '+rS.streak);
ok('§1 Pause, Neustart nach 10 Min → neuer Durchgang, Bonus erneut (50) — die Serie zählt einmal', startBonusHeute(rS)===50 && rS.startBonus.n===2 && rS.streak===5);
fokusZeitEinbuchen(); S.settings.durchgangPauseMin=15; rS.durchgang.pauseTs=vorMin(10);
fokusStarten('rS');
ok('§1 die 5 Minuten sind eine Einstellung (15 → Neustart nach 10 Min = derselbe Durchgang)', startBonusHeute(rS)===50);
S.settings.durchgangPauseMin=5; fokusZeitEinbuchen(); S.fokus=null;
fokusStarten('rE');
var vorErl=kartePunkte(rE);
leisteAbhaken('rE');
print('   Start und Erledigen „Wasser": gebucht '+rE.punkteOverride+' P (Bonus 25 einmal + Zeit '+Math.round(vorErl-25)+' P)');
ok('§1 Start und Erledigen → der Bonus nur einmal', rE.status==='erledigt' && rE.punkteOverride===Math.round(vorErl) && startBonusHeute(rE)===25);
var rD=neueKarte({id:'rD', domain:'privat', titel:'Zweite', rhythmus:{typ:'taeglich'}, matrixFeld:'werkzeug', faelligkeit:H()}); S.karten.push(rD);
fokusStarten('rD'); abhakDialog('rD');
ok('§1 auch im Abhak-Dialog: nach einem Start ist der Bonus mit 0 vorbelegt', abhakTmp && abhakTmp.bonusDef===0);
abhakTmp=null; closeSheet(); fokusZeitEinbuchen(); S.fokus=null;
fokusStarten('cS');
ok('§1 Counter: Start = +1', cS.ticksHeute===1);
fokusZeitEinbuchen(); cS.durchgang.pauseTs=vorMin(2); fokusStarten('cS');
ok('§1 Counter: Neustart nach 2 Min → kein zweites +1', cS.ticksHeute===1);
fokusZeitEinbuchen(); S.fokus=null;
var aufg=neueKarte({id:'aZ', domain:'privat', titel:'Aufgabe mit Zeit', sollMin:30, matrixFeld:'werkzeug', faelligkeit:H()}); S.karten.push(aufg);
fokusStarten('aZ');
ok('§1 normale Karten (keine Abhak-Karte) buchen beim Start nichts', startBonusHeute(aufg)===0 && !aufg.durchgang);
fokusZeitEinbuchen(); S.fokus=null;
ok('§1 das Häkchen in der Abhak-Leiste bleibt wie in v2.8 (ohne Start: Wert + Bonus)', (function(){
   var k=neueKarte({id:'hk', domain:'privat', titel:'Nur Haken', rhythmus:{typ:'taeglich'}, matrixFeld:'werkzeug', faelligkeit:H()}); S.karten.push(k);
   var v=Math.round(kartePunkte(k)); leisteAbhaken('hk'); return k.punkteOverride===v+25; })());
ok('§1 Einstellung neben der Abhakbonus-Tabelle', (function(){ renderEinst(); return /data-setting="durchgangPauseMin"/.test(el('einstBody').innerHTML); })());

kopf('v2.8.2 §2 · Wiederholung übernimmt auch Abhak-Eigenschaften');
frisch();
S.karten=[ neueKarte({id:'vA', domain:'privat', titel:'Morgenroutine', rhythmus:{typ:'taeglich'}, matrixFeld:'werkzeug', nurAbhaken:true, abhakbonus:80, ticksAktiv:true, tickWert:12}),
           neueKarte({id:'vB', domain:'privat', titel:'Ohne Eigenes', matrixFeld:'ziel', sollMin:20}) ];
oeffneDetail(null); entwurf.titel='Morgenroutine'; wdhUebernehmen('vA');
ok('§2 „Nur abhaken", eigener Abhakbonus und Tickwert werden vorbelegt', entwurf.nurAbhaken===true && entwurf.abhakbonus===80 && entwurf.tickWert===12 &&
   /eigener Abhakbonus 80/.test(el('sheetBody').innerHTML));
closeSheet();
oeffneDetail(null); entwurf.titel='Ohne Eigenes'; entwurf.abhakbonus=33; wdhUebernehmen('vB');
ok('§2 ohne eigenen Wert an der Vorlage bleibt das Feld leer (= Tabelle)', entwurf.nurAbhaken===null && entwurf.abhakbonus===null && entwurf.tickWert===null);
closeSheet();

/* ══════════════════════════════════════════════════════════════════════
   v2.9.0 „Pflicht-Karten" — Abnahme 1–7 (Klick/Ziehen per Harness)
   ══════════════════════════════════════════════════════════════════════ */
kopf('v2.9.0 §1–§2 · Pflicht: Zahlenbeleg „Toilette"');
frisch();
var TOI={ domain:'privat', titel:'Toilette', rhythmus:{typ:'taeglich'}, matrixFeld:'werkzeug', faelligkeit:H(), pflicht:true, pflichtWert:50, pflichtDeckel:30, pflichtAbzug:10, pflichtMin:-20 };
function toi(id){ var k=neueKarte(Object.assign({id:id}, TOI)); S.karten.push(k); return k; }
function laufen(k, min){ fokusStarten(k.id); S.fokus.startMs=Date.now()-min*60000; fokusZeitEinbuchen(); S.fokus=null; }
var tH=toi('tH'); leisteAbhaken('tH');
var zeilen=['Haken ohne Uhr → '+tH.punkteOverride];
var t12=toi('t12'); laufen(t12,12);  zeilen.push('Uhr 12 Min → '+pflichtHeuteP(t12));
var t31=toi('t31'); laufen(t31,31);  zeilen.push('31 Min → '+pflichtHeuteP(t31));
var t52=toi('t52'); laufen(t52,52);  zeilen.push('52 Min → '+pflichtHeuteP(t52));
var t95=toi('t95'); laufen(t95,95);  zeilen.push('95 Min → '+pflichtHeuteP(t95));
var t2=toi('t2'); laufen(t2,5); t2.durchgang.pauseTs=new Date(Date.now()-10*60000).toISOString(); laufen(t2,5);
zeilen.push('zwei Durchgänge (10 Min Abstand) → '+pflichtHeuteP(t2)+' ('+t2.pflichtHeute.n+'×)');
var t3=toi('t3'); laufen(t3,20); t3.durchgang.pauseTs=new Date(Date.now()-3*60000).toISOString(); laufen(t3,20);
zeilen.push('Neustart nach 3 Min, 20+20 Min → '+pflichtHeuteP(t3)+' ('+t3.pflichtHeute.n+' Durchgang)');
print('   Toilette (Wert 50 · Deckel 30 · Abzug 10 · Untergrenze −20): '+zeilen.join(' · '));
ok('§2 Haken → 50', tH.punkteOverride===50 && tH.status==='erledigt');
ok('§2 Uhr 12 Min → 50', pflichtHeuteP(t12)===50);
ok('§2 31 Min → 40', pflichtHeuteP(t31)===40);
ok('§2 52 Min → 20', pflichtHeuteP(t52)===20);
ok('§2 95 Min → −20 (Untergrenze, darf negativ sein)', pflichtHeuteP(t95)===-20);
ok('§2 zwei Durchgänge mit 10 Min Abstand → 100', pflichtHeuteP(t2)===100 && t2.pflichtHeute.n===2);
ok('§2 Neustart nach 3 Min → derselbe Durchgang (20+20 = 40 Min → 40)', pflichtHeuteP(t3)===40 && t3.pflichtHeute.n===1);
ok('§2 ein negativer Ertrag senkt die Tagespunkte (kein Abschneiden bei 0)', Math.round(kartePunkteHeute(t95))===-20);
var vorE=pflichtHeuteP(t52); leisteAbhaken('t52');
ok('§2 Erledigen nach dem Durchgang: kein zweiter Wert, kein Abhakbonus (52 Min → bleibt 20)', t52.punkteOverride===vorE);
kopf('v2.9.0 §2 · keine Zeitpunkte, kein Abhakbonus, Matrix unverändert');
frisch();
var pz=neueKarte({id:'pz', domain:'privat', titel:'Essen machen', rhythmus:{typ:'taeglich'}, matrixFeld:'werkzeug', sollMin:30, faelligkeit:H(), pflicht:true, pflichtWert:60, pflichtDeckel:40, pflichtAbzug:10, pflichtMin:0});
var ohneP=neueKarte({id:'op', domain:'privat', titel:'Essen machen (ohne Pflicht)', rhythmus:{typ:'taeglich'}, matrixFeld:'werkzeug', sollMin:30, faelligkeit:H()});
S.karten=[pz, ohneP];
laufen(pz,35); laufen(ohneP,35);
print('   „Essen machen" 35 Min: Pflicht '+fmtP(kartePunkte(pz))+' P · ohne Pflicht wären es '+fmtP(kartePunkte(ohneP))+' P + Abhakbonus '+abhakbonusDefault(ohneP));
ok('§2 Pflicht-Karte MIT Soll-Minuten bucht ebenfalls je Durchgang (Entscheidung Pascal)', pflichtHeuteP(pz)===60);
ok('§2 keine Zeitpunkte, kein Abhakbonus, keine Dämpfung zusätzlich', kartePunkte(pz)===60 && abhakbonusDefault(pz)===0);
ok('§2 das Matrixfeld bleibt und zählt in der Matrix wie bisher', matrixFeldVon(pz)==='werkzeug' && matrixFaktor(pz)===matrixFaktor(ohneP));
var cz=neueKarte({id:'cz', domain:'privat', titel:'Wasser', ticksAktiv:true, tickWert:15, matrixFeld:'werkzeug', faelligkeit:H(), pflicht:true, pflichtWert:20, pflichtDeckel:5, pflichtAbzug:5, pflichtMin:0});
S.karten.push(cz); karteTick('cz'); karteTick('cz');
ok('§2 Counter: jedes +1 = der Wert (Entscheidung Pascal): 2 × 20', pflichtHeuteP(cz)===40 && cz.ticksHeute===2 && kartePunkte(cz)===40);
var twp=tempoWerte(neueKarte(Object.assign({}, TOI)));
ok('§2 Tempo: die Karte bringt Wert ÷ Deckel-Stunden (50 ÷ 0,5 = 100), Marke mit Zusatz „Pflicht"', Math.abs(twp.karte.prognose-100)<1e-9 && /Pflicht 100/.test(tempoLeisteHtml(twp)));
ok('§2 Prognose = gebucht + Wert eines weiteren Durchgangs', kartePunktePrognose(neueKarte(Object.assign({}, TOI)))===50);
S.meta.pflichtAb=H();
ok('§2 ab dem Update: eine nachgetragene Sitzung davor rechnet wie bisher', sitzungPunkteFuer(pz,35,anVorTage(H(),2))>0 && sitzungPunkteFuer(pz,35,anVorTage(H(),2))!==60 && sitzungPunkteFuer(pz,35,H())===60);

kopf('v2.9.0 §3 · Punktekurve im Detail');
frisch();
var kd=neueKarte({id:'kd', domain:'privat', titel:'Toilette', rhythmus:{typ:'taeglich'}, matrixFeld:'werkzeug', faelligkeit:H()});
S.karten=[kd];
S.intraday=[{id:'a1',ts:jetztIso(),kartenId:'kd',minuten:8,typ:'timer'},{id:'a2',ts:jetztIso(),kartenId:'kd',minuten:12,typ:'timer'},
            {id:'a3',ts:jetztIso(),kartenId:'kd',minuten:14,typ:'timer'},{id:'a4',ts:jetztIso(),kartenId:'kd',minuten:45,typ:'timer'}];
oeffneDetail('kd');
ok('§1 Schalter „Pflicht" im Detail, direkt unter dem Matrixfeld (aus: keine Kurve)', /data-chip="pflicht" data-val="ja"/.test(el('sheetBody').innerHTML) &&
   el('sheetBody').innerHTML.indexOf('id="pflichtBlock"')>el('sheetBody').innerHTML.indexOf('Matrixfeld') && el('sheetBody').innerHTML.indexOf('pf-svg')<0);
entwurf.pflicht=true; entwurf.pflichtWert=50; entwurf.pflichtDeckel=30; entwurf.pflichtAbzug=10; entwurf.pflichtMin=-20;
var blk=pflichtBlockHtml(entwurf);
ok('§3 Kurve mit drei Griffen (Knick · Stufe · Untergrenze) und vier Plus/Minus-Zeilen', /data-pgriff="knick"/.test(blk) && /data-pgriff="stufe"/.test(blk) && /data-pgriff="min"/.test(blk) &&
   (blk.match(/data-pfplus="/g)||[]).length===8 && /r="22" fill="transparent"/.test(blk));
ok('§3 Kurve in der Farbe des Matrixfelds (Werkzeug)', blk.indexOf('stroke="'+MX_FARBE.werkzeug[0]+'"')>=0);
ok('§3 echte Dauern als Punkte (4), über dem Deckel in der Abzugsfarbe (1)', (blk.match(/class="pf-dauer"/g)||[]).length===4 && (blk.match(/class="pf-dauer"[^>]*fill="#f87171"/g)||[]).length===1);
var lz=pflichtLiveZeile(entwurf);
print('   Live-Zeile: '+lz);
ok('§3 Live-Zeile rechnet: typisch 14 Min → 50 · 1 von 4 über dem Deckel · längstes Mal 45 Min → 30 (2 angefangene 10er)', lz==='Typisch 14 Min → 50 P · 1 von 4 Mal über dem Deckel · längstes Mal (45 Min) → 30 P');
var pts=pflichtStufen(pflichtWerte(entwurf));
ok('§3 Stufenform: waagerecht bis 30′, dann je 10′ −10 bis −20', JSON.stringify(pts.slice(0,4))===JSON.stringify([{m:0,p:50},{m:30,p:50},{m:30,p:40},{m:40,p:40}]) && pts[pts.length-1].p===-20 && pts[pts.length-1].m===120);
pflichtSetzen(entwurf,'wert',57); pflichtSetzen(entwurf,'deckel',150); pflichtSetzen(entwurf,'min',80);
ok('§3 5er-Schritte und Grenzen (Wert 57 → 55 · Deckel ≤ 120 · Untergrenze ≤ Wert)', entwurf.pflichtWert===55 && entwurf.pflichtDeckel===120 && entwurf.pflichtMin===55);
ok('§3 Plus/Minus und Ziehen schreiben dieselben Werte (ein Setter, ein Neuzeichnen)', /pflichtSetzen\(entwurf, f,/.test(src) && /pflichtSetzen\(entwurf,'wert',pkt\)/.test(src) && /pflichtNeuZeichnen\(true\)/.test(src));
closeSheet();
kd.pflichtWert=null; oeffneDetail('kd'); entwurf.pflicht=true; pflichtInit(entwurf);
ok('§1 Einschalten belegt je Karte vor, kein globaler Standard (Deckel = typische Dauer 14 → 15)', entwurf.pflichtWert>=5 && entwurf.pflichtDeckel===15 && entwurf.pflichtAbzug===10 && entwurf.pflichtMin===0);
closeSheet();

kopf('v2.9.0 §4 · Vorschlag von Claude als Zweitkurve');
frisch();
S.karten=[neueKarte({id:'vs1', domain:'privat', titel:'Katzen füttern', rhythmus:{typ:'taeglich'}, matrixFeld:'werkzeug', faelligkeit:H()})];
syncImport(JSON.stringify({appVersion:'2.9.0', karten:[{id:'vs1', pflichtVorschlag:{wert:40, deckel:15, abzug:10, min:-10, grund:'bisher ~170 P am Tag für zweimal füttern'}}]}));
var kv=S.karten[0];
oeffneDetail('vs1');
ok('§4 der Vorschlag erscheint grau gestrichelt mit Grund und zwei Knöpfen', /class="pf-vorschlag"/.test(el('sheetBody').innerHTML) && /stroke-dasharray="5 4" class="pf-vorschlag"/.test(el('sheetBody').innerHTML) &&
   /bisher ~170 P/.test(el('sheetBody').innerHTML) && /data-pfvorschlag="uebernehmen"/.test(el('sheetBody').innerHTML) && /data-pfvorschlag="verwerfen"/.test(el('sheetBody').innerHTML));
ok('§4 Export meldet den Vorschlag mit Status „offen"', syncExport('voll').karten[0].pflichtVorschlag.status==='offen');
entwurf.pflichtVorschlag.status='uebernommen'; entwurf.pflicht=true; entwurf.pflichtWert=40; entwurf.pflichtDeckel=15; entwurf.pflichtAbzug=10; entwurf.pflichtMin=-10;
entwurf.titel='Katzen füttern'; detailSpeichern();
kv=S.karten.filter(function(k){ return k.id==='vs1'; })[0];
ok('§4 „Übernehmen" setzt die vier Werte, danach verschwindet der Vorschlag aus der Kurve', kv.pflicht===true && kv.pflichtWert===40 && kv.pflichtMin===-10 && !pflichtVorschlagOffen(kv) && pflichtBlockHtml(kv).indexOf('pf-vorschlag')<0);
ok('§4 der Knopf-Handler setzt Werte + Status', /v\.status='uebernommen'/.test(src) && /else v\.status='verworfen'/.test(src));
var exV=syncExport('voll').karten.filter(function(k){ return k.id==='vs1'; })[0];
print('   Export: '+JSON.stringify({pflicht:exV.pflicht, pflichtWert:exV.pflichtWert, pflichtDeckel:exV.pflichtDeckel, pflichtAbzug:exV.pflichtAbzug, pflichtMin:exV.pflichtMin, pflichtVorschlag:exV.pflichtVorschlag}));
ok('§4 Export meldet „uebernommen" bis zum bestätigten Sync', exV.pflichtVorschlag.status==='uebernommen');
syncBestaetigen();
ok('§4 … danach ist er weg', S.karten.filter(function(k){ return k.id==='vs1'; })[0].pflichtVorschlag===null);
syncImport(JSON.stringify({appVersion:'2.9.0', karten:[{id:'vs1', pflichtVorschlag:{wert:30, deckel:10, abzug:5, min:0, grund:'zweiter Versuch'}}]}));
kv=S.karten.filter(function(k){ return k.id==='vs1'; })[0]; kv.pflichtVorschlag.status='verworfen';
ok('§4 „Verwerfen": Werte bleiben, Vorschlag weg, Export meldet „verworfen"', kv.pflichtWert===40 && !pflichtVorschlagOffen(kv) && syncExport('voll').karten.filter(function(k){ return k.id==='vs1'; })[0].pflichtVorschlag.status==='verworfen');

kopf('v2.9.0 §5–§6 · Einstellungen, Import/Export, Wiederholung');
renderEinst();
var eh=el('einstBody').innerHTML;
ok('§5 Liste „Pflicht-Karten" mit Mini-Kurve, vier Werten und Tipp zur Karte', /Pflicht-Karten · 1/.test(eh) && /pf-svg mini/.test(eh) && /data-pflichtoeffnen="vs1"/.test(eh) && /40 P · Deckel 15′ · −10 je 10′ · min -10/.test(eh));
syncImport(JSON.stringify({appVersion:'2.9.0', karten:[{id:'vs1', pflichtVorschlag:{wert:35, deckel:15, abzug:10, min:-10, grund:'dritter'}}]}));
renderEinst();
ok('§5 Karten mit offenem Vorschlag sind markiert', /Vorschlag offen/.test(el('einstBody').innerHTML));
syncImport(JSON.stringify({appVersion:'2.9.0', karten:[{id:'vs1', pflicht:false}]}));
kv=S.karten.filter(function(k){ return k.id==='vs1'; })[0];
ok('§6 pflicht:false schaltet ab, die Werte bleiben gespeichert', kv.pflicht===false && kv.pflichtWert===40 && kv.pflichtDeckel===15);
syncImport(JSON.stringify({appVersion:'2.9.0', karten:[{id:'vs1', titel:'Katzen füttern (umbenannt)'}]}));
ok('§6 Feld fehlt = unverändert', kv.pflicht===false && kv.pflichtWert===40 && kv.titel==='Katzen füttern (umbenannt)');
syncImport(JSON.stringify({appVersion:'2.9.0', karten:[{id:'vs1', pflicht:true, pflichtWert:45}]}));
ok('§6 Import setzt Pflicht und einzelne Werte', kv.pflicht===true && kv.pflichtWert===45 && kv.pflichtDeckel===15);
oeffneDetail(null); entwurf.titel='Katzen füttern (umbenannt)'; wdhUebernehmen('vs1');
ok('§6 „↻ Von … übernehmen" übernimmt Pflicht mit allen Werten', entwurf.pflicht===true && entwurf.pflichtWert===45 && entwurf.pflichtDeckel===15 && entwurf.pflichtAbzug===10 && entwurf.pflichtMin===-10);
closeSheet();

print('');
print(fails? (fails+' von '+n+' FEHLGESCHLAGEN') : ('alle '+n+' Abnahmepunkte gruen'));
if(fails) throw 'Abnahme rot';
