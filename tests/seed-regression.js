/* jsc-Test: Seed-Import (v1.0-Direktfelder additiv) + Levelschwellen-Migration.
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
var S = { karten: [], unteraufgaben: [], tag: null, meta: { wohlstand: 0 }, settings: {} };
eval(extractConst('DEFAULT_SETTINGS').replace(/^const/, 'var'));
var NAMES = ['num','uuid','heuteIso','jetztIso','heuteApp','neueKarte','neueUnteraufgabe',
  'altGeldScore','altRhythmusApprox','altRhythmus','altTickKurve','mapAltKarte','importItems','settingsMerge'];
eval(NAMES.map(extract).join('\n'));

/* v1.6.1 (§2): Feld `tageszeit` ist abgeschafft — die drei zugehoerigen
   Assertions entfielen. Die Eingabedaten tragen es bewusst weiter: der Import
   muss ein mitgeschicktes tageszeit still ignorieren. */
var fails=0; function ok(n,c){ print((c?'OK   ':'FAIL ')+n); if(!c) fails++; }

/* 1) Seed mit v1.0-Direktfeldern → alles übernommen (neue Karte). */
S.karten=[]; S.unteraufgaben=[];
importItems([{ id:'seed-1', domain:'privat', typ:'aufgabe', titel:'Zähne putzen',
  tickKurve:[2,4,6], rhythmus:{typ:'taeglich'}, uhrzeit:'22:00', tageszeit:'abends', geldScore:150 }],
  { mitErledigte:true });
var a=S.karten[0];
ok('tickKurve direkt übernommen', JSON.stringify(a.tickKurve)==='[2,4,6]');
ok('rhythmus direkt (v1.0-Format)', a.rhythmus && a.rhythmus.typ==='taeglich');
ok('uhrzeit direkt', a.uhrzeit==='22:00');
ok('geldScore direkt', a.geldScore===150);

/* 2) Ohne Direktfelder → Ableitung/Defaults unverändert (kein Bruch). */
S.karten=[]; S.unteraufgaben=[];
importItems([{ id:'seed-2', domain:'privat', typ:'aufgabe', titel:'Normal' }], { mitErledigte:true });
var b=S.karten[0];
ok('ohne tickKurve → Default [0]', JSON.stringify(b.tickKurve)==='[0]');
ok('ohne uhrzeit → null', b.uhrzeit===null);
ok('ohne rhythmus.typ → keine Routine (Aufgabe)', !b.rhythmus);

/* 3) Re-Import (Update-Zweig) übernimmt Direktfelder ebenfalls. */
importItems([{ id:'seed-2', domain:'privat', typ:'aufgabe', titel:'Normal',
  tickKurve:[1,1], uhrzeit:'13:00', tageszeit:'mittags', geldScore:80 }], { mitErledigte:true });
var b2=S.karten.filter(function(x){return x.herkunftId==='seed-2';})[0];
ok('Update: nur 1 Karte (idempotent)', S.karten.length===1);
ok('Update: tickKurve übernommen', JSON.stringify(b2.tickKurve)==='[1,1]');
ok('Update: uhrzeit übernommen', b2.uhrzeit==='13:00');
ok('Update: geldScore übernommen', b2.geldScore===80);

/* 4) Levelschwellen-Migration (alt → ×15), Defaults, Fremd-Kurve unangetastet. */
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
