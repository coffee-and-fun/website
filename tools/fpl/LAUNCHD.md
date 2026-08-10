# The native git agent

## Why this exists

Claude scheduled tasks on the mini run in a sandboxed VM with the repo mounted
over FUSE. Tested on 9 August 2026, that sandbox:

- **can** read, write, create files, and reach the network (`git fetch` succeeded)
- **cannot** delete files (`Operation not permitted` on every unlink)
- **cannot** authenticate to GitHub (`could not read Username`, no keychain)

So `git commit` there strands a `.git/index.lock` that nothing in the sandbox can
remove, and which then blocks every later git operation. And `git push` cannot
work at all.

The same test run from Terminal.app passed end to end, so this is purely about
where the code executes. The fix is to keep all git in a native launchd agent
running in the user's login session, where the `osxkeychain` helper works.

## The split

| Step | Runs where | Does |
|---|---|---|
| `fpl-generate` 10:17 | Claude sandbox | fetch, optimise, write post, build. **Leaves changes uncommitted.** |
| `git-agent.sh` every 5 min | native launchd | pull, commit those changes, push when approved |
| `fpl-publish` 9:23 | Claude sandbox | verify the squad, then `touch tools/fpl/.push-approved` |

The marker file is what keeps the safety check. The agent only pushes when it
finds one, so an unverified post sits committed and unpushed until the next day.
`status.mjs` needs no changes: the agent's commit message matches the
`/The Algorithm: gameweek/i` pattern it scans for.

## Install

```bash
cp tools/fpl/com.coffeeandfun.fpl-git.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.coffeeandfun.fpl-git.plist
launchctl list | grep fpl-git      # should print a line
```

`load` also runs it once immediately, because `RunAtLoad` is set.

## Verify it works

```bash
tail -f ~/Library/Logs/fpl-git-agent.log
```

Quiet output is correct. The agent exits silently when there is nothing to do,
which is most of the time, and only logs when it clears a lock, commits, pushes
or fails.

To force a real end-to-end test without waiting for a gameweek:

```bash
echo "test $(date)" >> src/_data/fplPicks.json.bak   # something harmless
touch tools/fpl/.push-approved
# wait up to 5 minutes, then:
grep pushed ~/Library/Logs/fpl-git-agent.log
```

A cleaner test is to let a real generate run happen and watch the log at 10:20.

## Uninstall

```bash
launchctl unload ~/Library/LaunchAgents/com.coffeeandfun.fpl-git.plist
rm ~/Library/LaunchAgents/com.coffeeandfun.fpl-git.plist
```

## Things to know

- It is a **LaunchAgent**, not a LaunchDaemon, deliberately. Agents run inside
  your login session, which is the only place the keychain credential helper is
  reachable. A daemon would fail on push exactly like the sandbox does.
- It only ever stages four paths: `src/pages/blog`, `src/_data/blog.json`,
  `src/_data/fplPicks.json`, `tools/sitemap-lastmod.json`. Never `git add -A`,
  because the sandbox leaves scratch files around.
- It pulls with `--rebase --autostash`, so a `.DS_Store` reappearing cannot
  block it the way it blocked the manual test.
- If a push fails it leaves the marker in place and retries in five minutes,
  rather than losing the approval.
- The mini must be awake and logged in. `StartInterval` jobs missed while asleep
  run once on wake, which for a five-minute job is harmless.
