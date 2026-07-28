---
new: true
submit: false
footer: true
header: true
layout: templates/post.liquid
title: Manifest V3 in 2026, What Changed, What Broke, and How to Migrate Without Losing Users
description:
  Manifest V3 in 2026 is not a debate any more, it is a deadline. What changed, what broke, and
  how to migrate your extension without losing the users you have.
keywords:
  manifest v3 2026, manifest v2 deprecation, chrome extension migration, declarativeNetRequest,
  extension service worker, chrome web store manifest v2 removal, mv2 to mv3, firefox manifest v3,
  browser extension development, Coffee and Fun
url: blog/manifest-v3-in-2026-what-changed-what-broke/
isBlog: true
blog_cat: Guide
youtubeId:
cardTitle: Manifest V3 in 2026, What Changed, What Broke, and How to Migrate Without Losing Users
blog_snip:
  Chrome deletes the last Manifest V2 listings on August 31, 2026. Here is what broke, what quietly
  got better, and how to ship the migration without tanking your reviews.
name: Robert James Gabriel
img: /assets/images/blog/manifest-v3-in-2026-what-changed-what-broke.png
date: 2026-07-28T00:00:00.000Z
time: 7 min
tags:
  - guide
  - development
  - chrome-extension
---

Manifest V3 in 2026 is not an argument any more. It's a calendar entry. Google has confirmed that on [August 31, 2026, all remaining Manifest V2 extensions are removed from the Chrome Web Store](https://developer.chrome.com/docs/extensions/develop/migrate/mv2-deprecation-timeline), which is roughly a month from the day I'm writing this. If you're still sitting on an MV2 codebase, the debate about whether MV3 was a good idea is now somebody else's hobby. Yours is shipping.

We've migrated our whole catalogue, some of it early and painfully, some of it late and smugly. Here's the honest version: what actually changed, what actually broke, and how to get across without losing the users you spent years earning.

---

## Where Manifest V3 in 2026 actually stands

People still quote deadlines from three years ago, so let's reset. On March 31, 2025, all users on all Chrome channels had Manifest V2 extensions disabled by default. On July 24, 2025, Chrome 138 turned that into the settled state for everyone. The enterprise `ExtensionManifestV2Availability` policy, the last legitimate escape hatch, was removed in Chrome 139, and Chrome 138 was the final release that honoured it.

So MV2 has already been dead in the browser for a year. August 31, 2026 is the tombstone: the listings themselves disappear from the store. If a user already has your MV2 extension installed on an old Chrome build, it stays installed and stays broken, and they can never reinstall it. That's the part worth sitting with. Your uninstall day is not the day you stop updating, it's the first day a user reinstalls after a new laptop and finds nothing there.

---

## What genuinely broke

### Your background page became a service worker

This is the change that ate the most of our engineering time, and it's the one nobody's `manifest.json` diff prepares you for. A persistent background page kept variables in memory forever. A service worker does not. Chrome's own docs are blunt about it: the worker shuts down [after 30 seconds of inactivity, and receiving an event or calling an extension API resets that timer](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle). It also gets killed if a single request runs past five minutes.

Every `let cache = {}` at the top of your old background script is now a bug waiting for a slow afternoon. Every `setTimeout` longer than half a minute is a coin flip. The fix is unglamorous: move state into `chrome.storage.session` or `chrome.storage.local`, replace timers with `chrome.alarms`, and treat every event handler as if the worker just booted, because it probably did.

### Blocking webRequest became a rules file

The famous one. You can no longer intercept a request in JavaScript and decide what to do with it. You declare rules up front and the browser enforces them. For most extensions this is fine. For content blockers it's a genuine capability cut, and the limits are real numbers you have to design around: Chrome guarantees [30,000 rules across enabled static rulesets, up to 100 static rulesets with 50 enabled at once, 30,000 dynamic rules, and 5,000 session rules](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest), with regex rules capped at 1,000 per type.

If your extension blocked, redirected, or rewrote headers with a bit of clever logic, that logic now has to be expressible as data. Some of it will be. Some of it won't, and you'll ship a slightly dumber feature and be honest about it in your changelog.

### Remote code is over

No more loading a script from your CDN and evaluating it. Everything executable ships in the package and goes through review. I'll defend this one loudly: remote code was the single biggest reason a "trusted" extension could turn hostile overnight after an acquisition. It's also why [vetting an extension used to be so hard](/blog/how-to-vet-a-browser-extension/), because what you audited on Monday wasn't necessarily what ran on Friday.

---

## What quietly got better

The MV3 discourse was so loud in 2022 that most people missed the platform catching up.

- **Offscreen documents** gave back DOM access for the things service workers can't do, like clipboard work, audio, and parsing HTML.
- **The User Scripts API** landed properly, which is the sanctioned answer for the userscript-manager use case that MV3 originally torched.
- **Service worker lifetimes got smarter.** WebSocket messages, native messaging, long-lived ports, and messages from offscreen documents all reset the idle timer now. That wasn't true at launch.
- **The declarativeNetRequest ceilings went up** repeatedly, from painfully tight to merely annoying.

None of this makes MV3 more powerful than MV2. It does make it workable, which is a different and lower bar that Google took about four years to clear.

---

## Firefox went the other way

Worth knowing before you delete code you might still need. Mozilla supports MV3 but says it will [keep supporting both blocking webRequest and declarativeNetRequest, and is keeping Manifest V2 alongside V3](https://blog.mozilla.org/en/firefox/firefox-manifest-v3-adblockers/). Firefox also still uses event pages rather than forcing service workers.

Practically, that means a single codebase can target both if you keep the blocking path behind a capability check instead of ripping it out. We do exactly that. It costs a little branching and buys us a Firefox build that's genuinely better than the Chrome one, which is a sentence I never expected to type.

---

## How to migrate without losing users

The technical migration is the easy half. The half that costs you installs is the release.

### Do not enlarge your permissions on the way through

The lazy MV3 port swaps `webRequest` for `host_permissions: ["<all_urls>"]` and calls it done. Chrome will show your existing users a scary "read and change all your data" prompt, your extension gets disabled until they accept, and a chunk of them never do. Ask for the narrowest host pattern that works, and use `optional_host_permissions` for anything you can request on demand.

### Ship the rewrite as its own release

Don't bundle a new feature with the MV3 port. When installs dip or a review says "broken since the update," you want exactly one variable to look at. Bump the version, change nothing else, watch for a week.

### Have your rollback ready before you press publish

MV3 bugs are sneaky because they're timing-dependent, and they surface on real users' machines and not on yours. Know how to [roll a published extension back to a previous version](/blog/how-to-rollback-chrome-extension-version/) before you need to, not at 11pm on a Friday.

### Rewrite the listing, not just the manifest

If a feature genuinely got weaker, say so in the description and the changelog. Users forgive a limitation the browser imposed. They do not forgive discovering it themselves after a silent update. While you're in there, our guide to [a store listing that passes review the first time](/blog/chrome-web-store-listing-that-passes-review/) will save you a rejection round on a submission you can't afford to have stuck in the queue in August.

### Test the cold start, not the warm one

Load the unpacked extension, open the service worker in DevTools, click "terminate," then use your extension. That's the state your users are in most of the time. If it only works when you've just clicked the toolbar icon, it doesn't work.

---

## If you're a user, not a developer

You'll notice this in September, not in August. An extension you haven't opened in a while will quietly stop doing its job, and there'll be nothing in the store when you go looking. Two things worth doing now: check your extensions page for anything that hasn't been updated since 2024, and if a favourite has gone silent, check whether the developer shipped an MV3 build under a new listing.

And the broader point I keep making. This whole mess is a symptom of stores that were never designed for a decade-long platform migration, which is part of [why I think every extension store needs higher standards](/blog/browser-extension-stores-need-higher-standards/) and better communication with the people who build for them. Four years of shifting deadlines is not a transition plan, it's a war of attrition that small developers lose.

We got everything across, service workers, rulesets, listings and all. If you're mid-migration and stuck on a worker that keeps dying twenty seconds into the job, I've been there, and I'm at [hello@coffeeandfun.com](mailto:hello@coffeeandfun.com).
