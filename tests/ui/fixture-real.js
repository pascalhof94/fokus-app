/* ══════════════════════════════════════════════════════════════════════
   REGRESSIONS-FIXTURE „gelebter Bestand" (v2.0.2)
   Nachbau des Zustands, in dem die App am 21.09. erstarrte. Entscheidend
   sind NICHT die 294 Karten, sondern die vier Eigenschaften, die die
   normale Fixture nicht hat:

     1. Ein OFFENER Tag von vor elf Tagen (tagId 2026-09-10-1).
     2. Ein Bestand, der noch NIE die v2.0-Migration gesehen hat
        (kein migration200) — also das Export-Gate steht aus.
     3. Viele ueberfaellige Karten (der Alltag, nicht die Ausnahme).
     4. Alte Migrations-Flags gesetzt, wie auf jedem gelebten Geraet.

   Die normale fixture.js hat einen FRISCHEN Tag und gilt als migriert —
   deshalb ist ihr keiner der drei Fehler aufgefallen.
   ══════════════════════════════════════════════════════════════════════ */
(function(global){
  function iso(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function vorTagen(n){ var d=new Date(); if(d.getHours()<5) d.setDate(d.getDate()-1); d.setDate(d.getDate()-n); return iso(d); }
  var H=vorTagen(0);
  var OFFEN_SEIT=vorTagen(11);            // der Kern: Tag vom 10.09., elf Tage alt

  var KARTEN=[];
  /* 38 Routinen, wie im echten Bestand */
  for(var r=1;r<=38;r++) KARTEN.push({
    id:'r-'+r, domain:(r<=9?'dfm':'privat'), titel:'Routine '+r, rhythmus:{typ:'taeglich'},
    status:'offen', streak:5+r, faelligkeit:H, geplantFuer:H, sollMin:5, istSek:0,
    matrixFeld:(r<=9?'ziel':'werkzeug'), ticksAktiv:false, tickWert:null, abhakbonus:null,
    erstelltTs:vorTagen(200)+'T09:00:00', letzteBearbeitung:vorTagen(1)+'T09:00:00' });
  /* 180 offene Aufgaben, die meisten ueberfaellig */
  for(var a=1;a<=180;a++) KARTEN.push({
    id:'a-'+a, domain:(a%3?'dfm':'privat'), titel:'Aufgabe '+a, status:'offen',
    faelligkeit:vorTagen(a%30), geplantFuer:vorTagen(a%30), sollMin:30, istSek:(a%5)*600,
    matrixFeld:'ziel', projekt:(a%3?'Fertigung':null), geldScore:(a%3?60:0),
    erstelltTs:vorTagen(90)+'T09:00:00', letzteBearbeitung:vorTagen(a%12)+'T09:00:00' });
  /* 76 erledigte Altkarten */
  for(var e=1;e<=76;e++) KARTEN.push({
    id:'e-'+e, domain:'dfm', titel:'Erledigt '+e, status:'erledigt',
    tagId:vorTagen(e%40)+'-1', faelligkeit:vorTagen(e%40), sollMin:30, istSek:1800,
    matrixFeld:'ziel', punkteOverride:400+e, erstelltTs:vorTagen(120)+'T09:00:00' });

  var META={
    wohlstand:186000, rangPunkte:142000, muenzenGesamt:98000, ausgegebenGesamt:76000,
    tagesStreak:13, tagesStreakBest:18, rangBest:6, lifetimeQuelle:'wohlstand',
    /* Alle Alt-Migrationen sind auf einem gelebten Geraet laengst gelaufen. */
    migration160:true, migration160Gezeigt:true, migration161:true, migration161Gezeigt:true,
    migration180:true, migration180Gezeigt:true, gamify190:true, gamify190Gezeigt:true,
    rang1110:true, rang1110Gezeigt:true, zeit191:true, akku1100:true,
    migration1120:true, migration1130:true, hotfix1131:true, flowfix152:true, flowfix181:true,
    stapelV4:true, stapelV6:true, stapelV8:true, u3statusMigriert:true, u6migriert:true,
    panoramaReset151:true, flowBaseline133:true, hotfix131:true, hotfix133:true, seeded:true,
    /* KEIN migration200 — dieser Bestand trifft v2.0 zum ersten Mal. */
    ketten:{ dfm:{datum:OFFEN_SEIT, ids:['a-1','a-2','a-3'], entfernt:[]},
             privat:{datum:OFFEN_SEIT, ids:['r-10','r-11'], entfernt:[]} },
    letzteInteraktionTs:new Date().toISOString()
  };
  /* DER KERN: ein Tag, der seit elf Tagen offen steht. */
  var TAG={ tagId:OFFEN_SEIT+'-1', datum:OFFEN_SEIT, laufindex:1,
    startTs:OFFEN_SEIT+'T08:30:00', endeTs:null, akku:64, istMinutenStart:{},
    abzuegeBilanz:0, akkuVerlauf:[], streak:0, erledigtHeute:0, routinenBilanz:[],
    letzteAktivitaetTs:OFFEN_SEIT+'T18:00:00', log:[] };

  var FIXTURE={
    karten:KARTEN, unteraufgaben:[], meta:META, tag:TAG,
    routinenGruppen:[{ id:'g-auf', name:'Aufräumrunde', domain:'privat',
      mitglieder:['r-10','r-11','r-12'], komplettBonus:200, farbe:'#b98af7', bonusTag:null }],
    belohnung:{ stufen:{fahrzeuge:3,wohnen:2,reisen:2,mobilitaet:1,begleiter:1,soziales:1},
      ausgegeben:76000, kaeufe:[] },
    historie:[], intraday:[],
    ui:{ tab:'suche' }, fokus:null
  };
  global.FIXTURE_REAL=FIXTURE;
  global.fixtureRealSchreiben=function(){
    try{ localStorage.clear(); }catch(e){}
    Object.keys(FIXTURE).forEach(function(k){
      localStorage.setItem('fokus2_'+k, JSON.stringify(FIXTURE[k]));
    });
  };
})(window);
