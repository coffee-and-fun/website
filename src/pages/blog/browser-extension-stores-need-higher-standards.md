---
new: true
submit: false
footer: true
header: true
layout: templates/post.liquid
title: Browser Extension Stores Need Higher Standards. All of Them.
description:
  After 15 years of publishing extensions and managing products with over a million users, I'm
  watching every major browser extension store struggle with the same problems — low-effort
  submissions, security breaches, and inconsistent review standards. It's time for all of them to
  step up.
keywords:
  Browser Extensions, Chrome Web Store, Firefox Add-ons, Edge Add-ons, Safari Extensions, Apple App
  Store, Extension Standards, Vibe Coding, AI Extensions, Extension Review, Extension Quality,
  Developer Fees, Extension Marketplace, Web Store Standards, Extension Security, Browser Extension
  Development
url: blog/browser-extension-stores-need-higher-standards/
isBlog: true
blog_cat: Usecase
youtubeId:
cardTitle: Browser Extension Stores Need Higher Standards
blog_snip:
  Every major browser extension store — Chrome, Firefox, Edge, and Safari — is dealing with the same
  problems. Low-effort submissions, security breaches, and review standards that aren't keeping up.
  After 15 years of publishing, it's time to talk about raising the bar across the board.
name: Robert James Gabriel
img: /assets/images/blog/browser-extension-stores-need-higher-standards.png
date: 2026-04-04T00:00:00.000Z
time: 10 min
tags:
  - social
  - guide
---

I've been publishing browser extensions for over 15 years. Our team at Coffee & Fun runs several extensions with over 1,000,000 users each across Chrome, Firefox, Edge, and Safari. I love extensions. I love the web. I wrote a whole post last year about [how I'd improve the Chrome Web Store](/blog/how-i-would-improve-chrome-web-store/), and a lot of what I said then still stands. But the problems I described aren't unique to Chrome. They're everywhere.

Every major browser extension store has a quality problem right now, and it's accelerating fast.

---

## What's Actually Happening Across the Board

If you submit an extension update to the Chrome Web Store today, you're looking at four to five days for a review. That's become the new normal. Firefox Add-ons can be faster for listed add-ons, but their unlisted review queue has its own backlogs. Edge Add-ons often mirrors Chrome's delays since many developers publish to both simultaneously. Safari is the outlier — Apple's review is generally faster, but their ecosystem is also much smaller.

The rise of what people are calling "vibe coding", where someone uses AI to generate an entire extension in an afternoon, has created a tidal wave of new submissions across every platform. Everyone and their mother is shipping a browser extension right now. Most of them shouldn't be.

I'm not gatekeeping here. I genuinely want more developers building for the web. But there's a difference between someone learning to build something real and someone prompting an AI to spit out a browser extension they'll never maintain, wrapped in an AI-generated description with AI-generated icons and screenshots that look like they were taken on a phone from across the room.

Go browse the [trending page on the Chrome Web Store](https://chromewebstore.google.com/top-charts/trending) right now. Or check out what's new on [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/). I'll wait.

---

## The Screenshots Tell the Story

I spent ten minutes on the Chrome Web Store trending page and found enough examples to write this entire post. I'm not trying to be harsh to individual developers here, but the bar for what gets published, and even what gets *featured*, has dropped through the floor.

You'll find extensions with:

- AI-generated descriptions that all read like they came from the same prompt. You know the ones. "Elevate your browsing experience with this powerful yet lightweight extension that seamlessly integrates..."
- Icons that are clearly AI-generated with no thought to branding or clarity.
- Screenshots that are either blurry, cropped badly, or just show a random piece of UI with no context for what the extension actually does.
- Names and branding that ride on existing trademarks with no apparent enforcement.

I want to be clear: I'm not singling out any specific developer here, and no offence is intended to anyone whose extension I mention. These were found at random just by browsing the trending page for a few minutes, and that's kind of the point. You don't have to look hard.

Take [Get Token Cookie](https://chromewebstore.google.com/detail/get-token-cookie/naciaagbkifhpnoodlkhbejjldaiffcm). This is on the Chrome Web Store right now, listed under Social Networking with 400,000 users. Its interface is literally showing cookie and token extraction for Facebook. I have questions about how this passed review, but more importantly, it tells you something about the level of scrutiny extensions are getting.



Or look at [this 2FA extension](https://chromewebstore.google.com/detail/2fa/ebhcbenbgjmaebpgbldimndmfomjmphd) that uses the Google Authenticator branding, the Google blue, the Google name, right there in the listing image. It's not made by Google. It has a "Featured" badge. How did this pass? On the Apple App Store, this would be rejected in about thirty seconds for trademark issues alone.

![A 2FA extension using Google Authenticator branding — Featured badge, not made by Google](/assets/images/blog/cws-standards/2fa-google-auth.png)

Here's another one — [RandomCats](https://chromewebstore.google.com/detail/randomcats-just-random-ph/cfjpjbokkcbghmdieflchhklaldlhfkm), a Featured extension that just shows random photos of cats. 567 users, 4 ratings, and a Featured badge. The screenshots are a single popup window. This is what the Featured badge is being given to now.

![RandomCats — a Featured extension for random cat photos with 567 users](/assets/images/blog/cws-standards/random-cats.png)

And then there's [meowad](https://chromewebstore.google.com/detail/meowad/nnhfkogbcflegfcbemlllmapfggjiffj), which replaces ads on Twitter with cat meowing. 4.9 stars, 56 ratings, and its description literally says "meow :3". I'm not making this up.


Again, nothing personal against these developers. But the fact that these listings exist unchallenged tells you everything about where the standards are right now.

---

## Honestly, What Do These Add to the Store?

I want to ask a genuine question here. Look at these two listings side by side.

![RandomCats — a Featured extension with 567 users that shows random cat photos](/assets/images/blog/cws-standards/random-cats.png)

![A 2FA extension using Google Authenticator branding — Featured badge, not affiliated with Google](/assets/images/blog/cws-standards/2fa-google-auth.png)

One is RandomCats. It shows random photos of cats. 567 users, 4 ratings, a single screenshot that's just the popup window. It has a Featured badge. The other is a 2FA extension that's wrapped itself entirely in Google's Authenticator branding — the name, the blue, the logo style — despite having nothing to do with Google. It also has a Featured badge.

What do these add to the store? What value do they bring to users? What problem are they solving that isn't already solved by a thousand other things?

Let's be honest about RandomCats. Should it even be in the store? It's a popup that shows a random cat photo. That's it. There's no utility, no problem being solved, no reason for it to exist as a browser extension when you could just open a browser tab and type "cat" into Google Images. This isn't a tool. It's barely a feature. And yet it passed review, got published, and somehow earned a Featured badge — the same badge that's supposed to tell users "this meets our highest standards." A popup that fetches a random cat photo meets Google's highest standards? Come on.

And the 2FA one is worse, because it's not just low effort — it's actively misleading. A regular user sees "Google Authenticator" in the listing image with a Featured badge and thinks Google made it. They trust it with their two-factor authentication codes. That's not a quality problem. That's a trust problem. That's the kind of thing that erodes confidence in the entire platform.

I keep coming back to the same thought: if you submitted either of these to the Apple App Store, they'd be rejected before lunch. The cat app would get flagged for low functionality. The 2FA app would get rejected for trademark violation. And honestly, that's the right call in both cases. Not because there's anything wrong with building a fun cat extension, but because a curated store has to mean something. If everything gets in, the curation means nothing.

---

## The "Featured" Badge Has Lost Its Meaning

I wrote about this last year, and it's only gotten worse. The Featured badge on the Chrome Web Store is supposed to signal that an extension meets Google's standards for quality, design, and best practices. It used to mean something.

Now? Look at the examples above. Extensions with AI-generated icons, boilerplate descriptions, screenshots that wouldn't pass a college presentation review, and outright trademark infringement — all wearing the same badge as extensions built by teams who've spent years earning user trust. If Featured doesn't meaningfully separate high-quality extensions from the rest, what's the point of it?

Firefox's "Recommended" badge program actually does a better job here. Mozilla's Recommended extensions are hand-curated by staff and undergo ongoing security reviews. It's a smaller list, but it means something. When you see that badge on Firefox, there's a real human who vetted it. Chrome's Featured badge has become so broadly applied that it's lost that signal.

For developers like us who put real effort into meeting those standards, maintaining clean code, writing proper descriptions, designing real screenshots, following platform guidelines, it's frustrating. The badge that's supposed to reward that effort is being handed out like candy.

---

## The Review Backlog Is Hurting Real Developers

Here's the practical impact. When I push a bug fix for an extension used by over a million people, I now wait four or five days on Chrome for it to clear review. That's four or five days where users are sitting on a known bug because the review team is buried under a mountain of AI-generated "productivity boosters" and "tab managers" that nobody asked for.

Edge Add-ons has a similar problem. Because so many developers cross-publish from Chrome to Edge, the Edge review queue inherits the same flood of low-effort submissions. Microsoft's review infrastructure is smaller than Google's, which sometimes makes the delays even worse.

Firefox is somewhat better here thanks to their self-hosted add-on option and faster listed review turnaround, but even Mozilla has acknowledged increased pressure on their review pipeline.

This isn't a theoretical problem. This is costing real developers real time and affecting real users. The review queue is a shared resource, and it's being consumed disproportionately by submissions that probably shouldn't exist in the first place.

---

## It's Not Just About Quality. It's About Security.

The low bar for getting extensions published isn't just a quality problem. It's a security problem across every platform, and the last 18 months have made that painfully clear.

### Chrome Web Store

In December 2024, attackers ran a [phishing campaign that compromised developer accounts](https://thehackernews.com/2024/12/16-chrome-extensions-hacked-exposing.html) and injected data-stealing malware into 36 Chrome extensions, collectively used by 2.6 million people. One of the victims was [Cyberhaven](https://www.cyberhaven.com/blog/cyberhavens-chrome-extension-security-incident-and-what-were-doing-about-it), a data security company, whose compromised extension was used to exfiltrate cookies and authenticated sessions. The phishing email was disguised as official communication from "Google Chrome Web Store Developer Support," and despite the developer having MFA and Google Advanced Protection enabled, the attacker still got in through a malicious OAuth app.

On Christmas Eve 2025, the [Trust Wallet Chrome extension was hit by a supply chain attack](https://thehackernews.com/2025/12/trust-wallet-chrome-extension-hack.html) after a Chrome Web Store API key was leaked through exposed GitHub secrets. The attacker pushed a malicious update that stole users' seed phrases and [drained approximately $8.5 million in cryptocurrency](https://securityaffairs.com/186398/hacking/trust-wallet-confirms-second-shai-hulud-supply-chain-attack-8-5m-in-crypto-stolen.html) from over 2,500 wallets.

In early 2026, researchers found [287 Chrome extensions with 37.4 million total installations](https://www.thedupreereport.com/2026/02/malicious-chrome-extensions-37-million-downloads/) that were quietly exfiltrating browsing history to data brokers. That's roughly 1% of the entire global Chrome user base. Around the same time, another campaign was caught [stealing ChatGPT and DeepSeek conversations](https://www.ox.security/blog/malicious-chrome-extensions-steal-chatgpt-deepseek-conversations/) from over 900,000 users through extensions that looked like legitimate AI tools.

### Firefox Add-ons

Mozilla isn't immune either. Researchers have demonstrated that malicious add-ons can [bypass Mozilla's review process](https://thehackernews.com/2024/11/researchers-bypass-mozilla-firefox-addon.html) by submitting clean code initially and then pushing malicious updates. In 2024, Mozilla flagged and removed a wave of add-ons engaged in phishing and credential theft. Attackers have also targeted Firefox add-on developers directly with phishing campaigns, mirroring the same tactics used against Chrome developers. The open-source nature of Firefox's add-on ecosystem, while great for transparency, also means attackers can study the review process and find gaps.

### Edge Add-ons

Microsoft's Edge Add-ons store has had its own serious issues. In 2024, researchers found [over 125 malicious Edge extensions](https://www.techradar.com/pro/security/over-125-malicious-edge-extensions-found-in-microsofts-store) that had been sitting in the store undetected. The "RedDirection" campaign was particularly alarming — extensions that started clean and legitimate, built up user bases over years, and then pushed malicious updates that redirected users to phishing sites. Microsoft has been slower than Google to respond to these reports, and their review infrastructure hasn't scaled to match the growth in submissions.

### The Cross-Platform Problem

Then there's [DarkSpectre](https://thehackernews.com/2025/12/darkspectre-browser-extension-campaigns.html), a campaign attributed to a Chinese threat actor that ran across multiple browser extension stores — not just Chrome, but Firefox and Edge as well — through operations like ShadyPanda, Zoom Stealer, and GhostPoster, [affecting 8.8 million users over seven years](https://www.foxnews.com/tech/browser-extension-malware-infected-8-8m-users-darkspectre-attack). Seven years. That's how long malicious extensions can operate before getting caught. And as researchers warned: "DarkSpectre likely has more infrastructure in place right now — extensions that look completely legitimate because they are legitimate, for now. They're still in the trust-building phase, accumulating users, earning badges, waiting."

In March 2026, [an extension was transferred to a new owner and turned malicious](https://thehackernews.com/2026/03/chrome-extension-turns-malicious-after.html), injecting code and stealing user data — despite having previously received a "Featured" badge. This ownership-transfer attack vector exists on every platform that allows extension transfers, and none of them have adequate safeguards for it.

This is what happens when the barrier to entry is five dollars and there's no real identity verification. Attackers can create throwaway developer accounts, phish their way into legitimate ones, or just buy ownership of existing extensions and flip them malicious overnight. The current system, across all platforms, makes all of this too easy.

---

## What Apple Gets Right (And What Everyone Else Should Learn)

I want to be fair here. Not all extension stores are created equal, and Apple's approach to Safari extensions deserves recognition.

Apple charges $99 a year for their developer program. Every developer has a verified identity. Every extension goes through a review that checks for functionality, design quality, privacy compliance, and trademark infringement. In 2026, Apple [tightened their privacy disclosure requirements](https://developer.apple.com/news/?id=z6fu1dgy) even further, requiring developers to provide detailed data collection explanations.

Is Apple's system perfect? No. Their review process can be frustratingly opaque, and the $99 fee genuinely does create a barrier for hobbyist developers. The Safari extension ecosystem is also much smaller, which makes the problem more manageable.

But the result speaks for itself. You don't see the same flood of low-effort, AI-generated junk on the Safari extension gallery. You don't see extensions impersonating other companies' products. You don't see the same scale of security breaches. The higher bar creates a better experience for everyone — developers and users alike.

Apple proves that it's possible to run an extension store with real standards. The question is why everyone else refuses to follow that model.

---

## What I Think Should Change

I've been thinking about this for a while, and I don't think the solutions need to be complicated. They just need to exist — and they need to exist on every platform, not just one.

### Raise the Submission Standards

Before an extension gets published on any store, it should meet a basic bar. Original icons and branding, not AI-generated placeholder art. Screenshots that actually show the extension working. Descriptions written by a human who has used the product. No trademark infringement in listing images or names.

These aren't unreasonable asks. This is the bare minimum for any app store that wants to maintain user trust.

### Increase the Developer Fee

Right now, it costs $5 one-time to register as a Chrome Web Store developer. Five dollars, once, forever. Firefox Add-ons is completely free. Edge Add-ons is free. There's essentially no financial barrier to flooding these stores with junk.

I think every platform should move to an annual fee — $50 a year is reasonable. Will that exclude some people? Maybe. But it would also dramatically cut down on throwaway accounts and low-effort spam. If you're serious about building something people will use, fifty dollars a year is nothing. If you're spinning up extensions for SEO juice or to test what ChatGPT can build in an afternoon, maybe you think twice.

Apple charges $99 a year. Google Play charges $25 one-time. The Chrome Web Store's $5 lifetime fee and Firefox and Edge's free-for-all are out of step with the responsibility that comes with publishing code that runs in someone's browser.

### Require Real Developer Identity

No more anonymous developers. If you're publishing code that runs in someone's browser, that has access to their tabs, their cookies, their browsing data, you should have a verified identity attached to your account. A real name, a real organization, something that creates accountability.

Mozilla has started requiring more developer verification for Recommended add-ons, which is good. But it should be the baseline for every developer on every platform, not just an elevated tier.

This isn't about privacy for developers. This is about trust for users. When someone installs an extension, they're giving it real access to their digital life. They deserve to know there's a real person or company behind it, someone who can be held accountable.

### Actually Enforce Trademark Rules

If an extension listing uses another company's name, logo, or branding in a way that implies affiliation, reject it. Full stop. Every platform. The fact that someone can put "Google Authenticator" branding on an unrelated Chrome extension and get a Featured badge, or clone a popular Firefox add-on's name and icon with no consequences, is embarrassing for the entire ecosystem.

### Monitor Post-Publication Changes

The ownership-transfer attack and the "start clean, go malicious" pattern show that review at submission time isn't enough. Platforms need to flag and re-review extensions when ownership changes, when permissions escalate significantly, or when code changes dramatically between versions. Apple already does version-by-version review. Chrome, Firefox, and Edge need to catch up.

---

## To Google, to Mozilla, to Microsoft, to Apple, to Anyone Listening

I'm not writing this to attack any single platform. I'm writing this because I care about the browser extension ecosystem. I've spent 15 years building for it. Our extensions are used by millions of people across every major browser. I want every extension store to be a place where good work gets recognized and users can install extensions with confidence.

Right now, the majority of these platforms are heading in the wrong direction. The flood of low-effort, AI-generated extensions is degrading the experience for users and developers alike. The review backlogs are punishing the developers who are actually maintaining quality products. And the standards that are supposed to protect these platforms are either not being enforced or aren't high enough to begin with.

Apple has shown that higher standards are possible. Firefox's Recommended program shows that meaningful curation can coexist with an open ecosystem. The building blocks are there. It's time for every platform to put them together.

Higher standards. Real fees. Verified identities. Trademark enforcement. Post-publication monitoring. These aren't radical ideas. They're the bare minimum for platforms that distribute code to billions of users.

If anyone from Google, Mozilla, Microsoft, or Apple is reading this, I'd love to talk. Reach out anytime at [hello@coffeeandfun.com](mailto:hello@coffeeandfun.com).

---

*Robert James Gabriel is the founder of Coffee & Fun LLC, a software company focused on browser extensions and web tools. He has been developing and publishing extensions for over 15 years.*
