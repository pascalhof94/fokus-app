/* jsc test: v1.1 Status/Fokus-Kennzahlen (akkuLive, heuteInvestiertMin, pace,
   energieBatterie, tagesStreakStand). Extrahiert echte Fns aus neu.html. */
var src = readFile('neu.html');
function extract(name){
  var m = new RegExp('\\nfunction ' + name + '\\s*\\(').exec(src);
  if(!m) throw 'nicht gefunden: ' + name;
  var p = src.indexOf('(', m.index + m[0].length - 1), d = 0, k = p;
  for(; k < src.length; k++){ var c = src[k]; if(c==='(') d++; else if(c===')'){ d--; if(d===0) break; } }
  var b = src.indexOf('{', k), depth = 0, j = b;
  for(; j < src.length; j++){ var c2 = src[j]; if(c2==='{') depth++; else if(c2==='}'){ depth--; if(depth===0) return src.substring(m.index+1, j+1); } }
  throw 'kein Ende: ' + name;
}
var NAMES = ['num','heuteIso','jetztIso','heuteApp','istSekLive','geldFaktor','basisRate','rate','akkuRate',
  'tickSumme','punkteFuerZeit','zeitquelleMin','subBonusErreicht','kartePunkte','kartenArt','laufendeSek',
  'heuteInvestiertMin','akkuLive','aktuelleTagId','tagOffen','kartePunkteHeute','tagesPunkteDomain','tagesPunkteLive',
  'punkteHeuteAnzeige','tagesZielDomain','wachTagAnteil','punkteHeuteDomain','istTickKarte','tickPunkte',
  'tagStundenVergangen','paceWerte','imTagesstrom','energieBatterie','tagesStreakStand',
  'fokusKarte','untermenge'];
var DEFAULT_SETTINGS = { basisProStd:120, zeitGewicht:1.15, tickGewicht:1, geldGewicht:0.5, geldDeckel:1.5,
  geldScoreRef:200, tagesZielDfm:5000, tagesZielPrivat:3000, tageszielPunkteProStd:100, akkuProStd:-8 };
var S = { karten:[], unteraufgaben:[], tag:null, fokus:null, historie:[], meta:{wohlstand:0}, settings:DEFAULT_SETTINGS };
function untermengeStub(){ return []; }
eval(extract('num'));
eval(NAMES.filter(function(n){return n!=='num'&&n!=='untermenge';}).map(extract).join('\n'));
function untermenge(id){ return S.unteraufgaben.filter(function(u){return u.parentId===id;}); }

var fails=0; function ok(n,c){ print((c?'OK   ':'FAIL ')+n); if(!c) fails++; }
function karte(f){ return Object.assign({ id:'x', domain:'privat', status:'offen', titel:'T',
  komplex:1, energie:1, blockade:1, sollMin:60, istSek:0, ticksHeute:0, tickKurve:[1],
  punkteProStd:null, akkuProStd:null, zeitStufen:null, rhythmus:null, faelligkeit:heuteApp() }, f||{}); }

var HEUTE=heuteApp();
// 1) heuteInvestiertMin: Tagesbasis abziehen, 16h-Deckel
var k1=karte({ id:'a', istSek:3600 });          // 60 min gesamt
S.karten=[k1]; S.fokus=null;
S.tag={ tagId:HEUTE+'-1', datum:heuteIso(), startTs:jetztIso(), akku:80, istMinutenStart:{a:20}, abzuegeBilanz:0, log:[] };
ok('heuteInvestiertMin = ist − Basis (60−20=40)', Math.round(heuteInvestiertMin(k1))===40);
S.tag.istMinutenStart={};
ok('heuteInvestiertMin ohne Basis = 60', Math.round(heuteInvestiertMin(k1))===60);

// 2) akkuLive: gebuchter Stand ohne laufenden Fokus = tag.akku
S.tag.akku=75; S.fokus=null;
ok('akkuLive ohne Fokus = tag.akku', akkuLive()===75);
ok('akkuLive null wenn akku null', (function(){ S.tag.akku=null; var r=akkuLive(); S.tag.akku=75; return r===null; })());

// 3) paceWerte: ist = Punkte/Std, soll = Tagesziel
S.tag.istMinutenStart={a:0}; k1.istSek=3600; // 60 min invest → zeitpunkte
// startTs 2h her:
S.tag.startTs=new Date(Date.now()-2*3600000).toISOString();
var pw=paceWerte();
// A1: soll = (5000+3000) × wachTagAnteil; startTs 2h her → 2/16 = 0.125 → 1000
ok('paceWerte.soll = anteiliges Gesamtziel (~1000)', Math.abs(pw.soll-1000)<1);
ok('paceWerte.ist >= 0 endlich', pw.ist>=0 && isFinite(pw.ist));
// A3: Tick-Karte-Erkennung + Tick-Punkte
ok('istTickKarte: Counter (tickKurve>1)', istTickKarte(karte({tickKurve:[5,4,3]}))===true);
ok('istTickKarte: timerFlag', istTickKarte(karte({timerFlag:true}))===true);
ok('istTickKarte: normale Aufgabe = false', istTickKarte(karte({}))===false);
ok('tickPunkte summiert Tickkurve×ticks', Math.round(tickPunkte(karte({tickKurve:[10,6,4],ticksHeute:2})))===16);

// 4) energieBatterie: gruen+gelb = akku, dunkel = 100−akku
S.tag.akku=60; S.fokus=null;
var kv=karte({ id:'v', sollMin:120, istSek:0, faelligkeit:HEUTE, akkuProStd:-20 }); // Verbraucher
S.karten=[kv]; S.tag.istMinutenStart={v:0};
var eb=energieBatterie();
ok('Batterie akku=60', Math.round(eb.akku)===60);
ok('gruen+gelb = akku', Math.abs((eb.gruen+eb.gelb)-60)<0.01);
ok('dunkel = 100−akku', Math.abs(eb.dunkel-40)<0.01);
ok('Verbraucher erzeugt gelb (verplant>0)', eb.gelb>0);
// Lader verkleinert verplant
var kl=karte({ id:'l', sollMin:120, istSek:0, faelligkeit:HEUTE, akkuProStd:20 });
S.karten=[kv,kl]; S.tag.istMinutenStart={v:0,l:0};
var eb2=energieBatterie();
ok('Lader senkt gelb ggü. nur Verbraucher', eb2.gelb<=eb.gelb);

// 5) tagesStreakStand: zusammenhängende positive Tage
S.historie=[ {datum:'2026-07-27',laufindex:1,punkteBilanz:50,luecke:false},
             {datum:'2026-07-28',laufindex:1,punkteBilanz:80,luecke:false},
             {datum:'2026-07-29',laufindex:1,punkteBilanz:0,luecke:false} ];
ok('Streak bricht am 0-Tag (jüngster=29.=0 → 0)', tagesStreakStand(false)===0);
S.historie=[ {datum:'2026-07-27',laufindex:1,punkteBilanz:50,luecke:false},
             {datum:'2026-07-28',laufindex:1,punkteBilanz:80,luecke:false},
             {datum:'2026-07-29',laufindex:1,punkteBilanz:30,luecke:false} ];
ok('Streak = 3 zusammenhängende positive Tage', tagesStreakStand(false)===3);

// 6) punkteHeuteAnzeige nie negativ
S.tag={ tagId:HEUTE+'-1', datum:heuteIso(), startTs:jetztIso(), akku:75, istMinutenStart:{}, abzuegeBilanz:9999, log:[] };
S.karten=[]; S.fokus=null;
ok('punkteHeuteAnzeige nie negativ', punkteHeuteAnzeige()===0);

print('');
if(fails){ print(fails+' FEHLGESCHLAGEN'); throw 'Test rot'; }
print('alle Status/Fokus-Kennzahlen gruen');
