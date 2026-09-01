/* Dev-only Regressionstest fuer den Sync-Import (syncImport) in neu.html.
   NICHT Teil der PWA (wird von der App nicht geladen, steht nicht in sw.js).
   Ausfuehren aus dem Repo-Verzeichnis mit JavaScriptCore:
     jsc tests/import-regression.js

   v1.7.1: Der v0.38-Konverter (mapAltKarte/importItems), den diese Suite
   urspruenglich prufte, ist entfernt. Die Suite schuetzt jetzt dieselben
   INVARIANTEN am lebenden Importpfad — insbesondere den historischen Bug
   „offen → erledigt/heute": der Import darf NIE Status, tagId, Ist-Zeit oder
   Punkte setzen (App-Hoheit, §8), und Unteraufgaben matchen nur per App-id. */

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
var NAMES = ['num','uuid','heuteIso','jetztIso','heuteApp','neueKarte','neueUnteraufgabe','syncImport'];
// Stubs fuer die Laufzeit-Abhaengigkeiten (keine echten Daten)
var crypto = {};
var S = { karten: [], unteraufgaben: [], routinenGruppen: [], tag: null, historie: [], meta: { wohlstand: 0 }, settings: {} };
var TAGESABSCHNITTE = ['morgens','tagsueber','abends'];
var SYNC_BESTAND_SCHWELLE = 10;
var KOMPLETT_BONUS_DEFAULT = 200;
function esc(s){ return String(s==null?'':s); }
function saveKarten(){} function saveRoutGruppen(){} function ketteSetzen(){}
function saveMeta(){} function saveHistorie(){}                       // §5.6/§5.7 (v1.13.0)
var _tagOffen=false;
function tagOffen(){ return _tagOffen; }
function jetztStunde(){ return 13; }
function tagesKette(){ return []; }
var DB = { get:function(k,f){ return f; }, set:function(){}, del:function(){}, list:function(){ return []; } };
eval(NAMES.map(extract).join('\n'));

var fails = 0;
function ok(name, cond){ print((cond ? 'OK   ' : 'FAIL ') + name); if(!cond) fails++; }
function imp(p){ return syncImport(JSON.stringify(p)); }

/* 1) App-Hoheit: der Import setzt NIE Status/tagId/Ist/Punkte — auch wenn das
      Paket sie mitschickt (historischer Konverter-Bug „offen → erledigt/heute"). */
S.karten=[]; S.unteraufgaben=[];
imp({ appVersion:'1.13.0', karten:[{ id:'k1', titel:'Probefahrt vereinbaren', faelligkeit:'2026-07-21',
  status:'erledigt', tagId:'2026-08-27-1', istMin:99, punkteIst:500,
  unteraufgaben:[{ id:'s1', titel:'A', sollMin:10 },{ id:'s2', titel:'B', sollMin:20 }] }] });
var k=S.karten[0];
ok('neue Karte startet offen (status ist App-Hoheit)', k.status==='offen');
ok('kein tagId aus dem Paket', k.tagId===null);
ok('keine Ist-Zeit aus dem Paket', num(k.istSek)===0);
ok('kein punkteOverride aus dem Paket', k.punkteOverride===null);
ok('Faelligkeit = ueberfaellige Deadline uebernommen', k.faelligkeit==='2026-07-21');

/* 2) Unteraufgaben: Match NUR per App-id; done ist App-Hoheit. */
S.unteraufgaben.forEach(function(u){ if(u.id==='s1') u.done=true; });
imp({ appVersion:'1.13.0', karten:[{ id:'k1',
  unteraufgaben:[{ id:'s1', titel:'A neu', sollMin:15, done:false },{ id:'s3', titel:'C', sollMin:5 }] }] });
var s1=S.unteraufgaben.filter(function(u){return u.id==='s1';})[0];
ok('Sub per id gematcht, Titel/Soll aktualisiert', s1.titel==='A neu' && s1.sollMin===15);
ok('done bleibt App-Hoheit (nicht ueberschrieben)', s1.done===true);
ok('neuer Sub angelegt, alter erhalten', S.unteraufgaben.length===3);
ok('kein Titel-Match: gleicher Titel woanders erzeugt KEINE Verknuepfung',
  S.unteraufgaben.filter(function(u){return u.parentId==='k1';}).length===3);

/* 3) No-delete: Archivierung ist der einzige Status-Einfluss des Imports. */
var r3=imp({ appVersion:'1.13.0', karten:[{ id:'k1', status:'archiviert' }] });
ok('archiviert wird uebernommen (No-delete: nie loeschen)', k.status==='archiviert' && r3.arch===1);
ok('Karte existiert weiter', S.karten.length===1);

/* 4) Idempotenz: derselbe Re-Import erzeugt keine Duplikate. */
imp({ appVersion:'1.13.0', karten:[{ id:'k1', titel:'Probefahrt vereinbaren' }] });
ok('Re-Import: weiterhin genau 1 Karte', S.karten.length===1);

/* 5) airtableId-Match als Zweitanker. */
S.karten=[]; S.unteraufgaben=[];
imp({ appVersion:'1.13.0', karten:[{ airtableId:'recX', titel:'Via Airtable' }] });
var vorher=S.karten.length;
imp({ appVersion:'1.13.0', karten:[{ airtableId:'recX', titel:'Via Airtable v2' }] });
ok('airtableId-Match: Update statt Duplikat', S.karten.length===vorher && S.karten[0].titel==='Via Airtable v2');

/* 6) §7 (v1.13.0): Gate — Vertrag-1.5-Pakete (1.12.x) werden abgelehnt. */
ok('Gate 1.13.0: 1.12.0-Paket abgelehnt', !!imp({ appVersion:'1.12.0', karten:[{id:'x',titel:'x'}] }).fehler);

/* 7) §5.7 (v1.13.0) ZAHLENBELEG 36: KEIN stilles Ueberschreiben — ein Paket
      OHNE Korrekturblock aendert an vergangenen Tagen NICHTS; ein Paket MIT
      Korrekturblock aendert nur die benannten Tage/Felder, mit Protokoll. */
S.historie=[ { datum:'2026-08-30', punkteBilanz:100, endeTs:'2026-08-30T22:00:00', akku:40, luecke:false },
             { datum:'2026-08-29', punkteBilanz:70,  endeTs:'2026-08-29T21:00:00', akku:55, luecke:false } ];
S.meta.syncKorrekturen=[];
imp({ appVersion:'1.13.0', karten:[{ id:'k1', titel:'Nur Karten, kein Korrekturblock' }] });
ok('BELEG 36a: ohne Korrekturblock bleibt punkteBilanz 100', S.historie[0].punkteBilanz===100);
ok('BELEG 36b: ohne Korrekturblock kein Protokoll-Eintrag', S.meta.syncKorrekturen.length===0);
var r7=imp({ appVersion:'1.13.0', karten:[{ id:'k1' }],
  korrekturen:[{ datum:'2026-08-30', punkteBilanz:150, endeTs:'2026-08-31T01:00:00' }] });
ok('BELEG 36c: benannter Tag korrigiert (100 → 150, Abschluss 1 Uhr)',
  S.historie[0].punkteBilanz===150 && S.historie[0].endeTs==='2026-08-31T01:00:00');
ok('BELEG 36d: NUR die getragenen Felder (akku bleibt 40)', S.historie[0].akku===40);
ok('BELEG 36e: NUR der benannte Tag (29.08. bleibt 70)', S.historie[1].punkteBilanz===70);
ok('BELEG 36f: Protokoll traegt beide Feld-Aenderungen', r7.korrigiert===2 && S.meta.syncKorrekturen.length===2
  && S.meta.syncKorrekturen[0].vorher===100 && S.meta.syncKorrekturen[0].nachher===150);
var r7b=imp({ appVersion:'1.13.0', karten:[{ id:'k1' }], korrekturen:[{ punkteBilanz:999 }] });
ok('BELEG 36g: Korrektur OHNE Datum wird abgewiesen und gemeldet',
  S.historie[0].punkteBilanz===150 && r7b.uebersprungen.some(function(u){ return u.grund.indexOf('BENANNTE')>=0; }));

/* 8) §5.3 (v1.13.0): Tagesrahmen — Import setzt ihn; ein zweiter Sync ersetzt
      AB der aktuellen Uhrzeit (13:00), Vergangenes bleibt. */
S.meta.tagesRahmen=null; _tagOffen=false;
imp({ appVersion:'1.13.0', karten:[{ id:'k1' }],
  tagesRahmen:[ {von:9,bis:12,typ:'dfm'}, {von:'13:30',bis:17,typ:'privat'}, {von:12,bis:13,typ:'pause'}, {von:1,bis:2,typ:'quatsch'} ] });
ok('Rahmen gesetzt (3 gueltige Segmente, HH:MM geparst, quatsch-Typ raus)',
  S.meta.tagesRahmen && S.meta.tagesRahmen.segmente.length===3
  && S.meta.tagesRahmen.segmente.some(function(s){ return s.typ==='privat' && Math.abs(s.von-13.5)<0.001; }));
_tagOffen=true; S.tag={ datum:heuteIso(), endeTs:null };
imp({ appVersion:'1.13.0', karten:[{ id:'k1' }],
  tagesRahmen:[ {von:8,bis:16,typ:'privat'} ] });
(function(){
  var seg=S.meta.tagesRahmen.segmente;
  var altVor13 = seg.some(function(s){ return s.typ==='dfm' && s.von===9 && s.bis===12; });
  var neuAb13  = seg.some(function(s){ return s.typ==='privat' && Math.abs(s.von-13)<0.001 && s.bis===16; });
  var keinAltNach13 = !seg.some(function(s){ return s.typ==='privat' && Math.abs(s.von-13.5)<0.001; });
  ok('2. Sync ersetzt AB 13:00 — Vergangenes (9-12 dfm) bleibt', altVor13);
  ok('2. Sync: neues Segment auf 13:00 gekappt (8-16 → 13-16)', neuAb13);
  ok('2. Sync: alte Zukunfts-Segmente (13:30-17) ersetzt', keinAltNach13);
})();
_tagOffen=false; S.tag=null;

print('');
if(fails){ print(fails + ' FEHLGESCHLAGEN'); throw 'Test rot'; }
print('alle Regressionstests gruen');
