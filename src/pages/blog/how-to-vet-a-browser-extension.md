---
new: true
submit: false
footer: true
header: true
layout: templates/post.liquid
title: "Browser Extension Safety: A 60-Second Check"
description: "A 60 second checklist before you install: do the permissions match the job, who published it, what recent reviews say, what it collects, and do you need it."
keywords:
  vet a browser extension, browser extension permissions, chrome extension safety, read and change
  all your data, is this extension safe, extension privacy, check chrome extension, extension
  security, Coffee and Fun
url: blog/how-to-vet-a-browser-extension/
isBlog: true
blog_cat: Guide
youtubeId:
cardTitle: How to Vet a Browser Extension Before You Trust It
blog_snip:
  That "read and change all your data" prompt is a big ask. Here's a 60-second way to decide
  whether an extension actually deserves that access before you click install.
name: Robert James Gabriel
img: /assets/images/blog/how-to-vet-a-browser-extension.png
date: 2026-07-27T00:00:00.000Z
time: 5 min
tags:
  - guide
  - security
---

A browser extension is one of the most powerful things you can install without thinking about it. It doesn't sit in a sandbox the way a normal website does. Depending on what it asks for, it can read every page you open, watch what you type, change what you see, and phone all of it home. We build extensions used by over a million people each, and I *still* read the permission box every single time before I install one.

The good news: you can vet an extension in about a minute if you know where to look. Here's the checklist we use, and why each step matters.

---

## Step 1: Read the permission box, and ask "does this match the job?"

When you install an extension, Chrome shows you what it's allowed to do. The scariest line is **"Read and change all your data on all websites you visit."** That's the plain-English translation of broad host access, and Google explains the [full list of permission warnings in its developer docs](https://developer.chrome.com/docs/extensions/reference/permissions-list) and a friendlier version in the [Chrome Web Store Help center](https://support.google.com/chrome_webstore/answer/186213).

The permission itself isn't automatically bad. The question is whether it's *proportionate to the job*:

- A password manager or a grammar checker genuinely needs to see the pages you're on. Broad access is expected.
- A "dark mode" toggle, a to-do list, or a single-site coupon finder asking to read and change data on **all** websites is a mismatch. That's the moment to stop.

If the access an extension wants is bigger than the problem it solves, that gap is where the risk lives. A flashlight app doesn't need your location, and a new-tab wallpaper doesn't need to read your banking pages.

---

## Step 2: Find out who actually made it

Scroll to the listing's publisher information. You're looking for three things: a real developer or company name, a **"Featured"** or verified/established-publisher marker, and a link to an actual website with a working privacy policy. A legitimate developer wants you to know who they are. Anonymous publishers with a Gmail address and no site are a yellow flag on a free utility and a red flag on anything touching your accounts, passwords, or crypto.

This is exactly the trust gap I keep banging on about. The browser stores make it far too easy to publish under a throwaway identity, which is a big part of [why I think every extension store needs higher standards](/blog/browser-extension-stores-need-higher-standards/). Until they fix it, *you* are the review team.

---

## Step 3: Read the reviews like a detective, not a shopper

Don't just look at the star average. Look at the *shape* of the reviews:

- **Sort by recent and by lowest.** A wall of complaints in the last month about a bug, a paywall, or "this used to be good" tells you more than a two-year-old 5-star average.
- **Watch for review whiplash.** A jump from a handful of ratings to thousands of identical glowing one-liners is what fake reviews look like.
- **Look for the words "sold" or "new owner."** Popular extensions get acquired, and some new owners quietly turn a trusted tool into an ad-injector or data harvester.

That last one isn't paranoia. In December 2024, attackers phished a developer and hijacked a legitimate, trusted extension ([Cyberhaven's, along with roughly 18 others](https://www.bleepingcomputer.com/news/security/cybersecurity-firms-chrome-extension-hijacked-to-steal-users-data/)) to steal users' cookies and sessions. The extension was reputable right up until it wasn't.

---

## Step 4: Check what data it admits to collecting

Every Chrome Web Store listing has a **"Privacy practices"** section where the developer declares what they collect and whether they sell it. Open it. It won't catch a bad actor who lies, but it catches a surprising number of "free" extensions that casually disclose they collect your browsing activity and location. If a simple tool's data disclosure reads like an ad network's, believe it. Your photos and files already [leak more about you than you think](/blog/what-your-photos-reveal-exif-data/), so don't volunteer your whole browsing history on top.

---

## Step 5: Assume it can change after you install it

The uncomfortable truth is that vetting isn't one-and-done. Extensions auto-update silently, and an update can request new permissions or ship new code. Two habits help:

- **Audit what you already have.** Open your extensions page every few months and remove anything you don't actively use. Every idle extension is standing access you're not watching.
- **Know how to bail fast.** If an update breaks trust with new permissions, injected ads, or sluggish pages, remove it. And if you're a developer dealing with a bad release, know that you can [roll a published extension back to a previous version](/blog/how-to-rollback-chrome-extension-version/).

---

## The 60-second checklist

Before you click install, run through this:

1. **Permissions:** does the access match the job, or is it asking for the whole web to do a small task?
2. **Publisher:** real name, real website, real privacy policy?
3. **Reviews:** recent complaints, fake-looking spikes, any "new owner" chatter?
4. **Privacy practices:** what does it admit to collecting, and does that make sense?
5. **Necessity:** do you actually need this, or is it a bookmark with extra risk?

If it clears all five, install it. If it fails one and the developer is anonymous, don't.

---

We hold our own listings to this exact bar (clear permissions, a real company behind them, honest data disclosures) because we'd want to pass our own check. You can see what that looks like across [our extensions and tools](/apps/). The stores should be doing more of this vetting for you. Until they do, sixty seconds of your own scrutiny is the best security tool you've got.
