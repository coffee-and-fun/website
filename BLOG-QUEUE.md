# Blog queue: Coffee & Fun

The writing schedule works through this list top-to-bottom, one post per week.
Mark a post `[x]` when drafted. Add, reorder, or cut freely. This file is the
single source of truth for what gets written next.

## Voice rules (non-negotiable, learned the hard way)

The July 2026 batch failed because it was well-written filler. Every post here must pass these tests:

- **Receipts over claims.** First-person evidence: screenshots, logs, tables, costs, commit hashes. If the post could run on any dev blog, it isn't done.
- **No credential-flexing.** Never "after 15 years of publishing." The artifacts prove authority.
- **A falsifiable spine.** Say something a reader could argue with.
- **Endings land a thought**, never a product funnel.
- **One post at a time.** Never batch-publish; never cross-link a same-week mesh.
- **Never fabricate.** No invented stats, quotes, test results, or URLs. Mark evidence you cannot gather with `<!-- TODO: Robert verify/capture -->`. An honest hole beats a made-up receipt.
- **No em dashes or en dashes**, anywhere, ever. Commas, periods, colons, parentheses.
- Plain, warm, rhythmically short sentences. Dry jokes in passing, not performed.

## The queue

1. [ ] **Making an Editor Work in Arabic and Hebrew**: Markdown's syntax characters go feral in RTL text. War story from the 70-language release: broken screenshots, a working dev's tour of the bidi algorithm, caret/preview fixes, what's still imperfect (admitted), paid native-speaker review vs pseudo-locales. SEO: "markdown rtl support", "bidirectional text editor".
2. [ ] **Do Dyslexia Fonts Work? Lexend vs OpenDyslexic vs Dyslexie**: Head-to-head by the dyslexic dev who redesigned OpenDyslexic. What peer-reviewed research says per font, a real reading test, honest verdict: spacing/line-length beat any typeface, but choice still matters. SEO: "best font for dyslexia", "does OpenDyslexic work".
3. [ ] **Why Accessibility Widgets/Overlays Cause More Harm Than Good**: Ten overlay-equipped sites tested with VoiceOver, recordings as receipts. Compliance-theater economics, the lawsuits overlays didn't prevent, what to do instead. SEO: "accessibility overlay problems", "accessiBe review".
4. [ ] **How to Translate Your Extension into 70 Languages, Using AI**: The honest modern workflow: why MT-dumping fails users, AI-assisted translation with native conventions + hand review, locale mapping across four stores, what broke (string expansion, plurals, Safari's 112-char clamp), cost/time table. SEO: "how to localize a browser extension", "AI app localization".
5. [ ] **The European Accessibility Act: What a One-Person Studio Actually Changed**: Every EAA guide is written for enterprises. The solo-dev version: what applies, what changed, what it cost, what's still unclear. SEO: "European Accessibility Act small business/app developer".
6. [ ] **KaTeX and Mermaid Under a CSP That Hates You**: The exact console errors, what extension CSP forbids, rejected workarounds, what shipped per platform, bundle-size honesty. SEO: "mermaid chrome extension CSP error", "katex content security policy".
7. [ ] **10 Irish Council Websites Audited for Accessibility, Using AI**: Ten random councils, one page each, AI-assisted audit verified by hand with a screen reader, doubling as a test of whether AI auditing works. Named results table. SEO/links: local press + EAA coverage; repeatable annually.
8. [ ] **Your Terms of Service Are Written at Grade-19 Reading Level, So Here's a Version Anyone Can Read**: Readability scores on big ToS docs, then the artifact: a plain-language version of our own terms + a copyable template. SEO: "terms of service readability", "plain language terms template".
9. [ ] **What Is Dead Media? Every Way Your Stuff Dies**: Taxonomy explainer: format death (Flash, HD-DVD), server death (DRM checks, delisted "purchases"), platform death (Vine), version death (silent cut-swaps). Enshittification-lineage essay. SEO: "dead media", "do you own digital movies" cluster.
10. [ ] **How to Catch an App Phoning Home (Practice on Ours)**: DevTools + Proxyman walkthrough with our own app as the guinea pig; the punchline is the boring empty request log. SEO: "how to see what data an app sends", "check if app is tracking you".
11. [ ] **How to Delete Your Data from OpenAI, Who to Email, and What Can't Be Removed**: Settings path, privacy portal, DSAR email, GDPR vs elsewhere, and the honest half nobody writes: what survives deletion (safety retention, de-identified data, litigation holds, VERIFY current policy at write time). SEO: "delete OpenAI data", "OpenAI GDPR request".

## Running series: The Accessibility Options (game accessibility reviews)

Methodology post is live at `/blog/how-we-score-game-accessibility/`. Every review
scores five categories out of five (Seeing, Hearing, Playing, Understanding, Finding
it) for 25 total, using the shape described in that post: scorecard table up top, a
full settings inventory per category with the exact values, what is missing, the menu
path, one thing nailed, one thing missed, and the three settings to change first.

Slug convention `blog/<game>-accessibility-settings/`. Robert plays the games and
supplies the menu screenshots, so **the writer must not draft one of these unattended**:
a review invented from memory would be fabricated receipts about a real product. Ask
which game, or skip to the next queue item.

A running scoreboard page goes up once there are three or four reviews to rank.

## Running series: The Algorithm (AI picks the FPL team, 2026/27)

Launch post is live at `/blog/ai-fantasy-premier-league-experiment/`. An AI picks the
Fantasy Premier League squad, starting eleven and captain every gameweek of the 2026/27
season, and the reasoning is published before each deadline. Free league "Algorithm By
Coffee & Fun LLC", join code `bsg8nz`. Season starts Saturday 22 August 2026.

The weekly posts are produced by the separate FPL automation (Wednesday generates,
Thursday commits and CI deploys), **not** by this blog writer. So the writer must not
draft one: a gameweek write-up invented without the actual squad, captain and points
would be fabricated receipts about a real competition that real people have entered.

Two hard rules for anything in this series:

- Never state a rank, score or result that did not come from the data files. If a
  number is not in the week's file, leave it out or mark it `<!-- TODO: Robert -->`.
- Bad weeks get written up exactly like good ones. The transparency promise in the
  launch post is the whole premise, and quietly skipping a disaster breaks it.

A season review goes up in May, win or lose.

## Icebox (not scheduled)

Ideas inherited from the old `blog-ideas.md` queue. The writer never touches this section:
promote an item into "The queue" above if you want it written.

- [ ] The history of Flock cameras, made by Flock Safety (officially Flock Group Inc.)
- [ ] The case for version-by-version extension review
- [ ] A field guide to OG images that do not break in 2026

## Process checklist per post (see memory + help docs conventions)

- Markdown file in `src/pages/blog/` with full frontmatter (`layout: templates/post.liquid`, dates at T12:00Z)
- Entry added to `src/_data/blog.json` (posts are invisible without it)
- 1200x630 social card generated to `/assets/images/blog/<slug>.png` (headless Chrome, house style)
- `npx eleventy` builds clean; commit locally; **never push**: Robert reviews and pushes
