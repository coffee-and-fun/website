# The Algorithm

The pipeline behind `/fpl/` and the weekly gameweek posts.

## The split, and why

**Code picks the squad. Claude writes the words.**

Choosing 15 players under a £100m budget with positional quotas and a
three-per-club cap is a constrained optimisation problem. It has a right answer,
it must give the same answer twice, and a reader has to be able to check it. A
language model freehanding that would be slower, unreproducible, and would
eventually invent a price. The launch post promises people can argue with the
reasoning, and nobody can audit a vibe.

So `optimise.mjs` selects the team and `picks.json` records exactly why. Claude
reads that file and writes the post.

## The scripts

| Script | What it does |
|---|---|
| `fetch.mjs` | Weekly pull into `data/week{N}/`. Works out N from the next deadline and **refuses to run inside the last two hours** before it. |
| `optimise.mjs` | Reads a week folder, writes `picks.json`: squad, XI, formation, captain, and the reasoning for each. |
| `backfill.mjs` | One-off historical pull: Vaastav, Football-Data, ClubElo. Run once on a new machine. About 78MB, a few minutes. |
| `backfill-understat.mjs` | One-off: player-level xG for the big five, 2020 to 2025. |
| `status.mjs` | Should anything happen today? Answers from the real deadline so the scheduled tasks never assume a weekday. |

```bash
node tools/fpl/backfill.mjs            # once, on a new machine
node tools/fpl/backfill-understat.mjs  # once
node tools/fpl/fetch.mjs               # weekly
node tools/fpl/optimise.mjs --in data/week1
```

`data/` is gitignored. It regenerates in minutes, and 50MB of Vaastav in a
website's git history would be there forever.

## reference/

Hand-made, not reproducible for free, so these are committed.

- **`stadiums.json`** — all 20 grounds geocoded via OpenStreetMap Nominatim, each
  checked to be in GB and within 40km of its club's city, no two clubs sharing a
  point. Feed the coordinates to Open-Meteo. Everton is at the Hill Dickinson
  Stadium, not Goodison.
- **`championship-lookup.csv`** — the 38 players priced £4.5m and up that neither
  the FPL API nor Understat knows anything about. Fill in by hand once before
  gameweek 1. Mostly Coventry, Hull and Ipswich, plus signings from leagues
  Understat does not cover.

## The model

```
expected points = base per 90  x  expected minutes  x  fixture difficulty  x  availability
```

Deliberately legible. Every term is something a reader can argue with, which is
the point of publishing the method.

Two things it gets right that are easy to get wrong, both found by testing
against real data rather than by reasoning about it:

**Minutes are per team game, not per start.** Dividing by starts asks how long a
player lasts when he plays, which reads a substitute who completed the three
matches he started as a nailed 90-minute player. The first version did this and
picked a squad of fringe players, captaining a 0.2%-owned substitute.

**Thin samples are shrunk toward the positional mean.** Without it, 300 noisy
minutes outrank 3000 solid ones and the squad fills with players who had one good
afternoon.

## The solver

Greedy seed, then two phases of local search.

Phase 2 exists because single swaps can never reach a premium. Haaland outscores
a mid-price midfielder but costs seven million more, and with half a million
spare no one-for-one move is affordable, so phase 1 converges having never
considered him. Funding an upgrade by cutting elsewhere is a two-player move, and
it is the only way the squad ever owns a captaincy candidate. Adding it took the
test squad from £94m spent and no premium, to £100.0m spent with Bruno Fernandes
captained.

The objective counts the captain twice, because the armband doubles somebody.
Leave that out and the solver buys eleven mid-price starters: it optimises the
floor and quietly gives up the ceiling, which is the opposite of the stated
philosophy.

It is deterministic, not proven globally optimal. Same input, same squad, every
run.

## Captaincy

Highest expected points, unless a materially less owned player is within 90% of
that, in which case the differential wins. Owning what everybody owns cannot gain
rank however many points it scores. `picks.json` records whether the rule fired.

## Known limitations, stated in every post

- **No predicted lineups.** Scout and Hub sell human judgement and there is no
  free equivalent. Minutes are inferred from starts per appearance, which misses
  a manager signalling a rest on the Friday.
- **Players with no record** fall back to a price-implied prior, flagged per
  player in `flags[]`.
- **Promoted-club players** are judged on shot volume, not shot quality, because
  free Championship data has no xG.

## Transfers, blanks and doubles

From gameweek 2 the optimiser plans a move rather than rebuilding: a fresh
optimal fifteen is only legal on a wildcard, and a pipeline that ignores that
hands you a squad you cannot field. It reads the real squad from
`entry/{id}/event/{gw}/picks/`.

Free transfers bank up to five. The API exposes transfers made but not free
transfers remaining, so the count is reconstructed from history. If it ever
disagrees with the app, trust the app.

Doubles are handled: expected points multiply by the number of fixtures. Blanks
are too, and carefully. A held player with no fixture still occupies a squad
slot, so the transfer planner indexes every player rather than only the
selectable ones. Building the held squad from the filtered pool is how a blank
gameweek quietly becomes a fourteen-man squad.

## Scheduling

See `SCHEDULED-TASK.md`. Both tasks run daily and ask `status.mjs` whether
there is anything to do, because deadlines are not on a fixed day: 2026/27 has 27
Saturdays, 4 Fridays, 2 Sundays and 5 Wednesdays. A fixed weekday schedule would
skip five gameweeks.
