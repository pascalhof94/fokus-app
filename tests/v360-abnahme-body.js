/* Abnahme v3.6.0 — die neun Tests des Auftrags (§8) und die Regeln dahinter.
   Die Uhr ist verstellbar (uhr/minuten aus tests/v360-abnahme.js). Stufen-Inhalte werden nie wortweise genannt. */
var fails=0, n=0;
function ok(t,c){ n++; print((c?'OK   ':'FAIL ')+t); if(!c) fails++; }
function kopf(t){ print(''); print('── '+t+' ──'); }
function kid(id){ return S.karten.filter(function(k){ return k.id===id; })[0]; }
function frisch(){
  _store={}; S.karten=[]; S.unteraufgaben=[]; S.historie=[]; S.intraday=[]; S.routinenGruppen=[]; S.tagesketten=[];
  S.meta={ wohlstand:0, seeded:true, migration200:true, shop360:{ ts:'2026-09-30T08:00:00.000Z' } }; S.settings=settingsMerge({}); S.belohnung=null;
  S.tag=null; S.fokus=null; S.meta.ketten=null; matrixTmp=null; S.ui.fokusOffen=false; S.ui.fokusZeigt=null; S.ui.fokusNav=null; S.ui.fokusOeff=null; S.ui.klGruppen=null; S.ui.tkWahl=null;
  S.ui.statDomain='alle'; S.ui.statDatum=null; S.ui.statOffen={}; S.ui.einstOffen=null; S.ui.malTopf=null; S.ui.belKatAuf={}; S.ui.malmodus=false;
  abv3.aktiv=false; abv3.zurueck=false; abv3.schritt=1; aufstehenTmp=null;
  _objBild={}; _objLaedt={}; _objFehlt={};
}
var DO='2026-10-01';
function tagDonnerstag(){ frisch(); uhr('2026-10-01T09:00:00+02:00'); tagStarten(70, DO); belohnungInit(); }
function aufgabe(id, dom, soll){ return neueKarte({ id:id, domain:dom, titel:'Karte '+id, sollMin:soll||30, faelligkeit:DO, erstelltTs:'2026-09-30T08:00:00+02:00', flowBaseline:true }); }
function nah(a, b, eps){ return Math.abs(a-b)<=(eps==null ? 0.05 : eps); }
function rumpf(name){ var a=src.indexOf('function '+name+'('), b=src.indexOf('\nfunction ', a+10); return a<0 ? '' : src.slice(a, b<0 ? src.length : b); }
function stand(o){ KAT_KEYS.forEach(function(k){ S.belohnung.stufen[k]=o[k]||0; }); }
function muenzen(v){ S.meta.muenzenGesamt=num(S.meta.muenzenGesamt)+v-konto(); }
var KATS=['fahrzeuge','wohnen','reisen','mobilitaet','beziehung','soziales'];

kopf('Version und Stufendaten');
ok('APP_VERSION 3.6.0 · Datenvertrag bleibt 2.1.0 · Build neu', APP_VERSION==='3.7.0' && UI_VERSION==='v3.7.0' && DATENVERTRAG==='2.1.0' && APP_BUILD==='2026-10-03-1');
ok('§2 sechs Kategorien in der Reihenfolge Fahrzeuge · Wohnen · Reisen · Mobilität · Beziehung · Soziales, je 12 Stufen', KAT_KEYS.join(',')===KATS.join(',') &&
   KAT_KEYS.map(function(k){ return BELOHNUNG[k].name; }).join(' · ')==='Fahrzeuge · Wohnen · Reisen · Mobilität · Beziehung · Soziales' && KAT_KEYS.every(function(k){ return BELOHNUNG[k].stufen.length===12; }));
ok('§2 jede Stufe: Name, Status vergangen/zukunft (erst Rückblick, dann Ziele); Farbton je Kategorie (0 · 25 · 180 · 205 · 340 · 36)', KAT_KEYS.every(function(k){ return BELOHNUNG[k].stufen.every(function(s){ return s.name && (s.status==='vergangen' || s.status==='zukunft'); }) &&
   /^(vergangen,)+(zukunft,?)+$/.test(BELOHNUNG[k].stufen.map(function(s){ return s.status; }).join(',')); }) && KAT_KEYS.map(function(k){ return BELOHNUNG[k].farbton; }).join(',')==='0,25,180,205,340,36');
ok('§2 die Stufendaten liegen kodiert im Quelltext (kein Stufenname im Klartext)', /const BELOHNUNG_B64 = '[A-Za-z0-9+\/=]+';/.test(src) && src.indexOf(stufeName('fahrzeuge', 12))<0 && src.indexOf(stufeName('soziales', 1))<0);

/* ══ (a) Preise Stufe 1 ═══════════════════════════════════════════════ */
kopf('(a) Preise: alle sechs Stufen 1 zusammen = ein Werktags-Tagesziel');
tagDonnerstag();
var zielW=zielWerktagGesamt(), p1=KAT_KEYS.map(function(k){ return preisVon(k, 1); }), summe=p1.reduce(function(a,b){ return a+b; },0);
print('   Tagesziel werktags '+zielW+' (DFM '+tagesZielDomain('dfm')+' + Privat '+tagesZielDomain('privat')+') · Stufe-1-Preise '+p1.join(' · ')+' = '+summe);
ok('(a) Summe der sechs Stufe-1-Preise = Tagesziel werktags ± Rundung (je Preis auf 5)', zielW===tagesZielDomain('dfm')+tagesZielDomain('privat') && Math.abs(summe-zielW)<=15 && p1.every(function(p){ return p%5===0; }));
ok('(a) P1(kat) = Tagesziel × Kategoriefaktor ÷ Summe der Faktoren (1,3 · 1,2 · 1,1 · 1,0 · 0,9 · 0,8 = 6,3)', KAT_KEYS.every(function(k){ return nah(preisStufe1(k), zielW*KAT_PREISFAKTOR[k]/6.3, 1e-6); }) &&
   nah(KAT_KEYS.reduce(function(a,k){ return a+preisStufe1(k); },0), zielW, 1e-6) && KAT_PREISFAKTOR.beziehung===0.9 && KAT_PREISFAKTOR.begleiter===undefined);
S.settings.tagesZielDfm=8000; var zielW2=zielWerktagGesamt();
ok('(a) die Preise folgen dem Tagesziel aus den Einstellungen (DFM 8.000 → Summe '+KAT_KEYS.reduce(function(a,k){ return a+preisVon(k,1); },0)+')', zielW2===zielW+3000 && Math.abs(KAT_KEYS.reduce(function(a,k){ return a+preisVon(k,1); },0)-zielW2)<=15);
S.settings.tagesZielDfm=5000; S.settings.preisFaktor=40;
ok('(a) der alte Shop-Preis-Faktor wirkt nicht mehr auf die Preise', KAT_KEYS.map(function(k){ return preisVon(k, 1); }).join(',')===p1.join(','));
ok('(a) preisFuer(kat) = Preis der NÄCHSTEN Stufe', (function(){ stand({ fahrzeuge:3 }); var r=preisFuer('fahrzeuge')===preisVon('fahrzeuge', 4) && preisFuer('wohnen')===preisVon('wohnen', 1); stand({}); return r; })());

/* ══ (b) Stufenfaktor ═════════════════════════════════════════════════ */
kopf('(b) Stufenfaktor: Vergangenheit 1 + 0,15 × (s − 1) · Zukunft ab 3,0 mit × 1,35');
ok('(b) Vergangenheit (Fahrzeuge 1–8): 1 · 1,15 · … · 2,05', nah(stufenFaktor('fahrzeuge',1), 1, 1e-9) && nah(stufenFaktor('fahrzeuge',2), 1.15, 1e-9) && nah(stufenFaktor('fahrzeuge',5), 1.6, 1e-9) && nah(stufenFaktor('fahrzeuge',8), 2.05, 1e-9));
ok('(b) Zukunft (Fahrzeuge 9–12): 3,0 · 4,05 · 5,4675 · 7,381', nah(stufenFaktor('fahrzeuge',9), 3, 1e-9) && nah(stufenFaktor('fahrzeuge',10), 4.05, 1e-9) && nah(stufenFaktor('fahrzeuge',11), 5.4675, 1e-9) && nah(stufenFaktor('fahrzeuge',12), 3*Math.pow(1.35,3), 1e-9));
ok('(b) die erste Zukunftsstufe ist immer 3,0 — auch wenn sie früher kommt (Mobilität Stufe 5, Wohnen Stufe 7)', nah(stufenFaktor('mobilitaet',4), 1.45, 1e-9) && nah(stufenFaktor('mobilitaet',5), 3, 1e-9) && nah(stufenFaktor('mobilitaet',12), 3*Math.pow(1.35,7), 1e-9) &&
   nah(stufenFaktor('wohnen',6), 1.75, 1e-9) && nah(stufenFaktor('wohnen',7), 3, 1e-9));
ok('(b) Preis = P1 × Stufenfaktor, auf 5 gerundet (Fahrzeuge 9: '+preisVon('fahrzeuge',9)+')', preisVon('fahrzeuge',9)===Math.round(preisStufe1('fahrzeuge')*3/5)*5 && preisVon('soziales',12)===Math.round(preisStufe1('soziales')*3*Math.pow(1.35,3)/5)*5);
var _oe=oePStd7; S.belohnung.tempoBasis=200; oePStd7=function(){ return 300; };
ok('(b) Tempo: Ø P/h 300 gegen Tempo-Basis 200 → Preise × 1,5', tempoFaktor()===1.5 && preisVon('fahrzeuge',1)===Math.round(preisStufe1('fahrzeuge')*1.5/5)*5);
oePStd7=function(){ return 120; };
ok('(b) … langsamer als die Basis: mindestens 1,0 — die Preise fallen nie unter das Startniveau', tempoFaktor()===1 && preisVon('fahrzeuge',1)===p1[0]);
oePStd7=_oe; S.belohnung.tempoBasis=null;
ok('(b) ohne gemerkte Tempo-Basis Faktor 1', tempoFaktor()===1);

/* ══ (c) Voraussetzungen ══════════════════════════════════════════════ */
kopf('(c) Voraussetzungen: Liste [Kategorie, Stufe], alle müssen erfüllt sein');
tagDonnerstag();
stand({ fahrzeuge:10, wohnen:8, reisen:9, mobilitaet:6, beziehung:9, soziales:9 });
ok('(c) Fahrzeuge Stufe 11 braucht Wohnen Stufe 9: mit Wohnen 8 gesperrt („braucht Wohnen Stufe 9")', JSON.stringify(stufeVon('fahrzeuge',11).braucht)==='[["wohnen",9]]' && kaufSperre('fahrzeuge')==='braucht Wohnen Stufe 9');
muenzen(1000000);
ok('(c) … der Kauf wird abgewiesen, Stufe und Konto bleiben', (function(){ var k=konto(); return kaufen('fahrzeuge')===false && stufenGekauft('fahrzeuge')===10 && konto()===k; })());
S.belohnung.stufen.wohnen=9;
ok('(c) mit Wohnen 9 ist Fahrzeuge 11 frei', kaufSperre('fahrzeuge')===null);
var _br=BELOHNUNG.soziales.stufen[1].braucht; BELOHNUNG.soziales.stufen[1].braucht=[['wohnen',2],['reisen',3]];
stand({ soziales:1, wohnen:1, reisen:1 });
ok('(c) Liste mit zwei Einträgen: beide fehlen → „braucht Wohnen Stufe 2 und Reisen Stufe 3"', kaufSperre('soziales')==='braucht Wohnen Stufe 2 und Reisen Stufe 3');
S.belohnung.stufen.wohnen=2;
ok('(c) … eine erfüllt → nur die andere genannt; beide erfüllt → frei', kaufSperre('soziales')==='braucht Reisen Stufe 3' && (S.belohnung.stufen.reisen=3, kaufSperre('soziales')===null));
BELOHNUNG.soziales.stufen[1].braucht=_br; if(_br===undefined) delete BELOHNUNG.soziales.stufen[1].braucht;
ok('(c) innerhalb einer Kategorie streng der Reihe nach; nach Stufe 12 „komplett"', (function(){ stand({ wohnen:12 }); var r=kaufSperre('wohnen')==='komplett' && kaufen('wohnen')===false; stand({}); return r && stufenGekauft('wohnen')===0; })());
ok('(c) die zehn Voraussetzungen der Stufen-Datei lassen sich mit dem Gleichgewicht vollständig erfüllen (alle 72 Stufen erreichbar)', (function(){ stand({}); var schritte=0, weiter=true;
  while(weiter && schritte<80){ var frei=KAT_KEYS.filter(function(k){ return kaufSperre(k)===null; }); if(!frei.length) break;
    frei.sort(function(a,b){ return zukunftFortschritt(a)-zukunftFortschritt(b) || stufenGekauft(a)-stufenGekauft(b); }); S.belohnung.stufen[frei[0]]++; schritte++; }
  var r=schritte===72 && KAT_KEYS.every(function(k){ return stufenGekauft(k)===12; }); stand({}); return r; })());

/* ══ (d) Gleichgewicht ════════════════════════════════════════════════ */
kopf('(d) Gleichgewicht der Zukunftsstufen');
tagDonnerstag(); muenzen(1000000);
stand({ fahrzeuge:8, wohnen:6, reisen:8, mobilitaet:4, beziehung:8, soziales:8 });   // alle Rückblick-Stufen gekauft, keine Zukunftsstufe
ok('(d) Zukunftsstufen je Kategorie 4 · 6 · 4 · 8 · 4 · 4; Zukunftsfortschritt überall 0', KAT_KEYS.map(zukunftStufen).join(',')==='4,6,4,8,4,4' && KAT_KEYS.every(function(k){ return zukunftFortschritt(k)===0; }));
ok('(d) Beziehung Stufe 9 (Fortschritt danach 0,25) und Stufe 10 (0,5) sind frei — 0,5 Vorsprung ist erlaubt', kaufSperre('beziehung')===null && kaufen('beziehung')===true && kaufSperre('beziehung')===null && kaufen('beziehung')===true && zukunftFortschritt('beziehung')===0.5);
ok('(d) Beziehung Stufe 11 läge bei 0,75 — mehr als 0,5 über dem niedrigsten (0): gesperrt, „erst Fahrzeuge nachziehen"', gleichgewichtSperre('beziehung')==='fahrzeuge' && kaufSperre('beziehung')==='erst Fahrzeuge nachziehen' && kaufen('beziehung')===false && stufenGekauft('beziehung')===10);
kaufen('fahrzeuge'); kaufen('reisen'); kaufen('soziales'); kaufen('mobilitaet'); kaufen('mobilitaet'); kaufen('wohnen');
ok('(d) noch nicht genug nachgezogen (Wohnen bei 1 ÷ 6 = 0,17): weiter gesperrt, jetzt „erst Wohnen nachziehen"', nah(zukunftFortschritt('wohnen'), 1/6, 1e-9) && kaufSperre('beziehung')==='erst Wohnen nachziehen');
kaufen('wohnen');
print('   Zukunftsfortschritt: '+KAT_KEYS.map(function(k){ return BELOHNUNG[k].name+' '+zukunftFortschritt(k).toFixed(2); }).join(' · '));
ok('(d) nach dem Nachziehen (niedrigster Fortschritt 0,25): Beziehung Stufe 11 ist frei und lässt sich kaufen', Math.min.apply(null, KAT_KEYS.map(function(k){ return zukunftFortschritt(k); }))===0.25 && kaufSperre('beziehung')===null && kaufen('beziehung')===true && stufenGekauft('beziehung')===11);
stand({ fahrzeuge:12, wohnen:12, reisen:12, mobilitaet:2, beziehung:12, soziales:12 });
ok('(d) Vergangenheitsstufen sind ausgenommen: Mobilität Stufe 3 (Rückblick) bleibt kaufbar, auch wenn alle anderen weit voraus sind', gleichgewichtSperre('mobilitaet')===null && kaufSperre('mobilitaet')===null);
stand({ fahrzeuge:8, wohnen:6, reisen:8, mobilitaet:4, beziehung:8, soziales:8 });
ok('(d) die Kategorie mit dem niedrigsten Fortschritt selbst ist nie gesperrt', KAT_KEYS.every(function(k){ return gleichgewichtSperre(k)===null; }));

/* ══ (e) Übernahme ════════════════════════════════════════════════════ */
kopf('(e) Übernahme beim ersten Start von 3.6.0');
frisch(); delete S.meta.shop360;
S.belohnung={ stufen:{fahrzeuge:3, wohnen:2, reisen:2, mobilitaet:1, begleiter:4, soziales:1}, ausgegeben:24500,
  kaeufe:[{kat:'fahrzeuge', stufe:2, name:'alt', datum:'2026-08-01', preis:9000},{kat:'begleiter', stufe:3, name:'alt', datum:'2026-08-09', preis:5500}] };
S.meta.muenzenGesamt=30000; S.meta.muenzenResetOffset=0; S.meta.ausgegebenGesamt=24500; S.meta.ausgabenResetOffset=10000; S.meta.rangBest=13;
S.meta.ausmalen={ kulisse:2, gefaerbt:[3,4], toepfe:[{farbe:1, punkte:50}], aktiverTopf:0, stationFarbe:1, tank:7, wohlstandSeitReset:0, freigeschaltetBis:2, fertig:[1], verteilt:0 };
var kontoVor=konto(), ausgVor=ausgabenAnzeige(), ausmalVor=JSON.stringify(S.meta.ausmalen);
shop360Durchfuehren();
ok('(e) alle sechs Kategorien starten bei 0 gekauften Stufen; „begleiter" gibt es nicht mehr', KATS.every(function(k){ return S.belohnung.stufen[k]===0; }) && Object.keys(S.belohnung.stufen).join(',')===KATS.join(','));
ok('(e) Münzen-Gutschrift: die bisher ausgegebenen Münzen ('+ausgVor+') sind vollständig zurück — Konto '+kontoVor+' → '+konto(), ausgVor===14500 && konto()===kontoVor+ausgVor && ausgabenAnzeige()===0 && S.meta.shop360.gutschrift===14500);
ok('(e) der Ausgaben-Zähler der Anzeige ist gesenkt, die Gesamt-Zähler bleiben (Münzen 30.000, ausgegeben gesamt 24.500)', S.meta.muenzenGesamt===30000 && S.meta.ausgegebenGesamt===24500 && S.meta.ausgabenResetOffset===24500);
ok('(e) Sicherung shop360_bak trägt den alten Stand (Stufen, Kaufliste, Zähler)', (function(){ var b=DB.get('shop360_bak', null);
  return b && b.belohnung.stufen.fahrzeuge===3 && b.belohnung.stufen.begleiter===4 && b.belohnung.kaeufe.length===2 && b.meta.ausgegebenGesamt===24500 && b.meta.ausgabenResetOffset===10000 && !!b.ts; })());
ok('(e) die alte Kaufliste steht nicht mehr in der Anzeige', S.belohnung.kaeufe.length===0 && S.meta.shop360.kaeufeAlt===2);
ok('(e) Rang, Outfit-Grundlage und Farbe/Kulissen unberührt', S.meta.rangBest===13 && JSON.stringify(S.meta.ausmalen)===ausmalVor);
ok('(e) die Tempo-Basis der Preise ist gemerkt (belohnung.tempoBasis = Ø P/h beim ersten Start)', S.belohnung.tempoBasis===oePStd7() && S.belohnung.tempoBasis>0 && tempoFaktor()===1);
ok('(e) einmalig: der Start prüft das Merkmal S.meta.shop360', /if\(!S\.meta\.shop360\)\{ try\{ shop360Durchfuehren\(\); \}/.test(src) && !!S.meta.shop360.ts);
ok('(e) Import-Alias: „begleiter" wird als „beziehung" angenommen (Stufen und Kaufliste)', (function(){ var b=belohnungAlias({ stufen:{begleiter:5, fahrzeuge:1}, kaeufe:[{kat:'begleiter', stufe:5}] });
  return b.stufen.beziehung===5 && b.stufen.begleiter===undefined && b.kaeufe[0].kat==='beziehung'; })() && /setz\('belohnung', belohnungAlias\(wh\.belohnung\)\)/.test(src));
ok('(e) Export: die Kategorie heißt „beziehung"', (function(){ belohnungInit(); var t=JSON.stringify(S.belohnung); return t.indexOf('"beziehung"')>=0 && t.indexOf('begleiter')<0; })());

/* ══ (f) Einfärbung ═══════════════════════════════════════════════════ */
kopf('(f) Einfärbung je Stufe');
var P1=objFarbParameter(1), P12=objFarbParameter(12), P6=objFarbParameter(6);
ok('(f) Parameter: t = (Stufe − 1) ÷ 11 · Sättigung 0,06 + 0,90 × t^1,15 · lo 0,30 − 0,14 t · hi 0,95 − 0,08 t · Mischung 0,35 + 0,65 t', P1.t===0 && nah(P1.s, 0.06, 1e-9) && nah(P1.lo, 0.30, 1e-9) && nah(P1.hi, 0.95, 1e-9) && nah(P1.misch, 0.35, 1e-9) &&
   P12.t===1 && nah(P12.s, 0.96, 1e-9) && nah(P12.lo, 0.16, 1e-9) && nah(P12.hi, 0.87, 1e-9) && nah(P12.misch, 1, 1e-9) && nah(P6.t, 5/11, 1e-9) && nah(P6.s, 0.06+0.9*Math.pow(5/11, 1.15), 1e-9));
function hsl(c){ var r=c[0]/255, g=c[1]/255, b=c[2]/255, mx=Math.max(r,g,b), mn=Math.min(r,g,b), l=(mx+mn)/2, d=mx-mn, s=d===0 ? 0 : d/(1-Math.abs(2*l-1)), h=0;
  if(d>0){ if(mx===r) h=((g-b)/d)%6; else if(mx===g) h=(b-r)/d+2; else h=(r-g)/d+4; h=(h*60+360)%360; } return { h:h, s:s, l:l }; }
var orig=[200,120,40], lumO=objLuminanz(200,120,40);
var e1=objPixelFaerben(200,120,40, lumO, P1, 205), e12=objPixelFaerben(200,120,40, lumO, P12, 205);
print('   Original '+orig.join(',')+' → Stufe 1 '+e1.join(',')+' · Stufe 12 '+e12.join(',')+' (Farbton 205°)');
ok('(f) t = 0 (Stufe 1): nahezu das Original — 65 % Original, 35 % fast farbloser Ton; jeder Kanal höchstens 35 % des Farbraums entfernt, der eigene Farbton bleibt erkennbar', orig.every(function(v,i){ return Math.abs(e1[i]-v)<=0.35*255; }) &&
   (function(){ var grau=hslRgb(205, 0.06, 0.95); return orig.every(function(v,i){ return Math.abs(e1[i]-Math.round(v+(grau[i]-v)*0.35))<=1; }); })() && e1[0]>e1[1] && e1[1]>e1[2]);
ok('(f) t = 1 (Stufe 12): voll gesättigt im Farbton der Kategorie — Farbton 205° ± 1°, Sättigung ≥ 0,95, nichts vom Original bleibt', Math.abs(hsl(e12).h-205)<=1 && hsl(e12).s>=0.95 && e12[2]>e12[1] && e12[1]>e12[0]);
ok('(f) jede Kategorie in ihrem Farbton (Stufe 12): 0° · 25° · 180° · 205° · 340° · 36°', KAT_KEYS.every(function(k){ var c=objPixelFaerben(200,120,40, lumO, P12, BELOHNUNG[k].farbton), h=hsl(c).h, soll=BELOHNUNG[k].farbton, d=Math.min(Math.abs(h-soll), 360-Math.abs(h-soll)); return d<=1.5 && hsl(c).s>=0.9; }));
ok('(f) Helligkeit folgt der Luminanz: der hellste Punkt landet bei hi (0,87 bei Stufe 12), Schwarz bei lo (0,16)', nah(hsl(objPixelFaerben(255,255,255, 1, P12, 0)).l, 0.87, 0.01) && nah(hsl(objPixelFaerben(0,0,0, 1, P12, 0)).l, 0.16, 0.01) &&
   hsl(objPixelFaerben(180,180,180, 1, P12, 0)).l>hsl(objPixelFaerben(60,60,60, 1, P12, 0)).l);
ok('(f) Sättigung und Mischung steigen stetig von Stufe 1 bis 12', (function(){ var r=true; for(var i=2;i<=12;i++){ var a=objFarbParameter(i-1), b=objFarbParameter(i); if(!(b.s>a.s && b.misch>a.misch && b.lo<a.lo && b.hi<a.hi)) r=false; } return r; })());
ok('(f) Alpha bleibt unverändert, das Original wird nicht überschrieben, das Ergebnis liegt je Kategorie/Stufe im Speicher', rumpf('objBildFaerben').indexOf('d[i+3]=')<0 && /d\[i\]=c\[0\]; d\[i\+1\]=c\[1\]; d\[i\+2\]=c\[2\];/.test(rumpf('objBildFaerben')) &&
   /_objBild\[key\]=url/.test(rumpf('objBildLaden')) && objBildSchluessel('wohnen', 7)==='wohnen|7');

/* ══ (g) Bild-Rückfall ════════════════════════════════════════════════ */
kopf('(g) Objektbilder: neue Datei zuerst, Rückfall auf die alten');
ok('(g) neue Datei img/obj-{kat}-{n}.png mit n = ceil(Stufe ÷ 2): Stufe 1/2 → 1 · 7 → 4 · 12 → 6', objBildQuellen('fahrzeuge',1)[0]==='img/obj-fahrzeuge-1.png' && objBildQuellen('fahrzeuge',2)[0]==='img/obj-fahrzeuge-1.png' &&
   objBildQuellen('wohnen',7)[0]==='img/obj-wohnen-4.png' && objBildQuellen('beziehung',12)[0]==='img/obj-beziehung-6.png');
ok('(g) Rückfall: fahrzeuge→obj-car · wohnen→obj-home · reisen→obj-air · mobilitaet→obj-boat · beziehung→obj-pet · soziales→obj-friends', KATS.map(function(k){ return objBildQuellen(k,12)[1]; }).join(',')===
   'img/obj-car5.png,img/obj-home5.png,img/obj-air5.png,img/obj-boat5.png,img/obj-pet5.png,img/obj-friends5.png');
ok('(g) Rückfall-Index = min(5, ceil(Stufe × 5 ÷ 12)): Stufe 1 → 1 · 3 → 2 · 7 → 3 · 10 → 5 · 12 → 5', [1,3,7,10,12].map(function(s){ return objBildQuellen('fahrzeuge',s)[1]; }).join(',')===
   'img/obj-car1.png,img/obj-car2.png,img/obj-car3.png,img/obj-car5.png,img/obj-car5.png');
var geladen=[];
Image=function(){ var self=this; Object.defineProperty(this, 'src', { get:function(){ return self._src; }, set:function(v){ self._src=v; geladen.push(v);
  if(/obj-[a-z]+-\d\.png$/.test(v)){ if(self.onerror) self.onerror(); } else { self.naturalWidth=10; self.naturalHeight=10; if(self.onload) self.onload(); } } }); };
frisch(); objBildLaden('fahrzeuge|1');
ok('(g) fehlt die neue Datei, lädt das Bild aus der alten (erst obj-fahrzeuge-1, dann obj-car1)', geladen.join(',')==='img/obj-fahrzeuge-1.png,img/obj-car1.png' && _objBild['fahrzeuge|1']==='img/obj-car1.png' && !_objLaedt['fahrzeuge|1']);
geladen=[]; objBildLaden('fahrzeuge|2');
ok('(g) eine als fehlend bekannte neue Datei wird nicht noch einmal versucht (Stufe 2 nutzt dieselbe Datei)', geladen.join(',')==='img/obj-car1.png' && _objFehlt['img/obj-fahrzeuge-1.png']===true);
geladen=[]; objBildLaden('fahrzeuge|1');
ok('(g) ein Bild im Speicher wird nicht erneut geladen; objBildHtml setzt es sofort ein', geladen.length===0 && objBildHtml('fahrzeuge', 1).indexOf('data-objbild="fahrzeuge|1" src="img/obj-car1.png"')>=0 && objBildHtml('wohnen', 3).indexOf('class="objimg laedt" data-objbild="wohnen|3"')>=0);
Image=function(){ var self=this; Object.defineProperty(this, 'src', { get:function(){ return self._src; }, set:function(v){ self._src=v; geladen.push(v); self.naturalWidth=10; self.naturalHeight=10; if(self.onload) self.onload(); } }); };
geladen=[]; objBildLaden('reisen|5');
ok('(g) ist die neue Datei da, wird nur sie geladen', geladen.join(',')==='img/obj-reisen-3.png' && _objBild['reisen|5']==='img/obj-reisen-3.png');
Image=undefined;
ok('(g) überall dieselbe Funktion: Shop-Feld, Stufenliste, Album und Kauf-Belohnung zeichnen über objBildHtml', rumpf('belShopHtml').indexOf('objBildHtml(kk, Math.max(1, gek))')>=0 && rumpf('belShopHtml').indexOf('objBildHtml(kk, n)')>=0 &&
   rumpf('renderAlbum').indexOf('objBildHtml(kat, stufe)')>=0 && rumpf('kaufBelohnungHtml').indexOf('objBildHtml(d.kat, d.stufe)')>=0 && src.indexOf("'img/obj-'+zone")<0);

/* ══ (h) Fokuszeit seit dem letzten Kauf ══════════════════════════════ */
kopf('(h) Fokuszeit seit dem letzten Kauf');
tagDonnerstag(); muenzen(1000000);
S.meta.shop360={ ts:'2026-10-01T06:00:00.000Z' };   // Start von 3.6.0 um 08:00 Ortszeit
S.intraday=[ { ts:'2026-10-01T05:30:00.000Z', kartenId:'x', domaene:'dfm', punkte:0, minuten:50, typ:'timer' },      // vor dem Start von 3.6.0
             { ts:'2026-10-01T06:40:00.000Z', kartenId:'x', domaene:'dfm', punkte:0, minuten:40, typ:'timer' },
             { ts:'2026-10-01T06:50:00.000Z', kartenId:'y', domaene:'privat', punkte:0, minuten:0, tickMin:5, typ:'tick' } ];
ok('(h) Summe der gebuchten Minuten aller Karten in einem Zeitraum (Uhr 40 + Belegzeit eines Ticks 5 = 45; davor Gebuchtes zählt nicht)', fokusMinSeit('2026-10-01T06:00:00.000Z', null)===45 && fokusMinSeit(null, null)===95 && fokusMinSeit('2026-10-01T06:45:00.000Z', null)===5);
ok('(h) vor dem ersten Kauf zählt der Start von 3.6.0', letzterKaufTs()==='2026-10-01T06:00:00.000Z');
uhr('2026-10-01T09:30:00+02:00'); kaufen('soziales');
var k1=S.belohnung.kaeufe[0];
ok('(h) erster Kauf: fokusMin = 45 (seit dem Start von 3.6.0), ts gesetzt', S.belohnung.kaeufe.length===1 && k1.fokusMin===45 && k1.ts===jetztIso() && k1.kat==='soziales' && k1.stufe===1 && k1.datum===DO && k1.preis>0 && k1.name===stufeName('soziales', 1));
S.intraday.push({ ts:'2026-10-01T08:10:00.000Z', kartenId:'x', domaene:'dfm', punkte:0, minuten:72, typ:'timer' }, { ts:'2026-10-01T09:00:00.000Z', kartenId:'x', domaene:'dfm', punkte:0, minuten:120, typ:'timer' });
uhr('2026-10-01T12:00:00+02:00'); kaufen('soziales');
var k2=S.belohnung.kaeufe[1];
ok('(h) zweiter Kauf: nur die Minuten SEIT dem ersten Kauf (72 + 120 = 192 = 3 Std 12 Min)', k2.fokusMin===192 && k2.stufe===2 && stdMinText(k2.fokusMin)==='3 Std 12 Min' && letzterKaufTs()===k2.ts);
var kb=kaufBelohnungHtml(kaufBelohnungDaten('soziales', 2, k2.preis, k2.fokusMin));
ok('(h) Kauf-Belohnung: „3 Std 12 Min · Fokuszeit seit deinem letzten Kauf", Münzen abgezogen und Rest, Stufenstand „2 von 12 … 10 noch offen"', kb.indexOf('<b>3 Std 12 Min</b><span>Fokuszeit seit deinem letzten Kauf</span>')>=0 &&
   kb.indexOf('−'+fmtP(k2.preis)+'</b><span>Münzen · '+fmtP(Math.round(konto()))+' bleiben</span>')>=0 && kb.indexOf('<b>2 von 12</b><span>Stufen in Soziales · 10 noch offen</span>')>=0);
ok('(h) … Kopf „Gekauft · Soziales Stufe 2", eingefärbtes Objekt mit Leuchten, Name, Gleichgewicht als sechs Säulen, „Weiter"', kb.indexOf('Gekauft · Soziales Stufe 2')>=0 && kb.indexOf('<div class="glow"></div><img class="objimg')>=0 && kb.indexOf('data-objbild="soziales|2"')>=0 &&
   kb.indexOf('<span class="stufen-name">'+esc(stufeName('soziales', 2))+'</span>')>=0 && (kb.match(/background:hsl\(/g)||[]).length===6 && kb.indexOf('data-belweiter="1">Weiter</button>')>=0 && kb.indexOf('Doppeltipp überspringt')<0);   // §4b (v3.7.0): nicht mehr ueberspringbar
ok('(h) Schritte animiert (gestaffelte Verzögerung), „Weiter" — §4b (v3.7.0): KEIN Doppeltipp mehr, Schritt „Farbe wählen"', (kb.match(/class="st [^"]*" style="animation-delay:/g)||[]).length>=6 && !/dblclick/.test(rumpf('kaufBelohnungZeigen')) &&
   /kaufBelohnungZeigen\(kaufBelohnungDaten\(kat, idx\+1, preis, fokusMin\)\)/.test(rumpf('kaufen')) && kb.indexOf('Farbe wählen')>=0);
stand({ fahrzeuge:10, wohnen:8, reisen:8, mobilitaet:4, beziehung:8, soziales:8 });
var dW=(S.belohnung.stufen.wohnen=9, kaufBelohnungDaten('wohnen', 9, 100, 10)), hW=kaufBelohnungHtml(dW);
ok('(h) was der Kauf freischaltet: Wohnen Stufe 9 schaltet Fahrzeuge Stufe 11 frei („jetzt möglich: Fahrzeuge Stufe 11")', dW.frei.length===1 && dW.frei[0].kat==='fahrzeuge' && dW.frei[0].stufe===11 && hW.indexOf('jetzt möglich: Fahrzeuge Stufe 11')>=0);
ok('(h) … und welche Voraussetzung als Nächstes fehlt: Wohnen Stufe 10 braucht Beziehung Stufe 9', dW.sperre==='braucht Beziehung Stufe 9' && hW.indexOf('hier: braucht Beziehung Stufe 9')>=0);
ok('(h) Gleichgewichts-Satz nennt die Kategorie, die zuerst nachzuziehen ist', dW.schwach && dW.schwach.kat==='reisen' && dW.schwach.hinter>=1 && hW.indexOf('Reisen liegt '+dW.schwach.hinter+' hinter · zieh sie zuerst nach')>=0 &&
   (function(){ stand({}); return kaufBelohnungHtml(kaufBelohnungDaten('soziales', 1, 5, 0)).indexOf('Alle sechs Kategorien liegen gleichauf')>=0; })());

/* ══ §6 Shop-Feld und „Was heute noch geht" ═══════════════════════════ */
kopf('§6 Shop-Feld · Was heute noch geht');
tagDonnerstag(); muenzen(100);
var sf=belShopHtml(), feld=function(h, kat){ var t=h.split('<div class="bw-kat objkat">'), i=KAT_KEYS.indexOf(kat)+1; return t[i]||''; };
ok('§6 noch nichts gekauft: Stufe-1-Bild blass mit „Noch nichts gekauft", darunter „Als Nächstes: {Name} · {Preis} Münzen"', (sf.match(/class="objbild blass"/g)||[]).length===6 && (sf.match(/>Noch nichts gekauft<\/span>/g)||[]).length===6 &&
   feld(sf,'fahrzeuge').indexOf('data-objbild="fahrzeuge|1"')>=0 && feld(sf,'fahrzeuge').indexOf('Als Nächstes: <span class="stufen-name">'+esc(stufeName('fahrzeuge',1))+'</span> · '+fmtP(preisFuer('fahrzeuge'))+' Münzen')>=0 && sf.indexOf('Zuletzt:')<0);
uhr('2026-10-01T10:00:00+02:00'); S.intraday.push({ ts:'2026-10-01T07:30:00.000Z', kartenId:'x', domaene:'dfm', punkte:0, minuten:192, typ:'timer' });
muenzen(1000000); kaufen('fahrzeuge'); muenzen(100); sf=belShopHtml(); var ff=feld(sf,'fahrzeuge');
ok('§6 nach dem Kauf zeigt das Feld die ZULETZT gekaufte Stufe: Bild der Stufe 1, „Stufe 1 von 12", „Zuletzt: {Name}", „gekauft am 01.10. · in 3:12 Std erarbeitet"', ff.indexOf('class="objbild"')>=0 && ff.indexOf('data-objbild="fahrzeuge|1"')>=0 && ff.indexOf('>Stufe 1 von 12</span>')>=0 &&
   ff.indexOf('Zuletzt: <b class="w stufen-name">'+esc(stufeName('fahrzeuge',1))+'</b>')>=0 && ff.indexOf('<span>gekauft am 01.10. · in 3:12 Std erarbeitet</span>')>=0);
ok('§6 … darunter „Als Nächstes: {Name der Stufe 2} · {Preis}", Füllbalken, „fehlen …", Stufenpunkte (1 gekauft GOLD, 2 Umriss)', ff.indexOf('Als Nächstes: <span class="stufen-name">'+esc(stufeName('fahrzeuge',2))+'</span> · '+fmtP(preisVon('fahrzeuge',2))+' Münzen')>=0 &&
   ff.indexOf('class="lbar"')>=0 && ff.indexOf('fehlen '+fmtP(preisVon('fahrzeuge',2)-100))>=0 && /<div class="stufen"[^>]*><i class="gk"><\/i><i class="n"><\/i>(<i class=""><\/i>){10}<\/div>/.test(ff));
ok('§6 kein Name einer späteren Stufe steht im Feld (alles nach der nächsten bleibt verborgen)', [3,4,12].every(function(s){ return sf.indexOf(esc(stufeName('fahrzeuge', s)))<0; }));
stand({ fahrzeuge:10, wohnen:8, reisen:9, mobilitaet:6, beziehung:9, soziales:9 }); sf=belShopHtml();
ok('§6 Voraussetzung rechts unter dem Balken („braucht Wohnen Stufe 9"), kein Kaufen-Knopf', /<span class="bw-sperre">braucht Wohnen Stufe 9<\/span>/.test(feld(sf,'fahrzeuge')) && feld(sf,'fahrzeuge').indexOf('data-kauf="fahrzeuge"')<0);
stand({ fahrzeuge:8, wohnen:6, reisen:8, mobilitaet:4, beziehung:10, soziales:8 }); muenzen(1000000); sf=belShopHtml();
ok('§6 Gleichgewichts-Sperre an derselben Stelle („erst Fahrzeuge nachziehen"); freie Kategorien tragen den Kaufen-Knopf', /<span class="bw-sperre">erst Fahrzeuge nachziehen<\/span>/.test(feld(sf,'beziehung')) && feld(sf,'beziehung').indexOf('data-kauf=')<0 && feld(sf,'fahrzeuge').indexOf('data-kauf="fahrzeuge"')>=0);
stand({ wohnen:12 }); ok('§6 Kategorie komplett: „Alle zwölf Stufen gekauft", Bild der Stufe 12', feld(belShopHtml(),'wohnen').indexOf('Alle zwölf Stufen gekauft')>=0 && feld(belShopHtml(),'wohnen').indexOf('data-objbild="wohnen|12"')>=0);
tagDonnerstag(); muenzen(100);
var hk=heuteGehtKacheln(), bu=belUebersichtHtml(), sm=(S.ui.statOffen={}, stmHeuteGeht(analyseFenster(), 'alle')), smAuf=(S.ui.statOffen={heuteGeht:true}, stmHeuteGeht(analyseFenster(), 'alle'));
ok('§6 „Was heute noch geht": vier Kacheln mit Zahl und Balken — Noch drin · Rest im Fenster · Nächster Kauf · Nächstes Outfit', (hk.match(/class="kch flach hg"/g)||[]).length===4 && (hk.match(/class="lbar"/g)||[]).length===4 &&
   ['Noch drin','Rest im Fenster','Nächster Kauf','Nächstes Outfit'].every(function(t,i,a){ var p=hk.indexOf('<div class="h">'+t+'</div>'); return p>=0 && (i===0 || p>hk.indexOf('<div class="h">'+a[i-1]+'</div>')); }));
ok('§6 Statistik (Gruppe Spiel & Shop) und Shop-Übersicht nutzen dieselbe Funktion', bu.indexOf('<div class="blk-h">Was heute noch geht</div>'+hk)>=0 && sm.indexOf(hk)>=0 && (src.match(/function heuteGehtKacheln\(/g)||[]).length===1 &&
   STAT_GRUPPE.heuteGeht===5 && STAT_MODULE.some(function(x){ return x[0]==='heuteGeht' && x[1]==='Was heute noch geht'; }));
ok('§6 zugeklappt nur die vier; aufgeklappt zusätzlich Farbe · Kulisse · Rang · Outfit 20, Akku-Satz, Kauf-Satz und „▴ Einklappen"', (sm.match(/class="kch flach hg"/g)||[]).length===4 && sm.indexOf('data-stmzu')<0 && (smAuf.match(/class="kch flach hg"/g)||[]).length===8 &&
   ['Farbe','Kulisse 1','Rang','Outfit 20'].every(function(t){ return smAuf.indexOf('<div class="h">'+t)>=0; }) && smAuf.indexOf('<div class="hg-satz">🔋 ')>=0 && smAuf.indexOf('<div class="hg-satz">🪙 ')>=0 && smAuf.indexOf('data-stmzu="heuteGeht">▴ Einklappen</button>')>=0);
var dH=heuteGehtDaten();
ok('§6 Logik wie 3.4.8: Rest im Fenster aus der Soll-Treppe, Noch drin = Rest × Median-Tempo, Outfit 20 „morgen", wenn rechnerisch nicht drin', dH.restStd===restFensterStd() && (dH.tempo==null ? dH.nochDrin===null : nah(dH.nochDrin, dH.restStd*dH.tempo, 1e-6)) &&
   dH.fFrack===Math.round(outfitFehltBis(20)) && (dH.frackGeht || smAuf.indexOf('>morgen</div><div class="s">heute rechnerisch nicht drin</div>')>=0));
ok('§6 Kachel „Nächster Kauf": „fehlen {x}" in GOLD mit Name der nächsten Stufe; ist ein Kauf möglich, der Kaufhinweis', hk.indexOf('style="color:'+FARBE.GOLD+'">fehlen '+fmtP(preisFuer('soziales')-100)+'</div>')>=0 && hk.indexOf('<span class="stufen-name">'+esc(stufeName('soziales',1))+'</span>')>=0 &&
   (function(){ muenzen(preisFuer('soziales')+1); var h=heuteGehtKacheln(); muenzen(100); return h.indexOf('Kauf möglich: Soziales Stufe 1')>=0 && h.indexOf('bis Beziehung Stufe 1: fehlen ')>=0; })());

/* ══ (i) kein „Wohlstand" in der Oberfläche ═══════════════════════════ */
kopf('(i) „Wohlstand" heißt „Farbe"');
tagDonnerstag(); muenzen(2000);
S.karten=[ aufgabe('w1','dfm',60), aufgabe('w2','privat',30) ]; fokusStarten('w1', null); minuten(20);
_kul[1]={ json:{ felder:[{feld:1,farbe:0,anteil:.5,flaechePx:100},{feld:2,farbe:1,anteil:.5,flaechePx:100}], farben:[{farbe:0,hex:'#111111'},{farbe:1,hex:'#222222'}] },
  punkte:{1:1000, 2:800}, farbeVon:{1:0, 2:1}, maxP:1000, hex:['#111111','#222222'], namen:['Ocker','Schwarz'], topFarben:['#111111','#222222'] };
S.ui.statOffen={}; STAT_MODULE.forEach(function(x){ S.ui.statOffen[x[0]]=true; });
var _auf=einstAbschnittOffen; einstAbschnittOffen=function(){ return true; };
renderAlles(); renderFokus(); renderStatistik(); renderEinst();
var seiten={ Statusleiste:(function(){ var a=src.indexOf('<div id="topbar">'), b=src.indexOf('<main', a); return a<0 ? '' : src.slice(a, b).replace(/<!--[\s\S]*?-->/g, ''); })(), Fokus:el('fokusView').innerHTML, Statistik:el('statistikBody').innerHTML, Einstellungen:el('einstBody').innerHTML };
S.ui.malmodus=false; renderBelohnung(); seiten.Shop=el('belohnungBody').innerHTML;
S.ui.malmodus=true; renderBelohnung(); seiten.Malmodus=el('belohnungBody').innerHTML; S.ui.malmodus=false;
['raenge','kulissen','besitz'].forEach(function(t){ albumTab=t; renderAlbum(); seiten['Album '+t]=el('sheetBody').innerHTML; });
seiten['Kauf-Belohnung']=kaufBelohnungHtml(kaufBelohnungDaten('soziales', 1, 5, 0));
seiten['Was heute noch geht']=heuteGehtKacheln()+heuteGehtMehrHtml();
einstAbschnittOffen=_auf;
var mit=Object.keys(seiten).filter(function(k){ return /Wohlstand/.test(seiten[k]); });
print('   geprüfte Ansichten: '+Object.keys(seiten).map(function(k){ return k+' ('+String(seiten[k]).length+')'; }).join(' · '));
ok('(i) keine gezeichnete Ansicht enthält „Wohlstand" (Statusleiste, Fokus, Statistik, Shop, Malmodus, Album, Einstellungen, Belohnung)'+(mit.length?' — noch in: '+mit.join(', '):''), mit.length===0 && Object.keys(seiten).every(function(k){ return String(seiten[k]).length>100; }));
ok('(i) stattdessen „Farbe": Fokus-Kern „Münzen und Farbe", Kulisse „frei bei … Farbe", Kachel „Farbe", Einstellungen „Farbe (live)" (v3.6.1: der Reset heißt „Spielstand zurücksetzen")', seiten.Fokus.indexOf('Münzen und Farbe')>=0 && /nächste frei bei [\d.]+ Farbe/.test(seiten.Shop) &&
   seiten['Was heute noch geht'].indexOf('<div class="h">Farbe</div>')>=0 && seiten.Einstellungen.indexOf('<span>Farbe (live)</span>')>=0 && seiten.Einstellungen.indexOf('Farbe zurücksetzen')<0 && seiten.Einstellungen.indexOf('Spielstand zurücksetzen')>=0);
ok('(i) Statusleiste: das Zeichen ◆ bleibt, der Wert heißt „Farbe"', /<div class="kw" title="Farbe" aria-label="Farbe"><i><\/i><span id="sKW">/.test(src) && /\.kw i\{[^}]*rotate\(45deg\)/.test(src));
var ohneKommentar=src.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
ok('(i) im Quelltext steht „Wohlstand" nur noch in Kommentaren und als Teil interner Namen (ausWohlstand) — kein Text der Oberfläche trägt das Wort', !/(?:^|[^a-zA-Z_$])Wohlstand/.test(ohneKommentar) && /Wohlstand/.test(src));
ok('(i) interne Namen und Exportfelder bleiben (wohlstandSeitReset, meta.wohlstand) — der Datenvertrag bricht nicht', 'wohlstandSeitReset' in ausmalExport() && /S\.meta\.wohlstand/.test(src) && DATENVERTRAG==='2.1.0');
delete _kul[1]; fokusBeenden();

/* ══ §7 Datenvertrag additiv ══════════════════════════════════════════ */
kopf('§7 Datenvertrag (additiv)');
tagDonnerstag(); muenzen(1000000); kaufen('wohnen');
var ex=JSON.parse(JSON.stringify(S.belohnung));
ok('§7 belohnung.kaeufe[] trägt zusätzlich ts (ISO) und fokusMin (Zahl); ältere Einträge ohne die Felder bleiben gültig', typeof ex.kaeufe[0].ts==='string' && !isNaN(Date.parse(ex.kaeufe[0].ts)) && typeof ex.kaeufe[0].fokusMin==='number' &&
   (function(){ S.belohnung.kaeufe.unshift({ kat:'wohnen', stufe:1, name:'alt', datum:'2026-09-01', preis:100 }); var h=belShopHtml(); S.belohnung.kaeufe.shift(); return h.length>100 && letzterKaufTs()===ex.kaeufe[0].ts; })());
ok('§7 belohnung.tempoBasis reist im Stand mit (Vollsicherung trägt belohnung vollständig)', (function(){ S.belohnung.tempoBasis=210; return JSON.parse(JSON.stringify(S.belohnung)).tempoBasis===210 && /belohnung: JSON\.parse\(JSON\.stringify\(S\.belohnung\|\|\{\}\)\)/.test(src); })());

print('');
if(fails){ print(fails+' von '+n+' FEHLGESCHLAGEN'); throw new Error('Abnahme rot'); }
print('alle '+n+' Abnahmepunkte gruen');
