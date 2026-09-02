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

/* ══ v1.10.0 ══ */
/* §4: Akku-Lernen — Median, Schwelle 5, Kappung, Rangfolge */
S.meta.akkuMessungen=[];
var ak=mk({id:'ak1',domain:'dfm',titel:'Akku-Karte',projekt:'Zeta',sollMin:60});
S.karten.push(ak);
[-10,-20,-15,-90,-12].forEach(function(d,i){ S.meta.akkuMessungen.push({kid:'ak1',kat:akkuKategorie(ak),datum:H,delta:d,dauerMin:60,rate:d}); });
ok('v1.10: Median je Karte ab 5 Messungen (-15)', akkuGelernt(ak).rate===-15);
ok('v1.10: akkuRate = gelernter Wert', akkuRate(ak)===-15);
ak.akkuProStd=-3;
ok('v1.10: Override gewinnt', akkuRate(ak)===-3);
ak.akkuProStd=null;
S.meta.akkuMessungen=[{kid:'ak1',kat:'dfm|Zeta',datum:H,delta:-200,dauerMin:60,rate:-200},
  {kid:'ak1',kat:'dfm|Zeta',datum:H,delta:-200,dauerMin:60,rate:-200},
  {kid:'ak1',kat:'dfm|Zeta',datum:H,delta:-200,dauerMin:60,rate:-200},
  {kid:'ak1',kat:'dfm|Zeta',datum:H,delta:-200,dauerMin:60,rate:-200},
  {kid:'ak1',kat:'dfm|Zeta',datum:H,delta:-200,dauerMin:60,rate:-200}];
ok('v1.10: Kappung auf -40', akkuGelernt(ak).rate===-40);
/* Kategorie-Fallback: andere Karte im selben Projekt */
var ak2=mk({id:'ak2',domain:'dfm',titel:'Neu im Projekt',projekt:'Zeta',sollMin:30});
S.karten.push(ak2);
ok('v1.10: Kategorie-Median greift fuer neue Karte', akkuGelernt(ak2)!=null && akkuGelernt(ak2).quelle==='Kategorie');
/* §4.3 ZAHLENBELEG: angenommen -8/h, 60 Min gebucht (-8), gemessen -20 → Akku +(-20-(-8))=-12 */
S.meta.akkuMessungen=[];
var zb=mk({id:'zb1',domain:'dfm',titel:'Beleg',projekt:'Neu',sollMin:60,istSek:3600});
S.karten.push(zb);
S.tag={ tagId:H+'-77', datum:H, laufindex:1, startTs:H+'T08:00:00', istMinutenStart:{}, abzuegeBilanz:0, log:[], akkuVerlauf:[], akku:70 };
S.tag.istMinutenStart={};   // heuteInvestiertMin: istSek zaehlt komplett heute
var investiert=heuteInvestiertMin(zb);
var angenommen=akkuRate(zb);   // -8 Standard
var gebucht=angenommen*investiert/60;
/* Messung wie abhakDialogConfirm sie bucht: */
S.meta.akkuMessungen.push({kid:'zb1',kat:akkuKategorie(zb),datum:H,delta:-20,dauerMin:60,rate:-20});
S.tag.akku=Math.max(0,Math.min(100, num(S.tag.akku)+(-20-gebucht)));
ok('v1.10 §4.3-Beleg: 60min angenommen -8 → gebucht -8; gemessen -20 → Akku 70→'+Math.round(S.tag.akku)+' (58)', Math.round(S.tag.akku)===58);
/* §1.2: Reichweite */
S.karten.forEach(function(k){ k.status=k.status||'offen'; });
var ebT={akku:10};
ok('v1.10: Reichweite liefert Uhrzeit oder reicht', typeof akkuReichweite(ebT)==='string');
/* §3.1: Nachruecken aus derselben Quelle */
var q1=mk({id:'q1',domain:'dfm',titel:'Q eins',sollMin:10,faelligkeit:H});
var q2=mk({id:'q2',domain:'dfm',titel:'Q zwei',sollMin:10,faelligkeit:H});
S.karten.push(q1); S.karten.push(q2);
S.ui.navDomain='dfm'; S.ui.navArt='aufgabe'; S.ui.navSort='deadline';
var key=ansichtsKey();
fokusStarten('q1', key);
ok('v1.10: Quelle in S.fokus', S.fokus.quelle===key);
karteAbhaken('q1', false);
ok('v1.10: Fokus rueckt aus derselben Quelle nach', S.fokus && S.fokus.karteId!=='q1' && S.fokus.laeuft===false);
/* §3.1: Freeze faellt beim Start ohne Rueckfrage */
var fz=mk({id:'fz1',domain:'dfm',titel:'Frost 2',freeze:true});
S.karten.push(fz);
fokusStarten('fz1', null);
ok('v1.10: Freeze faellt beim Start', fz.freeze===false && S.fokus.karteId==='fz1');
fokusZeitEinbuchen();
/* §3.2: kein Auto-Abschluss mehr; Bilanz-Sicherung beim Finalisieren */
ok('v1.10: tagAbschlussAuto entfernt', typeof tagAbschlussAuto==='undefined');
var vr=mk({id:'vr1',domain:'privat',titel:'Verpasste Routine',rhythmus:{typ:'taeglich'},zeitmessung:false});
var gt=mk({id:'gt1',domain:'privat',titel:'Getickte Routine',rhythmus:{typ:'taeglich'},ticksAktiv:true,tickWert:5,zeitmessung:false,ticksHeute:2,zuletztRoutine:H});
S.karten.push(vr); S.karten.push(gt);
S.tag={ tagId:H+'-78', datum:H, laufindex:1, startTs:H+'T08:00:00', istMinutenStart:{}, abzuegeBilanz:0, log:[], akkuVerlauf:[], akku:60, routinenBilanz:[] };
tagAbschlussFinalisieren();
var bil=S.historie[S.historie.length-1].routinenBilanz||[];
ok('v1.10: offene faellige Routine als verpasst gebucht', bil.some(function(b){return b.id==='vr1'&&b.verpasst;}));
ok('v1.10: GETICKTE Routine NICHT als verpasst (Alt-Bug behoben)', !bil.some(function(b){return b.id==='gt1';}));
/* Smoke: neue Statusbar + Sheet */
S.tag={ tagId:H+'-79', datum:H, laufindex:1, startTs:H+'T08:00:00', istMinutenStart:{}, abzuegeBilanz:0, log:[], akkuVerlauf:[], akku:60, routinenBilanz:[] };
smokeTest2('renderStatusbar (5 Zellen)', function(){ renderStatusbar(); });
smokeTest2('Status-Sheet (3 Abschnitte)', function(){ renderStatusSheet(); });
var sheetHtml=_els['sheetBody']?_els['sheetBody'].innerHTML:'';
// §8 (v1.11.0): Das Sheet hat sechs Abschnitte in fester Reihenfolge; der
// v1.10.0-Sortier-Filter ist per Auftrag entfallen (Kette statt Filter).
ok('v1.11: Sheet hat 6 Abschnitte', (sheetHtml.match(/stsh-kopf/g)||[]).length===6);
ok('v1.11: Sortier-Chips entfallen (Kette statt Filter)', sheetHtml.indexOf('data-sheetsort')<0);
// §5 (v1.11.1): Die Ketten-Karten nutzen die normale Kartenzeile — Direktstart
// laeuft ueber deren gemeinsames data-fokusstart im #sheetKette-Container.
ok('v1.11.1: Kette nutzt normale Kartenzeile mit Direktstart',
  sheetHtml.indexOf('sheetKette')>=0 && sheetHtml.indexOf('data-fokusstart')>=0);
smokeTest2('Abhak-Dialog mit Akku-Regler', function(){ abhakDialog('q2', false); });
var dlg=_els['sheetBody']?_els['sheetBody'].innerHTML:'';
ok('v1.10: Akku-Regler im Dialog', dlg.indexOf('id="abAkku"')>=0 && dlg.indexOf('data-abakkuskip')>=0);
ok('v1.10: Umrechnungszeile mit Gesamtdelta-Hinweis', dlg.indexOf('Gesamtdelta, kein Stundensatz')>=0);
function smokeTest2(name, fn){ try{ fn(); ok('Smoke: '+name, true); }catch(e){ ok('Smoke: '+name+' — '+e, false); } }

/* ══ v1.13.3 §1 ZAHLENBELEG: Shop-Reset setzt NUR den Besitz zurueck ══ */
S.belohnung={ stufen:{fahrzeuge:12,wohnen:12,reisen:12,mobilitaet:12,begleiter:12,soziales:12},
  ausgegeben:24500, kaeufe:[{kat:'fahrzeuge',stufe:2,name:'x',datum:'2026-08-01',preis:9000}] };
S.meta.muenzenGesamt=30000; S.meta.ausgegebenGesamt=24500;
S.meta.rangResetOffset=0; S.meta.muenzenResetOffset=0; S.meta.ausgabenResetOffset=0;
S.meta.rangBest=13; S.meta.tagesStreak=12; S.meta.tagesStreakBest=18; S.meta.upgradeFaktor=1.04;
S.tag=null; S.intraday=[];
var kontoVor=konto(), kulisseVor=bgStufeAus(ausgabenAnzeige()), ausgVor=ausgabenAnzeige();
shopResetJetzt();
ok('v1.13.3 §1: alle Objektstufen auf 0',
  ['fahrzeuge','wohnen','reisen','mobilitaet','begleiter','soziales'].every(function(k){ return S.belohnung.stufen[k]===0; }));
ok('v1.13.3 §1 BELEG: Konto unveraendert ('+kontoVor+')', konto()===kontoVor);
ok('v1.13.3 §1 BELEG: muenzenGesamt 30000 · ausgegebenGesamt 24500 unveraendert',
  S.meta.muenzenGesamt===30000 && S.meta.ausgegebenGesamt===24500 && ausgabenAnzeige()===ausgVor);
ok('v1.13.3 §1 BELEG: Kulisse bleibt ('+kulisseVor+'/10)', bgStufeAus(ausgabenAnzeige())===kulisseVor);
ok('v1.13.3 §1 BELEG: Rang-Bestwert 13 · Serie 12/18 · Upgrade-Faktor 1,04 unveraendert',
  S.meta.rangBest===13 && S.meta.tagesStreak===12 && S.meta.tagesStreakBest===18 && S.meta.upgradeFaktor===1.04);
ok('v1.13.3 §1: Kauf-Historie bleibt (Statistik)', S.belohnung.kaeufe.length===1);
ok('v1.13.3 §1: Sicherung besitz_bak1133 mit Vorher-Stand',
  (function(){ var b=JSON.parse(localStorage.getItem('fokus2_besitz_bak1133')||'null');
    return b && b.stufen && b.stufen.fahrzeuge===12 && b.kaeufe.length===1; })());
ok('v1.13.3 §1: Protokoll in meta', S.meta.shopReset1133Log && S.meta.shopReset1133Log.vorher.wohnen===12);
ok('v1.13.3 §5: Wohlstand-Reset existiert weiterhin getrennt', typeof panoramaResetJetzt==='function' && typeof oeffneShopReset==='function');
/* §2: Kalibrierung — Vorschlag >= aktueller Faktor, Dialog traegt Rate + Feld */
S.settings.preisFaktor=15;
var kal=shopKalibrierungVorschlag();
ok('v1.13.3 §2: Vorschlag ist Zahl >= aktueller Faktor', isFinite(kal.vorschlag) && kal.vorschlag>=15);
smokeTest2('Shop-Kalibrierungs-Dialog', function(){ renderShopKalibrierung(); });
var kalHtml=_els['sheetBody']?_els['sheetBody'].innerHTML:'';
ok('v1.13.3 §2: Dialog zeigt Oe-Rate und ueberschreibbares Faktor-Feld',
  kalHtml.indexOf('P/Std')>=0 && kalHtml.indexOf('id="shopPf"')>=0 && kalHtml.indexOf('Vorschlag')>=0);
/* §3: Stufentexte ersetzt, Struktur/Reqs unangetastet */
ok('v1.13.3 §3: 12 Stufen je Kategorie erhalten',
  Object.keys(BELOHNUNG).every(function(k){ return BELOHNUNG[k].stufen.length===12; }));
ok('v1.13.3 §3: Cross-Voraussetzungen unveraendert',
  JSON.stringify(BELOHNUNG.fahrzeuge.stufen[6][2])==='["wohnen",4]' &&
  JSON.stringify(BELOHNUNG.wohnen.stufen[3][2])==='["fahrzeuge",3]' &&
  JSON.stringify(BELOHNUNG.reisen.stufen[7][2])==='["mobilitaet",6]');
ok('v1.13.3 §3: unterste und oberste Stufe tragen die neuen Texte',
  BELOHNUNG.mobilitaet.stufen[0][0]==='BVG-Monatskarte' &&
  BELOHNUNG.mobilitaet.stufen[11][0]==='Erde, Wasser, Luft an einem Tag');

print('');
if(fails){ print(fails+' FEHLGESCHLAGEN'); throw 'rot'; }
print('alle Karten-Bedienelement-Tests gruen');
