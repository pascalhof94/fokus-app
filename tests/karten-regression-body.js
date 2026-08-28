var fails=0; function ok(n,c){ print((c?'OK   ':'FAIL ')+n); if(!c) fails++; }
var H=heuteApp();

S.meta={ zeit191:true, gamify190:true }; S.belohnung={stufen:{},ausgegeben:0,kaeufe:[]};
S.historie=[]; S.unteraufgaben=[]; S.intraday=[]; S.routinenGruppen=[]; S.tag=null; S.fokus=null;
function mk(f){ return Object.assign(neueKarte(), Object.assign({status:'offen',komplex:1,energie:1,blockade:1}, f)); }

/* §6-Test 1: data-fokusstart auf JEDER Kartenart */
var arten=[
  ['Aufgabe',                        mk({id:'t1',domain:'dfm',titel:'Aufgabe',sollMin:30})],
  ['Routine OHNE Zeit',              mk({id:'t2',domain:'privat',titel:'R ohne Zeit',rhythmus:{typ:'taeglich'},zeitmessung:false})],
  ['Routine MIT Zeit',               mk({id:'t3',domain:'privat',titel:'R mit Zeit',rhythmus:{typ:'taeglich'},sollMin:20})],
  ['Counter (ticksAktiv)',           mk({id:'t4',domain:'privat',titel:'Counter',ticksAktiv:true,tickWert:5,zeitmessung:false})],
  ['reiner Timer (timerFlag)',       mk({id:'t5',domain:'dfm',titel:'Timer',timerFlag:true,keineAutoPause:true})],
  ['eingefrorene Karte',             mk({id:'t6',domain:'dfm',titel:'Frost',freeze:true})],
  ['erledigte Karte',                mk({id:'t7',domain:'dfm',titel:'Fertig',status:'erledigt',tagId:H+'-1'})]
];
S.karten=arten.map(function(a){ return a[1]; });
arten.forEach(function(a){
  var html=kartenreiheHtml(a[1], 'fl|dfm|aufgabe|deadline');
  ok('▶ vorhanden: '+a[0], html.indexOf('data-fokusstart')>=0);
});

/* §6-Test 2: bei ticksAktiv sind ＋ UND ✓ da; ohne ticksAktiv nur ✓ */
var htmlTick=kartenreiheHtml(S.karten[3], 'x');
ok('ticksAktiv: data-tickplus vorhanden', htmlTick.indexOf('data-tickplus')>=0);
ok('ticksAktiv: data-check vorhanden',    htmlTick.indexOf('data-check')>=0);
var htmlNorm=kartenreiheHtml(S.karten[0], 'x');
ok('ohne Ticks: kein data-tickplus', htmlNorm.indexOf('data-tickplus')<0);
ok('ohne Ticks: data-check vorhanden', htmlNorm.indexOf('data-check')>=0);

/* §3: ▶ ohne Zeitmessung oeffnet den Fokus OHNE Uhr, ohne Intraday */
var intrVor=S.intraday.length;
fokusStarten('t2');
ok('Fokus gewaehlt (t2)', S.fokus && S.fokus.karteId==='t2');
ok('Stoppuhr laeuft NICHT', S.fokus.laeuft===false);
fokusZeitEinbuchen();
ok('keine Zeit gebucht', num(S.karten[1].istSek)===0);
ok('kein Intraday-Eintrag', S.intraday.length===intrVor);
/* mit Zeitmessung: Uhr laeuft an */
fokusStarten('t3');
ok('mit Zeitmessung: Uhr laeuft', S.fokus.laeuft===true);
fokusZeitEinbuchen();

/* §4: ✓ auf einer Tick-Karte schliesst AB (tickt nicht) */
var t4=S.karten[3]; t4.ticksHeute=0; t4.tickWerteHeute=[];
S.tag={ tagId:H+'-1', datum:H, laufindex:1, startTs:H+'T08:00:00', istMinutenStart:{}, abzuegeBilanz:0, log:[], akkuVerlauf:[], akku:80 };
karteAbhaken('t4', false);
ok('✓ schliesst Tick-Karte ab', t4.status==='erledigt');
ok('✓ bucht KEINEN Tick', num(t4.ticksHeute)===0);
/* ＋ tickt weiterhin unabhaengig */
karteAbhaken('t4', false);   // wieder oeffnen
karteTick('t4', false);
ok('＋ tickt weiterhin', num(t4.ticksHeute)===1 && t4.status==='offen');

/* §2.1: Migration — Default true, WhatsApp laut 180er-Log aus */
S.karten.push(mk({id:'wa',domain:'privat',titel:'WhatsApp',rhythmus:{typ:'taeglich'},ticksAktiv:true,tickWert:5}));
S.karten.forEach(function(k){ delete k.zeitmessung; });
S.meta.migration180Log={ whatsapp:{timerFlagVorher:true, sollMinVorher:15} };
delete S.meta.zeit191;
DB.set('karten_bak191', null);
(function(){   // Migrationsblock von Hand (laeuft sonst nur in ladeAlles)
  var log={ ts:jetztIso(), gesetzt:0, whatsappAus:false, whatsappLogVorhanden:!!(S.meta.migration180Log&&S.meta.migration180Log.whatsapp) };
  S.karten.forEach(function(k){ if(k.zeitmessung==null){ k.zeitmessung=true; log.gesetzt++; } });
  if(log.whatsappLogVorhanden){
    var wa=null; S.karten.forEach(function(k){ if(String(k.titel||'').trim().toLowerCase()==='whatsapp' && k.rhythmus) wa=k; });
    if(wa){ wa.zeitmessung=false; log.whatsappAus=true; }
  }
  S.meta.zeit191Log=log; S.meta.zeit191=true;
})();
ok('Migration: alle auf true ('+S.meta.zeit191Log.gesetzt+')', S.meta.zeit191Log.gesetzt===S.karten.length);
ok('Migration: WhatsApp aus (Log lag vor)', S.karten[S.karten.length-1].zeitmessung===false && S.meta.zeit191Log.whatsappAus===true);
ok('Migration: alle anderen true', S.karten.filter(function(k){return k.zeitmessung===true;}).length===S.karten.length-1);

/* v1.9.2: Gruppen-Bonus — eine Counter-Routine, die NUR abgehakt (nicht
   getickt) wird, macht die Gruppe komplett und loest den Bonus genau EINMAL. */
S.karten.push(mk({id:'g1',domain:'privat',titel:'Tick-Routine',rhythmus:{typ:'taeglich'},ticksAktiv:true,tickWert:5,zeitmessung:false}));
S.karten.push(mk({id:'g2',domain:'privat',titel:'Normale Routine',rhythmus:{typ:'taeglich'},sollMin:5}));
S.routinenGruppen=[{id:'gr',name:'Runde',domain:'privat',mitglieder:['g1','g2'],komplettBonus:200,farbe:'#b98af7',bonusTag:null}];
S.tag={ tagId:H+'-9', datum:H, laufindex:1, startTs:H+'T08:00:00', istMinutenStart:{}, abzuegeBilanz:0, log:[], akkuVerlauf:[], akku:80 };
var g1=S.karten[S.karten.length-2], g2=S.karten[S.karten.length-1];
karteAbhaken('g2', false); gruppeNachAenderung('g2');
ok('v1.9.2: 1/2 — Bonus noch nicht', S.routinenGruppen[0].bonusTag==null);
karteAbhaken('g1', false); gruppeNachAenderung('g1');   // NUR abgehakt, kein Tick
ok('v1.9.2: nur-abgehakte Tick-Karte zaehlt als fertig', routErledigtHeute(g1)===true && num(g1.ticksHeute)===0);
ok('v1.9.2: Gruppe komplett → Bonus faellt', S.routinenGruppen[0].bonusTag===aktuelleTagId());
var bonusZeilen=S.tag.log.filter(function(e){return e.art==='Gruppenbonus';}).length;
ok('v1.9.2: genau EINE Bonus-Zeile', bonusZeilen===1);
karteTick('g1', false); gruppeNachAenderung('g1');   // zusaetzlich getickt → kein Doppelbonus
ok('v1.9.2: Tick nach Abhaken bucht Bonus NICHT doppelt', S.tag.log.filter(function(e){return e.art==='Gruppenbonus';}).length===1);
/* Wiederoeffnen einer abgehakten+getickten Karte: ueber Ticks weiter fertig → Bonus bleibt */
karteAbhaken('g1', false); gruppeNachAenderung('g1');   // wieder oeffnen
ok('v1.9.2: nach Wiederoeffnen ueber Ticks weiter fertig, Bonus bleibt', routErledigtHeute(g1)===true && S.routinenGruppen[0].bonusTag===aktuelleTagId());

print('');
if(fails){ print(fails+' FEHLGESCHLAGEN'); throw 'rot'; }
print('alle Karten-Bedienelement-Tests gruen');
