---
new: true
submit: false
layout: templates/help-doc.liquid
title: "A spoiler got through"
description: "What to do when Hide Spoilers misses something, blurs too much, or stops working on a site, and which cases it genuinely cannot cover."
keywords: hide spoilers not working, spoiler got through, spoiler blocker not blurring, hide spoilers troubleshooting, Coffee and Fun
url: help/hide-spoilers-troubleshooting/
isHelp: true
product: hide-spoilers
app: Hide Spoilers
category: Troubleshooting
img: /assets/images/social/help/hide-spoilers-troubleshooting.png
date: 2026-08-10T12:00:00.000Z
updated: 2026-08-10T12:00:00.000Z
time: 3 min read
related:
  - title: "Choosing keywords that actually catch spoilers"
    url: /help/hide-spoilers-choosing-keywords/
  - title: "How to avoid spoilers until you're ready to watch"
    url: /help/avoid-spoilers-until-youre-ready/
tags:
  - help
  - hide-spoilers
---

## A spoiler got through

Almost always a keyword problem rather than a fault. Work through these in order:

**The spoiler didn't contain your keywords.** The most common cause by a distance. Look at what you actually saw and ask which word in it you were blocking. Usually the answer is none, because the post named a character you hadn't added. Add it now.

**It was in an image with no text.** Nothing can read the inside of a thumbnail. If the surrounding title, caption or alt text doesn't carry the keyword, there's nothing to match on.

**It was in a video you were already playing.** Blurring applies to page content, not to frames of a video mid-playback.

**The page loaded content after you scrolled.** Feeds that load endlessly can occasionally show a moment of content before it's processed. Scrolling more slowly through a risky feed genuinely helps.

## Too much is blurred

You've got a keyword that's too common. The usual suspects are single words like "finale", "dies", "ending", or "trailer".

Replace the single word with a phrase: `season 3 finale` instead of `finale`. See [choosing keywords](/help/hide-spoilers-choosing-keywords/) for the pattern.

If a whole page is blurred, one of your keywords is probably in the site's own navigation or headers.

## It's not working on a site at all

**Check the site is a normal web page.** Some pages, browser settings screens, extension pages, and PDF viewers are outside what an extension can touch.

**Reload the page after adding a keyword.** New keywords apply to pages loaded after they're added.

**Check the extension is enabled** for that site in your browser's extension settings. Both Chrome and Safari let you restrict extensions per site, and it's easy to have done that by accident.

## It stopped working after a site redesign

Sites change their markup, and a big redesign at a major platform can break detection until it's updated. Compatibility is improved continuously, but there's usually a gap between a redesign shipping and support catching up.

If a site broke, it's worth telling us which one. That's the fastest route to it being fixed.

## Things it genuinely can't do

Not faults, just boundaries:

- **Phone apps.** Browser extension, so the native Twitter, YouTube and Reddit apps aren't covered.
- **Messages from friends.** No filter reaches your group chat.
- **Content with no matching words.** It matches what you give it. It doesn't understand what a spoiler is.

> **The honest summary:** this cuts accidental spoilers down a long way. It doesn't make you immune, and anyone promising that is overselling.
