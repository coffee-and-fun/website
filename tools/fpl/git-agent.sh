#!/bin/bash
# The Algorithm: native git agent.
#
# The Claude scheduled tasks run in a sandbox that can read, write and reach the
# network, but cannot delete files and has no keychain, so `git commit` strands a
# .git/index.lock and `git push` fails on credentials. This script does every git
# operation natively instead, driven by launchd in the user's session where the
# osxkeychain helper actually works.
#
# It does three things, in order, and nothing else:
#   1. clears any index.lock the sandbox stranded
#   2. commits the generated post, if one is waiting
#   3. pushes, but only once fpl-publish has left its approval marker
#
# Installed by com.coffeeandfun.fpl-git.plist, every 5 minutes.

set -u
export PATH=/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin

REPO=/Users/commander/Documents/Major/code/coffee/website
MARKER="$REPO/tools/fpl/.push-approved"

cd "$REPO" || { echo "$(date -u '+%FT%TZ') FATAL cannot cd $REPO"; exit 1; }

log() { echo "$(date -u '+%FT%TZ') $*"; }

# --- 0. run lock -------------------------------------------------------------
# cron does not care whether the last run finished. A slow network pull could
# still be going five minutes later, and two of these racing on the same index
# is how you get a corrupt one. mkdir is atomic, unlike test-then-touch.
LOCKDIR=/tmp/fpl-git-agent.lock
if ! mkdir "$LOCKDIR" 2>/dev/null; then
  # Stale after 30 minutes means a previous run was killed mid-flight.
  if [ -n "$(find "$LOCKDIR" -maxdepth 0 -mmin +30 2>/dev/null)" ]; then
    log "removing stale run lock"
    rmdir "$LOCKDIR" 2>/dev/null
    mkdir "$LOCKDIR" 2>/dev/null || exit 0
  else
    exit 0   # another run is in progress, say nothing
  fi
fi
trap 'rmdir "$LOCKDIR" 2>/dev/null' EXIT

# --- 1. clear a stranded lock ------------------------------------------------
# Not paranoia. The sandbox cannot unlink, so every failed git operation there
# leaves one behind, and it blocks every index operation until removed.
if [ -e .git/index.lock ]; then
  if rm -f .git/index.lock; then log "cleared stranded index.lock"; fi
fi

# --- 2. pull -----------------------------------------------------------------
# Done here rather than in the generate prompt so no git touches the sandbox.
# --autostash because macOS can dirty the tree at any moment.
if ! GIT_TERMINAL_PROMPT=0 git pull --rebase --autostash --quiet; then
  log "WARN pull failed, continuing"
fi

# --- 3. commit the generated post, if there is one ---------------------------
# Only ever these four paths. Never git add -A: the sandbox leaves scratch files
# around and data/ is deliberately gitignored.
PATHS=(src/pages/blog src/_data/blog.json src/_data/fplPicks.json tools/sitemap-lastmod.json)

if [ -n "$(git status --porcelain -- "${PATHS[@]}")" ]; then
  # Gameweek number comes from the post file that is new or modified, so the
  # commit message matches the /The Algorithm: gameweek/i pattern status.mjs
  # scans for. Without that match fpl-publish would never see a pending commit.
  GW=$(git status --porcelain -- src/pages/blog \
       | sed -n 's/.*the-algorithm-gameweek-\([0-9][0-9]*\)\.md$/\1/p' \
       | sort -n | tail -1)

  if [ -z "$GW" ]; then
    log "changes present but no gameweek post among them, leaving alone"
  else
    git add -- "${PATHS[@]}"
    if git commit -q -m "The Algorithm: gameweek $GW"; then
      log "committed gameweek $GW as $(git rev-parse --short HEAD)"
    else
      log "ERROR commit failed for gameweek $GW"
    fi
  fi
fi

# --- 4. push, only with approval ---------------------------------------------
# fpl-publish writes the marker after it has verified the squad on record
# matches the post. Pushing without it would skip that check.
if [ -f "$MARKER" ]; then
  if GIT_TERMINAL_PROMPT=0 git push --quiet; then
    rm -f "$MARKER"
    log "pushed, now at $(git rev-parse --short origin/main), marker cleared"
  else
    log "ERROR push failed, marker left in place for the next run"
  fi
fi

exit 0
