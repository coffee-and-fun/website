# Setting up on the Mac mini

Work through this in order. **Do not create the scheduled tasks until step 6**,
because automating something you have never run by hand is how you find out in
November that it never worked.

Gameweek 1's deadline is **Friday 21 August 2026, 18:30 BST**, and the generate
window opens five days before that, so everything here needs to be done by
**Sunday 16 August**.

---

## 1. Check the prerequisites

```bash
node --version     # need 18 or newer
npm --version
claude --version
git --version
```

If Node is missing, install it (`brew install node`, or the installer from
nodejs.org). The scheduled tasks call `node` directly and will fail silently
without it.

## 2. Get the repo to the right place

The task prompts assume **`~/Documents/Code/Coffee`**. If you clone it somewhere
else, edit the two prompts in `SCHEDULED-TASK.md` before pasting them.

```bash
cd ~/Documents/Code
git clone https://github.com/coffee-and-fun/website.git Coffee
cd Coffee
npm install
```

## 3. Prove git can push from this machine

This is the one that bites. The Thursday task ends in `git push`, and if the mini
has never authenticated to GitHub it will fail every week without telling you
much.

```bash
git pull
git push          # should say "Everything up-to-date", not prompt or error
```

If it prompts for a password, set up a credential helper or an SSH key first.
GitHub stopped accepting passwords over HTTPS, so a personal access token or SSH
key is required.

## 4. Pull the historical data

One-off, about 78MB and a few minutes. `data/` is gitignored, so this never
touches the repo.

```bash
node tools/fpl/backfill.mjs
node tools/fpl/backfill-understat.mjs
```

## 5. Run the whole pipeline by hand, once

```bash
node tools/fpl/status.mjs        # what does it think should happen today?
node tools/fpl/fetch.mjs         # 3 minutes, 573 player files
node tools/fpl/optimise.mjs --in data/week1
node tools/fpl/to-site.mjs --in data/week1
ELEVENTY_ENV=production npx @11ty/eleventy
```

Then check `docs/fpl/index.html` renders a full eleven, not one player. Open it
with `node tools/serve-docs.mjs` and look.

**Before the window opens**, `status.mjs` will say `shouldGenerate: false` with a
`why` of "too early". That is correct. `fetch.mjs` still runs fine by hand.

## 6. Create the two scheduled tasks

Only now. Open `SCHEDULED-TASK.md` and paste each prompt into a new scheduled
task **in the Claude app on this machine**:

- `fpl-generate`, cron `17 10 * * *`
- `fpl-publish`, cron `23 9 * * *`

They must be created here. Scheduled tasks live in `~/.claude/scheduled-tasks/`
on the machine that made them, so one created on the laptop will never fire.

## 7. Keep the app running

System Settings, General, Login Items: add Claude. Then leave it open.

A closed app does not skip a task, it runs it on next launch, which is worse: a
week-old run firing late is exactly what the deadline guards in `status.mjs` and
`fetch.mjs` exist to catch. They will refuse rather than publish something stale,
but you get no post that week.

Also turn off sleep, or set the mini to wake before 10:00 daily:

```bash
sudo pmset repeat wake MTWRFSU 09:45
```

## 8. Fill in the manual lookup

`tools/fpl/reference/championship-lookup.csv`, 38 rows, about half an hour. These
are the players neither the FPL API nor Understat knows anything about, mostly
Coventry, Hull and Ipswich. Until it is filled in they fall back to a
price-implied prior, which is flagged per player but is a guess.

## 9. On the Friday, enter the team

**This cannot be automated.** FPL has no public write API. When the generate task
produces gameweek 1, read the post, then enter those 15 players in the FPL app
before 18:30 on Friday 21 August.

If you skip it, the published post describes a team you are not fielding, and
next week's optimiser reads your real squad back out of the API and plans a
transfer from a squad the blog never described. The Thursday task checks for this
mismatch once a gameweek has been played, and refuses to publish if it finds one.

---

## Quick sanity checks later in the season

```bash
node tools/fpl/status.mjs                    # should anything happen today?
git log --oneline -5                          # did the generate task commit?
git log --oneline origin/main..main           # is anything waiting to push?
cat src/_data/fplPicks.json | head -20        # what does the site think the team is?
```

## If a week goes missing

Read `why` from `status.mjs` first. Usually the app was closed for the whole
five-day window. Recover by hand:

```bash
node tools/fpl/fetch.mjs
node tools/fpl/optimise.mjs --in data/week{N}
node tools/fpl/to-site.mjs --in data/week{N}
```

then ask Claude to write the post from `data/week{N}/picks.json` and push it.
