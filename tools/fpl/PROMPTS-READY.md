# Paste-ready prompts

Tasks 1 and 2 go in as scheduled tasks **on the Mac mini**, in the Claude app on
this machine. Scheduled tasks live in `~/.claude/scheduled-tasks/` on the machine
that made them, so one created anywhere else will never fire here.

Task 0 is **not scheduled**. Paste it into a normal chat, once, now.

The blockquote markers from `SCHEDULED-TASK.md` have been stripped, and the
working directory has been changed from `~/Documents/Code/Coffee` to the real
location of the clone, `~/Documents/Major/code/coffee/website`. That is the only
edit to tasks 1 and 2. Everything else in them is verbatim.

---

## Task 0 — week 0 base squad (one-off, do not schedule)

Run this now to get an opening fifteen ahead of the generate window, which does
not open until 16 August. Requires steps 3 and 4 of `SETUP.md` to be done first.

**This prompt deliberately does not write the post and does not commit.** Two
guards in `status.mjs` read state off the disk, and a week 0 run that behaved
like a real one would trip both:

- `shouldGenerate` is `!postExists && ...`. Writing
  `src/pages/blog/the-algorithm-gameweek-1.md` now flips `postExists` to true
  permanently, and `why` becomes "post already written for this gameweek". The
  real `fpl-generate` run for gameweek 1 would then never fire.
- `shouldPublish` is `!!pendingCommit && hours > 2`, where `pendingCommit` is any
  unpushed commit matching `/The Algorithm: gameweek/i`. Committing with that
  message now makes `shouldPublish` true immediately, and `fpl-publish` would
  push a pre-season post at 9:23 the next morning.

So week 0 stops at `picks.json` and reports. The real run writes the words.

```
Pick a base Fantasy Premier League squad for The Algorithm, ahead of the
generate window. This is a one-off pre-season run, not the weekly job.

Work in `~/Documents/Major/code/coffee/website`. Run every command from that
directory.

## What this run is for

Gameweek 1's deadline is Friday 21 August 2026 at 18:30 BST, and the generate
window does not open until five days before that. Robert wants an opening
fifteen he can enter in the FPL app now, as a base. The real run will happen
inside the window and supersedes this one.

## What you must not do

- **Do not write `src/pages/blog/the-algorithm-gameweek-1.md`.** `status.mjs`
  gates `shouldGenerate` on that file not existing. Creating it now would stop
  the real gameweek 1 run from ever firing.
- **Do not commit anything**, and in particular never with a message matching
  "The Algorithm: gameweek". `status.mjs` treats any unpushed commit matching
  that as a post awaiting publication, and `fpl-publish` would push it.
- **Do not push.**
- **Do not run `to-site.mjs`.** It rewrites the tracked
  `src/_data/fplPicks.json`, which already holds gameweek 1 data. Leave the site
  alone until the real run.
- **Do not pick or change players yourself.** `optimise.mjs` selects the squad.
  If the output looks wrong, say so and stop. Never substitute your judgement.
- **Do not state a number you have not read out of `picks.json`.**

## Steps

1. Run `node tools/fpl/status.mjs` and report `gameweek`, `deadlineLondon` and
   `hoursUntilDeadline`. It will say `shouldGenerate: false` with a `why` of
   "too early". **That is expected here. Ignore it and continue.** This is the
   only run that is allowed to.

2. Run `node tools/fpl/fetch.mjs`. It has no early guard, only a late one, so it
   runs fine this far out. Takes about 3 minutes for 573 player files.
   - **Exit 4** means the deadline is under two hours away, which would mean
     something is badly wrong with the date. Do not pass `--force`. Stop.
   - **Exit 3** means the season is over. Stop and say so.
   - Any other failure: stop and report the error verbatim.

3. Read `data/week1/manifest.json` and confirm `gameweek` is 1 and
   `elementSummaryFailures` is low. If more than about 20 player files failed,
   stop and say so, because the squad would be picked off partial data.

4. Run `node tools/fpl/optimise.mjs --in data/week1`.
   With no finished gameweeks the picks endpoint 404s, so there is no held squad
   and the optimiser builds a fresh fifteen. That is correct for gameweek 1.

5. Read `data/week1/picks.json` in full.

## Report back

- The starting eleven with the formation, and the bench in order. A table.
- Total spent against the 100.0 cap, and the money left in the bank.
- The captain, their ownership, their expected points, and whether
  `captaincy.wentDifferential` fired. If it did, name the safe pick that was
  passed over.
- Expected points for the starting eleven, and with the captain doubled.
- Every player carrying a `flags` entry, and what the flag says. Say plainly how
  many of the fifteen are on a price-implied prior rather than a real record.
- Confirm in one line that you wrote no post, made no commit, and did not touch
  `src/_data/fplPicks.json`.

Then remind Robert of two things:

1. He can enter this fifteen now as a base. Gameweek 1 is a free pick, so the
   real run inside the window will also build fresh, and whatever it produces
   replaces this squad rather than transferring from it. Nothing is locked in by
   entering it early.
2. This data is roughly twelve days ahead of the deadline. Prices will move and
   injuries will happen, so expect the real squad to differ, and the team that
   counts is the one entered before 18:30 BST on Friday 21 August.

If anything went wrong, lead with that.
```

---

## Task 1

- **Task id:** `fpl-generate`
- **Schedule:** `17 10 * * *`

```
You are generating this week's Fantasy Premier League picks for The Algorithm,
a public experiment published on coffeeandfun.com. An AI picks the team every
gameweek and the reasoning is published before the deadline, never after the
results. Readers can join the league and try to beat it.

Work in `~/Documents/Major/code/coffee/website`. Run every command from that
directory.

## What you must not do

- **Do not pick or change players yourself.** `optimise.mjs` selects the squad.
  The project's whole claim is that the selection is reproducible and a reader
  can re-run it. If the output looks wrong, say so in your report and stop.
  Never quietly substitute your own judgement.
- **Do not state a number you have not read out of `picks.json`.** No estimated
  points, no invented ownership, no remembered prices.
- **Do not push.** The publish task does that, after Robert has read it.

## Steps

1. `git pull`, then run `node tools/fpl/status.mjs`.
   If `shouldGenerate` is false, **stop immediately and say nothing further**
   except the value of `why`. This runs daily and most days there is nothing
   to do. Do not generate anything early, and do not override the window.

2. Run `node tools/fpl/fetch.mjs`.
   - Exit 0: continue.
   - **Exit 4** means the deadline is under two hours away. Do not pass
     `--force`. Stop and report that the run fired too late.
   - **Exit 3** means the season is over. Stop and say so.
   - Any other failure: stop and report the error verbatim.

3. Read `data/week{N}/manifest.json` for the gameweek number and deadline.

4. Run `node tools/fpl/optimise.mjs --in data/week{N}`.

5. Run `node tools/fpl/to-site.mjs --in data/week{N}`. This writes the slimmed
   record into `src/_data/fplPicks.json`, which is what /fpl/ and the gameweek
   archive pages are built from. Without this step the site still shows last
   week's team.

6. Read `data/week{N}/picks.json` in full. Everything you write comes from
   this file. Pay attention to:
   - `transfers.action`: `fresh squad` (gameweek 1 or a wildcard), `transfer`,
     or `roll`. Each needs a different write-up.
   - `captaincy.wentDifferential`: whether the brave rule fired, and what the
     safe pick would have been.
   - `flags` on each player, and `model.knownLimitations`.

7. If `data/week{N}/live-gw*.json` exists, read it for last week's result. Also
   read `data/week{N}/league-standings.json` for the league position.

8. Write `src/pages/blog/the-algorithm-gameweek-{N}.md`.

   **Frontmatter**, exactly this shape:

   ```
   ---
   new: true
   submit: false
   footer: true
   header: true
   layout: templates/post.liquid
   title: "The Algorithm, Gameweek {N}: <a short specific hook>"
   description: <one sentence, about 150 characters, no colon followed by a space>
   keywords:
     FPL gameweek {N}, AI FPL picks, fantasy premier league tips, FPL captain
     gameweek {N}, The Algorithm series
   url: blog/the-algorithm-gameweek-{N}/
   isBlog: true
   blog_cat: Experiment
   youtubeId:
   cardTitle: "The Algorithm, Gameweek {N}"
   name: Robert James Gabriel
   img: /assets/images/blog/the-algorithm-gameweek-{N}.png
   date: <today at noon UTC, e.g. 2026-08-19T12:00:00.000Z>
   time: <words / 185, e.g. "6 min">
   tags:
     - ai
     - series
     - fun
   ---
   ```

   The social card is generated automatically at build time from `cardTitle`.
   You do not need to make one.

   **Structure**, in this order:

   - **Last week**, if there is one. The score, the league position, and what
     went wrong if it went wrong. Bad weeks get the same treatment as good ones.
     No excuses, no "unlucky".
   - **This week's team.** The starting eleven with the formation, and the
     bench in order. A table is fine.
   - **The transfer.** If `action` is `transfer`, who came out, who came in,
     the net expected gain, and whether it cost a hit. If `roll`, say the
     transfer was rolled and why nothing was worth doing. If `fresh squad`,
     explain that this is the opening pick.
   - **The captain.** Who, and why. If `wentDifferential` is true, name the
     safe pick that was passed over and give the ownership numbers. That
     contrast is the most interesting thing in the post most weeks.
   - **What the model is worried about.** Draw on the `flags` and on
     `model.knownLimitations`. Every post should name at least one thing the
     model cannot see.
   - **A closing thought.** Not a call to action. The league code `bsg8nz` can
     appear once, in passing.

   **Voice.** Read `BLOG-QUEUE.md` before writing and follow its rules. In
   short: plain, warm, short sentences. Receipts over claims. Say something a
   reader could argue with. **No em dashes or en dashes anywhere**, use commas,
   full stops or brackets. Straight ASCII quotes. Exactly one H1, which comes
   from `cardTitle`, so use `##` and `###` in the body only. Do not write
   "as an AI" or narrate your own process.

9. Prepend an entry to the `posts` array in `src/_data/blog.json` with `name`,
   `description`, `link`, `platform: ["blog","guide"]` and `image`. **Two-space
   indentation**, matching the existing entries. A post missing from this file
   is invisible on the site.

10. Run `ELEVENTY_ENV=production npx @11ty/eleventy`. It must exit 0 and produce
   `docs/blog/the-algorithm-gameweek-{N}/index.html`. If the build fails, fix
   the cause and rebuild. Do not proceed on a failing build.

11. Commit the post, `src/_data/blog.json`, `src/_data/fplPicks.json` and
    `tools/sitemap-lastmod.json` if it changed:
    `git commit -m "The Algorithm: gameweek {N}"`
    Do NOT commit anything under `data/`, which is gitignored for good reason.

## Report back

The gameweek, the captain and their ownership, whether the differential rule
fired, the transfer or roll, the expected points, the commit hash, and
**a clear reminder that Robert still has to enter the team in the FPL app
before the deadline**, with the deadline time spelled out.

If anything went wrong, lead with that.
```

---

## Task 2

- **Task id:** `fpl-publish`
- **Schedule:** `23 9 * * *`

```
Publish this week's Fantasy Premier League post for The Algorithm, but only if
it is safe to.

Work in `~/Documents/Major/code/coffee/website`.

1. Run `node tools/fpl/status.mjs`. If `shouldPublish` is false, **stop
   immediately** and report only `why`. Most days there is nothing to push.
   Never generate a post here: one written after the data was pulled would be
   describing a different week.

2. `status.mjs` has already confirmed the deadline is more than two hours away.
   Sanity-check `hoursUntilDeadline` in its output looks plausible before
   continuing; if it does not, stop and report it.

3. Confirm the squad Robert is actually fielding matches what the post says.
   Fetch
   `https://fantasy.premierleague.com/api/entry/3065962/event/{N}/picks/`.
   - If it 404s, the gameweek has not started yet and the squad cannot be read.
     That is normal. Note in your report that it could not be verified.
   - If it returns a squad that does not match `picks.json`, **stop** and tell
     Robert the team on record differs from the one about to be published.

4. If the checks pass, `git push`.

5. Report the gameweek, the commit hash, whether the squad could be verified,
   and confirmation it pushed.

If any check fails, say so plainly and do nothing else. A week with no post is
recoverable. A week with a post that misdescribes the team, or that pretends to
predate a deadline, is not.
```
