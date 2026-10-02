/* Abnahme Hotfix v3.5.4 — die Tests (a)–(g) der Auftraege 3.5.4 und 3.5.4-Abschluss und die Regeln dahinter.
   Die Uhr ist verstellbar (uhr/minuten aus tests/v354-abnahme.js). */
var fails=0, n=0;
function ok(t,c){ n++; print((c?'OK   ':'FAIL ')+t); if(!c) fails++; }
function kopf(t){ print(''); print('── '+t+' ──'); }
function kid(id){ return S.karten.filter(function(k){ return k.id===id; })[0]; }
function frisch(){
  _store={}; S.karten=[]; S.unteraufgaben=[]; S.historie=[]; S.intraday=[]; S.routinenGruppen=[]; S.tagesketten=[];
  S.meta={ wohlstand:0, seeded:true, migration200:true }; S.settings=settingsMerge({});
  S.tag=null; S.fokus=null; S.meta.ketten=null; matrixTmp=null; S.ui.fokusOffen=false; S.ui.fokusZeigt=null; S.ui.fokusNav=null; S.ui.fokusOeff=null; S.ui.klGruppen=null; S.ui.tkWahl=null;
  S.ui.statDomain='alle'; S.ui.statDatum=null; S.ui.statOffen={}; S.ui.einstOffen=null; S.ui.malTopf=null;
  abv3.aktiv=false; abv3.zurueck=false; abv3.schritt=1; aufstehenTmp=null;
}
var DO='2026-10-01';
function tagDonnerstag(){ frisch(); uhr('2026-10-01T09:00:00+02:00'); tagStarten(70, DO); }
function aufgabe(id, dom, soll){ return neueKarte({ id:id, domain:dom, titel:'Karte '+id, sollMin:soll||30, faelligkeit:DO, erstelltTs:'2026-09-30T08:00:00+02:00', flowBaseline:true }); }
function nah(a, b, eps){ return Math.abs(a-b)<=(eps==null ? 0.05 : eps); }
function stil(id){ return el(id).style; }
// die Punkte der Statusleiste fest vorgeben (wie in v33-abnahme)
var _belIstDfm=belIstDfm, _tagesPunkteDomain=tagesPunkteDomain;
function punkte(dfm, privat){ belIstDfm=function(){ return dfm; }; tagesPunkteDomain=function(d){ return d==='dfm' ? dfm : privat; }; }
function punkteEcht(){ belIstDfm=_belIstDfm; tagesPunkteDomain=_tagesPunkteDomain; }

kopf('Version');
ok('APP_VERSION 3.5.4 · Datenvertrag bleibt 2.1.0 · Build 2026-10-02-6', APP_VERSION==='3.6.1' && UI_VERSION==='v3.6.1' && DATENVERTRAG==='2.1.0' && APP_BUILD==='2026-10-02-6');

/* ══ (a) Restzeit ═════════════════════════════════════════════════════ */
kopf('(a) Uhr der Statusleiste: Restzeit mit Vorzeichen und Ampelfarbe');
var ra=restzeitAnzeige(90, 77.5*60);
ok('(a) offen: Soll 90 Min, Ist 77:30 → „−12:30" GRUEN', ra.text==='−12:30' && ra.farbe===FARBE.GRUEN && ra.art==='offen');
var rb=restzeitAnzeige(90, 99*60);
ok('(a) +10 % überzogen: Ist 99 Min → „+09:00" GELB', rb.text==='+09:00' && rb.farbe===FARBE.GELB);
var rc=restzeitAnzeige(90, 112.5*60);
ok('(a) +25 % überzogen: Ist 112:30 → „+22:30" ROT', rc.text==='+22:30' && rc.farbe===FARBE.ROT);
ok('(a) Grenze: genau 20 % überzogen (+18:00) noch GELB, eine Sekunde mehr ROT', restzeitAnzeige(90, 108*60).farbe===FARBE.GELB && restzeitAnzeige(90, 108*60).text==='+18:00' && restzeitAnzeige(90, 108*60+1).farbe===FARBE.ROT);
ok('(a) genau am Soll: „−00:00" GRUEN; eine Sekunde darüber „+00:01" GELB', restzeitAnzeige(30, 1800).text==='−00:00' && restzeitAnzeige(30, 1800).farbe===FARBE.GRUEN && restzeitAnzeige(30, 1801).text==='+00:01' && restzeitAnzeige(30, 1801).farbe===FARBE.GELB);
var rd=restzeitAnzeige(0, 754);
ok('(a) ohne Soll (Routine, Counter): abgelaufene Zeit ohne Vorzeichen in WEISS („12:34")', rd.text==='12:34' && rd.farbe===FARBE.WEISS && rd.art==='ohne' && restzeitAnzeige(null, 59).text==='0:59' && restzeitAnzeige(undefined, 0).farbe===FARBE.WEISS);
ok('(a) ab einer Stunde mit Stunden: „−2:00:00", „+1:02:37"', restzeitAnzeige(120, 0).text==='−2:00:00' && restzeitAnzeige(60, 60*60+62*60+37).text==='+1:02:37');
tagDonnerstag();
S.karten=[ aufgabe('u1','dfm',60), neueKarte({ id:'u2', domain:'privat', titel:'Routine ohne Soll', sollMin:0, rhythmus:{typ:'taeglich'}, faelligkeit:DO }) ];
fokusStarten('u1', null); minuten(15); renderFokusleiste();
ok('(a) Statusleiste: laufende Karte (Soll 60, Ist 15) zeigt „−45:00" in GRUEN', String(el('fkTimer').textContent)==='−45:00' && el('fkTimer').style.color===FARBE.GRUEN);
minuten(51); renderFokusleiste();
ok('(a) … nach 66 Min „+06:00" in GELB, nach 80 Min „+20:00" in ROT', String(el('fkTimer').textContent)==='+06:00' && el('fkTimer').style.color===FARBE.GELB && (minuten(14), renderFokusleiste(), String(el('fkTimer').textContent)==='+20:00' && el('fkTimer').style.color===FARBE.ROT));
fokusBeenden(); fokusStarten('u2', null); minuten(3); renderFokusleiste();
ok('(a) … Karte ohne Soll: „3:00" in WEISS', String(el('fkTimer').textContent)==='3:00' && el('fkTimer').style.color===FARBE.WEISS);
fokusBeenden();

/* ══ (b) Punkteleiste ═════════════════════════════════════════════════ */
kopf('(b) Punkteleiste: Familienziel, Wachsen über die Grenze, rote Überschuss-Strecke');
var pA=punkteleisteTeile({ ziel:8500, zielDfm:5000, zielPrivat:3500, dfm:3200, privat:1200 });
ok('(b) A · DFM 3.200, Privat 1.200: kein Ziel erreicht, kein Überschuss, Grenze beim DFM-Ziel (5.000), Soll-Pille mittig auf der freien Strecke', !pA.dOk && !pA.pOk && pA.ueber===0 && pA.rotVon===null && pA.grenze===5000 && pA.mitte===(3200+7300)/2);
var pB=punkteleisteTeile({ ziel:8500, zielDfm:5000, zielPrivat:3500, dfm:5600, privat:1400 });
ok('(b) B · DFM 5.600 ≥ 5.000: DFM-Ziel erreicht („✓", Grenze links GRUEN), Gesamtziel offen → DFM wächst über die feste Grenze', pB.dOk && !pB.pOk && pB.ueber===0 && pB.grenze===5000 && pB.dfm===5600 && pB.dfm>pB.grenze);
var pC=punkteleisteTeile({ ziel:8500, zielDfm:5000, zielPrivat:3500, dfm:6100, privat:3000 });
ok('(b) C · DFM 6.100 + Privat 3.000 − Gesamtziel 8.500 = Überschuss 600 an der Position [8.500 − 3.000 … 6.100] = [5.500 … 6.100]', pC.ueber===600 && pC.rotVon===5500 && pC.rotBis===6100 && pC.rotBis-pC.rotVon===pC.ueber && pC.mitte===5800);
ok('(b) Privat-Ziel erreicht → „✓" rechts; beide erreicht → Grenze beidseitig GRUEN', punkteleisteTeile({ ziel:8500, zielDfm:5000, zielPrivat:3500, dfm:1000, privat:3500 }).pOk && !punkteleisteTeile({ ziel:8500, zielDfm:5000, zielPrivat:3500, dfm:1000, privat:3499 }).pOk &&
   (function(){ var p=punkteleisteTeile({ ziel:8500, zielDfm:5000, zielPrivat:3500, dfm:5000, privat:3500 }); return p.dOk && p.pOk && p.ueber===0; })());
ok('(b) eine Familie allein über dem Gesamtziel: die rote Strecke bleibt in der Leiste (Privat 9.000 → [0 … DFM])', (function(){ var p=punkteleisteTeile({ ziel:8500, zielDfm:5000, zielPrivat:3500, dfm:400, privat:9000 }); return p.ueber===900 && p.rotVon===0 && p.rotBis===400 && p.privat===8500; })());
ok('(b) ohne Familienziel (z. B. Wochenende, Ziel 0) kein „✓"', !punkteleisteTeile({ ziel:800, zielDfm:0, zielPrivat:800, dfm:0, privat:10 }).dOk);
tagDonnerstag();
var gz=diaGroessen(), zD=gz.zielDfm, zP=gz.zielPrivat, zG=gz.zielHeute, pzT=function(v){ return (Math.max(0, Math.min(100, v/zG*100))).toFixed(1)+'%'; };
print('   Ziele heute: DFM '+zD+' · Privat '+zP+' · gesamt '+zG);
punkte(zD*0.6, zP*0.5); renderStatusbar();
ok('(b) Statusleiste A: Grenze weiß gepunktet beim DFM-Ziel, keine rote Strecke, Zahlen ohne „✓", Soll-Pille', el('sBarSollMark').className==='sollmark' && stil('sBarSollMark').left===pzT(zD) && stil('sBarRot').display==='none' &&
   String(el('sBarZD').textContent)===fmtP(Math.round(zD*0.6)) && String(el('sBarZP').textContent)===fmtP(Math.round(zP*0.5)) && el('sPhSoll').className==='' && String(el('sPhSoll').textContent).charAt(0)!=='+');
punkte(zD+200, zP*0.25); renderStatusbar();
ok('(b) Statusleiste B: DFM über Ziel, Gesamtziel offen → Grenze „okL" (links GRUEN), „✓ " vor der DFM-Zahl, DFM-Füllung über die Grenze, keine rote Strecke', el('sBarSollMark').className==='sollmark okL' && stil('sBarSollMark').left===pzT(zD) &&
   String(el('sBarZD').textContent)==='✓ '+fmtP(zD+200) && String(el('sBarZP').textContent).indexOf('✓')<0 && parseFloat(stil('sBarIstD').width)>parseFloat(stil('sBarSollMark').left) && stil('sBarRot').display==='none');
punkte(zD+300, zP+300); renderStatusbar();
ok('(b) Statusleiste C: Gesamtziel um 600 überschritten → rote Strecke ab [Gesamtziel − Privat] mit Breite 600, „+600" ohne Pille statt Soll, beide „✓", Grenze beidseitig GRUEN', stil('sBarRot').display==='block' && stil('sBarRot').left===pzT(zG-(zP+300)) &&
   nah(parseFloat(stil('sBarRot').width), 600/zG*100, 0.11) && stil('sBarRot').background===FARBE.ROT && String(el('sPhSoll').textContent)==='+600' && el('sPhSoll').className==='rp' &&
   el('sBarSollMark').className==='sollmark okL okR' && String(el('sBarZD').textContent).indexOf('✓ ')===0 && String(el('sBarZP').textContent).indexOf('✓ ')===0 && nah(parseFloat(stil('sBarZS').left), (zG-(zP+300)+zD+300)/2/zG*100, 0.11));
ok('(b) UEBER wird in der Punkteleiste nicht mehr verwendet', !/id="sBarUeber"/.test(src) && !/#statusbar \.sb-bar \.ueber/.test(src) && /#statusbar \.sb-bar \.sollmark\.okL\{/.test(src) && /#statusbar \.sb-bar \.sollmark\.okL\.okR\{background:#3ecf8e\}/.test(src));
punkteEcht();

/* ══ (c) Ringe ════════════════════════════════════════════════════════ */
kopf('(c) Der Tag: Ringe DFM / Privat mit Überschussbogen');
var U=2*Math.PI*52;
ok('(c) 5.600 von 5.000: Ring voll (q = 1), Überschussbogen = 600 ÷ 5.000 = 12 % des Kreises', ringTeile(5600, 5000).q===1 && nah(ringTeile(5600, 5000).ue, 0.12, 1e-9));
ok('(c) 2.100 von 3.500: 60 % gefüllt, kein Überschussbogen', nah(ringTeile(2100, 3500).q, 0.6, 1e-9) && ringTeile(2100, 3500).ue===0);
ok('(c) höchstens ein voller Kreis (12.000 von 5.000 → ue = 1); genau am Ziel kein Bogen; ohne Ziel kein Bogen', ringTeile(12000, 5000).ue===1 && ringTeile(5000, 5000).ue===0 && ringTeile(5000, 5000).q===1 && ringTeile(300, 0).ue===0 && ringTeile(0, 0).q===0);
var sU=familienRingSvg('DFM', FARBE.BLAU, FARBE.BLAU_HELL, 5600, 5000, 250), sO=familienRingSvg('Privat', FARBE.LILA, FARBE.LILA_HELL, 2100, 3500, 155);
ok('(c) Bogen im Bild: ROT 12 px ab 12 Uhr mit Länge 12 % des Umfangs ('+(0.12*U).toFixed(1)+'), darunter dunkler Rand (2 px je Seite)', sU.indexOf('class="rg-ueber" cx="60" cy="60" r="52" fill="none" stroke="'+FARBE.ROT+'" stroke-width="12" stroke-linecap="round" stroke-dasharray="'+(0.12*U).toFixed(1)+' '+U.toFixed(1)+'" transform="rotate(-90 60 60)"')>=0 &&
   sU.indexOf('class="rg-rand"')>=0 && sU.indexOf('stroke-width="16" stroke-dasharray="'+(0.12*U).toFixed(1))>=0 && sU.indexOf('class="rg-rand"')<sU.indexOf('class="rg-ueber"'));
ok('(c) unter Ziel: Füllung 60 % des Umfangs im Familien-Verlauf, kein roter Bogen; Bahn LEER, Strich 12 px', sO.indexOf('rg-ueber')<0 && sO.indexOf('rg-rand')<0 && sO.indexOf('stroke-dasharray="'+(0.6*U).toFixed(1)+' '+U.toFixed(1)+'"')>=0 &&
   sO.indexOf('stroke="'+FARBE.LEER+'" stroke-width="12"')>=0 && sO.indexOf('<stop offset="0" stop-color="'+FARBE.LILA_HELL+'"/><stop offset="1" stop-color="'+FARBE.LILA+'"/>')>=0);
ok('(c) Mitte: Name in der hellen Familienfarbe (11 px), Zeit „4:10" WEISS 22 px, „5.600 / 5.000" GRAU 11 px', sU.indexOf('fill="'+FARBE.BLAU_HELL+'" font-size="11" font-weight="700" text-anchor="middle">DFM</text>')>=0 &&
   sU.indexOf('fill="#fff" font-size="22" font-weight="750" text-anchor="middle">4:10</text>')>=0 && sU.indexOf('fill="'+FARBE.GRAU+'" font-size="11" text-anchor="middle">5.600 / 5.000</text>')>=0 && sU.indexOf('viewBox="0 0 120 120"')>=0);
ok('(c) leerer Ring ohne Füllkreis (kein Punkt bei 0)', familienRingSvg('DFM', FARBE.BLAU, FARBE.BLAU_HELL, 0, 5000, 0).indexOf('rg-ist')<0);
tagDonnerstag();
S.karten=[ aufgabe('r1','dfm',60), aufgabe('r2','privat',30), neueKarte({ id:'r3', domain:'privat', titel:'Zähler', rhythmus:{typ:'taeglich'}, faelligkeit:DO, ticksAktiv:true, tickMinuten:5 }) ];
fokusStarten('r1', null); minuten(25); fokusBeenden(); fokusStarten('r2', null); minuten(10);
var fz=familienZeitHeute();
ok('(c) Zeit in der Mitte: gebuchte Minuten der Familie, laufende Uhr live (DFM 25, Privat 10)', Math.round(fz.dfm)===25 && Math.round(fz.privat)===10);
fokusBeenden();
var vorTick=familienZeitHeute().privat; S.unteraufgaben=S.unteraufgaben||[]; tickLogHeute(kid('r3')).push({ ts:jetztIso(), nr:1, basis:0, faktor:1, punkte:0, min:5 });
ok('(c) … Ticks zählen mit ihren tickMinuten als Zeit der Familie (+5 Min Privat)', nah(familienZeitHeute().privat-vorTick, 5, 1e-6));
var fokH=fokusBloecke350(kid('r1')), statH=stmTag(analyseFenster(), 'alle');
ok('(c) Fokus: die Ringe stehen als erste Zeile direkt über „Tempo und Blöcke"; Statistik „Der Tag": oben im Modul — dieselbe Funktion', fokH.indexOf('class="ringe"')>=0 && fokH.indexOf('class="ringe"')<fokH.indexOf('Tempo und Blöcke') &&
   statH.indexOf('class="ringe"')>=0 && statH.indexOf('class="ringe"')<statH.indexOf('<b>Tagesprognose</b>') && (src.match(/function tagesRingeHtml\(/g)||[]).length===1 && (src.match(/function familienRingSvg\(/g)||[]).length===1 &&
   (fokH.match(/class="rg-svg"/g)||[]).length===2 && (statH.match(/class="rg-svg"/g)||[]).length===2);

/* ══ (d) Kaufhinweis ══════════════════════════════════════════════════ */
kopf('(d) Kaufhinweis und Zählung bis zum nächsten nicht bezahlbaren Kauf');
var KAND=[ {kat:'c', name:'Reisen', preis:900, stufe:3}, {kat:'a', name:'Soziales', preis:600, stufe:2}, {kat:'b', name:'Begleiter', preis:700, stufe:1} ];
var k0=kaufStandVon(500, KAND);
ok('(d) Konto 500, günstigster Preis 600: kein Hinweis; Ziel der Grafiken = der günstigste Kauf (wie bisher), fehlen 100', k0.hinweis==='' && k0.text==='' && k0.moeglich.length===0 && k0.ziel.name==='Soziales' && k0.fehlt===100 && nah(k0.anteil, 500/600, 1e-9));
var k1=kaufStandVon(650, KAND);
ok('(d) Konto 650: „Kauf möglich: Soziales Stufe 2"; gezählt wird bis zum günstigsten Objekt über dem Konto → „bis Begleiter Stufe 1: fehlen 50"', k1.hinweis==='Kauf möglich: Soziales Stufe 2' && k1.ziel.name==='Begleiter' && k1.fehlt===50 && k1.text==='bis Begleiter Stufe 1: fehlen 50' && nah(k1.anteil, 650/700, 1e-9));
ok('(d) nichts wird vorher abgezogen (Entscheidung 1): fehlen = Preis − Konto, nicht Preis − (Konto − günstigster Kauf)', k1.fehlt===700-650 && k1.fehlt!==700-(650-600));
var k2=kaufStandVon(750, KAND);
ok('(d) Konto 750: zwei bezahlbar → „Kauf möglich: 2 Objekte", gezählt bis Reisen Stufe 3 (fehlen 150)', k2.hinweis==='Kauf möglich: 2 Objekte' && k2.ziel.name==='Reisen' && k2.text==='bis Reisen Stufe 3: fehlen 150');
var k3=kaufStandVon(1000, KAND);
ok('(d) Konto 1.000: alles bezahlbar → „Kauf möglich: 3 Objekte", kein offenes Ziel, Grafik voll', k3.hinweis==='Kauf möglich: 3 Objekte' && k3.ziel===null && k3.text==='' && k3.anteil===1 && k3.fehlt===0);
ok('(d) Preis genau erreicht zählt als möglich; ohne Kandidaten kein Hinweis', kaufStandVon(600, KAND).hinweis==='Kauf möglich: Soziales Stufe 2' && kaufStandVon(600, []).hinweis==='' && kaufStandVon(600, []).ziel===null);
tagDonnerstag(); S.belohnung=null; belohnungInit();
var kandE=kaufKandidaten(), pMin=kandE[0].preis, pZwei=kandE[1].preis;
print('   Preise aufsteigend: '+kandE.map(function(x){ return x.name+' '+x.preis; }).join(' · '));
S.meta.muenzenGesamt=num(S.meta.muenzenGesamt)+(pMin+1)-konto();
var ksE=kaufStand();
ok('(d) echter Bestand: Konto = günstigster Preis + 1 → Hinweis „Kauf möglich: '+kandE[0].name+' Stufe '+kandE[0].stufe+'", Zählung bis '+kandE[1].name, pZwei>pMin+1 && ksE.hinweis==='Kauf möglich: '+kandE[0].name+' Stufe '+kandE[0].stufe &&
   kandE[0].stufe===num(S.belohnung.stufen[kandE[0].kat])+1 && ksE.ziel.kat===kandE[1].kat && ksE.fehlt===pZwei-(pMin+1) && ksE.text==='bis '+kandE[1].name+' Stufe '+kandE[1].stufe+': fehlen '+fmtP(pZwei-pMin-1));
_kul[1]={ json:{ felder:[{feld:1,farbe:0,anteil:.5,flaechePx:100},{feld:2,farbe:1,anteil:.5,flaechePx:100}], farben:[{farbe:0,hex:'#111111'},{farbe:1,hex:'#222222'},{farbe:2,hex:'#333333'}] },
  punkte:{1:1000, 2:800}, farbeVon:{1:0, 2:1}, maxP:1000, hex:['#111111','#222222','#333333'], namen:['Ocker','Schwarz','Blau'], topFarben:['#111111','#222222'] };
var gold='style="color:'+FARBE.GOLD+'">'+ksE.hinweis;
var bu=belUebersichtHtml();
ok('(d) Shop: Hinweis in GOLD über der Shop-Übersicht und in beiden Kacheln „Nächster Kauf", darunter „'+ksE.text+'"', bu.indexOf('<div class="kauf-hinweis" style="color:'+FARBE.GOLD+'">'+ksE.hinweis+'</div>')>=0 &&
   (bu.match(new RegExp('class="w klein kauf-w" style="color:'+FARBE.GOLD+'">Kauf möglich','g'))||[]).length===2 && (bu.split(ksE.text).length-1)===2 && bu.indexOf('id="belShop">Shop</div><div class="kauf-hinweis"')>=0);
var sp=stmSpielShop(analyseFenster(), 'alle');
ok('(d) Statistik „Meilensteine": Hinweis in GOLD über dem Zeitstrahl und in „Bis zum nächsten Kauf"; der Balken zählt bis '+kandE[1].name+' ('+fmtP(pMin+1)+' von '+fmtP(pZwei)+')', sp.indexOf('<div class="kauf-hinweis" '+gold)>=0 && sp.indexOf('class="w klein kauf-w" '+gold)>=0 &&
   sp.indexOf('<div class="s">'+ksE.text+'</div>')>=0 && sp.indexOf('<div class="skala"><span>'+fmtP(pMin+1)+'</span><span>'+fmtP(pZwei)+'</span></div>')>=0 && sp.indexOf('width:'+((pMin+1)/pZwei*100).toFixed(1)+'%')>=0);
renderStatusbar(); renderFokusleiste();
ok('(d) die Statusleiste trägt keinen Kaufhinweis', String(el('statusbar').innerHTML||'').indexOf('Kauf möglich')<0 && String(el('sZTempo').innerHTML||'').indexOf('Kauf möglich')<0 && rumpf('renderStatusbar').indexOf('kaufHinweis')<0);
S.meta.muenzenGesamt=num(S.meta.muenzenGesamt)-(konto()-(pMin-1));
ok('(d) Konto = günstigster Preis − 1: kein Hinweis, Kachel und Balken wie bisher („fehlen 1")', kaufStand().hinweis==='' && belUebersichtHtml().indexOf('Kauf möglich')<0 && stmSpielShop(analyseFenster(), 'alle').indexOf('Kauf möglich')<0 && stmSpielShop(analyseFenster(), 'alle').indexOf('fehlen 1<')>=0);
ok('(d) der Hinweis nennt nur Objekt und Stufen-Nummer, nie den Inhalt einer Stufe', rumpf('kaufStandVon').indexOf('stufen[')<0 && rumpf('kaufKandidaten').indexOf('.stufen[kk])+1')>=0 && rumpf('kaufKandidaten').indexOf('BELOHNUNG[kk].stufen')<0);
function rumpf(name){ var a=src.indexOf('function '+name+'('), b=src.indexOf('\nfunction ', a+10); return a<0 ? '' : src.slice(a, b<0 ? src.length : b); }

/* ══ (e) Topf unter 2 % ═══════════════════════════════════════════════ */
kopf('(e) Farbtöpfe: unter 2 % der Fassung gilt der Topf als leer');
tagDonnerstag(); S.belohnung=null; belohnungInit();
var T=topfFassung();
ok('(e) Vorbereitung: Fassung = größtes Feld × Aufschlag (1.000 × 1,2 = 1.200), Grenze 2 % = 24 P', T===1200 && ausmalEinst().topfLeerAnteil===0.02);
var _ausmalW=ausmalW, wTest=0; ausmalW=function(){ return wTest; };
S.meta.ausmalen={ kulisse:1, gefaerbt:[], toepfe:[{farbe:0, punkte:500},{farbe:null, punkte:0},{farbe:null, punkte:0},{farbe:null, punkte:0},{farbe:null, punkte:0}], aktiverTopf:0, stationFarbe:0, tank:0, wohlstandSeitReset:0, freigeschaltetBis:1, fertig:[], verteilt:0 };
var A=ausmalState(), t0=A.toepfe[0];
ok('(e) Topf mit 500 P (42 %) ist nicht leer: Farbwechsel abgewiesen („erst leeren oder Topf wechseln")', !topfLeer(t0) && stationFarbeWaehlen(1)===false && t0.farbe===0 && t0.punkte===500 && A.stationFarbe===0);
topfAuskippen(0);
ok('(e) geleert: Topf 0 % ohne Farbe', t0.punkte===0 && t0.farbe===null && topfLeer(t0));
wTest=10; ausmalVerteilen();   // der Tick zwischen Leeren und Wechseln
print('   nach dem Tick: Topf '+t0.punkte+' P = '+(t0.punkte/T*100).toFixed(1)+' % · Farbe '+t0.farbe+' · Tank '+A.tank);
ok('(e) ein Tick dazwischen füllt den Topf minimal: 10 P = 0,8 % in der Stationsfarbe', t0.punkte===10 && t0.farbe===0 && nah(t0.punkte/T*100, 0.8, 0.05) && A.tank===0);
ok('(e) 0,8 % gilt als leer (unter 2 %)', topfLeer(t0) && !topfVoll(t0));
var mm=belMalmodusHtml(), bu2=belUebersichtHtml();
ok('(e) Anzeige „leer" statt Prozent; der Topf zählt nicht als „füllt" (0 voll · 0 füllt · 5 leer); nicht unter „Töpfe mit Farbe"', mm.indexOf('<span>aktiv leer</span>')>=0 && mm.indexOf('aktiv 1 %')<0 && mm.indexOf('data-malwahl=')<0 && bu2.indexOf('0 voll · 0 füllt · 5 leer')>=0);
var gewechselt=stationFarbeWaehlen(1);
ok('(e) Wechsel ohne Auskippen möglich: die Station nimmt Schwarz, der Topf übernimmt die neue Farbe', gewechselt===true && A.stationFarbe===1 && t0.farbe===1 && t0.punkte===0);
ok('(e) die 0,8 % (10 P) landen im Tank — nichts geht verloren', A.tank===10);
// Grenze: genau 2 % ist nicht mehr leer
S.meta.ausmalen.toepfe[0]={farbe:0, punkte:24}; S.meta.ausmalen.stationFarbe=0; S.meta.ausmalen.tank=0; A=ausmalState(); t0=A.toepfe[0];
ok('(e) genau 2 % (24 P) ist nicht leer: „aktiv 2 %", zählt als „füllt", Wechsel abgewiesen; 23 P (1,9 %) ist leer', !topfLeer(t0) && belMalmodusHtml().indexOf('<span>aktiv 2 %</span>')>=0 && belUebersichtHtml().indexOf('0 voll · 1 füllt · 4 leer')>=0 && stationFarbeWaehlen(1)===false &&
   (t0.punkte=23, topfLeer(t0)));
// „Topf wechseln": ein Topf mit Rest unter 2 % kommt unter die Station einer anderen Farbe
S.meta.ausmalen.toepfe=[{farbe:0, punkte:600},{farbe:2, punkte:15},{farbe:null, punkte:0},{farbe:null, punkte:0},{farbe:null, punkte:0}]; S.meta.ausmalen.aktiverTopf=0; S.meta.ausmalen.stationFarbe=0; S.meta.ausmalen.tank=0;
A=ausmalState(); topfUnterStation(1);
ok('(e) Topf wechseln: der Topf mit 15 P Blau (1,3 %) gilt als leer — er übernimmt die Stationsfarbe, sein Rest geht über den Tank in ihn zurück (15 P Ocker), die Station bleibt Ocker', A.aktiverTopf===1 && A.stationFarbe===0 && A.toepfe[1].farbe===0 && A.toepfe[1].punkte===15 && A.tank===0);
S.meta.ausmalen.toepfe[2]={farbe:2, punkte:300}; A=ausmalState(); topfUnterStation(2);
ok('(e) … ein Topf mit 300 P Blau (25 %) behält seine Farbe: die Station wechselt auf Blau (wie bisher)', A.aktiverTopf===2 && A.stationFarbe===2 && A.toepfe[2].farbe===2 && A.toepfe[2].punkte===300);
ok('(e) Auswahl-Sheet „Topf unter die Station": Töpfe unter 2 % heißen „leer"', (function(){ S.meta.ausmalen.toepfe[3]={farbe:1, punkte:5}; topfWechselSheet(); var h=el('sheetBody').innerHTML; return /Topf 4 · leer/.test(h) && /Topf 3 · Blau · /.test(h); })());
ausmalW=_ausmalW; delete _kul[1];

/* ══ (f) obere Fokus-Navigation ═══════════════════════════════════════ */
kopf('(f) Fokusansicht: „◀ Verlauf" und „nächste ▶" oben');
tagDonnerstag();
S.karten=[aufgabe('n1','dfm'), aufgabe('n2','dfm'), aufgabe('n3','dfm'), aufgabe('n4','dfm')];
var kand=fokusKandidaten().map(function(k){ return k.id; });
fokusKarteAnsehen(kand[0]); renderFokus();
var pos=function(){ return kand.indexOf(aktiveFokusKarte().id); }, fv=function(){ return el('fokusView').innerHTML; };
var oben=function(){ var h=fv(), a=h.indexOf('<div class="knav fk-swipe fk-oben">'), b=h.indexOf('</div>', a); return a<0 ? '' : h.slice(a, b); };
ok('(f) oben in der Karte stehen die beiden Knöpfe — vor dem Titel, „Zur Suche" ist entfallen', oben().indexOf('data-fkswipe="1">◀ Verlauf</button>')>=0 && oben().indexOf('data-fkswipe="-1">nächste ▶</button>')>oben().indexOf('◀ Verlauf') &&
   fv().indexOf('fk-oben')<fv().indexOf('fk-haupttitel') && fv().indexOf('Zur Suche')<0 && fv().indexOf('data-fokuszu')<0 && !/data-fokuszu/.test(src));
ok('(f) die untere Navigation bleibt (zwei Knopfpaare, dieselben Attribute)', (fv().match(/data-fkswipe="1"/g)||[]).length===2 && (fv().match(/data-fkswipe="-1"/g)||[]).length===2 && fv().indexOf('class="punkte5"')>=0);
ok('(f) gleiche Regeln: ohne Verlauf ist „◀ Verlauf" oben wie unten ausgegraut, „nächste ▶" aktiv', /class="sw l aus" data-fkswipe="1"/.test(oben()) && /class="sw r" data-fkswipe="-1"/.test(oben()) && (fv().match(/class="sw l aus" data-fkswipe="1"/g)||[]).length===2);
ok('(f) ein Klick-Weg für beide Knopfpaare: closest(\'[data-fkswipe]\') → fokusSwipeSchritt', (src.match(/closest\('\[data-fkswipe\]'\)/g)||[]).length===1 && /fokusSwipeSchritt\(parseInt\(fsw\.dataset\.fkswipe,10\)\)/.test(src));
// Tipp auf den OBEREN Knopf: sein Attribut in den gemeinsamen Schritt
var tippOben=function(r){ var m=oben().match(new RegExp('class="sw [lr]( aus)?" data-fkswipe="'+r+'"')); if(!m || m[1]) return false; return fokusSwipeSchritt(parseInt(String(r), 10)); };
ok('(f) Start auf Karte 1 von 4', pos()===0);
minuten(1); var s1=tippOben(-1);
ok('(f) ein Tipp auf „nächste ▶" oben bewegt genau eine Karte (1 → 2)', s1===true && pos()===1);
var s2=tippOben(-1);
ok('(f) ein zweiter Tipp im selben Moment bewegt keine weitere Karte (ein Schritt je Tipp)', s2===false && pos()===1);
minuten(1); tippOben(-1);
ok('(f) der nächste Tipp wieder genau eine (2 → 3)', pos()===2);
minuten(1); var s3=tippOben(1);
ok('(f) „◀ Verlauf" oben: genau ein Schritt zurück zur zuletzt geöffneten Karte (3 → 2), Anzeige „im Verlauf"', s3===true && pos()===1 && fv().indexOf('im Verlauf')>=0 && /class="sw l" data-fkswipe="1"/.test(oben()));

/* ══ (g) Kopf der Tagesprognose ohne DFM-Zeit ═════════════════════════ */
kopf('(g) Tagesprognose: Kopf ohne DFM-Zeit (Entscheidung 4)');
tagDonnerstag();
S.karten=[ aufgabe('g1','dfm',60), aufgabe('g2','privat',30) ]; fokusStarten('g1', null); minuten(30); fokusBeenden();
kid('g1').status='erledigt'; kid('g1').tagId=aktuelleTagId();
uhr('2026-10-01T11:00:00+02:00');
var tp=tagesprognoseHeute(), dtF=derTagHtml(kid('g2')), dtS=derTagHtml(kid('g2'), {roh:true, bedienung:true, ringe:true});
ok('(g) Fokus: der Kopf zeigt nur „'+fmtP(tp.prognose)+' von Ziel '+fmtP(tp.ziel)+'"', dtF.indexOf('<b>Tagesprognose</b><span>'+fmtP(tp.prognose)+' von Ziel '+fmtP(tp.ziel)+'</span>')>=0 && dtF.indexOf('· DFM ')<0);
ok('(g) Statistik „Der Tag": derselbe Kopf', dtS.indexOf('<b>Tagesprognose</b><span>'+fmtP(tp.prognose)+' von Ziel '+fmtP(tp.ziel)+'</span>')>=0 && dtS.indexOf('· DFM ')<0 && stmTag(analyseFenster(), 'alle').indexOf('· DFM ')<0);
ok('(g) die Zeit steht im DFM-Ring (0:30); dfmZeitHeute gibt es nicht mehr', typeof dfmZeitHeute==='undefined' && !/function dfmZeitHeute\(/.test(src) && tagesRingeHtml().indexOf('text-anchor="middle">0:30</text>')>=0);

/* ══ §3 Statistik · §6 Einstellungen ══════════════════════════════════ */
kopf('§3 Statistik: „▴ Einklappen" und „Karten mit Faktor"');
tagDonnerstag();
S.karten=[ aufgabe('m1','dfm',60), aufgabe('m2','dfm',30) ]; kid('m1').matrixFeld='werkzeug';
S.intraday.push({ ts:'2026-09-30T10:00:00+02:00', kartenId:'m1', domaene:'dfm', punkte:160, minuten:60, typ:'timer' }, { ts:'2026-09-30T11:00:00+02:00', kartenId:'m2', domaene:'dfm', punkte:90, minuten:30, typ:'timer' });
var mod=function(id, offen){ S.ui.statOffen={}; S.ui.statOffen[id]=offen; return id==='tag' ? stmTag(analyseFenster(), 'alle') : anModMatrixfaktor(analyseFenster(), 'alle'); };
ok('§3 aufgeklapptes Modul trägt am unteren Ende „▴ Einklappen" (44 px, volle Breite); zugeklappt nicht', /<button type="button" class="stm-zu" data-stmzu="tag">▴ Einklappen<\/button><\/div>$/.test(mod('tag', true)) && mod('tag', false).indexOf('data-stmzu')<0 &&
   /\.stm-zu\{[^}]*width:100%;height:44px;/.test(src) && mod('matrixfaktor', true).indexOf('data-stmzu="matrixfaktor"')>=0);
S.ui.statOffen={ matrixfaktor:true, tag:true }; statModulEinklappen('matrixfaktor');
ok('§3 Tipp klappt genau dieses Modul zu (und holt den Kopf an den oberen Rand: scrollIntoView, Abstand = Höhe der Statusleiste)', S.ui.statOffen.matrixfaktor===false && S.ui.statOffen.tag===true && /scrollIntoView\(\{behavior:'smooth', block:'start'\}\)/.test(rumpf('statModulEinklappen')) &&
   /\.stm\[data-stmodul\]\{scroll-margin-top:calc\(var\(--tbH,160px\) \+ 8px\)\}/.test(src));
var mfM=mod('matrixfaktor', true), mfA=mfAnsichtHtml();
ok('§3 Matrixfaktor: im Modul der Knopf „Karten mit Faktor (1) ›", die Liste selbst steht nicht mehr im Modul; Balken und KPIs bleiben', mfM.indexOf('data-mfansicht="1">Karten mit Faktor (1) ›</button>')>=0 && mfM.indexOf('class="mf-k"')<0 && mfM.indexOf('data-mfedit')<0 &&
   mfM.indexOf('class="mf-liste"')>=0 && mfM.indexOf('effektiver Ø-Faktor')>=0);
ok('§3 Ansicht „Karten mit Faktor": dieselben Zeilen mit Bearbeiten (✎), Vollbild mit Zurück-Knopf oben links', mfA.indexOf('Karten mit Faktor ≠ 1,0 · 1')>=0 && mfA.indexOf('data-mfedit="m1">✎</button>')>=0 && mfA.indexOf('m2')<0 &&
   /<div id="mfOverlay" class="voll-ansicht" hidden>\s*<div class="an-kopf">\s*<button id="mfBack" class="an-back"/.test(src) && /\.voll-ansicht\{position:fixed;inset:0;z-index:199;/.test(src));

kopf('§6 Einstellungen: klappbare Abschnitte');
tagDonnerstag();
S.karten=[ neueKarte({ id:'e1', domain:'privat', titel:'Wasser', rhythmus:{typ:'taeglich'}, faelligkeit:DO }), neueKarte({ id:'e2', domain:'privat', titel:'Küche', rhythmus:{typ:'taeglich'}, faelligkeit:DO }) ];
S.routinenGruppen=[ { id:'rg1', name:'Abendrunde', domain:'privat', mitglieder:['e1','e2'], komplettBonus:200 } ];
renderEinst();
var eb=function(){ return el('einstBody').innerHTML; }, abschnitt=function(id){ var h=eb(), a=h.indexOf('data-einstabschnitt="'+id+'"'), b=h.indexOf('data-einstabschnitt="', a+20); return a<0 ? '' : h.slice(a, b<0 ? h.length : b); };
var ids=(eb().match(/data-einstab="([^"]+)"/g)||[]).map(function(x){ return x.slice(14,-1); });
print('   Abschnitte: '+ids.join(' · '));
ok('§6 Standard: alle Abschnitte zu — nur Kopfzeilen, kein Inhalt (kein Import-Feld, keine Eingabe)', ids.length>=12 && ids.indexOf('import')===0 && ids.indexOf('punkte-balance')>0 && eb().indexOf('es-inh')<0 && eb().indexOf('id="einstImport"')<0 && eb().indexOf('<input')<0 &&
   (eb().match(/aria-expanded="false"/g)||[]).length===ids.length);
ok('§6 Kopfzeile: Titel, Anzahl Einträge, Chevron wie in der Statistik (44 px)', /<div class="es-k" data-einstab="punkte-balance" role="button" aria-expanded="false"><b>Punkte-Balance<\/b><span class="anz">7<\/span><span class="stm-tog" aria-hidden="true"><svg/.test(eb()) &&
   /<b>Routinen-Gruppen<\/b><span class="anz">1<\/span>/.test(eb()) && /\.es-k\{display:flex;align-items:center;gap:8px;min-height:44px;/.test(src));
einstAbschnittUmschalten('punkte-balance'); renderEinst();
ok('§6 ein Abschnitt lässt sich einzeln öffnen: Punkte-Balance offen (Eingabefelder da), alle anderen zu', abschnitt('punkte-balance').indexOf('data-setting="basisProStdDfm"')>=0 && /aria-expanded="true"/.test(abschnitt('punkte-balance')) &&
   (eb().match(/aria-expanded="true"/g)||[]).length===1 && eb().indexOf('id="einstImport"')<0);
einstAbschnittUmschalten('routinen-gruppen'); renderEinst();
ok('§6 jede Routinen-Gruppe ist ein eigener Abschnitt: Kopf „Abendrunde" mit 2 Mitgliedern, zunächst zu', /data-einstabschnitt="grp-rg1"><div class="es-k" data-einstab="grp-rg1" role="button" aria-expanded="false"><b>Abendrunde<\/b><span class="anz">2<\/span>/.test(eb()) && eb().indexOf('data-grpname="rg1"')<0);
einstAbschnittUmschalten('grp-rg1'); renderEinst();
ok('§6 … geöffnet zeigt sie Name, Bonus und Mitglieder', eb().indexOf('data-grpname="rg1"')>=0 && eb().indexOf('data-grpm="rg1"')>=0);
renderAlles(); renderEinst();
var ui2=JSON.parse(JSON.stringify(S.ui));
ok('§6 der Klappzustand je Abschnitt bleibt über das Neuzeichnen und lebt im UI-Zustand (S.ui.einstOffen), nicht im Export', ui2.einstOffen['punkte-balance']===true && ui2.einstOffen['routinen-gruppen']===true && ui2.einstOffen['grp-rg1']===true && ui2.einstOffen['import']===undefined &&
   abschnitt('punkte-balance').indexOf('data-setting="basisProStdDfm"')>=0 && JSON.stringify(syncExport('delta')).indexOf('einstOffen')<0);
einstAbschnittUmschalten('punkte-balance'); renderEinst();
ok('§6 … und wieder zu', abschnitt('punkte-balance').indexOf('data-setting=')<0 && S.ui.einstOffen['punkte-balance']===false);
ok('§6 Tipp auf die Kopfzeile schaltet um (ein Handler auf dem Einstellungs-Körper)', /closest\('\[data-einstab\]'\); if\(esk\)\{ haptik\(6\); einstAbschnittUmschalten\(esk\.dataset\.einstab\); renderEinst\(\); return; \}/.test(src));

print('');
if(fails){ print(fails+' von '+n+' FEHLGESCHLAGEN'); throw new Error('Abnahme rot'); }
print('alle '+n+' Abnahmepunkte gruen');
