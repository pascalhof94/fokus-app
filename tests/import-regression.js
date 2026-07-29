/* Dev-only Regressionstest fuer den v0.38-Import/Konverter in neu.html.
   NICHT Teil der PWA (wird von der App nicht geladen, steht nicht in sw.js).
   Ausfuehren aus dem Repo-Verzeichnis mit JavaScriptCore:
     "/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc" tests/import-regression.js
   Extrahiert die echten Funktionen aus neu.html (kein Nachbau) und prueft sie
   isoliert (gestubbtes S/localStorage) — ruehrt keine echten Daten an.

   Deckt ab: Konverter-Bug „offen -> erledigt/heute" (Karte f440ff25,
   „Probefahrt Schwalbe vereinbaren"). */

var src = readFile('neu.html');
function extract(name){
  var m = new RegExp('\\nfunction ' + name + '\\s*\\(').exec(src);
  if(!m) throw 'Funktion nicht gefunden: ' + name;
  var p = src.indexOf('(', m.index + m[0].length - 1), d = 0, k = p;
  for(; k < src.length; k++){ var c = src[k]; if(c === '(') d++; else if(c === ')'){ d--; if(d === 0) break; } }
  var b = src.indexOf('{', k), depth = 0, j = b;
  for(; j < src.length; j++){ var c2 = src[j]; if(c2 === '{') depth++; else if(c2 === '}'){ depth--; if(depth === 0) return src.substring(m.index + 1, j + 1); } }
  throw 'Kein Funktionsende: ' + name;
}
var NAMES = ['num','uuid','heuteIso','jetztIso','heuteApp','neueKarte','neueUnteraufgabe',
  'altGeldScore','altRhythmusApprox','altRhythmus','altTickKurve','mapAltKarte','importItems'];
// Stubs fuer die Laufzeit-Abhaengigkeiten (keine echten Daten)
var crypto = {};
var S = { karten: [], unteraufgaben: [], tag: null, meta: { wohlstand: 0 }, settings: {} };
eval(NAMES.map(extract).join('\n'));

var fails = 0;
function ok(name, cond){ print((cond ? 'OK   ' : 'FAIL ') + name); if(!cond) fails++; }
var HEUTE = heuteApp();

/* 1) Die real betroffene Karte: offen, ueberfaellig, tageGeschoben, Teil-Unteraufgaben. */
var probefahrt = { id:'f440ff25-0764-418b-977c-718e42256140', domain:'privat', typ:'aufgabe',
  titel:'Probefahrt Schwalbe vereinbaren', status:'offen', istMinuten:0, deadline:'2026-07-21',
  tageGeschoben:2, streamSlot:null,
  unteraufgaben:[{id:'s1',titel:'A',erledigt:true},{id:'s2',titel:'B',erledigt:false}] };
S.karten = []; S.unteraufgaben = [];
importItems([JSON.parse(JSON.stringify(probefahrt))], { mitErledigte:true, datum:'2026-07-29' });
var k = S.karten[0];
ok('offene Karte bleibt offen', k.status === 'offen');
ok('offene Karte bekommt KEIN tagId', k.tagId === null);
ok('Faelligkeit = ueberfaellige Deadline', k.faelligkeit === '2026-07-21');
ok('Unteraufgaben per id, done erhalten',
   S.unteraufgaben.length === 2 &&
   S.unteraufgaben.filter(function(u){return u.id==='s1';})[0].done === true &&
   S.unteraufgaben.filter(function(u){return u.id==='s2';})[0].done === false);

/* 2) Erledigt-Import darf NICHT auf den Import-/Export-Tag umdatiert werden. */
S.karten = []; S.unteraufgaben = [];
importItems([{ id:'done-1', domain:'dfm', typ:'aufgabe', titel:'Alt-erledigt', status:'erledigt', istMinuten:20 }],
            { mitErledigte:true, datum:'2026-07-29' });
ok('erledigte Aufgabe ohne zuletztErledigt -> tagId null (nicht heute)',
   S.karten[0].status === 'erledigt' && S.karten[0].tagId === null && S.karten[0].tagId !== HEUTE);

S.karten = []; S.unteraufgaben = [];
importItems([{ id:'done-2', domain:'privat', typ:'routine', titel:'Alt-Routine', status:'erledigt',
              zuletztErledigt:'2026-07-20', rhythmusTage:1, routineStreak:4 }],
            { mitErledigte:true, datum:'2026-07-29' });
ok('erledigte Routine -> tagId = echter zuletztErledigt-Tag', S.karten[0].tagId === '2026-07-20');
ok('Routine-Streak erhalten', S.karten[0].streak === 4);

/* 3) §10-Migration (mitErledigte:false) ueberspringt erledigte Einmal-Aufgaben. */
S.karten = []; S.unteraufgaben = [];
var r = importItems([{ id:'done-3', domain:'dfm', typ:'aufgabe', titel:'Erledigt einmal', status:'erledigt' }],
                    { mitErledigte:false });
ok('§10: erledigte Aufgabe wird uebersprungen', S.karten.length === 0 && r.neu === 0);

print('');
if(fails){ print(fails + ' FEHLGESCHLAGEN'); throw 'Regression fehlgeschlagen'; }
print('alle Regressionstests gruen');
