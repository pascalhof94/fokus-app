/* Abnahme v3.7.2 — Hotfixes aus dem Betrieb, Prüfpunkte zu §1–§8 (Auftrag spec/261004_FokusApp_Auftrag_3-7-2.md).
   Die Uhr ist verstellbar (uhr/minuten aus tests/v372-abnahme.js). Angelegt ohne Lauf (§11). */
var fails=0, n=0;
function ok(t,c){ n++; print((c?'OK   ':'FAIL ')+t); if(!c) fails++; }
function kopf(t){ print(''); print('── '+t+' ──'); }
function frisch(){
  _store={}; S.karten=[]; S.unteraufgaben=[]; S.historie=[]; S.intraday=[]; S.routinenGruppen=[]; S.tagesketten=[];
  S.meta={ wohlstand:0, seeded:true, migration200:true, shop360:{ ts:'2026-09-30T08:00:00.000Z' }, reset35:{ ts:'2026-09-20T08:00:00.000Z' } }; S.settings=settingsMerge({}); S.belohnung=null;
  S.tag=null; S.fokus=null; S.meta.ketten=null; matrixTmp=null; S.ui.fokusOffen=false; S.ui.fokusZeigt=null; S.ui.fokusNav=null; S.ui.fokusOeff=null;
  S.ui.statOffen={}; S.ui.einstOffen=null; S.ui.malmodus=false; S.ui.klSort={}; S.ui.klGruppen={}; S.ui.navDomain='dfm'; S.ui.tkWahl=null; S.ui.suFrage=''; S.ui.tab='belohnung';
  abv3.aktiv=false; abv3.zurueck=false; abv3.schritt=1; aufstehenTmp=null; _ik=null; _kwTimer=null; _kulRepariert={};
}
var SA='2026-10-03', SO='2026-10-04', FR='2026-10-02', P='privat', D='dfm';
function tagSamstag(){ frisch(); uhr('2026-10-03T09:00:00+02:00'); tagStarten(70, SA); belohnungInit(); }
function kid(id){ return S.karten.filter(function(k){ return k.id===id; })[0]; }
function imp(karten){ var r=syncImport(JSON.stringify({appVersion:'3.7.2', karten:karten})); if(r && r.fehler) print('   IMPORT-FEHLER '+r.fehler); return r; }
function rumpf(name){ var a=src.indexOf('function '+name+'('), b=src.indexOf('\nfunction ', a+10); return a<0 ? '' : src.slice(a, b<0 ? src.length : b); }
/* Kulissen-Stub: Kulisse 1 mit zwei Farben, drei Feldern (Farbe 0: 1.000 und 600 P · Farbe 1: 800 P); Kulisse 2 mit sechs Farben */
function kulisse(){
  _kul[1]={ json:{ felder:[{feld:1,farbe:0,anteil:.5,flaechePx:100},{feld:2,farbe:1,anteil:.4,flaechePx:100},{feld:3,farbe:0,anteil:.3,flaechePx:60}], farben:[{hex:'#111111'},{hex:'#222222'},{hex:'#333333'}] },
    punkte:{1:1000, 2:800, 3:600}, farbeVon:{1:0, 2:1, 3:0}, maxP:1000, hex:['#111111','#222222','#333333'], namen:['Ocker','Schwarz','Blau'], topFarben:['#111111','#222222'] };
  _kul[2]={ json:{ felder:[{feld:1,farbe:0,anteil:.2},{feld:2,farbe:1,anteil:.2},{feld:3,farbe:2,anteil:.2},{feld:4,farbe:3,anteil:.2},{feld:5,farbe:4,anteil:.1},{feld:6,farbe:5,anteil:.1}], farben:[{hex:'#a1'},{hex:'#a2'},{hex:'#a3'},{hex:'#a4'},{hex:'#a5'},{hex:'#a6'}] },
    punkte:{1:500,2:700,3:500,4:500,5:250,6:250}, farbeVon:{1:0,2:1,3:2,4:3,5:4,6:5}, maxP:700, hex:['#a1','#a2','#a3','#a4','#a5','#a6'], namen:['A','B','C','D','E','F'], topFarben:['#a1','#a2'] };
}
function kulisseWeg(){ delete _kul[1]; delete _kul[2]; }
function toepfe(l){ var A=ausmalState(); A.toepfe=[0,1,2,3,4].map(function(i){ return { farbe:(l[i]&&l[i][0]!=null)?l[i][0]:null, punkte:(l[i]&&l[i][1])||0 }; }); return A; }

kopf('Version');
ok('APP_VERSION 3.7.2 · Datenvertrag bleibt 2.1.0 · Build 2026-10-04-1', APP_VERSION==='3.7.2' && UI_VERSION==='v3.7.2' && DATENVERTRAG==='2.1.0' && APP_BUILD==='2026-10-04-1');

/* ══ §1 Kulissen schalten sich beim Ankommen frei ════════════════════ */
kopf('§1 Kulissen schalten sich beim Ankommen frei');
tagSamstag(); kulisse();
var A=toepfe([[0,1200],[null,0],[null,0],[null,0],[null,0]]); A.aktiverTopf=0; A.stationFarbe=0; A.gefaerbt=[2,3]; A.kulissenStart={1:'2026-10-01T08:00:00+02:00'}; A.malTage=[]; A.kulissenFertig=[]; A.fertig=[]; A.freigeschaltetBis=1; A.tank=0; A.kulisse=1;
ok('§1 die Farb-Schwelle entscheidet nichts mehr: Kulisse 1 nicht fertig → freigeschaltetBis 1 (bgSchwelle bleibt für Anzeigen)', ausmalStand().freigeschaltetBis===1 && typeof bgSchwelle==='function' && !/bgSchwelle\(k\)-bgSchwelle\(1\)\) frei=k/.test(rumpf('ausmalStand')));
S.ui.malTopf=0; feldAusmalen(1);
ok('§1 fertig gemalt → die nächste Kulisse ist SOFORT frei (freigeschaltetBis 2), Belohnungsansicht, dann Wechsel', ausmalStand().fertig && A.freigeschaltetBis===2 && A.kulissenFertig.length===1 && kulisseKennzahlen(1).naechsteFrei===0);
ok('§1 Bestand reparieren: fertige Kulisse mit gesperrter nächster → freischalten und wechseln (einmalig, Toast)', (function(){ A.kulisse=1; A.freigeschaltetBis=1; A.gefaerbt=[1,2,3]; A.fertig=[]; A.kulissenFertig=[]; _kulRepariert={};
   var r=kulissenReparaturPruefen(); return r===true && A.kulisse===2 && A.freigeschaltetBis>=2 && kulissenReparaturPruefen()===false; })());
ok('§1 die Reparatur läuft beim Start und sobald Kulissendaten geladen sind', /kulissenReparaturPruefen\(\);/.test(rumpf('ausmalDaten')) && (src.match(/try\{ kulissenReparaturPruefen\(\); \}catch\(e\)\{\}/g)||[]).length>=2);
ok('§1 Kulisse 10 bleibt die letzte', (function(){ A.kulisse=10; var r=ausmalStand().freigeschaltetBis<=10 && kulissenReparaturPruefen()===false; A.kulisse=2; return r; })());

/* ══ §2 Kulissenwechsel: ein Topf statt fünf ═════════════════════════ */
kopf('§2 Kulissenwechsel: ein Topf');
A.kulisse=2; A.gefaerbt=[]; A.toepfe=[0,1,2,3,4].map(function(){ return { farbe:null, punkte:0 }; }); A.geschenkOffen=2; A.tank=0;
ok('§2 offener Bedarf je Farbe (Felder − Töpfe): B 700 ist der größte', farbBedarf(1)===700 && farbBedarf(0)===500 && farbeGroessterBedarf()===1);
kulissenGeschenkNachholen();
ok('§2 das Geschenk ist EIN voller Topf (Fassung 700 × 1,2 = 840) in der Farbe mit dem größten Bedarf (B); die anderen Töpfe leer', A.toepfe[0].farbe===1 && A.toepfe[0].punkte===840 && A.toepfe.slice(1).every(function(t){ return t.farbe===null && t.punkte===0; }) && A.stationFarbe===1);
ok('§2 Farbwahl-Dialog: nicht überspringbar, „Weiter", Vorgabe = Topffarbe', /farbwahlZeigen\(/.test(rumpf('kulissenGeschenkNachholen')) && !/dblclick/.test(rumpf('farbwahlZeigen')) && /data-belweiter="1">Weiter</.test(rumpf('farbwahlZeigen')));

/* ══ §3 Farbausgabe: Station · Ausgabe · Töpfe · Tank ═══════════════ */
kopf('§3 Farbausgabe neu');
var _ausmalW=ausmalW, wTest=0; ausmalW=function(){ return wTest; };
A.kulisse=1; A.gefaerbt=[]; A=toepfe([[null,0],[null,0],[null,0],[null,0],[null,0]]); A.stationFarbe=null; A.aktiverTopf=0; A.tank=0; A.verteilt=0; A.fertig=[]; A.kulissenFertig=[];
ok('§3 die Station zeigt immer genau eine Farbe (nie null): beim Start die mit dem größten Bedarf (Ocker 1.600)', stationSichern()===0 && A.stationFarbe===0);
wTest=500; ausmalVerteilen();
ok('§3 Zufluss in den Topf unter der Ausgabe; ein leerer Topf übernimmt die Stationsfarbe', A.toepfe[0].farbe===0 && A.toepfe[0].punkte===500 && A.aktiverTopf===0 && A.tank===0);
wTest=1500; ausmalVerteilen();
ok('§3 Topf voll (1.200) → die Ausgabe fährt zum nächsten leeren Topf (von links), Zufluss geht weiter', A.toepfe[0].punkte===1200 && A.aktiverTopf===1 && A.toepfe[1].farbe===0 && A.toepfe[1].punkte===300);
wTest=1700; ausmalVerteilen();
ok('§3 Stationsfarbe gedeckt (Bedarf Ocker 1.600 − 1.600 = 0) → die Station springt zur nächsten offenen Farbe (Schwarz), Ausgabe zum passenden/leeren Topf', farbeGedeckt(0) && A.stationFarbe===1 && A.toepfe[1].punkte===400 && A.toepfe[2].farbe===1 && A.toepfe[2].punkte===100 && A.tank===0);
wTest=2600; ausmalVerteilen();
ok('§3 keine Farbe mehr offen → der Rest geht in den Tank; der Tank verringert keinen Bedarf', farbeGedeckt(1) && A.toepfe[2].punkte===800 && A.tank===200 && farbBedarf(1)===0);
ok('§3 Topf antippen fährt die Ausgabe dorthin; aus dem Tank fließt nichts zurück (kein Tank-Rückfluss in topfUnterStation)', (function(){ var t3=A.toepfe[3]; A.tank=500; topfUnterStation(3); return A.aktiverTopf===3 && t3.farbe===null && t3.punkte===0 && A.tank===500 && rumpf('topfUnterStation').indexOf('A.tank')<0; })());
ok('§3 Farbe oben wählen: Station zeigt sie, Ausgabe fährt zum Topf dieser Farbe', stationFarbeWaehlen(0)===true && A.stationFarbe===0 && A.aktiverTopf===1);
var mVor=num(S.meta.muenzenGesamt); A.tank=1241;
ok('§3 Tank verkaufen: 0,5 Münzen je Farbpunkt (abgerundet: 1.241 → 620), Tank 0, Export additiv ausmalen.tankVerkauf[]', tankVerkaufen()===true && A.tank===0 && num(S.meta.muenzenGesamt)===mVor+620 && A.tankVerkauf.length===1 && A.tankVerkauf[0].muenzen===620 && A.tankVerkauf[0].farbe===1241 && ausmalExport().tankVerkauf.length===1);
ok('§3 Topf in den Tank kippen bleibt; der gekippte Inhalt zählt wieder zum offenen Bedarf', (function(){ var b0=farbBedarf(1); topfAuskippen(2); return A.tank===800 && farbBedarf(1)===b0+800; })());
ok('§3 Malmodus: Station · Ausgabe (Schlitten über dem aktiven Topf, 400 ms ease, Strahl nur bei Zufluss) · Töpfe · Tank-Zeile mit „Verkaufen"', (function(){ var h=belMalmodusHtml(); return h.indexOf('class="mal-ausgabe"')>=0 && /class="mal-schlitten" style="left:calc\([\d.]+% - 28px\)"/.test(h) && h.indexOf('mal-strahl')>=0 && h.indexOf('mal-tankzeile')>=0 && h.indexOf('data-tankverkauf="1"')>=0 && /\.mal-schlitten\{[^}]*transition:left \.4s ease/.test(src); })());
ausmalW=_ausmalW; kulisseWeg(); S.ui.malTopf=null;

/* ══ §4 Farbe beim Abhaken = nur Zeitpunkte ══════════════════════════ */
kopf('§4 Farbe beim Abhaken einer Aufgabe');
tagSamstag();
S.karten=[ neueKarte({ id:'a', domain:D, titel:'Aufgabe', matrixFeld:'ziel', sollMin:60, faelligkeit:SA }) ];
fokusStarten('a'); minuten(30); fokusZeitEinbuchen();
var wVor=ausmalW(), pVor=tagesPunkteLive(), bonus=abhakbonusDefault(kid('a'));
karteAbhaken('a', true);
ok('§4 der Abhakbonus ('+bonus+' P) zählt in Tagespunkten, erzeugt aber keine Farbe', bonus>0 && Math.round(tagesPunkteLive()-pVor)===Math.round(bonus) && Math.round(ausmalW()-wVor)===0 && aufgabenBonusHeute()===bonus);
ok('§4 abgeschlossene Tage tragen h.aufgabenBonus (additiv), ausmalW zieht ihn ab', /h\.aufgabenBonus=aufgabenBonusHeute\(\)/.test(src) && /num\(h\.punkteBilanz\)-num\(h\.aufgabenBonus\)/.test(rumpf('ausmalW')));
ok('§4 Routinen/Counter unverändert (kein Bonus-Abzug)', (function(){ S.karten.push(neueKarte({ id:'r', domain:P, titel:'Routine', rhythmus:{typ:'taeglich'}, modus:'staffel', staffel:[50], faelligkeit:SA })); var w0=ausmalW(); routineTick(kid('r')); return ausmalW()>w0 && aufgabenBonusHeute()===bonus; })());
ok('§4 Belohnungsansicht nach dem Abhaken: „Farbe" nur aus dem Zeitanteil', /w:Math\.max\(0, delta-\(anlass==='abhaken' \? bonus : 0\)\)/.test(rumpf('belohnungDaten')));

/* ══ §5 Erholung jeden Tag + sichtbar ════════════════════════════════ */
kopf('§5 Erholung jeden Tag + sichtbar');
frisch(); uhr('2026-10-02T09:00:00+02:00'); tagStarten(70, FR); belohnungInit();
S.karten=[ neueKarte({ id:'sp', domain:P, titel:'Spaziergang', matrixFeld:'zustand', sollMin:60, faelligkeit:FR, erholung:true }) ];
ok('§5 Erholung gilt an jedem Tag (Freitag): Werkzeug-Faktor, Buchung mit erholung:true', erholungAktiv(kid('sp')) && matrixFaktor(kid('sp'))===num(S.settings.matrixFaktor.werkzeug) && (fokusStarten('sp'), minuten(30), fokusZeitEinbuchen(), S.intraday.filter(function(e){ return e.kartenId==='sp'; }).pop().erholung===true));
ok('§5 Kartenzeile mit grünem Blatt vor dem Titel', kartenZeileHtml(kid('sp')).indexOf('<span class="kl-erh" title="Erholung">🌿</span>')>=0);
ok('§5 Belohnungsansicht zeigt „🌿 Erholung · X Min · Y P"', /🌿 Erholung · '\+Math\.round\(d\.min\)\+' Min · '\+fmtP\(Math\.round\(d\.punkte\)\)\+' P/.test(rumpf('belohnungAnsichtZeigen')));
ok('§5 Statistik-Modul erholung in der Gruppe Belastung, per statistik-Paket schaltbar', STAT_MODULE.some(function(m){ return m[0]==='erholung'; }) && STAT_GRUPPE.erholung===4 && DEFAULT_SETTINGS.statistik.reihenfolge.indexOf('erholung')>DEFAULT_SETTINGS.statistik.reihenfolge.indexOf('acwr'));
var em=stmErholung(analyseFenster(), 'alle');
ok('§5 Modul: Ring heute/Ziel 120, 14-Tage-Balken, Legende mit Ziel-Linie, KPIs Minuten · Punkte · ACWR-Entlastung', em.indexOf('class="erh-ring"')>=0 && em.indexOf('30/120')>=0 && (em.match(/class="col"/g)||[]).length===14 && em.indexOf('– – 120 Min')>=0 && em.indexOf('ACWR-Entlastung heute')>=0);
ok('§5 Schlafen zählt im Modul nicht mit', rumpf('erholungTage').indexOf("k.rolle==='schlafen'")>=0);

/* ══ §6 Tagesanker ═══════════════════════════════════════════════════ */
kopf('§6 Tagesanker: nur „Aufstehen" beginnt einen neuen Tag');
frisch(); uhr('2026-10-03T22:00:00+02:00'); tagStarten(70, SA); belohnungInit();
S.historie.push({ tagId:'2026-10-02-1', datum:FR, luecke:false, punkteBilanz:3000, punkteDfm:2000, punktePrivat:1000 });
S.karten=[ neueKarte({ id:'r', domain:P, titel:'Routine', rhythmus:{typ:'taeglich'}, modus:'staffel', staffel:[50], faelligkeit:SA }), neueKarte({ id:'a', domain:D, titel:'Aufgabe', sollMin:30, faelligkeit:SA }) ];
ok('§6 Ursache: das Wochenend-Kontingent prüft den Wochentag des APP-Tags, nicht der Geräte-Uhr', (function(){ uhr('2026-10-04T00:30:00+02:00'); var s1=weIstDomain('dfm'); uhr('2026-10-03T22:00:00+02:00'); return s1===Math.max(0, tagesPunkteDomain('dfm')) && /wochentagNr\(heuteApp\(\)\)===7/.test(rumpf('weIstDomain')) && !/new Date\(\)\.getDay\(\)/.test(rumpf('weIstDomain')); })());
abschlussV3Stand(); abschlussV3Schliessen();
ok('§6 nach dem Abschluss: Anker, keine Sperre — Tick und Aufgabe buchen als Nachtrag auf den abgeschlossenen Tag', nachAbschluss() && tagBuchbar() && routineBuchbar(kid('a')) && (routineTick(kid('r')), S.intraday.filter(function(e){ return e.kartenId==='r' && e.typ==='tick'; }).pop().nachAbschluss===true) && S.tag.datum===SA);
uhr('2026-10-04T02:00:00+02:00'); schlafUmschalten();
ok('§6 auch nach „Schlafen" bleibt der Tag der Anker (Nachtrag bis „Aufstehen"); kein Wechsel über Mitternacht', !!S.tag.geschlossenTs && nachAbschluss() && tagBuchbar() && heuteApp()===SA && (routineTick(kid('r')), S.intraday.filter(function(e){ return e.kartenId==='r'; }).pop().nachAbschluss===true));
renderStatusbar();
ok('§6 die Statusleiste bleibt nach dem Abschluss sichtbar und zeigt den abgeschlossenen Tag inkl. Nachträge', el('statusbar').hidden===false && /if\(!S\.tag\)\{ bar\.hidden=true; return; \}/.test(rumpf('renderStatusbar')) && Math.round(punkteHeuteAnzeige())===Math.round(tagesPunkteLive()));
uhr('2026-10-04T08:00:00+02:00'); aufstehenBestaetigen(70, { tapTs:jetztIso() });
ok('§6 „Aufstehen" beginnt den neuen Tag (Sonntag) und schließt den Vortag endgültig — Nachträge im Snapshot', tagOffen() && S.tag.datum===SO && (S.historie.filter(function(h){ return h.datum===SA; })[0]||{}).nachtrag && S.meta.nachtraegeOffen && S.meta.nachtraegeOffen.some(function(x){ return x.datum===SA && x.anzahl>=2; }));

/* ══ §7 Suche ════════════════════════════════════════════════════════ */
kopf('§7 Suche: sichtbar, vollflächig');
ok('§7 Ebene über allem: body.sucheOffen · #v-suche fixed, z-index 300, volle Höhe mit Safe-Area', /body\.sucheOffen #v-suche\{position:fixed;inset:0;z-index:300;[^}]*padding-top:var\(--sat\);padding-bottom:var\(--sab\)\}/.test(src) && /classList\.toggle\('sucheOffen', tab==='suche'\)/.test(rumpf('setTab')));
ok('§7 „Der Tag läuft" ganz unten, darunter 50 vh Platzhalter', /<div class="su-swipe" id="suSwipe"><div id="suBody"><\/div><\/div>\s*<!--[^>]*-->\s*<div id="tagBanner"><\/div>\s*<div class="su-platz" aria-hidden="true"><\/div>/.test(src) && /\.su-platz\{height:50vh\}/.test(src));
S.ui.suFrage='mail'; setTab('suche'); S.ui.suFrage='mail'; sucheSchliessen();
ok('§7 Schließen leert das Feld und kehrt zur vorigen Ansicht zurück; das nächste Öffnen startet leer', S.ui.suFrage==='' && S.ui.tab!=='suche' && /el\('suZu'\)\.addEventListener\('click'/.test(src) && (setTab('suche'), suFrage()==='' ) && (sucheSchliessen(), true));
ok('§7 der Start öffnet nie mit offener Such-Ebene', /setTab\(\(S\.ui\.tab && S\.ui\.tab!=='suche'\) \? S\.ui\.tab : 'belohnung'/.test(src));

/* ══ §8 Pace-Leiste ══════════════════════════════════════════════════ */
kopf('§8 Pace-Leiste (P/h) neu beschriftet');
var T=paceLeisteTeile(164, 190, 212);
ok('§8 Geometrie: Raute (Ø Karte), grüner Strich (live), weißer Strich (nötig), Zonen relativ zu nötig', T.karte!=null && T.live!=null && T.noetig!=null && T.karte<T.noetig && T.noetig<T.live && T.zonen.length===5);
var h1=paceLeisteHtml({ tempoSchnitt:180, tempoZiel:190 }, { wert:212, karte:{ domain:'dfm' }, oe:164 });
ok('§8 lila Raute = Ø Karte, grüner Strich = live mit Pfeil → (hebt den Tagesschnitt), weißer Strich = nötig', /<b class="raute" style="left:[\d.]+%;background:#a855f7"><\/b>/i.test(h1) && /<u class="live" style="left:[\d.]+%;background:#3ecf8e"><\/u><b class="ppfeil hebt" style="left:[\d.]+%;color:#3ecf8e">→<\/b>/i.test(h1) && /<u class="noetig" style="left:[\d.]+%"><\/u>/.test(h1));
ok('§8 Beschriftungen „◆ Ø 164" (LILA) · „live 212" (GRUEN) · „nötig 190" (WEISS)', h1.indexOf('>◆ Ø 164</b>')>=0 && h1.indexOf('>live 212</b>')>=0 && h1.indexOf('>nötig 190</b>')>=0);
var h2=paceLeisteHtml({ tempoSchnitt:250, tempoZiel:190 }, { wert:212, karte:{ domain:'dfm' }, oe:164 });
ok('§8 Pfeil rot ← wenn live den Schnitt senkt', /class="ppfeil senkt" style="left:[\d.]+%;color:#f66d6d">←<\/b>/i.test(h2));
var h3=paceLeisteHtml({ tempoSchnitt:250, tempoZiel:190 }, null);
ok('§8 ohne laufende Uhr: kein Pfeil, keine Raute, kein grüner Strich — der weiße bleibt', h3.indexOf('ppfeil')<0 && h3.indexOf('raute')<0 && h3.indexOf('class="live"')<0 && h3.indexOf('class="noetig"')>=0);
ok('§8 Ø-P/h der Karte aus ihren Sitzungen (karteOePh) inkl. der laufenden', typeof karteOePh==='function' && /S\.fokus\.laeuft && S\.fokus\.karteId===k\.id/.test(rumpf('karteOePh')));

print(''); print(fails ? ('ROT: '+fails+' von '+n+' Abnahmepunkten') : ('alle '+n+' Abnahmepunkte gruen'));
if(fails) throw new Error('Abnahme rot');
