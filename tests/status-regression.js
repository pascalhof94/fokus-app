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
  'tickSumme','punkteFuerZeit','zeitquelleMin','subBonusErreicht','pausenStrafe','pausenStrafeLive','kartePunkte','kartenArt','laufendeSek',
  'heuteInvestiertMin','akkuLive','aktuelleTagId','tagOffen','kartePunkteHeute','tagesPunkteDomain','tagesPunkteLive',
  'punkteHeuteAnzeige','tagesZielDomain','wachTagAnteil','punkteHeuteDomain','istTickKarte','tickPunkte',
  'tagStundenVergangen','anZielDfmTag','paceWerte','imTagesstrom','energieBatterie','tagesStreakStand',
  'fokusKarte','untermenge',
  // §2 (v1.12.0): die Soll-Treppen-Familie
  'istWochenendTag','fensterAnteil','sollFensterStunden','restFensterStd','jetztStunde',
  'zielTag','zielTagGesamt','sollStand','sollStandGesamt','weIstDomain','zielUndIstHeute','sollFensterAktiv',
  // §5.1 (v1.13.0): Start-verankerte Form + Rahmen + Faktor
  'sollFormWerktag','tagesStartStunde','tagesRahmen','rahmenFenster','upgradeFaktor',
  // §2 (v1.13.0): Standardwerte
  'standardWert','tickWertEff','abhakbonusDefault',
  // §3.1/§3.2 (v1.13.0): Vier-Kategorien-Quote + Rein/Raus-Zählwerk
  'routinenQuoteHeute','routineFaellig','routErledigtHeute','anFlowReihe','reinRausTag',
  // Zahlenbeleg 22: Mess-Ebene rechnet roh
  'belFensterDatum','tagesRateDetail','tagesRate','aktiveRateTage','tagIstUrlaub','medianVon','oePStd7',
  'leistungsSchwelle','leistungsRangVon','rangMass'];
/* §1 (v1.7.1): kartePunkte zieht die Pausentimer-Strafe live ab — die beiden
   Helfer werden mit extrahiert, die Konstante hier gespiegelt (Konstanten sind
   nicht extrahierbar). Mit S.fokus=null liefert pausenStrafeLive stets 0. */
var PAUSENTIMER_MAX_MIN = 120;
var RANG_MAX = 20;
var AKKU_MAX = 150;   // §6.2 (v1.13.0)
var DEFAULT_SETTINGS = { basisProStd:120, zeitGewicht:1.15, tickGewicht:1, geldGewicht:0.5, geldDeckel:1.5,
  geldScoreRef:200, tagesZielDfm:5000, tagesZielPrivat:3000, tageszielPunkteProStd:100, akkuProStd:-8,
  basisProStdPrivat:120, standardWertDfm:0, standardWertPrivat:0, sollFormWerktag:[[0,5],[6,9]] };
var S = { karten:[], unteraufgaben:[], tag:null, fokus:null, historie:[], intraday:[], meta:{wohlstand:0}, settings:DEFAULT_SETTINGS };
var _rangMemo=null, _rangMemoKey='';
function untermengeStub(){ return []; }
eval(extract('num'));
eval(NAMES.filter(function(n){return n!=='num'&&n!=='untermenge';}).map(extract).join('\n'));
function untermenge(id){ return S.unteraufgaben.filter(function(u){return u.parentId===id;}); }
// §2 (v1.12.0): weIstDomain braucht am Sonntag den Samstags-Snapshot — hier
// gestubbt (kein Historien-Aufbau in dieser Suite; die Treppe selbst wird
// direkt geprueft).
function tagSnapshot(){ return null; }
function anVorTage(iso,n){ return iso; }
function snapPunkte(){ return 0; }
function saveMeta(){}
// §5.1 (v1.13.0): Uhrzeit fixieren (14:00) — die Treppe hängt am Tagesstart,
// die Erwartungen unten sind damit laufzeitunabhängig. Zuweisung NACH dem
// eval, damit sie die extrahierte Fassung ersetzt.
jetztStunde = function(){ return 14; };

var fails=0; function ok(n,c){ print((c?'OK   ':'FAIL ')+n); if(!c) fails++; }
function karte(f){ return Object.assign({ id:'x', domain:'privat', status:'offen', titel:'T',
  komplex:1, energie:1, blockade:1, sollMin:60, istSek:0, ticksHeute:0, ticksAktiv:false, tickWert:0, tickWerteHeute:[],
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

// 3) paceWerte: Soll folgt der START-VERANKERTEN Treppe (§5.1 v1.13.0)
S.tag.istMinutenStart={a:0}; k1.istSek=3600; // 60 min invest → zeitpunkte
// §5.1: Tagesstart FIX auf 9:00 heute — Form [[0,5],[6,9]] ⇒ Fenster 9–14 + 15–18.
S.tag.startTs=heuteIso()+'T09:00:00';
// §2 (v1.12.0): Ziel-Settings der neuen Welt setzen (Punkteformel-Tests oben
// laufen bewusst weiter mit den alten Gewichten aus DEFAULT_SETTINGS).
S.settings.tagesZielDfm=7000; S.settings.tagesZielPrivat=5000;
S.settings.zielWeDfm=2500; S.settings.zielWePrivat=10000;
var pw=paceWerte();
/* Soll folgt der TREPPE — am Wochenende gilt das gemeinsame Kontingent. */
if(istWochenendTag(heuteApp())){
  ok('paceWerte am WE: gemeinsames Kontingent, we-Flag', pw.we===true && Math.abs(pw.ziel-12500)<1);
} else {
  ok('Fenster hängen am Start (9:00 → 9–14 · 15–18)',
    JSON.stringify(sollFensterAktiv())==='[[9,14],[15,18]]');
  var sollErwartet=(7000+5000)*fensterAnteil();
  ok('paceWerte.soll folgt der Soll-Treppe', Math.abs(pw.soll-sollErwartet)<1);
  ok('Senke ist Plateau: Soll um 14:30 = Soll um 14:00', Math.abs(sollStandGesamt(null,14.5)-sollStandGesamt(null,14))<0.001);
  ok('Treppe: Soll um 12:00 = Ziel × 3/8 (3 von 8 aktiven Std)', Math.abs(sollStandGesamt(null,12)-(12000*3/8))<1);
  ok('Rest im Fenster um 14:00 = 3 Std (15–18)', Math.abs(restFensterStd(14)-3)<0.001);
  // §5.1: späterer Start verschiebt ALLES mit — Anker 11:00 ⇒ 11–16 · 17–20
  S.tag.startTs=heuteIso()+'T11:00:00';
  ok('später Start verschiebt die Form mit (11:00 → 11–16 · 17–20)',
    JSON.stringify(sollFensterAktiv())==='[[11,16],[17,20]]');
  ok('kein Rückstand durch späten Start: Soll um 12:00 = Ziel × 1/8', Math.abs(sollStandGesamt(null,12)-(12000*1/8))<1);
  S.tag.startTs=heuteIso()+'T09:00:00';
  // §5.2: läuft der Tag ÜBER das Form-Ende hinaus, streckt sich die Treppe mit
  jetztStunde=function(){ return 19.5; };
  var fs2=sollFensterAktiv();
  ok('Treppe streckt sich: letztes Fenster endet JETZT (19,5)', Math.abs(fs2[fs2.length-1][1]-19.5)<0.001);
  ok('gestreckt: Soll jetzt = volles Ziel', Math.abs(sollStandGesamt(null,19.5)-12000)<1);
  jetztStunde=function(){ return 14; };
  // §5.3: ein Tagesrahmen schlägt die Form — je Domäne die eigenen Segmente
  S.meta.tagesRahmen={ datum:heuteApp(), segmente:[
    {von:8,bis:12,typ:'dfm'},{von:12,bis:13,typ:'pause'},{von:13,bis:17,typ:'privat'} ] };
  ok('Rahmen schlägt Form: DFM-Soll um 12:00 = volles DFM-Ziel', Math.abs(sollStand('dfm',null,12)-7000)<1);
  ok('Rahmen: Privat-Soll um 12:00 = 0 (Segment beginnt 13:00)', Math.abs(sollStand('privat',null,12))<1);
  ok('Rahmen: pause zählt nicht als aktiv', JSON.stringify(rahmenFenster(S.meta.tagesRahmen.segmente))==='[[8,12],[13,17]]');
  delete S.meta.tagesRahmen;
}
ok('paceWerte.ist >= 0 endlich', pw.ist>=0 && isFinite(pw.ist));
ok('paceWerte liefert die drei §1.5-Werte (istRate/restRate/sollRate)',
  pw.istRate!=null && pw.sollRate>0 && ('restRate' in pw));
// A3: Tick-Karte-Erkennung + Tick-Punkte
/* §7/§9 (v1.8.0): Tick-Modell — maßgeblich ist ticksAktiv, timerFlag ist nur
   noch Zeitmessung, und tickPunkte summiert die heutigen Einzelwerte
   (Fallback: tickWert je Tick). Eine Routine mit ticksAktiv bleibt Routine
   (kartenArt) UND ist tickbar — der historische Bug. */
ok('istTickKarte: ticksAktiv', istTickKarte(karte({ticksAktiv:true}))===true);
ok('istTickKarte: Routine MIT ticksAktiv ist tickbar', istTickKarte(karte({rhythmus:{typ:'taeglich'}, ticksAktiv:true}))===true);
ok('kartenArt: Routine mit Ticks bleibt Routine', kartenArt(karte({rhythmus:{typ:'taeglich'}, ticksAktiv:true}))==='Routine');
ok('istTickKarte: timerFlag allein tickt NICHT mehr', istTickKarte(karte({timerFlag:true}))===false);
ok('istTickKarte: normale Aufgabe = false', istTickKarte(karte({}))===false);
ok('tickPunkte: ticksHeute × tickWert (Fallback)', Math.round(tickPunkte(karte({ticksAktiv:true, tickWert:8, ticksHeute:2})))===16);
ok('tickPunkte: Einzelwerte schlagen den Default', Math.round(tickPunkte(karte({ticksAktiv:true, tickWert:8, ticksHeute:2, tickWerteHeute:[10,-5]})))===5);
ok('tickPunkte: negativer tickWert zulässig', Math.round(tickPunkte(karte({ticksAktiv:true, tickWert:-15, ticksHeute:2})))===-30);

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

// ══ 7) §2 (v1.13.0): Standardwerte — erben live, Override dauerhaft ══
S.settings.standardWertDfm=40; S.settings.standardWertPrivat=15;
var kErbt=karte({ id:'e1', domain:'privat', tickWert:null, abhakbonus:null, ticksAktiv:true, ticksHeute:2, tickWerteHeute:[] });
var kOvr =karte({ id:'e2', domain:'privat', tickWert:0,    abhakbonus:5 });
ok('§2: tickWert null erbt den Standard (15)', tickWertEff(kErbt)===15);
ok('§2: Abhakbonus null erbt den Standard (15)', abhakbonusDefault(kErbt)===15);
ok('§2: Standard-Änderung wirkt SOFORT auf erbende Karten', (function(){ S.settings.standardWertPrivat=25; var r=tickWertEff(kErbt)===25 && abhakbonusDefault(kErbt)===25; S.settings.standardWertPrivat=15; return r; })());
ok('§2: Override 0 bleibt Override (kein Erben)', tickWertEff(kOvr)===0 && abhakbonusDefault(kOvr)===5);
ok('§2: tickSumme nutzt den geerbten Wert (2×15=30)', Math.round(tickSumme(kErbt,2))===30);

// ══ 8) §3.1 (v1.13.0): Routinen-Quote — vier Kategorien, Summe = 100 % ══
S.tag={ tagId:HEUTE+'-1', datum:heuteIso(), startTs:heuteIso()+'T09:00:00', akku:75, istMinutenStart:{}, abzuegeBilanz:0, log:[],
  routinenBilanz:[ {id:'r2', titel:'R2', geschoben:true}, {id:'r3', titel:'R3', entschuldigt:true} ] };
S.karten=[
  karte({ id:'r1', domain:'privat', rhythmus:{typ:'taeglich'}, status:'erledigt', tagId:aktuelleTagId() }),
  karte({ id:'r2', domain:'privat', rhythmus:{typ:'taeglich'}, faelligkeit:datumPlus1x(HEUTE) }),
  karte({ id:'r3', domain:'privat', rhythmus:{typ:'taeglich'} }),
  karte({ id:'r4', domain:'privat', rhythmus:{typ:'taeglich'} })
];
function datumPlus1x(iso){ return iso; }
var q=routinenQuoteHeute('alle');
ok('§3.1: vier Kategorien je 1 (erledigt/geschoben/entschuldigt/verpasst)',
  q.erledigt===1 && q.geschoben===1 && q.entschuldigt===1 && q.verpasst===1);
ok('§3.1 ZAHLENBELEG: Summe der vier Kategorien = 100 % ('+q.erledigt+'+'+q.geschoben+'+'+q.entschuldigt+'+'+q.verpasst+' = '+q.gesamt+')',
  q.erledigt+q.geschoben+q.entschuldigt+q.verpasst===q.gesamt && q.gesamt===4);

// ══ 9) §3.2 (v1.13.0): alle VIER Rein-Ereignisse zählen — je ein Beleg ══
var GESTERN='2026-01-01', HEUTE2='2026-01-02';
S.karten=[
  karte({ id:'f1', domain:'dfm', erstelltTs:HEUTE2+'T09:00:00' }),                                  // 1: neu angelegt
  karte({ id:'f2', domain:'dfm', erstelltTs:HEUTE2+'T10:00:00', vorgaengerAppId:'f3' }),           // 2: Folgeaufgabe (rein)
  karte({ id:'f3', domain:'dfm', erstelltTs:GESTERN+'T09:00:00', status:'erledigt', tagId:HEUTE2+'-1' }),  // …ihre Vorgängerin: raus
  karte({ id:'f4', domain:'dfm', erstelltTs:GESTERN+'T09:00:00' }),                                 // 3: geschoben MIT Ankunft heute
  karte({ id:'f5', domain:'dfm', erstelltTs:GESTERN+'T08:00:00' })                                  // 4: wiedereröffnet heute
];
S.intraday=[
  { ts:HEUTE2+'T11:00:00', kartenId:'f3', domaene:'dfm', punkte:500, minuten:0, typ:'abhaken' },
  { ts:GESTERN+'T18:00:00', kartenId:'f4', domaene:'dfm', punkte:0, minuten:0, typ:'schub', ziel:HEUTE2 },
  { ts:HEUTE2+'T12:00:00', kartenId:'f5', domaene:'dfm', punkte:0, minuten:0, typ:'wiederoffen' }
];
var fl=anFlowReihe('alle'), rrH=reinRausTag(fl, HEUTE2), rrG=reinRausTag(fl, GESTERN);
ok('§3.2 BELEG rein=4 heute (neu + Folge + Schub-Ankunft + wiedereröffnet)', rrH.rein===4);
ok('§3.2 BELEG raus=1 heute (Vorgängerin abgehakt)', rrH.raus===1);
ok('§3.2 BELEG geschoben zählt am AUSGANGSTAG (gestern=1, heute=0), kein Abgang', rrG.geschoben===1 && rrH.geschoben===0 && rrG.raus===0);

// ══ 10) §4.3 (v1.13.0) ZAHLENBELEG 22: Faktor 2 — Mess-Ebene bleibt roh ══
S.tag={ tagId:HEUTE+'-1', datum:heuteIso(), startTs:heuteIso()+'T09:00:00', endeTs:null, akku:75, istMinutenStart:{}, abzuegeBilanz:0, log:[] };
S.karten=[]; S.historie=[];
S.intraday=[];
for(var off=1; off<=4; off++){
  var dd='2026-02-0'+off;
  S.intraday.push({ ts:dd+'T09:00:00', kartenId:'m'+off, domaene:'dfm', punkte:0, minuten:120, typ:'timer' });
  S.intraday.push({ ts:dd+'T12:00:00', kartenId:'m'+off, domaene:'dfm', punkte:400+off*10, minuten:0, typ:'abhaken' });
}
_rangMemo=null; _rangMemoKey='';
S.meta.upgradeFaktor=1;
var medianRoh=rangMass().median, oeRoh=oePStd7(), sollF1=paceWerte().soll;
_rangMemo=null; _rangMemoKey='';
S.meta.upgradeFaktor=2;
var medianF2=rangMass().median, oeF2=oePStd7(), sollF2=paceWerte().soll;
ok('§4.3 BELEG (F=2): Rang-Median unverändert ('+Math.round(medianRoh)+' P/Std)', medianRoh!=null && medianRoh===medianF2);
ok('§4.3 BELEG (F=2): oePStd7 unverändert ('+Math.round(oeRoh)+')', Math.abs(oeRoh-oeF2)<0.001);
ok('§4.3 BELEG (F=2): Anzeige-Soll verdoppelt sich ('+Math.round(sollF1)+' → '+Math.round(sollF2)+')', Math.abs(sollF2-2*sollF1)<1);
S.meta.upgradeFaktor=1;

print('');
if(fails){ print(fails+' FEHLGESCHLAGEN'); throw 'Test rot'; }
print('alle Status/Fokus-Kennzahlen gruen');
