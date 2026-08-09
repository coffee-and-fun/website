#!/bin/bash
# Git sync smoke test for The Algorithm.
# Run this in Terminal.app on the mini. Not through Claude, not through a
# Cowork workspace: the FUSE mount those use denies unlink, which is what
# blocked the previous attempts.
#
#   bash ~/Documents/Major/code/coffee/website/tools/fpl/fpl-sync-test.sh

set -u

REPO=~/Documents/Major/code/coffee/website
cd "$REPO" || { echo "FAIL: cannot cd to $REPO"; exit 1; }

echo "=== started $(date -u '+%Y-%m-%dT%H:%M:%SZ') in $(pwd)"

# --- 1. clear the junk the sandboxed sessions could not delete ---------------
echo
echo "=== 1. clearing stale files"
for f in .git/index.lock .git/cowork-write-test .git/__probe_moved; do
  if [ -e "$f" ]; then
    rm -f "$f" && echo "  removed $f" || echo "  COULD NOT REMOVE $f"
  fi
done
if [ -e .git/index.lock ]; then
  echo "FAIL: .git/index.lock still present. Nothing else will work."
  exit 1
fi
echo "  lock clear"

# --- 2. environment, the bit that predicts whether push can work ------------
echo
echo "=== 2. git config"
echo "  remote      : $(git remote get-url origin)"
echo "  helper(any) : '$(git config --get-all credential.helper | tr '\n' ' ')'"
echo "  helper(sys) : '$(git config --system --get credential.helper 2>/dev/null)'"
echo "  helper(glob): '$(git config --global --get credential.helper 2>/dev/null)'"
echo "  user.name   : $(git config user.name)"

# --- 3. starting state ------------------------------------------------------
echo
echo "=== 3. starting state"
echo "  main        : $(git log --oneline -1 main)"
echo "  origin/main : $(git log --oneline -1 origin/main)"
echo "  dirty files : $(git status --porcelain | wc -l | tr -d ' ')"

# --- 4. make something to commit -------------------------------------------
echo
echo "=== 4. heartbeat"
HB=tools/fpl/heartbeat.txt
# .gitignore has a bare *.log rule, so the file this test commits must not be
# a .log. Check before writing rather than failing at git add.
if git check-ignore -q "$HB"; then
  echo "FAIL: $HB is gitignored, so there would be nothing to commit."
  echo "  matched by: $(git check-ignore -v "$HB")"
  exit 1
fi
rm -f tools/fpl/heartbeat.log   # leftover from the earlier run, was ignored
date -u "+%Y-%m-%dT%H:%M:%SZ sync test" >> "$HB"
echo "  appended: $(tail -1 "$HB")"

# --- 5. commit. only the one file, never git add -A -------------------------
echo
echo "=== 5. commit"
git add tools/fpl/heartbeat.txt || { echo "FAIL: git add failed"; exit 1; }
git commit -m "chore: git sync heartbeat" || { echo "FAIL: git commit failed"; exit 1; }
NEW=$(git rev-parse --short HEAD)
echo "  created $NEW"

# --- 6. pull, then push. prompting off so it fails fast instead of hanging --
echo
echo "=== 6. pull --rebase"
if ! GIT_TERMINAL_PROMPT=0 git pull --rebase; then
  echo "FAIL: pull failed. Repo left as-is, resolve by hand."
  exit 1
fi

echo
echo "=== 7. push"
if ! GIT_TERMINAL_PROMPT=0 git push; then
  echo
  echo "FAIL: push failed."
  echo "  If it mentions terminal prompts being disabled, the mini has no"
  echo "  usable GitHub credentials, and fpl-publish will fail the same way"
  echo "  every week. Fix with one of:"
  echo "    git config --global credential.helper osxkeychain   # then push once by hand"
  echo "    git remote set-url origin git@github.com:coffee-and-fun/website.git"
  exit 1
fi

# --- 8. the actual assertion ------------------------------------------------
echo
echo "=== 8. verify"
L=$(git rev-parse main)
R=$(git rev-parse origin/main)
echo "  main        : $(git log --oneline -1 main)"
echo "  origin/main : $(git log --oneline -1 origin/main)"
echo
if [ "$L" = "$R" ] && [ "$(git rev-parse --short HEAD)" = "$NEW" ]; then
  echo "PASS: committed $NEW and pushed it. main and origin/main match."
else
  echo "FAIL: refs do not match after push."
  exit 1
fi
