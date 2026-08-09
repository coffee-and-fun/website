# The scheduled task

Set this up **on the Mac mini**, not on the laptop. Scheduled tasks are stored
per machine in `~/.claude/scheduled-tasks/`, so one created anywhere else will
never fire on the mini.

Use the app's scheduled tasks, not `CronCreate`. `CronCreate` is session-only and
auto-expires after seven days, which is no use across a 38 week season.

The Claude app must be **running** on the mini. If it is closed when the task is
due, the run happens on next launch instead, which is exactly why the prompt
below re-checks the deadline rather than trusting the clock.

---

## Wednesday task

Task id: `fpl-generate`
Schedule: `17 10 * * 3` (Wednesdays, 10:17am local, off the hour on purpose)

Prompt, paste verbatim:

> You are generating this week's Fantasy Premier League picks for The Algorithm,
> a public experiment on coffeeandfun.com.
>
> Work in `~/Documents/Code/Coffee`. Run everything from that directory.
>
> 1. Run `node tools/fpl/fetch.mjs`. If it exits non-zero, STOP and report why.
>    Exit code 4 means the deadline is under two hours away and generating now
>    would be wrong; do not override it, just report.
> 2. Read `data/week{N}/manifest.json` for the gameweek number.
> 3. Run `node tools/fpl/optimise.mjs --in data/week{N}`. This picks the squad.
>    Do not second-guess it, do not substitute your own players, and do not
>    recalculate anything: the whole point is that the selection is reproducible
>    and a reader can re-run it. If the output looks wrong, say so in your report
>    rather than quietly changing it.
> 4. Read `data/week{N}/picks.json`.
> 5. Write a gameweek post to
>    `src/pages/blog/the-algorithm-gameweek-{N}.md`, following the frontmatter
>    shape of `src/pages/blog/ai-fantasy-premier-league-experiment.md` exactly.
>    Use `blog_cat: Experiment`, tags `ai`, `series`, `fun`, and set `date` to
>    today at noon UTC.
>
>    The post must contain, in this order: the starting eleven and formation;
>    the captain and why, naming whether the differential rule fired; any
>    transfers from last week and the reasoning; what the model is worried about,
>    taken from the `flags` on each player and from `model.knownLimitations`; and
>    last week's result if `data/week{N}/live-gw*.json` exists.
>
>    Voice: read `BLOG-QUEUE.md` first and follow the voice rules exactly. Plain,
>    short sentences. No em dashes or en dashes anywhere. Never claim a number
>    you have not read out of picks.json. If something went badly, say so plainly.
> 6. Add the post to `src/_data/blog.json`, prepending to the `posts` array, using
>    two-space indentation to match the existing entries.
> 7. Run `ELEVENTY_ENV=production npx @11ty/eleventy`. It must exit 0.
> 8. `git add` only the post and `src/_data/blog.json`, then commit with the
>    message `The Algorithm: gameweek {N}`.
>
> **Do not push.** Thursday's task does that after Robert has read it.
>
> Report at the end: the gameweek, the captain, the expected points, the commit
> hash, and anything that looked wrong.

---

## Thursday task

Task id: `fpl-publish`
Schedule: `23 9 * * 4` (Thursdays, 9:23am local)

Prompt, paste verbatim:

> Publish this week's Fantasy Premier League post for The Algorithm, if and only
> if it is safe to do so.
>
> Work in `~/Documents/Code/Coffee`.
>
> 1. Check the most recent commit on `main` is a `The Algorithm: gameweek N`
>    commit made in the last 48 hours. If it is not, STOP and report that
>    Wednesday's run did not produce anything. Do not generate it yourself.
> 2. Read `data/week{N}/manifest.json` and confirm the deadline is still in the
>    future. If it has passed, STOP and report it: publishing picks for a
>    gameweek that has kicked off breaks the promise the project is built on.
> 3. If both checks pass, `git push`.
> 4. Report the gameweek, the commit hash, and confirmation it pushed.
>
> If either check fails, say so clearly and do nothing else. A week with no post
> is recoverable. A week with a post that pretends to predate a deadline is not.

---

## Why it is split across two days

The gap is the review buffer. Wednesday commits locally, you read it, Thursday
pushes. The Thursday task refuses to publish stale or post-deadline work rather
than assuming Wednesday succeeded, so a silent failure surfaces as "nothing was
published and here is why" instead of as nothing at all.
