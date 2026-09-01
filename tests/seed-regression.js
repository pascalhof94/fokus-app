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
var TAGESABSCHNITTE = ['morgens','tagsueber','abends'];
var SYNC_BESTAND_SCHWELLE = 10;
var KOMPLETT_BONUS_DEFAULT = 200;
function esc(s){ return String(s==null?'':s); }
function saveKarten(){} function saveRoutGruppen(){} function ketteSetzen(){}
var DB = { get:function(k,f){ return f; }, set:function(){}, del:function(){}, list:function(){ return []; } };
var NAMES = ['num','uuid','heuteIso','jetztIso','heuteApp','neueKarte','neueUnteraufgabe','settingsMerge','syncImport'];
eval(NAMES.map(extract).join('\n'));

var fails=0; function ok(n,c){ print((c?'OK   ':'FAIL ')+n); if(!c) fails++; }
function imp(p){ return syncImport(JSON.stringify(p)); }

/* 1) §2.1: Neuanlage mit domain — privat wird privat, fehlend bleibt dfm. */
S.karten=[]; S.unteraufgaben=[]; S.routinenGruppen=[];
var r1=imp({ appVersion:'1.12.0', karten:[
  { id:'n-dfm', titel:'DFM-Aufgabe', sollMin:30 },
  { id:'n-prv', domain:'privat', titel:'Private Routine', rhythmus:{typ:'taeglich'}, tickKurve:[10],
    tagesabschnitt:['morgens','abends'], abhakbonus:-25, punkteProStd:0, timerFlag:true, keineAutoPause:true },
  { id:'n-cnt', domain:'privat', titel:'Negativ-Counter', tickKurve:[-15,-20] }
]});
var dfm=S.karten[0], prv=S.karten[1], cnt=S.karten[2];
ok('Neuanlage ohne domain → dfm', dfm.domain==='dfm');
ok('Neuanlage domain privat → privat', prv.domain==='privat');
ok('Ergebnis zählt je Domäne (1 dfm / 2 privat)', r1.neuDfm===1 && r1.neuPrivat===2);
/* 2) §2.2: Bausteine kommen an — Routine, Abschnitte, negativer Bonus, Overrides. */
ok('rhythmus macht die Karte zur Routine', prv.rhythmus && prv.rhythmus.typ==='taeglich');
ok('tagesabschnitt als Array übernommen', JSON.stringify(prv.tagesabschnitt)==='["morgens","abends"]');
ok('abhakbonus negativ zulässig', prv.abhakbonus===-25);
ok('punkteProStd 0 kommt an (nicht als fehlend gewertet)', prv.punkteProStd===0);
ok('timerFlag + keineAutoPause gesetzt', prv.timerFlag===true && prv.keineAutoPause===true);
/* §9.5 (v1.8.0): eine alte tickKurve im Paket wird aufs neue Modell umgesetzt —
   ticksAktiv + tickWert (erster Wert), negative Werte zulässig. */
ok('Negativ-Counter: tickKurve → ticksAktiv + tickWert(-15)', cnt.ticksAktiv===true && cnt.tickWert===-15);
/* 3) Fehlende Felder ändern nichts (Re-Import derselben Karte ohne Bausteine). */
imp({ appVersion:'1.12.0', karten:[{ id:'n-prv', titel:'Private Routine v2' }] });
ok('Re-Import: nur 1 Karte (kein Duplikat)', S.karten.filter(function(k){return k.id==='n-prv';}).length===1);
ok('Re-Import: rhythmus unangetastet', prv.rhythmus && prv.rhythmus.typ==='taeglich');
ok('Re-Import: abhakbonus unangetastet', prv.abhakbonus===-25);
/* 4) §2.1: domain einer BEKANNTEN Karte wird ignoriert. */
imp({ appVersion:'1.12.0', karten:[{ id:'n-dfm', domain:'privat', titel:'DFM bleibt DFM' }] });
ok('bekannte Karte: domain-Wechsel ignoriert', dfm.domain==='dfm');
/* 5) §2.3: Gruppen — Auflösung per Titel UND App-ID, Unauflösbares gemeldet. */
var r5=imp({ appVersion:'1.12.0', karten:[{ id:'n-prv' }],
  gruppen:[{ id:'g1', name:'Runde', domain:'privat', mitglieder:['Private Routine v2','n-cnt','Fehlt'], komplettBonus:150 }] });
ok('Gruppe angelegt', r5.gruppenNeu===1 && S.routinenGruppen.length===1);
ok('Mitglieder per Titel + ID aufgelöst', JSON.stringify(S.routinenGruppen[0].mitglieder)==='["n-prv","n-cnt"]');
ok('Unauflösbares Mitglied gemeldet, nicht verschluckt',
  r5.uebersprungen.some(function(u){ return u.was.indexOf('Fehlt')>=0; }));
var r5b=imp({ appVersion:'1.12.0', karten:[{ id:'n-prv' }],
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
