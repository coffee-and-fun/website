#!/bin/bash
# Stop .DS_Store breaking every pull.
#
# .gitignore already lists .DS_Store, but ignore rules do not apply to files
# git is already tracking, and six of them are. macOS rewrites them whenever
# Finder touches a folder, so the tree goes dirty on its own and the next
# `git pull --rebase` aborts with "you have unstaged changes".
#
# This untracks them without deleting them off disk. Run once, in Terminal.
#
#   bash ~/Documents/Major/code/coffee/website/tools/fpl/fix-dsstore.sh

set -u

REPO=~/Documents/Major/code/coffee/website
cd "$REPO" || { echo "FAIL: cannot cd to $REPO"; exit 1; }

echo "=== tracked .DS_Store files"
COUNT=$(git ls-files '*.DS_Store' | wc -l | tr -d ' ')
git ls-files '*.DS_Store' | sed 's/^/  /'
if [ "$COUNT" = "0" ]; then
  echo "  none. Nothing to do."
  exit 0
fi

echo
echo "=== untracking $COUNT file(s) (they stay on disk)"
git ls-files -z '*.DS_Store' | xargs -0 git rm --cached -q --
git commit -m "chore: untrack .DS_Store, gitignore already covers it" \
  || { echo "FAIL: commit failed"; exit 1; }

echo
echo "=== confirming"
LEFT=$(git ls-files '*.DS_Store' | wc -l | tr -d ' ')
echo "  still tracked : $LEFT (want 0)"
echo "  still on disk : $(find . -name .DS_Store -not -path './node_modules/*' | wc -l | tr -d ' ')"
echo "  dirty files   : $(git status --porcelain | wc -l | tr -d ' ')"
echo
if [ "$LEFT" = "0" ]; then
  echo "PASS: .DS_Store is untracked. Finder can no longer dirty the tree."
  echo "Now run: GIT_TERMINAL_PROMPT=0 git push"
else
  echo "FAIL: $LEFT still tracked."
  exit 1
fi
