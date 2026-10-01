/* jsc-Test: Seeding über den LEBENDEN Sync-Import (§2 v1.7.1) +
   Levelschwellen-Migration. Der v0.38-Konverter (mapAltKarte/importItems) ist
   seit v1.7.1 entfernt — der Sync-Import ist jetzt der einzige und getestete
   Weg, Karten (auch private, samt Routinen-Bausteinen und Gruppen) anzulegen.
   Extrahiert die echten Funktionen aus neu.html. */
var src = readFile('neu.html');
function extract(name){
  var m = new RegExp('\\nfunction ' + name + '\\s*\\(').exec(src);
  if(!m) throw 'Funktion nicht gefunden: ' + name;
  var p = src.indexOf('(', m.index + m[0].length - 1), d = 0, k = p;
  for(; k < src.length; k++){ var c = src[k]; if(c==='(') d++; else if(c===')'){ d--; if(d===0) break; } }
  var b = src.indexOf('{', k), depth = 0, j = b;
  for(; j < src.length; j++){ var c2 = src[j]; if(c2==='{') depth++; else if(c2==='}'){ depth--; if(depth===0) return src.substring(m.index+1, j+1); } }
  throw 'kein Ende: ' + name;
}
function extractConst(name){
  var m = new RegExp('\\nconst ' + name + '\\s*=\\s*\\{').exec(src);
  if(!m) throw 'const nicht gefunden: ' + name;
  var b = src.indexOf('{', m.index), depth=0, j=b;
  for(; j<src.length; j++){ var c=src[j]; if(c==='{') depth++; else if(c==='}'){ depth--; if(depth===0) return src.substring(m.index+1, j+1); } }
  throw 'kein Ende const: ' + name;
}
var crypto = {};
var S = { karten: [], unteraufgaben: [], routinenGruppen: [], tag: null, meta: { wohlstand: 0 }, settings: {} };
eval(extractConst('DEFAULT_SETTINGS').replace(/^const/, 'var'));
/* Umfeld-Shims: Konstanten gespiegelt (nicht extrahierbar), Persistenz/Kette
   als No-ops — getestet wird die Import-LOGIK, nicht der Speicher. */
/* v2.0.0: Tagesabschnitte sind entfallen (§4); die Matrix hat ihre Rolle. */
var MATRIX_FELDER = ['ablenkung','zustand','werkzeug','ziel'];
function matrixFeldVon(k){ var f=k&&k.matrixFeld;
  if(MATRIX_FELDER.indexOf(f)>=0) return f;
  var n=Number(f); if(isFinite(n)&&n>=1&&n<=4) return MATRIX_FELDER[n-1];
  return 'ziel'; }
var SYNC_BESTAND_SCHWELLE = 10;
var KOMPLETT_BONUS_DEFAULT = 200;
function esc(s){ return String(s==null?'':s); }
function saveKarten(){} function saveRoutGruppen(){} function ketteSetzen(){}
function saveMeta(){} function saveHistorie(){}
/* v2.1.1: syncImport baut danach den Suchindex neu — hier ohne Belang. */
function baueSuchIndex(){}   // §5.6/§5.7 (v1.13.0)
function tagOffen(){ return false; }
function jetztStunde(){ return 13; }
function tagesKette(){ return []; }
var DB = { get:function(k,f){ return f; }, set:function(){}, del:function(){}, list:function(){ return []; } };
// v2.6.0 §5: Geld-Konstanten gespiegelt (nicht extrahierbar) — Geld-Impact 0 … 500, Stufen fuer Altpakete
var GELD_STUFE={ hoch:300, mittel:200, niedrig:100 }, GELD_MAX=500;
var NAMES = ['num','uuid','heuteIso','jetztIso','heuteApp','neueKarte','neueUnteraufgabe','settingsMerge','syncImport','geldImpactNorm','geldTageBis','geldImpactAusScore','geldBezugstag','geldImpactVon','geldScoreVon',
  'karteZurueckAufsGeraet','vomGeraetAblage','karteVomGeraet',
  // v3.0.0 §12: Bausteine des Routinen-Systems im Import
  'v3FelderUebernehmen','leer','wtNorm','eingabeVon',
  // v3.1.0 §4: Karten-Korrektur und Feldmeldung im Import
  'kartenKorrektur','felderMelden','kartenFelderBekannt','kurz','syncTuerVorschau','bereichVorschau','schemaPruefen','schemaWert','pfadLesen','pfadSchreiben','einstStandard',
  // v3.2.0: Ticker (Zaehler-Zeile als Datensatz) und EIN Status fuer alle Ansichten
  'tickerAlleSicherstellen','tickerSicherstellen','tickerVon','brauchtTicker','istTicker','tickQuelle','istAufgabeKarte'];
var _kartenFelder=null, UNTER_FELDER_BEKANNT=new Set(['id','parentId','titel','sollMin','done','bonusPunkte','airtableId','staffel','staffelDanach','tagesziel','tageslimit','entfernt','entferntTs','tickLog','tickProtokoll','punkteHeute','ziel','ticksHeute','typ','naechsterWert']);   // v3.1.0/v3.2.0: gespiegelt
var WT_KURZ={ mo:1, di:2, mi:3, do:4, fr:5, sa:6, so:7 };   // v3.0.0: Konstante gespiegelt (nicht extrahierbar)
var DATENVERTRAG='2.1.0';   // v3.0.1: Import-Gate-Konstante gespiegelt (nicht extrahierbar)
eval(NAMES.map(extract).join('\n'));

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


var fails=0; function ok(n,c){ print((c?'OK   ':'FAIL ')+n); if(!c) fails++; }
function imp(p){ return syncImport(JSON.stringify(p)); }

/* 1) §2.1: Neuanlage mit domain — privat wird privat, fehlend bleibt dfm. */
S.karten=[]; S.unteraufgaben=[]; S.routinenGruppen=[];
var r1=imp({ appVersion:'2.1.0', karten:[
  { id:'n-dfm', titel:'DFM-Aufgabe', sollMin:30 },
  { id:'n-prv', domain:'privat', titel:'Private Routine', rhythmus:{typ:'taeglich'}, tickKurve:[10],
    matrixFeld:'werkzeug', abhakbonus:-25, punkteProStd:0, timerFlag:true, keineAutoPause:true },
  { id:'n-cnt', domain:'privat', titel:'Negativ-Counter', tickKurve:[-15,-20] }
]});
var dfm=S.karten[0], prv=S.karten[1], cnt=S.karten[2];
ok('Neuanlage ohne domain → dfm (Altregel, über den Shim der Suite)', dfm.domain==='dfm');
/* v3.2.0 §4: ohne Shim wird eine unbekannte Karte ohne domain bzw. matrixFeld abgewiesen, ohne titel erst recht */
var r4=syncImportOhneShim(JSON.stringify({appVersion:'3.2.0', karten:[{ id:'n-ohne', titel:'Ohne Domäne', matrixFeld:'ziel' }, { id:'recOhneTitel0001', block:'morgen' }]}));
ok('v3.2 §4: unbekannte Karte ohne domain → abgewiesen mit Grund', !S.karten.some(function(k){ return k.id==='n-ohne'; }) && r4.uebersprungen.some(function(u){ return /Pflichtfeld fehlt: domain/.test(u.grund); }));
ok('v3.2 §4: unbekannte Karte ohne Titel → keine Hülle', !S.karten.some(function(k){ return k.id==='recOhneTitel0001'; }) && r4.uebersprungen.some(function(u){ return /unbekannte Karte ohne Titel \(id recOhneTitel0001\)/.test(u.grund); }));
ok('Neuanlage domain privat → privat', prv.domain==='privat');
ok('Ergebnis zählt je Domäne (1 dfm / 2 privat)', r1.neuDfm===1 && r1.neuPrivat===2);
/* 2) §2.2: Bausteine kommen an — Routine, Abschnitte, negativer Bonus, Overrides. */
ok('rhythmus macht die Karte zur Routine', prv.rhythmus && prv.rhythmus.typ==='taeglich');
ok('v2.0 §1: matrixFeld kommt aus dem Paket an', prv.matrixFeld==='werkzeug');
ok('abhakbonus negativ zulässig', prv.abhakbonus===-25);
ok('punkteProStd 0 kommt an (nicht als fehlend gewertet)', prv.punkteProStd===0);
ok('timerFlag + keineAutoPause gesetzt', prv.timerFlag===true && prv.keineAutoPause===true);
/* §9.5 (v1.8.0): eine alte tickKurve im Paket wird aufs neue Modell umgesetzt —
   ticksAktiv + tickWert (erster Wert), negative Werte zulässig. */
ok('Negativ-Counter: tickKurve → ticksAktiv + tickWert(-15)', cnt.ticksAktiv===true && cnt.tickWert===-15);
/* 3) Fehlende Felder ändern nichts (Re-Import derselben Karte ohne Bausteine). */
imp({ appVersion:'2.1.0', karten:[{ id:'n-prv', titel:'Private Routine v2' }] });
ok('Re-Import: nur 1 Karte (kein Duplikat)', S.karten.filter(function(k){return k.id==='n-prv';}).length===1);
ok('Re-Import: rhythmus unangetastet', prv.rhythmus && prv.rhythmus.typ==='taeglich');
ok('Re-Import: abhakbonus unangetastet', prv.abhakbonus===-25);
/* 4) v3.1.0 §4: die Domaene einer BEKANNTEN Karte ist per Paket schreibbar (vorher §2.1: ignoriert).
   Ein Wechsel nach privat raeumt Projekt und Geld-Impact. */
imp({ appVersion:'2.1.0', karten:[{ id:'n-dfm', domain:'privat', titel:'DFM wird privat' }] });
ok('bekannte Karte: domain-Wechsel wird übernommen (v3.1)', dfm.domain==='privat' && dfm.projekt===null && dfm.geldImpact===0);
imp({ appVersion:'2.1.0', karten:[{ id:'n-dfm', domain:'dfm' }] });
/* 5) §2.3: Gruppen — Auflösung per Titel UND App-ID, Unauflösbares gemeldet. */
var r5=imp({ appVersion:'2.1.0', karten:[{ id:'n-prv' }],
  gruppen:[{ id:'g1', name:'Runde', domain:'privat', mitglieder:['Private Routine v2','n-cnt','Fehlt'], komplettBonus:150 }] });
ok('Gruppe angelegt', r5.gruppenNeu===1 && S.routinenGruppen.length===1);
ok('Mitglieder per Titel + ID aufgelöst', JSON.stringify(S.routinenGruppen[0].mitglieder)==='["n-prv","n-cnt"]');
ok('Unauflösbares Mitglied gemeldet, nicht verschluckt',
  r5.uebersprungen.some(function(u){ return u.was.indexOf('Fehlt')>=0; }));
var r5b=imp({ appVersion:'2.1.0', karten:[{ id:'n-prv' }],
  gruppen:[{ id:'g1', name:'Runde v2', mitglieder:['n-prv'], komplettBonus:300 }] });
ok('gleiche Gruppen-id → aktualisiert, nicht dupliziert', r5b.gruppenUpd===1 && S.routinenGruppen.length===1 && S.routinenGruppen[0].komplettBonus===300);
/* 6) Gate unverändert: ohne appVersion / Array / 0.x abgelehnt. */
ok('Gate: ohne appVersion', !!imp({karten:[{id:'x',titel:'x'}]}).fehler);
ok('Gate: Array-Paket', !!syncImport(JSON.stringify([{titel:'x'}])).fehler);
ok('Gate: 0.x', !!imp({appVersion:'0.38',karten:[{id:'x',titel:'x'}]}).fehler);

/* 7) Levelschwellen-Migration (alt → ×15), Defaults, Fremd-Kurve unangetastet. */
var alt=[0,400,1200,2500,4500,7000,10000,14000,19000,25000,32000,40000];
var neu=[0,6000,18000,37500,67500,105000,150000,210000,285000,375000,480000,600000];
ok('Migration: alte Kurve → neue ×15', JSON.stringify(settingsMerge({levelSchwellen:alt}).levelSchwellen)===JSON.stringify(neu));
ok('Default (leer) = neue ×15-Kurve', JSON.stringify(settingsMerge({}).levelSchwellen)===JSON.stringify(neu));
var custom=[0,1,2,3,4,5,6,7,8,9,10,999];
ok('Fremd-Kurve bleibt unangetastet', JSON.stringify(settingsMerge({levelSchwellen:custom}).levelSchwellen)===JSON.stringify(custom));
ok('Migration idempotent (neue Kurve bleibt)', JSON.stringify(settingsMerge({levelSchwellen:neu}).levelSchwellen)===JSON.stringify(neu));

print('');
if(fails){ print(fails+' FEHLGESCHLAGEN'); throw 'rot'; }
print('alle Seed-/Migrations-Tests gruen');
