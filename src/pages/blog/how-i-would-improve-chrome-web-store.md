---
new: false
submit: false
footer: true
header: true
layout: templates/post.liquid
title: How I would Improve the Chrome Web Store
description:
  Join me as I share real, hands-on tips for improving the Chrome Web Store. Everything from more
  meaningful badges and better review tools to showing genuine user engagement.
keywords:
  Chrome Web Store, Extension Development, Google Chrome Extensions, Trusted Badge, Best Standards,
  User Engagement, Security Breaches, Two-Factor Authentication (2FA), Developer Fees, Smarter
  Reviews, Version-Specific Feedback, Temporary Badge Removal, Monthly Active Users (MAU),
  Collection & Ranking Badges, Spam Prevention, Accessibility Tools, Material Design M3, Extension
  Marketplace, User Transparency, Developer Advocates
url: blog/how-i-would-improve-chrome-web-store/
isBlog: true
blog_cat: Usecase
youtubeId: HqSjk8fC1tA
cardTitle: How I would Improve the Chrome Web Store
blog_snip:
  Join me as I share real, hands-on tips for improving the Chrome Web Store. Everything from more
  meaningful badges and better review tools to showing genuine user engagement.
name: Robert James Gabriel
img: /assets/images/blog/how-i-would-improve.png
date: 2024-11-06T00:00:00.000Z
time: 5 min
tags:
  - social
  - guide
---

Hey everyone!

I’ve been publishing Chrome extensions for over a decade, and during that time, I’ve watched the Web
Store transform into something miles better than it was, when I first started. Google’s developer
advocates have been hugely supportive, and the Store has definitely leveled up in terms of security,
design, and ease of use.

That said, I’ve got a few ideas for how it could get even better. Below, I’ll share my top
suggestions, along with a mockup screenshot to give you a sense of what I’m imagining.

---

## Current Landscape

### Developer Advocates

Hats off to them! They’re always ready to listen, provide tips, and share insights, making the
entire developer community feel welcome. Huge shout out to Oliver!

### Security Checks

The team has gotten much faster at spotting and removing malicious extensions, which is a big win
for users and devs alike.

### User-Friendly Dashboard

Managing extensions is a lot easier now than it was a few years back, which saves loads of time for
those of us who maintain multiple projects.

Alright, let’s dive into the improvements!

---

## After & Before

Drag the middle circle to see the difference.

{% assign showDifference = true %}
{% assign beforeImage = '/assets/images/blog/improve/before.png' %}
{% assign afterImage = '/assets/images/blog/improve/after.png' %}

{% include difference.liquid %}

---

## 1. The “Trusted” Badge

Right now, you’ll often see just a publisher name and maybe a link to their website. Let’s convert
that into a clear **Trusted** badge, which would signify:

- Verified developer domain.
- Extra security measures, like two-factor authentication (2FA).
- A history free from major policy violations or malicious flags.

Spotting a **Trusted** badge at a glance would help users feel more confident about installing an
extension.

---

## 2. The “Best Standards” Badge

Currently, there’s a **Featured** label that often causes confusion.

Why? **Featured** sounds like the extension is simply promoted. **Best Standards** makes it clear
that the extension meets Google’s code and design benchmarks.

That’s super helpful for anyone who wants only top-tier, polished extensions.

It tells them: **Hey, this extension follows the latest design guidelines (like Material Design M3)
and adheres to best coding practices.**

---

### 3. Collection & Ranking Badges

### Collection Badges

If your extension is part of **Editor’s Picks**, **Top Accessibility Tools** or something similar,
let’s showcase that.

Seeing a badge like **Editor’s Pick** or **#34 in Accessibility** adds immediate credibility.

### Ranking Display

Hitting a certain rank, say, top 200, in a category should also be worth celebrating. A label like
**#196 in Productivity** can help users see which extensions are genuinely popular or useful in
specific niches.

---

## 4. Temporary Badge Removal

Even the most careful devs can fall victim to phishing or have malicious code sneak in.

In cases like that, I think the store should temporarily suspend badges (like **Trusted** or **Best
Standards**) for 30 days or until the extension is confirmed secure again. This encourages rapid
fixes from devs and reassures users that the badge system actually means something.

---

## 5. Smarter Reviews and Ratings

### Version-Specific Reviews

It’s frustrating to see a negative review complaining about a bug that was fixed months ago. Tying
reviews to specific versions would give potential users a clearer picture of how an extension has
evolved over time.

### Delayed Posting for New Accounts

Requiring new Google accounts to be at least 14 days old and maybe have used the extension for at
least an hour before they can leave a review would help minimize fake or impulsive reviews. It’s a
simple tweak that could significantly improve the overall quality of feedback.

### Reset Option for Major Updates

Sometimes you put out a massive overhaul that fixes everything folks were unhappy about. In that
case, having an option to start fresh on the overall rating would be great, while still keeping
older reviews in an archive for transparency’s sake.

---

## 6. Annual Developer Fee

An annual fee of around $50/$99 could weed out some of the spammy or low effort extensions that
clutter the store. It might also help Google offset the costs of more thorough reviews. Serious
developers would likely see it as a reasonable investment, while those churning out questionable
extensions might think twice.

---

## 7. Real Engagement Stats

Right now, the store displays a running count of **users**, which doesn’t always reflect actual
engagement. Switching to download counts, or even hiding those numbers, might be more accurate and
less confusing. It’s a small detail, but one that could make a big difference in how users perceive
an extension’s popularity.

---

## 8. A 2FA or Security Badge

Developers who enable two-factor authentication on their accounts demonstrate a real commitment to
security. Why not reward them with a **Security** badge? It’d be a quick way to show users that
these devs go the extra mile to protect their extensions from hacks or malicious updates.

---

## Wrapping It Up

I’m a massive fan of the Chrome Web Store and believe these changes, a clearer badge system,
improved reviews, transparent engagement stats, and more.

It would help everyone get the most out of it. By making these updates, we can ensure the Store
remains safe, friendly, and fair for both developers and the millions of people who rely on
extensions every day.

If you’re new here, I’m Robert James Gabriel, a longtime developer committed to making the web more
accessible, productive, and secure. If you’d like to chat more about these ideas or have suggestions
of your own, please don’t hesitate to reach out. Let’s keep building a better Web Store together!
