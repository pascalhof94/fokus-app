/* Abnahme Hotfix v3.5.1 — die vier neuen Tests des Auftrags (§6) und die Regeln dahinter.
   Die Uhr ist verstellbar (uhr/minuten aus tests/v351-abnahme.js). */
var fails=0, n=0;
function ok(t,c){ n++; print((c?'OK   ':'FAIL ')+t); if(!c) fails++; }
function kopf(t){ print(''); print('── '+t+' ──'); }
function kid(id){ return S.karten.filter(function(k){ return k.id===id; })[0]; }
function frisch(){
  _store={}; S.karten=[]; S.unteraufgaben=[]; S.historie=[]; S.intraday=[]; S.routinenGruppen=[];
  S.meta={ wohlstand:0, seeded:true, migration200:true }; S.settings=settingsMerge({});
  S.tag=null; S.fokus=null; S.meta.ketten=null; matrixTmp=null; S.ui.fokusOffen=false; S.ui.fokusZeigt=null; S.ui.fokusNav=null; S.ui.fokusOeff=null;
  abv3.aktiv=false; abv3.zurueck=false; abv3.schritt=1; aufstehenTmp=null;
}
var DO='2026-10-01', FR='2026-10-02';
function tagDonnerstag(){ frisch(); uhr('2026-10-01T09:00:00+02:00'); tagStarten(70, DO); }
function aufgabe(id, dom, soll){ return neueKarte({ id:id, domain:dom, titel:'Karte '+id, sollMin:soll||30, faelligkeit:DO, erstelltTs:'2026-09-30T08:00:00+02:00', flowBaseline:true }); }

kopf('Version');
ok('APP_VERSION aktuell (3.5.2) · Datenvertrag bleibt 2.1.0', APP_VERSION==='3.5.4' && UI_VERSION==='v3.5.4' && DATENVERTRAG==='2.1.0' && APP_BUILD==='2026-10-02-4');

/* ══ (a) Schieben ohne Abzug erhöht „geschoben" nicht ══════════════════ */
kopf('(a) Geschoben zählt nur mit Punktabzug oder beim Tagesabschluss');
tagDonnerstag();
S.karten=[aufgabe('a1','dfm'), aufgabe('a2','dfm'), aufgabe('a3','dfm')];
var gesch=function(d){ return reinRausTag(anFlowReihe('dfm', {routinen:true}), d).geschoben; };
var reinFr=function(){ return reinRausTag(anFlowReihe('dfm', {routinen:true}), FR).rein; };
var rein0=reinFr();
karteSchieben(kid('a1'), FR, null, 0);
ok('(a) Schieben OHNE Abzug: Datum gesetzt, „geschoben" bleibt 0, kein „rein" am Zieltag', kid('a1').faelligkeit===FR && gesch(DO)===0 && reinFr()===rein0 && flowHeuteWerte().geschoben===0);
karteSchieben(kid('a2'), FR, null, 20);
ok('(a) Schieben MIT Abzug zählt: „geschoben" = 1, „rein" am Zieltag +1', gesch(DO)===1 && reinFr()===rein0+1 && flowHeuteWerte().geschoben===1);
ok('(a) der Abzug steht im Stunden-Log (punkte < 0), die abzugsfreie Schiebung mit 0', S.intraday.filter(function(e){ return e.typ==='schub'; }).map(function(e){ return e.punkte; }).join(',')==='0,-20');
S.intraday.push({ ts:jetztIso(), kartenId:'a3', domaene:'dfm', punkte:0, minuten:0, typ:'schub', ziel:FR, quelle:'tagesabschluss' });
ok('(a) offene Karte beim Tagesabschluss zählt auch ohne Abzug', gesch(DO)===2);
var rohHeute=analyseRohTage().filter(function(e){ return e.datum===DO; })[0];
ok('(a) Schiebe-Quote: der Tageswert „schub" zählt dieselben zwei (nicht die abzugsfreie)', rohHeute && rohHeute.schub===2);
ok('(a) schubZaehlt: ohne Abzug nein · mit Abzug ja · Tagesabschluss ja · andere Typen nie', schubZaehlt({typ:'schub', punkte:0})===false && schubZaehlt({typ:'schub', punkte:-5})===true &&
   schubZaehlt({typ:'schub', punkte:0, quelle:'tagesabschluss'})===true && schubZaehlt({typ:'abhaken', punkte:-5})===false);

/* ══ (b) ein Tipp auf „nächste ▶" bewegt genau eine Karte ═════════════ */
kopf('(b) Navigation: ein Tipp bzw. ein Wisch = genau ein Schritt');
tagDonnerstag();
S.karten=[aufgabe('n1','dfm'), aufgabe('n2','dfm'), aufgabe('n3','dfm'), aufgabe('n4','dfm'), aufgabe('n5','dfm')];
var kand=fokusKandidaten().map(function(k){ return k.id; });
ok('(b) Vorbereitung: die Kette trägt fünf Karten ('+kand.join(' · ')+')', kand.length===5);
fokusKarteAnsehen(kand[0]); renderFokus();
var pos=function(){ return kand.indexOf(aktiveFokusKarte().id); };
ok('(b) Start auf der ersten Karte', pos()===0);
minuten(1); var r1=fokusSwipeSchritt(-1);
ok('(b) ein Tipp auf „nächste ▶" → genau die nächste Karte (Position 1 → 2)', r1===true && pos()===1);
var r2=fokusSwipeSchritt(-1);
ok('(b) Doppelauslösung (Klick + Wisch-Abschluss im selben Moment) bewegt KEINE zweite Karte', r2===false && pos()===1);
minuten(1); fokusSwipeSchritt(-1);
ok('(b) der nächste Tipp wieder genau eine Karte (2 → 3)', pos()===2);
ok('(b) Knöpfe: links „◀ Verlauf" (data-fkswipe="1"), rechts „nächste ▶" (data-fkswipe="-1"), Positionspunkte darunter', (function(){ var h=el('fokusView').innerHTML;
  return h.indexOf('data-fkswipe="1">◀ Verlauf</button>')>=0 && h.indexOf('data-fkswipe="-1">nächste ▶</button>')>h.indexOf('◀ Verlauf') && /class="punkte5"><i/.test(h) && h.indexOf('<b>3 / 5</b> in der Kette')>=0; })());
minuten(1); fokusSwipeSchritt(1);
ok('(b) „◀ Verlauf" = die zuletzt geöffnete Karte (zurück auf Position 2)', pos()===1 && el('fokusView').innerHTML.indexOf('im Verlauf')>=0);
minuten(1); fokusSwipeSchritt(1);
ok('(b) Verlauf Schritt für Schritt bis zum Tagesanfang (Position 1)', pos()===0);
minuten(1);
ok('(b) am Anfang des Verlaufs kein weiterer Schritt', fokusSwipeSchritt(1)===false && pos()===0);
minuten(1); fokusSwipeSchritt(-1);
ok('(b) Mehrfach-Öffnungen stehen einzeln im Verlauf ('+fokusOeffnungen().join(' · ')+')', fokusOeffnungen().join(',')===[kand[0],kand[1],kand[2],kand[1]].join(','));
ok('(b) Wisch-Robustheit im Code: Urteil bei 8 px mit Winkel 1,2 · Mindestweg 48 px · pointercancel schließt einen erkannten Wisch ab',
   /const SWIPE_START=8, SWIPE_MIN_DX=48, SWIPE_WINKEL=1\.2/.test(src) && /addEventListener\('pointercancel', e=>\{\s*const war=_swAktiv, dx=_swDx/.test(src) && /draggable="false"/.test(src));

/* ══ (c) Zeit heute je Familie (v3.5.4: im Ring statt im Kopf der Tagesprognose) ═══ */
kopf('(c) Zeit heute je Familie: DFM und Privat getrennt');
tagDonnerstag();
S.karten=[aufgabe('d1','dfm',45), aufgabe('d2','dfm',60), aufgabe('d3','dfm',30), aufgabe('p1','privat',90), aufgabe('p2','privat',20)];
var z0=familienZeitHeute();
ok('(c) Start: DFM 0, Privat 0', z0.dfm===0 && z0.privat===0);
kid('d1').istSek=40*60; kid('d1').status='erledigt'; kid('d1').tagId=aktuelleTagId();
kid('p1').istSek=70*60; kid('p1').status='erledigt'; kid('p1').tagId=aktuelleTagId();
var z1=familienZeitHeute();
ok('(c) gebuchte Minuten zählen in ihrer Familie: DFM 40, Privat 70 — Privat bleibt aus der DFM-Zeit draußen', Math.round(z1.dfm)===40 && Math.round(z1.privat)===70);
fokusStarten('d2', null); minuten(12);
var z2=familienZeitHeute();
ok('(c) laufende DFM-Karte zählt live mit (40 + 12 = 52), Privat unverändert', Math.round(z2.dfm)===52 && Math.round(z2.privat)===70);
fokusBeenden(); fokusStarten('p2', null); minuten(9);
var z3=familienZeitHeute();
ok('(c) laufende PRIVAT-Karte ändert die DFM-Zeit nicht (DFM 52, Privat 79)', Math.round(z3.dfm)===52 && Math.round(z3.privat)===79);
fokusBeenden();
var dt=derTagHtml(kid('d2'));
ok('(c) v3.5.4 (Entscheidung 4): im Kopf der Tagesprognose steht keine DFM-Zeit mehr; „Faktor F" heißt „Tagesform"', dt.indexOf('· DFM ')<0 && dt.indexOf('DFM-Zeit heute')<0 && typeof dfmZeitHeute==='undefined' && dt.indexOf('Tagesform')>=0 && dt.indexOf('Faktor F')<0 && /% (über|unter) normal|wie normal/.test(dt));

/* ══ (d) „Tage ≥ 80 % Ziel" zählt korrekt ═════════════════════════════ */
kopf('(d) Konsistenz-KPI „Tage ≥ 80 % Ziel"');
tagDonnerstag();
var tage=[]; for(var i=1;i<=10;i++) tage.push(anVorTage(DO, i));
var zielVon=function(d){ return anZiel('alle', d); };
// Anteile am Tagesziel: 100 %, 80 % (genau die Grenze zählt), 79 %, 120 %, 50 %, 0 %, 95 %, 81 %, 10 %, 80,5 %
var anteile=[1, 0.8, 0.79, 1.2, 0.5, 0, 0.95, 0.81, 0.1, 0.805];
var reihe=tage.map(function(d,i){ var p=zielVon(d)*anteile[i]; return { datum:d, punkte:p, punkteDfm:p, punktePrivat:0, artPkt:{} }; });
S.ui.analyseArt='alle';
var t80=tageAb80Ziel(reihe, 'alle');
ok('(d) 6 von 10 Tagen ≥ 80 % (100 · 80 · 120 · 95 · 81 · 80,5 %) — 79 % und darunter zählen nicht', t80.n===6 && t80.von===10);
ok('(d) leerer Zeitraum: 0 / 0', tageAb80Ziel([], 'alle').n===0 && tageAb80Ziel([], 'alle').von===0);
ok('(d) das Modul trägt die Kachel „Tage ≥ 80 % Ziel" im Format „n / m" statt „längste Serie"', (function(){ var h=''; try{ h=stmKonsistenz(analyseFenster(), 'alle'); }catch(e){ h=String(e); }
  return /\d+ \/ \d+<\/div><div class="l">Tage ≥ 80 % Ziel/.test(h) && h.indexOf('längste Serie')<0; })());

/* ══ Regeln dahinter ══════════════════════════════════════════════════ */
kopf('Regeln des Hotfix');
ok('§1 Schrift: keine ui-monospace in der sichtbaren Oberfläche (nur die Speicher-Diagnose)', (src.match(/ui-monospace/g)||[]).length<=1);
ok('§1 Verläufe: verlauf() läuft von der hellen zur vollen Variante (DFM, Privat, Gold, Ampel 55 %)', verlauf(FARBE.BLAU)==='linear-gradient(90deg,#93c5fd,#3b82f6)' && verlauf(FARBE.LILA)==='linear-gradient(90deg,#d8b4fe,#a855f7)' &&
   verlauf(FARBE.GOLD)==='linear-gradient(90deg,#f3dc8a,#d4af37)' && verlauf(FARBE.GRUEN)==='linear-gradient(90deg,#3ecf8e8c,#3ecf8e)');
ok('§1 Maximalbreiten der Diagramme entfernt', !/\.st-mx \.fb-mx\{[^}]*max-width:420px/.test(src) && !/\.mxpad\{[^}]*max-width:320px/.test(src) && !/\.mxpad-feld\{[^}]*max-width:280px/.test(src));
ok('§4 Statistik: Klapp-Knopf 44×44 mit Chevron, Drehung 150 ms; Routinen-Flow trägt die Pille „Privat"', /\.stm-tog\{[^}]*width:44px;height:44px/.test(src) && /\.stm-tog svg\{[^}]*transition:transform \.15s/.test(src) &&
   (function(){ var h=''; try{ h=stmRoutinen(analyseFenster(), 'alle'); }catch(e){} return h.indexOf('<span class="fam-pille p">Privat</span>')>=0 && /class="stm-tog/.test(h); })());
ok('§4 ACWR-KPIs mit Erklärung (akut / chronisch)', /ACWR = 7 Tage ÷ Ø 28 Tage/.test(src) && /Punkte der letzten 7 Tage \(akut\)/.test(src) && /Ø je 7 Tage über 28 Tage \(chronisch\)/.test(src));
ok('§4 Readiness: Optimalband diagonal — (50 %, 50 %) optimal, (20 %, 90 %) Überlastung, (90 %, 20 %) Unterlastung, unter 15 % nie optimal', readinessOptimal(0.5,0.5) && !readinessOptimal(0.2,0.9) && !readinessOptimal(0.9,0.2) && !readinessOptimal(0.1,0.1) && readinessOptimal(1,1));
ok('§5 Topf: heller Glasgrund, helle Kante (aktiv weiß 2 px), Lichtreflex, heller Deckel', (function(){ var a=topfSvg({farbe:null, punkte:0}, 38), b=topfSvg({farbe:null, punkte:0}, 56, {weiss:true});
  return a.indexOf('fill="#3a3f4a"')>=0 && a.indexOf('stroke="#c9ccd2" stroke-width="1.5"')>=0 && a.indexOf('opacity=".18"')>=0 && /rx="2" fill="#c9ccd2"/.test(a) && b.indexOf('stroke="#fff" stroke-width="2"')>=0; })());
ok('§5 Zoom nur mit zwei Fingern: der Doppeltipp-Zoom ist aus malZoomBinden entfernt, die Einstellung bleibt im Vertrag', !/zoomAuf\([^)]*zoomDoppeltipp/.test(src) && ausmalEinst().zoomDoppeltipp===2.5 && /zoomDoppeltipp:Z\('ausmalen\.zoomDoppeltipp'/.test(src));
ok('§5 Feldkarte: Rest 45 % abgedunkelt, Umriss-Ebene mit Puls 1,2 s', /o\[i\]\*=0\.55; o\[i\+1\]\*=0\.55; o\[i\+2\]\*=0\.55/.test(src) && /\.mal-puls\{[^}]*animation:malPuls 1\.2s ease-in-out infinite/.test(src) && /canvas class="mal-puls"/.test(src));

print('');
if(fails){ print(fails+' von '+n+' FEHLGESCHLAGEN'); throw new Error('Abnahme rot'); }
print('alle '+n+' Abnahmepunkte gruen');
