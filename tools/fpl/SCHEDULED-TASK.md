# The scheduled tasks

Create these **on the Mac mini**. Scheduled tasks live per machine in
`~/.claude/scheduled-tasks/`, so one created on the laptop will never fire on the
mini.

Use the app's scheduled tasks, not `CronCreate`. `CronCreate` is session-only and
expires after seven days, which is no use across 38 gameweeks.

The Claude app must be **running** on the mini. If it is closed when a task is
due, the run happens on next launch instead. That is exactly why both prompts
re-check the deadline rather than trusting the clock.

---

## Why both tasks run daily

Deadlines do not fall on the same day each week. In 2026/27: 27 on a Saturday,
4 on a Friday, 2 on a Sunday, and **5 on a Wednesday** (gameweeks 13, 18, 20, 25
and 28). A fixed Wednesday-generate plus Thursday-publish would try to publish
those five after the deadline had already gone, the publish guard would correctly
refuse, and five gameweeks would silently never appear.

So both tasks run every day and ask `node tools/fpl/status.mjs` whether there is
anything to do. It answers from the real deadline, and exits them quietly on the
days there is not. Date arithmetic stays out of the prompt, which is where it
would eventually go wrong without anyone noticing.

## The loop, including the bit no software can do

1. **Generate, automated.** When the next deadline is between 5 days and 36 hours
   away: fetch, optimise, write the post, commit locally.
2. **You, by hand.** Read the post, then enter the squad or transfer in the FPL app.
3. **Publish, automated.** Next morning, verify and push.

**Step 2 cannot be automated.** FPL has no public write API; teams are entered
through their site or app and nowhere else. If you skip it, the published post
describes a team you are not fielding, which breaks the premise of the whole
project. It also compounds: next week's optimiser reads your real squad back out
of the API, so it plans a transfer from a squad the blog never described.

---

## Task 1 — generate

- **Task id:** `fpl-generate`
- **Schedule:** `17 10 * * *` (every day, 10:17, deliberately off the hour)

Paste this as the prompt:

> You are generating this week's Fantasy Premier League picks for The Algorithm,
> a public experiment published on coffeeandfun.com. An AI picks the team every
> gameweek and the reasoning is published before the deadline, never after the
> results. Readers can join the league and try to beat it.
>
> Work in `~/Documents/Code/Coffee`. Run every command from that directory.
>
> ## What you must not do
>
> - **Do not pick or change players yourself.** `optimise.mjs` selects the squad.
>   The project's whole claim is that the selection is reproducible and a reader
>   can re-run it. If the output looks wrong, say so in your report and stop.
>   Never quietly substitute your own judgement.
> - **Do not state a number you have not read out of `picks.json`.** No estimated
>   points, no invented ownership, no remembered prices.
> - **Do not push.** The publish task does that, after Robert has read it.
>
> ## Steps
>
> 1. `git pull`, then run `node tools/fpl/status.mjs`.
>    If `shouldGenerate` is false, **stop immediately and say nothing further**
>    except the value of `why`. This runs daily and most days there is nothing
>    to do. Do not generate anything early, and do not override the window.
>
> 2. Run `node tools/fpl/fetch.mjs`.
>    - Exit 0: continue.
>    - **Exit 4** means the deadline is under two hours away. Do not pass
>      `--force`. Stop and report that the run fired too late.
>    - **Exit 3** means the season is over. Stop and say so.
>    - Any other failure: stop and report the error verbatim.
>
> 3. Read `data/week{N}/manifest.json` for the gameweek number and deadline.
>
> 4. Run `node tools/fpl/optimise.mjs --in data/week{N}`.
>
> 5. Run `node tools/fpl/to-site.mjs --in data/week{N}`. This writes the slimmed
>    record into `src/_data/fplPicks.json`, which is what /fpl/ and the gameweek
>    archive pages are built from. Without this step the site still shows last
>    week's team.
>
> 6. Read `data/week{N}/picks.json` in full. Everything you write comes from
>    this file. Pay attention to:
>    - `transfers.action`: `fresh squad` (gameweek 1 or a wildcard), `transfer`,
>      or `roll`. Each needs a different write-up.
>    - `captaincy.wentDifferential`: whether the brave rule fired, and what the
>      safe pick would have been.
>    - `flags` on each player, and `model.knownLimitations`.
>
> 7. If `data/week{N}/live-gw*.json` exists, read it for last week's result. Also
>    read `data/week{N}/league-standings.json` for the league position.
>
> 8. Write `src/pages/blog/the-algorithm-gameweek-{N}.md`.
>
>    **Frontmatter**, exactly this shape:
>
>    ```
>    ---
>    new: true
>    submit: false
>    footer: true
>    header: true
>    layout: templates/post.liquid
>    title: "The Algorithm, Gameweek {N}: <a short specific hook>"
>    description: <one sentence, about 150 characters, no colon followed by a space>
>    keywords:
>      FPL gameweek {N}, AI FPL picks, fantasy premier league tips, FPL captain
>      gameweek {N}, The Algorithm series
>    url: blog/the-algorithm-gameweek-{N}/
>    isBlog: true
>    blog_cat: Experiment
>    youtubeId:
>    cardTitle: "The Algorithm, Gameweek {N}"
>    name: Robert James Gabriel
>    img: /assets/images/blog/the-algorithm-gameweek-{N}.png
>    date: <today at noon UTC, e.g. 2026-08-19T12:00:00.000Z>
>    time: <words / 185, e.g. "6 min">
>    tags:
>      - ai
>      - series
>      - fun
>    ---
>    ```
>
>    The social card is generated automatically at build time from `cardTitle`.
>    You do not need to make one.
>
>    **Structure**, in this order:
>
>    - **Last week**, if there is one. The score, the league position, and what
>      went wrong if it went wrong. Bad weeks get the same treatment as good ones.
>      No excuses, no "unlucky".
>    - **This week's team.** The starting eleven with the formation, and the
>      bench in order. A table is fine.
>    - **The transfer.** If `action` is `transfer`, who came out, who came in,
>      the net expected gain, and whether it cost a hit. If `roll`, say the
>      transfer was rolled and why nothing was worth doing. If `fresh squad`,
>      explain that this is the opening pick.
>    - **The captain.** Who, and why. If `wentDifferential` is true, name the
>      safe pick that was passed over and give the ownership numbers. That
>      contrast is the most interesting thing in the post most weeks.
>    - **What the model is worried about.** Draw on the `flags` and on
>      `model.knownLimitations`. Every post should name at least one thing the
>      model cannot see.
>    - **A closing thought.** Not a call to action. The league code `bsg8nz` can
>      appear once, in passing.
>
>    **Voice.** Read `BLOG-QUEUE.md` before writing and follow its rules. In
>    short: plain, warm, short sentences. Receipts over claims. Say something a
>    reader could argue with. **No em dashes or en dashes anywhere**, use commas,
>    full stops or brackets. Straight ASCII quotes. Exactly one H1, which comes
>    from `cardTitle`, so use `##` and `###` in the body only. Do not write
>    "as an AI" or narrate your own process.
>
> 9. Prepend an entry to the `posts` array in `src/_data/blog.json` with `name`,
>    `description`, `link`, `platform: ["blog","guide"]` and `image`. **Two-space
>    indentation**, matching the existing entries. A post missing from this file
>    is invisible on the site.
>
> 10. Run `ELEVENTY_ENV=production npx @11ty/eleventy`. It must exit 0 and produce
>    `docs/blog/the-algorithm-gameweek-{N}/index.html`. If the build fails, fix
>    the cause and rebuild. Do not proceed on a failing build.
>
> 11. Commit the post, `src/_data/blog.json`, `src/_data/fplPicks.json` and
>     `tools/sitemap-lastmod.json` if it changed:
>     `git commit -m "The Algorithm: gameweek {N}"`
>     Do NOT commit anything under `data/`, which is gitignored for good reason.
>
> ## Report back
>
> Lead with anything that went wrong. Then, in this order:
>
> 1. **The squad, in full, ready to enter into FPL.** List all 15 with position,
>    club and price: the starting eleven grouped by position, then the bench in
>    order, then who is captain and who is vice. Robert enters the team from this
>    report, so it has to be complete enough to work from without opening
>    anything else.
> 2. **The transfer**, if there was one: out, in, and the net gain. If it rolled,
>    say so.
> 3. The captain's ownership and whether the differential rule fired.
> 4. Expected points and the commit hash.
> 5. **The deadline, spelled out in full**, with a reminder that the team still
>    has to be entered in the FPL app by then. Nothing else in this pipeline can
>    do that step.
>
> Mention that the post is committed but not yet published, and that the publish
> task will push it the next morning.

---

## Task 2 — publish

- **Task id:** `fpl-publish`
- **Schedule:** `23 9 * * *` (every day, 9:23)

Paste this as the prompt:

> Publish this week's Fantasy Premier League post for The Algorithm, but only if
> it is safe to.
>
> Work in `~/Documents/Code/Coffee`.
>
> 1. Run `node tools/fpl/status.mjs`. If `shouldPublish` is false, **stop
>    immediately** and report only `why`. Most days there is nothing to push.
>    Never generate a post here: one written after the data was pulled would be
>    describing a different week.
>
> 2. `status.mjs` has already confirmed the deadline is more than two hours away.
>    Sanity-check `hoursUntilDeadline` in its output looks plausible before
>    continuing; if it does not, stop and report it.
>
> 3. Confirm the squad Robert is actually fielding matches what the post says.
>    Fetch
>    `https://fantasy.premierleague.com/api/entry/3065962/event/{N}/picks/`.
>    - If it 404s, the gameweek has not started yet and the squad cannot be read.
>      That is normal. Note in your report that it could not be verified.
>    - If it returns a squad that does not match `picks.json`, **stop** and tell
>      Robert the team on record differs from the one about to be published.
>
> 4. If the checks pass, `git push`.
>
> 5. Report the gameweek, the commit hash, whether the squad could be verified,
>    and confirmation it pushed.
>
> If any check fails, say so plainly and do nothing else. A week with no post is
> recoverable. A week with a post that misdescribes the team, or that pretends to
> predate a deadline, is not.

---

## When it goes wrong

**Nothing was generated this week.** Run `node tools/fpl/status.mjs` and read
`why`. Usually the app was closed for the whole five-day window. Run
`node tools/fpl/fetch.mjs` and `node tools/fpl/optimise.mjs --in data/week{N}`
by hand, then ask Claude to write the post and push it.

**"The squad on record does not match."** You did not enter the transfer, or you
entered a different one. Decide which is true, then either apply the transfer or
edit the post to describe what you actually did. Do not publish the mismatch.

**The optimiser output looks wrong.** Do not edit `picks.json`. Fix the model in
`optimise.mjs`, rerun, and note in the post that the model changed. The method is
the product; silently patching its output is the one thing that would make the
whole exercise worthless.
