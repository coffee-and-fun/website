# The three timers

## Why it is split this way

Claude scheduled tasks on the mini run in a sandboxed VM with the repo mounted
over FUSE. Tested 9 August 2026, that sandbox **can** read, write and reach the
network, but **cannot** delete files and **cannot** authenticate to GitHub. So
`git commit` there strands a `.git/index.lock` nothing in the sandbox can
remove, and `git push` fails outright. The same test from Terminal passed.

So: Claude crunches, cron does git. Nothing that touches git runs inside Claude.

| # | Timer | Where | When | Does |
|---|---|---|---|---|
| 1 | `fpl-generate` | Claude scheduled task | 10:17 daily | fetch, optimise, write the post, build. Leaves changes **uncommitted**. |
| 2 | `fpl-publish` | Claude scheduled task | 9:23 daily | verify the squad on record, then `touch tools/fpl/.push-approved` |
| 3 | `git-agent.sh` | macOS cron | 11:00 and 23:00 | pull, commit what timer 1 left, push when the marker exists |

Timers 1 and 2 exit in under a second on the ~33 days a week where
`status.mjs` says there is nothing to do. Timer 3 exits silently when the tree
is clean, which is nearly always.

### Why 11:00 and 23:00, not just "every 12 hours"

The agent has to land in two specific gaps:

- **after 10:17**, because that is when `fpl-generate` finishes and leaves the
  post uncommitted. Run the agent before then and the post sits uncommitted all
  day, `status.mjs` finds no pending commit, and `fpl-publish` does nothing.
- **after 9:23**, because that is when `fpl-publish` writes the approval marker.

11:00 satisfies both, 43 minutes after generate and 97 minutes after publish.
23:00 is the safety net for a day the mini was asleep at 11:00.

The cost of twice-daily instead of every five minutes is latency, not
correctness: an approved post waits until the next 11:00 or 23:00 to go live
rather than a few minutes. Since `fpl-publish` only approves when the deadline
is more than two hours away, and in practice more than a day away, that slack
is affordable.

## The marker

`fpl-publish` cannot push, so it writes `tools/fpl/.push-approved` instead. The
agent pushes only when it finds that file, then deletes it. This is what keeps
the safety gate: a post whose squad could not be verified stays committed and
unpushed until a later day approves it. Creating files works in the sandbox;
deleting them does not, which is why the agent clears the marker rather than
the task.

`status.mjs` needs no changes. The agent commits with the message
`The Algorithm: gameweek {N}`, which is the `/The Algorithm: gameweek/i` pattern
it already scans for when deciding `shouldPublish`.

## Install

```bash
bash tools/fpl/install-cron.sh
```

Idempotent, so rerunning it replaces the line rather than doubling it. Check:

```bash
crontab -l
tail -f ~/Library/Logs/fpl-git-agent.log
```

## The two things that will bite

**1. cron needs Full Disk Access.** On modern macOS, cron cannot read
`~/Documents` without it, and the failure is silent: an empty log forever.
System Settings, Privacy and Security, Full Disk Access, click `+`, press
Cmd+Shift+G, type `/usr/sbin/cron`, add it, then reboot.

Test it properly, not by assuming:

```bash
( crontab -l; echo "* * * * * date -u >> /tmp/cron-probe.txt" ) | crontab -
sleep 70; cat /tmp/cron-probe.txt      # a line here means cron can run at all
```

Then remove that probe line.

**2. cron may not reach the login keychain.** `osxkeychain` works reliably from
a GUI login session; a cron job is not always in one. If the log shows
`could not read Username`, the credential helper is the problem, not the script.
Two fixes that work from any context:

```bash
# preferred: SSH with a passphrase-less key
ssh-keygen -t ed25519 -C "mac-mini fpl" -f ~/.ssh/id_ed25519_fpl -N ""
# add ~/.ssh/id_ed25519_fpl.pub to GitHub, then:
git remote set-url origin git@github.com:coffee-and-fun/website.git
ssh -T git@github.com                  # should greet you by username
```

```bash
# or a token on disk, simpler but plaintext
git config --global credential.helper store
git push                               # once, by hand, to seed ~/.git-credentials
chmod 600 ~/.git-credentials
```

SSH is the better choice for an unattended job. A passphrase-less key is fine
here because the alternative is a plaintext token, and the key can be revoked
from GitHub independently of your account password.

## Verify the whole chain without waiting for a gameweek

```bash
touch tools/fpl/.push-approved
bash tools/fpl/git-agent.sh >> ~/Library/Logs/fpl-git-agent.log 2>&1   # by hand
grep -E "pushed|ERROR" ~/Library/Logs/fpl-git-agent.log | tail -5
ls tools/fpl/.push-approved            # should be gone
```

With a clean tree the agent has nothing to commit, so this exercises the pull,
the push and the marker cleanup. If the marker disappears and the log says
`pushed`, timer 3 works.

## Uninstall

```bash
crontab -l | grep -v fpl-git-agent | crontab -
```

## If you had already loaded the launchd version

```bash
launchctl bootout gui/$(id -u)/com.coffeeandfun.fpl-git 2>/dev/null
rm -f ~/Library/LaunchAgents/com.coffeeandfun.fpl-git.plist
```

Run this before installing the cron job. Two copies of the agent racing each
other is exactly what the run lock is there to survive, but there is no reason
to make it work for a living.

## Changing the schedule

Edit `SCHEDULE` at the top of `install-cron.sh` and rerun it. Keep both
constraints above in mind: any run time earlier than 10:17 does not help, and
you want at least one run in the window between 9:23 and the deadline.
