#!/bin/bash
# Coffee & Fun — weekly blog runner (invoked by launchd on Mondays).
# Runs Claude Code headless to write ONE post and push it to main.
set -u

REPO="/Users/commander/Documents/Major/code/coffee/website"
AUTODIR="$REPO/tools/blog-automation"
LOGDIR="$AUTODIR/logs"
mkdir -p "$LOGDIR"
STAMP="$(date +%Y-%m-%d_%H%M%S)"
LOG="$LOGDIR/$STAMP.log"
LOCK="$AUTODIR/.running.lock"

# Don't overlap runs.
if [ -e "$LOCK" ]; then
  echo "$(date): a run is already in progress; skipping." >>"$LOG"
  exit 0
fi
touch "$LOCK"
trap 'rm -f "$LOCK"' EXIT

# launchd starts with a minimal PATH; make sure node, git, claude, sips are found.
# Adjust the first two entries if your tools live elsewhere (run `which claude node git`).
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

cd "$REPO" || { echo "$(date): repo not found at $REPO" >>"$LOG"; exit 1; }

{
  echo "=== Coffee & Fun blog run: $STAMP ==="
  echo "node=$(command -v node)  git=$(command -v git)  claude=$(command -v claude)  sips=$(command -v sips)"
  echo "--- git pull --rebase ---"
  git pull --rebase origin main

  echo "--- claude (headless) ---"
  # acceptEdits auto-approves file writes; --allowedTools pre-approves the rest so
  # nothing waits for a prompt. If you hit permission friction, you can swap in
  # --dangerously-skip-permissions (broader, less safe) instead of the two flags below.
  claude -p "$(cat "$AUTODIR/write-post.md")" \
    --permission-mode acceptEdits \
    --allowedTools "Read,Write,Edit,Bash,Glob,Grep,WebSearch,WebFetch" \
    --output-format text

  echo "=== finished: $(date) ==="
} >>"$LOG" 2>&1
