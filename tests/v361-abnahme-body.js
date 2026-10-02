/* Abnahme Hotfix v3.6.1 — Preis-Faktor und Kalibrierung entfernt, Anzeige „Farbe", „Spielstand zurücksetzen".
   Die Uhr ist verstellbar (uhr/minuten aus tests/v361-abnahme.js). */
var fails=0, n=0;
function ok(t,c){ n++; print((c?'OK   ':'FAIL ')+t); if(!c) fails++; }
function kopf(t){ print(''); print('── '+t+' ──'); }
function frisch(){
  _store={}; S.karten=[]; S.unteraufgaben=[]; S.historie=[]; S.intraday=[]; S.routinenGruppen=[]; S.tagesketten=[];
  S.meta={ wohlstand:0, seeded:true, migration200:true, shop360:{ ts:'2026-09-30T08:00:00.000Z' }, reset35:{ ts:'2026-09-20T08:00:00.000Z' } }; S.settings=settingsMerge({}); S.belohnung=null;
  S.tag=null; S.fokus=null; S.meta.ketten=null; matrixTmp=null; S.ui.fokusOffen=false; S.ui.fokusZeigt=null; S.ui.fokusNav=null; S.ui.fokusOeff=null;
  S.ui.statOffen={}; S.ui.einstOffen=null; S.ui.malmodus=false;
  abv3.aktiv=false; abv3.zurueck=false; abv3.schritt=1; aufstehenTmp=null;
}
var DO='2026-10-01';
function tagDonnerstag(){ frisch(); uhr('2026-10-01T09:00:00+02:00'); tagStarten(70, DO); belohnungInit(); }
function rumpf(name){ var a=src.indexOf('function '+name+'('), b=src.indexOf('\nfunction ', a+10); return a<0 ? '' : src.slice(a, b<0 ? src.length : b); }
function preise(){ return KAT_KEYS.map(function(k){ return [1,5,9,12].map(function(s){ return preisVon(k, s); }).join('/'); }).join(' · '); }
function einstOffen(){ var a=einstAbschnittOffen; einstAbschnittOffen=function(){ return true; }; renderEinst(); einstAbschnittOffen=a; return el('einstBody').innerHTML; }

kopf('Version');
ok('APP_VERSION 3.6.1 · Datenvertrag bleibt 2.1.0 · Build neu', APP_VERSION==='3.6.1' && UI_VERSION==='v3.6.1' && DATENVERTRAG==='2.1.0' && APP_BUILD==='2026-10-02-6');

/* ══ §1 Shop-Preis-Faktor und Kalibrierung ═════════════════════════════ */
kopf('§1 Shop-Preis-Faktor und Kalibrierung entfernt');
tagDonnerstag();
ok('§1 die Einstellung gibt es nicht mehr: kein Standardwert, kein Schema-Feld, kein Regler', DEFAULT_SETTINGS.preisFaktor===undefined && S.settings.preisFaktor===undefined && EINST_SCHEMA.belohnung.preisFaktor===undefined &&
   einstOffen().indexOf('Shop-Preis-Faktor')<0 && einstOffen().indexOf('data-setting="preisFaktor"')<0 && einstOffen().indexOf('belohnung.preisFaktor')<0);
ok('§1 ein gespeicherter Altwert wird beim Laden verworfen', settingsMerge({ preisFaktor:40, tagesZielDfm:6000 }).preisFaktor===undefined && settingsMerge({ preisFaktor:40, tagesZielDfm:6000 }).tagesZielDfm===6000);
ok('§1 der Kalibrierungs-Dialog nach „Shop zurücksetzen" ist entfernt (UI und Logik)', typeof shopKalibrierungVorschlag==='undefined' && typeof renderShopKalibrierung==='undefined' && !/shopPf|data-shoppfgo|Preise kalibrieren/.test(src) &&
   /shopResetJetzt\(\);\s*closeSheet\(\); renderEinst\(\);/.test(src) && einstOffen().indexOf('Preiskalibrierung')<0 && (oeffneShopReset(), el('sheetBody').innerHTML.indexOf('Preiskalibrierung')<0));
ok('§1 die Preise kommen ausschließlich aus der Formel 3.6.0 (Tagesziel · Kategoriefaktor · Stufenfaktor · Tempo)', rumpf('preisVon').indexOf('preisStufe1(kat)*stufenFaktor(kat, n)*tempoFaktor()')>=0 && !/preisFaktor/.test(rumpf('preisVon')+rumpf('preisStufe1')+rumpf('preisFuer')+rumpf('tempoFaktor')));
var pVor=preise(), sVor=JSON.stringify(S.settings), protVor=(S.meta.korrekturProtokoll||[]).length;
print('   Preise (Stufe 1/5/9/12 je Kategorie): '+pVor);
var r1=syncImport(JSON.stringify({ appVersion:'3.6.1', einstellungen:{ grund:'Test: alter Faktor', belohnung:{ preisFaktor:40 } } }));
ok('§1 Import mit preisFaktor wird angenommen — kein Fehler, keine Freigabe nötig, nicht als unbekannt gemeldet', r1 && !r1.fehler && !r1.freigabeNoetig && !(r1.uebersprungen||[]).some(function(u){ return /unbekannt/.test(u.grund); }));
ok('§1 … und ändert keinen Preis und keine Einstellung', preise()===pVor && JSON.stringify(S.settings)===sVor && S.settings.preisFaktor===undefined);
var prot=S.meta.korrekturProtokoll||[], letzter=prot[prot.length-1];
ok('§1 … im Protokoll vermerkt als „ohne Wirkung seit 3.6.1" (mit Grund und Wert), in der Rückmeldung des Imports ebenso', prot.length===protVor+1 && letzter.art==='einstellungen' && letzter.grund==='Test: alter Faktor' &&
   letzter.aenderungen.join(' ')==='belohnung.preisFaktor: 40 — ohne Wirkung seit 3.6.1' && letzter.ohneWirkung===true &&
   (r1.uebersprungen||[]).some(function(u){ return u.was==='einstellungen.belohnung.preisFaktor' && u.grund==='ohne Wirkung seit 3.6.1'; }));
var r2=syncImport(JSON.stringify({ appVersion:'3.6.1', einstellungen:{ grund:'Test: gemischt', belohnung:{ preisFaktor:7 }, ziele:{ dfm:6000 } } }));
ok('§1 Paket mit preisFaktor UND einer echten Änderung: die Vorschau zeigt eine Änderung, preisFaktor als „ohne Wirkung", nichts unbekannt, kein Fehler', r2.freigabeNoetig===true && r2.vorschau.einstellungen.aenderungen.length===1 &&
   r2.vorschau.einstellungen.ohneWirkung.length===1 && r2.vorschau.einstellungen.unbekannt.length===0 && r2.vorschau.einstellungen.fehler.length===0);
oeffneSyncFreigabe(JSON.stringify({ appVersion:'3.6.1', einstellungen:{ grund:'Test: gemischt', belohnung:{ preisFaktor:7 }, ziele:{ dfm:6000 } } }), r2.vorschau, 'einst');
ok('§1 … die Zusammenfassung nennt es („Wird angenommen, ohne Wirkung seit 3.6.1")', el('sheetBody').innerHTML.indexOf('Wird angenommen, ohne Wirkung seit 3.6.1: einstellungen.belohnung.preisFaktor')>=0);
var p6000Vor=S.settings.tagesZielDfm; syncFreigabeAnwenden();
ok('§1 … nach „Übernehmen": das Tagesziel ist gesetzt (5.000 → 6.000, die Preise folgen der Formel), preisFaktor bleibt ohne Wirkung und steht im Protokoll', p6000Vor===5000 && S.settings.tagesZielDfm===6000 && S.settings.preisFaktor===undefined &&
   Math.abs(KAT_KEYS.reduce(function(a,k){ return a+preisVon(k,1); },0)-zielWerktagGesamt())<=15 && zielWerktagGesamt()===6000+tagesZielDomain('privat') &&
   (S.meta.korrekturProtokoll||[]).filter(function(e){ return e.ohneWirkung; }).length===2);
ok('§1 der Vollexport trägt das Feld nicht mehr; ein zurückgeschickter Export braucht keine Freigabe', syncExport('voll').einstellungen.belohnung.preisFaktor===undefined && JSON.stringify(syncExport('voll').einstellungen).indexOf('preisFaktor')<0 && !syncImport(JSON.stringify(syncExport('voll'))).freigabeNoetig);

/* ══ §2 Anzeige „Farbe" und Reset ══════════════════════════════════════ */
kopf('§2 „Farbe (live)" = gesamte Farbe seit dem Reset · „Spielstand zurücksetzen"');
tagDonnerstag();
S.meta.wohlstand=50000;   // der alte Lebenswerk-Wert — darf nirgends mehr als „Farbe" erscheinen
S.historie.push({ tagId:'2026-09-28-1', datum:'2026-09-28', luecke:false, punkteBilanz:3200 }, { tagId:'2026-09-29-1', datum:'2026-09-29', luecke:false, punkteBilanz:-400 }, { tagId:'2026-09-30-1', datum:'2026-09-30', luecke:false, punkteBilanz:4100 },
  { tagId:'2026-09-10-1', datum:'2026-09-10', luecke:false, punkteBilanz:9000 });   // vor dem Reset: zählt nicht
S.karten=[ neueKarte({ id:'f1', domain:'dfm', titel:'Karte', sollMin:60, faelligkeit:DO, flowBaseline:true }) ];
fokusStarten('f1', null); minuten(30); fokusBeenden();
var live=Math.max(0, tagesPunkteLive()), farbe=farbeGesamt();
print('   Farbe seit Reset: 3.200 + 0 + 4.100 + heute live '+Math.round(live)+' = '+farbe+' · alter Lebenswerk-Wert '+Math.round(wohlstandLive()));
ok('§2 Farbe gesamt = Summe der nicht-negativen Tagesbilanzen seit dem Reset + heute live', live>0 && farbe===Math.round(7300+live) && farbe===Math.round(ausmalW()));
ok('§2 „Farbe (live)" = wohlstandSeitReset (das Exportfeld) — derselbe Wert, der Töpfe und Kulissen füllt', farbe===ausmalExport().wohlstandSeitReset && farbe===Math.round(ausmalStand().W));
var eb=einstOffen();
ok('§2 Einstellungen zeigen „Farbe (live)" mit diesem Wert, nicht mehr den alten Lebenswerk-Wert', eb.indexOf('<div class="kv"><span>Farbe (live)</span><b>'+fmtP(farbe)+'</b></div>')>=0 && eb.indexOf(String(Math.round(wohlstandLive())))<0 && eb.indexOf(fmtP(Math.round(wohlstandLive())))<0 && Math.round(wohlstandLive())!==farbe &&
   eb.indexOf('Lifetime-Punkte')<0 && eb.indexOf('Panorama-Reset-Offset')<0 && eb.indexOf('Aktueller Offset')<0);
var tb=tagBannerHtml();
ok('§2 die Farbe-Zeilen des Tagesabschlusses zeigen denselben Wert (beide Stellen über farbeGesamt)', (rumpf('tagBannerHtml').match(/Farbe '\+fmtP\(farbeGesamt\(\)\)/g)||[]).length===2 && rumpf('tagBannerHtml').indexOf('wohlstandLive')<0 &&
   (tb.indexOf('Farbe ')<0 || tb.indexOf('Farbe '+fmtP(farbe))>=0));
ok('§2 intern bleibt der Lebenswerk-Wert erhalten (meta.wohlstand unverändert)', S.meta.wohlstand===50000 && typeof wohlstandLive==='function');
ok('§2 der Knopf heißt „Spielstand zurücksetzen" — „Farbe zurücksetzen" gibt es nicht mehr', eb.indexOf('data-panoreset="1">🔄 Spielstand zurücksetzen</button>')>=0 && eb.indexOf('Farbe zurücksetzen')<0 && !/Farbe zurücksetzen|Farbe-Reset/.test(src));
ok('§2 Rückfrage und Erklärung nennen den tatsächlichen Umfang: Konto und Gegenstands-Stufen auf 0 — Farbe, Töpfe und Kulissen, Rang und Outfit bleiben', /^Spielstand zurücksetzen\?/.test(SPIELSTAND_RESET_TEXT) && /Auf 0 gehen: das Konto \(Münzen\) und die Stufen aller Gegenstände/.test(SPIELSTAND_RESET_TEXT) &&
   /Es bleiben: Farbe, Töpfe und Kulissen, Rang \(samt Bestwert\) und Outfit/.test(SPIELSTAND_RESET_TEXT) && /umkehrbar/.test(SPIELSTAND_RESET_TEXT) && /confirm\(SPIELSTAND_RESET_TEXT\)/.test(rumpf('panoramaResetJetzt')) &&
   eb.indexOf('stellt das Konto (Münzen) auf 0 und die Stufen aller Gegenstände auf 0')>=0 && eb.indexOf('Farbe, Töpfe und Kulissen, Rang und Outfit bleiben')>=0);
// Funktion unverändert — der Text stimmt mit dem überein, was der Reset tut
S.meta.muenzenGesamt=num(S.meta.muenzenGesamt)+20000; S.belohnung.stufen.fahrzeuge=3; S.belohnung.stufen.wohnen=2; S.meta.rangBest=9;
S.meta.ausmalen={ kulisse:2, gefaerbt:[3,4], toepfe:[{farbe:1, punkte:50},{farbe:null, punkte:0},{farbe:null, punkte:0},{farbe:null, punkte:0},{farbe:null, punkte:0}], aktiverTopf:0, stationFarbe:1, tank:7, wohlstandSeitReset:0, freigeschaltetBis:2, fertig:[1], verteilt:0 };
var kontoVor=konto(), ausmalVor=JSON.stringify(S.meta.ausmalen), farbeVor=farbeGesamt(), outfitVor=outfitHeute(), rangVor=rangMass().rang;
panoramaResetJetzt();
var liveMz=Math.max(0, spielLiveZufluss());
ok('§2 „Spielstand zurücksetzen" (Funktion unverändert): Konto '+Math.round(kontoVor)+' → '+Math.round(konto())+' (nur die Münzen des laufenden Tages zählen weiter), alle Gegenstands-Stufen 0', kontoVor>=20000 && Math.abs(konto()-liveMz)<1e-6 && konto()<200 &&
   KAT_KEYS.every(function(k){ return S.belohnung.stufen[k]===0; }) && /Die Münzen des laufenden Tages zählen weiter/.test(SPIELSTAND_RESET_TEXT));
ok('§2 … Farbe, Töpfe und Kulisse bleiben; Rang, Bestwert und Outfit bleiben', JSON.stringify(S.meta.ausmalen)===ausmalVor && farbeGesamt()===farbeVor && S.meta.rangBest===9 && rangMass().rang===rangVor && outfitHeute()===outfitVor);
panoramaResetUndo();
ok('§2 … umkehrbar: „Rückgängig" stellt Konto und Stufen wieder her', konto()===kontoVor && S.belohnung.stufen.fahrzeuge===3 && S.belohnung.stufen.wohnen===2);

/* ══ §3 Rang-Kachel unverändert ═══════════════════════════════════════ */
kopf('§3 Rang-Kachel');
ok('§3 unverändert: nötige P/h = Schwelle der nächsten Rang-Stufe − heutige Tagesrate', /const noetig=leistungsSchwelle\(rm\.rang\+1\), ist=hr!=null \? hr : 0, diff=Math\.round\(noetig-ist\);/.test(rumpf('heuteGehtMehrHtml')));

print('');
if(fails){ print(fails+' von '+n+' FEHLGESCHLAGEN'); throw new Error('Abnahme rot'); }
print('alle '+n+' Abnahmepunkte gruen');
