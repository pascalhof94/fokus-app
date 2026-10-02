/* jsc-Suite: ABNAHME v3.6.0 „Shop neu, Farbe statt Wohlstand, Kauf-Belohnung". Begruendung fuer eine eigene Datei
   (Leitplanke „Testdateien mit Begruendung"): die neun Tests des Auftrags (§8) — (a) Preise Stufe 1, (b) Stufenfaktor,
   (c) Voraussetzungen als Liste, (d) Gleichgewicht, (e) Uebernahme, (f) Einfaerbung, (g) Bild-Rueckfall, (h) Fokuszeit seit dem
   letzten Kauf, (i) kein „Wohlstand" in der Oberflaeche — brauchen die verstellbare Uhr (Kaufzeitpunkte, Fokuszeit).
   Die Suite nennt bewusst KEINE Stufen-Inhalte (die bleiben Ueberraschung) — sie liest Namen nur ueber stufeName().

   Ausfuehren aus der Repo-Wurzel:
     jsc tests/v360-abnahme.js
   Die Suite laedt die VOLLE App mit DOM-Stubs (wie v354-abnahme). */
var _els={};
function dummyEl(){ var d={ style:{}, classList:{add:function(){},remove:function(){},toggle:function(){},contains:function(){return false;}},
  addEventListener:function(){}, removeEventListener:function(){}, appendChild:function(){}, remove:function(){},
  querySelector:function(){return dummyEl();}, querySelectorAll:function(){return [];}, setAttribute:function(){},
  getAttribute:function(){return null;}, focus:function(){}, select:function(){}, click:function(){}, dataset:{},
  textContent:'', value:'', hidden:false, src:'',
  getContext:function(){ var n=function(){}; return {clearRect:n,fillRect:n,save:n,restore:n,translate:n,rotate:n,beginPath:n,arc:n,fill:n,fillStyle:''}; }, width:0, height:0 };
  Object.defineProperty(d,'innerHTML',{get:function(){return this._h||'';},set:function(v){this._h=v;}});
  return d; }
var document={ getElementById:function(id){ if(!_els[id]) _els[id]=dummyEl(); return _els[id]; },
  createElement:function(){ return dummyEl(); }, addEventListener:function(){},
  querySelector:function(){ return dummyEl(); }, querySelectorAll:function(){ return []; },
  body:dummyEl(), documentElement:dummyEl(), hidden:false };
var window={ addEventListener:function(){}, matchMedia:function(){ return {matches:false}; },
  location:{reload:function(){}}, navigator:{} };
var navigator={ vibrate:function(){}, clipboard:null };
var _store={};
var localStorage={ getItem:function(k){ return _store.hasOwnProperty(k)?_store[k]:null; },
  setItem:function(k,v){ _store[k]=String(v); }, removeItem:function(k){ delete _store[k]; },
  key:function(i){ return Object.keys(_store)[i]||null; } };
Object.defineProperty(localStorage,'length',{get:function(){ return Object.keys(_store).length; }});
function setInterval(){ return 0; } function clearInterval(){} function setTimeout(f){ return 0; } function clearTimeout(){}
function requestAnimationFrame(){ return 0; }
function confirm(){ return true; } function prompt(){ return null; } function alert(){}
var crypto={};
var console={ warn:function(){}, log:function(){}, error:function(){} };
function getComputedStyle(){ return { getPropertyValue:function(){return '';}, width:'0px', gap:'0px', opacity:'1', textDecorationLine:'none' }; }
var history={replaceState:function(){}};
var screen={};
var innerWidth=375, innerHeight=812, devicePixelRatio=2;
function addEventListener(){} function removeEventListener(){}
var matchMedia=window.matchMedia; var location=window.location;

// verstellbare Uhr: Date.now() und new Date() lesen _jetzt (Europe/Berlin wie auf dem iPhone)
var _RD=Date, _jetzt=_RD.parse('2026-09-28T07:00:00+02:00');
function FD(){ var a=Array.prototype.slice.call(arguments); if(!(this instanceof FD)) return new _RD(_jetzt).toString();
  if(!a.length) return new _RD(_jetzt); return new (Function.prototype.bind.apply(_RD,[null].concat(a)))(); }
FD.now=function(){ return _jetzt; }; FD.parse=_RD.parse; FD.UTC=_RD.UTC; FD.prototype=_RD.prototype;
Date=FD;
function uhr(s){ _jetzt=_RD.parse(s); }
function minuten(m){ _jetzt+=m*60000; }

var src=readFile('neu.html');
var m=src.match(/<script>([\s\S]*?)<\/script>/);
(0,eval)(m[1].replace(/^\s*['"]use strict['"];?/,'') + "\n;\n" + readFile('tests/v360-abnahme-body.js'));
