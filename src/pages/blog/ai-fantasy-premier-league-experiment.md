---
new: true
submit: false
footer: true
header: true
layout: templates/post.liquid
title: "An AI Picks My Fantasy Premier League Team Every Week This Season"
description: A season-long experiment. An AI picks my Fantasy Premier League team every week of 2026/27 and I publish every decision. Free FPL league, code bsg8nz.
keywords:
  AI Fantasy Premier League, AI FPL, FPL AI team picker, fantasy premier league 2026/27,
  FPL algorithm, AI fantasy football, FPL captain picks, expected goals FPL, FPL data model,
  FPL differential captain, fantasy premier league league code, The Algorithm series
url: blog/ai-fantasy-premier-league-experiment/
isBlog: true
blog_cat: Experiment
youtubeId:
cardTitle: "An AI Picks My Fantasy Premier League Team Every Week This Season"
name: Robert James Gabriel
img: /assets/images/blog/ai-fantasy-premier-league-experiment.png
date: 2026-08-08T12:00:00.000Z
time: 11 min
tags:
  - ai
  - series
  - fun
---

There is a specific kind of bad decision that only happens on a Sunday night. Your captain has blanked, a player you sold last week has just scored twice, and you are on the app at eleven o'clock taking a four point hit to fix a problem that will not exist by Wednesday.

I have made that transfer more times than I would like to put in writing.

So for the 2026/27 season I am not making it at all. An AI picks my Fantasy Premier League team every gameweek, from historical and statistical data, and I publish the reasoning behind every single decision. Thirty-eight gameweeks, no quiet edits, no retroactive genius.

There is a free league if you fancy beating it. The code is **bsg8nz**, and the first deadline is Friday 21 August 2026 at 18:30 BST.

## What the experiment actually is

Every week the model picks a squad, a starting eleven and a captain, and writes up why it did that. The write-up goes live before the deadline, never after the results are in. Chip calls get made in advance too.

The league is "Algorithm By Coffee & Fun LLC", a free invitational classic league. No entry fee, no prizes, nothing to buy.

That last part is deliberate rather than lazy. I did look at running a paid league through Stripe, and dropped it almost immediately, because charging people to enter a competition walks straight into gambling and prize-competition law. I would rather write about football than read legislation. Bragging rights only.

The season runs to May. I am committing to publishing every week of it, including the weeks I would rather not.

## Why bother

The honest answer is that I am a retired engineer with time on my hands and a long-standing weakness for building data pipelines nobody asked for. This is a better use of a Wednesday than most.

The slightly less flippant answer is that Sunday night transfer.

Human FPL seasons are rarely ruined by bad analysis. Most managers know roughly who the good players are. Seasons get ruined by tilt: the rage transfer, the panic captain, the wildcard played in September because three red arrows in a row felt like a crisis. The information was fine. The state of mind was not.

A model does not have a state of mind. It cannot be annoyed at a striker. It will not sell someone out of spite.

That is a genuine structural advantage and I want to find out how far it actually goes.

## The philosophy: steady, but with permission to be brave

This is the part I think is arguable, which makes it the part worth reading.

Most data-driven FPL models are relentlessly sensible. They buy the best expected points per million, captain the safest premium, and hold their chips until the maths is overwhelming. And they finish fine. Respectable. A season of small green arrows and a final rank nobody remembers.

The trouble is that FPL does not reward being correct. It rewards being correct when everyone else was wrong. You do not climb two hundred thousand places by owning the same eleven players as everybody around you, however good those players are. You climb by owning someone they do not own, or captaining someone they did not captain.

Sensible models are structurally incapable of that. Optimising for the highest floor means converging on the template, and the template is by definition where everybody already is.

So the model gets written permission to be brave:

- **Differential captains** when the numbers justify the upside, not only when they justify the floor. A captain owned by eight percent of managers who returns is worth more than a captain owned by sixty percent who does the same.
- **Chips timed for double gameweeks**, planned several weeks ahead rather than hoarded out of nerves until the fixture list runs out and they get burned on whatever is left.
- **A high floor as the base case**, because bravery only works if there is something solid to be brave from. Taking risks from a losing position is not courage, it is desperation with better branding.

Here is the falsifiable bit, and you are welcome to hold me to it in May: a model with permission to take asymmetric risks should outperform a purely optimal one over a full season. If it does not, that is a result too, and it gets written up exactly the same way.

## What actually feeds it

Every source is credited here and in the site footer. None of it is proprietary, and none of it is scraped from anywhere it should not be.

**Core FPL data.** Scoring, minutes, cards, bonus points, prices and ownership from the [official FPL API](https://fantasy.premierleague.com/api/bootstrap-static/), plus [Vaastav's historical dataset](https://github.com/vaastav/Fantasy-Premier-League) for the seasons before this one. The FPL API turns out to carry far more than most people realise: 105 fields a player, including Opta expected goals and expected assists, and an official injury flag with a return date attached. A lot of what I assumed I would have to go elsewhere for was sitting in the first call.

**Underlying performance elsewhere.** Player-level expected goals for the big five European leagues from [Understat](https://understat.com), which is how a summer signing who has never played an FPL gameweek gets judged on something better than a hunch.

**Results history.** Home and away splits, head-to-head records, historical bookmaker odds and, usefully, the referee for every match, from [Football-Data.co.uk](https://www.football-data.co.uk).

**Team strength.** Elo ratings from [ClubElo](http://clubelo.com).

**Weather.** [Open-Meteo](https://open-meteo.com), called per ground at prediction time.

**Fixtures.** The [official Premier League calendar](https://pl.ecal.com), which auto-updates when games get moved for television, which they will, repeatedly, usually at the least convenient moment.

Five sources I named in an earlier draft are not in this list. Transfermarkt bars automated extraction in its terms, and FBref restricts scraping, so both are out on principle rather than convenience. Fantasy Football Scout, Fantasy Football Hub and FootyStats are subscriptions, and I would rather this ran on things anyone reading can check for free. Their jobs are covered above, with one exception, which is the next section.

On top of the raw data there are a handful of signals that carry more weight than newcomers tend to expect:

| Signal | Why it is weighted |
|---|---|
| Team strength (Elo, expected goal difference) | Top priority. The gap between two sides drives goals and clean sheets more reliably than any individual's recent form |
| Fixture difficulty and congestion | Three games in a week means rotation, and rotation means a benched premium and a wasted captaincy |
| Referee card tendencies | Some referees book far more players than others, and cards are points coming off |
| Weather | Suppresses scoring, quietly and consistently, and almost nobody prices it in |
| Big five European leagues | New signings do not have to be judged blind, though see the honest bit below about promoted clubs |

That last row is where naive models fall over, so it gets a caveat. La Liga, Bundesliga, Serie A and Ligue 1 numbers are not Premier League numbers, and treating them as though they are produces confident nonsense every August. Per-league conversion factors get applied to everything imported. A forty goal Ligue 1 striker is not a forty goal Premier League striker, and a model that does not know that will spend the opening month buying the wrong forwards and wondering why.

### The two things it genuinely cannot see

I would rather write these down now than be asked about them in October.

**It has no predicted lineups.** Fantasy Football Scout and Fantasy Football Hub sell human judgement: somebody watching Friday press conferences and reading between the lines. There is no free equivalent, so rotation risk is derived instead, from starts against appearances and the official availability flag. That catches the player who has been rotated for a month. It will never catch the manager hinting on a Friday that someone is being rested.

**It is weaker on promoted clubs.** Understat covers the big five and not the Championship, and the free Championship data has goals and shots but no shot quality. So Coventry, Hull and Ipswich players get judged on shot volume while everyone else gets judged on expected goals. I checked the size of this before writing it down: 73 of the 573 players in the game have no FPL history at all, Understat covers 23 of them including every one priced six million or above, and the remaining fifty are mostly promoted squads and academy graduates. Those fifty are the blind spot, and I would rather say so than pretend the coverage is even.

Beyond that, the usual: no insider information, no eye test, no sense of whether a player looked sharp in the warm-up. It sees numbers and nothing else. That is a limitation and occasionally it will be an expensive one.

## What gets published every week

The transparency is the actual product here. Plenty of people run AI FPL experiments. Very few show their working, and almost nobody shows it before kickoff.

Every week, without exception:

- **The squad and the starting eleven**, on a [live page](/fpl/) showing the formation, the captain and the reasoning behind both.
- **A written rationale for every move.** Who came in, who went out, what the model saw. Not a summary, the actual argument.
- **Captain and chip calls in advance.** Explained before the deadline, which is the only version that means anything. A decision explained afterwards is a story, not a reason.
- **The disasters.** Written up identically to the good weeks. No quiet deletions, no retroactive edits, no pretending a minus eight was part of the plan.

That last one is very easy to promise in August. I am aware of that, and so, presumably, are you.

## The prior art, and how these usually go

I am not first, and pretending otherwise would be a strange way to start a project about transparency.

[AI FPL](https://ai-fpl.com) has been running this idea publicly for a while. [AIrsenal](https://github.com/alan-turing-institute/AIrsenal), out of the Alan Turing Institute, is an open-source FPL optimiser and a genuinely serious piece of engineering.

The results so far are mixed, and that needs saying plainly. One well-documented experiment had the AI finish somewhere around 470,000th while the human running it had a top 0.1% season. That is not a narrow defeat or a rounding error. That is the machine being comprehensively outplayed by the person who built it, over a full season, in public.

I find that more encouraging than discouraging, because it is a specific failure rather than a vague one. Steady models finish steadily. The distance between 470,000th and the top 0.1% is not superior analysis, it is variance, and variance is something you can choose to take on deliberately instead of avoiding by default.

That is the entire bet. It may well be wrong.

## How it runs

Fully automated, which was honestly half the appeal.

Weekly data lands in a shared Google Drive folder as numbered files: week0, week1, week2 and onward. A scheduled run every Wednesday reads the newest file, generates the squad, the captain and the written rationale, and saves the lot locally. A second run on Thursday commits and pushes to GitHub, where the existing CI picks it up, builds the site and deploys it.

The day in between is deliberate. It is a buffer so I can read what the model wrote before everyone else does. I am not overruling its picks, because a project about an AI picking the team stops being that the moment I start quietly fixing its homework. But if it generates something incoherent, or a rationale that contradicts the squad it just chose, I would rather catch that than ship it.

If you have read [how we score game accessibility](/blog/how-we-score-game-accessibility/), the shape will look familiar. Publish the method first, then let people argue with the results. Same instinct, pointed at football instead of settings menus. It is roughly how the rest of [what we build](/apps/) works too.

## This might go badly

It might. Genuinely, and in several distinct ways.

It could finish mid-pack and prove nothing at all. It could get the bravery calibration wrong in the first direction it tries and spend from October onward at the bottom of its own league, which would at least be funny. It could have a spectacular September and then slowly reveal that everything it learned was specifically about September.

A season is thirty-eight data points. That is not remotely enough to prove a method works, and I am not going to claim otherwise in May regardless of where it finishes. What thirty-eight weeks is enough for is showing a method honestly, in order, with the reasoning attached, which is the thing I can actually offer.

If it wins, that is one interesting season. If it loses, the write-ups explaining why are probably more useful than the ones explaining a win would have been.

## Come and beat it

The league is open now, and it is free.

1. Log in to Fantasy Premier League.
2. Go to Leagues, then Join a league.
3. Enter the code **bsg8nz**.

There is nothing to pay and nothing to win except the ability to mention it for a year, which in FPL terms has always been the real currency anyway.

---

The thing I keep coming back to is that the model's advantage is not intelligence. On pure football knowledge it is almost certainly worse than the average person reading this. It does not know that a manager always rotates after Europe, or that a particular full-back has looked half-fit for a month.

Its advantage is that it will never be tired, never be irritated, and never make a decision at eleven o'clock on a Sunday night purely because it cannot stand looking at a player any longer.

Whether that is worth more than knowing things is the entire question, and I genuinely do not know the answer. First picks go up before the deadline on 21 August.

*Data sources are credited in full in the site footer and above. This is an experiment run for fun by one person, it is not betting advice, and the league is free to enter with no prizes.*
