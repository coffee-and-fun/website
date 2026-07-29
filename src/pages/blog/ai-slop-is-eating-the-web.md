---
new: true
submit: false
footer: true
header: true
layout: templates/post.liquid
title: AI Slop Is Eating the Web, and How to Spot Machine-Made Junk
description:
  Half of all new articles online are now AI-generated. Here is how to spot AI slop in seconds,
  why it is flooding stores and search, and what it costs the rest of us.
keywords:
  ai slop, ai generated content, how to spot ai writing, machine made content, low quality ai
  articles, ai content detection, scaled content abuse, content quality standards, ai slop apps,
  Coffee and Fun
url: blog/ai-slop-is-eating-the-web/
isBlog: true
blog_cat: Usecase
youtubeId:
cardTitle: AI Slop Is Eating the Web, and How to Spot Machine-Made Junk
blog_snip:
  Roughly half of every new article published online is machine-made. Here is how to spot AI slop
  in about ten seconds, and why the junk costs everyone who still makes real things.
name: Robert James Gabriel
img: /assets/images/blog/ai-slop-is-eating-the-web.png
date: 2026-07-29T00:00:00.000Z
time: 6 min
tags:
  - social
  - guide
---

Merriam-Webster named "slop" its [word of the year for 2025](https://www.cbsnews.com/news/slop-merriam-webster-2025-word-of-the-year/), defined as digital content of low quality produced in quantity by artificial intelligence. When a dictionary has to add a word for the state of the internet, the internet has a problem.

AI slop is not a vibe. It is measurable. Graphite sampled tens of thousands of random URLs from Common Crawl and found that [AI-generated articles overtook human-written ones around November 2024](https://graphite.io/five-percent/more-articles-are-now-created-by-ai-than-humans), and have hovered near half of everything published since. Half. Of every new article on the web.

I run a small studio that ships browser extensions, apps, and web tools. We compete for attention against an infinite content machine that never sleeps, never fact-checks, and costs a fraction of a cent per page. So yes, I have skin in this game. But you should care too, because you are the one reading the results.

---

## What AI slop actually is (and is not)

Let me be precise, because "AI wrote this" has become a lazy insult.

Slop is not "content made with AI." I use AI tools every day. I use them to draft, to check, to argue with. That is a power tool, and power tools are fine.

Slop is content generated **in volume, without a human who cares, for an audience that was never really considered.** It is the twelfth near-identical "10 Best Budget Laptops 2026" page written by something that has never touched a laptop. It is the recipe blog with a plausible method and an impossible bake time. It is the wallpaper app with 400 clones. The tell is not the tool. The tell is that nobody checked.

That distinction matters, because the fix is not "ban AI." The fix is holding the output to the standard we always claimed to have.

---

## How to spot AI slop in about ten seconds

You do not need a detector tool. You need a handful of habits.

### 1. Look for the leftovers

The dumbest slop announces itself. Wikipedia's editors got so tired of it that they wrote a speedy-deletion rule specifically for machine-generated pages. Their [criterion G15](https://en.wikipedia.org/wiki/Wikipedia:Criteria_for_speedy_deletion) lists the exact tells admins can delete on sight: chat leftovers like "Here is your Wikipedia article on...", self-inserts like "as a large language model", knowledge-cutoff disclaimers, and unfilled placeholders like "Smith was born on [Birth Date]".

If a page ships with the wrapper still on, nobody read it before publishing. Nobody.

### 2. Check the citations, not the prose

The prose is the part AI is good at. The sources are where it falls apart. G15 also flags references that are dead on arrival, ISBNs with invalid checksums, DOIs that resolve to something unrelated, and citations with impossible timing, like a news report about an accident published before the accident happened.

Click one link. Just one. Slop almost never survives a single click.

### 3. Notice what is missing

Real writing has friction in it. A specific number. A thing that went wrong. An opinion the author might get argued with about. Slop is frictionless: perfectly balanced, endlessly hedged, structurally tidy, and about nothing. If you finish a 2,000-word article and cannot name one concrete claim you could disagree with, you did not read an article. You read a shape.

### 4. Watch for the fleet

One suspicious page is a page. Twenty pages on the same site, all published the same week, all covering adjacent keywords with the same headings, is a content farm. Same in the stores: when a listing has nine siblings from the same publisher with swapped icons, you are looking at output, not products.

---

## The stores have the same disease

I have written before about [why extension stores need higher standards](/blog/browser-extension-stores-need-higher-standards/) and later about [the app stores sliding the same way](/blog/the-app-store-needs-higher-standards-too/). AI slop is the accelerant on both fires.

When a submission costs a developer twenty minutes of prompting instead of six months of work, the economics of a storefront invert. Spam stops being a nuisance and becomes the default. Google Play deleting roughly half its catalogue was not an overreaction, it was a store discovering it had been graded on "does it launch" for a decade. And the same logic applies to any listing you read: a description written by something that never used the product will always sound better than one written by someone who did, because honesty includes limitations.

This is [enshittification](/blog/the-enshittification-of-technology/) with a turbocharger. The platform earns trust with real curation, then quietly lets volume win, then wonders why nobody believes the badges.

---

## The good news, and it is genuinely good

Here is the number that made me feel better. The same researchers checked what actually surfaces when you search, not just what gets published, and found that [86% of articles ranking in Google are human-written](https://graphite.io/five-percent/ai-content-in-search-and-llms), with only 14% AI-generated. ChatGPT and Perplexity cite human work at roughly 82%.

So the slop is being published at massive scale and mostly failing to land. Google's [spam policies](https://developers.google.com/search/docs/essentials/spam-policies) now name it directly under scaled content abuse: using generative tools to make many pages without adding value for users. Note the wording. Not "using AI." Making pages without adding value. That is the right line, and it is roughly the line I would draw myself.

The web is drowning in slop the way the ocean is full of plastic. Awful, real, and still not the thing most people actually swim in.

---

## What this asks of the rest of us

If you make things, the bar just moved. Generic competence is now free and infinite, so it is worth nothing. What is not free: a real number from your own logs, a screenshot of a thing that broke, an opinion with a name attached, a page that loads fast and says what it does. When we ship a tool, we say what it cannot do, because that is the part a machine will never volunteer.

If you read things, spend the ten seconds. Click one citation. Ask whether the page contains a single claim a human would defend. Apply the same scrutiny to software that you would to an article, and run the [60-second extension check](/blog/how-to-vet-a-browser-extension/) before you install anything.

Slop wins by volume, and volume only works when nobody looks closely. Looking closely is still free.

You can see what we build when a person is actually in the loop across [our apps and tools](/apps/). Every one of them exists because a human wanted it to, which turns out to be the rarest feature on the internet right now.
