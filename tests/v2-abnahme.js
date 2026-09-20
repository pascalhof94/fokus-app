/* jsc-Suite: ABNAHME v2.0.0 „Die Matrix".
   Begruendung fuer eine eigene Datei (Leitplanke „Testdateien mit
   Begruendung"): Die vier bestehenden Suiten pruefen je EIN Gewerk
   (Seeding, Kartenzeile, Kennzahlen, Import). Die 31 Abnahmepunkte des
   v2.0-Auftrags laufen quer dazu — Matrix, Punkte, Waehrungen, Kette,
   Navigation, Sync. Sie in eine der vier zu draengen haette deren Fokus
   zerstoert; hier stehen sie in der Reihenfolge des Auftrags.

   Ausfuehren aus der Repo-Wurzel:
     jsc tests/v2-abnahme.js
   Die Suite laedt die VOLLE App mit DOM-Stubs (wie karten-regression). */
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

var src=readFile('neu.html');
var m=src.match(/<script>([\s\S]*?)<\/script>/);
(0,eval)(m[1].replace(/^\s*['"]use strict['"];?/,'') + "\n;\n" + readFile('tests/v2-abnahme-body.js'));
