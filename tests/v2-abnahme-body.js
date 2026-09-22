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
  ok('N1 BELEG: zaeher Tag wird NICHT entwertet — Ist 90 > Prognose 60',
     ist>prog);
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
     return abhakbonusDefault(kurz)===100; })());
ok('N2 Ein Kartenwert bleibt Override und schlaegt den Feld-Default',
   abhakbonusDefault(neueKarte({matrixFeld:'zustand', abhakbonus:5}))===5);
ok('N2 Override 0 heisst ausdruecklich „kein Bonus"',
   abhakbonusDefault(neueKarte({matrixFeld:'zustand', abhakbonus:0}))===0);
ok('N2 Die Defaults sind Settings, keine Konstanten', (function(){
     S.settings.abhakbonusFeld.werkzeug=222;
     var r=abhakbonusDefault(neueKarte({matrixFeld:'werkzeug'}))===222;
     S.settings.abhakbonusFeld.werkzeug=100; return r; })());
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
ok('10 Deadline und „Geplant fuer" sind getrennte Felder', (function(){
     var k=neueKarte({faelligkeit:'2026-10-01', geplantFuer:'2026-09-20'});
     return k.faelligkeit!==k.geplantFuer; })());
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
ok('13 Die Navigationsleiste traegt genau zwei Knoepfe',
   (src.match(/<nav id="nav">[\s\S]*?<\/nav>/)||[''])[0].split('data-tab=').length-1===2);
S.karten=[ neueKarte({id:'o', domain:'dfm', titel:'Offen', geplantFuer:H()}),
           neueKarte({id:'e', domain:'dfm', titel:'Erledigtes Ding', status:'erledigt'}) ];
baueSuchIndex();
/* sucheTreffer liefert {k,sc}-Paare — genau die Auspack-Falle, ueber die
   die Suchseite zuerst gestolpert ist. */
ok('14 Freitext findet auch ERLEDIGTES',
   sucheTreffer('Erledigtes').some(function(o){ return o.k && o.k.id==='e'; }));
ok('14 ... und die Suchseite packt die Karte richtig aus (kein [object Object])',
   (function(){ S.ui.suFrage='Erledigtes';
     var h=suFreitextHtml('Erledigtes');
     return h.indexOf('Erledigtes Ding')>=0 && h.indexOf('[object')<0; })());
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
ok('26 Vertrag 2.0: appVersion 2.0.x', /^2\.0\./.test(ex.appVersion) && /^2\.0\./.test(VERSION));
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
     var k=neueKarte({domain:'privat', ticksAktiv:true, tickWert:8, ticksHeute:2});
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
ok('31 APP_VERSION 2.0.2 · Build gesetzt', VERSION==='2.0.2' && UI_VERSION==='v2.0.2' &&
   APP_BUILD==='2026-09-22-1');


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
ok('§2 BELEG: der Matrix-Dialog kam fuer die VERLASSENE Karte',
   !!matrixTmp && matrixTmp.kid==='A' && matrixTmp.anlass==='wechsel');
ok('§2 Die Ansicht zeigt jetzt die neue Karte', fokusAnsichtOffen()===true);
/* Dialog beantworten → Bewegungsbonus landet auf A, nicht auf B */
matrixTmp.x=0.5; matrixTmp.y=0; matrixDialogSpeichern();
ok('§2 Der Bewegungsbonus wurde der VERLASSENEN Karte gutgeschrieben',
   num(S.karten.find(function(k){return k.id==='A';}).bewegungsBonus)>0 &&
   num(S.karten.find(function(k){return k.id==='B';}).bewegungsBonus)===0);

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
  ok('§4 Die alte erbt Projekt/Geld aus der neuen', post.projekt==='Vertrieb' && num(post.geldScore)===50);
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

print('');
print(fails? (fails+' von '+n+' FEHLGESCHLAGEN') : ('alle '+n+' Abnahmepunkte gruen'));
if(fails) throw 'Abnahme rot';
