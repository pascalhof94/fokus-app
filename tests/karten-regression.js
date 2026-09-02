/* Dev-only Regressionstest: Karten-Bedienelemente ueber ALLE Kartenarten.
   NICHT Teil der PWA. Ausfuehren aus dem Repo-Verzeichnis:
     jsc tests/karten-regression.js
   Hintergrund (v1.9.1 §6): ZWEIMAL verschwand ein Bedienelement, weil es an
   eine fachliche Eigenschaft gekoppelt wurde (v1.8.0: ▶ nur mit Zeitanteil;
   davor: ＋ ersetzte ✓). Diese Suite laedt die volle App mit DOM-Stubs und
   verifiziert fuer jede Kartenart, dass die Zeile ihre Bedienelemente traegt. */
var _els={};
function dummyEl(){ var d={ style:{}, classList:{add:function(){},remove:function(){},toggle:function(){},contains:function(){return false;}},
  addEventListener:function(){}, removeEventListener:function(){}, appendChild:function(){}, remove:function(){},
  querySelector:function(){return dummyEl();}, querySelectorAll:function(){return [];}, setAttribute:function(){},
  focus:function(){}, select:function(){}, click:function(){}, dataset:{}, textContent:'', value:'', hidden:false,
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
var console={ warn:function(){}, log:function(){}, error:function(){} };   // jsc hat kein console (v1.13.4: Quota-Pfad nutzt warn)
function getComputedStyle(){ return { getPropertyValue:function(){return '';}, width:'0px', gap:'0px', opacity:'1', textDecorationLine:'none' }; }
var history={replaceState:function(){}};
var screen={};
var innerWidth=375, innerHeight=812, devicePixelRatio=2;
function addEventListener(){}
function removeEventListener(){}
var matchMedia=window.matchMedia;
var location=window.location;

var src=readFile('neu.html');
var m=src.match(/<script>([\s\S]*?)<\/script>/);
var testCode = readFile('tests/karten-regression-body.js');
(0,eval)(m[1].replace(/^\s*['"]use strict['"];?/,'') + "\n;\n" + testCode);
