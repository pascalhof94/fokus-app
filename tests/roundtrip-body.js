/* Abnahme v1.13.5 — „Vollexport rettet die App-Bausteine".
   Nach dem Merge auf v2.0 (21.09.) am v2.0-Kartenmodell gefuehrt: die sechs
   Felder prioritaet/zeitmessung/tagesabschnitt/komplex/energie/blockade gibt
   es nicht mehr (§4), dafuer matrixFeld. Der ZWECK des Tests bleibt exakt
   derselbe — kein persistiertes Feld darf aus dem Export fallen. */
var fails=0, n=0;
function ok(t,c){ n++; print((c?'OK   ':'FAIL ')+t); if(!c) fails++; }
function kopf(t){ print(''); print('── '+t+' ──'); }
var H=heuteIso();

/* ══ Ein Bestand, der ALLE gefaehrdeten Bausteine traegt ══════════════ */
function bestandAufbauen(){
  _store={};
  S.karten=[]; S.unteraufgaben=[]; S.routinenGruppen=[]; S.gruppen=[]; S.stapel=[]; S.ordner=[];
  S.vorlagen=[]; S.historie=[]; S.intraday=[];
  S.settings=settingsMerge({ tagesZielDfm:6543, standardWertPrivat:33 });   // eigene Werte
  S.meta={ wohlstand:12345, rangPunkte:9876, muenzenGesamt:30000, ausgegebenGesamt:24500,
    rangBest:13, tagesStreak:12, tagesStreakBest:18, upgradeFaktor:1.04,
    rangResetOffset:100, muenzenResetOffset:200, ausgabenResetOffset:300,
    urlaubsmodus:false, momenteAus:true, lifetimeBasis:500, lifetimeQuelle:'wohlstand',
    akkuMessungen:[{kid:'r-katzen',kat:'privat|morgens',datum:H,delta:-5,dauerMin:20,rate:-15}],
    akkuEintraege:[{ts:H+'T09:00:00',datum:H,kid:null,vorher:80,nachher:70,delta:-10,kommentar:'schlecht geschlafen'}],
    sternTage:{}, migration160:true, migration161:true, migration180:true, zeit191:true,
    gamify190:true, rang1110:true, akku1100:true, migration1120:true, migration1130:true,
    hotfix1131:true, flowfix152:true, flowfix181:true, stapelV4:true, stapelV6:true, stapelV8:true,
    u3statusMigriert:true, u6migriert:true, panoramaReset151:true, flowBaseline133:true,
    hotfix131:true, hotfix133:true, seeded:true,
    migration160Log:{gross:'x'}, speicherAufraeumLog:{gross:'y'},   // sollen WEGbleiben
    letzteInteraktionTs:jetztIso(), jokerHinweis:5 };                // sollen WEGbleiben
  S.belohnung={ stufen:{fahrzeuge:3,wohnen:2,reisen:2,mobilitaet:1,begleiter:1,soziales:1},
                ausgegeben:24500, kaeufe:[{kat:'fahrzeuge',stufe:2,name:'X',datum:H,preis:9000}] };
  S.tag=neuerTag(H,1); S.tag.akku=72;

  /* 1) Die Routine, um die es geht: Rhythmus + Ticks + Abhakbonus + Overrides */
  S.karten.push(neueKarte({ id:'r-katzen', domain:'privat', titel:'Katzen füttern',
    rhythmus:{typ:'alleNTage', n:2}, ticksAktiv:true, tickWert:12, ticksHeute:3,
    tickWerteHeute:[12,12,15], abhakbonus:-25, zeitmessung:false, keineAutoPause:true,
    timerFlag:true, punkteProStd:0, akkuProStd:-3, matrixFeld:'werkzeug',
    streak:40, zuletztRoutine:H, freeze:false, sollMin:5, istSek:600,
    zeitStufen:[{bisMin:30,punkteProStd:200},{bisMin:null,punkteProStd:80}],
    strafPunkte:7, bewegungsBonus:120,
    sortIndex:{'sys-dfm':3}, faelligkeit:H, uhrzeit:'07:30', geldImpact:0,
    notiz:'Nassfutter', kommentarClaude:'bitte nicht verschieben' }));
  /* 2) Eine DFM-Aufgabe mit Abschluss-Stack und Unteraufgaben */
  S.karten.push(neueKarte({ id:'d-angebot', domain:'dfm', airtableId:'recAAAAAAAAAAAAAA',
    titel:'Angebot rechnen', projekt:'Fertigung', geldImpact:120,   /* v2.6.0 §5: Zahl 0 … 500 statt geldScore */ sollMin:90, istSek:1860,
    status:'erledigt', tagId:H+'-1', punkteOverride:800, faelligkeit:H,
    geplantFuer:H, matrixFeld:'ziel',
    abschluesse:[{ts:H+'T10:00:00', tagId:H+'-1', punkteIstVorher:0, istMinVorher:0,
                  bonusPunkte:0, subsDoneVorher:[], glaettung:[]}],
    vorgaengerAppId:'alt-1', ungeplant:true, schiebeZaehler:2 }));
  /* 3) Zwei weitere Gruppenmitglieder */
  S.karten.push(neueKarte({ id:'r-kueche', domain:'privat', titel:'Küche aufräumen',
    rhythmus:{typ:'taeglich'}, abhakbonus:40, matrixFeld:'werkzeug' }));
  S.karten.push(neueKarte({ id:'r-wasser', domain:'privat', titel:'Wasser trinken',
    rhythmus:{typ:'wochentage', tage:[1,2,3,4,5]}, ticksAktiv:true, tickWert:10, ticksHeute:2 }));

  S.unteraufgaben=[
    neueUnteraufgabe('d-angebot',{ id:'s1', titel:'Material', sollMin:30, done:true,  bonusPunkte:100 }),
    neueUnteraufgabe('d-angebot',{ id:'s2', titel:'Maschinen', sollMin:40, done:false, bonusPunkte:150 })
  ];
  /* 4) DIE GRUPPE mit Komplettbonus */
  S.routinenGruppen=[{ id:'g-auf', name:'Aufräumrunde', domain:'privat',
    mitglieder:['r-katzen','r-kueche','r-wasser'], komplettBonus:200,
    farbe:'#b98af7', bonusTag:null }];
  S.gruppen=[{ id:'kg-1', name:'Karten-Gruppe A' }];
  S.vorlagen=[{ id:'v1', name:'Vorlage A', cfg:{titel:'X'} }];
  S.historie=[{ datum:H, laufindex:1, punkteBilanz:3200, luecke:false }];
  S.intraday=[{ ts:H+'T09:00:00', kartenId:'d-angebot', domaene:'dfm', punkte:0, minuten:31, typ:'timer' }];
  ketteSetzen(['r-katzen','d-angebot']);   // §7 (v2.0): EINE Kette
  saveKarten(); DB.set('unteraufgaben', S.unteraufgaben); saveRoutGruppen(); saveGruppen();
  saveVorlagen(); saveHistorie(); DB.set('intraday', S.intraday); saveBelohnung();
  saveTag(); saveMeta(); DB.set('settings', S.settings);
}

/* ══ ABNAHME 1 · Kein Feld faellt weg ════════════════════════════════ */
kopf('Abnahme 1 · Routine vorher/nachher');
bestandAufbauen();
var vorher=JSON.parse(JSON.stringify(S.karten.find(function(k){return k.id==='r-katzen';})));
var paket=syncExport('vollexport');
var nachher=paket.karten.find(function(k){return k.id==='r-katzen';});

var fehlend=[];
Object.keys(vorher).forEach(function(f){
  if(f==='istSek') return;                         // bewusst als istMin im Paket
  if(nachher[f]===undefined) fehlend.push(f);
});
ok('1 Kein persistiertes Kartenfeld faellt weg'+(fehlend.length?(' — FEHLT: '+fehlend.join(', ')):''),
   fehlend.length===0);
print('   Felder vorher: '+Object.keys(vorher).length+' · im Paket: '+Object.keys(nachher).length);

/* Die konkret genannten Bausteine einzeln — sie waren der Befund. */
[['rhythmus', JSON.stringify(nachher.rhythmus)==='{"typ":"alleNTage","n":2}'],
 ['ticksAktiv', nachher.ticksAktiv===true],
 ['tickWert', nachher.tickWert===12],
 ['tickWerteHeute', JSON.stringify(nachher.tickWerteHeute)==='[12,12,15]'],
 ['ticksHeute', nachher.ticksHeute===3],
 ['abhakbonus', nachher.abhakbonus===-25],
 ['matrixFeld (v2.0)', nachher.matrixFeld==='werkzeug'],
 ['bewegungsBonus (v2.0)', nachher.bewegungsBonus===120],
 ['keineAutoPause', nachher.keineAutoPause===true],
 ['timerFlag', nachher.timerFlag===true],
 ['punkteProStd', nachher.punkteProStd===0],
 ['akkuProStd', nachher.akkuProStd===-3],
 ['zeitStufen', Array.isArray(nachher.zeitStufen) && nachher.zeitStufen.length===2],
 ['streak', nachher.streak===40],
 ['zuletztRoutine', nachher.zuletztRoutine===H],
 ['strafPunkte', nachher.strafPunkte===7],
 ['sortIndex', nachher.sortIndex && nachher.sortIndex['sys-dfm']===3],
 ['kommentarClaude', nachher.kommentarClaude==='bitte nicht verschieben']
].forEach(function(p){ ok('1 · '+p[0]+' reist mit', p[1]); });
ok('1 Abgeleitetes liegt lesbar bei (istMin aus istSek)', nachher.istMin===10);
ok('1 Der Abschluss-Stack der DFM-Karte reist mit', (function(){
     var d=paket.karten.find(function(k){return k.id==='d-angebot';});
     return Array.isArray(d.abschluesse) && d.abschluesse.length===1 && d.punkteOverride===800; })());

/* ══ ABNAHME 2 · Die Gruppe mit Komplettbonus ════════════════════════ */
kopf('Abnahme 2 · Aufräumrunde');
ok('2 gruppen[] ist ein Top-Level-Block', Array.isArray(paket.gruppen));
var g=(paket.gruppen||[])[0];
ok('2 Die Aufräumrunde erscheint mit Komplettbonus 200',
   g && g.name==='Aufräumrunde' && g.komplettBonus===200);
ok('2 ... mit allen drei Mitgliedern',
   g && g.mitglieder.length===3 && g.mitglieder.indexOf('r-katzen')>=0);
ok('2 Der Block ist spiegelbildlich zum Import (id/name/domain/mitglieder/komplettBonus)',
   g && g.id==='g-auf' && g.domain==='privat');

/* ══ ABNAHME 3 · meta-Schluessel ═════════════════════════════════════ */
kopf('Abnahme 3 · meta — mitgenommen und ausgelassen');
var mw=paket.wiederherstellung.meta;
var mit=['wohlstand','rangPunkte','muenzenGesamt','ausgegebenGesamt','rangBest','tagesStreak',
  'tagesStreakBest','upgradeFaktor','rangResetOffset','muenzenResetOffset','ausgabenResetOffset',
  'urlaubsmodus','momenteAus','lifetimeBasis','akkuMessungen','akkuEintraege','ketten',
  'migration160','zeit191','rang1110','migration1120','stapelV8','seeded'];
var fehlt2=mit.filter(function(f){ return mw[f]===undefined; });
ok('3 Alle Nutzerentscheidungen, Messprotokolle und Migrations-FLAGS sind dabei'+
   (fehlt2.length?(' — FEHLT: '+fehlt2.join(', ')):''), fehlt2.length===0);
var weg=['migration160Log','speicherAufraeumLog','letzteInteraktionTs','jokerHinweis','kettenHistorie'];
var drin=weg.filter(function(f){ return mw[f]!==undefined; });
ok('3 Sperrliste greift (Logs + transiente Werte draussen)'+
   (drin.length?(' — DRIN: '+drin.join(', ')):''), drin.length===0);
ok('3 Die Kettenhistorie liegt trotzdem im Paket (eigenes Feld, nicht in meta)',
   paket.wiederherstellung.kettenHistorie!==undefined);
print('   meta-Schluessel im Paket: '+Object.keys(mw).length);

/* ══ ABNAHME 4 · ROUND-TRIP ══════════════════════════════════════════ */
kopf('Abnahme 4 · Export → leerer Bestand → Import');
var exTxt=JSON.stringify(paket);
print('   Paketgroesse: '+Math.round(exTxt.length/1024)+' KB');

/* Schnappschuss des Ist-Standes, bevor alles geleert wird.
   WICHTIG: schluesselreihenfolge-UNABHAENGIG vergleichen — eine
   wiederhergestellte Karte entsteht ueber neueKarte() und traegt ihre
   Felder danach in anderer Reihenfolge. Das ist kein Unterschied im Stand,
   und ein naives JSON.stringify haette hier einen Fehler vorgetaeuscht. */
function stabil(x){
  if(Array.isArray(x)) return x.map(stabil);
  if(x && typeof x==='object'){
    var o={}; Object.keys(x).sort().forEach(function(k){ o[k]=stabil(x[k]); }); return o;
  }
  return x;
}
function schnapp(){
  return JSON.stringify(stabil({
    karten: S.karten.slice().sort(function(a,b){return a.id<b.id?-1:1;}),
    unteraufgaben: S.unteraufgaben.slice().sort(function(a,b){return a.id<b.id?-1:1;}),
    routinenGruppen: S.routinenGruppen,
    gruppen: S.gruppen, vorlagen: S.vorlagen, historie: S.historie,
    belohnung: S.belohnung, settings: S.settings, tag: S.tag,
    intraday: S.intraday
  }));
}
var vorLeerung=schnapp();
var metaVor=JSON.parse(JSON.stringify(S.meta));

/* LEERES GERAET */
_store={};
S.karten=[]; S.unteraufgaben=[]; S.routinenGruppen=[]; S.gruppen=[]; S.stapel=[]; S.ordner=[];
S.vorlagen=[]; S.historie=[]; S.intraday=[]; S.belohnung=null; S.tag=null;
S.settings=settingsMerge({}); S.meta={};
ok('4 Bestand ist wirklich leer', S.karten.length===0 && S.unteraufgaben.length===0 &&
   S.routinenGruppen.length===0);

var res=syncImport(exTxt);
ok('4 Import laeuft ohne Fehler'+(res.fehler?(' — '+res.fehler):''), !res.fehler);
ok('4 Der Import meldet die Wiederherstellung', !!res.wiederhergestellt);
ok('4 Alle vier Karten sind zurueck', S.karten.length===4);

var nachRestore=schnapp();
ok('4 ROUND-TRIP: der Stand ist identisch', nachRestore===vorLeerung);
if(nachRestore!==vorLeerung){
  var a=JSON.parse(vorLeerung), b=JSON.parse(nachRestore);
  Object.keys(a).forEach(function(f){
    if(JSON.stringify(a[f])===JSON.stringify(b[f])) return;
    print('     abweichend: '+f);
    if(f==='karten'){ a[f].forEach(function(ka,i){ var kb=b[f][i]||{};
      Object.keys(ka).forEach(function(fd){
        if(JSON.stringify(ka[fd])!==JSON.stringify(kb[fd]))
          print('       '+ka.id+'.'+fd+': '+JSON.stringify(ka[fd])+' → '+JSON.stringify(kb[fd])); });
      Object.keys(kb).forEach(function(fd){ if(ka[fd]===undefined)
          print('       '+ka.id+'.'+fd+': (fehlte) → '+JSON.stringify(kb[fd])); });
    }); }
  });
}
/* Die Bausteine einzeln nach dem Restore — das ist der eigentliche Zweck. */
var kr=S.karten.find(function(k){return k.id==='r-katzen';});
ok('4 Die Routine ist wieder eine Routine (Rhythmus alleNTage 2)',
   kr && kr.rhythmus && kr.rhythmus.typ==='alleNTage' && kr.rhythmus.n===2);
ok('4 Ticks, Tickwert und heutige Einzelwerte sind zurueck',
   kr.ticksAktiv===true && kr.tickWert===12 && JSON.stringify(kr.tickWerteHeute)==='[12,12,15]');
ok('4 Abhakbonus −25 ist zurueck', kr.abhakbonus===-25);
ok('4 Streak 40 ist zurueck', kr.streak===40);
ok('4 kartenArt erkennt sie wieder als Routine', kartenArt(kr)==='Routine');
ok('4 Die erledigte DFM-Karte ist erledigt geblieben', (function(){
     var d=S.karten.find(function(k){return k.id==='d-angebot';});
     return d && d.status==='erledigt' && d.punkteOverride===800 && d.airtableId==='recAAAAAAAAAAAAAA'; })());
ok('4 Unteraufgaben inkl. done und Bonus', (function(){
     var u=S.unteraufgaben.filter(function(x){return x.parentId==='d-angebot';});
     var s1=u.find(function(x){return x.id==='s1';}), s2=u.find(function(x){return x.id==='s2';});
     return u.length===2 && s1.done===true && s2.done===false && s2.bonusPunkte===150; })());
ok('4 Die Aufräumrunde ist zurueck (200 Komplettbonus, 3 Mitglieder)', (function(){
     var gg=(S.routinenGruppen||[])[0];
     return gg && gg.name==='Aufräumrunde' && gg.komplettBonus===200 && gg.mitglieder.length===3; })());
ok('4 Eigene Einstellungen ueberleben (Tagesziel 6543, Standardwert 33)',
   num(S.settings.tagesZielDfm)===6543 && num(S.settings.standardWertPrivat)===33);
ok('4 Spielstand ueberlebt (Wohlstand, Rang, Muenzen, Reset-Offsets)',
   num(S.meta.wohlstand)===12345 && num(S.meta.rangPunkte)===9876 &&
   num(S.meta.muenzenGesamt)===30000 && num(S.meta.rangResetOffset)===100);
ok('4 Messprotokolle ueberleben (Akku-Messungen und -Eintraege)',
   (S.meta.akkuMessungen||[]).length===1 && (S.meta.akkuEintraege||[]).length===1 &&
   S.meta.akkuEintraege[0].kommentar==='schlecht geschlafen');
ok('4 Belohnung/Kulisse ueberlebt', S.belohnung && S.belohnung.stufen.fahrzeuge===3);
ok('4 Historie und Intraday ueberleben (Rang rechnet wieder)',
   S.historie.length===1 && S.intraday.length===1);
ok('4 Migrations-Flags ueberleben — die Migrationen laufen NICHT erneut',
   S.meta.migration1120===true && S.meta.rang1110===true && S.meta.zeit191===true);
ok('4 Der Tag ueberlebt (Akku 72)', S.tag && S.tag.akku===72);

/* ══ Der normale Tages-Sync bleibt ohne Wiederherstellungs-Block ══ */
kopf('Abgrenzung · Tages-Sync');
var tagesPaket=syncExport('sync');
ok('Tages-Sync traegt KEINEN Wiederherstellungs-Block', tagesPaket.wiederherstellung===undefined);
ok('Tages-Sync traegt die Kartenfelder trotzdem vollstaendig', (function(){
     var k2=tagesPaket.karten.find(function(k){return k.id==='r-katzen';});
     return k2 && k2.rhythmus && k2.tickWert===12 && k2.abhakbonus===-25; })());
ok('Tages-Sync traegt die Gruppen', Array.isArray(tagesPaket.gruppen) && tagesPaket.gruppen.length===1);
print('   Tages-Sync '+Math.round(JSON.stringify(tagesPaket).length/1024)+' KB · '+
      'Vollsicherung '+Math.round(exTxt.length/1024)+' KB');

/* ══ Ein normales Chat-Paket darf die App-Hoheit NICHT brechen ══ */
kopf('Schutz · App-Hoheit im Normalbetrieb');
var vorIst=S.karten.find(function(k){return k.id==='d-angebot';}).istSek;
syncImport(JSON.stringify({ appVersion:'2.0.0', karten:[
  { id:'d-angebot', titel:'Angebot rechnen', istMin:9999, status:'offen', punkteOverride:1 }]}));
var d2=S.karten.find(function(k){return k.id==='d-angebot';});
ok('Ohne Wiederherstellungs-Block bleibt die Ist-Zeit unangetastet', d2.istSek===vorIst);
ok('... und der Status bleibt erledigt', d2.status==='erledigt');
ok('... und der Punkte-Override bleibt', d2.punkteOverride===800);

print('');
print(fails? (fails+' von '+n+' FEHLGESCHLAGEN') : ('alle '+n+' Round-Trip-Punkte gruen'));
if(fails) throw 'Round-Trip rot';
