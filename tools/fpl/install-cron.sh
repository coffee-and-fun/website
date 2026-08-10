#!/bin/bash
# Install the git agent as a cron job. Idempotent: rerunning replaces the line
# rather than adding a second one.
#
#   bash ~/Documents/Major/code/coffee/website/tools/fpl/install-cron.sh

set -u

REPO=/Users/commander/Documents/Major/code/coffee/website
AGENT="$REPO/tools/fpl/git-agent.sh"
LOG=/Users/commander/Library/Logs/fpl-git-agent.log
TAG="# fpl-git-agent"

[ -f "$AGENT" ] || { echo "FAIL: $AGENT not found"; exit 1; }

# Twice a day, 11:00 and 23:00 local. The times matter, they are not just
# "every 12 hours":
#   - fpl-generate runs 10:17 and leaves changes uncommitted, so the agent must
#     run after that to commit them. 11:00 is 43 minutes later.
#   - fpl-publish runs 9:23 and writes the approval marker, so the agent must
#     also run after that to push. 11:00 covers this too.
#   - 23:00 is the safety net: if the mini was asleep at 11:00, the day is not
#     lost.
# Moving these earlier than 10:17 would mean a generated post sits uncommitted
# for a full day, and fpl-publish would find no pending commit and do nothing.
SCHEDULE="0 11,23 * * *"
LINE="$SCHEDULE /bin/bash $AGENT >> $LOG 2>&1 $TAG"

echo "=== current crontab"
crontab -l 2>/dev/null | sed 's/^/  /' || echo "  (empty)"

# Keep every line that is not ours, then append ours.
NEW=$(crontab -l 2>/dev/null | grep -v -F "$TAG"; echo "$LINE")
echo "$NEW" | crontab -

echo
echo "=== new crontab"
crontab -l | sed 's/^/  /'

echo
if crontab -l | grep -qF "$TAG"; then
  echo "PASS: installed, runs at 11:00 and 23:00 daily."
  echo
  echo "If nothing ever appears in $LOG, the cause is almost always that cron"
  echo "lacks Full Disk Access and cannot read your Documents folder. Fix in"
  echo "System Settings > Privacy & Security > Full Disk Access: click +, press"
  echo "Cmd+Shift+G, enter /usr/sbin/cron, add it, then reboot."
else
  echo "FAIL: the line did not stick."
  exit 1
fi
