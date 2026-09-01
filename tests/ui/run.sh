#!/bin/bash
# UI-Testharness der Fokus App:
#   bash tests/ui/run.sh [--views fokus,sheet,...] [--verbose]
# §16.3 (v1.12.0): --views rendert nur die genannten Ansichten (ohne Angabe:
# alle — der Abschlusslauf). Stiller Modus ist DEFAULT: Prüfpunkte, Findings,
# Konsolenfehler, Screenshot-Pfade — kein DOM, keine Volltextausgabe.
# --verbose liefert Details (Warnungen), nur für Ansichten mit Finding.
set -u
cd "$(dirname "$0")/../.."   # Repo-Wurzel

NUR_VIEWS=""; VERBOSE=0
while [ $# -gt 0 ]; do
  case "$1" in
    --views) NUR_VIEWS="$2"; shift 2;;
    --views=*) NUR_VIEWS="${1#--views=}"; shift;;
    --verbose) VERBOSE=1; shift;;
    *) echo "Unbekanntes Argument: $1"; exit 2;;
  esac
done

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SCREENS="tests/ui/screens"
PROFIL="$(mktemp -d /tmp/fokus-ui-chrome.XXXXXX)"
PORT=8471
LOG="$(mktemp /tmp/fokus-ui-log.XXXXXX)"

if [ ! -x "$CHROME" ]; then echo "FEHLER: Google Chrome nicht gefunden ($CHROME)"; exit 2; fi

# Port suchen (falls 8471 belegt)
while nc -z 127.0.0.1 $PORT 2>/dev/null; do PORT=$((PORT+1)); done

python3 -m http.server $PORT --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER_PID=$!
cleanup(){ kill $SERVER_PID 2>/dev/null; rm -rf "$PROFIL" "$LOG"; }
trap cleanup EXIT INT TERM
sleep 0.6
if ! nc -z 127.0.0.1 $PORT 2>/dev/null; then echo "FEHLER: Server startet nicht"; exit 2; fi
echo "Server: http://127.0.0.1:$PORT (PID $SERVER_PID)"

rm -rf "$SCREENS"; mkdir -p "$SCREENS"

# view name | fensterhoehe (375er-Basis; leiste klein, damit sie GROSS wirkt)
VIEWS_ALLE="stapel:812 fokus:812 leiste:250 sheet:812 abschluss:812 routinen:812 kette:812 belohnung:812 albumR:812 albumK:812 albumB:812 detail:812 statistik:812"
STORAGE_LAUF=1
DIAG_LAUF=1   # §8 (v1.13.0): Klick-Diagnose (kein Screenshot) — Teil des Vollaufs
if [ -n "$NUR_VIEWS" ]; then
  VIEWS=""
  STORAGE_LAUF=0
  DIAG_LAUF=0
  for w in $(echo "$NUR_VIEWS" | tr ',' ' '); do
    [ "$w" = "storage" ] && { STORAGE_LAUF=1; continue; }
    [ "$w" = "diag" ] && { DIAG_LAUF=1; continue; }
    for e in $VIEWS_ALLE; do [ "${e%%:*}" = "$w" ] && VIEWS="$VIEWS $e"; done
  done
  [ -z "$VIEWS$([ $STORAGE_LAUF -eq 1 ] && echo x)$([ $DIAG_LAUF -eq 1 ] && echo x)" ] && { echo "FEHLER: keine bekannte Ansicht in --views $NUR_VIEWS"; exit 2; }
else
  VIEWS="$VIEWS_ALLE"
fi

CHROME_LIMIT=25   # Sekunden je Aufruf — Chrome beendet sich headless nicht immer selbst
chrome_lauf(){ # $1=url $2=breite $3=hoehe $4=screenshot-datei ('' = dump-dom auf stdout)
  local extra out
  out="$(mktemp /tmp/fokus-ui-out.XXXXXX)"
  if [ -n "$4" ]; then extra="--screenshot=$4"; else extra="--dump-dom"; fi
  "$CHROME" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
    --no-first-run --no-default-browser-check --user-data-dir="$PROFIL" \
    --window-size=$2,$3 --virtual-time-budget=6000 $extra "$1" >"$out" 2>/dev/null &
  local cpid=$! i=0
  while kill -0 $cpid 2>/dev/null; do
    if [ -n "$4" ] && [ -s "$4" ]; then i=$((i+18)); fi          # Screenshot liegt → nur noch kurz warten
    [ $((i/2)) -ge $CHROME_LIMIT ] && { kill -9 $cpid 2>/dev/null; break; }
    sleep 0.5; i=$((i+1))
  done
  wait $cpid 2>/dev/null
  cat "$out"; rm -f "$out"
}

FEHLER=0; CHECKS=0; SHOTS=0; FINDINGS=""; WARNUNGEN=""
export UI_VERBOSE=$VERBOSE

for eintrag in $VIEWS; do
  view="${eintrag%%:*}"; hoehe="${eintrag##*:}"
  basis="http://127.0.0.1:$PORT/tests/ui/harness.html?view=$view"
  # Screenshots 375 + 430 — w/h stellen das iframe hart auf die Zielgroesse
  chrome_lauf "$basis&w=375&h=$hoehe" 375 "$hoehe" "$SCREENS/${view}-375.png" >/dev/null; SHOTS=$((SHOTS+1))
  chrome_lauf "$basis&w=430&h=$hoehe" 430 "$hoehe" "$SCREENS/${view}-430.png" >/dev/null; SHOTS=$((SHOTS+1))
  # Pruefungen (bei 375) via dump-dom
  dom="$(chrome_lauf "$basis&w=375&h=$hoehe" 375 "$hoehe" "")"
  json="$(printf '%s' "$dom" | python3 -c "
import sys,html,re
d=sys.stdin.read()
m=re.search(r'UIRESULT:(.*?):ENDRESULT', d, re.S)
print(html.unescape(m.group(1)) if m else '{}')
")"
  auswertung="$(printf '%s' "$json" | python3 -c "
import sys,json
try: r=json.load(sys.stdin)
except Exception: r={}
if not r or not r.get('fertig'):
    print('FATAL|0|0|Harness wurde nicht fertig (view ${view})'); sys.exit()
fat=r.get('fatal',[]); fnd=r.get('findings',[]); wrn=r.get('warnungen',[])
print(('FATAL' if fat else 'OK')+'|'+str(r.get('checks',0)+r.get('geprueft',0))+'|'+str(len(fnd)))
for f in fat: print('  FEHLER ['+r.get('view','?')+'] '+f)
for f in fnd: print('  finding ['+r.get('view','?')+'] '+f)
# §16.3: Warnungen nur im --verbose-Modus und nur bei Ansichten mit Finding
import os
if os.environ.get('UI_VERBOSE')=='1' and (fat or fnd):
    for w in wrn[:5]: print('  warnung ['+r.get('view','?')+'] '+w)
")"
  status="$(printf '%s' "$auswertung" | head -1 | cut -d'|' -f1)"
  n="$(printf '%s' "$auswertung" | head -1 | cut -d'|' -f2)"
  CHECKS=$((CHECKS+n))
  printf '%-10s %s (%s Pruefpunkte)\n' "$view" "$status" "$n"
  printf '%s\n' "$auswertung" | tail -n +2 | tee -a "$LOG"
  [ "$status" = "FATAL" ] && FEHLER=$((FEHLER+1))
done

# §8 (v1.13.0): Klick-Diagnose (eigener View, ohne Screenshot) — synthetische
# Klicks + Zustandsvergleich fuer §1.3, §3.2 und §6.1
if [ $DIAG_LAUF -eq 1 ]; then
dom="$(chrome_lauf "http://127.0.0.1:$PORT/tests/ui/harness.html?view=diag" 375 812 "")"
diag="$(printf '%s' "$dom" | python3 -c "
import sys,html,re,json
d=sys.stdin.read()
m=re.search(r'UIRESULT:(.*?):ENDRESULT', d, re.S)
if not m: print('FATAL|diag: Harness nicht fertig'); sys.exit()
r=json.loads(html.unescape(m.group(1)))
fat=r.get('fatal',[])
print(('FATAL' if fat else 'OK')+'|checks '+str(r.get('checks',0)))
for f in fat: print('  FEHLER [diag] '+f)
")"
printf '%-10s %s\n' "diag" "$(printf '%s' "$diag" | head -1 | sed 's/|/ — /')"
printf '%s\n' "$diag" | tail -n +2 | tee -a "$LOG"
CHECKS=$((CHECKS+$(printf '%s' "$diag" | head -1 | sed 's/.*checks \([0-9]*\).*/\1/')))
[ "$(printf '%s' "$diag" | head -1 | cut -d'|' -f1)" = "FATAL" ] && FEHLER=$((FEHLER+1))
fi

# localStorage-Sequenz (eigener View, ohne Screenshot) — bei --views nur, wenn
# 'storage' ausdruecklich genannt ist
if [ $STORAGE_LAUF -eq 1 ]; then
dom="$(chrome_lauf "http://127.0.0.1:$PORT/tests/ui/harness.html?view=storage" 375 812 "")"
storage="$(printf '%s' "$dom" | python3 -c "
import sys,html,re,json
d=sys.stdin.read()
m=re.search(r'UIRESULT:(.*?):ENDRESULT', d, re.S)
if not m: print('FATAL|storage: Harness nicht fertig'); sys.exit()
r=json.loads(html.unescape(m.group(1)))
fat=r.get('fatal',[])
print(('FATAL' if fat else 'OK')+'|checks '+str(r.get('checks',0))+' · Timer nach Reload: '+str(r.get('timerSekNachReload'))+'s')
for f in fat: print('  FEHLER [storage] '+f)
")"
printf '%-10s %s\n' "storage" "$(printf '%s' "$storage" | head -1 | sed 's/|/ — /')"
printf '%s\n' "$storage" | tail -n +2 | tee -a "$LOG"
[ "$(printf '%s' "$storage" | head -1 | cut -d'|' -f1)" = "FATAL" ] && FEHLER=$((FEHLER+1))
fi

echo ""
echo "──────────────────────────────────────────────"
echo "Screenshots ($SHOTS):"
ls "$SCREENS" 2>/dev/null | sed "s|^|  $SCREENS/|"
echo "Pruefpunkte: $CHECKS · Ansichten mit Fehlern: $FEHLER"
if [ $FEHLER -gt 0 ]; then echo "ERGEBNIS: ROT"; exit 1; fi
echo "ERGEBNIS: GRUEN"
exit 0
