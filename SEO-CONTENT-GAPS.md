# Content gaps: queries you rank for with no page behind them

Source: `coffeeandfun.com-Performance-on-Search-2026-08-09.zip` (GSC, 9 Apr 2025 to 8 Aug 2026, 997 queries) cross-referenced against every page in `src/_data/apps.json`, `blog.json`, `help.json` and `src/pages/`.

Method: bucket each query to the page that could serve it, then flag clusters where the answer only exists as a paragraph inside a bigger post, or does not exist at all. "Rank" here means the site is already in the index for the term, usually page 1, so these are demand you have already earned and are not capturing.

---

## Tier 1: real gaps, already ranking top 10

### 1. PSA whitening
**40 queries · 8,140 impressions · 118 clicks · avg position 6.3**

The PSA guide has sections for Centering, Corners, Edges and Surface. It has **no whitening section at all**, yet whitening is the single biggest sub-topic Google sends you.

Top terms: `psa 10 with whitening` (998i, pos 8.0), `pokemon card whitening` (544i), `psa 10 whitening` (540i), `can you get a psa 10 with whitening` (537i), `can a psa 10 have whitening` (534i), `how much whitening is allowed for psa 10` (427i, pos 4.9), `psa whitening standards` (291i), `psa 9 whitening` (231i).

There is also a distinct repair intent sitting at **position 2.4** with no page: `how to fix whitening on pokemon cards` (153i), `can you fix whitening on pokemon cards` (103i), `how to remove whitening on pokemon cards`, `how to fix white edges on pokemon cards`. 7 queries, 348 impressions, ranking 1.8 to 2.7 on the strength of one passing mention.

**Suggested pages**
- `/blog/psa-whitening-what-it-costs-you/` — what whitening is, front vs back vs corner vs edge, tolerance by grade (10/9/8/7), photo examples.
- `/blog/can-you-fix-whitening-on-pokemon-cards/` — the honest answer (mostly no, and altering is a death sentence at PSA), what people try, what happens.

### 2. PSA per-grade visual examples
**43 queries · 14,512 impressions · 84 clicks · avg position 8.7**

You have a grading scale reference table. People are searching for **pictures of each grade**, one grade at a time, and there is no page per grade.

`psa 7 pokemon card example` (1,160i), `psa 7 example` (1,111i), `psa 5 example` (693i), `psa 8 pokemon card example` (683i), `psa 1-10 examples` (639i), `psa 6 example` (570i), `psa 5 pokemon card example` (569i), `grade 7 pokemon card example` (549i), `psa 8 example` (522i), `psa 6 pokemon card example` (454i), `psa 9 pokemon card example` (436i), `what does a psa 8 look like` (433i), `what does a psa 6 look like` (327i, pos 3.6), `psa 10 example` (393i).

**Suggested pages**
- One hub: `/blog/psa-grade-examples-1-to-10/` with a card image per grade and what pushed it down.
- Then split the four that carry their own volume: PSA 10, 9, 8, 7. That is roughly 6,000 impressions of query volume aimed at a page-per-grade shape.

### 3. PSA grade requirements and criteria
**10 queries · 3,033 impressions · avg position 6.6**

`psa 10 requirements` (1,109i), `psa 10 criteria` (687i), `psa 10 guidelines` (363i), `psa 10 grading standards` (289i), `psa 10 requirements pokemon` (297i). Answer-shaped intent: a spec sheet, not a narrative. Currently answered by a table halfway down a 12k-character essay.

**Suggested page**: `/blog/psa-10-requirements/` — the checklist, each of the five criteria with its tolerance, and what disqualifies a 10 outright.

### 4. PSA centering tolerances
**14 queries · 2,236 impressions · avg position 10.5**

Your Centering section exists but does not carry the numbers people search for. `psa 10 centering tolerance` (443i), `psa back centering standards` (231i), `psa 10 centering requirements` (213i), `psa centering standards` (159i), `55/45 centering example`, `what does 55/45 centering look like`, `psa centering percentage`.

Note the position: 10.5 average, worse than every other PSA cluster. This is the one where a dedicated page most obviously moves you onto page 1.

**Suggested page**: `/blog/psa-centering-tolerances-explained/` — front vs back tolerance by grade, what 55/45 and 60/40 look like side by side, how to measure it yourself.

### 5. Minecraft: grid, block count, Bedrock
**22 queries · 2,079 impressions · 139 clicks · avg position 7.8**

The generator ranks well but these are feature-qualified searches with no supporting content: `minecraft pixel art grid` (678i), `minecraft pixel art generator with block count` (458i), `minecraft pixel art generator bedrock` (321i, and note `minecraft pixel art generator with grid` converts at **22% CTR**).

If the tool already does grids, block counts and Bedrock block sets, none of that is on a page Google can match. If it does not, the demand says build it.

**Suggested**: a `/minecraft-pixel-art/` content section or companion guide covering the block list, Bedrock vs Java block differences, and how to read the grid for building. Possibly a separate landing page for Bedrock.

---

## Tier 2: intent mismatch, page exists but answers a different question

### 6. Video metadata: viewer vs remover
**View intent: 14 queries · 2,828 impressions · avg position 19.9**

`/meta-videos/` is framed as "Remove Video EXIF Data". The remove intent (18q, 3,159i, pos 16.2) is served. The **view** intent is nearly the same size and is not: `video metadata viewer` (1,084i, pos 10.1), `video exif viewer` (349i), `video metadata analysis` (256i), `video metadata` (516i, pos 54), `exif data viewer video` (117i).

Also worth noting `metadata viewer` on its own: 1,581 impressions at position 21.7.

**Suggested**: reframe or split, so there is a page titled around viewing/inspecting video metadata, not only stripping it.

### 7. Hidden text in images: the reveal half
**21 queries · 1,409 impressions · avg position 29.9**

`/secret-message-image-encoder/` hides text. Half the demand is people trying to **find** it, and those rank at 20 to 54: `how to hide text in an image` (354i, pos 42.7), `how to see hidden text in image` (317i, pos 53.6), `reveal hidden text in photo online free`, `find hidden message in image`, `find hidden text in image`, `hidden text in image generator` (19i, pos 8.7).

The steganography explainer post exists but pulled only 51 impressions all year, so it is not the page Google is matching.

**Suggested**: a how-to page that covers both directions and points at the tool, targeting "how to hide text in an image" and "how to see hidden text in an image" as separate H2s or separate pages.

### 8. Tweet and like deletion: tool intent, no tool
**22 queries · 7,424 impressions · avg position 26.6**

The blog post ranks 19.6 and the sub-intents are clearly looking for a **tool**, not a tutorial: `delete retweets` (1,876i), `delete retweets twitter free` (926i), `unlike tweets` (469i), `delete liked tweets` (432i), `twitter like deleter` (377i), `tweet delete tool` (197i, pos 70), `auto delete old tweets` (224i, pos 64), `retweet deleter free`, `delete tweets script` (158i, pos 9.4).

`delete tweets script` at position 9.4 is the tell: the script is what ranks. Give it a page.

**Suggested**: a tool-shaped page (`/tweet-cleaner/` or similar) hosting the script with copy-paste instructions, separate from the narrative post.

### 9. Apple Passwords
**11 queries · 4,276 impressions · avg position 26.4**

`apple password app` (1,097i), `apple passwords` (848i), `apple passwords app` (754i), `passwords app` (511i), `apple passwords chrome extension` (446i, pos 13.1), `apple password manager review` (251i).

The review post exists, but everything ranks 13 to 40. `apple passwords chrome extension` is the winnable one: it is specific, it is your beat, and it is the only term in the cluster already inside the top 15.

**Suggested**: `/blog/apple-passwords-chrome-extension-guide/` — how to install and use it on Windows/Chrome, what it cannot do. Interlink to the review.

---

## Tier 3: the elephant

### 10. McDonald's survey how-to
**139 queries · 474,897 impressions · 747 clicks · avg position 6.3 · CTR 0.16%**

Almost half a million impressions, page-1 average position, and 0.16% click-through. The reverse-engineering post is what ranks, but essentially none of these people want a reverse-engineering post. They want: where the code is on the receipt, how long it is valid, what the reward is, why their code is not working.

`mcdvoice.com survey with receipt` (110,100i), `mcdvoice survey` (101,759i), `mcdvoice survey with receipt` (26,533i), `mcdvoice.com survey with receipt code` (19,663i), `www.mcdvoice.com validation code` (13,503i), `mcdonalds survey code` (11,104i), `mcdvoice survey with receipt login` (8,636i, zero clicks).

Even 1% CTR on this cluster is roughly 4,700 clicks a year against the 747 you get now.

**Caveat worth weighing**: the existing post already carries a content-update notice, and a "how to take the McDonald's survey" page is a brand-adjacent, thin-margin play that invites both competition and trademark attention. Your call whether this is a page you want. But it is unambiguously the largest gap in the data, so it should be a decision rather than an oversight.

---

## Not gaps (checked, ruled out)

- **Facebook deletion** (`how to deactivate facebook` 870i, pos 4.8 and friends): post exists and mostly ranks. Ranking problem at the tail, not a content problem.
- **mcdvoice misspellings** (~60 queries, ~90k impressions: `mcvoice`, `mcdvouce`, `mdvoice`, etc.): navigational typos, already ranking ~5.5. Nothing to build.
- **`compete rank`** (834i, pos 47): irrelevant term, ignore.
- **Grader comparisons** (`psa 9 vs psa 10` 59i, `afa grading cost` 1i): almost no demand reaching you. Skip unless targeting new terms.

---

## If you only do four things

1. PSA whitening page (+ the fix-whitening page, it ranks 2.4 already)
2. PSA grade examples hub, then split 10/9/8/7
3. PSA 10 requirements spec page
4. PSA centering tolerances page

That is roughly **28,000 impressions of existing page-1 demand** currently being absorbed by one post at 0.65% CTR, in the topic where you already hold the authority.
