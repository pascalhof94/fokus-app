/* UI-Testharness-Fixture — ERFUNDENE Daten, keine echten Bestände.
   Wird von harness.html VOR dem Laden der App in localStorage geschrieben
   (Präfix fokus2_). Erweiterbar: einfach Karten/Felder ergänzen. */
(function(global){
  function heute(off){
    var d=new Date(); d.setDate(d.getDate()+(off||0));
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  var H=heute(0), MORGEN=heute(1), GESTERN=heute(-1);

  function karte(f){
    return Object.assign({
      id:'fx-'+Math.random().toString(36).slice(2,8), domain:'privat', titel:'Karte',
      status:'offen', prioritaet:'soll', projekt:null, geldScore:0, notiz:'',
      faelligkeit:null, uhrzeit:null, sollMin:0, istSek:0, komplex:1, energie:1, blockade:1,
      punkteProStd:null, akkuProStd:null, abhakbonus:null, tickKurve:[0],
      ticksAktiv:false, tickWert:0, tickWerteHeute:[], ticksHeute:0,
      timerFlag:false, keineAutoPause:false, zeitmessung:true, strafPunkte:0,
      rhythmus:null, tageszeitFenster:null, tagesabschnitt:null, streak:0, zuletztRoutine:null,
      freeze:false, pin:false, schnellauswahl:false, erstelltTs:GESTERN+'T09:00:00',
      letzteBearbeitung:H+'T09:00:00', tagId:null, punkteOverride:null, abschluesse:[],
      sortIndex:{}, vorgaengerAppId:null, vorgaengerAirtableId:null, airtableId:null
    }, f);
  }

  var KARTEN=[
    // 1) DFM-Aufgabe, langer Titel, Unteraufgaben, läuft — für die Fokusansicht
    karte({ id:'k-lang', domain:'dfm', titel:'Angebotskalkulation für die neue Fertigungslinie vollständig durchrechnen und dokumentieren',
      projekt:'Fertigung', geldScore:120, prioritaet:'muss', faelligkeit:H, sollMin:90, istSek:1860,
      ticksAktiv:true, tickWert:25, ticksHeute:3, tickWerteHeute:[25,25,25] }),
    // 2) DFM eingefroren
    karte({ id:'k-frost', domain:'dfm', titel:'Wartet auf Rückmeldung Lieferant', projekt:'Einkauf',
      geldScore:40, faelligkeit:H, sollMin:30, freeze:true }),
    // 3) DFM mit Deadline morgen → ausgegraut
    karte({ id:'k-morgen', domain:'dfm', titel:'Quartalsbericht vorbereiten', projekt:'Fertigung',
      geldScore:60, faelligkeit:MORGEN, sollMin:45 }),
    // 4) private Routine OHNE Zeitmessung
    karte({ id:'k-routine', domain:'privat', titel:'Gesicht waschen', rhythmus:{typ:'taeglich'},
      zeitmessung:false, tagesabschnitt:['morgens','abends'], streak:12, faelligkeit:H }),
    // 5) private Routine MIT Ticks
    karte({ id:'k-ticks', domain:'privat', titel:'Wasser trinken', rhythmus:{typ:'taeglich'},
      ticksAktiv:true, tickWert:10, ticksHeute:2, tickWerteHeute:[10,10], zeitmessung:false,
      tagesabschnitt:['tagsueber'], streak:5, faelligkeit:H }),
    // 6) Counter (negativ)
    karte({ id:'k-counter', domain:'privat', titel:'Handy zur Hand genommen', ticksAktiv:true,
      tickWert:-15, zeitmessung:false, tagesabschnitt:['tagsueber'] }),
    // 7) reiner Timer
    karte({ id:'k-timer', domain:'dfm', titel:'Pausentimer', timerFlag:true, keineAutoPause:true,
      punkteProStd:60, projekt:'Intern' }),
    // 8) erledigte Karten (beide Domänen — speisen die Tagespunkte)
    karte({ id:'k-fertig', domain:'dfm', titel:'Morgenmeeting vorbereitet', projekt:'Fertigung',
      status:'erledigt', tagId:H+'-1', punkteOverride:800, istSek:2400,
      abschluesse:[{ts:H+'T10:00:00', tagId:H+'-1', punkteIstVorher:0, istMinVorher:0, bonusPunkte:0, subsDoneVorher:[], glaettung:[]}] }),
    karte({ id:'k-privat-fertig', domain:'privat', titel:'Einkauf erledigt', status:'erledigt',
      tagId:H+'-1', punkteOverride:300, istSek:1200,
      abschluesse:[{ts:H+'T11:00:00', tagId:H+'-1', punkteIstVorher:0, istMinVorher:0, bonusPunkte:0, subsDoneVorher:[], glaettung:[]}] }),
    // Gruppe: gemischter Stand (k-ticks getickt=fertig, die zwei anderen offen)
    karte({ id:'k-g3', domain:'privat', titel:'Küche aufräumen', rhythmus:{typ:'taeglich'},
      zeitmessung:false, tagesabschnitt:['abends'] })
  ];

  var SUBS=[
    { id:'fx-s1', parentId:'k-lang', titel:'Materialkosten zusammenstellen', sollMin:30, done:true,  bonusPunkte:100 },
    { id:'fx-s2', parentId:'k-lang', titel:'Maschinenstunden kalkulieren',   sollMin:40, done:false, bonusPunkte:100 },
    { id:'fx-s3', parentId:'k-lang', titel:'Dokument formatieren',           sollMin:20, done:false, bonusPunkte:100 }
  ];

  var META={
    wohlstand:30000, lifetimeBasis:30000,
    // Spiel-Ebene: Rang 4 mit 2 Sternen, Serie 12 (×1,24), Konto 5500 (vierstellig)
    rangPunkte:25000, muenzenGesamt:30000, ausgegebenGesamt:24500,
    rangResetOffset:0, muenzenResetOffset:0, ausgabenResetOffset:0,
    tagesStreak:12, tagesStreakBest:18, streakLetzterTag:GESTERN,
    kette:{ datum:H, ids:['k-lang','k-routine','k-ticks','k-morgen'], entfernt:[] },
    // Akku-Messungen → gelernter Wert im Karten-Detail (Median -12)
    akkuMessungen:[
      { kid:'k-lang', kat:'dfm|Fertigung', datum:GESTERN, delta:-10, dauerMin:60, rate:-10 },
      { kid:'k-lang', kat:'dfm|Fertigung', datum:GESTERN, delta:-12, dauerMin:60, rate:-12 },
      { kid:'k-lang', kat:'dfm|Fertigung', datum:GESTERN, delta:-15, dauerMin:60, rate:-15 },
      { kid:'k-lang', kat:'dfm|Fertigung', datum:GESTERN, delta:-12, dauerMin:60, rate:-12 },
      { kid:'k-lang', kat:'dfm|Fertigung', datum:GESTERN, delta:-8,  dauerMin:60, rate:-8 }
    ],
    // alle Migrationen als gelaufen markieren — die Views sollen stabil sein
    hotfix133:true, flowfix152:true, migration160:true, migration160Gezeigt:true,
    migration161:true, migration161Gezeigt:true, migration180:true, migration180Gezeigt:true,
    flowfix181:true, zeit191:true, gamify190:true, gamify190Gezeigt:true, akku1100:true,
    // v1.11.0: Rang-Migration gilt als gelaufen; Bestwert > aktuellem Rang,
    // damit die „X · best Y"-Anzeige sichtbar wird. Sterne sammeln noch.
    rang1110:true, rangBest:13, sternTage:{},
    /* stapelV4/V6/V8 fehlen absichtlich: seedStapel() legt die
       Standard-Stapel beim ersten Laden selbst an. */
    lifetimeQuelle:'wohlstand',
    letzteInteraktionTs:new Date().toISOString()
  };

  // Offener Tag, Punkte in beiden Domänen (800 DFM + 300 Privat) — deutlich
  // unter dem Soll, damit die rote Soll-Fläche sichtbar ist.
  var TAG={
    tagId:H+'-1', datum:H, laufindex:1, startTs:H+'T08:30:00', endeTs:null,
    akku:72, istMinutenStart:{}, abzuegeBilanz:0, akkuVerlauf:[], streak:0, erledigtHeute:2,
    letzteAktivitaetTs:new Date().toISOString(), routinenBilanz:[],
    log:[
      { itemId:'k-fertig', titel:'Morgenmeeting vorbereitet', domain:'dfm', art:'Aufgabe', punkte:800, ts:H+'T10:00:00' },
      { itemId:'k-privat-fertig', titel:'Einkauf erledigt', domain:'privat', art:'Aufgabe', punkte:300, ts:H+'T11:00:00' }
    ]
  };

  var FIXTURE={
    karten:KARTEN, unteraufgaben:SUBS, meta:META, tag:TAG,
    routinenGruppen:[{ id:'fx-grp', name:'Abendrunde', domain:'privat',
      mitglieder:['k-ticks','k-routine','k-g3'], komplettBonus:200, farbe:'#b98af7', bonusTag:null }],
    belohnung:{ stufen:{fahrzeuge:3,wohnen:2,reisen:2,mobilitaet:1,begleiter:1,soziales:1}, ausgegeben:24500,
      kaeufe:[
        { kat:'fahrzeuge', stufe:2, name:'Fixture-Kauf', datum:heute(-20), preis:9000 },
        { kat:'fahrzeuge', stufe:3, name:'Fixture-Kauf', datum:heute(-10), preis:8000 },
        { kat:'wohnen',    stufe:2, name:'Fixture-Kauf', datum:heute(-5),  preis:5000 },
        { kat:'reisen',    stufe:2, name:'Fixture-Kauf', datum:heute(-2),  preis:2500 }
      ] },
    /* v1.11.0: zehn erfundene Vortage — Zeit- und Punkte-Buchungen getrennt
       (wie die echte App bucht) plus je ein zeitloser Bonus, den die
       Null-Minuten-Regel aussortiert. Ergibt einen rechenbaren Rang. */
    historie:(function(){
      const out=[];
      for(let off=1; off<=10; off++){
        const d=heute(-off);
        const p=3600+((off*37)%9)*180;
        out.push({ tagId:d+'-1', datum:d, laufindex:1, startTs:d+'T08:00:00', endeTs:d+'T21:00:00',
          akku:60+(off%3)*8, punkteBilanz:p, abzuege:0, routinenBilanz:[],
          zeit:{dfm:14400,privat:3600,projekte:{Fertigung:10800}}, luecke:false,
          log:[{itemId:'fx-h'+off,titel:'Tagwerk',domain:'dfm',art:'Aufgabe',punkte:p,ts:d+'T12:00:00'}],
          akkuVerlauf:[{ts:d+'T09:00:00',akku:70},{ts:d+'T15:00:00',akku:55},{ts:d+'T20:00:00',akku:45}],
          streak:1, erledigtHeute:2+(off%3), urlaub:false, spielZufluss:Math.round(p*1.2) });
      }
      return out;
    })(),
    intraday:(function(){
      const iv=[
        { ts:H+'T09:10:00', kartenId:'k-lang', domaene:'dfm', punkte:0, minuten:31, typ:'timer' },
        { ts:H+'T10:00:00', kartenId:'k-fertig', domaene:'dfm', punkte:800, minuten:40, typ:'abhaken' },
        { ts:H+'T11:00:00', kartenId:'k-privat-fertig', domaene:'privat', punkte:300, minuten:20, typ:'abhaken' }
      ];
      for(let off=1; off<=10; off++){
        const d=heute(-off), kid='fx-h'+off;
        const min=100+((off*13)%5)*15, p=700+((off*29)%7)*90;
        iv.push({ ts:d+'T09:00:00', kartenId:kid, domaene:'dfm', punkte:0, minuten:min, typ:'timer' });
        iv.push({ ts:d+'T12:00:00', kartenId:kid, domaene:'dfm', punkte:p, minuten:0, typ:'abhaken' });
        iv.push({ ts:d+'T16:00:00', kartenId:'fx-bonus'+off, domaene:'dfm', punkte:150, minuten:0, typ:'abhaken' });
      }
      return iv;
    })(),
    ui:{ tab:'fokus', navDomain:'dfm', navArt:'aufgabe', navSort:'deadline', sheetSort:'meine',
      stapelOffen:{'sys-heute':true,'sys-schnell':true,'sys-erledigt':true} },
    fokus:null
  };

  global.FIXTURE=FIXTURE;
  global.fixtureSchreiben=function(){
    try{ localStorage.clear(); }catch(e){}
    Object.keys(FIXTURE).forEach(function(k){
      localStorage.setItem('fokus2_'+k, JSON.stringify(FIXTURE[k]));
    });
  };
})(window);
