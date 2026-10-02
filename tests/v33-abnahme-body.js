/* Abnahme v3.3.0 „Diagramme" — die sieben Testfaelle aus §5 und je Kachel
   ein Beleg. Layout und Tippflaechen prueft der UI-Harness (tests/ui). */
var fails=0, n=0;
function ok(t,c){ n++; print((c?'OK   ':'FAIL ')+t); if(!c) fails++; }
function kopf(t){ print(''); print('── '+t+' ──'); }
var src=readFile('neu.html');
function frisch(){
  _store={}; S.karten=[]; S.unteraufgaben=[]; S.historie=[]; S.intraday=[]; S.routinenGruppen=[];
  S.meta={ wohlstand:0, seeded:true, migration200:true }; S.settings=settingsMerge({});
  S.settings.tagesZielDfm=5000; S.settings.tagesZielPrivatModus='fest'; S.settings.tagesZielPrivat=3500;
  S.tag=null; S.fokus=null; S.meta.ketten=null; S.ui.fokusOffen=false; S.ui.fokusZeigt=null;
}
// Werktag heute (die Ziele 5.000/3.500 gelten werktags)
var HEUTE=heuteIso(), WE=istWochenendTag(HEUTE);
function punkte(dfm, privat){   // die Statusleisten-Groessen fest vorgeben
  belIstDfm=function(){ return dfm; };
  tagesPunkteDomain=function(d){ return d==='dfm' ? dfm : privat; };
}
function tagMit(stdSeitStart, stdBisEnde){
  S.tag=neuerTag(HEUTE, 1); S.tag.startTs=new Date(Date.now()-stdSeitStart*3600000).toISOString();
  var jetztH=(Date.now()-new Date(HEUTE+'T00:00:00').getTime())/3600000;
  S.meta.tagesRahmen={ datum:HEUTE, segmente:[{von:jetztH-stdSeitStart, bis:jetztH+stdBisEnde, typ:'dfm'}], ts:jetztIso() };
}
function stil(id){ return el(id).style; }
function pz(v){ return Math.round(parseFloat(v)*10)/10; }

/* ══ 1 · Punktebar (a)–(c) ═══════════════════════════════════════════ */
kopf('1 · Punktebar (§1.4)');
frisch(); tagMit(6, 9);
print('   Ziele: DFM '+zielTag('dfm')+' · Privat '+zielTag('privat')+' · zielHeute '+diaGroessen().zielHeute+(WE?' (HEUTE IST WOCHENENDE — Werte weichen ab)':''));
[[1000,500,5000,0,'a'],[6000,1000,6000,0,'b'],[6000,3000,6000,500,'c']].forEach(function(f){
  punkte(f[0], f[1]); renderStatusbar();
  var linie=pz(stil('sBarSollMark').left), soll=Math.round(f[2]/8500*1000)/10, ue=pz(stil('sBarUeber').width), ueSoll=Math.round(f[3]/8500*1000)/10;
  print('   ('+f[4]+') dfm '+f[0]+' · privat '+f[1]+' → Linie '+linie+' % (soll '+soll+') · DFM '+stil('sBarIstD').width+' von links · Privat '+stil('sBarIstP').width+' von rechts · UEBER '+ue+' %');
  ok('1'+f[4]+' Linie bei '+f[2]+'/8.500, UEBER '+f[3]+'/8.500', WE || (linie===soll && ue===ueSoll && stil('sBarIstP').right==='0' && stil('sBarIstP').left==='auto' &&
     pz(stil('sBarIstD').width)===Math.round(Math.min(f[0],8500)/8500*1000)/10 && pz(stil('sBarIstP').width)===Math.round(Math.min(f[1],8500)/8500*1000)/10));
});
ok('1 die rote Rückstands-Fläche entfällt (Linie statt Fläche; v3.5.1 §2: Soll als gepunktete Marke + Pille)', !/id="sBarSoll"/.test(src) && stil('sBarSollMark').display==='block' && /id="sPhSoll"/.test(src));

/* ══ 2 · Tempo-Ampel ═════════════════════════════════════════════════ */
kopf('2 · Tempo (§1.1, §0.3)');
var a1=diaAmpel(450,690), a2=diaAmpel(650,690), a3=diaAmpel(700,690);
function abst(x,y){ var h=function(c){ return [1,3,5].map(function(i){ return parseInt(c.slice(i,i+2),16); }); }, p=h(x), q=h(y); return Math.sqrt(p.reduce(function(s,v,i){ return s+(v-q[i])*(v-q[i]); },0)); }
print('   450 → '+a1+' · 650 → '+a2+' (Abstand GELB '+Math.round(abst(a2,DIA_FARBE.gelb))+', GRUEN '+Math.round(abst(a2,DIA_FARBE.gruen))+') · 700 → '+a3);
ok('2 tempoSchnitt 450 / Ziel 690 (r 0,65) → ORANGE', a1.toLowerCase()===DIA_FARBE.orange.toLowerCase());
ok('2 tempoSchnitt 650 (r 0,94) → GELB-nah (zwischen GELB und GRUEN, näher an GELB)', abst(a2,DIA_FARBE.gelb)<abst(a2,DIA_FARBE.gruen) && a2!==DIA_FARBE.gelb);
ok('2 tempoSchnitt 700 → GRUEN', a3===DIA_FARBE.gruen);
ok('0.3 r = 0,90 → genau GELB; soll 0 → GRUEN', diaAmpel(90,100)===DIA_FARBE.gelb && diaAmpel(5,0)===DIA_FARBE.gruen);
frisch(); tagMit(6, 9); punkte(1000, 500);
var sk=paceLeisteHtml(diaGroessen());
ok('1.1 Pace-Leiste (v3.5.2 §1): waagerecht, Füllung 0 … Ø heute im Verlauf der Pace-Farbe, „nötig" als weiße Marke', /class="pbahn"><i style="width:[\d.]+%;background:linear-gradient\(90deg,#[0-9a-f]{8},#[0-9a-f]{6}\)"/i.test(sk) &&
   /<u style="left:[\d.]+%"><\/u>/.test(sk) && /class="ppf"/.test(sk));

/* ══ 3 · Tagesprognose ═══════════════════════════════════════════════ */
kopf('3 · Tagesprognose (§2.2)');
frisch(); tagMit(6, 9); punkte(1000, 0);
var g3=diaGroessen();
print('   stundenBisher '+g3.stundenBisher.toFixed(2)+' · stundenRest '+g3.stundenRest.toFixed(2)+' · Schnitt '+Math.round(g3.tempoSchnitt)+' P/h · Prognose '+Math.round(g3.prognoseHeute));
S.karten=[neueKarte({id:'k3', domain:'dfm', titel:'Karte', matrixFeld:'ziel', sollMin:30})];
var fb3=fbWasDieseKarte(S.karten[0]);
ok('3 Schnitt 167 P/h, Prognose ≈ 2.500, „fehlen 6.000", Farbe ORANGE', Math.round(g3.tempoSchnitt)===167 && Math.abs(g3.prognoseHeute-2500)<5 &&
   (WE || (fb3.indexOf('Tagesprognose')>=0 && fb3.indexOf('>2.500<')>=0 && fb3.indexOf('fehlen 6.000')>=0 && fb3.indexOf('color:'+DIA_FARBE.orange)>=0)));

/* ══ 4 · Matrix nur die letzten 5 Stunden ════════════════════════════ */
kopf('4 · Matrix (§1.3)');
frisch(); tagMit(12, 3); punkte(0, 0);
S.tag.matrixSpur=[{ts:new Date(Date.now()-6*3600000).toISOString(), x:-0.5, y:0.2},{ts:new Date(Date.now()-4*3600000).toISOString(), x:0.3, y:0.1},{ts:new Date(Date.now()-600000).toISOString(), x:0.6, y:-0.1}];
var gesehen=null, mvOrig=matrixMiniSvg; matrixMiniSvg=function(sp){ gesehen=sp; return mvOrig(sp); };   // v3.5.1 §2: die Statusleiste zeichnet ueber matrixMiniSvg
renderStatusbar(); matrixMiniSvg=mvOrig;
ok('4 die Statusleiste zeichnet keine Position, die älter als 5 Stunden ist (2 von 3)', gesehen && gesehen.length===2 && gesehen.every(function(p){ return Date.parse(p.ts)>=Date.now()-5*3600000; }));

/* ══ 5 · Rang mit einem Tag Historie ═════════════════════════════════ */
kopf('5 · Rang-Diagramm (§3.3)');
var r5=rangDiagrammHtml({ rang:null, n:1, tage:[{datum:belFensterDatum(jetztIso()), r:{rate:210}}] });
ok('5 ein Tag (v3.5.0 §5.3): heutiger Punkt weiß mit Wert, Rang-Bänder (16 %) statt Schwellen-Linien, Kürzel R1, kein Fehler', /r="3.5" fill="#fff"/.test(r5) && />210</.test(r5) &&
   /fill-opacity="\.16"/.test(r5) && />R1</.test(r5) && r5.indexOf('>Abstieg')<0);
var r5b=rangDiagrammHtml({ rang:3, n:5, tage:[1,2,3,4,5].map(function(i){ return {datum:'2026-09-'+(10+i), r:{rate:200+i*10}}; }) });
ok('5 fünf Tage: fünf Punkte, eine Linie', (r5b.match(/<circle/g)||[]).length===5 && /<path d="M/.test(r5b));

/* ══ 6 · Keine laufende Karte ════════════════════════════════════════ */
kopf('6 · Keine laufende Karte');
frisch(); tagMit(6, 9); punkte(1000, 0);
S.karten=[neueKarte({id:'k6', domain:'dfm', titel:'Karte', matrixFeld:'ziel', sollMin:30})];
ok('6 ohne laufende Karte: kein Live-Segment in der Punkteleiste, Tagesprognose „Diese Karte: 0 %"', (function(){ var l=statusLivePunkte(); return l.dfm===0 && l.privat===0; })() && fbWasDieseKarte(S.karten[0]).indexOf('Diese Karte: 0 %')>=0);
S.fokus={ karteId:'k6', laeuft:true, startMs:Date.now()-600000, sessionSek:0 };
ok('6 mit laufender Karte (v3.5.2 §1): die Pace-Leiste trägt keinen Karten-Punkt mehr (Live-Punkte stehen in der Punkteleiste — Zahlenbeleg in v352-abnahme)', paceLeisteHtml(diaGroessen()).indexOf('ts-karte')<0 && typeof statusLivePunkte==='function');
S.fokus=null;

/* ══ 7 · Dieselbe Kachel überall ═════════════════════════════════════ */
kopf('7 · Dieselbe Render-Funktion in Fokus, Shop und Statistik');
frisch(); tagMit(6, 9); punkte(1000, 500); S.belohnung=null; belohnungInit();
var fok=fbWoIchStehe(), bel=belHeuteNoch();
ok('7 Outfit-Kachel: Fokus und Shop zeigen dieselbe (outfitKachelHtml)', fok.indexOf(outfitKachelHtml())>=0 && bel.indexOf(outfitKachelHtml())>=0);
ok('7 „Tempo und Blöcke" (v3.5.0): Fokus („Der Tag") und Statistik nutzen dieselbe Render-Funktion (heuteGegenTypischHtml)', derTagHtml(null).indexOf('data-dialive="tt"')>=0 &&
   anModVerhalten(analyseFenster(),'alle').indexOf('data-dialive="tt"')>=0);
ok('7 je Kachel genau eine Render-Funktion (Quelltext)', ['outfitKachelHtml','faktorKachelHtml','muenzenKachelHtml','rangDiagrammHtml','kulisseKachelHtml','heuteGegenTypischHtml','paceLeisteHtml']
   .every(function(f){ return (src.match(new RegExp('function '+f+'\\(','g'))||[]).length===1; }));

/* ══ Je Kachel ══════════════════════════════════════════════════════ */
kopf('Je Kachel');
frisch(); tagMit(6, 9); punkte(1000, 500); S.belohnung=null; belohnungInit();
S.meta.muenzenGesamt=500; S.meta.ausgegebenGesamt=0;
renderStatusbar();
var nk=belNaechsterKauf();
print('   Konto '+Math.round(konto())+' · nächster Artikel '+(nk?Math.round(nk.preis):'—')+' · Zelle '+el('sKW').textContent+' / '+el('sKM').textContent+' / '+el('sKF').textContent);
ok('1.2 (v3.5.1 §2) Konto-Zelle: drei Zahlen — Wohlstand, Münzen (GOLD), volle Töpfe/5 — keine Leiste', String(el('sKM').textContent)===fmtP(Math.round(konto())) && /^\d$/.test(String(el('sKF').textContent)) &&
   /id="sKW"/.test(src) && /#statusbar \.konto \.km\{color:#d4af37\}/.test(src) && !/id="sKontoLeiste"/.test(src));
var ok4=outfitKachelHtml();
ok('2.4 Outfit: quadratisch, Ring 6 px (GRUEN, Rest GRAU 30 %), Bild in der Mitte, darunter nur der nächste Name', /dia-quad/.test(ok4) && /stroke-width="6"/.test(ok4) &&
   ok4.indexOf('stroke="'+DIA_FARBE.grau+'" stroke-opacity=".3"')>=0 && /<img class="dia-ringbild"/.test(ok4) && /class="dia-name">Outfit \d+</.test(ok4) && ok4.indexOf('fbk-h')<0);
ok('2.5 Faktor: quadratisch neben dem Outfit, der große Wert', /dia-quad amp/.test(fok) && fok.indexOf(outfitKachelHtml()+faktorKachelHtml(ampelStil(ampelStufe(normalZurUhrzeit('alle').r))))>=0);
var tg=heuteGegenTypischHtml();
ok('2.6 (v3.5.2 §2) „Tempo und Blöcke": Legende heute · (gestern) · (Ø Wochentag) · Plan, wischbar mit festem y-Rand, Hinweis Tagesstart/Tagesende', />heute<\/span>/.test(tg) && />Plan<\/span>/.test(tg) && !/>DFM<\/span>/.test(tg) &&
   /class="dia-tv-y"/.test(tg) && /class="dia-tv-scroll"/.test(tg) && tg.indexOf('◂ Tagesstart')>=0 && tg.indexOf('bis Tagesende ▸')>=0);
S.karten=[neueKarte({id:'k7', domain:'privat', titel:'Karte', matrixFeld:'werkzeug', sollMin:30})];
S.tag.matrixSpur=[{ts:jetztIso(), x:0.2, y:0.1}];
var fb7=fbWasIchBewege(S.karten[0]);
ok('2.7 „Diese Karte schiebt": +X, „= Y % vom Tagesziel", Mini-Leiste 10 px in LILA (privat); „Bonus möglich" weg', fb7.indexOf('Bonus möglich')<0 &&
   /Diese Karte schiebt/.test(fb7) && /% vom Tagesziel/.test(fb7) && /dia-mini/.test(fb7) && fb7.indexOf('background:'+DIA_FARBE.lila)>=0);
var bh=belHeuteNoch();
ok('3.2 Münzen heute: quadratisch, Ring, „Ziel ✓"/„fehlen N"', bh.indexOf(muenzenKachelHtml())>=0 && /Münzen heute/.test(muenzenKachelHtml()) && /Ziel ✓|fehlen /.test(muenzenKachelHtml()));
ok('3.4 „Als Nächstes im Shop" mit Ankunftszeit', !nk || /dia-zeile">(ca\. \d\d:\d\d|jetzt|nicht mehr heute · fehlen )/.test(bh));
var sam=outfitSammlungHtml();
ok('3.5 Outfit-Sammlung: 48×48-Bilder mit „N×"', /width="48" height="48"/.test(sam) && /<small>\d+×<\/small>/.test(sam));
var ku=kulisseKachelHtml();
ok('3.6 (v3.5.1 §4 Nr. 9/§5 Nr. 3) Kulisse: farbige Fassung als Hintergrund, Schleier, „n % ausgemalt", Balken im GOLD-Verlauf', /class="kulbar" style="background-image:url\(img\/kulissen\/bg\d\d_farbig\.jpg\)"/.test(ku) && /class="schleier"/.test(ku) &&
   /<b>Kulisse \d+<\/b>/.test(ku) && /\d+ % ausgemalt/.test(ku) && /linear-gradient\(90deg,#f3dc8a,#d4af37\)/i.test(ku));
ok('0.1 UEBER #FF2D95 war vorher nirgends benutzt', (src.match(/#FF2D95/gi)||[]).length>=1 && DIA_FARBE.ueber==='#FF2D95');

/* ══ Version ════════════════════════════════════════════════════════ */
kopf('Version');
ok('APP_VERSION aktuell (3.4.0), Build 2026-10-02-1', APP_VERSION==='3.5.2' && UI_VERSION==='v3.5.2' && APP_BUILD==='2026-10-02-1');

print('');
print(fails? (fails+' von '+n+' FEHLGESCHLAGEN') : ('alle '+n+' Abnahmepunkte gruen'));
if(fails) throw 'Abnahme rot';
