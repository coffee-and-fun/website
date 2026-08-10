#!/bin/bash
# Everything scheduled on this Mac, in one place.
# macOS runs jobs from at least five different systems, and none of them know
# about the others.
#
#   bash ~/Documents/Major/code/coffee/website/tools/fpl/list-schedules.sh

echo "############ 1. YOUR CRON ############"
crontab -l 2>/dev/null || echo "(none)"

echo
echo "############ 2. ROOT CRON ############"
echo "(skipped, run: sudo crontab -l)"

echo
echo "############ 3. SYSTEM CRON FILES ############"
for f in /etc/crontab /etc/cron.d/*; do
  [ -e "$f" ] && { echo "--- $f"; cat "$f"; }
done 2>/dev/null || true
[ -e /etc/crontab ] || echo "(none)"

echo
echo "############ 4. YOUR LAUNCH AGENTS ############"
# These are the modern macOS equivalent of cron and where most third-party
# apps put their background jobs.
ls -1 ~/Library/LaunchAgents/*.plist 2>/dev/null | while read -r p; do
  L=$(/usr/libexec/PlistBuddy -c "Print :Label" "$p" 2>/dev/null)
  I=$(/usr/libexec/PlistBuddy -c "Print :StartInterval" "$p" 2>/dev/null)
  C=$(/usr/libexec/PlistBuddy -c "Print :StartCalendarInterval" "$p" 2>/dev/null | tr -d '\n' | tr -s ' ')
  echo "  $(basename "$p")"
  echo "      label    : ${L:-?}"
  [ -n "$I" ] && echo "      interval : every ${I}s"
  [ -n "$C" ] && echo "      calendar : $C"
done
[ -n "$(ls -1 ~/Library/LaunchAgents/*.plist 2>/dev/null)" ] || echo "(none)"

echo
echo "############ 5. SYSTEM-WIDE AGENTS AND DAEMONS ############"
echo "--- /Library/LaunchAgents"
ls -1 /Library/LaunchAgents/ 2>/dev/null | sed 's/^/  /' || echo "  (none)"
echo "--- /Library/LaunchDaemons"
ls -1 /Library/LaunchDaemons/ 2>/dev/null | sed 's/^/  /' || echo "  (none)"

echo
echo "############ 6. LOADED IN LAUNCHD RIGHT NOW ############"
# Third column is the label. Anything not com.apple.* is worth a look.
launchctl list 2>/dev/null | awk 'NR==1 || $3 !~ /^com\.apple\./' | head -40

echo
echo "############ 7. CLAUDE SCHEDULED TASKS ############"
for d in ~/.claude/scheduled-tasks ~/.claude/schedules; do
  if [ -d "$d" ]; then
    echo "--- $d"
    ls -1 "$d" 2>/dev/null | sed 's/^/  /'
  fi
done
[ -d ~/.claude/scheduled-tasks ] || echo "(no ~/.claude/scheduled-tasks; Cowork app tasks are stored inside the app, check its UI)"

echo
echo "############ 8. PERIODIC ############"
echo "  macOS runs daily/weekly/monthly maintenance from /etc/periodic"
ls -1 /etc/periodic/ 2>/dev/null | sed 's/^/    /'

echo
echo "############ THE ALGORITHM ############"
if crontab -l 2>/dev/null | grep -q fpl-git-agent; then
  echo "  cron agent  : INSTALLED"
  crontab -l | grep fpl-git-agent | sed 's/^/    /'
else
  echo "  cron agent  : NOT INSTALLED"
fi
if [ -f ~/Library/LaunchAgents/com.coffeeandfun.fpl-git.plist ]; then
  echo "  launchd copy: STILL PRESENT (should be removed, it would race the cron job)"
else
  echo "  launchd copy: absent, good"
fi
LOG=~/Library/Logs/fpl-git-agent.log
if [ -f "$LOG" ]; then
  echo "  last log    : $(tail -1 "$LOG")"
else
  echo "  last log    : no log yet, the agent has never run"
fi
